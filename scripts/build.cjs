const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),platform=process.argv[2]||'h5';
if(!['h5','app'].includes(platform))throw Error('Use h5 or app');
const hx=process.env.HBUILDERX_HOME||path.resolve(root,'../../HBuilderX');
const compiler=path.join(hx,'plugins/uniapp-cli-vite'),bin=path.join(compiler,'node_modules/@dcloudio/vite-plugin-uni/bin/uni.js');
if(!fs.existsSync(bin))throw Error('未找到 HBuilderX Vue3 编译插件。请安装插件，或设置 HBUILDERX_HOME 为 HBuilderX.exe 所在目录。');
require('./build-levels.cjs');
const out=path.join(root,'unpackage/dist/build',platform==='app'?'app-plus':'h5');
const env={...process.env,UNI_INPUT_DIR:root,UNI_OUTPUT_DIR:out,UNI_CLI_CONTEXT:compiler,UNI_HBUILDERX_PLUGINS:path.join(hx,'plugins'),UNI_HBUILDERX_DIR:hx,UNI_PLATFORM:platform==='app'?'app-plus':'h5',NODE_ENV:'production'};
const run=cp.spawnSync(process.execPath,[bin,'build','-p',platform,'--config',path.join(root,'vite.config.js')],{cwd:compiler,env,stdio:'inherit'});
if(run.status!==0)process.exit(run.status??1);
// Static web-view scripts bypass Vite's pipeline. Explicitly transpile them too.
const esbuild=require(path.join(compiler,'node_modules/esbuild'));
const jsDir=path.join(out,'static/game/js');
for(const file of fs.readdirSync(jsDir).filter(f=>f.endsWith('.js'))){const target=path.join(jsDir,file);fs.writeFileSync(target,esbuild.transformSync(fs.readFileSync(target,'utf8'),{target:['chrome61','safari13'],minify:true,legalComments:'none'}).code);}
console.log('WebView scripts transpiled for Chrome 61 / Safari 13. Output: '+out);
