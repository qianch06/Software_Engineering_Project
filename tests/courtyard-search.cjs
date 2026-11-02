require('./helpers.cjs');require('../static/game/js/courtyard.js');
function search(level){const session=new CourtyardSession(level),key=JSON.stringify,states=[session.state],paths=new Map([[key(session.state),[]]]),reverse=new Map();let solution;
 for(let i=0;i<states.length;i++){const s=states[i],k=key(s);if(s.node==='E'){solution??=paths.get(k);continue;}for(const op of session.operations(s)){const n=session.next(s,op),nk=key(n);if(!reverse.has(nk))reverse.set(nk,[]);reverse.get(nk).push(k);if(!paths.has(nk)){paths.set(nk,[...paths.get(k),op]);states.push(n);}}}
 const good=new Set(states.filter(s=>s.node==='E').map(key)),q=[...good];for(let i=0;i<q.length;i++)for(const k of reverse.get(q[i])||[])if(!good.has(k)){good.add(k);q.push(k);}return{states,paths,solution,dead:states.length-good.size};
}
function settle(s){let n=0;while(s.travel&&n++<1800)s.tick();if(s.travel)throw Error('运输未到站 '+s.level.id);}
module.exports={search,settle};
