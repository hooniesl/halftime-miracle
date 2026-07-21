// 사운드 매니저 — 직접 합성한 3종 (사장 선택 2026-07-22: 휘슬4·함성2·클릭1)
// 모든 재생은 사용자 제스처 이후에만 발생 → 브라우저 자동재생 정책과 충돌 없음
const KEY = 'hm_sound'
let enabled = localStorage.getItem(KEY) !== 'off'
const cache = {}

export function soundOn() { return enabled }
export function toggleSound() {
  enabled = !enabled
  try { localStorage.setItem(KEY, enabled ? 'on' : 'off') } catch {}
  return enabled
}

export function play(name, vol = 0.5) {
  if (!enabled) return
  try {
    if (!cache[name]) cache[name] = new Audio(`${import.meta.env.BASE_URL}sounds/${name}.mp3`)
    const a = cache[name]
    a.currentTime = 0
    a.volume = vol
    a.play().catch(() => {})
  } catch {}
}
