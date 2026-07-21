import React, { useEffect, useMemo, useRef, useState } from 'react'
import { cardsFor, comboStats } from '../engine.js'
import { play } from '../sound.js'

// 기본 4-3-3 배치 (x: 공격 방향 →, y: 세로). 카드 선택이 배치를 실시간으로 움직인다.
const BASE_POS = {
  gk1: { x: 6,  y: 50 },
  df1: { x: 22, y: 15 }, df2: { x: 20, y: 38 }, df3: { x: 20, y: 62 }, df4: { x: 22, y: 85 },
  mf1: { x: 45, y: 28 }, mf2: { x: 42, y: 50 }, mf3: { x: 45, y: 72 },
  fw1: { x: 68, y: 22 }, fw2: { x: 72, y: 50 }, fw3: { x: 68, y: 78 },
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function formationFromCards(picked, basePos) {
  const pos = Object.fromEntries(Object.entries(basePos || BASE_POS).map(([k, p]) => [k, { ...p, glow: false }]))
  const has = id => picked.includes(id)
  const move = (ids, dx = 0, dy = 0) => ids.forEach(id => { pos[id].x += dx; pos[id].y += dy })
  if (has('press'))    { move(['fw1','fw2','fw3'], 9); move(['mf1','mf2','mf3'], 5) }
  if (has('linedown')) { move(['df1','df2','df3','df4'], -8); move(['mf1','mf2','mf3'], -6); move(['fw1','fw2','fw3'], -4) }
  if (has('threetop')) { move(['fw1','fw2','fw3'], 8); move(['mf2'], 6) }
  if (has('counter'))  { move(['df1','df2','df3','df4','mf1','mf2','mf3'], -6); move(['fw2'], 9) }
  if (has('longball')) { move(['fw1','fw2','fw3'], 6); move(['mf1','mf2','mf3'], -4) }
  if (has('tempo'))    { move(['mf1','mf2','mf3'], -3) }
  if (has('overload')) { ['df1','mf1','fw1'].forEach(id => { pos[id].x += 6; pos[id].y -= 6 }) }
  if (has('wingswap')) { const a = pos.fw1.y; pos.fw1.y = pos.fw3.y; pos.fw3.y = a }
  if (has('gamble'))   { pos.df1.x += 34; pos.df1.glow = true }
  if (has('supersub')) { pos.fw2.glow = true }
  if (has('captain'))  { pos.mf1.glow = true }
  if (has('setpiece')) { pos.df2.glow = true }
  Object.entries(pos).forEach(([id, p]) => {
    p.x = clamp(p.x, id === 'gk1' ? 3 : 13, 93) // GK 자리(x6)와 겹침 방지 — 필드 플레이어는 최소 13
    p.y = clamp(p.y, 6, 94)
  })
  return pos
}

const SLOT_COUNT = 4
const TIME_LIMIT = 180 // 3분

// 카드 선택: 탭/클릭 = 슬롯 토글 (모바일 우선)
export default function LockerRoom({ sc, onKickoff, initial = [] }) {
  const CARDS = useMemo(() => cardsFor(sc.id), [sc.id])
  const [picked, setPicked] = useState(initial)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [showGuide, setShowGuide] = useState(() => !localStorage.getItem('hm_seen_guide'))
  const kickedRef = useRef(false)

  const stats = useMemo(() => comboStats(picked, sc.id), [picked, sc.id])
  const formation = useMemo(() => formationFromCards(picked, sc.basePos), [picked, sc.basePos])

  // 제한시간 타이머 — 온보딩 가이드 닫은 뒤에 시작 (모의심사 지적 반영), 만료 시 자동 킥오프
  useEffect(() => {
    if (showGuide) return
    const iv = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(iv)
  }, [showGuide])
  useEffect(() => {
    if (timeLeft <= 0 && !kickedRef.current) {
      kickedRef.current = true
      onKickoff(picked.length ? picked : ['captain'])
    }
  }, [timeLeft, picked, onKickoff])

  const toggle = (id) => {
    play('click', 0.45)
    setPicked(p => p.includes(id) ? p.filter(x => x !== id) : (p.length >= SLOT_COUNT ? p : [...p, id]))
  }

  const dismissGuide = () => { setShowGuide(false); try { localStorage.setItem('hm_seen_guide', '1') } catch {} }

  const mm = String(Math.max(0, Math.floor(timeLeft / 60)))
  const ss = String(Math.max(0, timeLeft % 60)).padStart(2, '0')

  return (
    <div className="screen locker">
      {showGuide && (
        <div className="guide-overlay" onClick={dismissGuide}>
          <div className="guide-box">
            <h3>⚽ 감독 브리핑 (20초)</h3>
            <ol>
              <li>지시 카드 <b>3~4장</b>을 탭해서 선택하세요</li>
              <li>카드마다 <b>공격·수비·체력</b>이 변합니다 — 게이지를 보세요</li>
              <li>어떤 조합은 <b>⚡시너지</b>, 어떤 조합은 <b>💥충돌</b>합니다</li>
              <li>3분 안에 결정. 시간이 다 되면 그대로 킥오프!</li>
            </ol>
            <button className="btn primary">알겠다, 시작하자</button>
          </div>
        </div>
      )}

      <div className="locker-head sticky-top">
        <div className={`timer ${timeLeft <= 30 ? 'danger' : ''}`}>⏱ {mm}:{ss}</div>
        <div className="head-hint">지시 {picked.length}/{SLOT_COUNT}</div>
        <div className="scoreboard small"><span>{sc.startScore.us} : {sc.startScore.them}</span></div>
      </div>

      <div className="formation">
        <div className="formation-title">📋 예상 배치 — 카드를 고르면 선수가 움직입니다</div>
        <div className="fpitch">
          <div className="pitch-line center" />
          <div className="pitch-box left" /><div className="pitch-box right" />
          {sc.players.map(p => {
            const fp = formation[p.id]
            // 교체 카드 선택 시 보드에 실제 교체 반영 (OUT 선수 자리에 IN 선수 표시 + 글로우)
            const subCard = CARDS.find(c => c.sub && c.sub.out === p.id && picked.includes(c.id))
            const shownName = subCard ? subCard.sub.inName : p.name
            return (
              <div key={p.id} className={`fdot ${p.pos.toLowerCase()} ${(fp.glow || subCard) ? 'glow' : ''}`}
                   style={{ left: `${fp.x}%`, top: `${fp.y}%` }}>
                <span className="fdot-name">{shownName}</span>
              </div>
            )
          })}
        </div>
      </div>

      <Roster sc={sc} />

      <div className="gauges">
        <Gauge label="공격" value={stats.atk} max={18} color="#e63946" />
        <Gauge label="수비" value={stats.def} max={12} color="#457b9d" />
        <Gauge label="체력" value={stats.sta} max={12} color="#2a9d8f" />
      </div>

      <div className="synergy-notes">
        {stats.notes.map(n => <div key={n} className={`note ${n.startsWith('⚡') ? 'good' : 'bad'} fade-in`}>{n}</div>)}
      </div>

      <div className="slots">
        {Array.from({ length: SLOT_COUNT }).map((_, i) => {
          const id = picked[i]
          const c = id && CARDS.find(x => x.id === id)
          return (
            <div key={i} className={`slot ${c ? 'filled' : ''}`} onClick={() => c && toggle(id)}>
              {c ? <><span className="slot-icon">{c.icon}</span><span className="slot-name">{c.name}</span><span className="slot-x">✕</span></> : <span className="slot-empty">지시 {i + 1}</span>}
            </div>
          )
        })}
      </div>

      <div className="deck">
        {CARDS.map(c => {
          const orderIdx = picked.indexOf(c.id)
          const on = orderIdx >= 0
          const full = !on && picked.length >= SLOT_COUNT
          return (
            <button key={c.id} className={`card ${c.special ? 'special' : ''} ${on ? 'on' : ''} ${full ? 'dim' : ''}`} onClick={() => toggle(c.id)}>
              {on && <span className="card-order">{['①', '②', '③', '④'][orderIdx]}</span>}
              <div className="card-top"><span className="card-icon">{c.icon}</span><b>{c.name}</b></div>
              <div className="card-desc">{c.desc}</div>
              <div className="card-stats">
                {c.atk !== 0 && <span className={c.atk > 0 ? 'up' : 'down'}>공 {c.atk > 0 ? '+' : ''}{c.atk}</span>}
                {c.def !== 0 && <span className={c.def > 0 ? 'up' : 'down'}>수 {c.def > 0 ? '+' : ''}{c.def}</span>}
                {c.sta !== 0 && <span className={c.sta > 0 ? 'up' : 'down'}>체 {c.sta > 0 ? '+' : ''}{c.sta}</span>}
              </div>
              {on && <div className="card-risk fade-in">⚠ {c.risk}</div>}
            </button>
          )
        })}
      </div>

      <div className="locker-foot sticky-bottom">
        <button className="btn primary big" disabled={picked.length < 3} onClick={() => { if (!kickedRef.current) { kickedRef.current = true; onKickoff(picked) } }}>
          {picked.length < 3 ? `카드를 ${3 - picked.length}장 더 고르세요` : '🔥 후반전 킥오프!'}
        </button>
      </div>
    </div>
  )
}

// 선발 명단 스카우팅 — 접이식 (축구팬용 디테일: 선수별 장단점)
function Roster({ sc }) {
  const [open, setOpen] = useState(false)
  const hasDetail = sc.players.some(p => p.strong)
  if (!hasDetail) return null
  return (
    <div className="roster">
      <button className="roster-toggle" onClick={() => { play('click', 0.4); setOpen(o => !o) }}>
        📋 선발 명단 스카우팅 {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="roster-list fade-in">
          {sc.players.map(p => (
            <div key={p.id} className="roster-row">
              <div className="roster-head-line"><b>{p.name}</b> <span className="roster-pos">{p.pos}</span> <span className="roster-trait">{p.trait}</span></div>
              <div className="roster-strong">▲ {p.strong}</div>
              <div className="roster-weak">▽ {p.weak}</div>
            </div>
          ))}
          {sc.bench && (
            <div className="roster-row bench">
              <div className="roster-head-line"><b>⭐ {sc.bench.name}</b> <span className="roster-pos">{sc.bench.pos}</span> <span className="roster-trait">{sc.bench.trait}</span></div>
              <div className="roster-strong">▲ {sc.bench.strong}</div>
              <div className="roster-weak">▽ {sc.bench.weak}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Gauge({ label, value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="gauge">
      <span className="gauge-label">{label}</span>
      <div className="gauge-bar"><div className="gauge-fill" style={{ width: `${pct}%`, background: color }} /></div>
      <span className="gauge-num">{value}</span>
    </div>
  )
}
