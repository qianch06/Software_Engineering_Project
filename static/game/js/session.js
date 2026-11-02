(function(root){
  'use strict';
  const clone=v=>JSON.parse(JSON.stringify(v));
  function area(poly){return Math.abs(poly.reduce((a,p,i)=>{const q=poly[(i+1)%poly.length];return a+p.x*q.y-q.x*p.y;},0))/2;}
  function clip(poly,axis,value,sign){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ia=(a[axis]-value)*sign>=-1e-7,ib=(b[axis]-value)*sign>=-1e-7;if(ia)out.push(a);if(ia!==ib){const t=(value-a[axis])/(b[axis]-a[axis]);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}}return out;}
  // Sum clipping over disjoint cells in the rectangle union: includes the polygon interior, not just its corners.
  function covered(poly,zones){const xs=[...new Set(zones.flatMap(z=>[z.x-z.w/2,z.x+z.w/2]))].sort((a,b)=>a-b),ys=[...new Set(zones.flatMap(z=>[z.y-z.h/2,z.y+z.h/2]))].sort((a,b)=>a-b);let total=0;for(let i=1;i<xs.length;i++)for(let j=1;j<ys.length;j++){const x=(xs[i]+xs[i-1])/2,y=(ys[j]+ys[j-1])/2;if(!zones.some(z=>Math.abs(x-z.x)<=z.w/2&&Math.abs(y-z.y)<=z.h/2))continue;let p=poly;for(const [axis,v,s] of [['x',xs[i-1],1],['x',xs[i],-1],['y',ys[j-1],1],['y',ys[j],-1]])p=clip(p,axis,v,s);total+=area(p);}return Math.abs(total-area(poly))<.1;}
  class PuzzleSession{
    constructor(level,emit=()=>{}){GameCore.validateLevel(level);this.level=level;this.emit=emit;this.elapsed=0;this.resets=0;this.history=[];this.serial=0;this.config={artifacts:[],placements:{},scale:1};this.rebuild();}
    get phase(){return this.state;}
    rebuild(){this.physics?.dispose();this.physics=new PhysicsService();this.runtime=new LevelRuntime(this.level,this.physics,(type,data)=>{if(type==='win')this.state='cleared';if(type==='failed')this.state='failed';this.emit(type,data);});this.state='preparing';for(const [id,p] of Object.entries(this.config.placements))this.physics.position(id,p);this.physics.scale('ball',this.config.scale);for(const a of this.config.artifacts)for(const s of a.specs)this.physics.add(s);}
    used(type){return this.config.artifacts.filter(a=>a.type===type).length;}
    remember(){this.history.push(clone(this.config));}
    boardSpecs(p,angle=0){return[{id:'wood_'+this.serial,type:'rect',x:p.x,y:p.y,w:this.level.boardSpec?.w||300,h:this.level.boardSpec?.h||18,angle,isStatic:true,category:'wood'}];}
    lineSpecs(points){if(!Array.isArray(points)||points.length<2||points.some(p=>!Number.isFinite(p.x+p.y)))return[];const stride=Math.max(1,Math.ceil((points.length-1)/20)),specs=[];let length=0;for(let i=0;i<points.length-1;i+=stride){const a=points[i],b=points[Math.min(i+stride,points.length-1)],d=Math.hypot(b.x-a.x,b.y-a.y);length+=d;if(d>1)specs.push({id:'line_'+this.serial+'_'+i,type:'rect',x:(a.x+b.x)/2,y:(a.y+b.y)/2,w:d+1,h:12,angle:Math.atan2(b.y-a.y,b.x-a.x),isStatic:true,category:'line'});}return length<=1152?specs:[];}
    valid(specs){return!!specs.length&&specs.every(s=>Number.isFinite(s.x+s.y+s.angle)&&(()=>{const q=this.physics.placement(s);return!q.overlap&&covered(q.vertices,this.level.buildAreas);})());}
    add(type,points,angle=0){if(this.state!=='preparing'||!['board','line'].includes(type)||!Array.isArray(points)||!points.length||points.some(p=>!Number.isFinite(p.x+p.y))||this.used(type)>=this.level[type==='board'?'boards':'lines'])return false;if(type==='line'&&points.reduce((n,p,i)=>i?n+Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y):0,0)>1152)return false;const specs=type==='board'?this.boardSpecs(points[0],angle):this.lineSpecs(points);if(!this.valid(specs))return false;this.remember();this.config.artifacts.push({type,specs});specs.forEach(s=>this.physics.add(s));this.serial++;return true;}
    scaleBall(value){if(this.state!=='preparing'||!this.level.resizable||!Number.isFinite(value))return false;const scale=Math.max(this.level.scaleRange[0],Math.min(this.level.scaleRange[1],value)),b=this.physics.get('ball'),spec={...b,r:this.level.bodies.find(b=>b.id==='ball').r*scale};if(Math.abs(scale-this.config.scale)<.001||this.physics.placement(spec,['ball']).overlap)return false;this.remember();this.config.scale=scale;this.physics.scale('ball',scale);return true;}
    placement(id,p){if(!this.level.draggable?.includes(id)||!Number.isFinite(p.x+p.y))return null;const at=this.physics.snap(id,p),spec={...this.physics.get(id),...at};const q=this.physics.placement(spec,[id]);return{...at,valid:!q.overlap&&covered(q.vertices,this.level.placementZones[id])&&this.physics.supported(spec,id)};}
    place(id,p){if(this.state!=='preparing')return false;const at=this.placement(id,p);if(!at?.valid)return false;this.remember();this.config.placements[id]={x:at.x,y:at.y};this.physics.position(id,at);this.physics.velocity(id,{x:0,y:0});return true;}
    undo(){if(this.state!=='preparing'||!this.history.length)return false;this.config=this.history.pop();this.rebuild();return true;}
    clear(){if(this.state!=='preparing')return false;this.remember();this.config={artifacts:[],placements:{},scale:1};this.rebuild();return true;}
    release(){if(this.state!=='preparing')return false;for(const id of this.level.draggable||[]){const b=this.physics.get(id);if(!this.physics.supported(b,id))return false;}this.state='playing';this.runtime.release();return true;}
    prepare(clear=false){if(!['playing','failed','paused','preparing'].includes(this.state))return false;this.resets++;if(clear){this.config={artifacts:[],placements:{},scale:1};this.history=[];}this.rebuild();return true;}
    pause(){if(!['preparing','playing'].includes(this.state))return false;this.returnState=this.state;this.state='paused';return true;}
    resume(){if(this.state==='paused'){this.state=this.returnState;return true;}return false;}
    tick(dt){this.physics.gravity(GameCore.GRAVITY);if(['preparing','playing'].includes(this.state))this.elapsed+=dt;if(this.state==='playing')this.runtime.tick(dt);}
    dispose(){this.physics.dispose();}
  }
  root.PuzzleSession=PuzzleSession;root.PuzzleGeometry={covered};
})(typeof window!=='undefined'?window:globalThis);
