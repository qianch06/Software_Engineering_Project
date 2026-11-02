// Hand-authored spatial puzzles. Keep public-operation replays next to layouts.
module.exports=({levels,solutions,base,add,rect,ramp,ball,cube,board,line,place,scale,chapters})=>{
 const describe=(l,intro,hint,steps)=>{l.intro=intro;l.hint=hint;l.tutorial=steps.map((s,i)=>['① ','② ','③ '][i]+s);};
 const water=(id,x,y,w,h,flow=.4)=>({id,type:'water',x,y,w,h,force:{x:flow,y:0},buoyancy:1.5,label:'水面 · 浮力 →'});
 const air=(x,y,w,h)=>({id:'air',type:'air',x,y,w,h,force:{x:0,y:-2},label:'风井 ↑'});
 {
  const l=structuredClone(levels.find(l=>l.id==='ch2_l04'));l.id='ch2_l06';l.name='高处的归途';l.tag='综合 / 缩放 / 滑轮 / 分段承接';l.resizable=true;l.lines=1;
  l.bodies=l.bodies.filter(b=>b.id!=='end');l.bodies.push(rect('lintel',900,380,22,300),ramp('landing',1085,608,1310,680),ramp('end',1550,735,1730,820));
  l.buildAreas.push({x:1430,y:710,w:260,h:160});delete l.shard;
  describe(l,'终点在高处且隔着窄门和断桥。把第二章学过的能力串起来，送球回家。','先缩球并给空盘配重，抬升后穿过窄门；木板接出升降井，最后画线跨越第二个缺口。',['观察高处窄门、滑轮出口和最后的缺口，分别需要什么能力？','检查缩放、配重、出口板和最后一笔是否都准备好。','看完整路线：缩球 → 配重升高 → 穿门 → 两段承接。']);
  add(l,[scale(.55),place('weight',400,479),board(950,580,.22),line([1322,680],[1538,735])]);
 }
 {
  const l=base('ch3_l01','浮起的航道',chapters[3]);l.boardSpec={w:280,h:18};l.collector={x:1640,y:640,r:64};
  l.bodies.push(ball(300,800),rect('bed',710,940,1100,24),rect('bank',180,760,24,360),ramp('end',1430,640,1730,710));
  l.sensors=[water('water',700,770,1020,340,.35)];l.buildAreas=[{x:1280,y:640,w:320,h:180}];
  describe(l,'球在低处水中，岸在高处。水先把球托起，再把它送向出水口。','观察水面与岸的高度，在右岸缺口放一块承接板。浮力可以增加高度，下坡板做不到。',['水面会托住球；高岸不是从起点向下搭坡就能到达。','比较水面与岸沿，在右侧缺口布置出水的承接板。','观察低处小球浮起，顺水移动，再沿板上岸。']);
  add(l,[board(1280,640,0)]);
 }
 {
  const l=base('ch3_l02','风井的出口',chapters[3]);l.lines=1;l.boardSpec={w:300,h:18};l.collector={x:1670,y:680,r:64};
  l.bodies.push(ball(300,650),ramp('start',230,750,800,820),rect('wellWall',1260,725,20,390),ramp('end',1420,530,1730,780));
  l.sensors=[air(1080,640,360,560)];l.buildAreas=[{x:880,y:820,w:210,h:140},{x:1090,y:410,w:340,h:200}];l.lines=1;
  describe(l,'风能把球抬起，却不会替你选出口。用井顶导板把上升转成朝出口的运动。','画入口通到井底；井顶放一块向右上倾斜的导板，用它的下侧引导上升的球，让球离井后落到宽阔的接收台。',['低处入口、高处出口之间隔着井壁；先让球进入风井。','井顶板负责转向；没有导板，风只会向上吹。','观察球在板的下侧转向，离开风井后落到出口。']);
  add(l,[line([818,830],[960,840]),board(1090,410,-.35)]);
 }
 function dive(id,name,final=false){
  const l=base(id,name,chapters[3]);l.boards=1;l.lines=1;l.boardSpec={w:260,h:18};l.collector={x:1640,y:640,r:64};
  l.bodies.push(ball(300,650),rect('bed',700,940,1080,24),rect('bank',180,760,24,360),rect('dam',900,480,36,520));
  l.sensors=[water('water',720,770,1060,340,.55)];l.buildAreas=[{x:700,y:710,w:640,h:300},{x:1140,y:630,w:300,h:180}];
  describe(l,'堤坝封住水面，通道在水下。借水的推力，让导流线把浮球压入潜流。','在球的上方画向右下的导流线，用线的下侧将球压到坝底；穿过后浮力会使它重新浮起，再用板接岸。',['浮球会被堤坝挡住；真正的通道藏在坝底。','导流线是压低浮球的顶棚，不是托球的斜坡。出口板负责上岸。','顺水下潜 → 穿过坝底 → 浮回水面 → 上岸。']);
  if(!final){l.bodies.push(rect('retainingBank',1260,800,36,300),ramp('end',1480,655,1730,740));l.boardSpec={w:220,h:18};l.buildAreas[1]={x:1360,y:640,w:260,h:180};return add(l,[line([440,580],[1000,820]),board(1360,645,.05)]);}
  // The basin ends at the deep inlet of a separate air shaft. Neither field spans the exit bridge.
  l.sensors[0]=water('water',600,770,820,340,.55);l.sensors.push(air(1160,640,360,560));
  l.bodies.push(rect('wellWall',1310,730,20,380),ramp('hood',1020,430,1290,340),ramp('end',1520,500,1730,780));
  l.boardSpec={w:220,h:18};l.buildAreas=[{x:700,y:710,w:640,h:300},{x:1390,y:470,w:260,h:180}];l.collector={x:1670,y:680,r:64};
  describe(l,'低处水道与高处风道只有一个交接点。先潜过堤坝，再让风接住深处的小球。','复用潜流顶棚，把球从坝底送入右侧风井；风井顶部已有转向罩，只需用出口板连接高处岸沿。',['先找水道与风井在深处的交接点：直接从水面搭桥会被堤坝挡住。','检查水下顶棚和高处出口板；水负责送入，风负责升高。','潜过堤坝 → 水风交接 → 井顶转向 → 高处归岸。']);
  return add(l,[line([440,580],[1000,820]),board(1390,470,.2)]);
 }
 dive('ch3_l03','潜过堤坝');
 {
  const l=base('ch3_l04','水闸的回信',chapters[3]);l.bodies.push(ball(300,350),ramp('start',230,450,800,590),ramp('end',1120,670,1730,820),cube('float',150,810,60,.002),rect('rack',150,850,140,20),rect('dock',400,870,140,20),rect('bed',600,940,820,24),rect('stop',980,810,24,220),rect('gate',1300,540,24,600,{category:'door'}));
  l.sensors=[water('water',600,810,780,220,.4),{id:'receiver',type:'pressure',x:930,y:735,w:85,h:120,label:'接收槽'}];l.links=[{source:'receiver',target:'gate',semantic:'hold'}];l.mechanisms=[{type:'door',bodyId:'gate',anchor:{x:1300,y:240},openAngle:-Math.PI/2}];
  l.draggable=['float'];l.placementZones.float=[{x:150,y:810,w:100,h:65},{x:400,y:830,w:120,h:65}];l.buildAreas=[{x:960,y:630,w:360,h:190}];
  describe(l,'上层球路被水闸挡住，开关在下层水道。让浮块乘水送信，再让球通过上层桥。','将浮块放到水中装载台。浮力与水流会把它送到右侧接收槽，持续触发开关；另用木板接好上层球路。',['上层运球、下层运浮块，两条路线通过水闸联系。','把浮块送入水道，并给上层球路搭桥；不能把浮块直接放到开关。','浮块抵达接收槽 → 水闸开启 → 上层小球入仓。']);
  add(l,[place('float',400,830),board(960,630,Math.atan2(80,320))]);
 }
 dive('ch3_l05','风水相接',true);
 const labels={
  ch2_l06:[{x:850,y:315,text:'高处窄门'},{x:1110,y:590,text:'中途承接台'}],
  ch3_l01:[{x:1480,y:605,text:'高岸接收台'}],
  ch3_l02:[{x:1270,y:720,text:'井壁'},{x:1470,y:505,text:'高处接收台'}],
  ch3_l03:[{x:840,y:350,text:'堤坝'},{x:805,y:885,text:'水下通道'},{x:1290,y:610,text:'出水承接'}],
  ch3_l04:[{x:325,y:915,text:'浮块装载台'},{x:1040,y:700,text:'下层送信 · 上层运球'}],
  ch3_l05:[{x:840,y:350,text:'堤坝'},{x:795,y:885,text:'水下通道'},{x:1030,y:910,text:'水 → 风交接'},{x:1390,y:385,text:'高处出口'}]
 };
 for(const l of levels.filter(l=>l.id==='ch2_l06'||l.id.startsWith('ch3')))l.shard={x:l.collector.x,y:l.collector.y};
 for(const l of levels)if(labels[l.id])l.annotations=labels[l.id];
};
