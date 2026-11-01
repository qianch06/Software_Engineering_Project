(function(root) {
  'use strict';
  class PhysicsService {
    constructor() { this.engine = Matter.Engine.create({enableSleeping:true}); this.items = new Map(); }
    add(s) {
      const opts = {isStatic:!!s.isStatic, angle:s.angle||0, friction:s.friction??0.12, frictionAir:s.frictionAir??0.012, restitution:s.restitution??0.12, density:s.density||0.002, isSensor:!!s.isSensor, label:s.id};
      const b = s.type==='circle' ? Matter.Bodies.circle(s.x,s.y,s.r,opts) : Matter.Bodies.rectangle(s.x,s.y,s.w,s.h,opts);
      this.items.set(s.id,{body:b,spec:{...s},scale:1}); Matter.Composite.add(this.engine.world,b); return s.id;
    }
    pin(id,anchor,local={x:0,y:0}) { Matter.Composite.add(this.engine.world,Matter.Constraint.create({bodyB:this.items.get(id).body,pointA:anchor,pointB:local,length:0,stiffness:1})); }
    remove(id) { const e=this.items.get(id); if(e) { Matter.Composite.remove(this.engine.world,e.body); this.items.delete(id); } }
    gravity(g) { this.engine.gravity.x=g.x; this.engine.gravity.y=g.y; for(const e of this.items.values()) if(!e.body.isStatic && (Math.abs(g.x-this.lastG?.x)>0.005||Math.abs(g.y-this.lastG?.y)>0.005)) Matter.Sleeping.set(e.body,false); this.lastG={...g}; }
    step(ms=1000/60) { Matter.Engine.update(this.engine,ms); for(const e of this.items.values()) { const b=e.body; if(!Number.isFinite(b.position.x+b.position.y+b.angle)) throw Error('E_PHYSICS_FINITE'); const speed=Math.hypot(b.velocity.x,b.velocity.y); if(speed>24) Matter.Body.setVelocity(b,{x:b.velocity.x*24/speed,y:b.velocity.y*24/speed}); } }
    get(id) { const e=this.items.get(id); if(!e)return null; const b=e.body; return {...e.spec,x:b.position.x,y:b.position.y,angle:b.angle,vx:b.velocity.x,vy:b.velocity.y,scale:e.scale,r:e.spec.r*e.scale,vertices:b.vertices.map(v=>({x:v.x,y:v.y})),mass:b.mass}; }
    all() { return [...this.items.keys()].map(id=>this.get(id)); }
    velocity(id,v) { const e=this.items.get(id); if(e) { Matter.Sleeping.set(e.body,false); Matter.Body.setVelocity(e.body,v); } }
    position(id,p) { Matter.Body.setPosition(this.items.get(id).body,p); }
    angle(id,a) { Matter.Body.setAngle(this.items.get(id).body,a); }
    scale(id,scale) { const e=this.items.get(id); Matter.Body.scale(e.body,scale/e.scale,scale/e.scale); e.scale=scale; Matter.Sleeping.set(e.body,false); }
    overlaps(a,b) { return !!Matter.Collision.collides(this.items.get(a).body,this.items.get(b).body); }
    dispose() { Matter.Composite.clear(this.engine.world,false); Matter.Engine.clear(this.engine); this.items.clear(); }
  }
  root.PhysicsService=PhysicsService;
})(typeof window!=='undefined'?window:globalThis);
