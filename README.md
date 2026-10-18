# The Egg — Re:Call / Memory Sync

React + TypeScript + Vite / Three.js / React Three Fiber / Drei / Zustand / Rapier 第一人称探索游戏。以贝鲁特 The Egg 为背景的虚构多楼层关卡，不是建筑测绘复原。2F、3F、4F 各为 20 × 40 米；两组外接楼梯真实连接，5F 仅为结尾。默认韩语文案，无独立人物或雕像；九人海报只出现在墙面投影中。

## 启动（Windows / Chrome）

安装 Node.js 22.12+ 或 24 LTS，在项目目录运行：

```sh
npm ci
npm run dev
```

桌面 Chrome 打开终端给出的本机地址。没有数据库、账号或 API 密钥。云机的内部地址不是公网网址。

## 操作

| 操作                             | 键盘 / 鼠标                 | 标准映射手柄 |
| -------------------------------- | --------------------------- | ------------ |
| 开始、调查、拾取、阅读确认、开门 | Enter                       | A / RT       |
| 行走 / 视线                      | WASD / 鼠标                 | 左 / 右摇杆  |
| 下蹲                             | 按住左 Shift，松开站立      | 按住 LB      |
| 背包                             | I，左右箭头选择，Enter 阅读 | 使用键盘 I   |
| 暂停 / 继续                      | Esc / Enter                 | 继续 A       |
| 重新开始                         | 暂停时 R，结尾 Enter        | 结尾 A       |

无鼠标点选道具或 UI 确认；鼠标按钮仅可用于恢复视角锁定。阅读界面自动释放鼠标，Enter 关闭后恢复游玩。两米以内且准星对准触发盒才显示提示，实体遮挡会阻止互动。票根、光照座椅、柜子下的碎片需要下蹲。

## 完整流程（剧透）

1. **2F CINEMA**：检票台后蹲下调查票根 → 根据西侧四点阳光找到唯一高光座椅 → 蹲下取得第二张票根和 Key 01 → 出口消耗 Key 01 → 沿真实台阶上楼，到顶部绕回廊 → Enter 推开无需钥匙的 3F 入口。
2. **3F SCAR**：中央办公桌取地图 → 柜子下、沙袋旁、角落书架各找一张照片碎片 → 回办公桌 Enter 拼合 → Enter 确认复原，抽屉缓慢弹出 → 单独调查抽屉里的 Key 02 → 出口消耗钥匙 → 实体楼梯及回廊到 4F 入口，Enter 推开。
3. **4F DREAM**：投影台 Enter 放票根，再 Enter 放复原照片 → 放映约 8 秒 → 物理胶片盒盖弹开 → 单独拾取盒内 Key 03 → 消耗钥匙开最后一扇门 → 实际走过门后显示 “To be continued”。

没有黑屏过场、楼层传送或强制摄像机转向。所有楼层及碰撞在一个场景中；根据所在楼层剔除不可见空间的绘制以减少负担，物理位置连续。每段楼梯 40 个真实台阶，踏步高 0.175 米，深 0.32 米，没有隐藏斜坡。角色控制器自动上小台阶、贴地、下蹲头顶检测。

每次页面加载、刷新、暂停菜单重新开始、结尾重新开始都执行 resetGame()。清空背包和钥匙，关闭所有门，重置抽屉、刚体盒盖、投影进度、角色位置与视角；不读取旧存档。钥匙使用后消耗，但历史获得进度仍显示，禁止重复拾取。

## 资源与美术

- 用户提供的 ZIP 内 `1013.png` 已原样复制为 `public/assets/memora-poster.png`，SHA-256 保持一致。投影读取这张真实文件，保留 687:1030 原始比例，不裁切、不改画人物、不变形；仅轻微调整整体投影亮度。
- **尚未提供真实历史照片**。目前 `public/assets/archive-study.svg` 是原创建筑示意图，UI 明确注明不是历史照片。准备好有权使用的历史照片后放入 `public/assets/`，在 `src/game/assets.ts` 设置 `historicalPhoto`。三个碎片和复原画面会共用同一张图。
- 程序化网格有倒角、破损与褶皱；材质有颜色、法线、粗糙度贴图。目标绒布 roughness=0.2，普通绒布=0.8；反射水面强度 0.4。不是扫描级资产或 inZOI 级成品画质。
- 当前没有新增完整配音或正式音效；事件桥接保留给后续音频及 TouchDesigner。

详见 [资产清单与替换说明](docs/ASSETS.md)。

## 开发结构

| 模块                                 | 用途                                             |
| ------------------------------------ | ------------------------------------------------ |
| src/game/store.ts                    | 单例 GameManager、物品、照片、钥匙消耗、开局重置 |
| src/game/input.ts                    | 单一输入管理器、按键清理、摇杆死区               |
| src/game/content.ts                  | 韩语文案与任务提示                               |
| src/game/assets.ts                   | 海报 / 历史照片路径                              |
| src/scene/layout.ts                  | 2F 布局及全部楼层交互触发盒                      |
| src/scene/Player.tsx                 | 胶囊碰撞、台阶、头顶检测、2 米遮挡射线           |
| src/scene/Architecture.tsx           | 共用实体模型、门轴与同步运动碰撞、楼梯           |
| src/scene/UpperFloors.tsx            | 3F 地图 / 照片 / 办公桌、4F 外壳                 |
| src/scene/ProjectorSystem.tsx        | 实体投影仪、原画投射、刚体盒盖、Key 03           |
| src/scene/geometry.ts / materials.ts | 程序化网格和 PBR 材质                            |
| src/ui/Interface.tsx                 | 阅读、地图、分片照片、背包、结尾                 |
| src/game/events.ts                   | CustomEvent 和可选外部 WebSocket 接口            |

事件结构含 eventName、timestamp 和状态数据。不连接 TouchDesigner 也能通关；TouchDesigner 不在浏览器里运行。新增楼层时延伸真实建筑及楼梯、补充独立状态与目标；不要把角色直接传送到新坐标。

## 验证

```sh
npm test
npm run build
npm run test:e2e
```

浏览器测试使用本机 Chromium，Linux 默认为 /usr/bin/chromium。Windows PowerShell 可设置 `$env:CHROMIUM_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'`。

测试使用仅开发态 `?test=1` 接口定位关卡检查点；两段完整楼梯及回廊使用实际 WASD 连续行走，不传送。道具调查走真实准星、距离、遮挡和按键路径。生产构建移除调试接口。第一遍陌生探索时长未做用户实测，不保证固定分钟数。

## 网页部署

GitHub Pages 的 Source 设为 GitHub Actions。推送 main 自动运行单元测试、构建与发布。仓库子路径 /HEY-Studio/ 由 Vite 的 GitHub Actions 构建配置处理。其他静态托管执行 npm run build 后发布 dist/。环境快照不等于公网托管。
