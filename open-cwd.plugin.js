// open-cwd 动态 Cordis 插件源码（opcwd-1/pkg-1）
// 用途：在输入框工具行「+」「Workspace Write」之后添加「目录」按钮，
//       点击用系统文件管理器打开当前会话工作区目录（macOS Finder / Windows Explorer）。
// 恢复方法：重启 DSH 后，让智能体读取本文件并用 cordis_define(kind: new, idPrefix: 'opcwd')
//           + cordis_run 重新激活即可（需一次界面授权）。
// 平台适配：调用 Client workspaces.openPath() → Host openNativePath（darwin: open / win32: explorer）。

return {
  apply(ctx) {
    styles.insert(`
      .dsh-open-cwd-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 28px;
        padding: 0 8px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--dsw-alias-label-secondary);
        font-size: 13px;
        font-weight: 500;
        line-height: 20px;
        white-space: nowrap;
        cursor: pointer;
        flex: none;
      }
      .dsh-open-cwd-btn:hover:not(:disabled) {
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-primary);
      }
      .dsh-open-cwd-btn:disabled {
        opacity: 0.5;
        cursor: default;
      }
    `)
    const slots = ctx.get('slots')
    if (slots === undefined) return
    slots.inject('conversation.input.left', () => slots.register(
      { name: 'conversation.input.left', id: 'open-cwd' },
      (props) => {
        // standardProps: useWorkspaces; owner props: InputZone { session, input }
        const items = props.useWorkspaces((s) => s.items)
        const recentId = props.useWorkspaces((s) => s.recentWorkspaceId)
        const sessionId = props.session.sessionId
        let target = null
        if (Array.isArray(items)) {
          target = items.find((w) => w.sessionIds.includes(sessionId)) || null
          if (!target && recentId !== undefined) {
            target = items.find((w) => w.workspaceId === recentId) || null
          }
        }
        const onClick = () => {
          if (target === null) return
          const workspaces = ctx.get('workspaces')
          if (workspaces === undefined) return
          workspaces.openPath(target.path).catch((err) => {
            console.error('open workspace path failed', err)
          })
        }
        const title = target === null
          ? '未找到当前工作目录'
          : '在文件管理器中打开当前工作目录：' + target.path
        return React.createElement(
          'button',
          {
            type: 'button',
            className: 'dsh-open-cwd-btn',
            onClick: onClick,
            disabled: target === null,
            title: title,
            'aria-label': '打开当前工作目录',
          },
          React.createElement(
            'svg',
            { viewBox: '0 0 16 16', width: '14', height: '14', fill: 'none', stroke: 'currentColor', strokeWidth: '1.2', 'aria-hidden': true },
            React.createElement('path', { d: 'M1.5 4.5a1 1 0 0 1 1-1h3.2l1.6 2h6.2a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-7.5z' }),
          ),
          React.createElement('span', null, '目录'),
        )
      },
    ))
  },
}
