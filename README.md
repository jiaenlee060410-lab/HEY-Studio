# The Egg — Re:Call / Memory Sync

React + TypeScript + Vite / Three.js / React Three Fiber / Drei / Zustand / Rapier 的第一人称环境探索游戏。场景为 20 × 40 米矩形废弃影院，内部采用 S 型通路；没有人物。中文开发文档，默认韩语游戏文案。

## 运行

安装 Node.js 22.12+ 或 24 LTS。在 Windows PowerShell 或终端进入项目目录后执行：

```sh
npm ci
npm run dev
```

使用桌面 Chrome 打开终端显示的本机地址。云机的内部地址不等于公开网址。无需账号、数据库、付费资产或 API 密钥。

## 操作

| 操作                 | 键盘 / 鼠标                   | 标准映射手柄 |
| -------------------- | ----------------------------- | ------------ |
| 开始、调查、阅读确认 | Enter                         | A 或 RT      |
| 行走                 | WASD                          | 左摇杆       |
| 视线                 | 鼠标                          | 右摇杆       |
| 下蹲                 | 按住左 Shift，松开站立        | 按住 LB      |
| 背包                 | I，左右箭头选条目，Enter 阅读 | 键盘 I       |
| 暂停                 | Esc，Enter 返回               | 键盘 Esc     |
| 重新开始             | 暂停时 R / 结尾 Enter         | 结尾 A       |

所有主线确认都通过 Enter/A/RT 完成，不需要鼠标按钮。阅读时鼠标自动释放，Enter 关闭后恢复。每次页面加载和重新开始均执行 `resetGame()`，重置钥匙、线索、物体、角色位置与视线。不读取历史存档。

## 新流程（包含剧透）

1. 到检票台后侧的较干净地面，按住 Shift，准星瞄准碎块下的票根。1 米内 Enter 调查，再 Enter 保管。
2. 票上只描述西侧下午四点的光。寻找受光座椅，调查坐垫缝里的第二张纸条，获得 Key 01 / LIGHT。
3. 纸条提示靠墙的空位。绕到最深处墙角，蹲下打开胶片盒，阅读平面图并获得 Key 02 / CINEMA。
4. 返回寻找与图中完全相同的涂鸦符号。调查后墙面剥落；再次调查显露的 Key 03 / DREAM。
5. 前往出口，Enter 开门，获得 5F STAGE 权限。五楼目前是下一章节占位页。

旧 B12 / 0812 密码任务已由本次线索流程替换。所有物件必须在准星射线上且距离触发盒表面不超过 1 米；遮挡物会阻断调查。首次探索的设计目标为 4–5 分钟，没有倒计时和强制等待；熟悉答案后可以更快完成。

## 开发与资源

- `src/scene/layout.ts`：米制布局、物体与触发盒位置。
- `src/scene/geometry.ts`：倒角、破边、软垫、管线、破口与碎片网格。
- `src/scene/materials.ts`：原创颜色/法线/粗糙度贴图与受光座椅的纤维高光着色。
- `src/scene/Player.tsx`：Rapier 胶囊角色、下蹲、射线遮挡和鼠标锁定。
- `src/game/input.ts`：输入所有者、手柄死区与按下边缘检测。
- `src/game/content.ts`：韩语主线文案。
- `src/game/store.ts`：线索条件、去重、重置与章节进度。
- `src/game/events.ts`：浏览器事件和可选 WebSocket 桥接。TouchDesigner 在浏览器外运行，未连接时可完成关卡。

资产说明与 GLB/PBR 替换方式见 [docs/ASSETS.md](docs/ASSETS.md)。后续楼层新增独立场景组件，在 5F 占位界面切换场景；不要复用本关的实体坐标。

## 验证

```sh
npm test
npm run build
npm run test:e2e
```

端到端测试使用本机 Chromium；Linux 默认为 `/usr/bin/chromium`。Windows 可在 PowerShell 设置 `$env:CHROMIUM_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'` 后运行。测试用开发态 `?test=1` 调试接口加速定位，调查、遮挡、碰撞与确认仍走实际游戏代码。该接口在生产构建中被移除。

## 发布

GitHub Pages 的 Source 设为 GitHub Actions 后，推送 `main` 将运行 `.github/workflows/deploy-pages.yml`。它使用仓库子路径 `/HEY-Studio/` 构建并发布 `dist/`。其他静态托管服务执行 `npm run build` 后上传 `dist/`（默认根路径）。环境发布/快照本身不会把游戏托管成公共网页。
