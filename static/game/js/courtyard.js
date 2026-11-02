(function(root){
'use strict';const copy=v=>JSON.parse(JSON.stringify(v));
class CourtyardSession{
 constructor(level,snapshot){this.level=level;this.graph=level.graph;this.state={node:'S',phase:this.graph.phase,bridge:0,key:false,weight:this.graph.weight,lights:0};this.history=[];this.usedHint=false;this.paused=false;if(snapshot&&this.valid(snapshot.state)){this.state=copy(snapshot.state);this.history=(snapshot.history||[]).filter(s=>this.valid(s)).map(copy);this.usedHint=!!snapshot.usedHint;}this.travel=null;}
 valid(s){return s&&this.graph.nodes.some(n=>n.id===s.node)&&['red','blue'].includes(s.phase)&&[0,1].includes(s.bridge)&&typeof s.key==='boolean'&&Number.isInteger(s.lights)&&s.lights>=0&&s.lights<8&&(s.weight===null||s.weight==='carry'||this.graph.nodes.some(n=>n.id===s.weight));}
 get done(){return this.state.node==='E';}
 reason(e,s=this.state){if(e.phase&&e.phase!==s.phase)return'需要'+(e.phase==='red'?'红相（斜纹）':'蓝相（点纹）');if(e.bridge!==null&&e.bridge!==s.bridge)return'需要桥位 '+e.bridge;if(e.key&&!s.key)return'需要先取得 K 的永久钥纹';if(e.weight&&s.weight!==e.weight)return'需要把配重放在 '+e.weight+'，牵引中不算压台';if(e.noCargo&&s.weight==='carry')return'禁货通路：请先放下配重';if(e.lights&&s.lights.toString(2).padStart(3,'0')!==e.lights)return'终点需要灯态 001';if(e.p!==null&&(s.lights>>2&1)!==e.p)return'需要 p 灯亮';if(e.q!==null&&(s.lights>>1&1)!==e.q)return'需要 q 灯灭';return'';}
 routes(s=this.state){return this.graph.edges.filter(e=>e.a===s.node||!e.oneWay&&e.b===s.node).map(e=>({edge:e,to:e.a===s.node?e.b:e.a,reason:this.reason(e,s)}));}
 operations(s=this.state){return[...this.routes(s).filter(r=>!r.reason).map(r=>'move:'+r.edge.id),...(this.graph.phaseStations.includes(s.node)?['phase']:[]),...(this.graph.bridgeStations.includes(s.node)?['bridge']:[]),...(this.graph.buttons[s.node]?['button']:[]),...(s.weight===s.node?['take']:s.weight==='carry'?['drop']:[])];}
 next(s,op){const n=copy(s);if(!this.operations(s).includes(op))return null;if(op.startsWith('move:')){n.node=this.routes(s).find(r=>r.edge.id===op.slice(5)).to;if(n.node===this.graph.keyNode)n.key=true;}else if(op==='phase')n.phase=n.phase==='red'?'blue':'red';else if(op==='bridge')n.bridge=1-n.bridge;else if(op==='button')n.lights^=this.graph.buttons[n.node].mask;else if(op==='take')n.weight='carry';else if(op==='drop')n.weight=n.node;return n;}
 act(op,seed=0){if(this.travel||this.paused||this.done)return false;const next=this.next(this.state,op);if(!next)return false;if(op.startsWith('move:')){this.transport(next,op,seed);return true;}this.history.push(copy(this.state));this.state=next;return true;}
 transport(next,op,seed){
 // Actual stage coordinates: a guarded carrier follows the authored conveyor/lift
 // geometry. The displayed rigid bodies are the ones simulated by Matter.
 const engine=Matter.Engine.create({enableSleeping:false});engine.gravity.y=1;
 const edge=this.graph.edges.find(e=>e.id===op.slice(5));const points=copy(edge.path);if(edge.a!==this.state.node)points.reverse();const from=points[0],to=points.at(-1);
 const ball=Matter.Bodies.circle(from.x,from.y,18,{friction:1,restitution:0,frictionAir:.02});Matter.Body.setVelocity(ball,{x:(seed%5-2)*.25,y:(seed%3-1)*.2});
 const tray=Matter.Bodies.rectangle(from.x,from.y+30,112,16,{isStatic:true,friction:1}),left=Matter.Bodies.rectangle(from.x-58,from.y+4,8,44,{isStatic:true}),right=Matter.Bodies.rectangle(from.x+58,from.y+4,8,44,{isStatic:true});
 const tether=Matter.Constraint.create({bodyA:tray,pointA:{x:-12,y:-30},bodyB:ball,length:0,stiffness:.16,damping:.3});Matter.Composite.add(engine.world,[ball,tray,left,right,tether]);
 let cargo=null;if(this.state.weight==='carry'){cargo=Matter.Bodies.rectangle(from.x+31,from.y+3,28,28,{friction:1,restitution:0});Matter.Composite.add(engine.world,[cargo,Matter.Constraint.create({bodyA:tray,pointA:{x:31,y:-27},bodyB:cargo,length:0,stiffness:.2,damping:.3})]);}
 // Route beds stop before each shaft, leaving a real lift hatch at the turn.
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(a.y===b.y&&Math.abs(a.x-b.x)>140)Matter.Composite.add(engine.world,Matter.Bodies.rectangle((a.x+b.x)/2,a.y+58,Math.abs(a.x-b.x)-140,30,{isStatic:true,label:'conveyor-bed'}));else if(a.x===b.x)for(const dx of [-65,65])Matter.Composite.add(engine.world,Matter.Bodies.rectangle(a.x+dx,(a.y+b.y)/2,6,Math.abs(a.y-b.y),{isStatic:true,label:'lift-guide'}));}
 // Both side ledges are real collision bodies; the center is the lift hatch.
 for(const node of this.graph.nodes)for(const offset of [-102,102])Matter.Composite.add(engine.world,Matter.Bodies.rectangle(node.x+offset,node.y+62,72,36,{isStatic:true,label:'dock'}));
 this.travel={engine,ball,tray,left,right,cargo,to,next,op,points,segment:1,x:from.x,y:from.y,settled:0,progress:0};
 }
 tick(dt=1000/60){const t=this.travel;if(!t||this.paused)return;const target=t.points[t.segment],dx=target.x-t.x,dy=target.y-t.y,d=Math.hypot(dx,dy),final=t.segment===t.points.length-1,speed=Math.min(5,d*(final?.12:.3));if(d>.001){t.x+=dx/d*speed;t.y+=dy/d*speed;}if(d<.5&&!final)t.segment++;
 for(const[body,x,y]of[[t.tray,t.x,t.y+30],[t.left,t.x-58,t.y+4],[t.right,t.x+58,t.y+4]])Matter.Body.setPosition(body,{x,y});Matter.Engine.update(t.engine,dt);
 if(final&&Math.abs(t.ball.position.x-(t.to.x-12))<2&&Math.abs(t.ball.position.y-t.to.y)<4&&(!t.cargo||Math.abs(t.cargo.position.x-(t.to.x+31))<3&&Math.abs(t.cargo.position.y-(t.to.y+3))<4)&&Matter.Body.getSpeed(t.ball)<.15)t.settled++;else t.settled=0;
 if(t.settled>=8){this.history.push(copy(this.state));this.state=t.next;this.disposeTransport();}}
 disposeTransport(){if(this.travel){Matter.Composite.clear(this.travel.engine.world,false);Matter.Engine.clear(this.travel.engine);this.travel=null;}}
 undo(){if(this.travel||this.paused||!this.history.length)return false;this.state=this.history.pop();return true;}
 checkpoint(){return{state:copy(this.state),history:copy(this.history),usedHint:this.usedHint};}
 suspend(){this.disposeTransport();this.paused=true;}
 reset(){this.disposeTransport();this.state={node:'S',phase:this.graph.phase,bridge:0,key:false,weight:this.graph.weight,lights:0};this.history=[];this.usedHint=false;this.paused=false;}
}
root.CourtyardSession=CourtyardSession;
})(typeof window!=='undefined'?window:globalThis);
