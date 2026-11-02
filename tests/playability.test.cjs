const {test}=require('node:test'),assert=require('node:assert/strict');
require('../static/game/js/core.js');global.Matter=require('../static/game/vendor/matter.min.js');require('../static/game/js/physics.js');require('../static/game/js/levels.js');require('../static/game/js/runtime.js');
// Reference controller supplies legal gravity vectors only: no teleport, collision bypass or win injection.
function steer(runtime,physics,target,limit=1800){
  let dwell=0;
  for(let i=0;i<limit&&!runtime.done&&!runtime.failed;i++){
    const b=physics.get('ball'),dx=target.x-b.x,dy=target.y-b.y;
    let x=dx*.018-b.vx*.42,y=dy*.018-b.vy*.42,n=Math.max(1,Math.hypot(x,y));
    runtime.tick(1000/60,{x:x/n,y:y/n});
    if(Math.hypot(dx,dy)<18&&Math.hypot(b.vx,b.vy)<1){if(++dwell>20)return true;}else dwell=0;
  }
  return runtime.done;
}
for(const level of LEVELS.filter(l=>l.goal.type!=='stable'))test('合法重力输入可完成 '+level.id,()=>{
  const p=new PhysicsService(),r=new LevelRuntime(level,p);
  if(level.resizable)p.scale('ball',.5); // Same density-preserving operation exposed to players.
  let route;
  if(level.id==='tut_hand'||level.id==='ch2_l03')route=[{x:700,y:745},{x:1200,y:745}];
  else if(level.goal.colorChain?.length)route=level.goal.colorChain.map(color=>{const z=level.sensors.find(z=>z.dye===color);return{x:z.x,y:z.y};});
  else if(level.goal.sequence?.length)route=level.goal.sequence.map(id=>{const z=level.sensors.find(z=>z.id===id);return{x:z.x,y:z.y};});
  else route=[{x:250,y:350},{x:1480,y:350}];
  route.push(level.collector);
  for(const point of route){assert.ok(steer(r,p,point),level.id+' cannot reach '+JSON.stringify(point)+'; ball '+JSON.stringify(p.get('ball')));}
  if(!r.done)steer(r,p,level.collector,600);
  assert.equal(r.done,true);assert.equal(r.failed,false);p.dispose();
});

test('玻璃球区分实体碰撞与滚动接触，传感器不触发',()=>{
  const physics=new PhysicsService(),hits=[];physics.onCollision=hit=>hits.push(hit);
  physics.add({id:'ball',type:'circle',x:500,y:500,r:20,category:'energyBall'});
  physics.add({id:'floor',type:'rect',x:500,y:535,w:200,h:20,isStatic:true,category:'terrain'});
  physics.velocity('ball',{x:0,y:6});physics.step();
  assert.equal(hits.length,1);assert.equal(hits[0].other,'floor');assert.equal(hits[0].material,'terrain');assert.ok(hits[0].speed>1);assert.equal(physics.hasSolidContact('ball'),true);assert.equal(physics.contactMaterial('ball'),'terrain');
  physics.add({id:'sensor',type:'rect',x:800,y:500,w:100,h:100,isStatic:true,isSensor:true});
  physics.position('ball',{x:800,y:500});physics.velocity('ball',{x:0,y:0});physics.step();
  assert.equal(hits.length,1);assert.equal(physics.hasSolidContact('ball'),false);assert.equal(physics.contactMaterial('ball'),null);physics.dispose();
});
