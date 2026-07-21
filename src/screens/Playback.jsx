import React, { useEffect, useRef, useState } from 'react'
import { INTERVENTIONS } from '../engine.js'
import { play } from '../sound.js'

// 후반전 하이라이트 재생 — 장면별 순차 공개 + 75' 긴급 지시 개입 + 미니 피치 애니메이션
export default function Playback({ result, intervened, onIntervene, onDone }) {
  const [idx, setIdx] = useState(0)
  const [skip, setSkip] = useState(false)
  const scenes = result.scenes
  const coachIdx = scenes.findIndex(s => s.type === 'coach')
  const listRef = useRef(null)

  // 개입 전이면 coach 장면 직전에서 정지 → 팝업. 선택 후 이어서 재생.
  const pausedForChoice = !intervened && coachIdx >= 0 && idx >= coachIdx

  useEffect(() => {
    if (pausedForChoice) return
    if (skip) { setIdx(scenes.length); return }
    if (idx >= scenes.length) return
    const t = setTimeout(() => setIdx(i => i + 1), idx === 0 ? 600 : 1700)
    return () => clearTimeout(t)
  }, [idx, skip, scenes.length, pausedForChoice])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [idx])

  // 사운드 큐: 킥오프 휘슬 / 골 함성 / 75' 정지 휘슬
  useEffect(() => { play('whistle', 0.5) }, [])
  useEffect(() => {
    const s = scenes[idx - 1]
    if (s?.type === 'goal_us') play('crowd', 0.6)
  }, [idx, scenes])
  useEffect(() => { if (pausedForChoice) play('whistle', 0.45) }, [pausedForChoice])

  const visible = scenes.slice(0, Math.min(idx, pausedForChoice ? coachIdx : scenes.length))
  const score = visible.reduce((acc, s) => {
    if (s.type === 'goal_us') acc.us++
    if (s.type === 'goal_them') acc.them++
    return acc
  }, { us: 0, them: 2 })
  const done = !pausedForChoice && idx >= scenes.length
  const last = visible[visible.length - 1]

  // 종료 휘슬 (done 선언 이후 참조 — TDZ 주의)
  useEffect(() => { if (done) play('whistle', 0.5) }, [done])

  return (
    <div className="screen playback">
      <div className="scoreboard big live">
        <span className="score">{score.us} : {score.them}</span>
        <span className="live-dot">● LIVE 후반전</span>
      </div>

      <Pitch scene={last} />

      <div className="commentary" ref={listRef}>
        {visible.map((s, i) => (
          <div key={i} className={`comm-line ${s.type} fade-in`}>{s.text}</div>
        ))}
        {done && <div className="comm-line final fade-in">📢 경기 종료 휘슬!</div>}
      </div>

      {pausedForChoice && (
        <div className="intervene fade-in">
          <div className="intervene-head">📣 75분 — 터치라인, 당신의 마지막 지시는?</div>
          <div className="intervene-row">
            {INTERVENTIONS.map(iv => (
              <button key={iv.id} className="intervene-btn" onClick={() => { play('click', 0.45); onIntervene(iv.id) }}>
                <span className="iv-icon">{iv.icon}</span>
                <b>{iv.name}</b>
                <span className="iv-desc">{iv.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="playback-foot">
        {!done && !pausedForChoice && <button className="btn ghost" onClick={() => setSkip(true)}>결과로 건너뛰기 ≫</button>}
        {done && <button className="btn primary big" onClick={onDone}>감독 리포트 보기 →</button>}
      </div>
    </div>
  )
}

// 미니 피치: 장면 타입에 따라 공(점)과 화살표가 움직인다
function Pitch({ scene }) {
  const type = scene?.type || 'flow'
  const pos = {
    goal_us:   { x: 88, y: 50 },
    goal_them: { x: 12, y: 50 },
    chance:    { x: 78, y: 30 },
    coach:     { x: 50, y: 88 },
    flow:      { x: 55, y: 60 },
  }[type]
  return (
    <div className="pitch">
      <div className="pitch-line center" />
      <div className="pitch-circle" />
      <div className="pitch-box left" /><div className="pitch-box right" />
      <div className={`ball ${type}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }} />
      {type === 'goal_us' && <div className="goal-flash us">GOAL!</div>}
      {type === 'goal_them' && <div className="goal-flash them">실점</div>}
    </div>
  )
}
