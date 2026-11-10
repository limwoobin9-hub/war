export const VERSION = 1;
export const BRANCHES = {
  armor: {
    name: "기갑 장교",
    en: "PANZER",
    icon: "tank",
    color: "#c5ad76",
    men: 620,
    gear: 58,
    maxGear: 72,
    gearName: "전차",
    units: [
      "제1기갑사단 · 제1기갑연대",
      "제2기갑사단 · 제3기갑연대",
      "제3기갑사단 · 제6기갑연대",
    ],
    org: ["전차 중대", "전차 중대", "전차 중대"],
    terrain: "연료가 충분할 때 전투력 +12%",
    power: 1.12,
  },
  infantry: {
    name: "보병 장교",
    en: "INFANTERIE",
    icon: "rifle",
    color: "#a4b99a",
    men: 820,
    gear: 36,
    maxGear: 48,
    gearName: "지원화기",
    units: [
      "제1보병사단 · 제1보병연대",
      "제5보병사단 · 제14보병연대",
      "제18보병사단 · 제30보병연대",
    ],
    org: ["소총 중대", "소총 중대", "소총 중대"],
    terrain: "방어전에서 전투력 +12%",
    power: 1,
  },
  cavalry: {
    name: "기병 장교",
    en: "KAVALLERIE",
    icon: "horse",
    color: "#b5a8c4",
    men: 560,
    gear: 420,
    maxGear: 520,
    gearName: "군마",
    units: [
      "제1기병여단 · 제1기병연대",
      "제1기병여단 · 제2기병연대",
      "제1기병여단 · 기병지원단",
    ],
    org: ["기병 중대", "기병 중대", "기병 중대"],
    terrain: "정찰과 측방 기동으로 전투력 +4%",
    power: 1.04,
  },
};
export const TRAITS = [
  {
    id: "quartermaster",
    name: "꼼꼼한 보급관",
    desc: "매월 보급 +6",
    icon: "box",
  },
  {
    id: "inspiring",
    name: "병사들의 신뢰",
    desc: "휴식 사기 회복 +5",
    icon: "users",
  },
  { id: "tactician", name: "전술적 직감", desc: "전투력 +8%", icon: "compass" },
  {
    id: "engineer",
    name: "야전 정비사",
    desc: "정비 효율 +30%",
    icon: "wrench",
  },
  {
    id: "cautious",
    name: "신중한 지휘관",
    desc: "전투 인명 손실 −15%",
    icon: "shield",
  },
  {
    id: "connected",
    name: "참모부 인맥",
    desc: "보급 요청 승인 확률 +15%",
    icon: "file",
  },
];
export function random(s) {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
const pick = (s, a) => a[Math.floor(random(s) * a.length)];
const clamp = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));
export const has = (s, id) => s.officer.traits.includes(id);
export const branch = (s) => BRANCHES[s.officer.branch];
export const dateLabel = (s) => `${s.year}년 ${s.month}월`;
export function draft(seed = Date.now() >>> 0) {
  const s = { seed };
  const b = pick(s, Object.keys(BRANCHES));
  const a = pick(s, TRAITS),
    c = pick(
      s,
      TRAITS.filter((t) => t.id !== a.id),
    );
  return { seed: s.seed, branch: b, traits: [a.id, c.id] };
}
export function log(s, title, body, type = "report") {
  s.logs.unshift({ id: ++s.logId, date: dateLabel(s), title, body, type });
  s.logs = s.logs.slice(0, 200);
}
export function createGame({
  name = "에리히 베버",
  face = 0,
  start = 1939,
  record = draft(),
} = {}) {
  const b = BRANCHES[record.branch];
  const s = {
    version: VERSION,
    seed: record.seed >>> 0,
    year: start === 1936 ? 1936 : 1939,
    month: start === 1936 ? 1 : 8,
    officer: {
      name: String(name).trim().slice(0, 24) || "에리히 베버",
      face: clamp(Number(face) || 0, 0, 5),
      branch: record.branch,
      traits: [...record.traits],
      rank: "소령",
      tactics: 68,
      leadership: 64,
      logistics: 60,
    },
    men: b.men,
    maxMen: b.men,
    gear: b.gear,
    morale: 76,
    readiness: 64,
    supply: 78,
    fuel: 72,
    budget: 140,
    reputation: 50,
    experience: 0,
    ap: 3,
    organization: b.org.map((name, i) => ({
      id: i,
      name: `제${i + 1}${name}`,
      role: i === 2 ? "reserve" : "line",
    })),
    support: "medical",
    requests: [],
    logs: [],
    logId: 0,
    battles: 0,
    victories: 0,
    casualties: 0,
    front: "독일 본토",
    location: "주둔지",
    campaigns: [],
    battle: null,
    event: null,
    ended: false,
    lastBattle: -99,
    tick: 0,
  };
  s.unit = `${pick(s, ["I", "II"])}. 대대`;
  s.parent = pick(s, b.units);
  s.location = pick(s, ["에르푸르트", "하노버", "브레슬라우", "포츠담"]);
  log(
    s,
    "대대장 취임",
    `${s.officer.name} ${s.officer.rank}. ${s.parent} 예하 ${s.unit}의 지휘권을 인수했다. 병력 ${s.men}명.`,
    "personnel",
  );
  s.event = {
    id: "arrival",
    title: "첫 지휘 방침",
    tag: "인사 명령",
    body: "새 대대장이 도착했다. 부관이 첫 월간 계획을 기다린다. 아직 서로를 모르는 병사들과 당신 앞에는 긴 시간이 놓여 있다.",
    choices: [
      {
        title: "병사들과 시간을 보낸다",
        hint: "사기 +10 · 준비도 +3",
        effects: { morale: 10, readiness: 3 },
      },
      {
        title: "야전 훈련을 시작한다",
        hint: "준비도 +12 · 보급 −8",
        effects: { readiness: 12, supply: -8 },
      },
      {
        title: "보급 체계를 점검한다",
        hint: "보급 +12 · 정비도 +5",
        effects: { supply: 12, gear: Math.ceil(b.maxGear * 0.05) },
      },
    ],
  };
  return s;
}
function normalize(s) {
  s.men = clamp(Math.round(s.men), 0, s.maxMen);
  s.gear = clamp(Math.round(s.gear), 0, branch(s).maxGear);
  for (const k of ["morale", "readiness", "supply", "fuel", "reputation"])
    s[k] = Math.round(clamp(s[k]));
  s.budget = Math.max(0, Math.round(s.budget));
  s.experience = Math.max(0, Math.round(s.experience));
}
export function combatPower(s, stance = "balanced") {
  let p =
    ((s.men / s.maxMen) * 0.38 +
      (s.gear / branch(s).maxGear) * 0.22 +
      (s.readiness / 100) * 0.2 +
      (s.morale / 100) * 0.2) *
    100;
  if (s.officer.branch === "armor") p *= s.fuel < 20 ? 0.68 : 1.12;
  if (s.officer.branch === "cavalry") p *= 1.04;
  if (s.officer.branch === "infantry" && stance === "defend") p *= 1.12;
  if (has(s, "tactician")) p *= 1.08;
  p *= 1 + s.experience / 1000;
  if (s.supply < 20) p *= 0.72;
  p *= 1 + s.organization.filter((x) => x.role === "assault").length * 0.045;
  p *= 1 - s.organization.filter((x) => x.role === "reserve").length * 0.03;
  if (s.support === "artillery") p *= 1.08;
  return Math.round(p);
}
function apply(s, e) {
  for (const [k, v] of Object.entries(e || {})) s[k] += v;
  normalize(s);
}
export function resolveEvent(s, index) {
  if (!s.event || s.ended)
    return { ok: false, message: "처리할 사건이 없습니다." };
  const e = s.event,
    c = e.choices[index];
  if (!c) return { ok: false, message: "선택지를 확인하세요." };
  if ((c.effects?.budget || 0) + s.budget < 0)
    return { ok: false, message: "선택에 필요한 예산이 부족합니다." };
  apply(s, c.effects);
  if (c.special === "spain") {
    s.experience += 18;
    s.men -= 18;
    s.casualties += 18;
    log(
      s,
      "스페인 파견대 귀환",
      "훈련교관과 연락장교 파견을 마쳤다. 전술 경험을 얻었으나 파견 인원 18명이 복귀하지 못했다.",
      "campaign",
    );
    s.campaigns.push("스페인 파견");
  }
  log(s, e.title, `${c.title}. ${c.hint}`, "event");
  s.event = null;
  normalize(s);
  return { ok: true, message: "지휘 방침을 전달했습니다." };
}
export const ACTIONS = {
  train: {
    name: "야전 훈련",
    cost: 12,
    hint: "준비도 +12 · 경험 +3 · 보급 −8",
  },
  rest: { name: "휴식과 재편", cost: 6, hint: "사기 +12 · 준비도 +4" },
  repair: { name: "집중 정비", cost: 18, hint: "장비 정비 · 준비도 +5" },
  recruit: {
    name: "보충병 요청",
    cost: 24,
    hint: "정원 내 병력 최대 60명 · 사기 −2",
  },
};
export function action(s, id) {
  const a = ACTIONS[id];
  if (!a) return { ok: false, message: "알 수 없는 명령입니다." };
  if (s.ended) return { ok: false, message: "복무 기록이 종료되었습니다." };
  if (s.ap < 1)
    return { ok: false, message: "이번 달 지휘 기회를 모두 사용했습니다." };
  if (s.budget < a.cost)
    return { ok: false, message: "배정 예산이 부족합니다." };
  if (id === "recruit" && s.men === s.maxMen)
    return { ok: false, message: "이미 병력 정원을 충족했습니다." };
  if (id === "repair" && s.gear === branch(s).maxGear)
    return { ok: false, message: "장비가 모두 가동 중입니다." };
  s.ap--;
  s.budget -= a.cost;
  if (id === "train")
    apply(s, { readiness: 12, experience: 3, supply: -8, morale: -2 });
  if (id === "rest")
    apply(s, { morale: has(s, "inspiring") ? 17 : 12, readiness: 4 });
  if (id === "repair")
    apply(s, {
      gear: Math.ceil(branch(s).maxGear * (has(s, "engineer") ? 0.18 : 0.14)),
      readiness: 5,
    });
  if (id === "recruit")
    apply(s, { men: Math.min(60, s.maxMen - s.men), morale: -2 });
  log(s, a.name, a.hint, "order");
  return { ok: true, message: `${a.name} 명령을 내렸습니다.` };
}
export const EQUIPMENT = [
  {
    id: "supply",
    name: "보급품 수송대",
    desc: "식량 · 탄약 · 의약품",
    amount: 28,
    cost: 22,
    year: 1936,
  },
  {
    id: "fuel",
    name: "연료 보급",
    desc: "차량과 전차용 연료",
    amount: 32,
    cost: 24,
    year: 1936,
  },
  {
    id: "gear",
    name: "장비 보충",
    desc: "병과별 장비 정원 보충",
    amount: 0,
    cost: 38,
    year: 1936,
  },
  {
    id: "upgrade",
    name: "개량 장비 우선 배정",
    desc: "장비 보충 · 준비도 +10",
    amount: 0,
    cost: 62,
    year: 1941,
  },
];
export function request(s, id) {
  const e = EQUIPMENT.find((x) => x.id === id);
  if (!e) return { ok: false, message: "장비 요청을 확인하세요." };
  if (s.ended || s.ap < 1)
    return { ok: false, message: "남은 지휘 기회가 없습니다." };
  if (s.year < e.year)
    return { ok: false, message: `${e.year}년부터 요청할 수 있습니다.` };
  if (s.requests.some((x) => x.id === id))
    return { ok: false, message: "같은 요청이 이미 심사 중입니다." };
  if (s.budget < e.cost)
    return { ok: false, message: "배정 예산이 부족합니다." };
  s.budget -= e.cost;
  s.ap--;
  s.requests.push({ id, due: s.tick + 1, name: e.name, cost: e.cost });
  log(
    s,
    "보급 요청 제출",
    `${e.name}. 다음 턴에 승인 여부가 통보된다.`,
    "supply",
  );
  return {
    ok: true,
    message: "요청서를 제출했습니다. 다음 턴에 결과가 도착합니다.",
  };
}
export function changeRole(s, id, role) {
  if (!["line", "assault", "reserve"].includes(role))
    return { ok: false, message: "편제를 확인하세요." };
  if (s.ended || s.ap < 1)
    return { ok: false, message: "남은 지휘 기회가 없습니다." };
  const c = s.organization.find((x) => x.id === id);
  if (!c || c.role === role)
    return { ok: false, message: "현재 적용된 편제입니다." };
  c.role = role;
  s.ap--;
  log(s, "중대 임무 변경", `${c.name} → ${ROLE_NAMES[role]}.`, "order");
  return { ok: true, message: "중대 임무를 변경했습니다." };
}
export const ROLE_NAMES = {
  line: "전선 유지",
  assault: "돌격 편성",
  reserve: "대대 예비",
};
export function changeSupport(s, id) {
  if (!["medical", "artillery", "engineer"].includes(id) || s.support === id)
    return { ok: false, message: "현재 적용된 지원 편제입니다." };
  if (s.ended || s.ap < 1 || s.budget < 20)
    return { ok: false, message: "지휘 기회 1과 예산 20이 필요합니다." };
  s.support = id;
  s.ap--;
  s.budget -= 20;
  log(
    s,
    "지원 소대 개편",
    {
      medical: "의무 소대 증강. 전투 인명 손실 감소.",
      artillery: "화기 지원 소대. 전투력 증가.",
      engineer: "공병 지원 소대. 방어 손실 감소.",
    }[id],
    "order",
  );
  return { ok: true, message: "지원 소대를 개편했습니다." };
}
const EVENTS = [
  {
    id: "supply_shortage",
    title: "예정에 없던 보급 지연",
    tag: "보급 보고",
    body: "철도 수송이 지연되었다. 다음 보급 열차까지 남은 물자를 나눠 써야 한다. 보급관은 인근 창고에서 긴급 조달할 수 있다고 보고한다.",
    choices: [
      {
        title: "예산으로 긴급 물자를 구한다",
        hint: "예산 −18 · 보급 +15",
        effects: { budget: -18, supply: 15 },
      },
      {
        title: "배급을 줄여 버틴다",
        hint: "보급 +5 · 사기 −8",
        effects: { supply: 5, morale: -8 },
      },
    ],
  },
  {
    id: "veterans",
    title: "숙련 부사관의 제안",
    tag: "부대 사건",
    body: "고참 부사관들이 신병을 따로 교육하겠다고 한다. 훈련 시간을 확보하면 적응이 빨라지지만 휴식 일정은 밀린다.",
    choices: [
      {
        title: "부사관에게 교육을 맡긴다",
        hint: "준비도 +9 · 경험 +5 · 사기 −3",
        effects: { readiness: 9, experience: 5, morale: -3 },
      },
      {
        title: "충분한 휴식부터 보장한다",
        hint: "사기 +8",
        effects: { morale: 8 },
      },
    ],
  },
  {
    id: "inspection",
    title: "상급부대의 불시 검열",
    tag: "참모부 연락",
    body: "연대 참모가 훈련 상태와 장비 대장을 확인하러 왔다. 부관은 보고서의 미비점을 솔직히 적을지 묻는다.",
    choices: [
      {
        title: "현황과 부족분을 정확히 보고한다",
        hint: "평가 +5 · 예산 +12",
        effects: { reputation: 5, budget: 12 },
      },
      {
        title: "정비 인력을 동원해 대비한다",
        hint: "장비 회복 · 보급 −8",
        effects: { gear: 5, supply: -8 },
      },
    ],
  },
  {
    id: "letter",
    title: "고향에서 온 우편 행낭",
    tag: "부대 사건",
    body: "오래 기다리던 우편이 도착했다. 조용히 편지를 읽는 병사들 사이로 잠깐이나마 일상의 기척이 돌아온다.",
    choices: [
      {
        title: "오후 일정을 비워 준다",
        hint: "사기 +14 · 준비도 −3",
        effects: { morale: 14, readiness: -3 },
      },
      {
        title: "일과 후 편지를 나눠 준다",
        hint: "사기 +6 · 준비도 +3",
        effects: { morale: 6, readiness: 3 },
      },
    ],
  },
  {
    id: "civilians",
    title: "길 위의 민간인들",
    tag: "현장 보고",
    war: true,
    body: "피란민 행렬이 대대의 이동로와 겹쳤다. 의무관이 부상자와 아이들에게 물과 응급 처치를 제공할 수 있도록 시간을 요청한다.",
    choices: [
      {
        title: "통로를 확보하고 의무품을 나눈다",
        hint: "보급 −12 · 사기 +8 · 평가 −3",
        effects: { supply: -12, morale: 8, reputation: -3 },
      },
      {
        title: "의무병을 남겨 돕고 우회한다",
        hint: "연료 −10 · 사기 +5",
        effects: { fuel: -10, morale: 5 },
      },
    ],
  },
  {
    id: "breakdown",
    title: "밤사이 발생한 장비 고장",
    tag: "정비 보고",
    body: "장비 일부가 작동을 멈췄다. 정비반은 부품을 교체할지, 다른 차량의 부품을 전용할지 결정을 기다린다.",
    choices: [
      {
        title: "예비 부품을 구매한다",
        hint: "예산 −15 · 준비도 +6",
        effects: { budget: -15, readiness: 6 },
      },
      {
        title: "부품을 전용해 운용을 유지한다",
        hint: "장비 −3 · 준비도 +4",
        effects: { gear: -3, readiness: 4 },
      },
    ],
  },
  {
    id: "recon",
    title: "정찰대가 가져온 정보",
    tag: "정보 보고",
    war: true,
    body: "전방 도로에 대한 새로운 정찰 보고가 도착했다. 부관은 다음 작전을 위해 추가 확인을 제안한다.",
    choices: [
      {
        title: "추가 정찰을 실시한다",
        hint: "연료 −8 · 준비도 +10",
        effects: { fuel: -8, readiness: 10 },
      },
      {
        title: "현재 정보로 작전을 준비한다",
        hint: "경험 +4 · 보급 +4",
        effects: { experience: 4, supply: 4 },
      },
    ],
  },
  {
    id: "winter",
    title: "겨울을 앞둔 보급 점검",
    tag: "계절 사건",
    body: "기온이 떨어지고 있다. 피복과 동계 정비 물자를 먼저 확보해야 하지만 이번 달 예산에는 여유가 많지 않다.",
    choices: [
      {
        title: "동계 장비를 우선 확보한다",
        hint: "예산 −20 · 사기 +10 · 준비도 +8",
        effects: { budget: -20, morale: 10, readiness: 8 },
      },
      {
        title: "보유 물자를 재분배한다",
        hint: "보급 −10 · 사기 +4",
        effects: { supply: -10, morale: 4 },
      },
    ],
  },
  {
    id: "medic",
    title: "야전병원의 복귀 명단",
    tag: "인사 보고",
    war: true,
    body: "회복한 병사들이 복귀를 기다린다. 의무관은 며칠 더 쉬게 하는 편이 좋겠다고 말한다.",
    choices: [
      {
        title: "충분히 회복한 뒤 복귀시킨다",
        hint: "병력 +18 · 사기 +7",
        effects: { men: 18, morale: 7 },
      },
      {
        title: "당장 전투 편제로 복귀시킨다",
        hint: "병력 +30 · 사기 −4",
        effects: { men: 30, morale: -4 },
      },
    ],
  },
  {
    id: "training",
    title: "합동 훈련 참가 요청",
    tag: "작전 명령",
    body: "인근 부대와의 합동 훈련에 참가하라는 연락이다. 실전적인 훈련이지만 장비와 연료를 소모한다.",
    choices: [
      {
        title: "대대 전체로 참가한다",
        hint: "경험 +8 · 준비도 +8 · 연료 −12",
        effects: { experience: 8, readiness: 8, fuel: -12 },
      },
      {
        title: "참모와 중대장만 참관한다",
        hint: "경험 +3 · 평가 +2",
        effects: { experience: 3, reputation: 2 },
      },
    ],
  },
];
function assignFront(s) {
  let next, loc;
  if (s.year < 1939 || (s.year === 1939 && s.month < 9)) {
    next = "독일 본토";
    loc = "훈련 및 재편";
  } else if (s.year === 1939) {
    next = s.month <= 10 ? "폴란드 전선" : "서부 집결지";
    loc = s.month <= 10 ? "폴란드 중부" : "라인란트";
  } else if (s.year === 1940) {
    next = s.month >= 5 && s.month <= 6 ? "프랑스 전선" : "서부 주둔지";
    loc = s.month >= 5 && s.month <= 6 ? "프랑스 북부" : "프랑스 점령지";
  } else if (s.year === 1941 && s.month < 4) {
    next = "서부 주둔지";
    loc = "부대 재편 지역";
  } else if (s.year <= 1943) {
    if (!s.theatreYear || s.theatreYear !== s.year) {
      s.theatreYear = s.year;
      s.theatre =
        s.officer.branch !== "cavalry" && random(s) < 0.34
          ? "북아프리카 전선"
          : "동부 전선";
      if (s.year === 1943 && s.theatre === "북아프리카 전선" && s.month > 5)
        s.theatre = "이탈리아 전선";
    }
    if (s.theatre === "북아프리카 전선" && s.year === 1943 && s.month > 5)
      s.theatre = "이탈리아 전선";
    next =
      s.theatre === "동부 전선" && s.year === 1941 && s.month < 6
        ? "동부 집결지"
        : s.theatre;
    loc =
      next === "북아프리카 전선"
        ? "리비아 · 튀니지"
        : next === "이탈리아 전선"
          ? "이탈리아 남부"
          : s.year === 1941
            ? "소련 서부"
            : s.year === 1942
              ? "동부 전역"
              : "동부 방어 구역";
  } else if (s.year === 1944) {
    if (s.theatreYear !== 1944) {
      s.theatreYear = 1944;
      s.theatre = random(s) < 0.5 ? "서부 전선" : "동부 전선";
    }
    next = s.theatre === "서부 전선" && s.month < 6 ? "서부 예비대" : s.theatre;
    loc =
      next === "동부 전선"
        ? "동부 방어 구역"
        : s.month < 8
          ? "프랑스 북부"
          : "서부 국경";
  } else {
    next = "독일 본토 방어";
    loc = "독일 중부";
  }
  if (s.front !== next) {
    s.front = next;
    s.location = loc;
    log(
      s,
      "전선 배속 명령",
      `${next} · ${loc}. 상급부대의 작전 지휘에 따른 임시 배속이다.`,
      "campaign",
    );
    if (next.includes("전선") || next.includes("방어")) {
      if (!s.campaigns.includes(next)) s.campaigns.push(next);
    }
  } else s.location = loc;
}
function inWar(s) {
  return (
    s.year >= 1939 &&
    !(s.year === 1939 && s.month < 9) &&
    !["서부 집결지", "서부 주둔지", "서부 예비대", "동부 집결지"].includes(
      s.front,
    )
  );
}
function makeBattle(s) {
  const defense = s.year >= 1943;
  const titles =
    s.front === "폴란드 전선"
      ? ["전방 도로 확보", "도하 지점 확보"]
      : s.front === "프랑스 전선"
        ? ["아르덴 통과 지원", "전방 교량 확보"]
        : s.front === "북아프리카 전선"
          ? ["사막 보급로 확보", "외곽 진지 공방"]
          : s.front === "이탈리아 전선"
            ? ["산악 도로 방어", "능선 진지 방어"]
            : s.front === "동부 전선"
              ? s.year < 1943
                ? ["전방 마을 공방", "측면 돌파 지원", "하천 도하 작전"]
                : ["돌출부 방어", "전선 철수 엄호"]
              : ["후퇴로 확보", "지연 방어 작전"];
  let title = pick(s, titles);
  if (s.front === "동부 전선" && s.year === 1941 && s.month >= 10)
    title = "모스크바 접근로 공방";
  if (s.front === "동부 전선" && s.year === 1942 && s.month >= 8)
    title = "남부 전역 · 스탈린그라드 방면";
  if (
    s.front === "동부 전선" &&
    s.year === 1943 &&
    s.month >= 7 &&
    s.month <= 8
  )
    title = "쿠르스크 전역 · 측면 방어";
  if (s.front === "북아프리카 전선" && s.year === 1942 && s.month >= 7)
    title = "엘알라메인 방면 공방";
  if (
    s.front === "서부 전선" &&
    s.year === 1944 &&
    s.month >= 6 &&
    s.month <= 8
  )
    title = "노르망디 전역 · 방어 임무";
  return {
    title,
    enemy: Math.round(48 + random(s) * 23 + (s.year - 1939) * 2),
    defense,
    terrain: pick(
      s,
      s.front === "북아프리카 전선"
        ? ["개활지", "사막"]
        : s.front === "이탈리아 전선"
          ? ["산악", "시가지"]
          : ["삼림", "시가지", "하천"],
    ),
    weather:
      s.month >= 11 || s.month <= 2
        ? s.front === "북아프리카 전선"
          ? "서늘함"
          : "혹한"
        : pick(s, ["맑음", "비", "흐림"]),
    brief: defense
      ? "상급부대가 방어 구역을 지정했다. 진지를 유지하거나, 병력을 보존하며 질서 있게 이탈할 수 있다."
      : "상급부대가 전방 목표의 확보를 명령했다. 준비 상태와 보급을 확인하고 대대의 전술을 결정하라.",
  };
}
export function advance(s) {
  if (s.ended) return { ok: false, message: "복무 기록이 종료되었습니다." };
  if (s.event || s.battle)
    return {
      ok: false,
      message: "대기 중인 사건 또는 작전을 먼저 처리하세요.",
    };
  const step = s.year < 1939 ? 3 : 1;
  s.month += step;
  s.tick++;
  while (s.month > 12) {
    s.year++;
    s.month -= 12;
  }
  if (s.year > 1945 || (s.year === 1945 && s.month >= 5)) {
    s.year = 1945;
    s.month = 5;
    s.ended = true;
    log(
      s,
      "전쟁의 끝",
      "1945년 5월. 독일의 항복으로 군 복무 기록이 끝났다. 살아남은 병사들과 이제 돌아갈 길을 찾아야 한다.",
      "ending",
    );
    return { ok: true, message: "1945년 5월, 복무 기록이 끝났습니다." };
  }
  s.ap = 3;
  apply(s, {
    budget: 36 + Math.round(s.reputation * 0.12),
    supply: has(s, "quartermaster") ? 10 : 4,
    fuel: 5,
    morale: -1,
    readiness: -3,
  });
  for (const r of s.requests.filter((r) => r.due <= s.tick)) {
    const approved =
      random(s) <
      Math.min(
        0.95,
        0.58 + s.reputation / 250 + (has(s, "connected") ? 0.15 : 0),
      );
    if (approved) {
      const e = EQUIPMENT.find((x) => x.id === r.id);
      if (r.id === "gear" || r.id === "upgrade")
        apply(s, {
          gear: Math.ceil(branch(s).maxGear * 0.22),
          ...(r.id === "upgrade" ? { readiness: 10 } : {}),
        });
      else apply(s, { [r.id]: e.amount });
      log(s, "보급 요청 승인", `${r.name}이 도착했다.`, "supply");
    } else {
      apply(s, { budget: Math.round(r.cost * 0.6) });
      log(
        s,
        "보급 요청 반려",
        `${r.name}. 수송 여력 부족. 예산의 60%가 반환되었다.`,
        "supply",
      );
    }
  }
  s.requests = s.requests.filter((r) => r.due > s.tick);
  assignFront(s);
  const war = inWar(s);
  if (war && s.tick - s.lastBattle >= 2) {
    s.battle = makeBattle(s);
    s.lastBattle = s.tick;
    log(
      s,
      "새 작전 명령",
      `${s.battle.title}. ${s.front} / ${s.battle.terrain}.`,
      "battle",
    );
  }
  if (!s.battle) {
    if (s.year === 1936 && s.month >= 7 && !s.spainOffered) {
      s.spainOffered = true;
      s.event = {
        id: "spain",
        title: "스페인 파견 명단",
        tag: "특별 파견",
        body: "스페인 내전에 파견할 훈련교관과 연락장교 선발 명단에 대대 인원이 올랐다. 대대 전체의 전투 파견이 아닌, 소규모 차출이다.",
        choices: [
          {
            title: "숙련 인원으로 파견대를 편성한다",
            hint: "경험 +18 · 병력 −18 · 평가 +8",
            effects: { reputation: 8 },
            special: "spain",
          },
          {
            title: "본토 훈련 임무의 필요성을 소명한다",
            hint: "준비도 +5 · 평가 −6",
            effects: { readiness: 5, reputation: -6 },
          },
        ],
      };
    } else if (random(s) < 0.7) {
      const available = EVENTS.filter(
        (e) =>
          (!e.war || war) &&
          (e.id !== "winter" || s.month >= 10 || s.month <= 2) &&
          e.id !== s.lastEvent,
      );
      s.event = structuredClone(pick(s, available));
      s.lastEvent = s.event.id;
    }
  }
  if (s.reputation >= 75 && s.experience >= 50 && s.officer.rank === "소령") {
    s.officer.rank = "중령";
    log(
      s,
      "진급 명령",
      "중령으로 진급했다. 대대 지휘 임무는 계속된다.",
      "personnel",
    );
  }
  normalize(s);
  return { ok: true, message: `${dateLabel(s)}. 새 보고가 도착했습니다.` };
}
export const STANCES = {
  balanced: {
    name: "신중한 전진",
    desc: "균형 잡힌 전투 · 보급 12 · 연료 8",
    power: 1,
    loss: 0.08,
    supply: 12,
    fuel: 8,
  },
  assault: {
    name: "집중 돌파",
    desc: "전투력 +20% · 손실 증가 · 보급 20 · 연료 16",
    power: 1.2,
    loss: 0.13,
    supply: 20,
    fuel: 16,
  },
  defend: {
    name: "방어 후 대응",
    desc: "전투력 −5% · 손실 감소 · 보급 8 · 연료 4",
    power: 0.95,
    loss: 0.05,
    supply: 8,
    fuel: 4,
  },
  withdraw: {
    name: "질서 있는 철수",
    desc: "병력을 보존 · 평가 −8 · 보급 5 · 연료 4",
    power: 0,
    loss: 0.018,
    supply: 5,
    fuel: 4,
  },
};
export function battleOdds(s, stance) {
  if (!s.battle || !STANCES[stance]) return 0;
  const a = STANCES[stance];
  return Math.round(
    clamp(
      50 + (combatPower(s, stance) * a.power - s.battle.enemy) * 1.25,
      12,
      92,
    ),
  );
}
export function fight(s, stance) {
  if (!s.battle || s.ended || !STANCES[stance])
    return { ok: false, message: "진행할 작전을 확인하세요." };
  const a = STANCES[stance],
    b = s.battle;
  const chance = battleOdds(s, stance),
    roll = random(s) * 100,
    win = stance !== "withdraw" && roll < chance;
  let loss = Math.round(
    s.men *
      a.loss *
      (0.65 + random(s) * 0.7) *
      (win ? 0.8 : 1.3) *
      (has(s, "cautious") ? 0.85 : 1) *
      (s.support === "medical" ? 0.8 : 1) *
      (s.support === "engineer" && stance === "defend" ? 0.75 : 1) *
      (1 - s.organization.filter((x) => x.role === "reserve").length * 0.06),
  );
  loss = Math.max(1, Math.min(s.men, loss));
  const gearLoss = Math.round(
    s.gear * a.loss * (stance === "withdraw" ? 0.5 : 0.9),
  );
  apply(s, {
    men: -loss,
    gear: -gearLoss,
    supply: -a.supply,
    fuel: -a.fuel,
    morale: win ? 7 : stance === "withdraw" ? -3 : -8,
    reputation: win ? 7 : stance === "withdraw" ? -8 : -5,
    experience: win ? 9 : 4,
    readiness: -8,
  });
  s.battles++;
  if (win) s.victories++;
  s.casualties += loss;
  const result =
    stance === "withdraw" ? "철수 완료" : win ? "목표 확보" : "목표 미달성";
  log(
    s,
    `${b.title} · ${result}`,
    `${a.name}. 인명 손실 ${loss}명 · ${branch(s).gearName} 손실 ${gearLoss}. ${win ? "대대가 지정 목표를 확보했다." : stance === "withdraw" ? "대열을 유지하며 이탈했다." : "생존 병력을 수습하고 재편에 들어간다."}`,
    "battle",
  );
  s.lastResult = { title: b.title, result, win, loss, gearLoss, chance };
  s.battle = null;
  if (s.men < s.maxMen * 0.12) {
    s.ended = true;
    log(
      s,
      "대대 전투력 상실",
      "잔존 인원이 타 부대로 편입되었다. 대대 지휘 기록이 종료된다.",
      "ending",
    );
  }
  return {
    ok: true,
    message: `${result}. 병력 손실 ${loss}명.`,
    result: s.lastResult,
  };
}
export function isValidSave(s) {
  if (
    !s ||
    s.version !== VERSION ||
    !s.officer ||
    !BRANCHES[s.officer.branch] ||
    typeof s.officer.name !== "string" ||
    s.officer.name.length > 24
  )
    return false;
  const plain = (v, max = 2000) =>
    typeof v === "string" && v.length <= max && !/[<>]/.test(v);
  if (
    !Number.isInteger(s.officer.face) ||
    s.officer.face < 0 ||
    s.officer.face > 5 ||
    !["소령", "중령"].includes(s.officer.rank)
  )
    return false;
  if (
    !Array.isArray(s.officer.traits) ||
    s.officer.traits.length !== 2 ||
    new Set(s.officer.traits).size !== 2 ||
    s.officer.traits.some((t) => !TRAITS.some((a) => a.id === t))
  )
    return false;
  if (
    !Array.isArray(s.logs) ||
    !Array.isArray(s.requests) ||
    !Array.isArray(s.organization) ||
    !Array.isArray(s.campaigns)
  )
    return false;
  if (
    !["medical", "artillery", "engineer"].includes(s.support) ||
    typeof s.ended !== "boolean"
  )
    return false;
  if (
    !plain(s.unit, 30) ||
    !plain(s.parent, 100) ||
    !plain(s.front, 100) ||
    !plain(s.location, 100)
  )
    return false;
  if (
    s.organization.length !== 3 ||
    s.organization.some(
      (c, i) =>
        !c ||
        c.id !== i ||
        !plain(c.name, 40) ||
        !Object.hasOwn(ROLE_NAMES, c.role),
    )
  )
    return false;
  if (
    s.requests.length > 4 ||
    s.requests.some(
      (r) =>
        !r ||
        !EQUIPMENT.some(
          (e) => e.id === r.id && e.name === r.name && e.cost === r.cost,
        ) ||
        !Number.isInteger(r.due),
    )
  )
    return false;
  if (
    s.logs.length > 200 ||
    s.logs.some(
      (e) =>
        !e ||
        !Number.isInteger(e.id) ||
        !plain(e.date, 40) ||
        typeof e.title !== "string" ||
        e.title.length > 300 ||
        typeof e.body !== "string" ||
        e.body.length > 3000 ||
        !plain(e.type, 30),
    )
  )
    return false;
  if (s.campaigns.length > 20 || s.campaigns.some((c) => !plain(c, 100)))
    return false;
  if (s.event) {
    const e = s.event,
      fields = [
        "men",
        "gear",
        "morale",
        "readiness",
        "supply",
        "fuel",
        "budget",
        "reputation",
        "experience",
      ];
    if (
      !plain(e.id, 50) ||
      !plain(e.title, 200) ||
      !plain(e.tag, 100) ||
      !plain(e.body) ||
      !Array.isArray(e.choices) ||
      e.choices.length < 1 ||
      e.choices.length > 4
    )
      return false;
    if (
      e.choices.some(
        (c) =>
          !c ||
          !plain(c.title, 200) ||
          !plain(c.hint, 300) ||
          !c.effects ||
          typeof c.effects !== "object" ||
          Object.entries(c.effects).some(
            ([k, v]) =>
              !fields.includes(k) || !Number.isFinite(v) || Math.abs(v) > 1000,
          ) ||
          (c.special !== undefined && c.special !== "spain"),
      )
    )
      return false;
  }
  if (
    s.battle &&
    (!plain(s.battle.title, 200) ||
      !plain(s.battle.brief) ||
      !plain(s.battle.terrain, 50) ||
      !plain(s.battle.weather, 50) ||
      !Number.isFinite(s.battle.enemy) ||
      s.battle.enemy < 1)
  )
    return false;
  if (
    s.lastResult &&
    (!plain(s.lastResult.title, 200) ||
      !plain(s.lastResult.result, 100) ||
      !Number.isFinite(s.lastResult.loss) ||
      !Number.isFinite(s.lastResult.gearLoss))
  )
    return false;
  for (const k of [
    "seed",
    "year",
    "month",
    "men",
    "maxMen",
    "gear",
    "morale",
    "readiness",
    "supply",
    "fuel",
    "budget",
    "reputation",
    "experience",
    "ap",
    "tick",
    "logId",
    "battles",
    "victories",
    "casualties",
  ])
    if (!Number.isFinite(s[k])) return false;
  return (
    s.year >= 1936 &&
    s.year <= 1945 &&
    s.month >= 1 &&
    s.month <= 12 &&
    s.men >= 0 &&
    s.men <= s.maxMen &&
    s.maxMen === BRANCHES[s.officer.branch].men &&
    s.ap >= 0 &&
    s.ap <= 3
  );
}
