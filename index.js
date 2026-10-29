import { randomUUID } from 'node:crypto'

const EVENTS_PATH = '/api/dsh-notify/events'
const encoder = new TextEncoder()
const SIGN_IN_CODE = 'ACCOUNT_SIGN_IN_REQUIRED'
const SIGNED_OUT_REASON = 'deepseek-account/signed-out'

export const inject = ['connection']

/** Map one turn ending to a notification category, or undefined when it stays quiet. */
function categoryOfTurnEnd(reason) {
  switch (reason?.kind) {
    case 'completed':
      return 'done'
    case 'max-tokens':
      return 'limit'
    case 'blocked':
      return 'stopped'
    case 'error':
      return reason.error?.code === SIGN_IN_CODE ? 'signin' : 'error'
    case 'aborted': {
      const cause = reason.reason
      if (cause?.kind === 'user') return undefined
      if (cause?.kind === 'hook' && cause.reason === SIGNED_OUT_REASON) return 'signin'
      return 'stopped'
    }
    default:
      return undefined
  }
}

/** Forward pending interactions, turn outcomes, and background job settlements to clients. */
export function apply(ctx) {
  const subscribers = new Set()
  const agents = typeof ctx.get === 'function' ? ctx.get('agents') : undefined

  function publish(kind, sessionId) {
    const payload = { kind, id: randomUUID(), sessionId: typeof sessionId === 'string' ? sessionId : null }
    const frame = encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
    for (const subscriber of [...subscribers]) subscriber.send(frame)
  }

  function isRootSession(session) {
    if (agents === undefined || typeof agents.get !== 'function' || typeof agents.roots !== 'function') return false
    const agent = agents.get(session.id)
    return agent !== undefined && agents.roots().includes(agent)
  }

  ctx.on('approval/request', (request, next) => {
    publish('approval', request?.agent?.id)
    return next()
  }, { prepend: true })

  ctx.on('user-questions/request', (request, next) => {
    const plan = Array.isArray(request?.questions)
      && request.questions.some((question) => question?.intent?.kind === 'plan-review')
    publish(plan ? 'plan' : 'question', request?.agent?.id)
    return next()
  }, { prepend: true })

  ctx.on('session/event', (session, event) => {
    if (event?.type === 'turn/end') {
      const category = categoryOfTurnEnd(event.data?.reason)
      if (category !== undefined && isRootSession(session)) publish(category, session.id)
      return
    }
    if (event?.type !== 'job/settled' || !isRootSession(session)) return
    // A foreground job settles inside its own turn; only an idle root reports background work.
    const agent = typeof agents?.get === 'function' ? agents.get(session.id) : undefined
    if (agent === undefined || agent.status === 'idle') publish('job', session.id)
  })

  ctx.effect(() => {
    const disposeRoute = ctx.connection.fetch.register({
      path: EVENTS_PATH,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: async (request) => {
        let cancel = () => {}
        const body = new ReadableStream({
          start(controller) {
            let closed = false
            let heartbeat
            const subscriber = {
              send(frame) {
                if (closed) return
                try {
                  controller.enqueue(frame)
                } catch {
                  close()
                }
              },
              close,
            }
            function close() {
              if (closed) return
              closed = true
              subscribers.delete(subscriber)
              clearInterval(heartbeat)
              request.signal.removeEventListener('abort', close)
              try {
                controller.close()
              } catch {
                // The browser may already have cancelled the stream.
              }
            }

            subscribers.add(subscriber)
            controller.enqueue(encoder.encode(': connected\n\n'))
            heartbeat = setInterval(() => subscriber.send(encoder.encode(': keep-alive\n\n')), 20_000)
            heartbeat.unref?.()
            request.signal.addEventListener('abort', close, { once: true })
            if (request.signal.aborted) close()
            cancel = close
          },
          cancel() {
            cancel()
          },
        })
        return new Response(body, {
          headers: {
            'content-type': 'text/event-stream; charset=utf-8',
            'cache-control': 'no-cache, no-transform',
            'x-accel-buffering': 'no',
          },
        })
      },
    })

    return async () => {
      for (const subscriber of [...subscribers]) subscriber.close()
      await disposeRoute()
    }
  }, 'dsh-notify: authenticated event stream')
}
