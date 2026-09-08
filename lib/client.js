window.__ModuleLoader__.load({
  id: "open-cwd",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require("react");

    // 在输入框工具行「+」「Workspace Write」之后渲染「目录」按钮，
    // 点击用系统文件管理器打开当前会话工作目录。
    // 平台适配：Host session.openWorkspacePath → openNativePath
    //   （macOS: open → Finder；Windows: powershell Invoke-Item → Explorer）。
    // v2（2026-09-08）：适配 dsh 前端升级后的契约。
    // v2.1（诊断版）：点击后按钮右侧显示每一步结果，用于定位点击无效问题。

    var CSS = ".dshOpenCwd_btn{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 8px;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;line-height:20px;white-space:nowrap;cursor:pointer;flex:none}.dshOpenCwd_btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}.dshOpenCwd_btn:disabled{opacity:.5;cursor:default}.dshOpenCwd_msg{font-size:12px;line-height:20px;max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dshOpenCwd_msgOk{color:var(--dsw-alias-state-success-primary)}.dshOpenCwd_msgErr{color:var(--dsw-alias-state-error-primary)}";

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
      var statePair = React.useState(null);
      var feedback = statePair[0];
      var setFeedback = statePair[1];
      var cwd = currentCwd(ctx, sessionId);
      var disabled = cwd === undefined;
      function onClick() {
        if (disabled) return;
        setFeedback({ kind: "busy", text: "打开中…" });
        var path = currentCwd(ctx, sessionId);
        if (path === undefined) {
          setFeedback({ kind: "error", text: "未找到会话工作目录" });
          return;
        }
        fetch("/open-cwd/open?path=" + encodeURIComponent(path), { cache: "no-store" })
          .then(function (r) {
            return r.json().catch(function () {
              return { kind: "error", message: "HTTP " + r.status };
            });
          })
          .then(function (res) {
            if (res !== null && res !== undefined && res.opened === true) {
              setFeedback({ kind: "ok", text: "已打开" });
            } else {
              var msg = res !== null && res !== undefined && typeof res.message === "string"
                ? res.message
                : "未知错误";
              setFeedback({ kind: "error", text: "打开失败: " + msg });
            }
          })
          .catch(function (err) {
            setFeedback({ kind: "error", text: "请求失败: " + (err !== null && err !== undefined && err.message !== undefined ? err.message : String(err)) });
          });
      }
      var title = disabled ? "未找到当前工作目录（cwd）" : "在文件管理器中打开当前工作目录：" + cwd;
      var feedbackNode = null;
      if (feedback !== null) {
        var cls = "dshOpenCwd_msg" + (feedback.kind === "error" ? "Err" : feedback.kind === "ok" ? "Ok" : "");
        feedbackNode = React.createElement("span", { className: cls }, feedback.text);
      }
      return React.createElement(
        "div",
        { style: { display: "inline-flex", alignItems: "center", gap: "6px", minWidth: 0 } },
        React.createElement(
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
        ),
        feedbackNode
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
