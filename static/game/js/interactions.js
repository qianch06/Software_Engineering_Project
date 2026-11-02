(function(root){
  'use strict';

  class InteractionFX{
    constructor(app){
      this.app=app;
      this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
      this.hover=matchMedia('(hover: hover) and (pointer: fine)');
      this.origin={x:innerWidth/2,y:innerHeight/2};
      this.observed=new WeakSet();
      this.tilted=new WeakSet();
      this.drawers=new WeakSet();
      this.iris=document.createElement('div');
      this.iris.id='page-transition';
      this.iris.setAttribute('aria-hidden','true');
      app.appendChild(this.iris);
      app.addEventListener('pointerdown',event=>{
        this.origin={x:event.clientX,y:event.clientY};
        const button=event.target.closest('button');
        this.pressedButton=button;
        if(!button||button.disabled||button.classList.contains('detail-handle')||this.reduced.matches)return;
        const rect=button.getBoundingClientRect(),ripple=document.createElement('i');
        ripple.className='button-ripple';
        ripple.style.left=`${event.clientX-rect.left}px`;
        ripple.style.top=`${event.clientY-rect.top}px`;
        button.appendChild(ripple);
        setTimeout(()=>ripple.remove(),520);
      },{passive:true});
      app.addEventListener('click',event=>{
        const button=event.target.closest('button');
        if(!button||button.disabled)return;
        const state=button.classList.contains('locked')?'is-denied':'is-confirmed';
        button.classList.remove('is-denied','is-confirmed');
        requestAnimationFrame(()=>button.classList.add(state));
        setTimeout(()=>button.classList.remove(state),420);
      });
      this.resizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{
        for(const entry of entries)this.drawConnections(entry.target);
      }):null;
    }

    transition(update){
      const source=this.pressedButton?.isConnected?this.pressedButton:document.activeElement;
      const fluid=source?.classList?.contains('fluid')?source.getBoundingClientRect():null;
      this.pressedButton=null;
      update();
      if(this.reduced.matches)return;
      if(fluid){this.fluidTransition(fluid);return;}
      const x=this.origin.x,y=this.origin.y;
      const radius=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y))+40;
      this.iris.style.setProperty('--iris-x',`${x}px`);
      this.iris.style.setProperty('--iris-y',`${y}px`);
      this.iris.style.setProperty('--iris-end',`${radius}px`);
      this.iris.classList.remove('active');
      void this.iris.offsetWidth;
      this.iris.classList.add('active');
      clearTimeout(this.transitionTimer);
      this.transitionTimer=setTimeout(()=>this.iris.classList.remove('active'),560);
    }

    fluidTransition(rect){
      const morph=document.createElement('div');morph.className='fluid-morph';
      Object.assign(morph.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});
      this.app.appendChild(morph);
      const animation=morph.animate([
        {left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,borderRadius:'999px',opacity:.82},
        {left:'-4vw',top:'-6vh',width:'108vw',height:'112vh',borderRadius:'32px',opacity:.72,offset:.62},
        {left:'-4vw',top:'-6vh',width:'108vw',height:'112vh',borderRadius:'32px',opacity:0}
      ],{duration:480,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'});
      animation.onfinish=()=>morph.remove();
    }

    enhanceLevels(list,scroller){
      this.levelList=list;
      this.enableInertia(scroller);
      const sections=[...list.querySelectorAll('.level-sector')];
      for(const section of sections){
        const header=section.querySelector('.level-group-title');
        const shell=section.querySelector('.level-grid-shell');
        const grid=section.querySelector('.level-grid');
        if(!header||!shell||!grid)continue;
        const sync=()=>{
          const collapsed=section.classList.contains('collapsed');
          header.setAttribute('aria-expanded',String(!collapsed));
          shell.setAttribute('aria-hidden',String(collapsed));
          shell.inert=collapsed;
        };
        sync();
        header.addEventListener('click',()=>{
          section.classList.toggle('collapsed');
          sync();
          if(!section.classList.contains('collapsed')){
            requestAnimationFrame(()=>this.drawConnections(grid));
            setTimeout(()=>section.scrollIntoView({behavior:this.reduced.matches?'auto':'smooth',block:'nearest'}),160);
          }
        });
        if(this.resizeObserver&&!this.observed.has(grid)){
          this.resizeObserver.observe(grid);
          this.observed.add(grid);
        }
        this.drawConnections(grid);
      }
      for(const card of list.querySelectorAll('.level-card'))this.attachTilt(card);
      this.enableMagneticReadout(list,scroller);
      requestAnimationFrame(()=>this.updateReadout());
    }

    attachTilt(card){
      if(this.tilted.has(card))return;
      this.tilted.add(card);
      card.addEventListener('pointermove',event=>{
        if(this.reduced.matches||(event.pointerType==='mouse'&&!this.hover.matches))return;
        const rect=card.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;
        card.style.transition='transform .12s ease-out';
        card.style.transform=`perspective(850px) rotateX(${(0.5-y)*5}deg) rotateY(${(x-0.5)*6}deg) translateY(-4px)`;
        card.style.setProperty('--shine-x',`${x*100}%`);card.style.setProperty('--shine-y',`${y*100}%`);
      },{passive:true});
      card.addEventListener('pointerleave',()=>{
        card.style.transition='transform .58s cubic-bezier(.2,1.45,.4,1)';
        card.style.transform='';card.style.setProperty('--shine-x','50%');card.style.setProperty('--shine-y','20%');
      },{passive:true});
    }

    sharedExpand(card,sheet){
      if(this.reduced.matches)return;
      const from=card.getBoundingClientRect(),to=sheet.getBoundingClientRect();
      const clone=card.cloneNode(true);clone.classList.add('shared-clone');clone.style.transform='none';
      clone.querySelectorAll('.button-ripple').forEach(item=>item.remove());
      Object.assign(clone.style,{left:`${from.left}px`,top:`${from.top}px`,width:`${from.width}px`,height:`${from.height}px`});
      this.app.appendChild(clone);sheet.classList.add('shared-arriving');
      const animation=clone.animate([
        {left:`${from.left}px`,top:`${from.top}px`,width:`${from.width}px`,height:`${from.height}px`,borderRadius:'14px',opacity:1},
        {left:`${to.left}px`,top:`${to.top}px`,width:`${to.width}px`,height:`${to.height}px`,borderRadius:'28px',opacity:.15}
      ],{duration:460,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
      sheet.animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:360,delay:100,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
      animation.onfinish=()=>{clone.remove();sheet.classList.remove('shared-arriving');};
    }

    attachDrawer(sheet,onClose){
      if(this.drawers.has(sheet))return;
      this.drawers.add(sheet);
      const handle=sheet.querySelector('.detail-handle');let startY=0,delta=0,dragging=false,moved=false;
      handle.addEventListener('pointerdown',event=>{
        if(this.reduced.matches)return;
        dragging=true;moved=false;startY=event.clientY;delta=0;handle.setPointerCapture(event.pointerId);sheet.classList.add('is-dragging');event.preventDefault();
      });
      handle.addEventListener('pointermove',event=>{
        if(!dragging)return;delta=event.clientY-startY;if(Math.abs(delta)>4)moved=true;
        sheet.style.transform=`translateY(${delta>0?delta:delta*.24}px)`;
      });
      const release=()=>{
        if(!dragging)return;dragging=false;sheet.classList.remove('is-dragging');sheet.style.transform='';
        if(delta>115){onClose();return;}
        if(delta<-45)sheet.classList.add('expanded');else if(delta>45)sheet.classList.remove('expanded');
      };
      handle.addEventListener('pointerup',release);handle.addEventListener('pointercancel',release);
      handle.addEventListener('click',()=>{if(moved){moved=false;return;}sheet.classList.toggle('expanded');});
    }

    enableMagneticReadout(list,scroller){
      this.levelList=list;
      if(this.readoutAttached)return;
      this.readoutAttached=true;
      let scheduled=false;
      scroller.addEventListener('scroll',()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;this.updateReadout();});},{passive:true});
      window.addEventListener('resize',()=>this.updateReadout(),{passive:true});
    }

    updateReadout(){
      if(!this.levelList||!document.querySelector('#select:not(.hidden)'))return;
      const cards=[...this.levelList.querySelectorAll('.level-card')],visible=cards.filter(card=>!card.closest('.collapsed'));
      if(!visible.length)return;
      const scroller=document.getElementById('select'),range=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
      const ratio=range?Math.max(0,Math.min(1,scroller.scrollTop/range)):0;
      const active=visible[Math.round(ratio*(visible.length-1))];
      for(const card of cards)card.classList.toggle('is-magnetic',card===active);
      const index=cards.indexOf(active),label=document.getElementById('active-node'),progress=document.getElementById('readout-progress');
      const text=`节点 ${String(index+1).padStart(2,'0')} · ${active.querySelector('strong').textContent}`;
      if(label.textContent!==text){label.textContent=text;label.classList.remove('readout-change');requestAnimationFrame(()=>label.classList.add('readout-change'));}
      progress.style.transform=`scaleX(${(index+1)/cards.length})`;
    }

    drawConnections(grid){
      if(!grid||grid.closest('.collapsed'))return;
      const cards=[...grid.querySelectorAll('.level-card')];
      let svg=grid.querySelector('.level-connections');
      if(!svg){
        svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.classList.add('level-connections');
        svg.setAttribute('aria-hidden','true');
        grid.prepend(svg);
      }
      const bounds=grid.getBoundingClientRect();
      svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
      const paths=cards.slice(1).map((card,index)=>{
        const from=cards[index].querySelector('.node-marker').getBoundingClientRect();
        const to=card.querySelector('.node-marker').getBoundingClientRect();
        const x1=from.left-bounds.left+from.width/2,y1=from.top-bounds.top+from.height/2;
        const x2=to.left-bounds.left+to.width/2,y2=to.top-bounds.top+to.height/2;
        const bend=Math.max(28,Math.abs(x2-x1)*.42);
        return{d:`M ${x1} ${y1} C ${x1+bend} ${y1}, ${x2-bend} ${y2}, ${x2} ${y2}`,synced:cards[index].classList.contains('completed')&&card.classList.contains('completed')};
      });
      while(svg.children.length>paths.length)svg.lastChild.remove();
      paths.forEach((item,index)=>{
        let path=svg.children[index];
        if(!path){
          path=document.createElementNS('http://www.w3.org/2000/svg','path');
          svg.appendChild(path);
        }
        if(path.getAttribute('d')===item.d)return;
        path.setAttribute('d',item.d);
        path.setAttribute('class',`node-link${item.synced?' is-synced':''}`);
        const length=path.getTotalLength();
        path.style.setProperty('--path-length',length);
      });
    }

    enableInertia(scroller){
      if(this.inertiaAttached)return;
      this.inertiaAttached=true;
      let velocity=0,frame=0,snapTimer;
      const stop=()=>{velocity=0;cancelAnimationFrame(frame);frame=0;};
      scroller.addEventListener('pointerdown',stop,{passive:true});
      scroller.addEventListener('wheel',event=>{
        if(this.reduced.matches||event.ctrlKey||!event.deltaY)return;
        event.preventDefault();
        const unit=event.deltaMode===1?16:event.deltaMode===2?scroller.clientHeight:1;
        velocity=Math.max(-42,Math.min(42,velocity+event.deltaY*unit*.16));
        scroller.classList.add('is-inertial');
        clearTimeout(snapTimer);
        snapTimer=setTimeout(()=>scroller.classList.remove('is-inertial'),150);
        if(frame)return;
        const tick=()=>{
          const before=scroller.scrollTop;
          scroller.scrollTop+=velocity;
          velocity*=.9;
          if(Math.abs(velocity)<.12||scroller.scrollTop===before){stop();return;}
          frame=requestAnimationFrame(tick);
        };
        frame=requestAnimationFrame(tick);
      },{passive:false});
    }
  }

  root.InteractionFX=InteractionFX;
})(window);
