(function(root) {
  'use strict';
  const defaults=()=>({version:1,settings:{sensitivity:'mid',sound:true,vibrate:true},completed:{},shards:{},lastLevelId:null});
  class StorageService {
    constructor(adapter) { this.adapter=adapter; this.warning=''; this.data=defaults(); try {const raw=adapter.getItem('gravity-shift-v1'); if(raw) {const d=JSON.parse(raw); if(d.version!==1||!d.completed||typeof d.completed!=='object'||Array.isArray(d.completed)||!d.settings||typeof d.shards!=='object'||d.shards===null)throw Error('invalid'); this.data={...defaults(),...d,settings:{...defaults().settings,...d.settings}};} }catch(e){this.warning='存档无法读取，已使用临时新进度。';} }
    save() { try {this.adapter.setItem('gravity-shift-v1',JSON.stringify(this.data));this.warning='';return true;} catch(e){this.warning='保存失败，本次进度暂存于内存。';return false;} }
    complete(id,time,resets) {const stars=rating(time,resets),old=this.data.completed[id];this.data.completed[id]={stars:Math.max(old?.stars||0,stars),bestTimeMs:Math.min(old?.bestTimeMs??Infinity,time),resets:Math.min(old?.resets??Infinity,resets)};this.data.lastLevelId=null;this.save();return stars;}
    unlocked(index,levels) {return index===0||!!this.data.completed[levels[index-1].id];}
  }
  function rating(time,resets) { return time<=60000&&resets===0?3:time<=90000&&resets<=2?2:1; }
  class GravityController {
    constructor(){this.target={x:0,y:1};this.value={x:0,y:1};this.mode='manual';this.lastSample=0;}
    sample(x,y,now){if(!Number.isFinite(x+y))return; const a=typeof screen!=='undefined'?(screen.orientation?.angle??window.orientation??90):90;const sign=a===270||a===-90?-1:1;let gx=-y*sign,gy=-x*sign; const mag=Math.hypot(gx,gy);if(mag<0.026)gx=gy=0;const n=Math.max(1,Math.hypot(gx,gy));this.target={x:gx/n,y:gy/n};this.lastSample=now;}
    update(dt,sensitivity='mid'){const k={low:0.6,mid:1,high:1.5}[sensitivity]||1;const a=1-Math.exp(-dt/200);this.value.x+=(this.target.x*k-this.value.x)*a;this.value.y+=(this.target.y*k-this.value.y)*a;return this.value;}
  }
  function validateLevel(l){
    if(!l||!/^\w+$/.test(l.id)||!l.name||!Array.isArray(l.bodies)||l.bodies.length>220||!l.collector)throw Error('E_LEVEL_FORMAT');
    const ids=new Set();for(const b of l.bodies){if(!b.id||ids.has(b.id)||!['rect','circle'].includes(b.type)||!Number.isFinite(b.x+b.y+(b.angle||0))||(b.type==='rect'?!(b.w>0&&b.h>0):!(b.r>0)))throw Error('E_LEVEL_BODY');ids.add(b.id);}
    if(!ids.has('ball'))throw Error('E_LEVEL_BALL');
    for(const m of l.mechanisms||[])if(!ids.has(m.bodyId))throw Error('E_LEVEL_REF');
    if(l.mechanisms?.some(m=>m.type==='spring')&&l.resizable&&(l.scaleRange[0]<0.7||l.scaleRange[1]>1.3))throw Error('E_LEVEL_SCALE');
    if(l.sensors?.some(s=>s.dye)&&!l.sensors.some(s=>s.type==='wash'))throw Error('E_LEVEL_WASH');
    for(const z of l.sensors||[])if(z.target&&!ids.has(z.target))throw Error('E_LEVEL_REF');
    return l;
  }
  root.GameCore={StorageService,GravityController,rating,validateLevel};
})(typeof window!=='undefined'?window:globalThis);
