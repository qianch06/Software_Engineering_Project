(function(root){
  'use strict';
  const inside=(b,z,pad=0)=>Math.abs(b.x-z.x)<z.w/2+pad&&Math.abs(b.y-z.y)<z.h/2+pad;
  class LevelRuntime {
    constructor(level,physics,emit=()=>{}){
      GameCore.validateLevel(level);this.level=level;this.physics=physics;this.emit=emit;this.phase='preparing';this.time=0;this.color='white';this.capture=0;this.stable=0;this.done=false;this.failed=false;this.zones={};this.doors={};this.cooldowns={};this.collectedShards=false;physics.gravity(GameCore.GRAVITY);
      const links=[...(level.links||[])];for(const z of level.sensors||[])if(z.target&&!links.some(l=>l.source===z.id&&l.target===z.target))links.push({source:z.id,target:z.target,semantic:'once'});
      this.links=new GameCore.LinkSystem(links);this.sequence=new GameCore.Sequence(level.goal?.sequence);this.colors=new GameCore.Sequence(level.goal?.colorChain);
      level.bodies.forEach(b=>physics.add(b));for(const m of level.mechanisms)if(m.type==='lever')physics.pin(m.bodyId,m.anchor);
    }
    source(id,active,x,y){
      this.links.source(id,active);
      if(active){if(this.sequence.expected.includes(id)&&!this.sequence.hit(id))this.emit('wrong',{text:'顺序还不对，请先触发 '+this.sequence.expected[this.sequence.index]});
        for(const l of this.links.links.filter(l=>l.source===id&&l.active)){const b=this.physics.get(l.target);this.emit('link',{x,y,tx:b.x,ty:b.y,time:this.time});}
      }
    }
    release(){if(this.phase==='preparing')this.phase='playing';}
    tick(dt){
      this.physics.gravity(GameCore.GRAVITY);if(this.phase!=='playing'||this.done||this.failed)return;this.time+=dt;const p=this.physics,l=this.level,gravity=GameCore.GRAVITY;
      // Fields supply mass-independent acceleration. Gravity fields replace global gravity.
      for(const b of p.all().filter(b=>!b.isStatic))for(const z of l.sensors){if((z.type==='water'||z.type==='gravityField'&&b.category==='energyBall')&&inside(b,z)){
        const edge=Math.min(z.w/2-Math.abs(b.x-z.x),z.h/2-Math.abs(b.y-z.y)),blend=Math.max(0,Math.min(1,edge/45));
        const f=z.force||{x:0,y:-1};p.acceleration(b.id,{x:(f.x-(z.type==='gravityField'?gravity.x:0))*blend,y:(f.y-(z.type==='gravityField'?gravity.y:0))*blend});
      }}
      p.gravity(gravity);p.step(dt);this.links.tick(dt);
      for(const m of l.mechanisms){const b=p.get(m.bodyId);
        if(m.type==='lever'){
          if(Math.abs(b.angle)>m.limit){p.angle(m.bodyId,Math.sign(b.angle)*m.limit);p.angularVelocity(m.bodyId,0);}
          const active=Math.abs(b.angle)>(m.triggerAngle||m.limit*.75);if(active!==!!this.zones[m.bodyId])this.source(m.bodyId,active,b.x,b.y);this.zones[m.bodyId]=active;
        }
        if(m.type==='pulley'){p.pulley(m);const a=p.get(m.bodyId),active=a.y>=(m.triggerY||m.maxY-10);if(active!==!!this.zones[m.bodyId])this.source(m.bodyId,active,a.x,a.y);this.zones[m.bodyId]=active;}
        if(m.type==='door'){
          const previous=this.doors[m.bodyId]||{t:0},requested=this.links.active(m.bodyId),allowed=requested&&(!m.requireSequence||this.sequence.complete&&this.colors.complete);
          previous.t=Math.max(0,Math.min(1,previous.t+(allowed?1:-1)*dt/(m.durationMs||450)));this.doors[m.bodyId]=previous;
          const angle=(m.openAngle??-Math.PI/2)*previous.t,half=b.h/2;
          p.angle(m.bodyId,angle);p.position(m.bodyId,{x:m.anchor.x-Math.sin(angle)*half,y:m.anchor.y+Math.cos(angle)*half});
        }
      }
      let ball=p.get('ball');
      for(const m of l.mechanisms)if(m.type==='spring'){
        const s=p.get(m.bodyId);if(Math.abs(ball.x-s.x)<s.w/2+ball.r*.5&&ball.y+ball.r>s.y-35&&ball.y<s.y&&this.time-(this.cooldowns[m.bodyId]??-1000)>650){
          p.velocity('ball',m.direction?{x:m.direction.x*m.gain,y:m.direction.y*m.gain}:{x:ball.vx,y:-m.gain});this.cooldowns[m.bodyId]=this.time;this.emit('spring',{x:s.x,y:s.y});
        }
      }
      for(const z of l.sensors){
        const touching=z.type==='pressure'?p.all().some(b=>!b.isStatic&&inside(b,z,b.r||Math.min(b.w,b.h)/2)):inside(ball,z,ball.r);
        if(touching!==!!this.zones[z.id]){
          if(touching){if(z.dye){this.color=z.dye;if(this.colors.expected.includes(z.dye)&&!this.colors.hit(z.dye))this.emit('wrong',{text:'颜色顺序不符，请返回准备调整路线。'});}if(z.type==='wash')this.color='white';this.emit('sensor',{x:ball.x,y:ball.y,color:this.color});}
          this.source(z.id,touching,z.x,z.y);this.zones[z.id]=touching;
        }
      }
      const shardBodies=l.goal?.type==='stable'?l.goal.stableBodies.map(id=>p.get(id)):[ball];
      if(l.shard&&!this.collectedShards&&shardBodies.some(b=>Math.hypot(b.x-l.shard.x,b.y-l.shard.y)<(b.r||b.w/2)+25)){this.collectedShards=true;this.emit('shard',l.shard);}
      const goal=l.goal||{type:'transport'};
      if(goal.type==='stable'){
        const settled=!p.drag&&goal.stableBodies.every(id=>{const b=p.get(id),z=goal.zone;return b.vertices.every(v=>inside(v,z,1))&&Math.hypot(b.vx,b.vy)<.25&&Math.abs(b.angularVelocity)<.01&&Math.abs(b.angle%(Math.PI/2))<.12;});
        this.stable=settled?this.stable+dt:0;if(this.stable>=goal.stableForMs)this.finish();
      }else{
        const c=l.collector,near=Math.hypot(ball.x-c.x,ball.y-c.y)<c.r-ball.r*.2,ready=this.sequence.complete&&this.colors.complete;
        if(near&&(!ready||c.acceptColor&&c.acceptColor!==this.color)){
          this.capture=0;p.velocity('ball',{x:ball.x<c.x?-7:7,y:-3});if(this.time-(this.reject||-2000)>1500){this.reject=this.time;this.emit('wrong',{text:ready?'收集器颜色不匹配，请先染色。':'请先完成显示的联动顺序。'});}
        }else if(near){p.velocity('ball',{x:ball.vx*.55+(c.x-ball.x)*.1,y:ball.vy*.55+(c.y-ball.y)*.1});this.capture+=dt;if(this.capture>=250)this.finish();}else this.capture=0;
      }
      ball=p.get('ball');const endangered=goal.type==='stable'?goal.stableBodies.map(id=>p.get(id)):[ball];
      if(!this.done&&endangered.some(b=>b.y>1010||b.x<0||b.x>1920||b.y<30||(l.deathZones||[]).some(z=>inside(b,z,b.r)))){this.failed=true;this.phase='failed';this.emit('failed',{text:'路径在这里中断了。返回准备，调整桥面、导流线或配重后再释放。'});}
    }
    finish(){if(!this.done){this.done=true;this.phase='cleared';this.emit('win',{});}}
    snapshot(){return{levelId:this.level.id,phase:this.phase,gravity:GameCore.GRAVITY,time:this.time,color:this.color,sequence:this.sequence.index,colorSequence:this.colors.index,stable:this.stable,links:this.links.links.map(l=>({...l})),bodies:this.physics.all()};}
  }
  root.LevelRuntime=LevelRuntime;
})(typeof window!=='undefined'?window:globalThis);
