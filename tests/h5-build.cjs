const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
  const b=await chromium.launch({headless:true,channel:'chrome'}),p=await b.newPage({viewport:{width:844,height:390},hasTouch:true});const errors=[],external=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:8765'))external.push(r.url());});
  await p.goto('http://127.0.0.1:8765/unpackage/dist/build/h5/');
  const f=p.frameLocator('iframe');await f.locator('#start').waitFor();assert.ok(p.url().includes('/unpackage/dist/build/h5/'));
  await f.locator('#start').tap();assert.equal(await f.locator('.level-card').count(),18);await f.locator('.level-card').first().tap();await f.locator('#detail-start').tap();await f.locator('#pause').tap();await f.locator('[data-action="resume"]').tap();
  await p.screenshot({path:path.resolve(__dirname,'artifacts/06-built-h5-mobile.png')});
  // Touch pinch and task-cube dragging use actual browser touch events.
  await p.goto('http://127.0.0.1:8765/static/game/index.html?debug=1');await p.evaluate(()=>__demo.start(2));
  const client=await p.context().newCDPSession(p),center=await p.evaluate(()=>{const r=__demo.g.physics.get('ball'),s=Math.min(innerWidth/1920,innerHeight/1080);return{x:r.x*s+(innerWidth-1920*s)/2,y:r.y*s+(innerHeight-1080*s)/2};});
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:center.x-25,y:center.y,id:1},{x:center.x+25,y:center.y,id:2}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:center.x-13,y:center.y,id:1},{x:center.x+13,y:center.y,id:2}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(await p.evaluate(()=>__demo.g.physics.get('ball').scale<.8));
  await p.evaluate(()=>__demo.start(12));const cube=await p.evaluate(()=>{const r=__demo.g.physics.get('cube1'),s=Math.min(innerWidth/1920,innerHeight/1080);return{x:r.x*s+(innerWidth-1920*s)/2,y:r.y*s+(innerHeight-1080*s)/2};});
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cube.x,y:cube.y,id:1}]});assert.equal(await p.evaluate(()=>__demo.g.dragCube),'cube1');await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cube.x+80,y:cube.y-30,id:1}]});await p.waitForTimeout(150);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await p.evaluate(()=>__demo.g.dragCube),null);
  await p.evaluate(()=>{for(const l of LEVELS.filter(l=>l.id.startsWith('ch'))) __demo.storage.data.shards[l.id]=true;__demo.select();});assert.equal(await p.locator('.level-card').count(),33);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:700,y:320,id:1}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:700,y:220,id:1}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:700,y:110,id:1}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(150);assert.ok(await p.evaluate(()=>document.getElementById('select').scrollTop>0));
  // Packaged app includes local runtime and disabled analytics.
  const app=path.resolve(__dirname,'../unpackage/dist/build/app-plus');assert.ok(fs.existsSync(path.join(app,'static/game/js/runtime.js')));const manifest=JSON.parse(fs.readFileSync(path.join(app,'manifest.json'),'utf8'));assert.equal(manifest.version.name,'0.2.0');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('Built H5 iframe, mobile pinch/drag, inverse unlock and app-resource checks passed.');await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
