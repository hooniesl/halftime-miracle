import React, { useEffect, useState } from 'react'

export default function Intro({ sc, onNext }) {
  const [shown, setShown] = useState(0)
  const half = sc.firstHalf

  useEffect(() => {
    if (shown >= half.length) return
    const t = setTimeout(() => setShown(s => s + 1), 900)
    return () => clearTimeout(t)
  }, [shown, half.length])

  const { us, them } = sc.startScore

  return (
    <div className="screen intro">
      <div className="scoreboard big">
        <span className="team us">{sc.teamName}</span>
        <span className="score">{us} : {them}</span>
        <span className="team them">{sc.enemyName}</span>
      </div>
      <div className="badge">{sc.id === 'korea' ? '2026 월드컵 A조 최종전 · 전반 종료' : '월드컵 16강 · 전반 종료'}</div>
      {sc.stake && <div className="badge stake">⚡ {sc.stake}</div>}

      <div className="timeline">
        {half.slice(0, shown).map(e => (
          <div key={e.minute} className="timeline-item fade-in">
            <span className="minute">{e.minute}'</span> {e.text}
          </div>
        ))}
      </div>

      {shown < half.length && (
        <button className="btn ghost intro-skip" onClick={onNext}>바로 시작하기 ≫</button>
      )}
      {shown >= half.length && (
        <div className="fade-in intro-cta">
          {sc.realityNote && <p className="reality-note">🕰️ {sc.realityNote}</p>}
          <p className="enemy-note">📋 스카우팅 노트: {sc.enemyNote}</p>
          <p className="dramatic">락커룸. 선수들이 당신을 보고 있다.<br />당신에게 <b>3분</b>이 주어진다.</p>
          <button className="btn primary" onClick={onNext}>락커룸 문 열기 →</button>
        </div>
      )}
    </div>
  )
}
