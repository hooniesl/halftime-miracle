// 브라우저 QA 스모크 — 인트로→라커룸→카드 3장→킥오프→스킵→리포트 완주 + 스크린샷
// 실행: node qa_smoke.mjs (vite preview가 4197에 떠 있어야 함)
import { chromium, devices } from '@playwright/test'

const BASE = 'http://localhost:4197'
const shots = '/tmp/hm_qa'
const errors = []

const browser = await chromium.launch()
const ctx = await browser.newContext({ ...devices['iPhone 13'] })
const page = await ctx.newPage()
page.on('pageerror', e => errors.push('pageerror: ' + e.message))
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()) })

await page.goto(BASE)
await page.waitForTimeout(3500) // 인트로 타임라인 재생 대기
await page.screenshot({ path: `${shots}/1_intro.png` })

await page.getByText('라커룸 문을 연다').click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${shots}/2_guide.png` })
await page.getByText('알겠다, 시작하자').click()
await page.waitForTimeout(300)

// 카드 3장 선택 (시너지 조합: 라인다운+역습올인+슈퍼서브)
for (const name of ['라인 다운', '역습 올인', '슈퍼서브 투입']) {
  await page.getByRole('button', { name: new RegExp(name) }).click()
  await page.waitForTimeout(250)
}
await page.screenshot({ path: `${shots}/3_locker_picked.png`, fullPage: true })

await page.getByText('후반전 킥오프!').click()
await page.waitForTimeout(2500)
await page.screenshot({ path: `${shots}/4_playback.png` })

// 75' 긴급 지시 팝업 대기 → 총공세 선택
await page.getByText('당신의 마지막 지시는?').waitFor({ timeout: 20000 })
await page.screenshot({ path: `${shots}/4b_intervene.png` })
await page.getByRole('button', { name: /총공세/ }).click()
await page.waitForTimeout(1200)

await page.getByText('결과로 건너뛰기').click()
await page.waitForTimeout(600)
await page.getByText('감독 리포트 보기').click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${shots}/5_report.png`, fullPage: true })

// 재도전 동선
await page.getByText('다른 선택이었다면').click()
await page.waitForTimeout(300)
const timerVisible = await page.locator('.timer').isVisible()

await browser.close()
console.log(JSON.stringify({ ok: errors.length === 0 && timerVisible, retryToLocker: timerVisible, errors }, null, 1))
