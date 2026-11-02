# 微光归途

> 观察场景，构筑道路，让微光找到归途。

《微光归途》是一款横屏、单人、离线物理解谜游戏。玩家用木板、画线与配重规划路线，借助光束开关、弹簧、滑轮、水流、浮力和气流，把小球送入收集器。名字取自贯穿各章的共同目标：为微光搭建一条回家的路。

当前版本 **0.3.0**，包含 **3 个教学关 + 18 个正式关，共 21 关、13 枚碎片**。画面采用深灰绿与薄荷色的简约风格，保留材质碰撞声、滚动声和入仓反馈。重力始终向下，水与风只在各自区域内产生作用。

## 快速开始

### 方式一：直接离线试玩

下载或克隆完整仓库后，用现代浏览器打开根目录的 **`play.html`**，也可打开 `static/game/index.html`。无需安装依赖、启动服务器或联网加载资源。建议横屏游玩，音效由首次用户交互激活。

**不要双击根目录 `index.html` 试玩**：它是 uni-app/Vue3 的编译入口，与独立游戏页面不同。

### 方式二：本地服务器（开发推荐）

在项目根目录执行：

```sh
npm run serve
```

浏览器访问 **http://127.0.0.1:8765/play.html**。按 `Ctrl+C` 关闭服务器。默认只监听本机地址；修改端口可设置 `PORT` 环境变量，例如 PowerShell：

```powershell
$env:PORT = '8766'
npm run serve
```

本项目的试玩、关卡生成与 Node 测试使用内置模块，**不需要先执行 `npm install`**。服务器根路径 `/` 对应 uni-app 入口，请使用上面的 `/play.html` 地址。

## 运行环境

| 用途 | 环境要求 |
| --- | --- |
| 直接试玩 | 支持 Canvas 2D、Web Audio、Pointer Events、localStorage 及现代 CSS 的浏览器；建议使用近期 Chrome/Edge，手机横屏 |
| 本地服务器、规则测试 | Node.js；本项目实际验证环境为 Node.js 24.13.1，建议使用 Node.js 24 |
| 浏览器自动化测试 | Node.js 24 与本机 Google Chrome；通过 `CHROME_PATH` 可指定浏览器可执行文件 |
| uni-app H5 / App 资源编译 | HBuilderX、uni-app Vue3 编译插件；命令行构建还需 Node.js |
| Android 云打包 | HBuilderX、可用的 DCloud 账号/AppID 权限及签名配置；云打包需要联网 |

Android 工程当前声明 `minSdkVersion: 26`、`targetSdkVersion: 35`，包含 ARM64 与 ARMv7 配置。这是打包配置，不等于已在所有对应设备上验证兼容性。当前不配置 iOS 发布。

## 怎么玩

1. **观察**：查看起点、收集器、机关、建造区和配重摆放区；不清楚时点 `?` 查看逐级提示。
2. **准备**：放置木板、画线、移动允许拖动的配重；部分关卡可缩放球。准备阶段物理世界静止。
3. **释放**：点击右下角“释放”，让球沿设计的路线运动。运行中不能修改方案。
4. **调整**：路线中断时点击“返回准备”，保留方案并复位小球与机关，修改后再试。

木板与线条必须完整位于建造区，不能穿入球或机关；配重必须放在指定区域并有承托。非法放置不扣库存。教学关提供吸附与指引，正式关逐步组合已学操作。

| 操作 | 鼠标 / 触屏 | 键盘 |
| --- | --- | --- |
| 释放、暂停 | 释放按钮、顶部暂停按钮 | 空格；Esc 暂停/返回 |
| 返回选关 | 左上角“返回” | — |
| 返回准备，保留方案 | 右下角“返回准备” | B |
| 摆放配重 | 拖动允许移动的方块 | 1 选择摆放工具 |
| 放木板 | 选择木板后在建造区放置 | 2 |
| 调整木板角度 | 角度滑杆、旋转按钮、鼠标滚轮 | Q / E 每次 1° |
| 画线 | 选择画线后拖动 | 3 |
| 缩放小球 | 支持缩放的关卡中双指捏合或点 −/+ | − / + |
| 撤销 | 撤销按钮，仅准备阶段可用 | Z |
| 清空方案并重试 | 顶部重置按钮 | R |

准备与运行时间计入成绩，暂停和提示不计时。重试不额外扣星，但不会清零累计用时。教学关与前三章的三星目标为 5 分钟；二星目标为教学关 10 分钟、前三章 8 分钟；第四章不计时、不评星，撤销不扣分。

