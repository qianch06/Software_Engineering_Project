// Authoring layouts and public preparation actions for the fixed-gravity campaign.
// Run explicitly to regenerate data; ordinary JSON edits only need build-levels.cjs.
const fs=require('node:fs'),path=require('node:path');
const levels=[],solutions={};
const rect=(id,x,y,w,h,extra={})=>({id,type:'rect',x,y,w,h,isStatic:true,category:'terrain',...extra});
const ramp=(id,ax,ay,bx,by,h=20)=>rect(id,(ax+bx)/2,(ay+by)/2,Math.hypot(bx-ax,by-ay),h,{angle:Math.atan2(by-ay,bx-ax)});
const ball=(x,y,r=24)=>({id:'ball',type:'circle',x,y,r,category:'energyBall',friction:.001,frictionAir:.001,restitution:0});
const cube=(id,x,y,size=60,density=.015)=>rect(id,x,y,size,size,{isStatic:false,category:'taskCube',friction:.8,frictionAir:.005,restitution:0,density});
const board=(x,y,angle=Math.atan2(80,320))=>({type:'board',points:[{x,y}],angle});
const line=(...points)=>({type:'line',points:points.map(([x,y])=>({x,y}))});
const place=(id,x,y)=>({type:'place',id,point:{x,y}});
const scale=value=>({type:'scale',value});
function base(id,name,chapter){return{id,name,chapter,rulesVersion:3,tag:'搭建 / 释放',intro:'先观察落差和路径，准备好后点击「释放」。',hint:'世界重力始终向下。木板和画线负责支撑，配重负责驱动机关。',boards:1,lines:0,boardSpec:{w:300,h:18},scaleRange:[.4,2],initialGravity:{x:0,y:1},buildAreas:[{x:960,y:620,w:1600,h:550}],placementZones:{},draggable:[],collector:{x:1640,y:760,r:64},mechanisms:[],sensors:[],links:[],deathZones:[],goal:{type:'transport',starTimesMs:[90000,150000]},bodies:[rect('left',50,580,40,720),rect('right',1870,580,40,720),rect('ceiling',960,220,1800,20)]};}
function add(l,actions){if(l.id.startsWith('ch')&&!l.shard){const x=l.collector.x-100,end=l.bodies.find(b=>b.id==='end'),r=l.bodies.find(b=>b.id==='ball').r;l.shard={x,y:end?end.y+(x-end.x)*Math.tan(end.angle||0)-(r+end.h/2)/Math.cos(end.angle||0):l.collector.y-5};}levels.push(l);solutions[l.id]=actions;return l;}
const chapters=['序章 · 构筑第一条路','第一章 · 微光的轨迹','第二章 · 空间的形状','第三章 · 风与水的工坊'];
function bridge(id,name,chapter,{two=false,draw=false,small=false}={}){
 const l=base(id,name,chapters[chapter]);l.tag=draw?'画线 / 导流':two?'双板 / 跨越':'斜坡 / 搭桥';l.lines=draw?2:0;l.boards=draw?0:two?2:1;
 const a=two?650:800,b=two?1250:1120,ay=two?520:590,by=two?670:670;
 l.bodies.push(ball(300,350,small?32:24),ramp('start',230,450,a,ay),ramp('end',b,by,1730,820));
 l.buildAreas=[{x:(a+b)/2,y:(ay+by)/2+10,w:b-a+130,h:220}];
 l.intro=draw?'在薄荷色区域画一段缓坡，接住球并越过缺口。':two?'两块木板接成下坡桥，填好宽缺口后再释放。':'把木板转成右低左高的缓坡，接上两端道路。';l.hint=draw?'建议沿左平台出口到右平台入口画线，注意不要穿入地形。':'选木板，Q / E 或 ⤾ 旋转；金色虚线提示缺口，木板落点必须在建造区内。';
 l.bridgeGuide={x:(a+b)/2,y:(ay+by)/2,w:b-a};
 let actions=draw?[line([a+18,ay],[b-18,by])]:two?[board(800,557.5,Math.atan2(150,600)),board(1100,632.5,Math.atan2(150,600))]:[board(960,630)];
 if(small){l.resizable=true;l.lines=1;l.boards=0;l.tag='缩放 / 窄缝 / 导流';l.bodies.push(rect('wallTop',650,370,18,270));l.intro='先把球缩小到 0.45 倍穿过窄缝，再画坡连接缺口。';l.hint='用 − 或双指捏合缩小球；上方墙体封住了绕行路线。缩放和画线都在释放前完成。';actions=[scale(.45),line([818,590],[1102,670])];}
 return add(l,actions);
}
function lever(id,name,chapter){
 const l=base(id,name,chapters[chapter]);l.tag='配重 / 跷跷板';l.boards=1;
 l.bodies.push(ball(555,680),rect('lever',720,720,500,22,{isStatic:false,category:'lever',density:.003,friction:.1,frictionAir:.01}),cube('weight',340,790,60,.035),rect('rack',340,830,160,20),ramp('end',980,640,1730,670));
 l.collector={x:1640,y:600,r:64};l.mechanisms=[{type:'lever',bodyId:'lever',anchor:{x:720,y:720},limit:.55}];
 l.draggable=['weight'];l.placementZones.weight=[{x:340,y:790,w:150,h:65},{x:900,y:679,w:150,h:65}];
 l.buildAreas=[{x:800,y:650,w:400,h:240}];l.boardSpec={w:300,h:18};
 l.intro='把架子上的配重移到跷跷板另一端的金色框内。球端被抬起，再用木板承接出口。';l.hint='复习序章的配重，再结合上一关的搭桥：先放配重，再搭出口斜板。球不能直接拖动；缺少配重就没有托举的能量。';
 return add(l,[place('weight',940,679),board(780,645,-.08)]);
}
function echoGate(l,x,y,h){
 l.bodies.push(rect('gate',1450,540,24,600,{category:'door'}));
 l.mechanisms.push({type:'door',bodyId:'gate',anchor:{x:1450,y:240},openAngle:-Math.PI/2});
 l.sensors.push({id:'echo',type:'laser',x,y,w:18,h});l.links.push({source:'echo',target:'gate',semantic:'once'});
}
function spring(id,name,chapter){
 const l=base(id,name,chapters[chapter]);l.tag='弹簧 / 高台 / 承接';l.bodies.push(ball(300,350),ramp('start',230,450,650,690),rect('spring',730,790,180,22,{category:'spring'}),ramp('end',1280,680,1730,800));l.mechanisms=[{type:'spring',bodyId:'spring',gain:14,direction:{x:.45,y:-Math.sqrt(1-.45**2)}}];l.buildAreas=[{x:1130,y:640,w:360,h:190}];l.boardSpec={w:290,h:18};l.intro='球落到弹簧板后会跃向高处；先在出口布好承接木板。';l.hint='弹簧是向右上方的固定动力。把木板放在高台左侧并向右下倾斜，接住下落的球。';return add(l,[board(1130,640,Math.atan2(80,300))]);
}
{
 const l=bridge('tut_grav','第一道斜坡',0);l.defaultBoardAngle=Math.atan2(80,320);l.lesson={kind:'board',target:{x:960,y:630},angle:l.defaultBoardAngle,radius:100};
 l.intro='只学一件事：放一块木板，再释放小球。';l.hint='点左下「木板」，把木板拖到虚线板位置后松手。角度已调好，靠近会自动对齐；再点右下「释放」。';
 l.tutorial=['① 点左下「木板」，拖到虚线板处松手；角度已调好，靠近会自动对齐。','② 木板已放下。点右下「释放」，看看小球怎样沿桥滚下。','③ 观察：重力始终向下，桥面把下落的小球引到收集器。'];
}
{
 const l=lever('tut_mech','配重的力量',0);l.boards=0;l.lines=0;l.buildAreas=[];l.tag='配重入门 / 自动吸附';l.bodies.push(rect('tutorialBridge',780,645,300,18,{angle:-.08,category:'wood'}));l.placementZones.weight=[{x:340,y:790,w:150,h:65},{x:940,y:679,w:110,h:90}];l.lesson={kind:'weight',sourceId:'weight',target:{x:940,y:679},radius:95};solutions[l.id]=[place('weight',940,679)];
 l.intro='桥已经搭好。这一关只需把配重拖到跷跷板右端。';l.hint='拖动左下方发光的方块，到跷跷板右端的金色方框后松手，会自动吸附。点「释放」：右端下沉，左端把球抬起来，球会沿现成的桥抵达终点。';
 l.tutorial=['① 把左下方发光的「配重」拖到右侧金色框，松手自动吸附；不用搭桥。','② 配重已就位！右端下沉会抬起左端小球。点右下「释放」试试看。','③ 看跷跷板：配重端下降 → 小球端上升 → 小球沿现成的桥入仓。'];
}
{
 const l=bridge('tut_hand','画一段归途',0,{draw:true});l.lines=1;l.lesson={kind:'line',path:[{x:818,y:590},{x:1102,y:670}]};l.tag='画线入门 / 沿线练习';
 l.intro='沿虚线画一段缓坡，再释放小球。这一关不用缩放。';l.hint='点「画线」，从虚线左侧圆点画到右侧圆点，松手生成桥面；线不要穿入平台。点「释放」观察。缩放会在第二章单独介绍。';
 l.tutorial=['① 点左下「画线」，沿两个圆点之间的虚线画一笔，松手生成缓坡。','② 导流线已生成。点「释放」，让小球沿你画的坡滚过去。','③ 画线也能承接和导流。以后可以自己决定坡度与画法。'];
}
levels.slice(0,3).forEach(l=>{l.goal.starTimesMs=[300000,600000];});
// The first chapter previously repeated the first tutorial's exact bridge and solution.
// Start the formal campaign with a new mechanism instead.
lever('ch1_l02','两端之间',1);
{
 const l=bridge('ch1_l03','光的回声',1);echoGate(l,1000,600,90);
 l.tag='搭桥 / 光束开门';l.intro='光束位于缺口上方。木板既要接通道路，也要让小球经过光束，远处的门才会打开。';
 l.hint='沿用第一关的搭桥方法；虚线连接光束与门。检查光束与桥面的高度关系；球碰到光束后门持续开启。';
 l.tutorial=['① 复习搭桥：旋转木板接住缺口；新知识是光束会向远处的门传信。','② 检查桥面两端，再释放。球穿过光束，门会回应并保持开启。','③ 观察光束与门之间的亮点：光被触发 → 门打开 → 小球过桥入仓。'];
}
spring('ch1_l04','向上的可能',1);
{
 const l=spring('ch1_l05','万物相连',1);l.boards=0;l.lines=1;echoGate(l,1210,610,160);
 l.tag='综合 / 弹簧 → 画线 → 光门';l.intro='把学过的机关连成一条路：弹簧把球送上来，画线承接，球穿过光束后打开终点门。';
 l.hint='紫色的是实体弹簧板。沿建造区画一段右低左高的缓坡，接住弹起的球并送过右端光束。光门持续开启，不考反应速度。';
 l.tutorial=['① 综合练习：用序章的画线方法，在建造区接一段缓坡；紫色弹簧负责把球送上来。','② 检查导流线是否接住落点并通往光束，再释放。无需配重，也不需要新操作。','③ 看整条链：弹簧抬升 → 导流线承接 → 光束传信 → 门开启 → 入仓。'];
 solutions[l.id]=[line([990,603],[1270,677])];
}

