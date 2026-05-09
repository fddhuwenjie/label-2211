## How to Run

### Docker 启动

```bash
docker-compose up --build -d
```

启动后访问: http://localhost:8081

停止服务:

```bash
docker-compose down
```

### 本地启动

```bash
cd frontend
npm install
npm run dev
```

启动后访问: http://localhost:5173

## Services

| 服务     | 端口 | 说明                          |
| -------- | ---- | ----------------------------- |
| frontend | 8081 | macOS 模拟器前端 (Nginx 托管) |

## 测试账号

本项目为纯前端项目，无需登录，无测试账号。

## 题目内容

帮我设计一个网页，使用Vue技术，实现网页端的模拟Mac OS系统，实现一些基本的功能，如终端，模拟的浏览器。可以在网页端运行

技术栈：Vue 3 + Vite，Docker + Nginx 部署

## 项目结构

```
├── docker-compose.yml              # Docker 编排配置，前端映射到 8081 端口
├── .gitignore                      # Git 忽略规则
├── README.md                       # 项目说明文档
└── frontend/                       # 前端项目（Vue 3 + Vite）
    ├── Dockerfile                  # 多阶段构建：Node 编译 + Nginx 托管（跨平台 ARM/X86）
    ├── nginx.conf                  # Nginx 配置，SPA history 模式 + 静态资源缓存
    ├── .dockerignore               # Docker 构建忽略规则
    ├── package.json                # 项目依赖与脚本
    ├── vite.config.js              # Vite 构建配置
    ├── index.html                  # 入口 HTML
    └── src/
        ├── main.js                 # 应用入口，挂载 Vue 实例，注册全局错误处理
        ├── App.vue                 # 根组件：桌面、窗口管理、拖拽/缩放、壁纸切换
        ├── style.css               # 全局样式重置
        ├── utils/
        │   └── logger.js           # 统一日志系统（DEBUG/INFO/WARN/ERROR，内存缓冲，控制台输出）
        └── components/
            ├── MenuBar.vue         # 顶部菜单栏：Apple/File/Edit/View/Window/Help 下拉菜单 + 快捷键
            ├── Dock.vue            # 底部 Dock 栏：应用图标、运行状态指示、hover 放大动效
            ├── MacWindow.vue       # 通用窗口组件：标题栏、红绿灯按钮、拖拽移动、缩放调整
            └── apps/
                ├── TerminalApp.vue     # 终端模拟器：虚拟文件系统、20+ 命令、历史记录、Tab 补全、logs 命令
                ├── BrowserApp.vue      # Safari 浏览器：多标签页、地址栏导航、模拟网页（GitHub/Vue/MDN/SO）
                ├── FinderApp.vue       # 文件管理器：目录浏览、文件预览、网格/列表视图切换
                ├── NotesApp.vue        # 备忘录：多笔记管理、实时编辑
                ├── CalculatorApp.vue   # 计算器：四则运算、百分比、正负切换
                └── SettingsApp.vue     # 系统偏好设置：壁纸切换、系统信息、显示器信息
```
