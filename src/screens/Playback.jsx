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
  }, { ...(result.start || { us: 0, them: 2 }) })
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

// ─── 양 팀 22명 진형 연출 ───
// 개별 AI가 아니라 "포지션 기반 밀물썰물": 각자 기본 위치를 지키고 장면에 따라 라인 전체가 이동.
// 롤별 가중치(FW가 크게, DF는 작게 이동) + 선수·분(minute) 시드 지터로 로봇 티 제거. 전부 결정론.
const US_BASE = [
  { id: 'gk', x: 6, y: 50, role: 'gk' },
  { id: 'd1', x: 22, y: 15, role: 'df' }, { id: 'd2', x: 20, y: 38, role: 'df' },
  { id: 'd3', x: 20, y: 62, role: 'df' }, { id: 'd4', x: 22, y: 85, role: 'df' },
  { id: 'm1', x: 45, y: 28, role: 'mf' }, { id: 'm2', x: 42, y: 50, role: 'mf' }, { id: 'm3', x: 45, y: 72, role: 'mf' },
  { id: 'f1', x: 68, y: 22, role: 'fw' }, { id: 'f2', x: 72, y: 50, role: 'fw' }, { id: 'f3', x: 68, y: 78, role: 'fw' },
]
const THEM_BASE = US_BASE.map(p => ({ ...p, id: 't' + p.id, x: 100 - p.x }))
const ROLE_F = { gk: 0.12, df: 0.7, mf: 1.0, fw: 1.3 }
// 장면별 라인 이동량 (+ = 상대 골문 쪽). [우리팀, 상대팀] — 상대는 공격 방향이 반대라 부호 해석도 반대
const SCENE_SHIFT = {
  goal_us:   { us: 16,  them: 6 },   // 우리 총공세로 밀어넣음 → 상대는 자기 골문 쪽으로 밀림
  goal_them: { us: -14, them: -16 }, // 상대 역습 성공 → 상대가 우리 진영 깊숙이
  chance:    { us: 10,  them: 2 },
  coach:     { us: -2,  them: -2 },  // 잠시 숨 고르기 — 양 팀 진형 정리
  flow:      { us: 3,   them: -3 },
}
function jitter(id, minute, axis) {
  let h = 0
  const s = `${id}|${minute}|${axis}`
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return ((h >>> 0) % 700) / 100 - 3.5 // ±3.5
}
function teamPositions(base, shift, minute, mirror) {
  return base.map(p => {
    const dir = mirror ? -1 : 1 // 상대팀은 왼쪽으로 전진
    const dx = shift * ROLE_F[p.role] * dir
    const x = Math.max(3, Math.min(97, p.x + dx + (p.role === 'gk' ? 0 : jitter(p.id, minute, 'x'))))
    const y = Math.max(8, Math.min(92, p.y + (p.role === 'gk' ? 0 : jitter(p.id, minute, 'y'))))
    return { id: p.id, x, y, role: p.role }
  })
}

// 미니 피치: 장면에 따라 공 + 양 팀 22명이 움직인다
function Pitch({ scene }) {
  const type = scene?.type || 'flow'
  const minute = scene?.minute ?? 45
  const pos = {
    goal_us:   { x: 88, y: 50 },
    goal_them: { x: 12, y: 50 },
    chance:    { x: 78, y: 30 },
    coach:     { x: 50, y: 88 },
    flow:      { x: 55, y: 60 },
  }[type]
  const shift = SCENE_SHIFT[type] || SCENE_SHIFT.flow
  const us = teamPositions(US_BASE, shift.us, minute, false)
  const them = teamPositions(THEM_BASE, shift.them, minute, true)
  return (
    <div className="pitch">
      <div className="pitch-line center" />
      <div className="pitch-circle" />
      <div className="pitch-box left" /><div className="pitch-box right" />
      {us.map(p => <div key={p.id} className={`pdot us ${p.role}`} style={{ left: `${p.x}%`, top: `${p.y}%` }} />)}
      {them.map(p => <div key={p.id} className={`pdot them ${p.role}`} style={{ left: `${p.x}%`, top: `${p.y}%` }} />)}
      <div className={`ball ${type}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }} />
      {type === 'goal_us' && <div className="goal-flash us">GOAL!</div>}
      {type === 'goal_them' && <div className="goal-flash them">실점</div>}
    </div>
  )
}
