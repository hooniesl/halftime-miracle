// 하프타임의 기적 — 결정론 규칙 엔진
// 원칙: 외부 API 0, 순수 클라이언트. 같은 (시나리오+카드+개입) = 같은 결과 (시드 고정).
// 결과는 랜덤이 아니라 "선택의 인과"로 보여야 한다 (회의 결정: 몰입 붕괴 방지).
import { SCENARIOS, DEFAULT_SCENARIO } from './data.js'

// ─── 터치라인 지시 카드 (10~12장 중 3~4장 선택) ───
export const CARDS = [
  { id: 'press',    name: '전방 압박',     icon: '🔥', atk: 3, def: -1, sta: -3, desc: '최전방부터 압박해 높은 위치에서 볼을 뺏는다.', risk: '체력 소모 큼 — 막판 실점 위험' },
  { id: 'overload', name: '좌측 오버로드', icon: '⬅️', atk: 2, def: 0,  sta: -1, desc: '왼쪽에 숫자를 몰아 측면을 부순다.', risk: '반대 측면 뒷공간 노출' },
  { id: 'longball', name: '롱볼 전환',     icon: '🎯', atk: 2, def: 1,  sta: 0,  desc: '빌드업 생략, 최전방으로 바로 붙인다.', risk: '점유율 하락' },
  { id: 'threetop', name: '투톱 → 스리톱', icon: '⚔️', atk: 4, def: -2, sta: -1, desc: '공격수를 한 명 더 올려 총공세.', risk: '중원 장악력 약화' },
  { id: 'linedown', name: '라인 다운',     icon: '🧱', atk: -2, def: 3, sta: 1,  desc: '수비 라인을 내려 역습부터 차단한다.', risk: '공격 기회 감소' },
  { id: 'tempo',    name: '템포 다운',     icon: '🐢', atk: -1, def: 2, sta: 2,  desc: '점유하며 상대 역습의 김을 뺀다.', risk: '시간이 우리 편이 아니다' },
  { id: 'supersub', name: '슈퍼서브 투입', icon: '🦸', atk: 3, def: 0,  sta: 2,  desc: '벤치의 {SUB} 투입. 체력이 쌩쌩하다.', risk: '교체 카드 소진' },
  { id: 'counter',  name: '역습 올인',     icon: '⚡', atk: 3, def: -1, sta: 0,  desc: '내려섰다가 한 방에 {SPD}의 스피드로 찌른다.', risk: '점유를 완전히 내준다' },
  { id: 'setpiece', name: '세트피스 집중', icon: '📐', atk: 2, def: 1,  sta: 0,  desc: '코너킥·프리킥에서 {TGT}의 머리를 노린다.', risk: '필드골 생산력은 그대로' },
  { id: 'captain',  name: '캡틴 독려',     icon: '🗣️', atk: 1, def: 1,  sta: 2,  desc: '{CAP}이 팀을 다시 뛰게 만든다.', risk: '전술 변화는 없음' },
  { id: 'gamble',   name: '수비수 공격 가담', icon: '🎲', atk: 4, def: -3, sta: -1, desc: '{GAM}까지 올린다. 마지막 도박.', risk: '역습 한 방이면 끝장' },
  { id: 'wingswap', name: '윙 스위칭',     icon: '🔄', atk: 2, def: 0,  sta: 0,  desc: '좌우 윙을 바꿔 매치업 미스를 만든다.', risk: '적응에 10분 필요' },
]

