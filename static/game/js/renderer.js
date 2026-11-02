(function(root){
  const colors={white:'#ffdd91',red:'#ff817d',blue:'#72a7ff',yellow:'#ffc873'};
  class Renderer {
    constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.fx=[];this.resize();window.addEventListener('resize',()=>this.resize());}
    resize(){const d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(innerWidth*d);this.canvas.height=Math.round(innerHeight*d);this.dpr=d;this.factor=Math.min(innerWidth/1920,innerHeight/1080);this.ox=(innerWidth-1920*this.factor)/2;this.oy=(innerHeight-1080*this.factor)/2;}
    point(x,y){return {x:(x-this.ox)/this.factor,y:(y-this.oy)/this.factor};}
    begin(){const c=this.ctx;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.canvas.width,this.canvas.height);c.setTransform(this.dpr*this.factor,0,0,this.dpr*this.factor,this.dpr*this.ox,this.dpr*this.oy);}
    path(points,fill,stroke,width=1){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
    line(x,y,x2,y2,color,width=1){const c=this.ctx;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
    circle(x,y,r,color,stroke,width=1){const c=this.ctx;c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(color){c.fillStyle=color;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
    text(s,x,y,color='#91a9c1',size=20){const c=this.ctx;c.font=`${size}px 'Segoe UI','Microsoft YaHei',sans-serif`;c.fillStyle=color;c.fillText(s,x,y);}
    glow(x,y,r,color){const c=this.ctx;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');this.circle(x,y,r,g);}
    background(time){const c=this.ctx;for(let x=80;x<1900;x+=100)for(let y=170;y<950;y+=100)this.circle(x,y,1,'#62bfff16');this.path([{x:0,y:970},{x:260,y:880},{x:520,y:960},{x:920,y:850},{x:1270,y:940},{x:1620,y:830},{x:1920,y:940},{x:1920,y:1080},{x:0,y:1080}],'#030a1655');for(let i=0;i<22;i++){const x=(i*397%1900)+10,y=200+(i*139+time*0.005)%650;this.circle(x,y,1.5,'#8fbfff38');}}
    menu(time){this.begin();this.background(time);const c=this.ctx,cx=1370,cy=500;this.glow(cx,cy,540,'#397dcb16');c.save();c.strokeStyle='#62bfff22';c.lineWidth=1;for(const r of [270,300,420]){c.beginPath();c.arc(cx,cy,r,-Math.PI*.95,Math.PI*.83);c.stroke();}this.line(cx-500,cy,cx+500,cy,'#62bfff12');this.line(cx,90,cx,950,'#62bfff12');for(let i=0;i<36;i++){const a=i*Math.PI/18;this.line(cx+Math.cos(a)*420,cy+Math.sin(a)*420,cx+Math.cos(a)*427,cy+Math.sin(a)*427,'#72cfff40');}for(let i=0;i<7;i++){const y=690+i*45,w=330+i*95;this.line(cx-w,y,cx+w,y,'#62bfff12');}this.line(cx-330,690,cx-900,1080,'#62bfff12');this.line(cx+330,690,cx+900,1080,'#62bfff12');this.path([{x:1040,y:850},{x:1650,y:850},{x:1740,y:900},{x:960,y:900}],'#0b1c30aa','#62bfff28',2);this.text('重力核心 · 运行稳定',cx-90,cy+385,'#76a9ca66',13);c.save();c.translate(cx,cy);c.rotate(time*.00008);for(const r of [180,230]){c.setLineDash([22,18]);this.circle(0,0,r,null,'#62e6ff24',2);}c.restore();c.restore();}
    burst(x,y,color,count=28){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,v=1+Math.random()*5;this.fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,color});}this.fx=this.fx.slice(-200);}
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
    game(g,time){this.begin();this.background(time);const c=this.ctx,l=g.level;
      this.line(80,950,1840,950,'#62bfff20');
      for(const z of l.deathZones||[]){c.fillStyle='#ff777722';c.fillRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);for(let x=z.x-z.w/2;x<z.x+z.w/2;x+=30)this.path([{x,y:z.y+15},{x:x+15,y:z.y-15},{x:x+30,y:z.y+15}],'#ef919166');}
      if(l.goal?.type==='stable'){const z=l.goal.zone;c.save();c.setLineDash([10,12]);c.strokeStyle='#62e6ff88';c.strokeRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);c.restore();this.text('堆叠区 · '+(g.runtime.stable/1000).toFixed(1)+'s',z.x-100,z.y-z.h/2-25,'#62e6ff',20);}
      for(const m of l.mechanisms.filter(m=>m.type==='pulley')){const a=g.physics.get(m.bodyId),b=g.physics.get(m.otherBodyId),y=m.anchor.y;this.line(a.x,a.y-12,a.x,y,'#72c7e8',3);this.line(a.x,y,b.x,y,'#72c7e8',3);this.line(b.x,y,b.x,b.y-12,'#72c7e8',3);this.circle(a.x,y,20,'#10253a','#72c7e8',3);this.circle(b.x,y,20,'#10253a','#72c7e8',3);}
      if(l.bridgeGuide){const b=l.bridgeGuide;c.save();c.setLineDash([12,12]);this.line(b.x-b.w/2,b.y,b.x+b.w/2,b.y,'#72c7e866',4);c.restore();this.text('搭 桥 区 域',b.x-70,b.y+65,'#72c7e866',17);}
      for(const z of l.sensors){if(z.type==='laser'){const color=colors[z.dye]||'#a5d4b5';this.glow(z.x,z.y,140,color+'10');this.line(z.x,z.y-z.h/2,z.x,z.y+z.h/2,color+'13',25);this.line(z.x,z.y-z.h/2,z.x,z.y+z.h/2,color,3);for(const s of [-1,1]){this.circle(z.x,z.y+s*z.h/2,10,'#244139',color,2);}this.text(z.dye?(z.dye==='blue'?'蓝光':'红光'):'激光开关',z.x-35,z.y-z.h/2-24,color,17);}else{c.fillStyle='#d4e9e711';c.fillRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);for(let i=0;i<5;i++){const xx=z.x-z.w/2+i*z.w/5;this.line(xx,z.y-z.h/2,xx,z.y+z.h/2,'#d4e9e722');}this.text({wash:'洗色区',water:'水流 →',gravityField:'局部重力 ↑',pressure:'压力开关'}[z.type]||'传感区',z.x-55,z.y-z.h/2-20,z.type==='gravityField'?'#c1abd9':'#b2d8e2',18);if(z.force){for(let i=0;i<5;i++){const xx=z.x-z.w/2+40+i*(z.w-60)/5,yy=z.y+Math.sin(time*.002+i)*20;this.line(xx,yy,xx+z.force.x*35,yy+z.force.y*35,z.type==='gravityField'?'#c1abd999':'#91bde699',4);}}}}
      if(l.goal?.type!=='stable'){const collector=l.collector,cc=collector.acceptColor?colors[collector.acceptColor]:'#62e6ff';this.glow(collector.x,collector.y,140,cc+'18');this.circle(collector.x,collector.y,collector.r,null,cc+'40',2);c.save();c.translate(collector.x,collector.y);c.rotate(time*.0004);c.setLineDash([collector.r*1.4,12]);this.circle(0,0,collector.r-9,null,cc,4);c.restore();this.circle(collector.x,collector.y,collector.r-22,cc+'08',cc+'55');this.text('收 集 器',collector.x-48,collector.y+collector.r+38,cc,17);
      }
      if(l.shard&&!g.storage.data.shards[l.id]){const s=l.shard;this.glow(s.x,s.y,70,'#ffc87318');c.save();c.translate(s.x,s.y+Math.sin(time*.002)*7);this.path([{x:0,y:-20},{x:13,y:0},{x:0,y:20},{x:-13,y:0}],'#ffc87322','#ffc873',2);c.restore();}
      for(const b of g.physics.all()){
        if(b.id==='ceiling')continue;
        if(b.category==='energyBall'){this.glassBall(b,colors[g.ballColor]);if(l.resizable){c.save();c.setLineDash([5,6]);this.circle(b.x,b.y,b.r+12,null,'#dddac277',1);c.restore();}continue;}
        let fill='#1a344c',stroke='#5885a3';if(b.category==='taskCube'){fill='#4b476d';stroke='#b3a7ff';}if(b.category==='pulley'){fill='#29445d';stroke='#8cc6e2';}if(b.category==='wood'){fill='#24435c';stroke='#72c7e8';}if(b.category==='line'){fill='#62e6ff';stroke='#b8f6ff';}if(b.category==='door'){fill='#203c55';stroke='#79b7d5';}if(b.category==='lever'){fill='#334a67';stroke='#9ab8d4';}if(b.category==='spring'){fill='#49436d';stroke='#aa9bff';}
        this.path(b.vertices,fill,stroke,2);if(b.category==='terrain'&&b.id!=='ceiling'&&b.id!=='left'&&b.id!=='right'){this.line(b.vertices[0].x,b.vertices[0].y,b.vertices[1].x,b.vertices[1].y,'#7ccfff55',3);}
        if(b.category==='wood'){this.line(b.x-80,b.y,b.x+80,b.y,'#72c7e855',2);}
        if(b.category==='spring'){for(let i=0;i<5;i++)this.line(b.x-80+i*38,b.y+20,b.x-62+i*38,b.y+40,'#aa9bff80',3);}
      }
      for(const m of l.mechanisms){if(m.type==='lever'){const a=m.anchor;this.path([{x:a.x,y:a.y+15},{x:a.x-32,y:a.y+85},{x:a.x+32,y:a.y+85}],'#142a40','#648ca9',2);this.circle(a.x,a.y,9,'#8cdcf0','#10253a',3);}if(m.type==='door')this.circle(m.anchor.x,m.anchor.y,8,'#8cdcf0');}
      for(const f of g.links){const p=Math.min(1,(time-f.time)/800);this.line(f.x,f.y,f.tx,f.ty,'#62e6ff48',2);const x=f.x+(f.tx-f.x)*p,y=f.y+(f.ty-f.y)*p;this.glow(x,y,55,'#62e6ff3d');this.circle(x,y,6,'#d9f7ff');}
      if(g.preview){c.save();c.globalAlpha=.55;if(g.tool==='board'){c.translate(g.preview.x,g.preview.y);c.rotate(g.boardAngle);c.fillStyle='#72c7e8';c.fillRect(-170,-12,340,24);}else if(g.stroke?.length){c.beginPath();g.stroke.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle='#8feaff';c.lineWidth=12;c.lineCap='round';c.stroke();}c.restore();}
      for(const f of this.fx){if(g.state==='playing'){f.x+=f.vx;f.y+=f.vy;f.life-=.02;}this.circle(f.x,f.y,3,null,f.color+Math.round(Math.max(0,f.life)*255).toString(16).padStart(2,'0'),3);}this.fx=this.fx.filter(f=>f.life>0);
    }
  }
  root.Renderer=Renderer;
})(window);
