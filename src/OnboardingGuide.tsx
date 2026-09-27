import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type GuideStep = 'equipment' | 'voice' | 'tasks' | 'mine' | 'admin'

const steps: Record<GuideStep, { title: string; description: string; target: string }> = {
  equipment: { title: '先看看器材', description: '在“器材”里查看可借物品和 Kit，点开卡片即可借用或归还。', target: 'nav-equipment' },
  voice: { title: '也可以用语音借用', description: '点右侧的语音球，说出需要的器材，再点一次即可生成可修改的清单。', target: 'voice' },
  tasks: { title: '参与团队任务', description: '“任务”里可以查看和参与任务；页面上的加号用于发布新任务。', target: 'nav-tasks' },
  mine: { title: '在“我的”查看进度', description: '这里能看到你正在借用的器材、参与的任务和以往记录。', target: 'nav-mine' },
  admin: { title: '管理员可以管理账户', description: '进入“我的”，点“账户管理”即可录入或删除成员姓名。', target: 'account-management' },
}

type Props = { step: GuideStep; index: number; total: number; busy: boolean; error: string; onNext: () => void; onSkip: () => void }

export default function OnboardingGuide({ step, index, total, busy, error, onNext, onSkip }: Props) {
  const [target, setTarget] = useState<DOMRect | null>(null)
  useLayoutEffect(() => {
    const measure = () => setTarget(document.querySelector<HTMLElement>(`[data-guide-target="${steps[step].target}"]`)?.getBoundingClientRect() ?? null)
    measure()
    const frame = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [step])

  return createPortal(<div className="guide-layer">
    <div className={`guide-blocker${target ? '' : ' no-target'}`} aria-hidden="true" />
    {target && <div className="guide-focus" aria-hidden="true" style={{ top: target.top - 6, left: target.left - 6, width: target.width + 12, height: target.height + 12 }} />}
    <section className={`guide-card${step === 'voice' ? ' guide-card-top' : ''}`} role="dialog" aria-modal="true" aria-labelledby="guide-title" aria-describedby="guide-description">
      <span className="guide-progress">新手引导 · {index + 1}/{total}</span>
      <h2 id="guide-title">{steps[step].title}</h2>
      <p id="guide-description">{steps[step].description}</p>
      {error && <p className="guide-error" role="alert">{error}</p>}
      <div className="guide-actions"><button type="button" onClick={onSkip} disabled={busy}>跳过引导</button><button type="button" className="guide-next" onClick={onNext} disabled={busy}>{busy ? '正在保存…' : index + 1 === total ? '完成' : '下一步'}</button></div>
    </section>
  </div>, document.body)
}