// 카드 조합 시너지/충돌 — 게이지와 중계에 그대로 노출 (선택의 인과)
export const SYNERGY = [
  { pair: ['press', 'threetop'],   bonus: 2,  label: '⚡ 시너지: 전방 압박 + 스리톱 — 상대 빌드업이 질식한다' },
  { pair: ['counter', 'linedown'], bonus: 2,  label: '⚡ 시너지: 라인 다운 + 역습 올인 — 상대를 끌어내고 찌른다' },
  { pair: ['longball', 'setpiece'],bonus: 1,  label: '⚡ 시너지: 롱볼 + 세트피스 — 공중전 이중 위협' },
  { pair: ['supersub', 'press'],   bonus: 1,  label: '⚡ 시너지: 슈퍼서브 + 압박 — 지친 다리를 대신 뛰어준다' },
  { pair: ['overload', 'wingswap'],bonus: 1,  label: '⚡ 시너지: 오버로드 + 윙 스위칭 — 측면이 완전히 무너진다' },
  { pair: ['press', 'linedown'],   bonus: -2, label: '💥 충돌: 전방 압박 + 라인 다운 — 진형이 두 동강 난다' },
  { pair: ['tempo', 'counter'],    bonus: -2, label: '💥 충돌: 템포 다운 + 역습 올인 — 지시가 모순된다' },
  { pair: ['threetop', 'linedown'],bonus: -1, label: '💥 충돌: 스리톱 + 라인 다운 — 간격이 벌어져 중원 실종' },
  { pair: ['gamble', 'tempo'],     bonus: -1, label: '💥 충돌: 수비수 가담 + 템포 다운 — 올리고도 못 쓴다' },
]

