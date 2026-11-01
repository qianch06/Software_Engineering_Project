const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
  const out=path.resolve(__dirname,'artifacts');fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/static/game/index.html?debug=1');await page.waitForTimeout(400);
  await page.screenshot({path:path.join(out,'01-menu.png')});
  await page.click('#start');assert.equal(await page.locator('.level-card').count(),9);
  await page.locator('.level-card').nth(1).click();assert.ok((await page.locator('#toast').textContent()).includes('先完成'));
  await page.locator('.level-card').first().click();await page.waitForTimeout(400);
  await page.screenshot({path:path.join(out,'02-game.png')});
  // End-to-end first-level solution uses real keyboard input.
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');

  // Pause must freeze both physics and timer.
  await page.click('#pause');const before=await page.evaluate(()=>({x:__demo.g.physics.get('ball').x,t:__demo.g.elapsed}));await page.waitForTimeout(300);assert.deepEqual(await page.evaluate(()=>({x:__demo.g.physics.get('ball').x,t:__demo.g.elapsed})),before);
  await page.locator('[data-action="resume"]').click();
  // Complete the first level using actual keyboard input.
  await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>__demo.g.state==='cleared',{},{timeout:8000});await page.keyboard.up('ArrowRight');
  assert.equal(await page.evaluate(()=>__demo.g.state),'cleared');await page.screenshot({path:path.join(out,'03-result.png')});
  await page.click('[data-action="next"]');assert.equal(await page.evaluate(()=>__demo.g.level.id),'tut_mech');
  // Create an actual board with pointer input, then refund inventory with undo.
  await page.click('#tool-board');const bp=await page.evaluate(()=>({x:1020*Math.min(innerWidth/1920,innerHeight/1080)+(innerWidth-1920*Math.min(innerWidth/1920,innerHeight/1080))/2,y:790*Math.min(innerWidth/1920,innerHeight/1080)+(innerHeight-1080*Math.min(innerWidth/1920,innerHeight/1080))/2}));await page.mouse.move(bp.x,bp.y);await page.mouse.down();await page.mouse.move(bp.x+5,bp.y);await page.mouse.up();assert.equal(await page.evaluate(()=>__demo.g.history.length),1);await page.click('#undo');assert.equal(await page.evaluate(()=>__demo.g.history.length),0);
  // Scale and draw physically solid line, then undo all changes.
  await page.evaluate(()=>__demo.start(2));await page.click('#smaller');assert.ok(await page.evaluate(()=>__demo.g.physics.get('ball').scale<1));await page.click('#tool-line');await page.mouse.move(380,430);await page.mouse.down();for(let x=390;x<600;x+=15)await page.mouse.move(x,430-(x-380)*.1);await page.mouse.up();assert.ok(await page.evaluate(()=>__demo.g.history.some(h=>h.type==='line')));await page.click('#clear');assert.equal(await page.evaluate(()=>__demo.g.physics.get('ball').scale),1);
  // Beam contact dyes persistently; only wash restores white; wrong color doesn't win.
  await page.evaluate(()=>{__demo.start(8);const d=__demo;d.g.physics.position('ball',{x:570,y:650});d.step(1000/60);});assert.equal(await page.evaluate(()=>__demo.g.ballColor),'red');
  await page.evaluate(()=>{const d=__demo;d.g.physics.position('ball',{x:710,y:650});d.step(1000/60);});assert.equal(await page.evaluate(()=>__demo.g.ballColor),'red');
  await page.evaluate(()=>{const d=__demo;d.g.physics.position('ball',{x:850,y:650});d.step(1000/60);});assert.equal(await page.evaluate(()=>__demo.g.ballColor),'white');
  await page.evaluate(()=>{const d=__demo;d.g.physics.position('ball',d.g.level.collector);for(let i=0;i<20;i++)d.step(1000/60);});assert.equal(await page.evaluate(()=>__demo.g.state),'playing');
  await page.evaluate(()=>{const d=__demo;d.g.physics.position('ball',{x:1190,y:650});d.step(1000/60);});assert.equal(await page.evaluate(()=>__demo.g.ballColor),'blue');
  // Beam opens door with an observable source → target link.
  await page.evaluate(()=>{__demo.start(5);__demo.g.physics.position('ball',{x:660,y:650});__demo.step(1000/60);});assert.ok(await page.evaluate(()=>__demo.g.openDoors.gate&&__demo.g.links.length));
  await page.screenshot({path:path.join(out,'04-mechanism.png')});
  // Losing and resetting clears player artifacts; progress survives reload.
  await page.evaluate(()=>{__demo.g.physics.position('ball',{x:600,y:1100});__demo.step(1000/60);});assert.equal(await page.evaluate(()=>__demo.g.state),'failed');await page.click('[data-action="retry"]');assert.equal(await page.evaluate(()=>__demo.g.resets),1);
  await page.reload();assert.ok(await page.evaluate(()=>__demo.storage.data.completed.tut_grav));assert.equal(await page.locator('#continue').isVisible(),true);
  // Mobile landscape has no horizontal overflow; portrait gets rotation prompt.
  await page.setViewportSize({width:844,height:390});await page.evaluate(()=>__demo.start(2));await page.screenshot({path:path.join(out,'05-mobile.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('#rotate').isVisible(),true);
  // Sensor timeout and native lifecycle pause both use the public bridge.
  await page.evaluate(()=>{const d=__demo;d.start(0);d.gravity.mode='sensor';d.gravity.lastSample=0;d.g.sensorStarted=performance.now()-4000;d.step(1000/60);});assert.equal(await page.evaluate(()=>__demo.gravity.mode),'manual');
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('native-input',{detail:{type:'pause'}})));assert.equal(await page.evaluate(()=>__demo.g.state),'paused');
  // The direct file entry also works with networking entirely disabled.
  const offline=await browser.newContext({offline:true,viewport:{width:1280,height:720}}),filePage=await offline.newPage();
  filePage.on('pageerror',e=>errors.push(e.message));
  await filePage.goto(require('node:url').pathToFileURL(path.resolve(__dirname,'../index.html')).href);await filePage.waitForSelector('#start');await filePage.click('#start');await filePage.locator('.level-card').first().click();assert.equal(await filePage.locator('#play').isVisible(),true);await offline.close();
  assert.deepEqual(errors,[]);console.log('Browser checks passed; screenshots:',out);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
