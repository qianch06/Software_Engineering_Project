const{test}=require('node:test'),assert=require('node:assert/strict');
const{levels,solutions,scene,action,run}=require('./helpers.cjs');
// These replays use the same preparation API as mouse/touch; no ball position, velocity or gravity injection.
for(const source of levels)for(const inverse of [false,...(source.id.startsWith('ch')?[true]:[])]){const l=inverse?GameCore.inverseLevel(source):source;test('合法建造并释放通关 '+l.id,()=>{const s=scene(l);for(const a of solutions[source.id])assert.ok(action(s,a),'illegal preparation '+JSON.stringify(a));assert.ok(s.release());run(s);assert.equal(s.phase,'cleared',JSON.stringify(s.physics.get('ball')));assert.equal(s.events.filter(e=>e.type==='win').length,1);if(!inverse&&source.id.startsWith('ch'))assert.equal(s.events.filter(e=>e.type==='shard').length,1,'fragment must be reachable');s.dispose();});}
for(const id of ['tut_mech','ch1_l02','ch2_l01','ch2_l02','ch2_l04','ch3_l02'])for(const omitted of solutions[id].map((_,i)=>i))test('移除核心准备操作不入仓 '+id+' #'+omitted,()=>{const s=scene(id);solutions[id].forEach((a,i)=>{if(i!==omitted)assert.ok(action(s,a));});assert.ok(s.release());run(s,s.level.goal.starTimesMs[1]);assert.notEqual(s.phase,'cleared');s.dispose();});
for(const id of ['tut_grav','tut_hand','ch1_l04','ch2_l02','ch3_l02'])test('空白释放不能跳过主题 '+id,()=>{const s=scene(id);s.release();run(s,s.level.goal.starTimesMs[1]);assert.notEqual(s.phase,'cleared');s.dispose();});
test('光门既可用脉冲时序，也可用配重保持',()=>{for(const actions of [[],[{type:'place',id:'weight',point:{x:500,y:800}}]]){const s=scene('ch3_l01');actions.forEach(a=>assert.ok(action(s,a)));s.release();run(s);assert.equal(s.phase,'cleared');s.dispose();}});

// A chapter theme must survive a counterfactual check, not just a successful replay.
for(const id of ['ch1_l03','ch1_l04','ch1_l05'])for(const inverse of [false,true]){
 const original=levels.find(l=>l.id===id);
 for(const removed of ['route',...(id!=='ch1_l04'?['light']:[]),...(id!=='ch1_l03'?['spring']:[])])test('第一章必要环节 '+id+' '+removed+(inverse?' 镜像':''),()=>{
  const l=structuredClone(inverse?GameCore.inverseLevel(original):original);
  if(removed==='light')l.links=[];
  if(removed==='spring')l.mechanisms=l.mechanisms.filter(m=>m.type!=='spring');
  const s=scene(l);if(removed!=='route')solutions[id].forEach(a=>assert.ok(action(s,a)));
  s.release();run(s,l.goal.starTimesMs[1]);assert.notEqual(s.phase,'cleared');s.dispose();
 });
}
test('万物相连按弹簧、光门、入仓顺序实际发生，弹簧不与道路重叠',()=>{
 const l=levels.find(l=>l.id==='ch1_l05'),s=scene(l);solutions[l.id].forEach(a=>assert.ok(action(s,a)));s.release();run(s);
 const types=s.events.map(e=>e.type);assert.ok(types.indexOf('spring')>=0);assert.ok(types.indexOf('link')>types.indexOf('spring'));assert.ok(types.indexOf('win')>types.indexOf('link'));
 for(const b of l.bodies.filter(b=>b.category==='terrain'))assert.equal(Matter.Collision.collides(s.physics.items.get('spring').body,s.physics.items.get(b.id).body),null);
 s.dispose();
});