## 关卡主题

| 章节 | 数量 | 学习与挑战 |
| --- | --- | --- |
| 序章 · 构筑第一条路 | 3 | 木板、配重、画线各自独立教学 |
| 第一章 · 微光的轨迹 | 4 | 跷跷板平衡、光束开门、弹簧跃迁与组合路线 |
| 第二章 · 空间的形状 | 4 | 分段承接、尺寸限制、滑轮升降；“高处的归途”综合运用 |
| 第三章 · 风与水的工坊 | 5 | 浮力上岸、风井转向、水下潜行、浮块开闸与风水交接 |
| 第四章 · 回环之庭 | 5 | 双相钥纹、联动桥、配重复用、三灯记忆与综合回环；停泊后操作、逐段释放 |

水体能托起球，也能推动球和浮块；潜过堤坝需要利用顶棚限制上浮，水闸需要浮块运输触发信号。气流负责局部托举，出区后仍按向下重力运动。主线不包含旧版自由重力、倒映章或第三章色锁布局。

### 第四章操作

点击场景里的相邻实体平台（或右侧目的地），再启动输送台。到站后才能预览并确认换相、转桥、按记忆键或搬配重；预览会标出受影响的通路。红相平台使用斜纹、蓝相平台使用点纹，不能只看球的颜色判断。

钥纹取得后持续保存；配重必须放下才触发压台，牵引中不算。所有条件在出发时检查，运输中锁定机关。可逐步撤销，切后台会回到最后一个完整停泊状态。每关有三层提示，没有限时操作与必拿碎片。前三章的建造工具不用于第四章。

## 设置与存档

- 背景音乐使用用户提供的 `moodmode-8-bit-retro-game-music-233964.mp3`，随游戏打包在 `static/game/audio/background.mp3`。首次点击或键盘操作后以低音量循环播放；暂停游戏或进入后台时暂停，恢复后续播。设置中的“背景音乐”开关独立于空间音效，并随存档保存。
- 可分别开启音效、触觉反馈，并调整触控灵敏度；振动是否生效取决于平台支持。
- 管理员模式默认关闭，开启后可进入全部 21 关。关闭后恢复按进度解锁，不抹去已有成绩和碎片。
- 网页使用 `localStorage`，Android 容器使用 HTML5+ 存储；支持本地备份恢复和旧规则成绩归档。
- 浏览器、App 以及不同网页来源的存档彼此独立。建议固定使用同一浏览器和地址，切换端口、使用隐私模式或清除站点数据可能看不到原进度。
- 游戏更名不修改原存档键 `gravity-shift-v2`、DCloud AppID 和 Android 包名 `com.gravityshift.game`。npm 内部包名也保留 `gravity-shift`。

## HBuilderX 运行与发布

用 HBuilderX 打开项目根目录，安装 uni-app Vue3 编译插件，通过“运行到浏览器”运行完整 H5 容器。`pages/index/index.vue` 使用本地 WebView 加载游戏，并转发 App 后台与返回事件。

命令行构建使用 HBuilderX 自带编译器，不在项目内另装一套 DCloud 依赖。若编译器无法自动找到，先设置路径：

```powershell
$env:HBUILDERX_HOME = 'C:\路径\HBuilderX'
npm run preflight
npm run build:h5
npm run build:app
```

| 构建 | 输出 | 用途 |
| --- | --- | --- |
| `build:h5` | `unpackage/dist/build/h5/` | H5 发布资源，需由静态服务器托管 |
| `build:app` | `unpackage/dist/build/app-plus/` | App 打包资源，**不是 APK** |

Android APK 需在 HBuilderX 中使用 App 云打包，确认 AppID 所属权限、Android 平台与签名后生成并下载。打包前可执行 `node scripts/preflight.cjs --cloud` 检查静态配置；该检查不验证账号、证书或额度。

静态游戏脚本会单独降语法至 Chrome 61 / Safari 13 目标，但现代 CSS 与浏览器 API 并未因此获得完整兼容保证。发布前仍应在目标设备验证画面、触控、音效、后台暂停与存档。本次改名未生成 APK，也未执行 HBuilderX 发行构建。

## 工程结构

