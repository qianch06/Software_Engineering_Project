# 失衡空间 · Gravity Shift 0.3

> **固定向下重力版**：先搭建，再释放，返回准备时保留方案并复位物理。前三关依次只教木板、配重、画线；第二关桥已搭好，拖动配重会自动吸附。实现与验收见 [0.3 实施与教学验收](docs/07-0.3实施与教学验收.md)。

基于需求文档与游戏设计文档扩展的单机物理解谜游戏。包含 **3 个教学关 + 3 章各 5 关 + 15 个可解锁倒映关**。所有游戏资源随包提供，运行无需联网。

## HBuilderX 运行与 APK 云打包

**同一 uni-app Vue3 工程支持 H5 与 Android App。H5 发布产物是网页；APK 应使用“App 云打包”，不能把“发行 H5”当成 APK 打包。**

1. HBuilderX → 文件 → 导入 → 从本地目录导入，选择本项目根目录。保持 uni-app / Vue3 类型，安装 HBuilderX 提示的 Vue3 编译插件。
2. 运行 → 运行到浏览器 → Chrome，验证 H5。项目根 `index.html` 是标准 uni-app 入口，不再跳转绕过 Vue 编译。游戏由页面内的本地 WebView 承载。
3. 保留本项目 manifest.json 内已配置的 DCloud AppID；更换账号时在 HBuilderX 登录自己的账号并重新获取，不自行编造，不在仓库保存账号密码或证书。
4. App 常用配置：名称“失衡空间”、版本 `0.3.0 / 300`、横屏。Android 包名已配置为 `com.gravityshift.game`；也可改为自己的唯一包名，发布后保持稳定。
5. App 图标已配置在 `static/icons/`。按需在可视化界面选用 `static/icons/icon.png`。
6. 发行 → 原生 App / App-Android/iOS → 云打包，勾选 Android，选择自己可用的云端证书或已有签名证书，输出格式选 APK，提交打包。菜单文案可能随 HBuilderX 版本略有变化。
7. 从打包结果页下载 APK，安装到 Android 真机，执行下文的真机验证。账号登录、AppID 所属权限、签名选择和云端打包额度由 DCloud 验证，本仓库不保存账号密码或证书私钥。

