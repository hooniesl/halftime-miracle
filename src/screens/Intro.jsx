import React, { useEffect, useState } from 'react'
import { FIRST_HALF, ENEMY_TEAM, US_TEAM } from '../data.js'

export default function Intro({ onNext }) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (shown >= FIRST_HALF.length) return
    const t = setTimeout(() => setShown(s => s + 1), 900)
    return () => clearTimeout(t)
  }, [shown])

  return (
    <div className="screen intro">
      <div className="scoreboard big">
        <span className="team us">{US_TEAM.name}</span>
        <span className="score">0 : 2</span>
        <span className="team them">{ENEMY_TEAM.name}</span>
      </div>
      <div className="badge">월드컵 16강 · 전반 종료</div>

      <div className="timeline">
        {FIRST_HALF.slice(0, shown).map(e => (
          <div key={e.minute} className="timeline-item fade-in">
            <span className="minute">{e.minute}'</span> {e.text}
          </div>
        ))}
      </div>

      {shown < FIRST_HALF.length && (
        <button className="btn ghost intro-skip" onClick={onNext}>바로 시작하기 ≫</button>
      )}
      {shown >= FIRST_HALF.length && (
        <div className="fade-in intro-cta">
          <p className="enemy-note">📋 스카우팅 노트: {ENEMY_TEAM.note}</p>
          <p className="dramatic">라커룸. 선수들이 당신을 보고 있다.<br />당신에게 <b>3분</b>이 주어진다.</p>
          <button className="btn primary" onClick={onNext}>라커룸 문을 연다 →</button>
        </div>
      )}
    </div>
  )
}