function steppingRoute(id,name,chapter){
 const l=base(id,name,chapters[chapter]);l.boards=0;l.lines=2;
 l.bodies.push(ball(300,350),ramp('start',230,450,650,520),ramp('island',900,600,1080,640),ramp('end',1330,710,1730,820));
 l.buildAreas=[{x:775,y:570,w:280,h:180},{x:1205,y:685,w:280,h:180}];
 l.tag='分段画线 / 中途承接';l.intro='归途分成两段：先画线接到中间落脚台，再画第二段通往终点。';l.hint='沿用序章画线操作。中间平台负责接力：第一笔跨过左缺口，第二笔跨过右缺口；两段都应顺着落差向下。';
 return add(l,[line([668,520],[882,600]),line([1098,640],[1312,710])]);
}
{
 const l=steppingRoute('ch2_l02','画出一条归途',2);
 l.bodies.find(b=>b.id==='island').y+=30;
 l.buildAreas[1].y+=15;
 solutions[l.id]=[line([668,520],[882,630]),line([1098,670],[1312,710])];
 l.intro='中间平台低于两岸的直连路线。先落到平台，再从新的高度接出第二笔。';
 l.hint='先比较两个缺口的落差：第一段下降较多，第二段更平缓。两笔不能照搬同一角度。';
}
bridge('ch2_l03','尺度之外',2,{small:true});
{
 const l=base('ch2_l04','等长的两端',chapters[2]);l.tag='配重 / 等长滑轮';l.boards=1;l.boardSpec={w:260,h:18};l.bodies.push(ball(680,714),rect('trayA',680,760,260,22,{isStatic:false,category:'pulley',density:.005,lockRotation:true,angle:.12}),rect('trayB',400,520,260,22,{isStatic:false,category:'pulley',density:.005,lockRotation:true}),cube('weight',1500,790,60,.04),rect('rack',1500,830,160,20),rect('shaft',825,770,20,340),ramp('end',1090,605,1730,820));
 l.mechanisms=[{type:'pulley',bodyId:'trayA',otherBodyId:'trayB',ropeY:1280,minY:520,maxY:760,anchor:{x:890,y:300},trayAngle:.12}];l.draggable=['weight'];l.placementZones.weight=[{x:1500,y:790,w:150,h:65},{x:400,y:479,w:150,h:65}];l.buildAreas=[{x:965,y:585,w:290,h:150}];l.intro='把配重放到空托盘，载球托盘就会带球上升。用木板接到高台。';l.hint='两端等距反向运动；没有空盘配重，球和左盘会停在低处。木板连接挡墙顶端与右侧出口。';add(l,[place('weight',400,479),board(950,580,.22)]);
}

