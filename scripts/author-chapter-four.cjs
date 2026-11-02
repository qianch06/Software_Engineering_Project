const fs=require('node:fs'),path=require('node:path');
module.exports=({levels})=>{
 const html=fs.readFileSync(path.join(__dirname,'../docs/第四章游戏设计-回环之庭.html'),'utf8'),text=s=>s.replace(/<[^>]*>/g,'').trim();
 for(let i=1;i<=5;i++){
 const section=html.split(`id="4-${i}"`)[1].split('</section>')[0],name=text(section.match(/<h2>(.*?)<\/h2>/s)[1]);
 const nodes=[...section.matchAll(/<circle cx="(\d+)" cy="(\d+)" r="23".*?<text[^>]*>(\w)<\/text><text[^>]*>(.*?)<\/text>/gs)].map(m=>({id:m[3],x:+m[1],y:+m[2],label:text(m[4])}));
 const table=section.split('<h3>初始状态与终点</h3>')[1];
 const edges=[...table.split('</table>')[0].matchAll(/<tr><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><\/tr>/gs)].map((m,j)=>{const[a,b]=m[1].split(/ ↔ | → /),label=text(m[2]);return{id:'e'+j,a,b,oneWay:m[1].includes('→'),label,noCargo:m[3].includes('禁止'),phase:label.includes('红相')?'red':label.includes('蓝相')?'blue':null,bridge:/桥(?:位 )?([01])/.test(label)?+label.match(/桥(?:位 )?([01])/)[1]:null,key:label.includes('钥'),weight:/配重(?:留在 )?([PC])/.test(label)?label.match(/配重(?:留在 )?([PC])/)[1]:null,lights:label.includes('p q r')?'001':null,p:label==='p = 1'?1:null,q:label==='q = 0'?0:null};});
 const stations=label=>{const m=table.match(new RegExp(label+'：([^；。]+)'));return!m||m[1]==='无'?[]:m[1].split('、');};
 const hints=[...section.split('<h3>分层提示</h3>')[1].split('</ol>')[0].matchAll(/<li>(.*?)<\/li>/gs)].map(m=>text(m[1]));
 const scene=require('./courtyard-scenes.cjs')(i,nodes,edges);
 levels.push({scene,id:`ch4_g0${i}`,name,chapter:'第四章 · 回环之庭',mode:'courtyard',tag:['双相 / 钥纹','联动桥 / 回环','配重 / 复用','三灯 / 记忆','双相 / 桥 / 配重'][i-1],intro:text(section.match(/<p class="lead">(.*?)<\/p>/s)[1]),hint:hints[2],tutorial:hints,rulesVersion:3,initialGravity:{x:0,y:1},boards:0,lines:0,buildAreas:[],placementZones:{},draggable:[],scaleRange:[1,1],collector:{x:0,y:0,r:1},bodies:[{id:'ball',type:'circle',x:300,y:400,r:24,category:'energyBall'}],sensors:[],mechanisms:[],links:[],goal:{type:'transport'},graph:{nodes,edges,phase:[1,5].includes(i)?'blue':'red',phaseStations:stations('换相台'),bridgeStations:stations('转桥台'),keyNode:i===4?null:'K',weight:[3,5].includes(i)?'S':null,buttons:i===4?{H:{name:'A',mask:6},B:{name:'B',mask:3},C:{name:'C',mask:4}}:{}}});
 }
};
