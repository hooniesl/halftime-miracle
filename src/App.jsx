import React, { useState, useCallback } from 'react'
import Intro from './screens/Intro.jsx'
import LockerRoom from './screens/LockerRoom.jsx'
import Playback from './screens/Playback.jsx'
import Report from './screens/Report.jsx'
import { simulate, cardsFor, INTERVENTIONS } from './engine.js'
import { SCENARIOS, DEFAULT_SCENARIO } from './data.js'
import { soundOn, toggleSound, play } from './sound.js'

// 공유 리플레이 링크: #r=<scenario>:<card.card.card>:<intervention>
// (구형 2파트 링크 #r=<cards>:<iv> = 아즈리카전으로 해석. 불량 값은 조용히 무시 → 선택 화면)
function parseReplayHash() {
  const m = (window.location.hash || '').match(/^#r=(?:([a-z]+):)?([a-z_.]+):([a-z]+)$/)
  if (!m) return null
  const scenarioId = m[1] && SCENARIOS[m[1]] ? m[1] : (m[1] ? null : 'azurika')
  if (!scenarioId) return null
  const valid = new Set(cardsFor(scenarioId).map(c => c.id)) // 시나리오 덱 기준 (교체·분석 카드 포함)
  const ids = m[2].split('.').filter(id => valid.has(id))
  if (ids.length < 1 || ids.length > 4) return null
  if (!INTERVENTIONS.some(iv => iv.id === m[3])) return null
  return { scenarioId, ids, iv: m[3] }
}

export default function App() {
  const replay = React.useMemo(parseReplayHash, [])
  const [scenarioId, setScenarioId] = useState(replay ? replay.scenarioId : DEFAULT_SCENARIO)
  const [phase, setPhase] = useState(replay ? 'playback' : 'select') // select → intro → locker → playback → report
  const [result, setResult] = useState(() => replay ? simulate(replay.ids, replay.iv, replay.scenarioId) : null)
  const [pickedCards, setPickedCards] = useState(replay ? replay.ids : [])
  const [intervened, setIntervened] = useState(!!replay) // 리플레이 링크는 개입까지 끝난 경기
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hm_history') || '[]') } catch { return [] }
  })
  const sc = SCENARIOS[scenarioId]

  const pickScenario = useCallback((id) => {
    play('click', 0.45)
    setScenarioId(id)
    setPhase('intro')
  }, [])

  const kickoff = useCallback((ids) => {
    const r = simulate(ids, 'hold', scenarioId) // 기본 '흐름 유지' — 75' 개입 전 장면은 선택과 무관하게 동일
    setPickedCards(ids)
    setResult(r)
    setIntervened(false)
    setPhase('playback')
  }, [scenarioId])

  // 75' 긴급 지시 선택 → 남은 장면만 재계산 (개입 전 장면은 결정론상 불변)
  const intervene = useCallback((choiceId) => {
    setResult(simulate(pickedCards, choiceId, scenarioId))
    setIntervened(true)
  }, [pickedCards, scenarioId])

  const toReport = useCallback(() => {
    if (result) {
      const entry = { scenario: result.scenario, cards: pickedCards, us: result.us, them: result.them, outcome: result.outcome, rating: result.rating, at: Date.now() }
      const next = [entry, ...history].slice(0, 20)
      setHistory(next)
      try { localStorage.setItem('hm_history', JSON.stringify(next)) } catch {}
    }
    setPhase('report')
  }, [result, pickedCards, history])

  const retry = useCallback(() => { setResult(null); setPhase('locker') }, [])
  const toSelect = useCallback(() => { setResult(null); setPickedCards([]); setPhase('select') }, [])

  const [sound, setSound] = useState(soundOn())

  return (
    <div className="app">
      <button className="sound-toggle" onClick={() => setSound(toggleSound())} aria-label="사운드 켜기/끄기">
        {sound ? '🔊' : '🔇'}
      </button>
      {phase === 'select' && <ScenarioSelect onPick={pickScenario} />}
      {phase === 'intro' && <Intro sc={sc} onNext={() => setPhase('locker')} />}
      {phase === 'locker' && <LockerRoom sc={sc} onKickoff={kickoff} initial={pickedCards} />}
      {phase === 'playback' && result && <Playback result={result} intervened={intervened} onIntervene={intervene} onDone={toReport} />}
      {phase === 'report' && result && <Report result={result} sc={sc} cards={pickedCards} history={history} onRetry={retry} onSelect={toSelect} />}
    </div>
  )
}

function ScenarioSelect({ onPick }) {
  return (
    <div className="screen select">
      <div className="select-head">
        <h1>⚽ 하프타임의 기적</h1>
        <p>락커룸에서 경기를 뒤집는 감독 게임. 어떤 하프타임에 서시겠습니까?</p>
      </div>
      {Object.values(SCENARIOS).map(s => (
        <button key={s.id} className={`scenario-card ${s.id}`} onClick={() => onPick(s.id)}>
          <span className="sc-badge">{s.badge}</span>
          <b className="sc-title">{s.title}</b>
          <span className="sc-sub">{s.subtitle}</span>
          {s.realityNote && <span className="sc-real">그날의 결과를 알고 있다면, 바꿀 수도 있다.</span>}
        </button>
      ))}
      <p className="select-foot">실제 경기 데이터는 공개된 경기 기록(스코어·출전 명단)을 바탕으로 재구성했습니다.</p>
    </div>
  )
}
