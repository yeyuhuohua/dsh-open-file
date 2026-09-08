window.__ModuleLoader__.load({
  id: "open-cwd",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require("react");

    // 在输入框工具行「+」「Workspace Write」之后渲染「目录」按钮，
    // 点击用系统文件管理器打开当前会话工作目录。
    // 平台适配：fetch Host 路由 /open-cwd/open → Host 侧按平台执行
    //   （macOS: open → Finder；Windows: powershell Invoke-Item → Explorer）。
    // v3（2026-09-08）：host HTTP 路由直连（remote RPC 会挂起）。
    // v3.1：去掉点击后的状态提示文字，恢复简洁按钮。

    var CSS = ".dshOpenCwd_btn{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 8px;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;line-height:20px;white-space:nowrap;cursor:pointer;flex:none}.dshOpenCwd_btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}.dshOpenCwd_btn:disabled{opacity:.5;cursor:default}";

    function currentCwd(ctx, sessionId) {
      if (sessionId === undefined || sessionId === null) return undefined;
      var sessions = ctx.get("sessions");
      if (sessions === undefined || sessions === null || sessions.list === undefined) return undefined;
      try {
        var snap = sessions.list.getSnapshot();
        if (snap === null || snap === undefined || snap.byId === undefined) return undefined;
        var summary = snap.byId[sessionId];
        if (summary === null || summary === undefined) return undefined;
        return typeof summary.cwd === "string" && summary.cwd !== "" ? summary.cwd : undefined;
      } catch (e) {
        return undefined;
      }
    }

    function OpenCwdButton(props) {
      var ctx = props.ctx;
      var sessionId = props.sessionId;
      var cwd = currentCwd(ctx, sessionId);
      var disabled = cwd === undefined;
      function onClick() {
        if (disabled) return;
        var path = currentCwd(ctx, sessionId);
        if (path === undefined) return;
        fetch("/open-cwd/open?path=" + encodeURIComponent(path), { cache: "no-store" })
          .then(function (r) {
            return r.json().catch(function () {
              return { kind: "error", message: "HTTP " + r.status };
            });
          })
          .then(function (res) {
            if (res === null || res === undefined || res.opened !== true) {
              var msg = res !== null && res !== undefined && typeof res.message === "string"
                ? res.message
                : "unknown error";
              console.error("open-cwd: open failed:", msg);
            }
          })
          .catch(function (err) {
            console.error("open-cwd: open failed", err);
          });
      }
      var title = disabled ? "未找到当前工作目录（cwd）" : "在文件管理器中打开当前工作目录：" + cwd;
      return React.createElement(
        "button",
        {
          type: "button",
          className: "dshOpenCwd_btn",
          onClick: onClick,
          disabled: disabled,
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
              sessionId: props !== undefined && props !== null ? props.sessionId : undefined
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
