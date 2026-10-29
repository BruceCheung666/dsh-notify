# Changelog

## 0.1.0

首个独立版本：从 [BruceCheung666/dsh-plugin](https://github.com/BruceCheung666/dsh-plugin)
的 `plugins/approval-notify` 提取并更名为 `dsh-notify`。

- 九类系统通知：授权审批、计划确认、提问、回合完成、执行出错、回合被停止、输出达到
  上限、需要登录、后台任务。只提醒根会话；用户主动取消的回合不提醒。
- 输入框下方的总开关（`conversation.composer.dock`）+ 设置 → 通知 的按事件开关页
  （`settings.section`）；权限未授予 / 被拒 / 环境不支持时给出状态，开关相应禁用。
- Host 通过 owner 认证的 SSE 路由推送事件种类、事件 id 与会话 id；Client 用
  Web Notifications 显示系统通知，多标签页只弹一次，点击通知回到对应会话。
- 更名（原 `approval-notify`）：包名 `@brucecheung666/dsh-notify`、bundle 行 id
  `dsh-notify`、Client module id、locale 命名空间与 SSE 路由同步改；localStorage
  偏好键改为 `dsh:notify:*`，首次读取从旧 `dsh:approval-notify:*` 迁移一次。
- MIT 许可；`engines.dsh: ">=0.2.0-0 <0.3.0-0"`（接受整个 0.2.x 系列，含 RC 预发布；
  拒绝 0.3.0 及其预发布）。
