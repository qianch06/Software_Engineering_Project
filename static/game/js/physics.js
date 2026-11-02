(function(root) {
  'use strict';
  class PhysicsService {
    constructor() {
      this.engine = Matter.Engine.create({enableSleeping:true}); this.items = new Map(); this.ballContacts = new Set();
      Matter.Events.on(this.engine,'collisionStart',event=>{
        for(const pair of event.pairs){
          const a=this.items.get(pair.bodyA.label),b=this.items.get(pair.bodyB.label);if(!a||!b)continue;
          const ball=a.spec.category==='energyBall'?a:b.spec.category==='energyBall'?b:null;if(!ball)continue;
          const other=ball===a?b:a;if(other.spec.isSensor)continue;
          this.ballContacts.add(other.spec.id);
          const normal=pair.collision.normal,velocity=ball.body.velocity,otherVelocity=other.body.velocity;
          const speed=Math.abs((velocity.x-otherVelocity.x)*normal.x+(velocity.y-otherVelocity.y)*normal.y);
          this.onCollision?.({speed,x:ball.body.position.x,y:ball.body.position.y,other:other.spec.id});
        }
      });
      Matter.Events.on(this.engine,'collisionActive',event=>{for(const pair of event.pairs){const a=this.items.get(pair.bodyA.label),b=this.items.get(pair.bodyB.label);if(!a||!b)continue;const ball=a.spec.category==='energyBall'?a:b.spec.category==='energyBall'?b:null;if(!ball)continue;const other=ball===a?b:a;if(!other.spec.isSensor)this.ballContacts.add(other.spec.id);}});
      Matter.Events.on(this.engine,'collisionEnd',event=>{for(const pair of event.pairs){const a=this.items.get(pair.bodyA.label),b=this.items.get(pair.bodyB.label);if(!a||!b)continue;const ball=a.spec.category==='energyBall'?a:b.spec.category==='energyBall'?b:null;if(!ball)continue;this.ballContacts.delete((ball===a?b:a).spec.id);}});
    }
    add(s) {
      const opts = {isStatic:!!s.isStatic, angle:s.angle||0, friction:s.friction??0.12, frictionAir:s.frictionAir??0.012, restitution:s.restitution??0.12, density:s.density||0.002, isSensor:!!s.isSensor, label:s.id};
      const b = s.type==='circle' ? Matter.Bodies.circle(s.x,s.y,s.r,opts) : Matter.Bodies.rectangle(s.x,s.y,s.w,s.h,opts);
      if(s.lockRotation)Matter.Body.setInertia(b,Infinity);
      this.items.set(s.id,{body:b,spec:{...s},scale:1}); Matter.Composite.add(this.engine.world,b); return s.id;
    }
    candidate(s){return s.type==='circle'?Matter.Bodies.circle(s.x,s.y,s.r,{isStatic:true}):Matter.Bodies.rectangle(s.x,s.y,s.w,s.h,{angle:s.angle||0,isStatic:true});}
    placement(s,ignore=[]){const b=this.candidate(s),items=[...this.items].filter(([id])=>!ignore.includes(id));return{vertices:b.vertices.map(v=>({x:v.x,y:v.y})),overlap:items.some(([,e])=>{const hit=Matter.Collision.collides(b,e.body);return hit&&hit.depth>.25;})};}
    supported(s,id){const b=this.candidate({...s,y:s.y+4});return[...this.items].some(([key,e])=>key!==id&&e.spec.category!=='energyBall'&&!!Matter.Collision.collides(b,e.body));}
    snap(id,p){const b=this.get(id),ys=[];for(const other of this.all().filter(o=>o.id!==id&&o.category!=='energyBall'))for(let i=0;i<other.vertices.length;i++){const a=other.vertices[i],z=other.vertices[(i+1)%other.vertices.length];if(Math.abs(z.x-a.x)<1||p.x<Math.min(a.x,z.x)||p.x>Math.max(a.x,z.x))continue;const y=a.y+(p.x-a.x)*(z.y-a.y)/(z.x-a.x)-b.h/2;if(Math.abs(y-p.y)<30)ys.push(y);}return{x:p.x,y:ys.sort((a,z)=>Math.abs(a-p.y)-Math.abs(z-p.y))[0]??p.y};}
    pin(id,anchor,local={x:0,y:0}) { Matter.Composite.add(this.engine.world,Matter.Constraint.create({bodyB:this.items.get(id).body,pointA:anchor,pointB:local,length:0,stiffness:1})); }
    remove(id) { const e=this.items.get(id); if(e) { Matter.Composite.remove(this.engine.world,e.body); this.items.delete(id); this.ballContacts.delete(id); } }
    gravity(g) { this.engine.gravity.x=g.x; this.engine.gravity.y=g.y; for(const e of this.items.values()) if(!e.body.isStatic && (Math.abs(g.x-this.lastG?.x)>0.005||Math.abs(g.y-this.lastG?.y)>0.005)) Matter.Sleeping.set(e.body,false); this.lastG={...g}; }
    step(ms=1000/60) { Matter.Engine.update(this.engine,ms); for(const e of this.items.values()) { const b=e.body; if(!Number.isFinite(b.position.x+b.position.y+b.angle)) throw Error('E_PHYSICS_FINITE'); const speed=Math.hypot(b.velocity.x,b.velocity.y); if(speed>24) Matter.Body.setVelocity(b,{x:b.velocity.x*24/speed,y:b.velocity.y*24/speed}); } }
    get(id) { const e=this.items.get(id); if(!e)return null; const b=e.body; return {...e.spec,x:b.position.x,y:b.position.y,angle:b.angle,angularVelocity:b.angularVelocity,vx:b.velocity.x,vy:b.velocity.y,scale:e.scale,r:e.spec.r?e.spec.r*e.scale:0,vertices:b.vertices.map(v=>({x:v.x,y:v.y})),mass:b.mass}; }
    all() { return [...this.items.keys()].map(id=>this.get(id)); }
    velocity(id,v) { const e=this.items.get(id); if(e) { Matter.Sleeping.set(e.body,false); Matter.Body.setVelocity(e.body,v); } }
    position(id,p) { Matter.Body.setPosition(this.items.get(id).body,p); }
    angle(id,a) { Matter.Body.setAngle(this.items.get(id).body,a); }
    scale(id,scale) { const e=this.items.get(id); Matter.Body.scale(e.body,scale/e.scale,scale/e.scale); e.scale=scale; Matter.Sleeping.set(e.body,false); }
    angularVelocity(id,v){Matter.Body.setAngularVelocity(this.items.get(id).body,v);}
    acceleration(id,a){const e=this.items.get(id);if(e&&!e.body.isStatic){Matter.Sleeping.set(e.body,false);Matter.Body.applyForce(e.body,e.body.position,{x:e.body.mass*a.x*.001,y:e.body.mass*a.y*.001});}}
    startDrag(id,p){this.endDrag();const b=this.items.get(id).body;this.drag=Matter.Constraint.create({bodyB:b,pointA:{...p},pointB:{x:p.x-b.position.x,y:p.y-b.position.y},length:0,stiffness:.18,damping:.15});Matter.Sleeping.set(b,false);Matter.Composite.add(this.engine.world,this.drag);}
    dragTo(p){if(this.drag){this.drag.pointA={...p};Matter.Sleeping.set(this.drag.bodyB,false);}}
    endDrag(){if(this.drag){Matter.Composite.remove(this.engine.world,this.drag);this.drag=null;}}
    pulley(m){
      const a=this.items.get(m.bodyId).body,b=this.items.get(m.otherBodyId).body;
      const load=tray=>[...this.items.values()].filter(e=>e.body!==a&&e.body!==b&&!e.body.isStatic&&Math.abs(e.body.position.x-tray.position.x)<(tray.bounds.max.x-tray.bounds.min.x)/2&&Math.abs(e.body.bounds.max.y-tray.bounds.min.y)<24).reduce((n,e)=>n+e.body.mass,0);
      const ma=a.mass+load(a),mb=b.mass+load(b),ia=1/ma,ib=1/mb,error=a.position.y+b.position.y-m.ropeY;
      let ay=a.position.y-error*ia/(ia+ib);ay=Math.max(m.minY,Math.min(m.maxY,ay));
      const by=m.ropeY-ay,v=(ma*a.velocity.y-mb*b.velocity.y)/(ma+mb);
      const xA=this.items.get(m.bodyId).spec.x,xB=this.items.get(m.otherBodyId).spec.x;
      Matter.Body.setPosition(a,{x:xA,y:ay});Matter.Body.setPosition(b,{x:xB,y:by});
      Matter.Body.setAngle(a,m.trayAngle||0);Matter.Body.setAngle(b,0);
      const stopped=(ay<=m.minY&&v<0)||(ay>=m.maxY&&v>0);
      Matter.Body.setVelocity(a,{x:0,y:stopped?0:v});Matter.Body.setVelocity(b,{x:0,y:stopped?0:-v});
    }
    overlaps(a,b) { return !!Matter.Collision.collides(this.items.get(a).body,this.items.get(b).body); }
    hasSolidContact(id) { return this.items.get(id)?.spec.category==='energyBall'&&this.ballContacts.size>0; }
    dispose() { Matter.Events.off(this.engine); this.ballContacts.clear(); this.onCollision=null; Matter.Composite.clear(this.engine.world,false); Matter.Engine.clear(this.engine); this.items.clear(); }
  }
  root.PhysicsService=PhysicsService;
})(typeof window!=='undefined'?window:globalThis);
