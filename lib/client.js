window.__ModuleLoader__.load({
  id: "open-cwd",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require("react");

    // 在输入框工具行「+」「Workspace Write」之后渲染「目录」按钮，
    // 点击用系统文件管理器打开当前会话工作区目录。
    // 平台适配：Client workspaces.openPath() → Host openNativePath
    //   （macOS: open → Finder；Windows: explorer → Explorer）。

    var CSS = ".dshOpenCwd_btn{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 8px;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;line-height:20px;white-space:nowrap;cursor:pointer;flex:none}.dshOpenCwd_btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}.dshOpenCwd_btn:disabled{opacity:.5;cursor:default}";

    function OpenCwdButton(props) {
      var ctx = props.ctx;
      var items = props.useWorkspaces(function (s) { return s.items; });
      var recentId = props.useWorkspaces(function (s) { return s.recentWorkspaceId; });
      var sessionId = props.session.sessionId;
      var target = null;
      if (Array.isArray(items)) {
        target = items.find(function (w) { return w.sessionIds.indexOf(sessionId) !== -1; }) || null;
        if (!target && recentId !== undefined) {
          target = items.find(function (w) { return w.workspaceId === recentId; }) || null;
        }
      }
      function onClick() {
        if (target === null) return;
        var workspaces = ctx.get("workspaces");
        if (workspaces === undefined) return;
        workspaces.openPath(target.path).catch(function (err) {
          console.error("open workspace path failed", err);
        });
      }
      var title = target === null
        ? "未找到当前工作目录"
        : "在文件管理器中打开当前工作目录：" + target.path;
      return React.createElement(
        "button",
        {
          type: "button",
          className: "dshOpenCwd_btn",
          onClick: onClick,
          disabled: target === null,
          title: title,
          "aria-label": "打开当前工作目录"
        },
        React.createElement(
          "svg",
          { viewBox: "0 0 16 16", width: "14", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "1.2", "aria-hidden": true },
          React.createElement("path", { d: "M1.5 4.5a1 1 0 0 1 1-1h3.2l1.6 2h6.2a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-7.5z" })
        ),
        React.createElement("span", null, "目录")
      );
    }

    var inject = ["slots"];

    function apply(ctx) {
      var slots = ctx.slots;
      if (slots === undefined) return;
      var style = document.createElement("style");
      style.textContent = CSS;
      document.head.appendChild(style);
      ctx.effect(function () { return function () { style.remove(); }; }, "open-cwd: button styles");
      slots.inject("conversation.input.left", function () {
        return slots.register(
          { name: "conversation.input.left", id: "open-cwd", order: 0, label: "打开工作目录" },
          function (props) {
            return React.createElement(OpenCwdButton, {
              ctx: ctx,
              session: props !== undefined && props !== null ? props.session : undefined,
              useWorkspaces: props !== undefined && props !== null ? props.useWorkspaces : undefined
            });
          }
        );
      });
    }
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
