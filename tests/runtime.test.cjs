const {test}=require('node:test'),assert=require('node:assert/strict');
require('../static/game/js/core.js');global.Matter=require('../static/game/vendor/matter.min.js');require('../static/game/js/physics.js');require('../static/game/js/levels.js');require('../static/game/js/runtime.js');
const {LinkSystem,Sequence,inverseLevel,StorageService}=GameCore;
function scene(id){const p=new PhysicsService(),events=[],l=typeof id==='string'?LEVELS.find(l=>l.id===id):id,r=new LevelRuntime(l,p,(type,data)=>events.push({type,data}));return{p,r,events};}
function tick(s,n=1,g={x:0,y:0}){for(let i=0;i<n;i++)s.r.tick(1000/60,g);}
test('once/hold/toggle/pulse 语义、去重、释放与过期',()=>{
  for(const semantic of ['once','hold','toggle','pulse']){const l=new LinkSystem([{source:'a',target:'b',semantic,durationMs:100}]);l.source('a',true);assert.equal(l.active('b'),true);l.source('a',true);assert.equal(l.active('b'),true);l.source('a',false);assert.equal(l.active('b'),semantic!=='hold');if(semantic==='pulse'){l.tick(101);assert.equal(l.active('b'),false);}if(semantic==='toggle'){l.source('a',true);assert.equal(l.active('b'),false);}}
});
test('错序留痕，合法输入继续推进，不会永久锁死',()=>{const s=new Sequence(['A','B','C']);assert.equal(s.hit('C'),false);assert.equal(s.index,0);assert.equal(s.mistake,'C');s.hit('A');assert.equal(s.mistake,'');s.hit('B');s.hit('C');assert.equal(s.complete,true);});
test('染色持久、洗色唯一退色；完成颜色链后才能收集',()=>{
  const s=scene('ch3_l04'),hit=(x,y=640)=>{s.p.position('ball',{x,y});s.p.velocity('ball',{x:0,y:0});tick(s);};
  hit(500);assert.equal(s.r.color,'red');hit(670);assert.equal(s.r.color,'red');hit(850);assert.equal(s.r.color,'yellow');hit(1070);assert.equal(s.r.color,'white');hit(1260);assert.equal(s.r.color,'blue');assert.equal(s.r.colors.complete,true);hit(1680,745);tick(s,20);assert.equal(s.r.done,true);s.p.dispose();
});
test('顺序未完成拒绝入仓；脉冲门可重新触发',()=>{const s=scene('ch3_l01');s.p.position('ball',s.r.level.collector);tick(s,20);assert.equal(s.r.done,false);s.p.position('ball',{x:680,y:640});tick(s);assert.ok(s.r.links.active('gate'));assert.ok(s.events.some(e=>e.type==='link'));s.p.position('ball',{x:800,y:640});tick(s,260);assert.equal(s.r.links.active('gate'),false);s.p.position('ball',{x:680,y:640});tick(s);assert.equal(s.r.links.active('gate'),true);s.p.dispose();});
test('滑轮两端绳长守恒，位移相等、方向相反',()=>{const s=scene('ch2_l04');const m=s.r.level.mechanisms[0];tick(s,60,{x:0,y:1});const a=s.p.get(m.bodyId),b=s.p.get(m.otherBodyId);assert.ok(Math.abs(a.y+b.y-m.ropeY)<.001);assert.ok(Math.abs(a.vy+b.vy)<.001);assert.ok(a.y>=620);s.p.dispose();});
test('局部重力替换全局，水流加速度不随质量变化',()=>{
  const s=scene('ch3_l02');s.p.position('ball',{x:1070,y:650});tick(s,20,{x:0,y:1});assert.ok(s.p.get('ball').vy<0);s.p.dispose();
  const speeds=[];for(const scale of [1,.5]){const w=scene('ch3_l03');w.p.scale('ball',scale);w.p.position('ball',{x:800,y:620});tick(w,10);speeds.push(w.p.get('ball').vx);w.p.dispose();}assert.ok(Math.abs(speeds[0]-speeds[1])<.05);
});
test('堆叠窗口中断清零；真实碰撞落稳后 3 秒才通关',()=>{
  const s=scene('ch2_l05');for(let i=0;i<3;i++){s.p.position('cube'+(i+1),{x:1500,y:776-i*78});s.p.velocity('cube'+(i+1),{x:0,y:0});}
  tick(s,60,{x:0,y:1});assert.equal(s.r.done,false);s.p.velocity('cube3',{x:1,y:0});tick(s,1,{x:0,y:1});assert.equal(s.r.stable,0);
  for(let i=0;i<3;i++){s.p.position('cube'+(i+1),{x:1500,y:776-i*78});s.p.velocity('cube'+(i+1),{x:0,y:0});s.p.angle('cube'+(i+1),0);s.p.angularVelocity('cube'+(i+1),0);}tick(s,300,{x:0,y:1});assert.equal(s.r.done,true);assert.equal(s.events.filter(e=>e.type==='win').length,1);s.p.dispose();
});
test('危险区导致失败，碎片事件只发一次',()=>{const s=scene('ch2_l02');s.p.position('ball',s.r.level.shard);tick(s,2);assert.equal(s.events.filter(e=>e.type==='shard').length,1);s.p.position('ball',{x:870,y:860});tick(s);assert.equal(s.r.failed,true);s.p.dispose();});
test('18 普通关 / 15 倒映关：10 秒零重力静置无 NaN，确定性镜像',()=>{
  const formal=LEVELS.filter(l=>l.id.startsWith('ch'));assert.equal(formal.length,15);
  for(const l of [...LEVELS,...formal.map(inverseLevel)]){const s=scene(l);tick(s,600);assert.ok(s.p.all().every(b=>Number.isFinite(b.x+b.y+b.angle)));s.p.dispose();}
  for(const l of formal){assert.deepEqual(inverseLevel(l),inverseLevel(l));const inv=inverseLevel(l);assert.equal(inv.collector.x,1920-l.collector.x);}
});
test('版本一存档迁移、不接受损坏成绩、15 颗碎片准确解锁倒映',()=>{
  const map=new Map([['gravity-shift-v1',JSON.stringify({version:1,settings:{sound:false},completed:{tut_grav:{stars:3,bestTimeMs:1200,resets:0},bad:{stars:99,bestTimeMs:-1}},shards:{},lastLevelId:'tut_mech'})]]);
  const s=new StorageService({getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)});assert.equal(s.data.version,2);assert.equal(s.data.settings.sound,false);assert.equal(s.data.completed.bad,undefined);assert.equal(s.data.lastLevelId,'tut_mech');assert.equal(s.inverseUnlocked(),false);for(const l of LEVELS.filter(l=>l.id.startsWith('ch')))s.data.shards[l.id]=true;assert.equal(s.inverseUnlocked(),true);s.save();assert.ok(map.has('gravity-shift-v2'));
});
test('主存档损坏时恢复备份，并隔离损坏原文',()=>{
  const good={version:2,settings:{sound:false},completed:{tut_grav:{stars:3,bestTimeMs:1000,resets:0}},shards:{},lastLevelId:'tut_mech'};
  const map=new Map([['gravity-shift-v2','broken'],['gravity-shift-v2-backup',JSON.stringify(good)]]),s=new StorageService({getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)});
  assert.equal(s.data.completed.tut_grav.stars,3);assert.ok(s.warning.includes('备份'));s.save();assert.equal(map.get('gravity-shift-v2-corrupt-backup'),'broken');assert.equal(JSON.parse(map.get('gravity-shift-v2')).lastLevelId,'tut_mech');
});
