# Art Archive

<div align="center">

**艺术素材管理平台 - 为艺术创作者打造的素材积累工具**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-40-47848F?logo=electron)](https://www.electronjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)

</div>

---

## 简介

Art Archive 是一款专为艺术创作者设计的桌面应用程序，帮助你系统化地管理艺术灵感与素材。无论是插画师、设计师还是摄影爱好者，都能通过它高效地收集、整理和发现创作素材。

## 功能特性

### 素材管理
- 多格式支持：JPG、PNG、GIF、WebP、BMP
- 智能分类：插画、摄影、3D艺术、字体设计、概念设计、角色设计、风景等
- 标签系统：自由添加标签，支持多维度筛选
- 收藏功能：快速收藏喜爱的素材
- 批量操作：支持批量导入和管理

### 素材发现
- Unsplash 集成：搜索和浏览海量高质量图片
- 每日主题：自动推荐每日绘画主题
- 一键收藏：将发现的素材直接保存到素材库
- 灵感推荐：相关主题推荐，拓展创作思路

### AI 画师助手
- 多 AI 服务支持：OpenAI、DeepSeek、Claude、智谱 AI、通义千问、自定义 API
- 绘画技法建议
- 构图与色彩分析
- 创作灵感推荐
- 对话历史保存

### 画板工具
- 多种画笔：钢笔、马克笔、水彩笔、喷枪等
- 颜色选择：色板、取色器、最近使用颜色
- 画布尺寸：多种预设尺寸，支持自定义
- 预设生成器：渐变、噪点、网格等背景生成
- 作品保存：导出 PNG 或直接保存到素材库

### 参考图画板
- 独立窗口：可与其他应用并排使用
- 窗口置顶：绘画时始终显示在最前方
- 自由布局：拖拽、缩放、旋转参考图
- 批量导入：一次性导入多张参考图
- 快捷操作：Ctrl+V 粘贴、滚轮缩放、中键平移

### 快捷采集
- 剪贴板采集：截图或复制图片后一键粘贴
- URL 采集：输入图片 URL 直接下载
- 文件拖拽：拖拽图片文件直接导入
- 悬浮窗口：小巧的采集工具，随时可用

### 作品展示
- 个人作品集展示
- 瀑布流布局
- 支持原创作品标记

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2 | 前端框架 |
| TypeScript | 5.9 | 类型安全 |
| Electron | 40.6 | 桌面应用 |
| Vite | 8.0 | 构建工具 |
| Tailwind CSS | 4.2 | 样式框架 |
| Framer Motion | 12.34 | 动画库 |
| Lucide React | 0.575 | 图标库 |
| React Router | 7.13 | 路由管理 |

## 项目结构

```
art-archive/
├── electron/                 # Electron 主进程
│   ├── main.cjs             # 主进程入口
│   ├── preload.cjs          # 预加载脚本
│   ├── preload-capture.cjs  # 快捷采集窗口预加载
│   ├── preload-reference.cjs# 参考图画板预加载
│   └── assets/              # 应用图标等资源
├── src/
│   ├── components/          # React 组件
│   │   ├── discover/        # 素材发现相关组件
│   │   ├── effects/         # 视觉效果组件
│   │   ├── features/        # 功能组件
│   │   └── layout/          # 布局组件
│   ├── context/             # React Context
│   ├── data/                # 静态数据
│   ├── pages/               # 页面组件
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   └── windows/             # 子窗口组件
├── public/                  # 静态资源
├── index.html               # 主窗口 HTML
├── capture.html             # 快捷采集窗口 HTML
├── reference.html           # 参考图画板 HTML
└── vite.config.ts           # Vite 配置
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动 Web 开发服务器
npm run dev

# 启动 Electron 开发模式
npm run electron:dev
```

### 构建打包

```bash
# 构建生产版本
npm run build

# 打包 Windows 应用
npm run electron:build:win

# 打包 macOS 应用
npm run electron:build:mac

# 打包 Linux 应用
npm run electron:build:linux
```

## 配置说明

### AI 服务配置

在「设置」页面配置你的 AI 服务：

| 服务 | 获取方式 |
|------|----------|
| OpenAI | [platform.openai.com](https://platform.openai.com/) |
| DeepSeek | [platform.deepseek.com](https://platform.deepseek.com/) |
| Claude | [console.anthropic.com](https://console.anthropic.com/) |
| 智谱 AI | [open.bigmodel.cn](https://open.bigmodel.cn/) |
| 通义千问 | [dashscope.aliyun.com](https://dashscope.aliyun.com/) |

### Unsplash 配置

1. 访问 [unsplash.com/developers](https://unsplash.com/developers)
2. 创建应用获取 Access Key
3. 在「设置」页面填入 Access Key

## 数据存储

应用数据存储在用户数据目录：

- **Windows**: `%APPDATA%/art-archive/`
- **macOS**: `~/Library/Application Support/art-archive/`
- **Linux**: `~/.config/art-archive/`

存储内容包括：
- `artworks.json` - 素材元数据
- `artworks/` - 素材图片文件
- `config.json` - 应用配置
- `reference-board.json` - 参考图画板数据

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+V` | 粘贴图片（参考图画板） |
| `Delete` | 删除选中项 |
| `Ctrl+0` | 重置缩放 |
| `Ctrl+Shift+F` | 适应全部 |
| `Space+拖拽` | 平移画布 |
| `滚轮` | 缩放画布 |

## 开发相关

### 代码规范

项目使用 ESLint 进行代码检查：

```bash
npm run lint
```

### 类型检查

```bash
npx tsc --noEmit
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

<div align="center">

**为艺术创作者打造**

</div>
