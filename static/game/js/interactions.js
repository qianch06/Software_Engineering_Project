(function(root){
  'use strict';

  class InteractionFX{
    constructor(app){
      this.app=app;
      this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
      this.origin={x:innerWidth/2,y:innerHeight/2};
      this.observed=new WeakSet();
      this.iris=document.createElement('div');
      this.iris.id='page-transition';
      this.iris.setAttribute('aria-hidden','true');
      app.appendChild(this.iris);
      app.addEventListener('pointerdown',event=>{
        this.origin={x:event.clientX,y:event.clientY};
        const button=event.target.closest('button');
        if(!button||button.disabled||this.reduced.matches)return;
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
      update();
      if(this.reduced.matches)return;
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
