const{test}=require('node:test'),assert=require('node:assert/strict');
const{levels,solutions,scene,action,run}=require('./helpers.cjs');
for(const id of ['ch3_l03','ch3_l04','ch3_l05'])test('机关配置必须与路线匹配 '+id,()=>{
 const level=levels.find(l=>l.id===id),choice=level.choices[0];
 choice.options.forEach((_,index)=>{const s=scene(id);assert.ok(s.choose(choice.id,index));solutions[id].filter(a=>a.type!=='choice').forEach(a=>assert.ok(action(s,a)));s.release();run(s);assert.equal(s.phase==='cleared',index===1);s.dispose();});
});
// These replays use the same preparation API as mouse/touch; no ball position, velocity or gravity injection.
for(const l of levels)test('合法建造并释放通关 '+l.id,()=>{const s=scene(l);for(const a of solutions[l.id])assert.ok(action(s,a),'illegal preparation '+JSON.stringify(a));assert.ok(s.release());run(s);assert.equal(s.phase,'cleared',JSON.stringify(s.physics.get('ball')));assert.equal(s.events.filter(e=>e.type==='win').length,1);if(l.id.startsWith('ch'))assert.equal(s.events.filter(e=>e.type==='shard').length,1,'fragment must be reachable');s.dispose();});
for(const id of ['tut_mech','ch1_l02','ch2_l02','ch2_l04','ch3_l02','ch3_l05'])for(const omitted of solutions[id].map((_,i)=>i))test('移除核心准备操作不入仓 '+id+' #'+omitted,()=>{const s=scene(id);solutions[id].forEach((a,i)=>{if(i!==omitted)assert.ok(action(s,a));});assert.ok(s.release());run(s,s.level.goal.starTimesMs[1]);assert.notEqual(s.phase,'cleared');s.dispose();});
for(const id of ['tut_grav','tut_hand','ch1_l04','ch2_l02','ch3_l02'])test('空白释放不能跳过主题 '+id,()=>{const s=scene(id);s.release();run(s,s.level.goal.starTimesMs[1]);assert.notEqual(s.phase,'cleared');s.dispose();});
test('光门时限有实际作用：较慢但可通行的坡只在永久开门时成功',()=>{
 for(const semantic of ['pulse','once']){
  const l=structuredClone(levels.find(l=>l.id==='ch3_l01'));l.links[0].semantic=semantic;
  assert.equal(l.draggable.length,0);const s=scene(l);assert.ok(action(s,{type:'board',points:[{x:890,y:670}],angle:.4}));s.release();run(s,150000);
  assert.equal(s.phase==='cleared',semantic==='once');if(semantic==='pulse')assert.equal(s.runtime.links.active('gate'),false);s.dispose();
 }
});
test('错位的色钥：沿用第二章的陡坡会错过高处红锁',()=>{
 const s=scene('ch3_l04');s.choose('palette',1);
 assert.ok(action(s,{type:'line',points:[{x:668,y:520},{x:882,y:600}]}));
 assert.ok(action(s,solutions.ch3_l04[2]));
 s.release();run(s,s.level.goal.starTimesMs[1]);
 assert.notEqual(s.phase,'cleared');
 assert.equal(s.runtime.sequence.index,0);
 s.dispose();
});
test('回廊的回声：原有低桥会错过高处黄锁',()=>{
 const s=scene('ch3_l05');s.choose('palette',1);
 assert.ok(action(s,{type:'board',points:[{x:800,y:710}],angle:.07}));
 assert.ok(action(s,{type:'board',points:[{x:1100,y:731}],angle:.07}));
 s.release();run(s,s.level.goal.starTimesMs[1]);
 assert.notEqual(s.phase,'cleared');
 assert.equal(s.runtime.sequence.index,1);
 s.dispose();
});

// A chapter theme must survive a counterfactual check, not just a successful replay.
for(const id of ['ch1_l03','ch1_l04','ch1_l05']){
 const original=levels.find(l=>l.id===id);
 for(const removed of ['route',...(id!=='ch1_l04'?['light']:[]),...(id!=='ch1_l03'?['spring']:[])])test('第一章必要环节 '+id+' '+removed,()=>{
  const l=structuredClone(original);
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

for(const id of ['ch2_l03','ch2_l04','ch3_l01','ch3_l02','ch3_l03','ch3_l04','ch3_l05']){
 const removals={'ch2_l03':['scale'],'ch2_l04':['pulley'],'ch3_l01':['link','route'],'ch3_l02':['field'],'ch3_l03':['water','route'],'ch3_l04':['red','blue','link','route'],'ch3_l05':['water','red','yellow','blue','link','route']}[id];
 for(const removed of removals)test('后续章节主题必要性 '+id+' '+removed,()=>{
  const l=structuredClone(levels.find(l=>l.id===id));
  if(['water','field','wash'].includes(removed))l.sensors=l.sensors.filter(z=>z.id!==removed);
  if(['red','yellow','blue'].includes(removed)){delete l.sensors.find(z=>z.id===removed).dye;for(const c of l.choices||[])for(const o of c.options)for(const e of o.edits)if(e.id===removed)delete e.dye;}
  if(removed==='link')l.links=[];
  if(removed==='pulley')l.mechanisms=l.mechanisms.filter(m=>m.type!=='pulley');
  const s=scene(l);solutions[id].filter(a=>!(removed==='scale'&&a.type==='scale')&&!(removed==='route'&&['line','board'].includes(a.type))).forEach(a=>assert.ok(action(s,a)));
  s.release();run(s,l.goal.starTimesMs[1]);assert.notEqual(s.phase,'cleared');s.dispose();
 });
}
