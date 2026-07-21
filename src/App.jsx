import React, { useState, useCallback } from 'react'
import Intro from './screens/Intro.jsx'
import LockerRoom from './screens/LockerRoom.jsx'
import Playback from './screens/Playback.jsx'
import Report from './screens/Report.jsx'
import { simulate } from './engine.js'

// 공유 리플레이 링크: #r=<card.card.card>:<intervention> — 열면 그 경기 하이라이트가 바로 재생
// 존재하는 카드/개입만 통과 — 조작된 해시는 조용히 무시하고 인트로로 (모의심사 2차 지적 가드)
import { CARDS, INTERVENTIONS } from './engine.js'
function parseReplayHash() {
  const m = (window.location.hash || '').match(/^#r=([a-z_.]+):([a-z]+)$/)
  if (!m) return null
  const valid = new Set(CARDS.map(c => c.id))
  const ids = m[1].split('.').filter(id => valid.has(id))
  if (ids.length < 1 || ids.length > 4) return null
  if (!INTERVENTIONS.some(iv => iv.id === m[2])) return null
  return { ids, iv: m[2] }
}

export default function App() {
  const replay = React.useMemo(parseReplayHash, [])
  const [phase, setPhase] = useState(replay ? 'playback' : 'intro') // intro → locker → playback → report
  const [result, setResult] = useState(() => replay ? simulate(replay.ids, replay.iv) : null)
  const [pickedCards, setPickedCards] = useState(replay ? replay.ids : [])
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hm_history') || '[]') } catch { return [] }
  })

  const [intervened, setIntervened] = useState(!!replay) // 리플레이 링크는 개입까지 끝난 경기

  const kickoff = useCallback((ids) => {
    const r = simulate(ids) // 기본 '흐름 유지' 시뮬 — 75' 개입 전 장면은 선택과 무관하게 동일
    setPickedCards(ids)
    setResult(r)
    setIntervened(false)
    setPhase('playback')
  }, [])

  // 75' 긴급 지시 선택 → 남은 장면만 재계산 (개입 전 장면은 결정론상 불변)
  const intervene = useCallback((choiceId) => {
    setResult(simulate(pickedCards, choiceId))
    setIntervened(true)
  }, [pickedCards])

  const toReport = useCallback(() => {
    if (result) {
      const entry = { cards: pickedCards, us: result.us, them: result.them, outcome: result.outcome, rating: result.rating, at: Date.now() }
      const next = [entry, ...history].slice(0, 20)
      setHistory(next)
      try { localStorage.setItem('hm_history', JSON.stringify(next)) } catch {}
    }
    setPhase('report')
  }, [result, pickedCards, history])

  const retry = useCallback(() => { setResult(null); setPhase('locker') }, [])

  return (
    <div className="app">
      {phase === 'intro' && <Intro onNext={() => setPhase('locker')} />}
      {phase === 'locker' && <LockerRoom onKickoff={kickoff} initial={pickedCards} />}
      {phase === 'playback' && result && <Playback result={result} intervened={intervened} onIntervene={intervene} onDone={toReport} />}
      {phase === 'report' && result && <Report result={result} cards={pickedCards} history={history} onRetry={retry} />}
    </div>
  )
}
