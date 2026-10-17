# Re:Call — MEMORY SYNC / 2F CINEMA

一个可在浏览器运行的第一人称 Three.js 原型。当前版本用功能性几何体搭建场景，刻意不声称已达到参考视频的写实品质。

## 安装与启动

需要 Node.js 20+。执行 `npm install`，然后执行 `npm run dev`；Chrome 打开命令显示的地址。生产构建使用 `npm run build`，部署 `dist/` 到任意静态托管（GitHub Pages、Vercel 或 Netlify）。

## 游戏操作

点击画面锁定鼠标；WASD 移动，Shift 加速，E 互动，I 打开背包，Esc 释放鼠标。流程：取票 → 找 B12 → 对木盒输入 `0812` 并按 `Enter` → 再取钥匙 → 开门。重新打开或刷新页面会从入口重新开始，不保留上次进度。

## 资源替换

`src/scene/Cinema.tsx` 集中管理场景占位几何体。将其中 `boxGeometry`/材质替换为 GLB（推荐 `useGLTF`）与 PBR 贴图即可；应保留当前物品的位置、比例和交互点（`src/scene/Player.tsx` 中 `targets`）一致。需要替换：混凝土、窗户、座椅、票、木盒、金属钥匙、门、海报、地面贴图。音效接口可在状态动作处接入，缺失音频不会影响可玩性。

## 内容与扩展

密码在 `src/ui/Interface.tsx` 的 `0812` 条件中调整；韩语文案主要在 `src/game/content.ts`，其余谜题文案位于 UI 组件。为新增楼层，新增独立 scene、store slice 与 UI，然后由完成页路由/切换过去。`src/game/events.ts` 会发出可供 TouchDesigner WebSocket 桥接的统一事件，默认不建立连接。