require('./author-flow-chapter.cjs')({levels,solutions,base,add,rect,ramp,ball,cube,board,line,place,scale,chapters});
const teaching={
 ch2_l02:['观察下沉的中间平台：第一段降落，第二段以较缓坡度接出。','检查左右两个缺口都接好；中途平台是落脚点。','观察：导流线 → 中途平台 → 第二段导流线，分段完成归途。'],
 ch2_l03:['先缩小球，让它能穿过窄缝；再画线接住后面的缺口。','检查球的大小与导流线；缩放只在准备时生效。','观察：小球通过低矮通道，沿线继续前行。'],
 ch2_l04:['把配重放到空托盘，再搭板连接载球盘的高处出口。','检查托盘配重和出口桥；两端会等距离反向移动。','观察：空盘下沉 → 球盘上升 → 高处出口承接。'],
};
for(const l of levels)if(l.id.startsWith('ch2')&&teaching[l.id])l.tutorial=teaching[l.id].map((text,i)=>['① ','② ','③ '][i]+text);

for(const l of levels)if(l.id.startsWith('ch'))l.goal.starTimesMs=[300000,480000];

const root=path.resolve(__dirname,'..');fs.mkdirSync(path.join(root,'tests/fixtures'),{recursive:true});fs.writeFileSync(path.join(root,'static/game/data/levels.json'),JSON.stringify(levels,null,2)+'\n');fs.writeFileSync(path.join(root,'tests/fixtures/solutions.json'),JSON.stringify(solutions,null,2)+'\n');console.log('Authored '+levels.length+' fixed-gravity layouts and preparation replays.');