```text
App.vue / main.js / index.html    uni-app Vue3 容器入口
manifest.json / pages.json       应用身份、平台和页面配置
vite.config.js                  HBuilderX 构建适配
pages/index/index.vue           本地 WebView 与生命周期桥接
play.html                       独立离线试玩入口
static/game/index.html          游戏页面
static/game/style.css           基础布局与交互样式
static/game/minimal.css         当前简约主题与响应式排版
static/game/data/levels.json     当前关卡数据
static/game/js/levels.js         生成后的离线关卡脚本
static/game/js/core.js           校验、评分、存档与联动规则
static/game/js/physics.js        Matter.js 封装及碰撞、滑轮约束
static/game/js/runtime.js        机关、水/风、目标判定与事件
static/game/js/session.js        准备、释放、重试及建造合法性
static/game/js/courtyard.js      第四章状态、分段运输、完整撤销
static/game/js/courtyard-view.js 第四章操作预览、缩放与停泊存档
static/game/js/courtyard-renderer.js 第四章实体平台、升降台与机关场景
static/game/courtyard.css        第四章响应式界面
static/game/js/game.js           页面状态、输入、HUD 与音效
static/game/js/renderer.js       Canvas 场景、机关与视觉反馈
static/game/js/interactions.js   章节展开、详情抽屉等界面交互
static/game/js/platform.js       浏览器 / HTML5+ 平台适配
static/game/vendor/              随项目提供的 Matter.js
static/icons/                   应用图标
scripts/                        关卡创作、服务器、编译与检查
 tests/                         规则、关卡回放与浏览器测试
 docs/                          设计文档与历史实施记录
```

游戏场景使用 1920×1080 逻辑坐标、自适应缩放和 60Hz 固定物理步长。界面由 HTML/CSS 绘制，前三章场景由 Canvas 2D 绘制；第四章也用 Canvas 2D 绘制实体工坊，并使用独立 Matter.js 输送会话，游戏运行资源随仓库提供。

### 修改关卡

关卡创作入口为 `scripts/create-levels-v3.cjs`，第三章及第二章综合关定义在 `scripts/author-flow-chapter.cjs`；第四章由 `scripts/author-chapter-four.cjs` 读取仓库内的 `docs/第四章游戏设计-回环之庭.html` 通路表生成规则；实际场景布局与输送/升降路线在 `scripts/courtyard-scenes.cjs` 中独立创作。修改创作脚本后运行：

```sh
node scripts/create-levels-v3.cjs
npm run levels
npm test
```

第一条会重新生成 JSON；第二条校验数据并生成离线脚本。若直接修改 `levels.json`，只执行 `npm run levels` 同步脚本，但下次运行创作脚本会覆盖这些直接改动。

## 验证与调试

```sh
npm run preflight
npm test
npm run test:browser
node tests/browser.cjs --ui-only
node tests/browser.cjs --chapter-four
```

- 规则测试覆盖原 16 关参考解法、水流/浮力/气流、教学、存档及音效接触事件；第四章另做全状态搜索、每段 10 种初速度运输、完整解法 30 次回放和撤销恢复测试。
- 浏览器测试覆盖鼠标解题、触屏拖放与缩放、暂停、存档和离线入口；`--ui-only` 检查选关、详情、管理员解锁、音效开关与布局。
- 浏览器测试默认寻找 Windows Chrome：`C:/Program Files/Google/Chrome/Application/chrome.exe`；其他安装位置设置 `CHROME_PATH`。
- 测试截图保存在 `tests/artifacts/`，不纳入 Git。网页截图验证不能替代 Android 真机验收。
- 在游戏地址后添加 `?debug=1` 可显示调试面板并导出关卡快照，例如 `http://127.0.0.1:8765/static/game/index.html?debug=1`。

## 设计资料

当前关卡内容以代码与数据为准，可结合以下文档理解设计：

- [综合关与风水工坊重做](docs/12-综合关与风水工坊重做.md)
- [固定重力玩法与 UI 分支整合](docs/13-分支整合记录.md)
- [准备、释放与渐进教学](docs/07-0.3实施与教学验收.md)

`docs/` 中保留早期“失衡空间”、自由重力与科幻 UI 的历史讨论，它们不代表当前版本的名字、关卡数量或最终规则。

第四章保留前三章所有原始关卡数据。采用新的关卡 ID，旧第四章成绩不会自动解锁新版全部关卡。设计及实现边界见 [第四章 · 回环之庭](docs/14-第四章归途的答案.md)。

管理员模式下，第四章右侧提供“从头演示解答”。演示先预览每一步，再执行真实运输与机关操作；支持暂停、继续和单步。退出演示恢复原停泊状态与撤销历史，演示不写入通关成绩。可运行 `node tests/browser.cjs --court-demo` 验证。
