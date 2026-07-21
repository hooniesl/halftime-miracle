// 시나리오 데이터 — 실전(남아공전, 실제 데이터) + 가상(아즈리카전, 연습경기)
// 실명 사용 근거: 본 대회 데이터 규정 "실제 선수 이름, 포지션, 국가 등의 정보를 참고하여 직접 하드 코딩 가능".
// 법무 게이트(2026-07-22): ①실명·기록만 사용, 사진/초상 미사용 ②선수 개인 비하 문구 금지(부정 묘사는 팀 단위로만) ③스탯 중립.
// 실전 팩트 출처: FIFA 매치센터·SBS·이데일리 (2026-06-27 A조 남아공 1-0 한국, 63' 마세코 결승골, 손흥민 첫 벤치→후반 2선 교체 투입)

export const SCENARIOS = {
  korea: {
    id: 'korea',
    badge: '🇰🇷 실화',
    title: '남아공전, 그날의 후반',
    subtitle: '2026 월드컵 A조 최종전 — 실제 데이터',
    teamName: '대한민국',
    enemyName: '남아프리카공화국',
    startScore: { us: 0, them: 2 - 2 }, // 하프타임 실제 스코어 0-0
    // 밀집수비 상대 — 득점 난이도 소폭 상승, 역습 실점 위험 소폭 상승
    difficulty: { atkCoef: 0.76, themBonus: 0.03 },
    fateMinute: 64, // 실제 실점 시각(후반 18분≈63~64') — 운명의 순간
    fateTexts: {
      goal_them: "64' 💔 역사가 반복된다… 모레미의 낮은 크로스, 마세코가 그날처럼 파고든다 — 실점",
      escaped: "64' 🛡️ 실제라면 실점했을 그 시간 — 마세코의 슛이 이번엔 빗나간다! 역사가 바뀌고 있다",
    },
    outro: {
      win: '역사를 다시 썼다! 그날 못 넘은 산을 당신이 넘었다.',
      draw: '무승부 — 실제(0-1 패배)보다는 나은 역사. 하지만 아직 부족하다.',
      loss: '역사는 반복됐다… 하지만 당신은 그날의 벤치보다 먼저 움직였다.',
    },
    realityNote: '실제 역사: 이날 대한민국은 후반 18분 실점, 0-1로 패해 32강 자력 진출에 실패했다. 손흥민은 월드컵 커리어 처음으로 벤치에서 하프타임을 맞았다.',
    firstHalf: [
      { minute: 20, text: '점유는 하는데 골문이 열리지 않는다. 남아공의 밀집 수비가 단단하다.' },
      { minute: 38, text: '남아공의 역습 한 방 — 김민재가 몸을 던져 끊어낸다. 등골이 서늘하다.' },
      { minute: 45, text: '전반 종료 0-0. 답답한 흐름. 그리고 벤치에는 손흥민이 앉아 있다.' },
    ],
    enemyNote: '낮게 내려선 5백 밀집 수비 + 마세코·모레미의 역습 한 방. 라인을 올리면 그 창에 찔린다.',
    players: [
      { id: 'gk1', name: '김승규', pos: 'GK', atk: 1, def: 8, spd: 4, sta: 7, trait: '빌드업 킥' },
      { id: 'df1', name: '이한범', pos: 'DF', atk: 3, def: 7, spd: 6, sta: 7, trait: '대인 방어' },
      { id: 'df2', name: '김민재', pos: 'DF', atk: 4, def: 9, spd: 7, sta: 8, trait: '주장 · 괴물 수비' },
      { id: 'df3', name: '이기혁', pos: 'DF', atk: 3, def: 7, spd: 6, sta: 7, trait: '침착한 커버' },
      { id: 'df4', name: '설영우', pos: 'DF', atk: 6, def: 7, spd: 8, sta: 8, trait: '오버래핑' },
      { id: 'mf1', name: '황인범', pos: 'MF', atk: 7, def: 6, spd: 6, sta: 8, trait: '중원 조율' },
      { id: 'mf2', name: '백승호', pos: 'MF', atk: 6, def: 6, spd: 5, sta: 7, trait: '중거리포' },
      { id: 'mf3', name: '이태석', pos: 'MF', atk: 6, def: 5, spd: 8, sta: 7, trait: '왼쪽 질주' },
      { id: 'fw1', name: '이강인', pos: 'FW', atk: 9, def: 3, spd: 7, sta: 6, trait: '킬패스 · 마법' },
      { id: 'fw2', name: '오현규', pos: 'FW', atk: 7, def: 3, spd: 7, sta: 8, trait: '타겟 스트라이커' },
      { id: 'fw3', name: '황희찬', pos: 'FW', atk: 8, def: 3, spd: 9, sta: 7, trait: '폭발 스피드' },
    ],
    // 엔진 중계 문구용 실명 매핑 (긍정 문구에만 사용 — 비하 금지 게이트)
    names: { SPD: '황희찬', SUB: '손흥민', TGT: '김민재', CAP: '김민재', GAM: '설영우', LW: '이태석', GK: '김승규', MAGIC: '이강인' },
    cardOverrides: {
      supersub: { name: '손흥민 투입', icon: '⭐', desc: '벤치의 캡틴이 몸을 푼다. 2선에서 게임을 조립한다.', risk: '실제 그날엔 늦었다. 당신은?' },
      gamble:   { desc: '설영우까지 올린다. 마지막 도박.', risk: '역습 한 방이면 끝장' },
    },
  },

  azurika: {
    id: 'azurika',
    badge: '🎮 연습경기',
    title: '아즈리카전 0-2 뒤집기',
    subtitle: '가상 시나리오 — 감독 훈련장',
    teamName: '코리아 유나이티드',
    enemyName: '아즈리카 FC',
    startScore: { us: 0, them: 2 },
    difficulty: { atkCoef: 1, themBonus: 0 },
    fateMinute: null,
    fateTexts: null,
    outro: null, // 기본 결말 문구 사용
    realityNote: null,
    firstHalf: [
      { minute: 12, text: '역습 한 방. 수비 라인 뒷공간이 뚫리며 선제 실점. 0-1.' },
      { minute: 34, text: '중원에서 볼을 뺏기자 곧바로 두 번째 역습. 0-2.' },
      { minute: 45, text: '전반 종료. 슈팅 수 9-4로 앞서고도 스코어는 0-2. 락커룸으로.' },
    ],
    enemyNote: '전반 역습 두 방에 0-2. 라인을 올리면 뒷공간이 열리는 팀이다.',
    players: [
      { id: 'gk1', name: '강철벽', pos: 'GK', atk: 1, def: 8, spd: 4, sta: 7, trait: '선방 본능' },
      { id: 'df1', name: '차돌민', pos: 'DF', atk: 3, def: 8, spd: 5, sta: 6, trait: '태클 장인' },
      { id: 'df2', name: '백두혁', pos: 'DF', atk: 2, def: 7, spd: 6, sta: 7, trait: '제공권' },
      { id: 'df3', name: '한결', pos: 'DF', atk: 4, def: 7, spd: 7, sta: 6, trait: '오버래핑' },
      { id: 'df4', name: '오성준', pos: 'DF', atk: 3, def: 6, spd: 6, sta: 8, trait: '침착' },
      { id: 'mf1', name: '이현로', pos: 'MF', atk: 6, def: 6, spd: 6, sta: 8, trait: '엔진' },
      { id: 'mf2', name: '정바람', pos: 'MF', atk: 7, def: 4, spd: 8, sta: 6, trait: '드리블러' },
      { id: 'mf3', name: '문시온', pos: 'MF', atk: 8, def: 3, spd: 7, sta: 5, trait: '킬패스' },
      { id: 'fw1', name: '나포효', pos: 'FW', atk: 9, def: 2, spd: 8, sta: 6, trait: '결정력' },
      { id: 'fw2', name: '지평선', pos: 'FW', atk: 7, def: 2, spd: 9, sta: 7, trait: '뒷공간 침투' },
      { id: 'fw3', name: '류하늘', pos: 'FW', atk: 8, def: 3, spd: 7, sta: 4, trait: '중거리포' },
    ],
    names: { SPD: '지평선', SUB: '금강산', TGT: '백두혁', CAP: '이현로', GAM: '차돌민', LW: '한결', GK: '강철벽', MAGIC: '문시온' },
    cardOverrides: {},
  },
}

export const DEFAULT_SCENARIO = 'korea'
