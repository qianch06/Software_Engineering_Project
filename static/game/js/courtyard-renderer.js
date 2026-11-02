(function(root){
'use strict';
// Shares the original game's material palette, drawing primitives and glass ball.
class CourtyardRenderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.factor=1;this.quality=1;this.reduced=matchMedia('(prefers-reduced-motion: reduce)');}
 text(value,x,y,color='#a9bdb4',size=20){Renderer.prototype.text.call(this,value,x,y,color,Math.max(size,10/this.factor));}
 box(x,y,w,h,fill,stroke='#80998a',lw=2){this.path([{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}],fill,stroke,lw);}
 cargo(x,y){this.box(x-14,y-14,28,28,'#887b5a','#dfce9b');this.line(x-10,y-10,x+10,y+10,'#dfce9b88',2);this.line(x+10,y-10,x-10,y+10,'#dfce9b88',2);}
 gatePoint(e){const a=e.path[0],b=e.path[1],d=Math.hypot(b.x-a.x,b.y-a.y),u=Math.min(.5,170/d);return{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,vertical:a.x===b.x};}
 draw(view,time){const s=view.session,canvas=this.canvas,c=this.ctx,rect=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.round(rect.width*d),h=Math.round(rect.height*d);if(!w||!h)return;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}this.factor=rect.width/1920;c.setTransform(w/1920,0,0,h/1000,0,0);c.clearRect(0,0,1920,1000);
 this.background(time);this.box(45,960,1830,30,'#1a302b','#496357');for(let x=65;x<1870;x+=80)this.line(x,963,x+20,986,'#64796633',2);
 this.text(view.level.scene.title,65,72,'#91ada078',26);if(this.factor>.4)this.text('重力向下 ↓  ·  机械输送 / 停靠后操作',65,108,'#91ada078',18);
 for(const n of s.graph.nodes)for(const side of [-1,1]){const x=n.x+side*102;this.box(x-13,n.y+80,26,Math.max(0,960-n.y-80),'#20392e','#395543',1);for(let y=n.y+100;y<950;y+=90)this.line(x-10,y,x+10,y+22,'#48634b55',2);}
 // Conveyors are solid beds, with rollers and railings. Lifts have dual guide
 // columns, pulleys and a counterweight cable; they never draw a flying edge.
 for(const e of s.graph.edges){const blocked=!!s.reason(e),preview=view.pending&&view.affected(e,view.pending),selected=view.selected===e.id,color=preview?'#f2d391':selected?'#dcebb5':e.phase==='red'?'#cf9388':e.phase==='blue'?'#94bbd4':'#a6bda6';
  for(let j=1;j<e.path.length;j++){const a=e.path[j-1],b=e.path[j];if(a.x===b.x){const top=Math.min(a.y,b.y),bottom=Math.max(a.y,b.y);this.box(a.x-62,top-20,124,bottom-top+64,'#13262a66','#53736e55');for(const dx of [-49,49]){this.line(a.x+dx,top-30,a.x+dx,bottom+39,blocked?'#51665b77':color,4);for(let y=top;y<bottom;y+=60)this.line(a.x+dx-7,y,a.x+dx+7,y,'#738575',3);}this.circle(a.x-49,top-29,14,'#2b4239',color,3);this.circle(a.x+49,top-29,14,'#2b4239',color,3);this.line(a.x-49,top-43,a.x+49,top-43,'#c0ad7d',2);if(this.factor>.4)this.text('升降',a.x+68,(top+bottom)/2,'#94b7aa',20);
  }else{const left=Math.min(a.x,b.x),right=Math.max(a.x,b.x),y=a.y+43;this.box(left,y,right-left,29,blocked?'#1c302b':'#536149',blocked?'#51675b88':color,2);for(let x=left+15;x<right-8;x+=38){this.circle(x,y+14,7,'#13251e',blocked?'#51675b88':color,2);this.line(x-12,y-5,x+12,y-5,blocked?'#485f5077':'#b4b18a',5);}for(let x=left+35;x<right;x+=150){this.line(x,y+30,x+35,y+90,'#41605288',8);this.line(x+35,y+90,x+65,y+30,'#41605288',5);}this.line(left,a.y-27,right,a.y-27,color+'55',2);for(let x=left+20;x<right;x+=85)this.line(x,a.y-27,x,y,color+'55',2);
   if(e.bridge!==null&&e.bridge!==s.state.bridge){const mid=(left+right)/2;this.box(mid-65,y-8,130,39,'#102027','#102027');for(const side of [-1,1]){c.save();c.translate(mid+side*65,y);c.rotate(side*.65);this.box(side<0?0:-65,-8,65,16,'#796e50','#c9b683');this.circle(0,0,8,'#233d36','#c4cfad',3);c.restore();}} 
   if(e.phase){c.save();c.strokeStyle=color;c.lineWidth=2;for(let x=left+12;x<right-10;x+=28){if(e.phase==='red')this.line(x,y+3,x+12,y+24,color,2);else this.circle(x,y+13,2,color);}c.restore();}
  }}
  const gate=this.gatePoint(e),hasGate=e.phase||e.bridge!==null||e.key||e.weight||e.lights||e.p!==null||e.q!==null||e.noCargo;
  if(hasGate){c.save();c.translate(gate.x,gate.y);if(gate.vertical){this.box(-58,-10,116,16,blocked?'#5d756a':'#1b302a',color);if(blocked)for(let x=-45;x<50;x+=20)this.line(x,-8,x+10,4,'#ccb987',3);}else{this.box(-9,-63,18,106,'#4d6964',color);this.box(-36,-70,72,12,'#29443d',color);if(blocked)this.box(-27,-54,54,92,'#4d6964cc',color);else this.line(-27,-54,27,-54,color,4);}this.circle(0,gate.vertical?-30:-84,7,blocked?'#a47d6b':'#bde2bb');c.restore();
   const label=e.lights?'三灯锁':e.weight?'压台 '+e.weight:e.key?'钥纹锁':e.bridge!==null?'联动桥 '+e.bridge:e.phase==='red'?'红相':e.phase==='blue'?'蓝相':e.p!==null?'p 亮时开启':'q 灭时开启';if(this.factor>.4||selected||preview)this.text(label,gate.x+25,gate.y-52,color,21);
   if(e.noCargo){this.box(gate.x+25,gate.y-32,31,26,'#23372f','#b7a47a');this.line(gate.x+27,gate.y-30,gate.x+54,gate.y-8,'#dbb190',2);}
  }
  if(e.oneWay){const a=e.path[0],b=e.path[1],x=(a.x+b.x)/2,y=(a.y+b.y)/2;c.save();c.translate(x,y);c.rotate(Math.atan2(b.y-a.y,b.x-a.x));this.path([{x:-12,y:-8},{x:8,y:0},{x:-12,y:8}],null,color,4);c.restore();}
 }
 // Pressure plates signal their own interlocked doors, as in the earlier chapters.
 for(const e of s.graph.edges.filter(e=>e.weight)){const n=s.graph.nodes.find(n=>n.id===e.weight),p=this.gatePoint(e),color=s.state.weight===n.id?'#bde2bb':'#81966d66',y=Math.min(n.y,p.y)-100;c.save();c.setLineDash([6,9]);this.line(n.x-102,n.y+35,n.x-102,y,color,2);this.line(n.x-102,y,p.x,y,color,2);this.line(p.x,y,p.x,p.y-65,color,2);c.restore();}
 // Stone/wood docking islands are independently supported and survive phase changes.
 for(const n of s.graph.nodes){const current=n.id===s.state.node,pressure=s.graph.edges.some(e=>e.weight===n.id);for(const side of [-1,1]){const x=n.x+side*102;this.box(x-36,n.y+44,72,36,'#36524b','#80998a');this.line(x-36,n.y+44,x+36,n.y+44,'#b4c8a8',4);}if(pressure){this.box(n.x-138,n.y+37,72,7,s.state.weight===n.id?'#d6c18a':'#796e50','#c9b683');if(this.factor>.4)this.text('压台 '+n.id,n.x-138,n.y+116,'#dfce9b',21);}
  if(n.id===s.graph.keyNode){this.glow(n.x+96,n.y-36,70,s.state.key?'#dfc38230':'#dfc38210');this.path([{x:n.x+96,y:n.y-60},{x:n.x+112,y:n.y-36},{x:n.x+96,y:n.y-12},{x:n.x+80,y:n.y-36}],s.state.key?'#dfc382':'#dfc38222','#dfc382',3);}
  if(s.graph.phaseStations.includes(n.id)){this.box(n.x-124,n.y-40,44,78,'#29443d','#a5d4b5');this.circle(n.x-102,n.y-15,16,'#cb8f85','#efd1aa');this.circle(n.x-102,n.y+16,12,'#8bb2cc');}
  if(s.graph.bridgeStations.includes(n.id)){const x=n.x+102,y=n.y+7;this.circle(x,y,24,'#29445d','#8cc6e2',4);for(let i=0;i<8;i++){const a=i*Math.PI/4;this.line(x+Math.cos(a)*17,y+Math.sin(a)*17,x+Math.cos(a)*30,y+Math.sin(a)*30,'#8cc6e2',5);}const angle=s.state.bridge?-.7:.7;this.line(x,y,x+Math.cos(angle)*35,y+Math.sin(angle)*35,'#e2cd91',5);this.text(String(s.state.bridge),x-6,y-38,'#e2cd91',23);}
  const button=s.graph.buttons[n.id];if(button){this.box(n.x+74,n.y-20,56,64,'#394b40','#b4c8a8');this.box(n.x+81,n.y-29,42,12,'#b6c49c','#dde2bb');this.text(button.name,n.x+95,n.y+13,'#f0e6c8',25);this.text(['p','q','r'].filter((_,i)=>button.mask&(4>>i)).join(' + '),n.x+75,n.y-48,'#d3d8a9',21);}
  if(n.id==='E'){this.glow(n.x,n.y,95,'#a5d4b522');this.circle(n.x,n.y,49,null,'#a5d4b5',4);this.circle(n.x,n.y,36,'#a5d4b510','#a5d4b544',2);}
  if(s.state.weight===n.id){this.cargo(n.x-102,n.y+23);this.text('配重',n.x-126,n.y-4,'#dfce9b',20);}
  c.textAlign='center';this.text(n.name,n.x,n.y+92,current?'#f3d490':'#bdd1c7',24);c.textAlign='left';this.text(n.id,n.x+145,n.y+61,'#91ada088',17);
 }
 if(Object.keys(s.graph.buttons).length){const e=s.graph.nodes.find(n=>n.id==='E');for(let i=0;i<3;i++){const x=e.x-55+i*55,y=e.y-135,on=!!(s.state.lights&(4>>i));this.line(x,y+17,x,e.y-52,'#6f8661',2);this.box(x-22,y-24,44,50,'#273a30','#91a879');this.circle(x,y,13,on?'#e1d284':'#1b2821','#b7bb87',2);this.text(['p','q','r'][i],x-7,y-36,'#c6d3ac',22);}this.text('目标：灭 · 灭 · 亮',e.x-90,e.y-200,'#c6d3ac',22);}
 const t=s.travel,n=s.graph.nodes.find(n=>n.id===s.state.node);if(t){for(const body of [t.tray,t.left,t.right])this.path(body.vertices,'#796e50','#c9b683',2);this.glassBall({...t.ball.position,r:18,angle:t.ball.angle},'#ffdd91',true);if(t.cargo)this.path(t.cargo.vertices,'#887b5a','#dfce9b',2);}else{this.box(n.x-56,n.y+22,112,16,'#796e50','#c9b683');this.box(n.x-62,n.y-18,8,44,'#796e50','#c9b683');this.box(n.x+54,n.y-18,8,44,'#796e50','#c9b683');this.glassBall({x:n.x-12,y:n.y,r:18,angle:0},'#ffdd91',true);if(s.state.weight==='carry')this.cargo(n.x+31,n.y+3);}
 }
}
Object.setPrototypeOf(CourtyardRenderer.prototype,Renderer.prototype);root.CourtyardRenderer=CourtyardRenderer;
})(window);
