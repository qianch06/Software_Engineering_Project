require('../static/game/js/core.js');global.Matter=require('../static/game/vendor/matter.min.js');require('../static/game/js/physics.js');require('../static/game/js/runtime.js');require('../static/game/js/session.js');
const levels=require('../static/game/data/levels.json'),solutions=require('./fixtures/solutions.json');
function scene(id){const l=typeof id==='string'?levels.find(l=>l.id===id):id,events=[],s=new PuzzleSession(l,(type,data)=>events.push({type,data}));s.events=events;return s;}
function action(s,raw){const a=structuredClone(raw);if(s.level.inverse){if(a.points)a.points.forEach(p=>p.x=1920-p.x);if(a.point)a.point.x=1920-a.point.x;if(a.angle)a.angle*=-1;}return a.type==='place'?s.place(a.id,a.point):a.type==='scale'?s.scaleBall(a.value):s.add(a.type,a.points,a.angle);}
function run(s,ms=60000){for(let i=0;i<Math.ceil(ms/(1000/60))&&s.phase==='playing';i++)s.tick(1000/60);}
module.exports={levels,solutions,scene,action,run};
