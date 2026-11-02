const assert=require('node:assert/strict'),path=require('node:path');
const {search}=require('./courtyard-search.cjs');
module.exports=async(p,url,out)=>{
 await p.navigate(url);await p.wait('!!window.__demo');const levels=require('../static/game/data/levels.json'),chapter=levels.filter(l=>l.graph);
 const click=async selector=>{await p.evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);await p.click(selector);};
 for(const l of process.argv.includes('--scene-only')?[]:chapter){
  await p.evaluate(`__demo.start(${levels.indexOf(l)})`);await click('[data-court="reset"]');
  await p.screenshot(path.join(out,l.id+'-initial.png'));
  for(const op of search(l).solution){
   if(op.startsWith('move:')){
    const to=await p.evaluate(`__demo.courtyard.session.routes().find(r=>r.edge.id===${JSON.stringify(op.slice(5))}).to`);
    await click(`[data-court="node:${to}"]`);await click('[data-court="release"]');
    await p.wait(`!__demo.courtyard.session.travel&&__demo.courtyard.session.state.node===${JSON.stringify(to)}`,20000);
   }else{
    const before=await p.evaluate('JSON.stringify(__demo.courtyard.session.state)');await click(`[data-court="${op}"]`);
    assert.equal(await p.evaluate('JSON.stringify(__demo.courtyard.session.state)'),before,'preview must not mutate');await click('[data-court="confirm"]');
   }
  }
  assert.equal(await p.evaluate('__demo.courtyard.session.done'),true);await p.screenshot(path.join(out,l.id+'-complete.png'));await click('[data-court="exit"]');
  console.log('PASS: courtyard real controls '+l.id);
 }
 if(process.argv.includes('--scene-only'))for(const l of chapter){await p.evaluate(`__demo.start(${levels.indexOf(l)})`);await click('[data-court="reset"]');await p.screenshot(path.join(out,l.id+'-initial.png'));}
 await p.send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true});
 for(const l of chapter){await p.evaluate(`__demo.start(${levels.indexOf(l)})`);await click('[data-court="reset"]');await p.evaluate('document.getElementById("courtyard").scrollTop=0');await p.screenshot(path.join(out,l.id+'-mobile.png'));assert.ok(await p.evaluate('document.documentElement.scrollWidth<=innerWidth'));}
 // Interruption restores the last stable dock, then actual UI completes the same segment.
 await click('[data-court="node:H"]');await click('[data-court="release"]');await p.evaluate('window.dispatchEvent(new CustomEvent("native-input",{detail:{type:"pause"}}))');
 assert.equal(await p.evaluate('__demo.courtyard.session.state.node'),'S');assert.equal(await p.evaluate('!!__demo.courtyard.session.travel'),false);await click('[data-court="pause"]');
 await click('[data-court="node:H"]');await click('[data-court="release"]');await p.wait('__demo.courtyard.session.state.node==="H"');await click('[data-court="phase"]');await click('[data-court="confirm"]');
 const saved=await p.evaluate('JSON.stringify(__demo.courtyard.session.checkpoint())');await p.navigate(url);await p.wait('!!window.__demo');await p.evaluate(`__demo.start(${levels.indexOf(chapter.at(-1))})`);assert.equal(await p.evaluate('JSON.stringify(__demo.courtyard.session.checkpoint())'),saved);
 await click('[data-court="undo"]');assert.equal(await p.evaluate('__demo.courtyard.session.state.phase'),'blue');
 const beforeZoom=await p.evaluate('JSON.stringify(__demo.courtyard.session.state)');await click('[data-court="zoom"]');assert.equal(await p.evaluate('__demo.courtyard.zoom'),1.7);assert.equal(await p.evaluate('JSON.stringify(__demo.courtyard.session.state)'),beforeZoom);await p.screenshot(path.join(out,'courtyard-mobile-zoom.png'));await click('[data-court="zoom"]');
 assert.deepEqual(p.errors,[]);console.log('PASS: mobile controls, preview, pause, persistent checkpoint and undo; screenshots '+out);
};

