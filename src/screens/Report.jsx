import React, { useState } from 'react'
import { cardsFor } from '../engine.js'

const OUTCOME_META = {
  win:  { emoji: '🏆', klass: 'win' },
  draw: { emoji: '🤝', klass: 'draw' },
  loss: { emoji: '😤', klass: 'loss' },
}

export default function Report({ result, sc, cards, history, onRetry, onSelect }) {
  const [copied, setCopied] = useState(false)
  const meta = OUTCOME_META[result.outcome]
  const CARDS = cardsFor(sc.id)
  const cardObjs = cards.map(id => CARDS.find(c => c.id === id)).filter(Boolean)

  const share = async () => {
    const replayUrl = `${location.origin}${location.pathname}#r=${sc.id}:${cards.join('.')}:${result.intervention || 'hold'}`
    const lines = [
      `⚽ 하프타임의 기적 — ${sc.title}`,
      `최종 스코어 ${result.us}:${result.them} (${result.outcome === 'win' ? '승리!' : result.outcome === 'draw' ? '무승부' : '패배'})`,
      `감독 평점 ★${result.rating}`,
      `지시: ${cardObjs.map(c => c.icon + c.name).join(' · ')}`,
      `내 경기 다시보기: ${replayUrl}`,
      sc.id === 'korea' ? `실제 역사는 0-1 패배였다. 당신이라면 바꿀 수 있습니까?` : `당신이라면 0-2를 뒤집을 수 있습니까?`,
    ].join('\n')
    try { await navigator.clipboard.writeText(lines); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  return (
    <div className={`screen report ${meta.klass}`}>
      <div className="report-head">
        <div className="report-emoji">{meta.emoji}</div>
        <h2>{result.headline}</h2>
        <div className="rating">감독 평점 <b>★ {result.rating}</b></div>
      </div>

      <div className="panel">
        <h3>📋 선택한 지시</h3>
        <div className="picked-cards">
          {cardObjs.map(c => <span key={c.id} className="chip">{c.icon} {c.name}</span>)}
        </div>
        {result.notes.length > 0 && (
          <div className="synergy-notes">
            {result.notes.map(n => <div key={n} className={`note ${n.startsWith('⚡') ? 'good' : 'bad'}`}>{n}</div>)}
          </div>
        )}
        <div className="stat-row">
          <span>공격 {result.stats.atk}</span><span>수비 {result.stats.def}</span><span>체력 {result.stats.sta}</span>
        </div>
      </div>

      {history.length > 1 && (
        <div className="panel">
          <h3>🔁 나의 시도들</h3>
          {history.slice(0, 5).map((h, i) => (
            <div key={i} className="history-row">
              <span className={`h-outcome ${h.outcome}`}>{OUTCOME_META[h.outcome]?.emoji}</span>
              <span>{h.us}:{h.them}</span>
              <span className="h-cards">{(h.scenario === 'korea' ? '🇰🇷' : '🎮')} {h.cards.map(id => CARDS.find(c => c.id === id)?.icon).join('')}</span>
              <span className="h-rating">★{h.rating}</span>
            </div>
          ))}
        </div>
      )}

      <div className="report-foot">
        <button className="btn primary big" onClick={onRetry}>🔄 다른 선택이었다면? (재도전)</button>
        <button className="btn ghost" onClick={share}>{copied ? '✅ 복사됨!' : '📤 감독 성적표 공유'}</button>
        <button className="btn ghost" onClick={onSelect}>🏟️ 다른 경기 고르기</button>
      </div>
    </div>
  )
}
