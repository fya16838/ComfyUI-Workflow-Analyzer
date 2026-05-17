# ComfyUI Workflow Analyzer

分析 ComfyUI 工作流，识别所有自定义节点及其 GitHub 下载地址，并可一键通过 ComfyUI-Manager 安装。

Analyze ComfyUI workflows, identify all custom nodes with GitHub download URLs, and install them via ComfyUI-Manager with one click.

Inspired by [comfyai.run/workflow](https://comfyai.run/workflow).

## Features / 功能

- 🔍 **Floating button** — freely draggable, position saved | 悬浮按钮，可自由拖拽
- 📂 **Drag & drop** — drop a `.json` workflow file into the dialog | 拖入工作流文件
- 🧠 **Smart parsing** — 28K+ node types from ComfyUI-Manager DB | 智能解析 28K+ 节点
- ⬇️ **One-click install** — via ComfyUI-Manager (individual or batch) | 一键安装
- 🌐 **i18n** — English / 中文, switchable in dialog header | 界面语言可切换

## Language / 语言支持

Language files are in `Language/` folder. To add a new language:
1. Create `Language/fr.json`, copy from `en.json` and translate
2. Restart ComfyUI — it appears in the language selector

语言文件位于 `Language/` 文件夹。添加新语言：
1. 创建 `Language/fr.json`，复制 `en.json` 并翻译
2. 重启 ComfyUI — 语言选择器自动出现

## Usage / 使用

**Method 1 — Floating button / 悬浮按钮:**
- Click the 🔍 button → drop a workflow file
- 点击 🔍 按钮 → 拖入工作流文件

**Install / 安装:**
- Click "⬇ Install" per node or "⬇ Install All" for batch
- 点击单个 "⬇ 安装" 或 "⬇ 全部安装"

## File Structure

```
ComfyUI-Workflow-Analyzer/
├── __init__.py              # Backend: 5 API routes + node lookup + CM integration
├── js/
│   └── workflow-analyzer.js # Frontend: floating btn + ctx menu + i18n + drag-drop + install
├── Language/
│   ├── en.json              # English language pack (31 keys)
│   └── zh.json              # 中文语言包
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/wf-analyzer/languages` | List available languages |
| GET | `/wf-analyzer/lang/{code}` | Get language pack |
| GET | `/wf-analyzer/node-map` | Get class_type→URL reverse mapping |
| POST | `/wf-analyzer/analyze` | Analyze a workflow JSON |
| POST | `/wf-analyzer/install-nodes` | Install nodes via ComfyUI-Manager |
