// 가상 팀·선수 더미 데이터 (실존 선수·국가 미사용 — 저작권/명예훼손 리스크 차단)
export const US_TEAM = {
  name: '코리아 유나이티드',
  color: '#e63946',
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
  bench: [
    { id: 'sub1', name: '금강산', pos: 'FW', atk: 8, def: 2, spd: 8, sta: 9, trait: '슈퍼서브' },
    { id: 'sub2', name: '설악춘', pos: 'MF', atk: 6, def: 6, spd: 7, sta: 9, trait: '분위기 메이커' },
  ],
}

export const ENEMY_TEAM = {
  name: '아즈리카 FC',
  color: '#1d5fbf',
  atk: 8,
  def: 7,
  style: '역습',
  note: '전반 역습 두 방에 0-2. 라인을 올리면 뒷공간이 열리는 팀이다.',
}

// 전반전 요약 (인트로)
export const FIRST_HALF = [
  { minute: 12, text: '역습 한 방. 수비 라인 뒷공간이 뚫리며 선제 실점. 0-1.' },
  { minute: 34, text: '중원에서 볼을 뺏기자 곧바로 두 번째 역습. 0-2.' },
  { minute: 45, text: '전반 종료. 슈팅 수 9-4로 앞서고도 스코어는 0-2. 라커룸으로.' },
]
