(function (root) {
  'use strict';
  const KEY='gravity-shift-v2',LEGACY='gravity-shift-v1';
  const GRAVITY=Object.freeze({x:0,y:1});
  const defaults=()=>({version:2,rulesVersion:3,settings:{touchSensitivity:1,sound:true,music:true,vibrate:true,adminMode:false},courtyard:{},completed:{},legacyCompleted:{},tutorials:{},shards:{},lastLevelId:null});
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
  class StorageService {
    constructor(adapter){this.adapter=adapter;this.warning='';this.data=defaults();try{const raw=adapter.getItem(KEY)||adapter.getItem(LEGACY);if(raw)this.data=StorageService.decode(JSON.parse(raw));}catch(_){this.warning='存档损坏或不可读取，已启用新进度；原始数据未覆盖。';this.corrupt=true;try{const backup=adapter.getItem(KEY+'-backup');if(backup){this.data=StorageService.decode(JSON.parse(backup));this.warning='主存档损坏，已恢复上一次备份。';}}catch(_){}}}
    static decode(d){
      if(!object(d)||![1,2].includes(d.version)||!object(d.completed)||!object(d.shards))throw Error('E_SAVE_VERSION');
      const result=defaults(),s=object(d.settings)?d.settings:{};
      for(const k of ['sound','music','vibrate','adminMode'])if(typeof s[k]==='boolean')result.settings[k]=s[k];
      if([.7,1,1.3].includes(s.touchSensitivity))result.settings.touchSensitivity=s.touchSensitivity;
      if(object(d.courtyard))for(const[id,value]of Object.entries(d.courtyard))if(/^ch4_g0[1-5]$/.test(id)&&object(value)&&object(value.state)&&Array.isArray(value.history))result.courtyard[id]=value;
      const records=raw=>{const out={};for(const [id,r] of Object.entries(object(raw)?raw:{}))if(/^[a-z0-9_]+$/.test(id)&&object(r)&&[1,2,3].includes(r.stars)&&Number.isFinite(r.bestTimeMs)&&r.bestTimeMs>=0)out[id]={stars:r.stars,bestTimeMs:r.bestTimeMs,resets:Number.isInteger(r.resets)&&r.resets>=0?r.resets:0};return out;};
      if(d.rulesVersion===3){result.completed=records(d.completed);result.legacyCompleted=records(d.legacyCompleted);if(object(d.tutorials))for(const [id,v] of Object.entries(d.tutorials))if(/^tut_\w+$/.test(id)&&v===true)result.tutorials[id]=true;}
      else result.legacyCompleted=records(d.completed);
      for(const [id,v] of Object.entries(d.shards))if(/^ch[1234]_l0[1-6]$/.test(id)&&v===true)result.shards[id]=true;
      result.lastLevelId=typeof d.lastLevelId==='string'&&/^[a-z0-9_]+$/.test(d.lastLevelId)?d.lastLevelId:null;return result;
    }
    save(){try{const wasCorrupt=this.corrupt;if(this.corrupt){const old=this.adapter.getItem(KEY);if(old)this.adapter.setItem(KEY+'-corrupt-backup',old);this.corrupt=false;}const old=this.adapter.getItem(KEY);if(old&&!wasCorrupt)this.adapter.setItem(KEY+'-backup',old);this.adapter.setItem(KEY,JSON.stringify(this.data));this.warning='';return true;}catch(_){this.warning='保存失败，进度暂存于内存，请检查可用空间。';return false;}}
    complete(id,time,resets,thresholds){const stars=rating(time,resets,thresholds),old=this.data.completed[id];this.data.completed[id]={stars:Math.max(old?.stars||0,stars),bestTimeMs:Math.min(old?.bestTimeMs??Infinity,time),resets:Math.min(old?.resets??Infinity,resets)};if(id.startsWith('tut_'))this.data.tutorials[id]=true;this.data.lastLevelId=null;this.save();return stars;}
    unlocked(index,levels){const l=levels[index],previous=levels[index-1]?.id;return !!l&&(this.data.settings.adminMode||index===0||!!this.data.completed[previous]||!!this.data.legacyCompleted[previous]||levels.slice(index).some(next=>!!this.data.completed[next.id]||!!this.data.legacyCompleted[next.id]));}
    reset(){const settings=this.data.settings;this.data=defaults();this.data.settings=settings;return this.save();}
  }
  function rating(time,resets,thresholds=[60000,90000]){return time<=thresholds[0]?3:time<=thresholds[1]?2:1;}
  class LinkSystem {
    constructor(links=[]){this.links=links.map(l=>({...l,active:false,fired:false,until:0,sourceActive:false}));this.time=0;}
    source(id,active){for(const l of this.links.filter(l=>l.source===id)){const rising=active&&!l.sourceActive;l.sourceActive=active;if(l.semantic==='hold')l.active=active;if(rising&&l.semantic==='once'&&!l.fired){l.active=true;l.fired=true;}if(rising&&l.semantic==='toggle')l.active=!l.active;if(rising&&l.semantic==='pulse'){l.active=true;l.until=this.time+l.durationMs;}}}
    tick(dt){this.time+=dt;for(const l of this.links)if(l.semantic==='pulse'&&this.time>=l.until)l.active=false;}
    active(target){return this.links.some(l=>l.target===target&&l.active);}
  }
  class Sequence {
    constructor(expected=[]){this.expected=expected;this.index=0;this.mistake='';}
    hit(id){if(this.index===this.expected.length)return true;if(id===this.expected[this.index]){this.index++;this.mistake='';return true;}this.mistake=id;return false;}
    get complete(){return this.index===this.expected.length;}
  }
  function validateLevel(l){
    const finite=(...v)=>v.every(Number.isFinite),fail=code=>{throw Error(code+': '+(l?.id||'unknown'));};
    if(!l||!/^[a-z0-9_]{1,64}$/.test(l.id)||!l.name||!Array.isArray(l.bodies)||l.bodies.length>220||!l.collector)fail('E_LEVEL_FORMAT');
    if(l.rulesVersion!==3||l.initialGravity?.x!==0||l.initialGravity?.y!==1)fail('E_RULES_VERSION');
    if(!Array.isArray(l.mechanisms)||!Array.isArray(l.sensors))fail('E_LEVEL_FORMAT');
    const rect=z=>z&&finite(z.x,z.y,z.w,z.h)&&z.w>0&&z.h>0;
    if(!Array.isArray(l.buildAreas)||l.buildAreas.some(z=>!rect(z))||(l.boards||l.lines)&&!l.buildAreas.length)fail('E_LEVEL_BUILD_AREA');
    const ids=new Set();for(const b of l.bodies){if(!b.id||ids.has(b.id)||!['rect','circle'].includes(b.type)||!finite(b.x,b.y,b.angle??0)||(b.type==='rect'?!finite(b.w,b.h)||b.w<=0||b.h<=0:!finite(b.r)||b.r<=0))fail('E_LEVEL_BODY');if(Math.abs(b.x)>4000||Math.abs(b.y)>4000||b.restitution!=null&&(!finite(b.restitution)||b.restitution<0||b.restitution>1))fail('E_LEVEL_RANGE');ids.add(b.id);}
    if(!ids.has('ball')&&(l.goal?.type!=='stable'||l.resizable||l.sensors.length||l.mechanisms.length))fail('E_LEVEL_BALL');if(!finite(l.collector.x,l.collector.y,l.collector.r)||l.collector.r<=0)fail('E_LEVEL_COLLECTOR');
    if(l.collector.acceptColor&&!['white','red','yellow','blue'].includes(l.collector.acceptColor))fail('E_LEVEL_COLOR');
    for(const id of l.draggable||[])if(!ids.has(id)||l.bodies.find(b=>b.id===id).category!=='taskCube'||!l.placementZones?.[id]?.length||l.placementZones[id].some(z=>!rect(z)))fail('E_LEVEL_DRAG');
    for(const m of l.mechanisms||[]){if(m.type==='lever'&&(!m.anchor||!finite(m.anchor.x,m.anchor.y,m.limit)||m.limit<=0||m.limit>Math.PI/2))fail('E_LEVEL_MECHANISM');if(m.type==='door'&&(!m.anchor||!finite(m.anchor.x,m.anchor.y)||m.openAngle!=null&&!finite(m.openAngle)))fail('E_LEVEL_MECHANISM');if(m.type==='spring'&&(!finite(m.gain)||m.gain<=0||m.gain>24))fail('E_LEVEL_MECHANISM');}
    if(!Number.isInteger(l.boards)||l.boards<0||l.boards>4||!Number.isInteger(l.lines)||l.lines<0||l.lines>3)fail('E_LEVEL_INVENTORY');
    if(l.boardSpec&&(!finite(l.boardSpec.w,l.boardSpec.h)||l.boardSpec.w<=0||l.boardSpec.w>1152||l.boardSpec.h<=0))fail('E_LEVEL_BOARD');
    if(l.lesson){const t=l.lesson;if(!l.id.startsWith('tut_')||!['board','weight','line'].includes(t.kind)||!Array.isArray(l.tutorial)||l.tutorial.length!==3)fail('E_LEVEL_LESSON');if(t.kind==='line'){if(!Array.isArray(t.path)||t.path.length<2||t.path.some(p=>!finite(p.x,p.y)))fail('E_LEVEL_LESSON');}else if(!t.target||!finite(t.target.x,t.target.y,t.radius)||t.radius<=0||t.radius>120||t.kind==='board'&&!finite(t.angle)||t.kind==='weight'&&!l.draggable?.includes(t.sourceId))fail('E_LEVEL_LESSON');}
    if(!l.scaleRange||!finite(...l.scaleRange)||l.scaleRange[0]<.1||l.scaleRange[1]>3||l.scaleRange[0]>1||l.scaleRange[1]<1)fail('E_LEVEL_SCALE');
    const sources=new Set(),mechanisms=new Set();for(const m of l.mechanisms||[]){if(!['lever','door','spring','pulley'].includes(m.type)||!ids.has(m.bodyId))fail('E_LEVEL_REF');if(m.type==='pulley'&&(!ids.has(m.otherBodyId)||!finite(m.ropeY,m.minY,m.maxY)||m.minY>=m.maxY))fail('E_LEVEL_PULLEY');mechanisms.add(m.bodyId);sources.add(m.bodyId);}
    if(l.mechanisms?.some(m=>m.type==='spring')&&l.resizable&&(l.scaleRange[0]<.7||l.scaleRange[1]>1.3))fail('E_LEVEL_SCALE');
    for(const z of l.sensors||[]){if(!z.id||sources.has(z.id)||!['laser','wash','water','gravityField','air','pressure'].includes(z.type)||!finite(z.x,z.y,z.w,z.h)||z.w<=0||z.h<=0)fail('E_LEVEL_ZONE');if(z.dye&&!['red','yellow','blue'].includes(z.dye))fail('E_LEVEL_COLOR');if(z.requiresColor&&(!['white','red','yellow','blue'].includes(z.requiresColor)||z.dye||!['laser','pressure'].includes(z.type)))fail('E_LEVEL_COLOR_LOCK');if(z.force&&!finite(z.force.x,z.force.y))fail('E_LEVEL_ZONE');if(z.target&&!ids.has(z.target))fail('E_LEVEL_REF');sources.add(z.id);}

    for(const z of l.sensors){if(z.buoyancy!=null&&(z.type!=='water'||!finite(z.buoyancy)||z.buoyancy<0||z.buoyancy>3))fail('E_LEVEL_BUOYANCY');if(z.type==='air'&&(!z.force||!finite(z.force.x,z.force.y)||Math.hypot(z.force.x,z.force.y)>3))fail('E_LEVEL_AIR');}
    const fields=(l.sensors||[]).filter(z=>z.type==='gravityField');
    if(fields.length>1||fields.some(z=>(l.baseId||l.id)!=='ch3_l02'||!z.force||z.force.x!==0||z.force.y>=0||z.force.y< -2))fail('E_LEVEL_FIELD');
    for(const link of l.links||[])if(!sources.has(link.source)||!mechanisms.has(link.target)||!['once','hold','toggle','pulse'].includes(link.semantic)||link.semantic==='pulse'&&!(link.durationMs>0))fail('E_LEVEL_LINK');
    const goal=l.goal||{type:'transport'};if(!['transport','stable','sequence','combo'].includes(goal.type))fail('E_LEVEL_GOAL');for(const id of goal.sequence||[])if(!sources.has(id))fail('E_LEVEL_SEQUENCE');
    for(const color of goal.colorChain||[])if(!['red','yellow','blue'].includes(color))fail('E_LEVEL_COLOR');
    if(goal.starTimesMs&&(!finite(...goal.starTimesMs)||goal.starTimesMs.length!==2||goal.starTimesMs[0]<=0||goal.starTimesMs[1]<goal.starTimesMs[0]))fail('E_LEVEL_RATING');
    if(goal.type==='stable'&&(!goal.stableBodies?.length||goal.stableBodies.some(id=>!ids.has(id))||!(goal.stableForMs>=1000&&goal.stableForMs<=10000)||!goal.zone))fail('E_LEVEL_STABLE');
    for(const d of l.deathZones||[])if(!finite(d.x,d.y,d.w,d.h)||d.w<=0||d.h<=0)fail('E_LEVEL_DEATH');return l;
  }
  root.GameCore={StorageService,GRAVITY,rating,validateLevel,LinkSystem,Sequence};
})(typeof window!=='undefined'?window:globalThis);
