window.__ModuleLoader__.load({
  id: '@brucecheung666/dsh-notify',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'dsh-notify'
    const EVENTS_PATH = '/api/dsh-notify/events'
    const STORAGE_KEY = 'dsh:notify:enabled:v1'
    const CATEGORY_KEY = 'dsh:notify:categories:v1'
    const SEEN_PREFIX = 'dsh:notify:seen:'
    const SEEN_TTL_MS = 60 * 60 * 1000
    // 0.1.0 之前插件叫 approval-notify：旧偏好键只读取一次并搬到新键，
    // 之后只认 dsh:notify:*，不长期保留两套键。
    const LEGACY_ENABLED_KEY = 'dsh:approval-notify:enabled:v1'
    const LEGACY_CATEGORY_KEY = 'dsh:approval-notify:categories:v1'
    const CATEGORY_DEFAULT = {
      approval: true,
      plan: true,
      question: true,
      done: true,
      error: true,
      stopped: true,
      limit: true,
      signin: true,
      job: true,
    }
    const KINDS = ['approval', 'plan', 'question', 'done', 'error', 'stopped', 'limit', 'signin', 'job']
    // Locale keys each notification kind renders.
    const KIND_COPY = {
      approval: { title: 'approvalTitle', body: 'approvalBody' },
      plan: { title: 'planTitle', body: 'planBody' },
      question: { title: 'questionTitle', body: 'questionBody' },
      done: { title: 'doneTitle', body: 'doneBody' },
      error: { title: 'errorTitle', body: 'errorBody' },
      stopped: { title: 'stoppedTitle', body: 'stoppedBody' },
      limit: { title: 'limitTitle', body: 'limitBody' },
      signin: { title: 'signinTitle', body: 'signinBody' },
      job: { title: 'jobTitle', body: 'jobBody' },
    }
    // Settings rows use their own labels instead of notification copy.
    const ROW_COPY = {
      approval: { title: 'rowApproval', hint: 'rowApprovalHint' },
      plan: { title: 'rowPlan', hint: 'rowPlanHint' },
      question: { title: 'rowQuestion', hint: 'rowQuestionHint' },
      done: { title: 'rowDone', hint: 'rowDoneHint' },
      error: { title: 'rowError', hint: 'rowErrorHint' },
      stopped: { title: 'rowStopped', hint: 'rowStoppedHint' },
      limit: { title: 'rowLimit', hint: 'rowLimitHint' },
      signin: { title: 'rowSignin', hint: 'rowSigninHint' },
      job: { title: 'rowJob', hint: 'rowJobHint' },
    }
    const EN = {
      enable: 'Enable completion and prompt notifications',
      disable: 'Disable completion and prompt notifications',
      request: 'Allow notifications',
      blocked: 'Notifications are blocked for this site',
      unsupported: 'This environment does not support system notifications',
      settingsTitle: 'Notifications',
      masterLabel: 'All notifications',
      masterHint: 'Turn everything off without losing the per-event choices below.',
      foldedTitle: 'Per-event notifications',
      foldedHint: 'All notifications are off. Expand to review the saved per-event choices.',
      foldedExpand: 'Show per-event notifications',
      foldedCollapse: 'Hide per-event notifications',
      permissionAskTitle: 'Notifications are not allowed yet',
      permissionAskHint: 'Allow this site to show notifications to receive alerts.',
      permissionBlockedTitle: 'Notifications are blocked',
      permissionBlockedHint: 'Allow this site in your browser or system settings, then reopen Settings.',
      permissionUnsupportedTitle: 'System notifications unavailable',
      permissionUnsupportedHint: 'This environment does not provide the Notification API.',
      rowApproval: 'Approvals',
      rowApprovalHint: 'Warn when a tool call needs your decision.',
      rowPlan: 'Plan review',
      rowPlanHint: 'Warn when a plan is waiting for your approval.',
      rowQuestion: 'Questions',
      rowQuestionHint: 'Warn when the agent asks you something.',
      rowDone: 'Turn finished',
      rowDoneHint: 'Warn when a turn completes normally.',
      rowError: 'Turn failed',
      rowErrorHint: 'Warn when a step fails and the turn ends with an error.',
      rowStopped: 'Turn stopped',
      rowStoppedHint: 'Warn when a turn is stopped by something other than you.',
      rowLimit: 'Output limit',
      rowLimitHint: 'Warn when a turn ends at the token ceiling.',
      rowSignin: 'Sign-in needed',
      rowSigninHint: 'Warn when credentials expire or sign-in is required.',
      rowJob: 'Background jobs',
      rowJobHint: 'Warn when a background job settles.',
      approvalTitle: 'DSH needs your approval',
      approvalBody: 'A tool call is waiting for your decision.',
      planTitle: 'DSH is waiting for plan approval',
      planBody: 'A plan is ready for your review.',
      questionTitle: 'DSH has a question',
      questionBody: 'The agent is waiting for your answer.',
      doneTitle: 'DSH finished',
      doneBody: 'This turn has ended. Open the session to continue.',
      errorTitle: 'DSH stopped with an error',
      errorBody: 'A step failed. Open the session to see the error.',
      stoppedTitle: 'DSH stopped',
      stoppedBody: 'This turn was stopped before it finished.',
      limitTitle: 'DSH hit the output limit',
      limitBody: 'The turn ended at the token ceiling.',
      signinTitle: 'Sign in to DeepSeek again',
      signinBody: 'A model request requires sign-in before it can continue.',
      jobTitle: 'Background task finished',
      jobBody: 'A background job in this session settled.',
    }
    const ZH = {
      enable: '开启完成与审批通知',
      disable: '关闭完成与审批通知',
      request: '允许通知',
      blocked: '此站点已被禁止显示通知',
      unsupported: '当前环境不支持系统通知',
      settingsTitle: '通知',
      masterLabel: '全部通知',
      masterHint: '一键关闭所有通知，下方每一项的选择会保留。',
      foldedTitle: '分类通知',
      foldedHint: '全部通知已关闭；展开可查看各分类已保存的选择。',
      foldedExpand: '展开分类通知',
      foldedCollapse: '收起分类通知',
      permissionAskTitle: '尚未允许通知',
      permissionAskHint: '允许此站点显示通知后才能收到提醒。',
      permissionBlockedTitle: '通知已被禁止',
      permissionBlockedHint: '在浏览器或系统设置里允许此站点通知，然后重新打开设置。',
      permissionUnsupportedTitle: '当前环境不支持系统通知',
      permissionUnsupportedHint: '这个环境没有提供 Notification API。',
      rowApproval: '授权审批',
      rowApprovalHint: '工具调用需要你决定时提醒。',
      rowPlan: '计划确认',
      rowPlanHint: '计划等待你确认时提醒。',
      rowQuestion: '提问',
      rowQuestionHint: '助手向你提问时提醒。',
      rowDone: '回合完成',
      rowDoneHint: '一轮回复正常完成时提醒。',
      rowError: '执行出错',
      rowErrorHint: '某一步失败并导致回合结束时提醒。',
      rowStopped: '回合被停止',
      rowStoppedHint: '非你主动停止的情况下提醒。',
      rowLimit: '输出达到上限',
      rowLimitHint: '因输出上限结束回合时提醒。',
      rowSignin: '需要登录',
      rowSigninHint: '凭据失效或需要重新登录时提醒。',
      rowJob: '后台任务',
      rowJobHint: '后台任务结束时提醒。',
      approvalTitle: 'DSH 等待你的审批',
      approvalBody: '有一项操作等待你的决定。',
      planTitle: 'DSH 等待计划确认',
      planBody: '有一份计划等待你确认。',
      questionTitle: 'DSH 有一个问题',
      questionBody: '助手正在等待你的回答。',
      doneTitle: 'DSH 已完成',
      doneBody: '本轮已结束，点击回到会话查看结果。',
      errorTitle: 'DSH 本轮出错',
      errorBody: '某一步执行失败，打开会话查看详情。',
      stoppedTitle: 'DSH 已停止',
      stoppedBody: '本轮在执行中被停止。',
      limitTitle: 'DSH 输出达到上限',
      limitBody: '本轮因输出上限结束。',
      signinTitle: '需要重新登录 DeepSeek',
      signinBody: '模型请求需要登录后才能继续。',
      jobTitle: '后台任务已结束',
      jobBody: '该会话的后台任务已结束。',
    }
    const listeners = new Set()
    let enabled = readPreference()
    let categories = readCategories()
    let workspace = null
    let t = (key) => key

    /** Read a preference key, migrating the legacy approval-notify key once. */
    function readMigrated(key, legacyKey) {
      try {
        const existing = window.localStorage.getItem(key)
        if (existing !== null) return existing
        const legacy = window.localStorage.getItem(legacyKey)
        if (legacy === null) return null
        window.localStorage.setItem(key, legacy)
        window.localStorage.removeItem(legacyKey)
        return legacy
      } catch {
        return null
      }
    }

    function readPreference() {
      return readMigrated(STORAGE_KEY, LEGACY_ENABLED_KEY) !== 'false'
    }

    function savePreference() {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(enabled))
      } catch {
        // The page keeps working even when storage is blocked.
      }
    }

    function readCategories() {
      const next = { ...CATEGORY_DEFAULT }
      try {
        const raw = readMigrated(CATEGORY_KEY, LEGACY_CATEGORY_KEY)
        if (raw === null) return next
        const parsed = JSON.parse(raw)
        for (const kind of Object.keys(CATEGORY_DEFAULT)) {
          if (typeof parsed?.[kind] === 'boolean') next[kind] = parsed[kind]
        }
      } catch {
        // Fall back to every category on.
      }
      return next
    }

    function saveCategories() {
      try {
        window.localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories))
      } catch {
        // The in-memory choice still applies for this page.
      }
    }

    function setCategory(kind, value) {
      if (typeof CATEGORY_DEFAULT[kind] !== 'boolean') return
      categories = { ...categories, [kind]: value }
      saveCategories()
      notify()
    }

    function supported() {
      return typeof window.Notification === 'function'
    }

    function permission() {
      try {
        return supported() ? window.Notification.permission : 'unsupported'
      } catch {
        return 'unsupported'
      }
    }

    /** off (disabled), ask (permission pending), on, blocked, or unsupported. */
    function status() {
      if (!supported()) return 'unsupported'
      const current = permission()
      if (current === 'denied') return 'blocked'
      if (!enabled) return 'off'
      return current === 'granted' ? 'on' : 'ask'
    }

    function notify() {
      for (const listener of [...listeners]) listener()
    }

    function syncPreferences(event) {
      if (event.key === STORAGE_KEY || event.key === null) enabled = readPreference()
      if (event.key === CATEGORY_KEY || event.key === null) categories = readCategories()
      notify()
    }

    function sweepSeen() {
      try {
        const storage = window.localStorage
        const now = Date.now()
        const stale = []
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index)
          if (typeof key === 'string' && key.startsWith(SEEN_PREFIX)) stale.push(key)
        }
        for (const key of stale) {
          const stamp = Number(storage.getItem(key))
          if (!Number.isFinite(stamp) || now - stamp > SEEN_TTL_MS) storage.removeItem(key)
        }
      } catch {
        // Without storage every tab shows its own notification.
      }
    }

    /** Claim one event so exactly one tab raises the system notification. */
    function claim(id) {
      if (typeof id !== 'string' || id === '') return true
      const key = SEEN_PREFIX + id
      try {
        if (window.localStorage.getItem(key) !== null) return false
        window.localStorage.setItem(key, String(Date.now()))
        return true
      } catch {
        return true
      }
    }

    function openSession(sessionId) {
      try {
        window.focus()
      } catch {
        // Focus is best effort and may be refused.
      }
      if (typeof sessionId !== 'string' || sessionId === '') return
      try {
        workspace?.openSession(sessionId)
      } catch {
        // A stale session must not break the notification click.
      }
    }

    function showNotification(kind, id, sessionId) {
      if (status() !== 'on') return
      if (categories[kind] !== true) return
      const copy = KIND_COPY[kind]
      if (copy === undefined) return
      if (!claim(id)) return
      try {
        const notification = new window.Notification(
          t(copy.title),
          { body: t(copy.body) },
        )
        notification.onclick = () => {
          notification.close()
          openSession(sessionId)
        }
      } catch {
        // Permission or platform refusal leaves the pending request untouched.
      }
    }

    function requestPermission() {
      let settled = false
      const refresh = () => {
        if (settled) return
        settled = true
        notify()
      }
      try {
        const pending = window.Notification.requestPermission(refresh)
        if (pending !== undefined && typeof pending.then === 'function') {
          void pending.then(refresh, refresh)
        } else if (pending === undefined) {
          setTimeout(refresh, 0)
        }
      } catch {
        refresh()
      }
    }

    function toggle() {
      const current = status()
      if (current === 'unsupported' || current === 'blocked') return
      if (current === 'on') {
        enabled = false
        savePreference()
        notify()
        return
      }
      enabled = true
      savePreference()
      notify()
      if (permission() !== 'granted') requestPermission()
    }

    // The theme applies a global superellipse corner shape; pills and circles
    // opt out in their own stylesheet. Inline styles cannot set corner-shape,
    // so the switch carries this class and its opt-out rule.
    const SWITCH_CLASS = 'dsh-notify-switch'
    const SWITCH_CSS = `.${SWITCH_CLASS}{corner-shape:round}`
      + `.${SWITCH_CLASS}>span{corner-shape:round}`
      + `.${SWITCH_CLASS}:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}`
    // --- settings rows, mirroring the General section's row chrome -----------
    const LIST = { display: 'flex', flexDirection: 'column', width: '100%' }
    const ROW = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
      padding: '16px 0',
      borderBottom: '0.5px solid var(--dsw-alias-border-l2)',
    }
    const ROW_LAST = { ...ROW, borderBottom: 'none' }
    const TEXT = { minWidth: 0 }
    const TITLE = { fontSize: 14, lineHeight: '20px' }
    const HINT = { marginTop: 4, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' }
    // Switch geometry and tokens copied from the ui-primitives Switch.
    const SWITCH = {
      boxSizing: 'border-box',
      position: 'relative',
      flex: '0 0 auto',
      width: 36,
      height: 20,
      padding: 2,
      border: 0,
      borderRadius: 999,
      appearance: 'none',
      WebkitAppearance: 'none',
      background: 'var(--dsw-alias-border-l3)',
      cursor: 'pointer',
    }
    const SWITCH_ON = { ...SWITCH, background: 'var(--dsw-alias-brand-primary)' }
    const SWITCH_OFF_LOCKED = { ...SWITCH, cursor: 'default', opacity: 0.5 }
    const SWITCH_ON_LOCKED = { ...SWITCH_ON, cursor: 'default', opacity: 0.5 }
    const THUMB = {
      display: 'block',
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: 'var(--dsw-alias-switch-thumb)',
      transition: 'transform 120ms ease',
    }
    const THUMB_ON = {
      ...THUMB,
      background: 'var(--dsw-alias-label-primary-foreground)',
      transform: 'translateX(16px)',
    }
    // Outlined small action, matching the settings header's secondary button.
    const ACTION = {
      boxSizing: 'border-box',
      flex: '0 0 auto',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 28,
      padding: '0 10px',
      border: '0.5px solid var(--dsw-alias-border-l3)',
      borderRadius: 'var(--dsw-radius-sm)',
      background: 'transparent',
      color: 'var(--dsw-alias-label-primary)',
      font: 'inherit',
      fontSize: 12,
      lineHeight: '18px',
      cursor: 'pointer',
    }
    // Compact icon action, matching the settings header's close control.
    const ICON_BUTTON = {
      boxSizing: 'border-box',
      flex: '0 0 auto',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      padding: 0,
      border: 'none',
      borderRadius: 'var(--dsw-radius-sm)',
      background: 'transparent',
      color: 'var(--dsw-alias-label-secondary)',
      cursor: 'pointer',
    }

    function Switch({ checked, label, onChange, disabled = false }) {
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': checked,
        'aria-label': label,
        title: label,
        disabled,
        className: SWITCH_CLASS,
        onClick: () => onChange(!checked),
        style: checked
          ? (disabled ? SWITCH_ON_LOCKED : SWITCH_ON)
          : (disabled ? SWITCH_OFF_LOCKED : SWITCH),
      }, h('span', { style: checked ? THUMB_ON : THUMB }))
    }

    function SettingRow({ title, hint, last = false, children }) {
      return h('div', { style: last ? ROW_LAST : ROW },
        h('div', { style: TEXT },
          h('div', { style: TITLE }, title),
          hint === undefined ? null : h('div', { style: HINT }, hint),
        ),
        children ?? null,
      )
    }

    function useLiveState() {
      const [, forceRender] = React.useState(0)
      React.useEffect(() => {
        const update = () => forceRender((value) => value + 1)
        listeners.add(update)
        return () => { listeners.delete(update) }
      }, [])
    }

    function NotifyToggle() {
      useLiveState()
      const state = status()
      const label = t(state === 'on' ? 'disable'
        : state === 'ask' ? 'request'
          : state === 'blocked' ? 'blocked'
            : state === 'unsupported' ? 'unsupported'
              : 'enable')
      const active = state === 'on' || state === 'ask'
      const disabled = state === 'unsupported' || state === 'blocked'
      return h('button', {
        type: 'button',
        title: label,
        'aria-label': label,
        'aria-pressed': active,
        disabled,
        onClick: toggle,
        style: {
          boxSizing: 'border-box',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          minWidth: 28,
          height: 28,
          padding: 0,
          border: '1px solid var(--dsw-alias-border-l1)',
          borderRadius: 'var(--dsw-radius-sm)',
          background: active ? 'var(--dsw-alias-bg-layer-2)' : 'transparent',
          color: active ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-secondary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
        },
      }, h('svg', {
        viewBox: '0 0 24 24',
        width: 16,
        height: 16,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      },
      h('path', { d: 'M12 4a6 6 0 0 1 6 6v4l2 3H4l2-3v-4a6 6 0 0 1 6-6Z' }),
      h('path', { d: 'M10 20a2 2 0 0 0 4 0' }),
      disabled ? h('path', { d: 'm4 4 16 16' }) : null,
      ))
    }

    function NotifySettings() {
      useLiveState()
      const state = status()
      // The master switch owns the whole page: while it is off (or the
      // environment cannot notify), the per-event section collapses; its
      // switches stay frozen and keep their saved values.
      const masterOn = enabled && state !== 'blocked' && state !== 'unsupported'
      const [peek, setPeek] = React.useState(false)
      React.useEffect(() => {
        if (masterOn) setPeek(false)
      }, [masterOn])
      const expanded = masterOn || peek
      const entries = []

      // The permission row only appears when a choice is needed or blocked.
      if (state === 'ask') {
        entries.push({
          key: 'permission',
          title: t('permissionAskTitle'),
          hint: t('permissionAskHint'),
          control: h('button', { type: 'button', onClick: requestPermission, style: ACTION }, t('request')),
        })
      } else if (state === 'blocked') {
        entries.push({ key: 'permission', title: t('permissionBlockedTitle'), hint: t('permissionBlockedHint') })
      } else if (state === 'unsupported') {
        entries.push({ key: 'permission', title: t('permissionUnsupportedTitle'), hint: t('permissionUnsupportedHint') })
      }

      entries.push({
        key: 'master',
        title: t('masterLabel'),
        hint: t('masterHint'),
        control: h(Switch, {
          checked: masterOn,
          label: t('masterLabel'),
          disabled: state === 'blocked' || state === 'unsupported',
          onChange: toggle,
        }),
      })

      if (!masterOn) {
        const foldLabel = t(expanded ? 'foldedCollapse' : 'foldedExpand')
        entries.push({
          key: 'folded',
          title: t('foldedTitle'),
          hint: t('foldedHint'),
          control: h('button', {
            type: 'button',
            'aria-expanded': expanded,
            'aria-label': foldLabel,
            title: foldLabel,
            onClick: () => setPeek((value) => !value),
            style: ICON_BUTTON,
          }, h('svg', {
            viewBox: '0 0 24 24',
            width: 16,
            height: 16,
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.8,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            'aria-hidden': true,
            style: { transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 120ms ease' },
          }, h('path', { d: 'm6 9 6 6 6-6' }))),
        })
      }

      if (expanded) {
        for (const kind of KINDS) {
          const copy = ROW_COPY[kind]
          entries.push({
            key: kind,
            title: t(copy.title),
            hint: t(copy.hint),
            control: h(Switch, {
              checked: categories[kind] === true,
              label: t(copy.title),
              disabled: !masterOn,
              onChange: (next) => { if (masterOn) setCategory(kind, next) },
            }),
          })
        }
      }

      return h('div', { style: LIST }, ...entries.map((entry, index) => h(SettingRow, {
        key: entry.key,
        title: entry.title,
        hint: entry.hint,
        last: index === entries.length - 1,
      }, entry.control ?? null)))
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        t = ctx.locale.bind(NS)
        workspace = typeof ctx.get === 'function' ? ctx.get('uiWorkspace') : undefined
        ctx.effect(() => {
          const disposeEn = ctx.locale.register(NS, 'en', EN)
          const disposeZh = ctx.locale.register(NS, 'zh', ZH)
          return () => {
            disposeZh()
            disposeEn()
          }
        }, 'dsh-notify: dictionaries')
        ctx.effect(() => {
          const tag = document.createElement('style')
          tag.dataset.plugin = NS
          tag.textContent = SWITCH_CSS
          document.head.appendChild(tag)
          return () => { tag.remove() }
        }, 'dsh-notify: switch corner opt-out')
        ctx.effect(() => ctx.locale.subscribe(notify), 'dsh-notify: locale updates')
        ctx.effect(() => {
          window.addEventListener('storage', syncPreferences)
          window.addEventListener('focus', notify)
          document.addEventListener('visibilitychange', notify)
          sweepSeen()
          return () => {
            window.removeEventListener('storage', syncPreferences)
            window.removeEventListener('focus', notify)
            document.removeEventListener('visibilitychange', notify)
          }
        }, 'dsh-notify: preference and permission sync')
        ctx.effect(() => {
          let stream
          try {
            const url = new URL(EVENTS_PATH.slice(1), document.baseURI)
            stream = new window.EventSource(url.href)
          } catch {
            return
          }
          stream.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data)
              if (KIND_COPY[message.kind] === undefined) return
              showNotification(message.kind, message.id, message.sessionId)
            } catch {
              // Ignore malformed frames; the Host sends only small JSON events.
            }
          }
          return () => {
            stream.onmessage = null
            stream.close()
          }
        }, 'dsh-notify: host event stream')
        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock',
          id: 'dsh-notify',
          order: 20,
        }, NotifyToggle))
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'dsh-notify',
          order: 25,
          label: () => t('settingsTitle'),
          locale: NS,
        }, NotifySettings))
      },
    }
  },
})
