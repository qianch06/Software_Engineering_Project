# 失衡空间 · Gravity Shift 0.2

基于需求文档与游戏设计文档扩展的单机物理解谜游戏。包含 **3 个教学关 + 3 章各 5 关 + 15 个可解锁倒映关**。所有游戏资源随包提供，运行无需联网。

## HBuilderX 运行与 APK 云打包

**当前发布目标只有 Android APK。** H5 可用于浏览器调试；APK 应使用 HBuilderX 的“原生 App 云打包”。

1. HBuilderX → 文件 → 导入 → 从本地目录导入，选择本项目根目录。保持 uni-app / Vue3 类型，安装 HBuilderX 提示的 Vue3 编译插件。
2. 运行 → 运行到浏览器 → Chrome，验证 H5。项目根 `index.html` 是标准 uni-app 入口，不再跳转绕过 Vue 编译。游戏由页面内的本地 WebView 承载。
3. 打开本项目 `manifest.json` 的“基础配置”，在 HBuilderX 登录自己的 DCloud 账号，点击“应用标识（AppID）”后方的**获取/重新获取**。当前字段为空，旧的无效占位值已清除。AppID 由 DCloud 分配，你不用把它发给我，也不要自己编造。
4. 工程仅保留 Android 发布配置：名称“失衡空间”、版本 `0.2.0 / 200`、横屏，包名暂为 `com.gravityshift.game`。如果云打包校验提示包名尚未在开发者中心录入，它是警告；请按 HBuilderX 提示在应用详情中录入或换用你已登记的包名。后续更新 APK 时应保持相同包名和签名。
5. App 图标已配置在 `static/icons/`。按需在可视化界面选用 `static/icons/icon.png`。
6. 发行 → 原生 App → 云打包，只选择 Android，选择可用的云端证书或已有签名证书，输出格式选 APK，提交打包。菜单文案可能随 HBuilderX 版本略有变化。
7. 从打包结果页下载 APK，安装到 Android 真机，执行下文的真机验证。账号登录、AppID 所属权限、签名选择和云端打包额度由 DCloud 验证，本仓库不保存账号密码或证书私钥。

