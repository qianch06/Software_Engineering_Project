const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../static/game/js/core.js');
global.Matter=require('../static/game/vendor/matter.min.js');
require('../static/game/js/physics.js');
require('../static/game/js/levels.js');
const {StorageService,GravityController,validateLevel,rating}=global.GameCore;
test('全部 9 关合法，悬空引用、非法尺寸和缺少洗色区均被拒绝',()=>{
  assert.equal(LEVELS.length,9);LEVELS.forEach(validateLevel);
  const bad=structuredClone(LEVELS[0]);bad.bodies[0].w=-2;assert.throws(()=>validateLevel(bad));
  const ref=structuredClone(LEVELS[5]);ref.sensors[0].target='missing';assert.throws(()=>validateLevel(ref));
  const color=structuredClone(LEVELS[8]);color.sensors=color.sensors.filter(s=>s.type!=='wash');assert.throws(()=>validateLevel(color));
});
test('缩放遵守密度守恒，质量随面积变化',()=>{const p=new PhysicsService();p.add({id:'ball',type:'circle',x:200,y:200,r:40});const m=p.get('ball').mass;p.scale('ball',.5);assert.ok(Math.abs(p.get('ball').mass/m-.25)<.001);p.dispose();});
test('固定步长双跑结果一致，九关分别推进 20 秒无 NaN',()=>{
  function run(l){const p=new PhysicsService();l.bodies.forEach(b=>p.add(b));l.mechanisms.filter(m=>m.type==='lever').forEach(m=>p.pin(m.bodyId,m.anchor));p.gravity({x:.4,y:.8});for(let i=0;i<1200;i++)p.step();const b=p.get('ball');p.dispose();return [b.x,b.y];}
  for(const l of LEVELS){const a=run(l),b=run(l);assert.ok(a.every(Number.isFinite));assert.deepEqual(a,b);}
});
test('重力滤波与死区；归一化和灵敏度',()=>{const c=new GravityController();c.value={x:0,y:0};c.sample(0,0,1);for(let i=0;i<60;i++)c.update(16.67);assert.ok(Math.hypot(c.value.x,c.value.y)<.05);c.target={x:1,y:0};for(let i=0;i<120;i++)c.update(16.67,'low');assert.ok(Math.abs(c.value.x-.6)<.001);});
test('重玩保留最优星级/时间，解锁、最近关卡和设置持久化',()=>{const data=new Map(),adapter={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};const s=new StorageService(adapter);assert.equal(s.unlocked(1,LEVELS),false);s.complete(LEVELS[0].id,15000,0);s.complete(LEVELS[0].id,110000,4);assert.equal(s.data.completed.tut_grav.stars,3);assert.equal(s.data.completed.tut_grav.bestTimeMs,15000);s.data.settings.sound=false;s.data.lastLevelId='tut_mech';s.save();const restored=new StorageService(adapter);assert.equal(restored.unlocked(1,LEVELS),true);assert.equal(restored.data.settings.sound,false);assert.equal(restored.data.lastLevelId,'tut_mech');});
test('损坏存档与存储失败安全降级，评分阈值正确',()=>{const s=new StorageService({getItem:()=>'{bad',setItem:()=>{throw Error('quota');}});assert.ok(s.warning);assert.equal(s.save(),false);assert.equal(rating(59000,0),3);assert.equal(rating(70000,1),2);assert.equal(rating(100000,0),1);});
