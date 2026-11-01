# 失衡空间 · Gravity Shift

第一版可玩 Demo，依据 `docs/01-需求分析文档.md` 与 `docs/02-游戏设计文档.md` 实现。程序、资源和测试均保存在本项目内，无需联网或安装 npm 依赖即可试玩。

## 开始试玩

**最快方式：双击项目根目录 `index.html`，使用 Chrome 或 Edge 打开。**

也可以在项目目录启动本地服务：

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

访问 <http://127.0.0.1:8765/>。双击文件与 HTTP 地址属于不同存储来源，进度各自保存；建议固定一种方式。

## HBuilderX

1. 将本目录作为 uni-app 项目导入 HBuilderX，使用 Vue3 编译器。
2. 运行到浏览器可进入同一套离线游戏；浏览器试玩也可直接使用上面的入口。
3. App 端由 `pages/index/index.vue` 的本地 WebView 承载 `static/game/index.html`，不加载远程网页。页面通过 `uni.onAccelerometerChange` 采样，并向子 WebView 发送数据；页面隐藏/返回键将通知游戏暂停。
4. App 启动锁定横屏。真机运行、云打包需安装 HBuilderX 对应的 uni-app 编译/运行插件；iOS 安装包还需要开发者证书。

**当前已验证桌面浏览器和模拟手机横屏，未执行 HBuilderX 编译、APK/IPA 打包或 Android/iOS 真机验收。** 手机端传感器轴向、WebView 桥接与系统安全区仍需真机校准。

## 操作

| 操作 | 触屏 / 鼠标 | 桌面快捷键 |
| --- | --- | --- |
| 重力 | 拖动右下圆盘；松手保持方向。引力模式也可在空白处滑动 | 方向键 / WASD，松开保持 |
| 倾斜 | 点击“启用倾斜”；无数据 3 秒后自动退回圆盘 | 使用圆盘即可 |
| 木板 | 点击木板工具，在玩法区拖动、松手放置；木板固定在落点 | 2 切换，Q / E 或滚轮旋转 |
| 画线 | 点击画线工具，画出路径后松手；每条最多 20 段、1152 逻辑像素、5 秒 | 3 切换 |
| 缩放 | 教学 3 双指捏合能量球；也可点工具栏 − / + 或滚轮 | − / + |
| 引力工具 | 点击引力 | 1 |
| 撤销 / 清理 | 点击 ↶ / ⌫，返还木板和画线限额；缩放也可撤销 | Z 撤销 |
| 暂停 / 重置 | 顶部按钮；切后台或失去焦点自动暂停 | 空格 / Esc 暂停，R 重置 |

球在收集器内停留约 0.25 秒后通关，进入时减速吸附。三星要求 60 秒内、零重置；二星要求 90 秒内、最多两次重置。重置保留本次累计计时与重置次数；结算后的重玩重新计分。所有关卡顺序解锁，重复通关分别保留最佳星级、最短时间和最少重置次数。设置中清除进度需要二次确认。

## 本版内容

- 三关教学：重力、杠杆与搭桥、缩放与画线。
- 第一章五关：斜坡惯性、杠杆、激光联动铰链门、弹簧弹射、组合关。
- 一关额外染色预览：红光染色 → 洗色 → 蓝光染色，收集器拒绝不匹配颜色。
- 主菜单、继续、选关、提示、暂停、失败重试、星级结算、下一关、设置与本地存档。
- 第一章每关一个可选碎片，拾取即永久保存，失败和重置不会丢失。
- 暖色能量球、绿色目标、流光联动、粒子反馈与本地合成音效；Matter.js 0.20.0 已随包提供，许可证见 `static/game/vendor/LICENSE-Matter.txt`。

## 结构与关卡扩展

```text
App.vue / main.js / manifest.json / pages.json   uni-app Vue3 入口
pages/index/index.vue                            App 宿主与生命周期/传感器桥接
index.html                                      无构建试玩入口
static/game/index.html / style.css               游戏界面
static/game/js/physics.js                        Matter.js 物理封装
static/game/js/core.js                           存档、评分、重力滤波、校验器
static/game/js/game.js                           玩法、工具、状态与输入
static/game/js/renderer.js                       Canvas 2D 渲染与反馈
static/game/data/levels.json                     可编辑的九关原始数据
static/game/js/levels.js                         JSON 编译出的离线关卡脚本
scripts/build-levels.cjs                         校验并生成关卡脚本
tests/core.test.cjs / browser.cjs                 核心与浏览器回归
```

编辑 `static/game/data/levels.json`，然后执行 `node scripts/build-levels.cjs`。普通运输关可直接增加 JSON 对象，不修改循环。坐标基准为 1920×1080，物理步长固定 1/60 秒；渲染等比缩放并限制 DPR≤2。唯一必须存在的球 ID 为 `ball`。校验器会拒绝基本格式、非法实体尺寸、重复实体 ID、缺失目标引用和无洗色区的染色配置；本版校验器是精简实现，并未覆盖设计文档所有 Schema 条款。

Matter.js 只在物理封装中使用，逻辑与渲染读取普通快照。菜单与工具栏均为真实 HTML 控件，游戏物理状态不进入 Vue 响应式系统。使用查询参数 `?debug=1` 时，控制台提供 `window.__demo` 以便自动化回归，普通试玩不暴露该入口。

## 验证

```powershell
node --test tests/core.test.cjs
```

核心回归包含九关数据校验、密度守恒缩放、九关各 20 秒双跑确定性、重力死区与滤波、星级与存档、防损坏及存储失败。

浏览器回归需先运行上面的 HTTP 服务，另需本机可用的 Playwright 与 Chrome：

```powershell
# 如 Playwright 不在 Node 默认模块路径，指向已有的 playwright 包目录
$env:PLAYWRIGHT_PATH = '你的 playwright 包绝对目录'
node tests/browser.cjs
```

回归涵盖真实键盘通关教学 1、选关锁定、暂停冻结、结算解锁、指针搭桥/画线、撤销、缩放、染洗与拒绝、激光开门、失败重试、存档恢复、844×390 横屏及竖屏提示。截图生成到 `tests/artifacts/`（已 gitignore）。染色和开门的定点测试通过调试入口定位球，不等同于所有关卡的完整人工通关。

## 与完整设计的差异

这是 0.1 Demo 的范围裁剪，不代表 18 关需求基线已全部验收：

- 本版为 9 关，未实现第二/三章完整关卡、滑轮、水流、局部重力场、稳定堆叠、顺序链和倒映章。
- 木板采用设计允许的静态落点方案；弹簧板采用接触检测与限速弹射，门采用开关触发后绕铰点运动，尚未覆盖完整约束式弹簧和碰撞推门/延时闭门。
- 使用本地 WebView 中的标准 Canvas 2D 与普通 JavaScript；尚未迁移为文档中的节点 Canvas、TypeScript 多页面工程。H5 使用 localStorage；App 当前也由本地 WebView 保存进度，未统一到 uni storage。
- 教学为动态步骤提示，不强制锁定错误步骤；未实现完整关卡编辑器、双语、触控灵敏度设置、存档多版本迁移和性能降级状态机。
- 加速度计为显式启用，3 秒无数据可降级。传感器回调通过 uni-app 桥接，H5 可使用 DeviceMotion；真实设备方向、采样延迟、权限、后台恢复和音频支持仍需验证。
- 未验证 Android 8 / iOS 13 最低版本兼容性、220 刚体性能、电量与发热，也未宣称达到文档所有 NFR 指标。
