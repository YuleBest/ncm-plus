# NCM Plus

一个基于 Vue 3 的云音乐第三方 Web 客户端，使用公开 API 提供音乐播放、搜索、歌手/专辑/歌单浏览等功能。

## TODO

**已实现**

- [x] 首页 — 精品歌单推荐 + 榜单预览
- [x] 播放器 — 全屏播放、歌词跟唱、Mini 播放器悬浮
- [x] 音质选择 — 标准 / 较高 / 极高，偏好持久化
- [x] 搜索 — 实时建议、热搜榜、四标签页结果（歌曲 / 歌手 / 歌单 / 专辑）、分页加载
- [x] 歌单详情 — 封面信息、完整曲目列表、分页加载
- [x] 歌手详情 — 热门歌曲与专辑标签页切换
- [x] 专辑详情 — 封面元信息、曲目列表、跳转歌手
- [x] 榜单页 — 所有官方榜单展示
- [x] 暗色 / 亮色主题切换
- [x] 评论区

**待实现**

- [ ] 登录
- [ ] 每日推荐（需登录）
- [ ] 收藏 / 取消收藏歌曲、歌单
- [ ] 播放队列面板
- [ ] 历史播放记录
- [ ] MV / 视频页面
- [ ] 用户主页
- [ ] ...

## 技术栈

| 层       | 选型                                               |
| -------- | -------------------------------------------------- |
| 框架     | Vue 3 + `<script setup>`                           |
| 路由     | vue-router 5 + unplugin-vue-router（文件系统路由） |
| 状态     | Pinia                                              |
| 请求     | Axios                                              |
| 图标     | lucide-vue-next                                    |
| 样式     | SCSS + CSS 变量（暗色 / 亮色双主题）               |
| 构建     | Vite                                               |
| 类型检查 | vue-tsc                                            |
| Lint     | ESLint + oxlint + Prettier                         |

**后端 API**：自托管 [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)，接口地址在 `src/api/request.ts` 中配置。

## 快速开始

**环境要求**：Node.js ^20.19.0 或 >=22.12.0，包管理器使用 pnpm。

```bash
# 安装依赖
pnpm install

# 开发模式（热重载）
pnpm dev

# 类型检查 + 生产构建
pnpm build

# 预览生产产物
pnpm preview
```

## 项目结构

```
src/
├── api/          # 接口定义（按模块拆分）
├── components/
├── layouts/
├── pages/        # 文件系统路由页面
├── stores/       # Pinia stores
├── styles/       # 全局样式与设计 Token
└── utils/        # 工具函数
```

## 开发命令

```bash
pnpm lint          # 运行 ESLint + oxlint 并自动修复
pnpm format        # Prettier 格式化 src/
pnpm test:unit     # Vitest 单元测试
pnpm type-check    # vue-tsc 类型检查
```

## 说明

本项目仅用于学习和技术探索，不用于商业用途。音乐版权归版权方所有。
