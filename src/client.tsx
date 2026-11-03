import { useEffect, useRef, useState } from 'react'
import { HydraulicPress } from './press'

type Pressure = { projectedTokens?: number; pressureTokens?: number }
type Command = { kind: string; text?: string; sourceEventSeq?: number }
type Reply = { ok: true; value?: { result: Command } } | { ok: false; error: { message: string } }
type Props = {
  sessionId: string
  useProjection: (key: 'contextPressure') => Pressure | undefined
  requestCompact: () => Promise<Reply>
}
type Outcome = { before?: number; after?: number; waiting?: boolean; status: string }

function SessionPress({ useProjection, requestCompact }: Props) {
  const pressure = useProjection('contextPressure')
  const usage = pressure?.projectedTokens ?? pressure?.pressureTokens
  const latest = useRef(usage)
  latest.current = usage
  const running = useRef(false)
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<Outcome>({ status: '压缩当前会话' })

  useEffect(() => {
    if (!outcome.waiting) return
    if (usage !== undefined && outcome.before !== undefined && usage < outcome.before) {
      setOutcome({ before: outcome.before, after: usage, status: '已压缩 · 上下文用量为估算' })
      return
    }
    const timer = setTimeout(() => {
      setOutcome({ status: '已压缩 · 暂无可比较的用量读数' })
    }, 3500)
    return () => clearTimeout(timer)
  }, [outcome, usage])

  async function compact() {
    if (running.current || outcome.waiting) return
    running.current = true
    const before = latest.current
    setBusy(true)
    setOutcome({ status: '正在压缩当前会话…' })
    try {
      const reply = await requestCompact()
      if (!reply.ok) throw new Error(reply.error.message)
      const result = reply.value?.result
      if (!result) throw new Error('当前会话没有启用 /compact。')
      if (result.kind !== 'success') throw new Error(result.text || '压缩未完成。')
      if (result.sourceEventSeq === undefined) {
        setOutcome({ status: '当前没有可压缩的历史' })
      } else if (before === undefined) {
        setOutcome({ status: '已压缩 · 暂无压缩前用量' })
      } else {
        setOutcome({ before, waiting: true, status: '已压缩 · 正在刷新用量…' })
      }
    } catch (error) {
      setOutcome({ status: error instanceof Error ? error.message : '压缩失败' })
    } finally {
      running.current = false
      setBusy(false)
    }
  }

  return <HydraulicPress busy={busy} disabled={outcome.waiting} usage={usage}
    before={outcome.before} after={outcome.after} status={outcome.status} onCompact={compact} />
}

function PressSlot(props: Props) {
  return <SessionPress key={props.sessionId} {...props} />
}

// Harness supplies the slot and command services at runtime.
export const inject = ['slots', 'remote', 'remote.commands']
export function apply(ctx: any) {
  const slot = 'conversation.input.right'
  ctx.slots.inject(slot, () => ctx.slots.register({
    name: slot,
    id: 'context-press',
    order: 20,
    inject: (sessionId: string) => ({
      requestCompact: () => ctx.remote.commands.execute(sessionId, '/compact', []),
    }),
  }, PressSlot))
}
