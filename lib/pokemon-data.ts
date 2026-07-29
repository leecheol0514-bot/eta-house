export const POKEMON_SUGGESTIONS = [
  "피카츄", "라이츄", "파이리", "리자드", "리자몽",
  "꼬부기", "어니부기", "거북왕", "이상해씨", "이상해풀", "이상해꽃",
  "캐터피", "단데기", "버터플", "뿔충이", "딱충이", "독침붕",
  "구구", "피죤", "피죤투", "깨비참", "깨비드릴조",
  "아보", "아보크", "피츄", "삐", "삐삐", "푸린",
  "나옹", "페르시온", "고라파덕", "골덕", "망키", "성원숭",
  "가디", "윈디", "발챙이", "슈륙쌩", "강챙이", "치렁",
  "야돈", "야도란", "코일", "레어코일", "파오리",
  "두두", "두트리오", "쥬쥬", "또가스", "또도가스",
  "고오스", "고우스트", "팬텀", "론스", "슬리프", "슬리퍼",
  "크랩", "킹크랩", "찌리리공", "붐볼", "아라리", "나시",
  "탕구리", "텅구리", "시라소몬", "홍수몬", "내루미", "마임맨",
  "스라크", "루주라", "에레브", "마그마", "쁘사이저", "켄타로스",
  "잉어킹", "갸라도스", "라프라스", "메타몽", "이브이",
  "샤미드", "쥬피썬더", "부스터", "포니타", "야부엉",
  "뮤", "뮤츠", "치코리타", "브케인", "마그마비",
  "리아코", "엘리게이", "장크로다일", "루카리오", "리오르",
  "한바이트", "한카리아스", "개굴닌자", "개구마르", "개굴리",
  "엘레이드", "글레이시아", "리프레온", "블래키", "에이팜",
  "자시안", "자마젠타", "Charizard", "Blastoise", "Venusaur",
  "Gengar", "Dragonite", "Snorlax", "Umbreon", "Espeon",
  "Sylveon", "Tyranitar", "Metagross", "Salamence", "Rayquaza",
  "Garchomp", "Lucario", "Greninja", "Cinderace",
];

export function filterPokemonSuggestions(query: string, limit = 8): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const unique = [...new Set(POKEMON_SUGGESTIONS)];

  return unique
    .filter((name) => name.toLowerCase().includes(normalized))
    .slice(0, limit)
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(normalized);
      const bStarts = b.toLowerCase().startsWith(normalized);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b, "ko");
    });
}
