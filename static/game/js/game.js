(function boot(){
  if(!window.GamePlatform?.ready){document.addEventListener('game-platform-ready',boot,{once:true});return;}
  const NORMAL_LEVELS=LEVELS.slice();
  LEVELS.push(...NORMAL_LEVELS.filter(l=>l.id.startsWith('ch')).map(GameCore.inverseLevel));
  'use strict';
  const $=id=>document.getElementById(id),{StorageService,GravityController,validateLevel}=GameCore;
  const storage=new StorageService(GamePlatform.storage);
  const renderer=new Renderer($('world')),gravity=new GravityController(),ui=new InteractionFX($('app'));
  const g={storage,physics:null,level:null,index:0,state:'menu',tool:'move',elapsed:0,resets:0,history:[],links:[],boardAngle:0,ballColor:'white',capture:0,preview:null,stroke:[],pointers:new Map(),keys:new Set(),sensorStarted:0};
  let last=0,acc=0,toastTimer,audio,serial=0;
  const clock=ms=>`${String(Math.floor(ms/60000)).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`;
  function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4500);}
  function sound(kind){if(!storage.data.settings.sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),v=audio.createGain();o.type='sine';o.frequency.setValueAtTime(kind==='win'?660:kind==='bad'?150:440,audio.currentTime);o.frequency.exponentialRampToValueAtTime(kind==='bad'?90:880,audio.currentTime+.18);v.gain.setValueAtTime(.06,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.25);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+.26);}catch(e){}if(storage.data.settings.vibrate)try{GamePlatform.vibrate(kind==='win'?40:12);}catch(e){} }
  function save(){if(!storage.save()){toast(storage.warning);setTimeout(()=>{if(!storage.save())setTimeout(()=>storage.save(),1000);},1000);}}
  function cancelGesture(){g.physics?.endDrag();g.dragCube=null;g.pointers.clear();g.preview=null;g.stroke=[];g.dragging=false;g.pinch=null;g.keys.clear();g.joyPointer=null;}
  function showScreen(name){ui.transition(()=>{if(name!=='play')$('chain-progress').classList.add('hidden');for(const id of ['menu','select','play'])$(id).classList.toggle('hidden',id!==name);document.body.classList.toggle('playing',name==='play');$('modal').classList.add('hidden');cancelGesture();});}
  function modal(html){$('modal-content').innerHTML=html;$('modal').classList.remove('hidden');cancelGesture();}
  function closeModal(){$('modal').classList.add('hidden');}
  function btn(text,action,cls='secondary'){return `<button class="${cls}" data-action="${action}">${text}</button>`;}
  function menu(){g.state='menu';showScreen('menu');$('continue').classList.toggle('hidden',!LEVELS.some(l=>l.id===storage.data.lastLevelId));}
  function select(){
    g.state='select';showScreen('select');$('level-list').innerHTML='';
    const chapters=[...new Set(LEVELS.filter(l=>!l.inverse||storage.inverseUnlocked()).map(l=>l.chapter))];
    const activeChapter=chapters.find(chapter=>LEVELS.some((l,i)=>l.chapter===chapter&&storage.unlocked(i,LEVELS)&&!storage.data.completed[l.id]))||chapters[0];
    chapters.forEach((chapter,chapterIndex)=>{
      const section=document.createElement('section');
      section.className='level-sector'+(chapter.includes('倒映')?' inverse-sector':'')+(chapter===activeChapter?'':' collapsed');
      const heading=document.createElement('button');heading.type='button';heading.className='level-group-title';heading.setAttribute('aria-controls',`sector-${chapterIndex}`);
      heading.innerHTML=`<i></i><span>${chapter}</span><small>SECTOR LINK / ${LEVELS.filter(l=>l.chapter===chapter).length} NODES</small><b class="sector-toggle" aria-hidden="true"></b>`;
      section.appendChild(heading);
      const shell=document.createElement('div');shell.className='level-grid-shell';shell.id=`sector-${chapterIndex}`;
      const grid=document.createElement('div');grid.className='level-grid';
      LEVELS.forEach((l,i)=>{
        if(l.chapter!==chapter)return;
        const open=storage.unlocked(i,LEVELS),record=storage.data.completed[l.id],b=document.createElement('button');
        b.className='level-card'+(open?'':' locked')+(record?' completed':'');
        b.innerHTML=`<span class="node-marker"><i></i></span><span class="number">NODE ${String(i+1).padStart(2,'0')} ${open?'↗':'⌑'}</span><span class="stars">${record?'★'.repeat(record.stars)+'☆'.repeat(3-record.stars):'· · ·'}</span><strong>${l.name}</strong><span class="tag">${l.tag}</span><span class="node-state">${record?'SYNCHRONIZED':open?'AVAILABLE':'LOCKED'}</span>`;
        b.onclick=()=>open?start(i):toast('请先完成前置实验节点。');grid.appendChild(b);
      });
      shell.appendChild(grid);section.appendChild(shell);$('level-list').appendChild(section);
    });
    $('total-stars').textContent=`★ ${LEVELS.filter(l=>!l.inverse||storage.inverseUnlocked()).reduce((n,l)=>n+(Number(storage.data.completed[l.id]?.stars)||0),0)} / ${(storage.inverseUnlocked()?LEVELS.length:NORMAL_LEVELS.length)*3}　　◈ ${Object.keys(storage.data.shards).length} / 15 枚碎片`;
    ui.enhanceLevels($('level-list'),$('select'));
  }
  function start(i,retry=false){
    try{validateLevel(LEVELS[i]);}catch(e){toast('关卡数据校验失败：'+e.message);return;}
    if(!retry){g.elapsed=0;g.resets=0;}else g.resets++;
    g.physics?.dispose();g.physics=new PhysicsService();g.level=LEVELS[i];g.index=i;g.state='playing';g.tool='move';g.history=[];g.links=[];g.openDoors={};g.springTimes={};g.zones={};g.ballColor='white';g.capture=0;g.boardAngle=0;g.usedLine=false;g.hadBridge=false;renderer.fx=[];acc=0;
    gravity.target={...(g.level.initialGravity||{x:0,y:1})};gravity.value={...gravity.target};gravity.mode=storage.data.settings.controlMode;if(gravity.mode==='sensor'){g.sensorStarted=performance.now();gravity.lastSample=0;}
    g.runtime=new LevelRuntime(g.level,g.physics,onRuntimeEvent);g.openDoors=g.runtime.doors;
    showScreen('play');$('level-name').textContent=g.level.name;$('chapter-label').textContent=g.level.chapter;$('scale-tools').classList.toggle('hidden',!g.level.resizable);$('goal-label').textContent='◉ 0 / 1';$('sensor').textContent=gravity.mode==='sensor'?'圆盘操控':'启用倾斜';g.storage.data.lastLevelId=g.level.id;save();updateHud();toast(g.level.intro);
  }
  function used(type){return g.history.filter(h=>h.type===type).length;}
  function updateHud(){if(!g.level)return;$('timer').textContent=clock(g.elapsed);$('boards').textContent=g.level.boards-used('board');$('lines').textContent=g.level.lines-used('line');$('tool-board').disabled=g.level.boards<=used('board');$('tool-line').disabled=g.level.lines<=used('line');$('undo').disabled=!g.history.length;$('clear').disabled=!g.history.length;for(const t of ['move','board','line'])$('tool-'+t).classList.toggle('active',g.tool===t);const b=g.physics.get('ball');$('scale-label').textContent=(b?.scale||1).toFixed(1)+'×';const v=gravity.value,n=Math.max(1,Math.hypot(v.x,v.y));$('knob').style.transform=`translate(${v.x/n*25}px,${v.y/n*25}px)`;
    let step=0;const l=g.level;
    if(l.id==='tut_grav')step=b.x>1250?2:b.x>420?1:0;
    if(l.id==='tut_mech')step=g.hadBridge?2:b.x>480?1:0;
    if(l.id==='tut_hand')step=g.usedLine&&b.scale<=.6?2:b.scale<=.6?1:0;
    $('step-num').textContent=String(step+1).padStart(2,'0');$('step-title').textContent=l.tutorial?'引导 / '+(step+1)+' OF 3':'当前目标';$('instruction').textContent=l.tutorial?l.tutorial[step]:'将能量球送入'+(l.collector.acceptColor==='blue'?'蓝色':'绿色')+'收集器';
    const goal=l.goal||{};const stable=goal.type==='stable';$('goal-label').textContent=stable?'稳定 '+(Math.min(g.runtime.stable,goal.stableForMs)/1000).toFixed(1)+' / '+goal.stableForMs/1000+' 秒':'◉ 0 / 1';
    if(stable)$('instruction').textContent='拖动三个方块至虚线框内堆叠，松手后保持稳定 3 秒';
    $('rotate-board').classList.toggle('hidden',g.tool!=='board');
    const seq=g.runtime.sequence,col=g.runtime.colors,chain=$('chain-progress');chain.classList.toggle('hidden',!seq.expected.length&&!col.expected.length);chain.innerHTML=(seq.expected.length?seq.expected.map((id,i)=>`<span class="${i<seq.index?'done':''}">${id} ${i<seq.index?'✓':'→'}</span>`).join(''):'')+(col.expected.length?col.expected.map((id,i)=>`<span class="${i<col.index?'done':''}">${{red:'红',yellow:'黄',blue:'蓝'}[id]} ${i<col.index?'✓':'→'}</span>`).join(''):'')+(seq.mistake||col.mistake?'<span class="mistake">错序：'+(seq.mistake||col.mistake)+'</span>':'');
    $('control-label').textContent=gravity.mode==='sensor'?'重力方向 · 倾斜控制':'重力方向 · 拖动控制';
  }
  function setTool(t){if(g.state!=='playing')return;if(t==='board'&&used('board')>=g.level.boards||t==='line'&&used('line')>=g.level.lines)return;cancelGesture();g.tool=t;updateHud();if(t==='board')toast('在场景中拖动并松手放置木板；滚轮或 Q / E 可旋转。');if(t==='line')toast('在场景中画线，松手后成为实体。每条最长 1152，限时 5 秒。');}
  function scaleBall(scale,record=true){if(g.state!=='playing'||!g.level.resizable)return;const old=g.physics.get('ball').scale,[min,max]=g.level.scaleRange;scale=Math.max(min,Math.min(max,scale));if(Math.abs(old-scale)<.001)return;if(record)g.history.push({type:'scale',before:old});g.physics.scale('ball',scale);updateHud();}
  function undo(){if(g.state!=='playing')return;const h=g.history.pop();if(!h)return;if(h.type==='scale')g.physics.scale('ball',h.before);else h.ids.forEach(id=>g.physics.remove(id));updateHud();}
  function artifact(type,points){
    const ids=[];if(type==='board'){if(used('board')>=g.level.boards)return;const p=points[0],id='wood_'+serial++;g.physics.add({id,type:'rect',x:p.x,y:p.y,w:340,h:24,angle:g.boardAngle,isStatic:true,category:'wood'});ids.push(id);g.hadBridge=true;}
    else {if(used('line')>=g.level.lines||points.length<2)return;const stride=Math.max(1,Math.ceil((points.length-1)/20));for(let i=0;i<points.length-1;i+=stride){const a=points[i],b=points[Math.min(i+stride,points.length-1)],len=Math.hypot(a.x-b.x,a.y-b.y);if(len<5)continue;const id='line_'+serial++;g.physics.add({id,type:'rect',x:(a.x+b.x)/2,y:(a.y+b.y)/2,w:len+5,h:12,angle:Math.atan2(b.y-a.y,b.x-a.x),isStatic:true,category:'line'});ids.push(id);}g.usedLine=true;}
    if(ids.length){g.history.push({type,ids});sound('ok');}g.preview=null;g.stroke=[];if(used(type)>=(type==='board'?g.level.boards:g.level.lines))g.tool='move';updateHud();
  }
  function pause(){if(g.state!=='playing')return;g.state='paused';acc=0;save();modal(`<div class="modal-code">SYSTEM / PAUSED</div><p class="eyebrow"><i></i> SIMULATION SUSPENDED</p><h2>实验已暂停</h2><p>重力场已冻结，当前实验进度已保存。</p>${btn('恢复实验','resume','primary')}${btn('重新初始化','retry')}${btn('系统设置','settings')}${btn('返回实验节点','select','flat')}${btn('返回主控界面','menu','flat')}${GamePlatform.native?btn('退出游戏','exit','flat'):''}`);}
  function win(){g.state='cleared';const stars=storage.complete(g.level.id,g.elapsed,g.resets,g.level.goal?.starTimesMs);if(storage.warning)toast(storage.warning);sound('win');const c=g.level.collector;renderer.burst(c.x,c.y,'#62e6ff',90);modal(`<div class="result-core"><i></i><span></span></div><p class="eyebrow"><i></i> CORE SYNCHRONIZED</p><h2>空间结构已稳定</h2><div class="result-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><p>${g.level.name} · 能量核心激活，实验数据已归档。</p><div class="result-stats"><span>实验用时 ${clock(g.elapsed)}</span><span>重置 ${g.resets} 次</span></div>${g.index<(g.level.inverse?LEVELS.length:NORMAL_LEVELS.length)-1?btn('进入下一节点 →','next','primary'):btn('返回实验节点','select','primary')}${btn('重新实验','replay')}${btn('返回选关','select','flat')}`);}
  function fail(message){if(g.state!=='playing')return;g.state='failed';sound('bad');modal(`<p class="eyebrow">TRY ANOTHER DIRECTION</p><h2>换一个方向</h2><p>${message}</p>${btn('回到起点','retry','primary')}${btn('查看提示','hint','flat')}${btn('返回选关','select','flat')}`);}
  function settings(){
    const wasPlaying=g.state==='playing';if(wasPlaying)pause();g.settingsReturn=g.state;const s=storage.data.settings;
    modal(`<p class="eyebrow">MAKE IT YOURS</p><h2>偏好设置</h2><div class="setting-row"><span>重力灵敏度</span><select id="sensitivity" aria-label="重力灵敏度"><option value="low">低 · 0.6×</option><option value="mid">中 · 1.0×</option><option value="high">高 · 1.5×</option></select></div><div class="feedback-options"><label class="setting-row check-row feedback-master"><span>交互反馈<small>统一控制音效与触觉</small></span><input id="feedback-all" type="checkbox" aria-label="全部交互反馈"><i class="checkmark" aria-hidden="true"></i></label><label class="setting-row check-row feedback-child"><span>空间音效</span><input id="setting-sound" type="checkbox"><i class="checkmark" aria-hidden="true"></i></label><label class="setting-row check-row feedback-child"><span>触觉反馈</span><input id="setting-vibrate" type="checkbox"><i class="checkmark" aria-hidden="true"></i></label></div><p>三星需在关卡目标用时内、零重置；二星允许两次重置。堆叠与组合关有更宽松的用时目标，点 ? 查看。</p><div class="setting-row"><span>触控灵敏度</span><select id="touch-sensitivity" aria-label="触控灵敏度"><option value="0.7">低</option><option value="1">中</option><option value="1.3">高</option></select></div><div class="setting-row"><span>默认操控</span><select id="control-mode" aria-label="默认操控"><option value="manual">重力圆盘</option><option value="sensor">设备倾斜</option></select></div>${g.level?btn('校准倾斜中立位置','calibrate','flat'):''}${btn('保存并返回','settings-close','primary')}${btn('重置所有进度','erase-confirm','flat danger')}`);
    $('sensitivity').value=s.sensitivity;$('sensitivity').onchange=e=>{s.sensitivity=e.target.value;save();};
    $('touch-sensitivity').value=s.touchSensitivity;$('touch-sensitivity').onchange=e=>{s.touchSensitivity=Number(e.target.value);save();};
    $('control-mode').value=s.controlMode;$('control-mode').onchange=e=>{s.controlMode=e.target.value;gravity.mode=s.controlMode;g.sensorStarted=performance.now();save();};
    const all=$('feedback-all'),soundInput=$('setting-sound'),vibrateInput=$('setting-vibrate');
    const syncFeedback=()=>{soundInput.checked=s.sound;vibrateInput.checked=s.vibrate;all.checked=s.sound&&s.vibrate;all.indeterminate=s.sound!==s.vibrate;all.setAttribute('aria-checked',all.indeterminate?'mixed':String(all.checked));};
    all.onchange=()=>{s.sound=all.checked;s.vibrate=all.checked;save();syncFeedback();const panel=document.querySelector('.feedback-options');panel.classList.remove('feedback-synced');requestAnimationFrame(()=>panel.classList.add('feedback-synced'));};
    soundInput.onchange=()=>{s.sound=soundInput.checked;save();syncFeedback();};vibrateInput.onchange=()=>{s.vibrate=vibrateInput.checked;save();syncFeedback();};syncFeedback();
  }
  function onRuntimeEvent(type,data){
    if(type==='win')win();
    if(type==='failed')fail(data.text);
    if(type==='wrong'){toast(data.text);sound('bad');}
    if(type==='link'){g.links.push({...data,time:performance.now()});sound('ok');}
    if(type==='spring'||type==='sensor'){renderer.burst(data.x,data.y,type==='spring'?'#c1abd9':'#a5d4b5',18);sound('ok');}
    if(type==='shard'&&!storage.data.shards[g.level.id]){storage.data.shards[g.level.id]=true;save();renderer.burst(data.x,data.y,'#dfc382',40);toast('拾得能量碎片 ◈ 已永久保存'+(storage.inverseUnlocked()?' · 倒映章已开启':''));sound('win');}
  }
  function step(dt){
    if(g.state!=='playing')return;
    if(gravity.mode==='sensor'&&performance.now()-(gravity.lastSample||g.sensorStarted)>3000){gravity.mode='manual';gravity.target={x:0,y:1};$('sensor').textContent='启用倾斜';toast('未检测到倾斜数据，已切换为圆盘操控。');}
    let x=0,y=0;for(const key of g.keys){if(['arrowleft','a'].includes(key))x--;if(['arrowright','d'].includes(key))x++;if(['arrowup','w'].includes(key))y--;if(['arrowdown','s'].includes(key))y++;}
    if(x||y){const n=Math.hypot(x,y);gravity.target={x:x/n,y:y/n};gravity.mode='manual';}
    g.elapsed+=dt;g.runtime.tick(dt,gravity.update(dt,storage.data.settings.sensitivity));g.ballColor=g.runtime.color;
    g.links=g.links.filter(f=>performance.now()-f.time<900);
  }
  $('world').addEventListener('pointerdown',e=>{if(g.state!=='playing')return;const p=renderer.point(e.clientX,e.clientY);if(p.y<230||p.y>935||p.x<60||p.x>1860)return;e.preventDefault();$('world').setPointerCapture(e.pointerId);if(g.pointers.size>=2)return;g.pointers.set(e.pointerId,p);
    if(g.pointers.size===2){g.physics.endDrag();g.dragCube=null;g.preview=null;g.stroke=[];g.dragging=false;const [a,b]=[...g.pointers.values()],ball=g.physics.get('ball');if(g.level.resizable&&Math.min(Math.hypot(a.x-ball.x,a.y-ball.y),Math.hypot(b.x-ball.x,b.y-ball.y))<ball.r+100){g.pinch={dist:Math.hypot(a.x-b.x,a.y-b.y),scale:ball.scale};g.history.push({type:'scale',before:ball.scale});}return;}
    if(g.tool==='move'){const cube=(g.level.draggable||[]).map(id=>g.physics.get(id)).find(b=>Math.abs(p.x-b.x)<b.w/2+20&&Math.abs(p.y-b.y)<b.h/2+20);if(cube){g.dragCube=cube.id;g.physics.startDrag(cube.id,p);return;}}
    if(g.tool==='board'){g.preview=p;g.dragging=true;}else if(g.tool==='line'){g.preview=p;g.stroke=[p];g.strokeStart=performance.now();g.strokeLen=0;g.dragging=true;}else if(Math.hypot(p.x-g.physics.get('ball').x,p.y-g.physics.get('ball').y)>80){g.dragOrigin=p;g.dragging=true;}
  });
  $('world').addEventListener('pointermove',e=>{if(g.state!=='playing'||!g.pointers.has(e.pointerId))return;const raw=renderer.point(e.clientX,e.clientY),p={x:Math.max(60,Math.min(1860,raw.x)),y:Math.max(235,Math.min(930,raw.y))};g.pointers.set(e.pointerId,p);if(g.dragCube){g.physics.dragTo(p);return;}if(g.pointers.size===2){if(g.pinch){const[a,b]=[...g.pointers.values()];scaleBall(g.pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,g.pinch.dist),false);}return;}if(!g.dragging)return;if(g.tool==='board')g.preview=p;else if(g.tool==='line'){const prev=g.stroke[g.stroke.length-1],len=Math.hypot(p.x-prev.x,p.y-prev.y);if(len>10&&g.strokeLen+len<=1152&&performance.now()-g.strokeStart<5000){g.stroke.push(p);g.strokeLen+=len;}}else{const x=p.x-g.dragOrigin.x,y=p.y-g.dragOrigin.y,n=Math.max(60/storage.data.settings.touchSensitivity,Math.hypot(x,y));gravity.mode='manual';gravity.target={x:x/n,y:y/n};}});
  function pointerEnd(e){if(!g.pointers.has(e.pointerId))return;if(g.dragCube){g.physics.endDrag();g.dragCube=null;}const isSingle=g.pointers.size===1;g.pointers.delete(e.pointerId);if(g.state==='playing'&&g.dragging&&isSingle){if(g.tool==='board'&&g.preview)artifact('board',[g.preview]);if(g.tool==='line'&&g.stroke.length>1)artifact('line',g.stroke);}g.dragging=false;g.pinch=null;g.preview=null;g.stroke=[];}
  $('world').addEventListener('pointerup',pointerEnd);$('world').addEventListener('pointercancel',()=>cancelGesture());
  $('world').addEventListener('wheel',e=>{if(g.state!=='playing')return;e.preventDefault();if(g.tool==='board')g.boardAngle+=Math.sign(e.deltaY)*.1;else if(g.level.resizable)scaleBall(g.physics.get('ball').scale*(e.deltaY>0?.9:1.1));},{passive:false});
  function joy(e){if(g.state!=='playing')return;const r=$('joystick').getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,n=Math.max(r.width*.35,Math.hypot(x,y));gravity.mode='manual';gravity.target={x:x/n,y:y/n};$('sensor').textContent='启用倾斜';}
  $('joystick').onpointerdown=e=>{if(g.state!=='playing')return;g.joyPointer=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);joy(e);};$('joystick').onpointermove=e=>{if(e.pointerId===g.joyPointer)joy(e);};$('joystick').onpointerup=()=>g.joyPointer=null;$('joystick').onpointercancel=()=>g.joyPointer=null;
  function sensorSample(x,y){if(gravity.mode==='sensor')gravity.sample(x,y,performance.now());}
  $('sensor').onclick=async()=>{if(g.state!=='playing')return;if(gravity.mode==='sensor'){gravity.mode='manual';storage.data.settings.controlMode='manual';save();$('sensor').textContent='启用倾斜';return;}try{if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission==='function'){if(await DeviceMotionEvent.requestPermission()!=='granted')throw Error('denied');}gravity.mode='sensor';storage.data.settings.controlMode='sensor';save();gravity.lastSample=0;g.sensorStarted=performance.now();$('sensor').textContent='圆盘操控';toast('倾斜设备来改变重力；无数据时会自动回到圆盘操控。');}catch(e){gravity.mode='manual';toast('无法使用传感器，请用圆盘操控。');}};
  window.addEventListener('devicemotion',e=>{const a=e.accelerationIncludingGravity;if(a)sensorSample((a.x||0)/9.81,(a.y||0)/9.81);});
  window.addEventListener('native-input',e=>{const d=e.detail;if(d.type==='pause')pause();if(d.type==='back'){if(g.state==='playing')pause();else if(g.state==='menu')modal(`<h2>离开空间？</h2><p>进度已保存在本机。</p>${btn('退出游戏','exit','primary')}${btn('留在这里','menu')}`);else menu();}if(d.type==='sensor')sensorSample(d.data.x,d.data.y);if(d.type==='sensor-error'&&gravity.mode==='sensor'){gravity.mode='manual';toast('倾斜不可用，已切换圆盘操控。');}});
  window.addEventListener('keydown',e=>{if(e.target.tagName==='SELECT')return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='escape'||k===' '){if(g.state==='playing')pause();else if(g.state==='paused'&&$('sensitivity')===null){closeModal();g.state='playing';}return;}if(g.state!=='playing')return;g.keys.add(k);if(e.repeat)return;if(k==='r')start(g.index,true);if(k==='z')undo();if(k==='1')setTool('move');if(k==='2')setTool('board');if(k==='3')setTool('line');if(k==='q')g.boardAngle-=.1;if(k==='e')g.boardAngle+=.1;if(k==='-'||k==='_')scaleBall(g.physics.get('ball').scale-.1);if(k==='+'||k==='=')scaleBall(g.physics.get('ball').scale+.1);});
  window.addEventListener('keyup',e=>g.keys.delete(e.key.toLowerCase()));document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',()=>pause());document.addEventListener('pause',()=>pause());window.addEventListener('resize',()=>{if(innerHeight>innerWidth)pause();});
  $('modal').addEventListener('click',e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(!a)return;
    if(a==='resume'){closeModal();g.state='playing';last=performance.now();acc=0;}
    if(a==='retry')start(g.index,true);if(a==='replay')start(g.index);if(a==='next')start(g.index+1);if(a==='menu')menu();if(a==='select')select();if(a==='settings')settings();if(a==='hint')toast(g.level.hint);
    if(a==='calibrate'){gravity.calibrate();toast('已将当前姿态设为中立位置。');}if(a==='settings-close'){if(g.settingsReturn==='paused'){g.state='playing';pause();}else menu();}
    if(a==='erase-confirm')modal(`<p class="eyebrow">RESET PROGRESS</p><h2>重新开始旅程？</h2><p>将清除本机的全部星级、解锁、碎片和最近关卡。此操作无法撤销。</p>${btn('确认清除','erase','secondary danger')}${btn('保留进度','settings','primary')}`);
    if(a==='erase'){storage.reset();menu();toast('进度已清除，新的旅程开始了。');}
    if(a==='exit')GamePlatform.exit();if(a==='close-about')menu();if(a==='debug-close')closeModal();
  });
  $('start').onclick=select;$('continue').onclick=()=>start(LEVELS.findIndex(l=>l.id===storage.data.lastLevelId));$('home').onclick=e=>{e.preventDefault();if(g.state==='playing')pause();else menu();};$('pause').onclick=pause;$('reset').onclick=()=>start(g.index,true);$('hint').onclick=()=>toast(g.level.hint+' 三星目标：'+((g.level.goal?.starTimesMs||[60000])[0]/1000)+' 秒内、零重置。');$('undo').onclick=undo;$('clear').onclick=()=>{while(g.history.length)undo();};$('rotate-board').onclick=()=>{if(g.state==='playing'){g.boardAngle+=Math.PI/12;toast('木板角度 '+Math.round(g.boardAngle*180/Math.PI)+'°');}};$('smaller').onclick=()=>scaleBall(g.physics.get('ball').scale-.1);$('larger').onclick=()=>scaleBall(g.physics.get('ball').scale+.1);
  for(const t of ['move','board','line'])$('tool-'+t).onclick=()=>setTool(t);
  document.querySelector('[data-open="settings"]').onclick=settings;document.querySelector('[data-open="about"]').onclick=()=>modal(`<p class="eyebrow">GRAVITY SHIFT / 0.2</p><h2>失衡空间</h2><p>一款关于重力、空间与微小可能的物理解谜游戏。用倾斜、搭桥与画线，将能量球送回收集器。</p><p>本版收录三关教学、三章十五关与十五个倒映关。采用 Canvas 2D 与 Matter.js 0.20.0（MIT），全部内容离线运行。</p><p>桌面：方向键 / WASD 控制重力，1 / 2 / 3 切换工具，− / + 缩放，Q / E 旋转木板，Z 撤销，R 重置，空格暂停。触屏：拖动圆盘，双指捏合小球；堆叠关可拖动方块。</p>${btn('回到空间','close-about','primary')}`);
  function frame(t){const dt=Math.max(0,Math.min(t-last||16.67,50));last=t;if(g.state==='playing'){acc+=dt;try{while(acc>=1000/60&&g.state==='playing'){step(1000/60);acc-=1000/60;}if(g.tool==='line'&&g.dragging&&t-g.strokeStart>=5000){artifact('line',g.stroke);cancelGesture();}updateHud();}catch(e){console.error(e);fail('物理计算遇到了异常。请回到起点，再试一次。');}}else acc=0;if(g.level&&['playing','paused','cleared','failed'].includes(g.state))renderer.game(g,t);else renderer.menu(t);requestAnimationFrame(frame);}
  if(new URLSearchParams(location.search).get('debug')==='1'){
    window.__demo={g,start,step,setTool,scaleBall,undo,artifact,storage,gravity,pause,select};
    const panel=$('debug-panel');panel.classList.remove('hidden');panel.innerHTML='<span id="debug-state"></span><button id="debug-step">单步</button><button id="debug-export">快照</button>';
    setInterval(()=>{$('debug-state').textContent=g.state+' | bodies '+(g.physics?.items.size||0)+' | '+gravity.mode;},300);
    $('debug-step').onclick=()=>{if(g.state==='paused'){g.state='playing';step(1000/60);if(g.state==='playing')g.state='paused';updateHud();}};
    $('debug-export').onclick=()=>{if(!g.runtime)return;const url=URL.createObjectURL(new Blob([JSON.stringify(g.runtime.snapshot(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='gravity-snapshot.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  }
  menu();if(storage.warning)toast(storage.warning);requestAnimationFrame(frame);
})();