官方说明：[HBuilderX 运行与发布](https://uniapp.dcloud.net.cn/quickstart-hx)、[App 打包](https://uniapp.dcloud.net.cn/tutorial/app-pack.html)、[本地 WebView](https://uniapp.dcloud.net.cn/component/web-view)。

**0.3 网页已完成本地规则与浏览器验收；本环境尚未重新执行 HBuilderX 的 H5/App 发行构建，未生成签名 APK。** 0.2 的历史编译记录不作为本次发行验证。

## 无构建快速试玩

双击 **`play.html`**，或直接用浏览器打开 `static/game/index.html`。该入口用于快速离线试玩；根目录 `index.html` 请通过 HBuilderX 运行。

也可运行：

```powershell
node scripts/serve.cjs
```

访问 <http://127.0.0.1:8765/play.html>。固定使用一种入口以保持浏览器存档来源一致。

## 本机编译与检查

项目使用 **HBuilderX 已安装的 uni-app Vue3 编译器**，不需要在项目执行 npm install，也不混装不同版本的 DCloud 编译依赖。

```powershell
node scripts/preflight.cjs
node scripts/build.cjs h5
node scripts/build.cjs app
node scripts/preflight.cjs --cloud
```

最后一条仅检查云打包静态配置；账号、签名和云端额度由 HBuilderX 校验。若未找到编译器，请设置 HBUILDERX_HOME，不影响直接打开 play.html。

```powershell
$env:HBUILDERX_HOME = '你的 HBuilderX.exe 所在目录'
```

输出目录：

- `unpackage/dist/build/h5/`：H5 发布资源，可用静态服务器访问。
- `unpackage/dist/build/app-plus/`：App 打包资源，**不是 APK**。

`vite.config.js` 同时处理 HBuilderX 的发行构建：静态 WebView 脚本显式降语法至 Chrome 61 / Safari 13，避免静态目录绕过 Vite 转译。该处理解决语法兼容，不代表最低系统版本的全部 API、音频、布局已经真机验证。uni 统计与非必要分析功能已关闭。

## 操作

重力始终向下，不需要摇杆或倾斜设备。准备阶段不推进物理；点击释放后观察，运行中不能编辑。

| 功能 | 手机 / 鼠标 | 桌面快捷键 |
| --- | --- | --- |
| 释放 / 暂停 | 右下释放；顶部暂停，后台与失焦自动暂停 | 空格释放或暂停，Esc 暂停 |
| 返回准备 | 右下按钮，保留方案并复位球/机关/速度，累计一次重试 | B |
| 木板 | 点木板，在建造区拖放；正式关可用角度滑杆与旋转按钮 | 2，Q/E 每次 1°，滚轮旋转 |
| 画线 | 点画线，画出缓坡后松手；每条最多20段/1152像素/5秒 | 3 |
| 配重 / 方块 | 直接拖动发光方块到金色摆放区，须有支撑；教学2靠近目标自动吸附 | 1，鼠标拖动 |
| 缩放 | 第二章起的标记关卡，双指捏合或 −/+ 按钮 | −/+ |
| 撤销 / 清理 | 仅准备阶段，返还工具并恢复配置 | Z 撤销 |
| 清空重试 | 顶部重置，清空方案，返还工具，累计一次重试 | R |

教学1的木板自动对齐，教学2预置出口桥，教学3沿虚线画坡；每关只增加一种操作。顶部文字随操作更新，场内有目标轮廓与指引箭头；点 ? 可重看操作说明。正式关撤去自动对齐，逐步练习角度、配重组合与新机关。

木板/画线须完整位于建造区内，不能穿入球、地形或机关；非法放置不扣库存。返回准备会复位颜色、速度、Link和顺序链，永久碎片保留。活跃准备和运行时间计分，暂停/后台不计；重试不清空累计时间。教学关三星时限放宽至5分钟，正式关依各自目标。

## 关卡与系统

| 章节 | 关卡 | 主要内容 |
| --- | --- | --- |
| 序章 | 第一道斜坡 / 配重的力量 / 画一段归途 | 每关一种操作：木板 → 配重 → 画线 |
| 第一章 | 微光的轨迹 / 两端之间 / 光的回声 / 向上的可能 / 万物相连 | 搭桥、配重、光束响应、弹簧、画线与光门综合 |
| 第二章 | 悬空的答案 / 画出一条归途 / 尺度之外 / 等长的两端 / 静止的秩序 | 缺口、危险区、窄缝、等长滑轮、堆叠 |
| 第三章 | 光门的时限 / 逆流而上 / 水流的方向 / 三色回廊 / 回廊的回声 | 脉冲门与保持开关、局部重力、水流、染洗与顺序链 |
| 倒映章 | 15 个正式关的镜像版本 | 收集 15 个正式关碎片解锁，左右翻转、重力向下、工具不削减，成绩独立 |

其他功能：选关锁定与星级、继续最近关卡、提示、暂停/失败/结算、音效和振动开关、触控灵敏度、存档迁移/备份恢复/失败重试、调试快照。

正式关通过路径、力矩和落差发挥机关作用；不会额外要求“碰过某个机关”才入仓。允许有物理依据的不同解法。

## 工程结构

```text
App.vue / main.js / index.html              标准 uni-app Vue3 启动
manifest.json / pages.json / vite.config.js 平台、页面及构建配置
pages/index/index.vue                       本地 WebView 与 uni 生命周期桥接
play.html                                  独立离线试玩入口
static/game/data/levels.json                18 关可编辑源数据
static/game/js/levels.js                    生成后的离线关卡脚本
static/game/js/physics.js                   Matter.js 封装、约束、拖拽和滑轮投影
static/game/js/core.js                      校验、评分、存档、固定规则、Link、顺序与镜像变换
static/game/js/runtime.js                   固定步长关卡逻辑、传感区、目标与事件
static/game/js/session.js                   准备/释放/重试、轮廓校验、教程辅助
static/game/js/platform.js                  HTML5+ / 浏览器平台与存储适配
static/game/js/game.js                      页面状态、工具、输入与 HUD
static/game/js/renderer.js                  Canvas2D、场区、机关与粒子
static/icons/                              应用图标
scripts/                                   关卡生成、编译与打包前检查
tests/                                     核心、关卡运行、参考操控及浏览器测试
```

编辑 `static/game/data/levels.json` 后执行 `node scripts/build-levels.cjs`。无需修改循环即可增加现有机制的关卡。机制和目标的字段约定以该 JSON 和 `core.js` 的入口校验为准；0.3实施与验证范围见 `docs/07-0.3实施与教学验收.md`，0.2历史差异见 `docs/03-开发修订与验收说明.md`。

坐标基准 1920×1080，物理 60Hz 固定步长，DPR≤2。机关时序使用模拟时间，暂停不会消耗脉冲时间或稳定窗口。Matter 类型仅存在于物理层，其他模块使用普通快照。

App 使用 HTML5+ `plus.storage` 保存游戏数据，H5 使用 localStorage。存储格式保留v2，玩法版本另记rulesVersion=3；旧版解锁与碎片保留，旧成绩归档可在设置查看，新版成绩单独累计。v2 损坏时尝试上次备份，损坏原文另存，写入失败暂存于内存并重试。浏览器和 App 的存档互相独立；修改 DCloud AppID / Android 包名或卸载清数据会影响旧安装的存档。

## 验证

先运行 npm test（91项），再运行 node tests/browser.cjs。浏览器测试使用本机Chrome与Node内置协议，无需安装Playwright或Python；测试自行开启、关闭临时服务和独立浏览器。非默认安装可设置 CHROME_PATH 指向Chrome可执行文件。

规则测试覆盖18普通关+15镜像的公开准备操作通关、核心机关移除反例、教学容错/进度、固定重力、阶段隔离、重试复位、存档迁移、染洗与稳定堆叠。通关回放不直接设置球的位置、速度、重力或胜利状态；事件单元测试的定位注入单独使用。

浏览器测试覆盖真实鼠标完成三个教学关、手机触摸配重与堆叠、双指缩放与撤销、取消触摸、旧重力输入无效、暂停、存档、横竖屏及断网文件试玩，截图生成于 tests/artifacts/。有限反例不证明不存在任何旁路，正式关难度仍需多人试玩调优。

如需验证HBuilderX发行产物，先编译H5，再执行 node tests/h5-build.cjs；缺少或过期的产物会明确报错，不能用源网页验收替代发行构建。Android签名、真机安装、帧率/功耗/温度等仍未验收。

设置中的「管理员模式」默认关闭。开启后可进入全部33关（含15个镜像关），状态随本地存档保存；关闭后恢复正常解锁条件，不修改成绩或碎片。
