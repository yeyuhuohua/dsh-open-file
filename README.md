# open-cwd

在 DeepSeek Harness Web GUI 输入框工具行「+」「Workspace Write」**之后**添加一个「目录」按钮，点击用系统文件管理器打开**当前会话工作区目录**的持久化插件。

- **macOS**：`open <路径>` → Finder
- **Windows**：`explorer <路径>` → Explorer
- 兼容 Linux / WSL

## 目录结构

```
open-cwd/
├── package.json        # 包声明：dsh.client 双面包（web 平台）
├── lib/
│   ├── index.js        # Host 半：no-op（仅为让组合行挂载、触发 client 扫描）
│   └── client.js       # Client 半：ModuleLoader bundle，注册「目录」按钮
└── README.md           # 本文档
```

## 安装（新机器部署）

### 1. 放置代码

把本文件夹放到任意位置，例如 `~/code/open-cwd/`。

### 2. 创建符号链接

让 DSH 的 profile 能解析到这个包：

```bash
mkdir -p ~/.dsh/profiles/web/node_modules
ln -sfn /你的路径/open-cwd ~/.dsh/profiles/web/node_modules/open-cwd
ln -sfn /你的路径/open-cwd ~/.dsh/profiles/node_modules/open-cwd
```

### 3. 在 profile patch 层挂载插件行

编辑 `~/.dsh/profiles/web/cordis.patch.yml`，加入：

```yaml
- insert:
    - id: open-cwd
      name: open-cwd
```

### 4. 生效

- **热加载**：`cordis.patch.yml` 被 HMR 监听，通常改完自动生效；若没反应，**追加一行注释**再保存，或直接重启 dsh。
- **刷新浏览器页面**（必须刷新一次，新的客户端 bundle 才会被加载）。
- 注意：修改 `lib/client.js` 后若未生效，重启 dsh（bundle 内容在挂载时哈希缓存）。

## 行为说明

- 按钮解析当前会话所属工作区（`useWorkspaces` 快照，按 `sessionIds` 匹配；找不到回退最近使用的工作区 `recentWorkspaceId`），点击调用 Client `workspaces.openPath(path)`。
- 当前会话没有工作目录（cwd）时按钮禁用。
- 悬停按钮显示完整目录路径。

## 行为说明（v2，2026-09-08 适配 dsh 前端升级）

- v1 依赖的 `conversation.input.left` InputZone owner props 与 Client `workspaces.openPath` 已在新版移除。
- v2 改为：会话工作目录取自 `ctx.sessions.list` 快照的 `byId[sessionId].cwd`；
  打开动作调用 Host 侧 `session.openWorkspacePath`（内部即跨平台 openNativePath，
  macOS `open` / Windows `Invoke-Item`）。

## 故障排查

| 现象 | 处理 |
| --- | --- |
| 页面里没有按钮 | 刷新页面；`curl http://127.0.0.1:3080/ | grep open-cwd` 看 boot 清单；必要时重启 dsh |
| 按钮点了没反应 | 悬停看 tooltip 是否显示「未找到当前工作目录」；确认会话挂在某个工作区下 |
| 双份按钮 | 之前跑过同名动态插件且未停止；`cordis_stop` 对应动态插件或重启 dsh |

## 卸载

1. 删除 `~/.dsh/profiles/web/cordis.patch.yml` 中的 `open-cwd` 行
2. 删除两个符号链接
3. 重启 dsh；本文件夹可保留作为源码备份

## 版本历史

- v1（动态插件 `opcwd-1/pkg-1`）：会话级临时插件，进程重启即消失
- v1.0：持久化包，随 dsh 启动自动挂载
- v1.1（2026-09-08）：适配 dsh 前端升级（slot props 契约变化 + `workspaces.openPath` 移除），改用 `session.openWorkspacePath`