官方说明：[HBuilderX 运行与发布](https://uniapp.dcloud.net.cn/quickstart-hx)、[App 打包](https://uniapp.dcloud.net.cn/tutorial/app-pack.html)、[本地 WebView](https://uniapp.dcloud.net.cn/component/web-view)。

**当前完成了本地 H5 和 Android App 资源编译，尚未提交 DCloud 云打包或生成已签名 APK。** App 资源编译成功不能替代 APK 签名、安装及真机验收。

## 无构建快速试玩

双击 **`play.html`**，或直接用浏览器打开 `static/game/index.html`。该入口用于快速离线试玩；根目录 `index.html` 请通过 HBuilderX 运行。

也可运行：

```powershell
python -m http.server 8765 --bind 127.0.0.1
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

最后一条在 AppID 尚未由 HBuilderX 获取时会提示待处理，这不影响浏览器试玩。若 HBuilderX 不位于本项目上两级目录的 `HBuilderX` 文件夹，可设置：

```powershell
$env:HBUILDERX_HOME = '你的 HBuilderX.exe 所在目录'
```

输出目录：

- `unpackage/dist/build/h5/`：H5 发布资源，可用静态服务器访问。
- `unpackage/dist/build/app-plus/`：App 打包资源，**不是 APK**。

`vite.config.js` 同时处理 HBuilderX 的发行构建：静态 WebView 脚本显式降语法至 Chrome 61 / Safari 13，避免静态目录绕过 Vite 转译。该处理解决语法兼容，不代表最低系统版本的全部 API、音频、布局已经真机验证。uni 统计与非必要分析功能已关闭。

## 操作

| 功能 | 手机 / 鼠标 | 桌面快捷键 |
| --- | --- | --- |
| 重力 | 拖动右下圆盘，松手保持；引力工具中也可在空白处滑动 | 方向键 / WASD |
| 设备倾斜 | 点击“启用倾斜”；无数据 3 秒后退回圆盘 | 圆盘替代 |
| 倾斜校准 | 暂停 → 偏好设置 → 校准中立位置 | 同左 |
| 木板 | 点木板工具，在场景拖放；点 ⤾ 旋转 15° | 2，Q / E 或滚轮旋转 |
| 画线 | 点画线工具，画出路径后松手 | 3 |
| 缩放 | 可缩放关卡中双指捏合小球，或点 − / + | − / +，滚轮 |
| 搬运方块 | 引力工具下直接拖动指定方块，松手恢复自由运动 | 鼠标拖动 |
| 撤销 / 清理 | ↶ / ⌫；返还库存，也可撤销缩放 | Z 撤销 |
| 暂停 / 重置 | 顶部按钮；后台、失焦自动暂停，恢复需手动继续 | 空格 / Esc，R 重置 |

画线每条最多 20 段、长度 1152 逻辑像素、耗时 5 秒。木板固定在落点。球进入匹配且已解锁的收集器后减速吸附，停留约 0.25 秒即入仓。颜色不匹配和链未完成会拒绝入仓，保留球供再次尝试。

重置保留本次累计时间与重置次数；结算后重玩开启新一次计分。三星需达到本关时间目标且零重置，二星允许最多两次重置；分别保存历史最佳星级、最短时间及最少重置次数。复杂关目标用时更宽松，点击 `?` 查看。

## 关卡与系统

| 章节 | 关卡 | 主要内容 |
| --- | --- | --- |
| 序章 | 初识引力 / 支点与桥 / 小一点，近一点 | 重力、杠杆、搭桥、缩放、画线 |
| 第一章 | 微光的轨迹 / 两端之间 / 光的回声 / 向上的可能 / 万物相连 | 惯性、杠杆、翻转门、弹簧、组合路线 |
| 第二章 | 悬空的答案 / 画出一条归途 / 尺度之外 / 等长的两端 / 静止的秩序 | 缺口、危险区、窄缝、等长滑轮、堆叠 |
| 第三章 | 光门的时限 / 逆流而上 / 水流的方向 / 三色回廊 / 回廊的回声 | 脉冲门与保持开关、局部重力、水流、染洗与顺序链 |
| 倒映章 | 15 个正式关的镜像版本 | 收集 15 个正式关碎片解锁，左右翻转、工具收窄，成绩独立 |

其他功能：选关锁定与星级、继续最近关卡、提示、暂停/失败/结算、音效和振动开关、三档重力/触控灵敏度、存档迁移/备份恢复/失败重试、调试快照。

主菜单不提供跳过所有关卡或直接解锁入口。游戏允许探索不同重力路径，不强制唯一解；部分机关可通过有技巧的绕行替代。

## 工程结构

```text
App.vue / main.js / index.html              标准 uni-app Vue3 启动
manifest.json / pages.json / vite.config.js 平台、页面及构建配置
pages/index/index.vue                       本地 WebView 与 uni 传感器/生命周期桥接
play.html                                  独立离线试玩入口
static/game/data/levels.json                18 关可编辑源数据
static/game/js/levels.js                    生成后的离线关卡脚本
static/game/js/physics.js                   Matter.js 封装、约束、拖拽和滑轮投影
static/game/js/core.js                      校验、评分、存档、重力、Link、顺序与镜像变换
static/game/js/runtime.js                   固定步长关卡逻辑、传感区、目标与事件
static/game/js/platform.js                  HTML5+ / 浏览器平台与存储适配
static/game/js/game.js                      页面状态、工具、输入与 HUD
static/game/js/renderer.js                  Canvas2D、场区、机关与粒子
static/icons/                              应用图标
scripts/                                   关卡生成、编译与打包前检查
tests/                                     核心、关卡运行、参考操控及浏览器测试
```

编辑 `static/game/data/levels.json` 后执行 `node scripts/build-levels.cjs`。无需修改循环即可增加现有机制的关卡。机制和目标的字段约定以该 JSON 和 `core.js` 的入口校验为准；原设计中的调整见 `docs/03-开发修订与验收说明.md`。

坐标基准 1920×1080，物理 60Hz 固定步长，DPR≤2。机关时序使用模拟时间，暂停不会消耗脉冲时间或稳定窗口。Matter 类型仅存在于物理层，其他模块使用普通快照。

App 使用 HTML5+ `plus.storage` 保存游戏数据，H5 使用 localStorage。v1 成绩会迁移到 v2；v2 损坏时尝试上次备份，损坏原文另存，写入失败暂存于内存并重试。浏览器和 App 的存档互相独立；修改 DCloud AppID / Android 包名或卸载清数据会影响旧安装的存档。

## 验证

```powershell
node --test tests/core.test.cjs tests/runtime.test.cjs tests/playability.test.cjs
```

包含格式与引用校验、质量守恒、固定步长确定性、四种 Link 语义、错序恢复、染洗/过滤、场区受力、滑轮绳长、堆叠中断与完成、碎片去重、18 普通关与 15 镜像关 10 秒静置、存档迁移及损坏恢复。参考控制器使用合法重力向量完成 17 个运输关，不注入通关、穿透或瞬移；它验证存在解，并不评估谜题难度。堆叠的规则和实际鼠标/触摸拖动分别测试。

浏览器测试要求本机安装 Chrome 和可用的 Playwright，并先启动上述 HTTP 服务。若 Playwright 不在默认模块路径，可设置 `$env:PLAYWRIGHT_PATH` 为已有 playwright 包绝对目录：

```powershell
node tests/browser.cjs
node tests/h5-build.cjs
```

第二条需先编译 H5/App 资源。测试覆盖真实键盘通关、实际触摸捏合/搬运、工具撤销、暂停、染色与机关、存档、无网络文件试玩、H5 编译产物中的 iframe、解锁和横竖屏。截图位于 `tests/artifacts/`。

仍须在签名 APK 上验证：冷启动与横屏、倾斜轴向与校准、无传感器降级、Android 返回键、前后台保持暂停、杀进程恢复、离线重启与存档、真机触摸安全区、持续游玩帧率/温度/功耗。当前未声称达到原文 20 款 Android + 6 款 iOS 的兼容矩阵。