// ─── 시드 고정 난수 (같은 조합 = 같은 후반전) ───
function seedFromCards(ids) {
  const s = [...ids].sort().join('|')
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function comboStats(ids) {
  let atk = 5, def = 5, sta = 6 // 후반 시작 기본치 (전반 열세 반영)
  const notes = []
  for (const id of ids) {
    const c = CARDS.find(x => x.id === id)
    if (!c) continue
    atk += c.atk; def += c.def; sta += c.sta
  }
  for (const s of SYNERGY) {
    if (s.pair.every(p => ids.includes(p))) {
      if (s.bonus > 0) atk += s.bonus       // 시너지 = 공격 보너스
      else { atk += s.bonus; def += s.bonus } // 충돌 = 공수 동반 감점
      notes.push(s.label)
    }
  }
  return { atk: Math.max(1, atk), def: Math.max(1, def), sta: Math.max(1, sta), notes }
}

// 카드별 중계 문구 재료 (선택 카드가 장면에 등장해야 인과가 보임)
// good = 변주 배열(복붙 반복 방지). {SPD}{SUB}{TGT}{CAP}{GAM}{LW}{GK}{MAGIC}{ENEMY} = 시나리오별 실명/가상 이름 치환.
// 🛡️ 법무 게이트: 부정 문구(bad)에는 선수 이름 토큰 사용 금지 — 팀 단위 묘사만 (실명 비하 방지).
const CARD_SCENES = {
  press:    { good: ['전방 압박이 통했다! 상대 골킥을 최전방에서 끊어낸다', '{SPD}가 골키퍼까지 쫓아간다. 상대 빌드업이 완전히 질식', '높은 위치에서 볼 탈취! 곧바로 슈팅 각이 열린다'], bad: '압박에 다리가 풀렸다. 후반 막판 라인이 무너진다' },
  overload: { good: ['왼쪽 오버로드! {LW}까지 올라가 숫자로 부순다', '왼쪽에서 2대1, 3대2 — 상대 풀백이 비명을 지른다'], bad: '오른쪽 뒷공간이 텅 비었다. {ENEMY}가 그 틈을 노린다' },
  longball: { good: ['롱볼 한 방이 수비 뒷공간에 떨어진다', '{GK}의 롱킥이 단숨에 최전방으로 — 경합!'], bad: '롱볼이 번번이 걷혀 나온다. 점유율이 30%대' },
  threetop: { good: ['공격수 총공세! 박스 안이 우리 유니폼으로 가득하다', '세 명의 공격수가 동시에 침투한다. 수비가 셋을 다 못 본다'], bad: '중원이 실종됐다. 세컨볼을 전부 내준다' },
  linedown: { good: ['내려선 수비가 역습을 원천 차단한다', '블록이 단단하다. 상대 공격수가 등을 돌린다'], bad: '너무 내려섰나. 공격 숫자가 부족하다' },
  tempo:    { good: ['템포를 죽이며 상대 역습의 김을 뺀다', '점유율이 다시 올라온다. 경기가 우리 리듬으로'], bad: '시계만 흐른다. 관중석에서 탄식이 나온다' },
  supersub: { good: ['{SUB} 투입! 벤치가 준비한 비장의 카드', '{SUB}이 쌩쌩한 다리로 수비 사이를 헤집는다'], bad: '' },
  counter:  { good: ['뺏자마자 {SPD}가 폭발적인 스피드로 하프라인을 돌파한다', '역습 한 방! {SPD}의 질주에 수비가 따라오지 못한다'], bad: '내려선 채 공만 바라본다. 슈팅이 안 나온다' },
  setpiece: { good: ['코너킥, 연습한 그림이다! {TGT}가 솟구친다', '프리킥 상황 — {MAGIC}의 킥이 위협적인 곳에 떨어진다'], bad: '' },
  captain:  { good: ['{CAP}이 소리친다. 팀 전체 활동량이 눈에 띄게 올라간다', '주장의 박수 한 번에 관중이 다시 끓는다'], bad: '' },
  gamble:   { good: ['{GAM}까지 박스 안으로! 뒷일은 생각하지 않는다!', '수비수가 최전방에 서 있다. 벼랑 끝 올인'], bad: '수비수가 올라간 사이, 등 뒤가 고속도로다' },
  wingswap: { good: ['윙 스위칭에 상대 풀백이 완전히 길을 잃었다', '좌우가 바뀌자 매치업이 무너진다. 반박자 빠른 크로스'], bad: '' },
}
const fillNames = (text, sc) => {
  if (!text) return text
  const map = { ...sc.names, ENEMY: sc.enemyName }
  return text.replace(/\{(\w+)\}/g, (_, k) => map[k] || '')
}
const goodText = (cardId, minute, sc) => {
  const g = CARD_SCENES[cardId]?.good
  if (!g) return ''
  return fillNames(Array.isArray(g) ? g[minute % g.length] : g, sc)
}

// 시나리오별 카드 목록 (이름/설명 오버라이드 적용 — 예: korea의 supersub = '손흥민 투입')
export function cardsFor(scenarioId) {
  const sc = SCENARIOS[scenarioId] || SCENARIOS[DEFAULT_SCENARIO]
  return CARDS.map(c => {
    const merged = { ...c, ...(sc.cardOverrides[c.id] || {}) }
    return { ...merged, name: fillNames(merged.name, sc), desc: fillNames(merged.desc, sc), risk: fillNames(merged.risk, sc) }
  })
}

// ─── 후반 75분 긴급 지시 (터치라인 개입 — 모의심사 1차 최대 감점 보완) ───
export const INTERVENTIONS = [
  { id: 'allout', name: '총공세',  icon: '⚔️', desc: '전원 공격. 라인을 끝까지 올린다.', atk: 6, def: -5 },
  { id: 'hold',   name: '흐름 유지', icon: '✋', desc: '지금 이 흐름을 믿는다.', atk: 0, def: 0 },
  { id: 'lock',   name: '잠그기',  icon: '🔒', desc: '문을 걸어 잠근다. 지키는 축구.', atk: -5, def: 6 },
]
export const INTERVENTION_MINUTE = 75
const COACH_SCENES = {
  allout: "75' 📣 터치라인의 감독이 팔을 휘젓는다 — 전원 공격! 라인이 하프라인을 넘어간다",
  hold:   "75' 📣 감독은 침착하게 유지 사인. 선수들이 고개를 끄덕인다",
  lock:   "75' 📣 감독이 두 손으로 내리는 제스처 — 걸어 잠근다. 수비 블록이 내려앉는다",
}

// ─── 후반전 시뮬레이션: 하이라이트 장면 + 75' 개입 + 결말 분기 ───
// 개입 전 장면은 어떤 선택을 해도 동일해야 함(난수 소비 순서 불변) — 재생 중 교체 가능 구조
export function simulate(rawIds, interventionId = 'hold', scenarioId = DEFAULT_SCENARIO) {
  const sc = SCENARIOS[scenarioId] || SCENARIOS[DEFAULT_SCENARIO]
  const ids = [...rawIds].sort() // 순서 무관 완전 결정론 (장면 추출까지)
  const { atk, def, sta, notes } = comboStats(ids)
  const iv = INTERVENTIONS.find(x => x.id === interventionId) || INTERVENTIONS[1]
  const rnd = mulberry32(seedFromCards([sc.id, ...ids]))
  const scenes = []
  let us = sc.startScore.us, them = sc.startScore.them

  // 장면 시간대 (고정 뼈대 → 완성도·인과 통제)
  const slots = [48, 53, 59, 64, 70, 76, 82, 87, 93]
  // 득점 기대치: atk 기반. 실점 위험: def·sta 기반(막판 가중). 75' 이후 개입 보정 반영
  for (const minute of slots) {
    if (minute === 76) {
      scenes.push({ minute: INTERVENTION_MINUTE, type: 'coach', card: null, text: COACH_SCENES[iv.id] })
    }
    const late = minute >= 80
    const iAtk = minute >= 76 ? iv.atk : 0
    const iDef = minute >= 76 ? iv.def : 0
    const fatigue = late ? Math.max(0, (7 - sta)) * 0.045 : 0
    const pGoalUs = Math.min(0.34, (0.03 + (atk + iAtk) * 0.017) * sc.difficulty.atkCoef + (late ? 0.04 : 0))
    const isFateMin = sc.fateMinute === minute
    // 운명의 순간(실제 실점 시각): 실점 위험 2배 — 수비를 짜뒀다면 막고, 아니면 역사가 반복된다
    const pGoalThem = Math.min(0.5, (Math.max(0.03, 0.15 - (def + iDef) * 0.011) + fatigue + sc.difficulty.themBonus) * (isFateMin ? 2 : 1))
    const r = rnd()
    let cardId = ids[Math.floor(rnd() * ids.length)]
    // 직전 장면과 같은 카드면 다음 카드로 순환 — 연속 복붙 문구 방지 (난수 소비량 불변)
    const prevCard = scenes.length ? scenes[scenes.length - 1].card : null
    if (cardId === prevCard && ids.length > 1) cardId = ids[(ids.indexOf(cardId) + 1) % ids.length]
    const cs = CARD_SCENES[cardId] || {}
    const good = goodText(cardId, minute, sc)
    const isFate = isFateMin
    if (r < pGoalUs) {
      us++
      scenes.push({ minute, type: 'goal_us', card: cardId,
        text: `${minute}' ⚽ 골! ${good || '파상공세 끝에 그물이 출렁인다'} — ${us}-${them}` })
    } else if (r < pGoalUs + pGoalThem) {
      them++
      scenes.push({ minute, type: 'goal_them', card: cardId,
        text: isFate ? `${sc.fateTexts.goal_them} — ${us}-${them}`
                     : `${minute}' 💔 실점… ${fillNames(cs.bad, sc) || '역습 한 방을 허용한다'} — ${us}-${them}` })
    } else if (isFate) {
      scenes.push({ minute, type: 'chance', card: cardId, text: sc.fateTexts.escaped })
    } else if (r < pGoalUs + pGoalThem + 0.25) {
      scenes.push({ minute, type: 'chance', card: cardId,
        text: `${minute}' 🌊 ${good || '기회를 만든다'} — 아깝게 빗나간다!` })
    } else {
      scenes.push({ minute, type: 'flow', card: cardId,
        text: `${minute}' ${good || '경기가 흐른다'}` })
    }
  }

  // 결말 판정 (시나리오별 결말 문구 우선)
  let outcome, headline
  if (us > them) { outcome = 'win';  headline = `${us}-${them}. ` + (sc.outro?.win || '기적이다! 대역전승!') }
  else if (us === them) { outcome = 'draw'; headline = `${us}-${them}. ` + (sc.outro?.draw || '벼랑 끝에서 살아 돌아왔다. 승부는 연장으로.') }
  else { outcome = 'loss'; headline = `${us}-${them}. ` + (sc.outro?.loss || '뒤집지 못했다. 하지만 후반의 그 15분은 진짜였다.') }

  // 감독 평점 (10점 만점): 결과 + 시너지 + 카드 다양성
  const synergyScore = notes.filter(n => n.startsWith('⚡')).length - notes.filter(n => n.startsWith('💥')).length
  let rating = outcome === 'win' ? 8.5 : outcome === 'draw' ? 6.5 : 4.5
  rating = Math.max(1, Math.min(10, rating + synergyScore * 0.5 + (us >= 2 ? 0.5 : 0)))

  return { scenes, us, them, outcome, headline, rating: rating.toFixed(1), stats: { atk, def, sta }, notes, intervention: iv.id, scenario: sc.id, start: sc.startScore }
}
