(function(root){
  const colors={white:'#ffdd91',red:'#f18d88',blue:'#91bde6',yellow:'#f4d17b'};
  class Renderer {
    constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.fx=[];this.resize();window.addEventListener('resize',()=>this.resize());}
    resize(){const d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(innerWidth*d);this.canvas.height=Math.round(innerHeight*d);this.dpr=d;this.factor=Math.min(innerWidth/1920,innerHeight/1080);this.ox=(innerWidth-1920*this.factor)/2;this.oy=(innerHeight-1080*this.factor)/2;}
    point(x,y){return {x:(x-this.ox)/this.factor,y:(y-this.oy)/this.factor};}
    begin(){const c=this.ctx;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.canvas.width,this.canvas.height);c.setTransform(this.dpr*this.factor,0,0,this.dpr*this.factor,this.dpr*this.ox,this.dpr*this.oy);}
    path(points,fill,stroke,width=1){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
    line(x,y,x2,y2,color,width=1){const c=this.ctx;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
    circle(x,y,r,color,stroke,width=1){const c=this.ctx;c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(color){c.fillStyle=color;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
    text(s,x,y,color='#a9bdb4',size=20){const c=this.ctx;c.font=`${size}px 'Segoe UI','Microsoft YaHei',sans-serif`;c.fillStyle=color;c.fillText(s,x,y);}
    glow(x,y,r,color){const c=this.ctx;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');this.circle(x,y,r,g);}
    background(time){const c=this.ctx;for(let x=80;x<1900;x+=100)for(let y=170;y<950;y+=100)this.circle(x,y,1,'#62bfff16');this.path([{x:0,y:970},{x:260,y:880},{x:520,y:960},{x:920,y:850},{x:1270,y:940},{x:1620,y:830},{x:1920,y:940},{x:1920,y:1080},{x:0,y:1080}],'#030a1655');for(let i=0;i<22;i++){const x=(i*397%1900)+10,y=200+(i*139+time*0.005)%650;this.circle(x,y,1.5,'#8fbfff38');}}
    menu(time){this.begin();this.background(time);const c=this.ctx,cx=1370,cy=500;this.glow(cx,cy,540,'#397dcb16');c.save();c.strokeStyle='#62bfff22';c.lineWidth=1;for(const r of [270,300,420]){c.beginPath();c.arc(cx,cy,r,-Math.PI*.95,Math.PI*.83);c.stroke();}this.line(cx-500,cy,cx+500,cy,'#62bfff12');this.line(cx,90,cx,950,'#62bfff12');for(let i=0;i<36;i++){const a=i*Math.PI/18;this.line(cx+Math.cos(a)*420,cy+Math.sin(a)*420,cx+Math.cos(a)*427,cy+Math.sin(a)*427,'#72cfff40');}for(let i=0;i<7;i++){const y=690+i*45,w=330+i*95;this.line(cx-w,y,cx+w,y,'#62bfff12');}this.line(cx-330,690,cx-900,1080,'#62bfff12');this.line(cx+330,690,cx+900,1080,'#62bfff12');this.path([{x:1040,y:850},{x:1650,y:850},{x:1740,y:900},{x:960,y:900}],'#0b1c30aa','#62bfff28',2);this.text('重力核心 · 运行稳定',cx-90,cy+385,'#76a9ca66',13);c.save();c.translate(cx,cy);c.rotate(time*.00008);for(const r of [180,230]){c.setLineDash([22,18]);this.circle(0,0,r,null,'#62e6ff24',2);}c.restore();c.restore();}
    burst(x,y,color,count=28){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,v=1+Math.random()*5;this.fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,color});}this.fx=this.fx.slice(-200);}
    fluid(z,time){
      const c=this.ctx,water=z.type==='water',color=water?'#83c9df':'#c7b1e8',left=z.x-z.w/2,top=z.y-z.h/2;
      c.save();c.fillStyle=water?'#558eab22':'#a793c615';c.fillRect(left,top,z.w,z.h);c.strokeStyle=color+'55';c.setLineDash(water?[]:[6,10]);c.strokeRect(left,top,z.w,z.h);c.setLineDash([]);
      if(water){c.beginPath();for(let x=0;x<=z.w;x+=8){const y=top+Math.sin(x*.035+time*.002)*3;x?c.lineTo(left+x,y):c.moveTo(left+x,y);}c.strokeStyle=color;c.lineWidth=2;c.stroke();}
      const direction=z.force||{x:0,y:0},length=Math.hypot(direction.x,direction.y)||1,dx=direction.x/length,dy=direction.y/length;
      for(let row=0;row<3;row++)for(let col=0;col<5;col++){const x=left+25+(col+.3)*(z.w-50)/5,y=top+35+(row+.5)*(z.h-60)/3,shift=Math.sin(time*.002+row+col)*8,ax=x+dx*shift,ay=y+dy*shift,bx=ax+dx*30,by=ay+dy*30;this.line(ax,ay,bx,by,color+'88',2);this.line(bx,by,bx-dx*9-dy*5,by-dy*9+dx*5,color+'88',2);this.line(bx,by,bx-dx*9+dy*5,by-dy*9-dx*5,color+'88',2);}
      this.text(z.label||(water?'水面 · 浮力':'气流'),left+8,top-16,color,Math.max(18,10/this.factor));c.restore();
    }
    glassBall(ball,color){
      const c=this.ctx,r=ball.r;if(this.quality!==2)this.glow(ball.x,ball.y,r*2.4,color+'16');
      c.save();c.translate(ball.x,ball.y);
      const body=c.createRadialGradient(-r*.28,-r*.34,r*.04,0,0,r);
      body.addColorStop(0,'#fff8def2');body.addColorStop(.22,color+'f2');body.addColorStop(.58,color+'c8');body.addColorStop(.84,'#f0bc6755');body.addColorStop(1,color+'e8');
      this.circle(0,0,r,body,'#fff0c4d8',1.4);
      c.save();c.rotate(ball.angle*.3);c.beginPath();c.arc(0,0,r*.76,.15,Math.PI*1.28);c.strokeStyle=color+'70';c.lineWidth=Math.max(1,r*.05);c.stroke();c.restore();
      c.save();c.translate(r*.12,r*.4);c.scale(1,.3);this.circle(0,0,r*.48,'#fff0b82e');c.restore();
      c.beginPath();c.arc(0,0,r*.91,Math.PI*.12,Math.PI*.72);c.strokeStyle='#f3c67670';c.lineWidth=Math.max(1,r*.04);c.stroke();
      c.beginPath();c.arc(0,0,r*.92,Math.PI*1.08,Math.PI*1.62);c.strokeStyle='#fffbe6d0';c.lineWidth=Math.max(1,r*.055);c.stroke();
      c.save();c.translate(-r*.32,-r*.4);c.rotate(-.55);c.scale(1,.42);this.circle(0,0,r*.3,'#fffbe6a0');c.restore();
      this.circle(-r*.45,-r*.52,Math.max(1.5,r*.075),'#ffffffee');
      c.restore();
    }
    game(g,time){this.begin();this.background(time);const c=this.ctx,l=g.runtime.level;
      this.line(80,950,1840,950,'#abcbb815');
      if(g.state==='preparing'){
        const zone=(z,color,label)=>{c.save();c.fillStyle=color+'09';c.strokeStyle=color+'60';c.setLineDash([8,10]);c.fillRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);c.strokeRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);c.restore();this.text(label,z.x-z.w/2+8,z.y-z.h/2-12,color+'bb',16);};
        for(const z of l.buildAreas)zone(z,'#a5d4b5','建造区');
        for(const [id,zones] of Object.entries(l.placementZones))for(const z of zones)zone(z,'#dfc382',l.lesson?.kind==='weight'?'':l.goal.type==='stable'?'方块摆放区':id==='float'?'浮块装载区':'配重摆放区');
      }
      for(const z of l.deathZones||[]){c.fillStyle='#ff777722';c.fillRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);for(let x=z.x-z.w/2;x<z.x+z.w/2;x+=30)this.path([{x,y:z.y+15},{x:x+15,y:z.y-15},{x:x+30,y:z.y+15}],'#ef919166');}
      if(l.goal?.type==='stable'){const z=l.goal.zone;c.save();c.setLineDash([10,12]);c.strokeStyle='#a5d4b588';c.strokeRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);c.restore();this.text('堆叠区 · '+(g.runtime.stable/1000).toFixed(1)+'s',z.x-100,z.y-z.h/2-25,'#a5d4b5',20);}
      for(const m of l.mechanisms.filter(m=>m.type==='pulley')){const a=g.physics.get(m.bodyId),b=g.physics.get(m.otherBodyId),y=m.anchor.y;this.line(a.x,a.y-12,a.x,y,'#d1bb8b',3);this.line(a.x,y,b.x,y,'#d1bb8b',3);this.line(b.x,y,b.x,b.y-12,'#d1bb8b',3);this.circle(a.x,y,20,'#203b31','#d1bb8b',3);this.circle(b.x,y,20,'#203b31','#d1bb8b',3);}
      if(l.bridgeGuide){const b=l.bridgeGuide;c.save();c.setLineDash([12,12]);this.line(b.x-b.w/2,b.y,b.x+b.w/2,b.y,'#d1bb8b66',4);c.restore();this.text('搭 桥 区 域',b.x-70,b.y+65,'#d1bb8b66',17);}
      for(const z of l.sensors){if(z.type==='air'||z.type==='water'&&z.buoyancy!=null){this.fluid(z,time);continue;}if(z.type==='laser'){const color=colors[z.dye||z.requiresColor]||'#a5d4b5',active=!!g.runtime.zones[z.id];this.glow(z.x,z.y,140,color+(active?'25':'10'));this.line(z.x,z.y-z.h/2,z.x,z.y+z.h/2,color+'13',25);this.line(z.x,z.y-z.h/2,z.x,z.y+z.h/2,color,3);for(const s of [-1,1])this.circle(z.x,z.y+s*z.h/2,10,active?color:'#244139',color,2);this.text(z.label||(z.dye?({red:'红光',yellow:'黄光',blue:'蓝光'}[z.dye]):'激光开关'),z.x-40,z.y-z.h/2-24,color,17);if(z.requiresColor)this.text('◆ '+({white:'白',red:'红',yellow:'黄',blue:'蓝'}[z.requiresColor])+'球触发',z.x-50,z.y+z.h/2+34,color,16);}else{c.fillStyle='#d4e9e711';c.fillRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);for(let i=0;i<5;i++){const xx=z.x-z.w/2+i*z.w/5;this.line(xx,z.y-z.h/2,xx,z.y+z.h/2,'#d4e9e722');}this.text(z.label||({wash:'洗色区',water:z.force?.x<0?'水流 ←':'水流 →',gravityField:'升流井 ↑',pressure:'压力开关'}[z.type]||'传感区'),z.x-55,z.type==='pressure'?z.y+z.h/2+32:z.y-z.h/2-20,z.type==='gravityField'?'#c1abd9':'#b2d8e2',Math.max(18,10/this.factor));if(z.force){for(let i=0;i<5;i++){const xx=z.x-z.w/2+40+i*(z.w-60)/5,yy=z.y+Math.sin(time*.002+i)*20;this.line(xx,yy,xx+z.force.x*35,yy+z.force.y*35,z.type==='gravityField'?'#c1abd999':'#91bde699',4);}}}}
      if(l.goal?.type!=='stable'){const collector=l.collector,cc=collector.acceptColor?colors[collector.acceptColor]:'#a5d4b5';this.glow(collector.x,collector.y,140,cc+'18');this.circle(collector.x,collector.y,collector.r,null,cc+'40',2);c.save();c.translate(collector.x,collector.y);c.rotate(time*.0004);c.setLineDash([collector.r*1.4,12]);this.circle(0,0,collector.r-9,null,cc,4);c.restore();this.circle(collector.x,collector.y,collector.r-22,cc+'08',cc+'55');this.text(collector.acceptColor?({white:'白色',red:'红色',yellow:'黄色',blue:'蓝色'}[collector.acceptColor]+'收集器'):'收 集 器',collector.x-48,collector.y+collector.r+38,cc,17);
      }
      if(l.shard&&!g.storage.data.shards[l.id]){const s=l.shard;this.glow(s.x,s.y,70,'#dfc38218');c.save();c.translate(s.x,s.y+Math.sin(time*.002)*7);this.path([{x:0,y:-20},{x:13,y:0},{x:0,y:20},{x:-13,y:0}],'#dfc38222','#dfc382',2);c.restore();}
      for(const b of g.physics.all()){
        if(b.id==='ceiling')continue;
        if(b.category==='energyBall'){this.glassBall(b,colors[g.ballColor]);if(l.resizable){c.save();c.setLineDash([5,6]);this.circle(b.x,b.y,b.r+12,null,'#dddac277',1);c.restore();}continue;}
        let fill='#36524b',stroke='#80998a';if(b.category==='taskCube'){fill='#887b5a';stroke='#dfce9b';}if(b.category==='pulley'){fill='#6b8075';stroke='#c8d6b4';}if(b.id==='float')this.text('浮块',b.x-22,b.y+6,'#dfce9b',Math.max(18,9/this.factor));if(b.category==='wood'){fill='#796e50';stroke='#c9b683';}if(b.category==='line'){fill='#a5d4b5';stroke='#c5e4c7';}if(b.category==='door'){fill='#4d6964';stroke='#b5c8ab';}if(b.category==='lever'){fill='#758472';stroke='#c4cfad';}if(b.category==='spring'){fill='#786a8d';stroke='#c1abd9';}
        this.path(b.vertices,fill,stroke,2);if(b.category==='terrain'&&b.id!=='ceiling'&&b.id!=='left'&&b.id!=='right'){this.line(b.vertices[0].x,b.vertices[0].y,b.vertices[1].x,b.vertices[1].y,'#b4c8a84d',3);}
        if(b.id==='float')this.text('浮块',b.x-22,b.y+6,'#dfce9b',Math.max(18,9/this.factor));if(b.category==='wood'){this.line(b.x-80,b.y,b.x+80,b.y,'#c9b68355',2);}
        if(b.category==='spring'){for(let i=0;i<5;i++)this.line(b.x-80+i*38,b.y+20,b.x-62+i*38,b.y+40,'#c1abd980',3);}
      }
      for(const m of l.mechanisms){if(m.type==='lever'){const a=m.anchor;this.path([{x:a.x,y:a.y+15},{x:a.x-32,y:a.y+85},{x:a.x+32,y:a.y+85}],'#233d36','#82977b',2);this.circle(a.x,a.y,9,'#c1ceaa','#203b31',3);}if(m.type==='door')this.circle(m.anchor.x,m.anchor.y,8,'#b8c8a6');}
      // Show cause and effect before release as well as the brief travelling signal.
      for(const link of l.links){const source=l.sensors.find(z=>z.id===link.source),door=l.mechanisms.find(m=>m.type==='door'&&m.bodyId===link.target);if(!source||!['laser','pressure'].includes(source.type)||!door)continue;const complete=!door.requireSequence||g.runtime.sequence.complete&&g.runtime.colors.complete,active=complete&&g.runtime.links.active(link.target),y=Math.min(source.y-source.h/2-55,door.anchor.y+55);c.save();c.setLineDash(active?[]:[7,10]);const color=active?'#bde2bb':'#a5d4b560';this.line(source.x,source.y-source.h/2,source.x,y,color,2);this.line(source.x,y,door.anchor.x,y,color,2);this.line(door.anchor.x,y,door.anchor.x,door.anchor.y,color,2);c.restore();const live=g.runtime.links.links.find(item=>item.source===link.source&&item.target===link.target),remaining=active&&link.semantic==='pulse'?Math.max(0,(live.until-g.runtime.time)/1000).toFixed(1):null;this.text(!complete?'按颜色顺序开锁 → 门才回应':active?(remaining?'门开启 · 剩余 '+remaining+' 秒':'已响应 · 门开启'):link.semantic==='pulse'?(live.fired||live.until?'时限已到 · 返回准备重试':'触发后开门 '+link.durationMs/1000+' 秒'):source.type==='pressure'?'浮块到位 → 水闸开启':'光束传信 → 门响应',(source.x+door.anchor.x)/2-90,y-14,active?'#bde2bb':'#a5d4b5',18);}
      for(const m of l.mechanisms.filter(m=>m.type==='spring')){const b=g.physics.get(m.bodyId);this.text('弹簧 · 向上托送',b.x-85,b.y+82,'#c1abd9',20);if(g.state==='preparing'&&m.direction){const x=b.x+m.direction.x*95,y=b.y+m.direction.y*95;this.line(b.x,b.y-30,x,y,'#c1abd999',3);this.circle(x,y,5,'#c1abd9');}}
      for(const label of l.annotations||[])this.text(label.text,label.x,label.y,'#bdd1c7',Math.max(18,10/this.factor));
      for(const f of g.links){const p=Math.min(1,(time-f.time)/800);this.line(f.x,f.y,f.tx,f.ty,'#a5d4b548',2);const x=f.x+(f.tx-f.x)*p,y=f.y+(f.ty-f.y)*p;this.glow(x,y,55,'#a5d4b53d');this.circle(x,y,6,'#d9f7d9');}
      if(g.state==='preparing'&&l.lesson&&!g.session.lessonProgress().ready){const t=l.lesson,pulse=.7+Math.sin(time*.004)*.2;c.save();c.globalAlpha=pulse;c.setLineDash([10,9]);c.strokeStyle='#f3d490';c.lineWidth=3;
        if(t.kind==='board'){c.save();c.translate(t.target.x,t.target.y);c.rotate(t.angle);c.strokeRect(-l.boardSpec.w/2,-l.boardSpec.h/2,l.boardSpec.w,l.boardSpec.h);c.restore();this.text('把木板放到这里 · 自动对齐',t.target.x-130,t.target.y-45,'#f3d490',20);}
        if(t.kind==='weight'){const b=g.physics.get(t.sourceId),d=t.target;this.circle(b.x,b.y,52,null,'#f3d490',3);c.strokeRect(d.x-38,d.y-38,76,76);this.line(b.x+48,b.y-30,d.x-40,d.y-50,'#f3d490',3);this.text('拖动配重',b.x-48,b.y-70,'#f3d490',Math.max(22,12/this.factor));this.text('放到这里 · 自动吸附',d.x-90,d.y-65,'#f3d490',Math.max(20,12/this.factor));}
        if(t.kind==='line'){c.beginPath();t.path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();for(const p of t.path)this.circle(p.x,p.y,13,'#f3d49033','#f3d490',2);this.text('从左边圆点画到右边圆点',t.path[0].x,t.path[0].y-45,'#f3d490',20);}c.restore();}
      if(g.preview){c.save();c.globalAlpha=.65;const color=g.previewValid?'#bde2bb':'#ef9191';if(g.dragCube){const b=g.physics.get(g.dragCube),p=g.placementPreview||g.preview;c.fillStyle=color;c.fillRect(p.x-b.w/2,p.y-b.h/2,b.w,b.h);}else if(g.tool==='board'){const b=g.session.boardSpecs(g.preview,g.boardAngle)[0];c.translate(b.x,b.y);c.rotate(b.angle);c.fillStyle=color;c.fillRect(-b.w/2,-b.h/2,b.w,b.h);}else if(g.stroke?.length){c.beginPath();g.stroke.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=color;c.lineWidth=12;c.lineCap='round';c.stroke();}c.restore();}
      for(const f of this.fx){if(g.state==='playing'){f.x+=f.vx;f.y+=f.vy;f.life-=.02;}this.circle(f.x,f.y,3,null,f.color+Math.round(Math.max(0,f.life)*255).toString(16).padStart(2,'0'),3);}this.fx=this.fx.filter(f=>f.life>0);
    }
  }
  root.Renderer=Renderer;
})(window);
