# dsh-notify

DeepSeek Harness（DSH）插件：把**审批、计划确认、提问、回合结果、登录问题与后台任务**
变成系统通知（OS 通知中心），并在设置 → 通知里按事件逐项开关。浏览器与 DSH Desktop
共用同一套 Web Notifications API。

本仓库就是一个可安装的 DSH bundle（`package.json` 的 `dsh.bundle.patch` +
`dsh.client` 双端声明），没有构建步骤，零运行时依赖。

## 兼容性

- 在 **DeepSeek Harness 0.2.1-rc.3**（Web / Desktop）上开发与验证。
- `engines.dsh: ">=0.2.0-0 <0.3.0-0"`：DSH 安装器在启用前检查这个范围，运行时版本
  不满足会拒绝安装/启用。这表示**接受整个 0.2.x 系列**（含 RC 预发布），但拒绝
  0.3.0 及其预发布。两端带 `-0` 是 semver 写法：不带时 `>=0.2.0` 会排除 0.2.0 的 RC，
  `<0.3.0` 又会把 `0.3.0-rc.*` 算进来。
- 纯 ESM JavaScript，无构建、无运行时依赖；React 由 DSH 客户端在运行时提供。
- 依赖的 Host 事件、Client 服务与宿主样式见 [工作原理与数据契约](#工作原理与数据契约)，
  上游改版时需要复核。

## 功能

| 分类 | 什么时候提醒 | 设置页行 |
|---|---|---|
| 授权审批 `approval` | 工具调用等待你批准 | 授权审批 |
| 计划确认 `plan` | 计划等待你确认（`user-questions` 里 `intent.kind === 'plan-review'`） | 计划确认 |
| 提问 `question` | 助手向你提结构化问题 | 提问 |
| 回合完成 `done` | `turn/end` 的 `reason.kind === 'completed'` | 回合完成 |
| 执行出错 `error` | `turn/end` 因 `error` 结束（`ACCOUNT_SIGN_IN_REQUIRED` 归到「需要登录」） | 执行出错 |
| 回合被停止 `stopped` | `blocked`，或非用户原因造成的 `aborted` | 回合被停止 |
| 输出达到上限 `limit` | `turn/end` 因 `max-tokens` 结束 | 输出达到上限 |
| 需要登录 `signin` | 回合因凭据问题结束（错误码或 `deepseek-account/signed-out` 原因） | 需要登录 |
| 后台任务 `job` | 根 Agent 已空闲时 `job/settled`（前台工具任务不重复提醒） | 后台任务 |

其余行为：

- **只提醒根会话**：用 `ctx.agents.roots()` 过滤，子代理与团队成员不打扰。
- **用户主动取消的回合保持安静**：`aborted` + `reason.kind === 'user'` 不发通知。
- **点击通知回到会话**：调用 `ctx.uiWorkspace.openSession(sessionId)`；绝不代替你确认
  审批或回答问题。
- **多标签页去重**：同一条事件只由一个标签页弹系统通知（localStorage 声明 + 过期清理）。
- **默认全开**：总开关在输入框下方（`conversation.composer.dock`）；设置 → 通知里有
  按分类的开关与通知权限状态。总开关关闭时分类行折叠成一行，展开仍能看到已保存的选择，
  重新打开后自动恢复可编辑。
- **权限**：通知权限未授予时提示允许；被拒绝或环境不支持 Notification API 时开关禁用，
  审批、提问与回复流程本身不受影响。
- **离线不重放**：页面关闭期间的旧事件不会补发通知。

## 安装

前置：已有一个运行中的 DSH profile（Desktop 或 `dsh` CLI）。

从 npm 安装（推荐）：

```js
// 在带 plugin_manager 的 DSH 会话里
plugin_manager({ action: 'install_bundle', target: '@brucecheung666/dsh-notify' })
```

```sh
# 或用 CLI
dsh plugin --profile <profile> install @brucecheung666/dsh-notify
```

也可以从 GitHub 或本地路径安装：

```js
plugin_manager({ action: 'install_bundle', target: '/path/to/dsh-notify' })
```

```sh
dsh plugin --profile <profile> install /path/to/dsh-notify
dsh plugin --profile <profile> install github:BruceCheung666/dsh-notify
```

更新已安装插件：先 `remove_bundle`（包名 `@brucecheung666/dsh-notify`），再
`install_bundle`。HMR 下同名重装会被拒绝；已加载的 Client 模块不会热替换，通常需要
刷新页面（或重启 DSH）才加载新模块代际。

## 设置与偏好

- 总开关：输入框下方的铃铛按钮（`conversation.composer.dock`）。
- 分类开关：设置 → 通知（`settings.section`），行外观复制 General 的设置行。
- 偏好按 origin 存 localStorage：
  - `dsh:notify:enabled:v1`：总开关；
  - `dsh:notify:categories:v1`：九个分类的开关；
  - `dsh:notify:seen:<event-id>`：多标签页去重声明，1 小时后由下次读取清扫。
- 跨标签页用 `storage` 事件同步。
- **迁移**：0.1.0 之前插件叫 `approval-notify`。首次读取偏好时会从旧的
  `dsh:approval-notify:enabled:v1` / `dsh:approval-notify:categories:v1` 搬一次并删除
  旧键；之后只认 `dsh:notify:*`。

## 工作原理与数据契约

### Host（`index.js`）

`apply(ctx)` 以 `inject: ['connection']` 挂载：

- `approval/request`、`user-questions/request`：用 `{ prepend: true }` 监听，先发布
  通知事件，再立即 `next()`，不改变原有回答流程；`plan-review` 提问归为计划确认。
- `session/event`：`turn/end` 按 `reason` 分类（见上表）；`job/settled` 只在根 Agent
  已空闲时发布，代表后台任务结束。
- 用 `ctx.connection.fetch.register` 注册 owner 认证的 SSE 路由
  `GET /api/dsh-notify/events`：只推送 `{ kind, id, sessionId }` 三字段，不带审批内容、
  提问内容、错误详情或回复内容；20 秒心跳；订阅取消/插件卸载时清理。
- `ctx.agents.roots()` 是根会话判定的来源（`ctx.get('agents')` 不可用时不做过滤）。

### Client（`client.js`）

- `window.__ModuleLoader__.load({ id: '@brucecheung666/dsh-notify' })` 注册，React 从
  浏览器模块表 `require('react')` 取；`inject: ['slots', 'locale']`。
- 用 `EventSource` 连接上面的 SSE 路由，按分类与总开关决定是否
  `new window.Notification(...)`；`ctx.locale.register('dsh-notify', 'en'|'zh', ...)`。
- 两个 slot：`conversation.composer.dock`（总开关，order 20）与 `settings.section`
  （通知设置页，order 25）。
- **复制的宿主样式**：Switch 几何/token 来自 `ui-primitives`，设置行留白/字号/分隔线
  来自 General 的 `DeveloperToolsRow`。插件不能 require 宿主 client 包，因此这些字面值
  是内联复制，并由 `host-style.json` + `scripts/check-host-style.mjs` 固定：DSH 升级
  改动尺寸、字号、分隔线或 token 时 `npm run check` 失败并指出缺项。
- 主题的 `corner-shape.css` 把圆角压成 `superellipse(1.5)`；胶囊/圆形控件显式写
  `corner-shape: round`（通过 `<style data-plugin>` 注入，随 effect 清理）。

### 半公开契约与风险

以下不是文档化的稳定 API，上游改版时需要复核：

- `turn/end` 的 `reason.kind` 与错误码 `ACCOUNT_SIGN_IN_REQUIRED`；`aborted` 的
  `reason.kind` / `reason.reason`（`deepseek-account/signed-out`）。
- `approval/request`、`user-questions/request` 的 `agent.id`；`job/settled` 事件与
  `agent.status === 'idle'`。
- `ctx.agents.roots()`、`ctx.uiWorkspace.openSession()`。
- 宿主样式字面值（由 `host-style.json` 校验兜底）。

## 隐私

- SSE 只带事件种类、事件 id 与会话 id，不读取也不转发请求/回复内容。
- 通知只在本机浏览器/Desktop 内显示，不上传任何数据。
- 偏好只存本机 localStorage。

## 目录结构

```
index.js              Host 入口（apply(ctx)：事件分类 + SSE 路由）
client.js             Client 入口（系统通知、总开关、设置页）
cordis.patch.yml      bundle 配置层：向 profile 插入 dsh-notify 插件行
host-style.json       复制的宿主样式契约（供 scripts/check-host-style.mjs 校验）
locale/en.json, zh.json  插件管理页显示的标题与描述
icon.svg              插件列表图标
scripts/check-host-style.mjs  宿主样式契约校验（零依赖）
.github/workflows/check.yml   CI：npm run check
```

## 校验

```sh
npm run check
```

语法检查 + 宿主样式契约。`scope=host` 的条目需要 DSH 源码 checkout：

```sh
DSH_HOST_ROOT=/path/to/deepseek-harness npm run check
```

默认查找本仓库下的 `./deepseek-harness`；找不到时只跳过 `scope=host` 条目并提示，
`scope=repo`（插件侧镜像常量）仍会校验。CI 不检出 DSH 源码，因此只保证后者。

## 更名与来源

本插件最初是
[BruceCheung666/dsh-plugin](https://github.com/BruceCheung666/dsh-plugin) 里的
`plugins/approval-notify`。因为实际覆盖九类事件（不再只是审批），0.1.0 提取为独立仓库
时更名为 `dsh-notify`：

| 项目 | 旧（approval-notify） | 新（dsh-notify） |
|---|---|---|
| npm 包 | `@local/approval-notify`（private） | `@brucecheung666/dsh-notify` |
| bundle 行 id / name | `approval-notify` / `@local/approval-notify` | `dsh-notify` / `@brucecheung666/dsh-notify` |
| Client module id | `@local/approval-notify` | `@brucecheung666/dsh-notify` |
| locale 命名空间 / slot id | `approval-notify` | `dsh-notify` |
| SSE 路由 | `/api/approval-notify/events` | `/api/dsh-notify/events` |
| localStorage 偏好键 | `dsh:approval-notify:*` | `dsh:notify:*`（首次读取自动迁移） |

`dsh-plugin` 仓库以 submodule 挂载本仓库：插件代码与文档在这里，聚合仓库只保留
目录入口、插件表与决策记录。

## License

[MIT](LICENSE) © 2026 BruceCheung666
