// Персонажи платформы: Шефи (VILKA) и Зёрнышко (GRANO).
// Единый утверждённый дизайн + библиотека эмоций. Нарисованы SVG, анимируются GSAP.

export const MOODS = {
  calm:    { name: 'Спокойствие',            eyes: 'open', mouth: 'smile', brows: 'up',   arms: [8, -8],     prop: '' },
  joy:     { name: 'Радость и восторг',      eyes: 'open', mouth: 'laugh', brows: 'high', arms: [55, -55],   prop: 'spark' },
  wow:     { name: 'Удивление',              eyes: 'wide', mouth: 'o',     brows: 'high', arms: [80, -80],   prop: 'spark' },
  doubt:   { name: 'Сомнение',               eyes: 'side', mouth: 'doubt', brows: 'tilt', arms: [30, -30],   prop: 'q' },
  focus:   { name: 'Сосредоточенность',      eyes: 'half', mouth: 'focus', brows: 'down', arms: [0, 0],      prop: '' },
  praise:  { name: 'Поддержка и похвала',    eyes: 'joy',  mouth: 'smile', brows: 'up',   arms: [8, -135],   prop: 'heart' },
  wrong:   { name: 'Неправильный ответ',     eyes: 'sad',  mouth: 'sad',   brows: 'sad',  arms: [-6, 6],     prop: 'drop' },
  victory: { name: 'Победа и празднование',  eyes: 'joy',  mouth: 'laugh', brows: 'high', arms: [155, -155], prop: 'stars' },
  hint:    { name: 'Подсказка и объяснение', eyes: 'open', mouth: 'smile', brows: 'up',   arms: [8, -165],   prop: 'bulb' },
  invite:  { name: 'Приглашение к заданию',  eyes: 'open', mouth: 'smile', brows: 'up',   arms: [8, -120],   prop: '' },
};
const LEGACY = { happy: 'calm', grin: 'joy', think: 'doubt', sad: 'wrong', party: 'victory', yes: 'praise', no: 'wrong', wave: 'invite' };

export const CAST = {
  shefi: { name: 'Шефи', concept: 'vilka · grano', about: 'Азартный поварёнок и гастрономический эксперт — наставник команды VILKA и GRANO. Отвечает за блюда, меню, продукты и кулинарные знания.' },
};
export const whoFor = () => 'shefi';

/* ---------- shared face parts (positions passed per character) ---------- */
function eyesSVG(L, R, s) {
  // s: {r: sclera radius, iris, rim}
  const eye = (c, cls) => `<g class="ce-eye ${cls}">
    ${s.rim ? `<ellipse cx="${c[0]}" cy="${c[1]}" rx="${s.r + 2.5}" ry="${s.r * 1.12 + 2.5}" fill="${s.rim}"/>` : ''}
    <ellipse class="ce-scl" cx="${c[0]}" cy="${c[1]}" rx="${s.r}" ry="${s.r * 1.12}" fill="#fff"/>
    <g class="ce-pup"><circle cx="${c[0]}" cy="${c[1] + 1}" r="${s.iris}" fill="${s.irisC}"/><circle cx="${c[0]}" cy="${c[1] + 1}" r="${s.iris * .5}" fill="#1a0e07"/>
    <circle cx="${c[0] + s.iris * .45}" cy="${c[1] - s.iris * .45}" r="${s.iris * .36}" fill="#fff"/><circle cx="${c[0] - s.iris * .4}" cy="${c[1] + s.iris * .45}" r="${s.iris * .15}" fill="#fff" opacity=".8"/></g>
    <path class="ce-lid" d="M${c[0] - s.r - 1} ${c[1] - 1}a${s.r + 1} ${s.r * 1.12 + 1} 0 0 1 ${2 * s.r + 2} 0z" fill="${s.lid}" opacity="0"/>
    <path class="ce-sadlid" d="M${c[0] - s.r - 1} ${c[1] - s.r * .2}l${2 * s.r + 2} ${cls === 'L' ? -s.r * .9 : s.r * .9}V${c[1] - s.r * 1.3}H${c[0] - s.r - 1}z" fill="${s.lid}" opacity="0"/>
  </g>`;
  const joy = (c) => `<path d="M${c[0] - s.r * .8} ${c[1] + 2}q${s.r * .8} ${-s.r * 1.2} ${s.r * 1.6} 0" stroke="#2a160a" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
  return `<g class="ce-eyes">${eye(L, 'L')}${eye(R, 'R')}</g><g class="ce-joy" style="display:none">${joy(L)}${joy(R)}</g>`;
}
function browsSVG(L, R, w, col) {
  return `<g class="ce-brows" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none"><path class="ce-bL" data-x="${L[0]}" data-y="${L[1]}"/><path class="ce-bR" data-x="${R[0]}" data-y="${R[1]}"/></g>`;
}
function mouthsSVG(x, y, k = 1) {
  return `<g class="ce-mouths" transform="translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})">
    <path data-m="smile" d="M${x - 12} ${y - 2}q12 12 24 0" stroke="#2a160a" stroke-width="4" stroke-linecap="round" fill="none"/>
    <g data-m="laugh"><path d="M${x - 15} ${y - 4}h30q0 20 -15 20t-15 -20z" fill="#5a1d14"/><path d="M${x - 12} ${y - 4}h24v4q-12 3 -24 0z" fill="#fff"/><path d="M${x - 8} ${y + 11}q8 -7 16 0q-8 5 -16 0z" fill="#ff7b72"/></g>
    <ellipse data-m="o" cx="${x}" cy="${y + 3}" rx="7" ry="9" fill="#5a1d14"/>
    <path data-m="doubt" d="M${x - 11} ${y + 3}q5 -5 10 0t11 -2" stroke="#2a160a" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path data-m="sad" d="M${x - 11} ${y + 7}q11 -10 22 0" stroke="#2a160a" stroke-width="4" stroke-linecap="round" fill="none"/>
    <g data-m="focus"><path d="M${x - 8} ${y + 2}h14" stroke="#2a160a" stroke-width="4" stroke-linecap="round"/><ellipse cx="${x + 8}" cy="${y + 5}" rx="4" ry="3.5" fill="#ff7b72"/></g>
  </g>`;
}
function propsSVG(x, y) {
  return `<g class="ce-props">
    <g data-p="bulb" transform="translate(${x} ${y})"><circle r="15" fill="#ffd84a" opacity=".35"/><path d="M0 -12a10 10 0 0 1 6 18v4h-12v-4a10 10 0 0 1 6 -18z" fill="#ffe46b" stroke="#c9961c" stroke-width="2"/><rect x="-5" y="11" width="10" height="5" rx="2" fill="#8a7a6a"/><path d="M-16 -16l-5 -5M16 -16l5 -5M0 -22v-7" stroke="#ffcf3a" stroke-width="3" stroke-linecap="round"/></g>
    <g data-p="q" transform="translate(${x} ${y})"><circle r="15" fill="#fff" stroke="#e8dccc" stroke-width="2"/><text y="8" text-anchor="middle" font-family="Unbounded,Arial Black,sans-serif" font-weight="900" font-size="22" fill="#ff6a1a">?</text></g>
    <g data-p="drop" transform="translate(${x - 8} ${y + 26})"><path d="M0 -10q8 10 0 16q-8 -6 0 -16z" fill="#7cc6ff" stroke="#3b8fd0" stroke-width="1.5"/></g>
    <g data-p="heart" transform="translate(${x} ${y})"><path d="M0 8c-14-9-15-21-7-24c4-1.5 7 1 7 4c0-3 3-5.5 7-4c8 3 7 15-7 24z" fill="#ff5b6e"/></g>
    <g data-p="spark"><path transform="translate(${x} ${y})" d="M0 -12l3 9l9 3l-9 3l-3 9l-3-9l-9-3l9-3z" fill="#ffd84a"/><path transform="translate(${200 - x} ${y + 14}) scale(.7)" d="M0 -12l3 9l9 3l-9 3l-3 9l-3-9l-9-3l9-3z" fill="#ffd84a"/></g>
    <g data-p="stars">${[[x, y], [200 - x, y + 6], [x - 6, y + 46], [206 - x, y + 52]].map(([a, b], i) => `<path class="ce-st" transform="translate(${a} ${b}) scale(${i % 2 ? .8 : 1.1})" d="M0 -12l3.5 8l8.5 1l-6.5 6l2 8.5l-7.5-4.5l-7.5 4.5l2-8.5l-6.5-6l8.5-1z" fill="${i % 2 ? '#ff6a1a' : '#ffd84a'}"/>`).join('')}</g>
  </g>`;
}

/* ---------- Шефи: поварёнок VILKA ---------- */
function shefiSVG(uid) {
  const sk = `sk${uid}`, ht = `ht${uid}`, st = `st${uid}`;
  return `<svg class="ch ch-shefi" viewBox="0 0 200 240" aria-hidden="true"><defs>
    <radialGradient id="${sk}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffe2cc"/><stop offset=".65" stop-color="#f6bf9a"/><stop offset="1" stop-color="#e39a76"/></radialGradient>
    <radialGradient id="${ht}" cx="35%" cy="25%" r="80%"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#f1ede7"/><stop offset="1" stop-color="#d9d1c6"/></radialGradient>
    <pattern id="${st}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#f6efe4"/><rect y="0" width="12" height="3.2" fill="#d23a2a"/><rect y="6" width="12" height="3.2" fill="#2a3d7a"/></pattern>
  </defs>
  <ellipse class="ce-shadow" cx="100" cy="233" rx="42" ry="6" fill="rgba(0,0,0,.28)"/>
  <g class="ce-body">
    <rect x="83" y="200" width="13" height="24" rx="6" fill="#3b2f2a"/><rect x="104" y="200" width="13" height="24" rx="6" fill="#3b2f2a"/>
    <ellipse cx="88" cy="226" rx="14" ry="6.5" fill="#b4643a"/><ellipse cx="112" cy="226" rx="14" ry="6.5" fill="#b4643a"/><path d="M78 225h20M102 225h20" stroke="#f3e2d2" stroke-width="2"/>
    <g class="ce-armL" data-ox="67" data-oy="160"><path d="M67 158l-8 30" stroke="url(#${st})" stroke-width="15" stroke-linecap="round"/><path d="M60 182l-4 16" stroke="url(#${sk})" stroke-width="10" stroke-linecap="round"/><circle cx="55" cy="201" r="7.5" fill="url(#${sk})"/></g>
    <g class="ce-armR" data-ox="133" data-oy="160"><path d="M133 158l8 30" stroke="url(#${st})" stroke-width="15" stroke-linecap="round"/><path d="M140 182l4 16" stroke="url(#${sk})" stroke-width="10" stroke-linecap="round"/><circle cx="145" cy="201" r="7.5" fill="url(#${sk})"/></g>
    <path d="M64 160q36-16 72 0l4 46q-40 10 -80 0z" fill="url(#${st})"/>
    <path d="M76 170h48l4 38q-28 7 -56 0z" fill="#fff" stroke="#e3ddd4" stroke-width="2"/>
    <path d="M77 171l-5 -14M123 171l5 -14" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    <path d="M94 186l-10 10M106 186l10 10" stroke="#ece6dd" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="185" r="4" fill="#ece6dd"/>
    <path d="M90 178h20" stroke="#ff6a1a" stroke-width="2"/>
    <g class="ce-head" data-ox="100" data-oy="158">
      <circle cx="57" cy="124" r="9" fill="url(#${sk})"/><circle cx="143" cy="124" r="9" fill="url(#${sk})"/>
      <circle cx="100" cy="120" r="43" fill="url(#${sk})"/>
      <path d="M58 104q8-18 26-12q10-14 26-6q12-10 26 2q14 2 10 18q-6-8-16-6q-10-8-20-2q-12-6-22 2q-14-4-30 4z" fill="#5a3522"/>
      <path d="M60 86C38 66 50 26 80 32C86 6 118 4 124 30C154 24 164 66 140 86Z" fill="url(#${ht})"/>
      <path d="M82 36q4 24 2 48M100 22q4 30 0 62M118 34q-4 26-2 50" stroke="#e1d9ce" stroke-width="2.5" fill="none"/>
      <rect x="60" y="76" width="80" height="22" rx="7" fill="url(#${ht})" stroke="#ddd5ca" stroke-width="1.5"/>
      ${browsSVG([84, 104], [116, 104], 4.5, '#4a2c1b')}
      ${eyesSVG([84, 121], [116, 121], { r: 10, iris: 7.5, irisC: '#6b3d1f', lid: '#f2b896' })}
      <ellipse cx="72" cy="140" rx="8" ry="5" fill="#ff8a7a" opacity=".55"/><ellipse cx="128" cy="140" rx="8" ry="5" fill="#ff8a7a" opacity=".55"/>
      <ellipse cx="100" cy="134" rx="5.5" ry="4.5" fill="#e98a6e"/>
      ${mouthsSVG(100, 148)}
    </g>
    ${propsSVG(160, 44)}
  </g></svg>`;
}

/* ---------- Кандидат GRANO: девочка-повар ---------- */
function chefaSVG(uid) {
  const sk = `ask${uid}`, ht = `aht${uid}`, st = `ast${uid}`, hr = `ahr${uid}`;
  return `<svg class="ch ch-chefa" viewBox="0 0 200 240" aria-hidden="true"><defs>
    <radialGradient id="${sk}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffe6d2"/><stop offset=".65" stop-color="#f7c6a3"/><stop offset="1" stop-color="#e6a07c"/></radialGradient>
    <radialGradient id="${ht}" cx="35%" cy="25%" r="80%"><stop offset="0" stop-color="#fffdf6"/><stop offset=".7" stop-color="#f3eedf"/><stop offset="1" stop-color="#dcd3bd"/></radialGradient>
    <linearGradient id="${hr}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9a4a24"/><stop offset="1" stop-color="#6e3018"/></linearGradient>
    <pattern id="${st}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#f8f2e2"/><rect y="0" width="12" height="3.2" fill="#6f7340"/><rect y="6" width="12" height="3.2" fill="#d99a1e"/></pattern>
  </defs>
  <ellipse class="ce-shadow" cx="100" cy="233" rx="40" ry="6" fill="rgba(0,0,0,.25)"/>
  <g class="ce-body">
    <rect x="85" y="202" width="12" height="22" rx="6" fill="#4b4e2a"/><rect x="103" y="202" width="12" height="22" rx="6" fill="#4b4e2a"/>
    <ellipse cx="89" cy="226" rx="13" ry="6" fill="#6f7340"/><ellipse cx="111" cy="226" rx="13" ry="6" fill="#6f7340"/>
    <g class="ce-armL" data-ox="69" data-oy="162"><path d="M69 160l-8 28" stroke="url(#${st})" stroke-width="14" stroke-linecap="round"/><path d="M62 182l-4 15" stroke="url(#${sk})" stroke-width="9" stroke-linecap="round"/><circle cx="57" cy="200" r="7" fill="url(#${sk})"/></g>
    <g class="ce-armR" data-ox="131" data-oy="162"><path d="M131 160l8 28" stroke="url(#${st})" stroke-width="14" stroke-linecap="round"/><path d="M138 182l4 15" stroke="url(#${sk})" stroke-width="9" stroke-linecap="round"/><circle cx="143" cy="200" r="7" fill="url(#${sk})"/></g>
    <path d="M66 162q34-15 68 0l10 44q-44 12 -88 0z" fill="url(#${st})"/>
    <path d="M76 172h48l8 36q-32 8 -64 0z" fill="#fffdf6" stroke="#e3dccb" stroke-width="2"/>
    <path d="M77 173l-5 -14M123 173l5 -14" stroke="#fffdf6" stroke-width="4" stroke-linecap="round"/>
    <g transform="translate(100 196)"><path d="M0 8v-16" stroke="#c9922e" stroke-width="1.6"/><ellipse cx="-3" cy="-2" rx="2.4" ry="4" transform="rotate(-25 -3 -2)" fill="#e9b44c"/><ellipse cx="3" cy="-5" rx="2.4" ry="4" transform="rotate(25 3 -5)" fill="#e9b44c"/><ellipse cx="0" cy="-10" rx="2.2" ry="3.6" fill="#e9b44c"/></g>
    <g class="ce-head" data-ox="100" data-oy="160">
      <path d="M58 112q-10 30 -4 58q6 8 12 0q-4 -26 2 -50z" fill="url(#${hr})"/><path d="M142 112q10 30 4 58q-6 8 -12 0q4 -26 -2 -50z" fill="url(#${hr})"/>
      <circle cx="60" cy="168" r="6" fill="#6f7340"/><circle cx="140" cy="168" r="6" fill="#6f7340"/>
      <circle cx="100" cy="122" r="41" fill="url(#${sk})"/>
      <path d="M60 112q2-26 26-26q14-5 28 0q26 0 26 26q-12-12-28-12q-6 4-12 6q-4-4-12-6q-16 0-28 12z" fill="url(#${hr})"/>
      <path d="M66 88C50 72 62 40 86 46C92 26 116 26 120 46C144 40 152 72 136 88Z" fill="url(#${ht})"/>
      <path d="M90 48q2 18 0 38M110 48q-2 18 0 38" stroke="#e2dac6" stroke-width="2.5" fill="none"/>
      <rect x="64" y="80" width="72" height="16" rx="6" fill="#6f7340"/><circle cx="134" cy="88" r="6" fill="#d99a1e"/>
      ${browsSVG([85, 108], [115, 108], 3.5, '#6e3018')}
      ${eyesSVG([85, 124], [115, 124], { r: 10.5, iris: 8, irisC: '#5d7a2e', lid: '#f4c2a0' })}
      <path d="M74 118l-4 -4M76 115l-2 -5M126 118l4 -4M124 115l2 -5" stroke="#3a1d10" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="73" cy="142" rx="8" ry="5" fill="#ff8a8a" opacity=".5"/><ellipse cx="127" cy="142" rx="8" ry="5" fill="#ff8a8a" opacity=".5"/>
      <ellipse cx="100" cy="136" rx="4" ry="3.2" fill="#e88f74"/>
      ${mouthsSVG(100, 150, .9)}
    </g>
    ${propsSVG(160, 50)}
  </g></svg>`;
}

/* ---------- Кандидат GRANO: Буррата ---------- */
function burrataSVG(uid) {
  const b = `bb${uid}`, k = `bk${uid}`;
  return `<svg class="ch ch-burrata" viewBox="0 0 200 240" aria-hidden="true"><defs>
    <radialGradient id="${b}" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f7f3ea"/><stop offset="1" stop-color="#ddd3c0"/></radialGradient>
    <radialGradient id="${k}" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e2d8c5"/></radialGradient>
  </defs>
  <ellipse class="ce-shadow" cx="100" cy="232" rx="54" ry="7" fill="rgba(0,0,0,.22)"/>
  <g class="ce-body">
    <ellipse cx="80" cy="222" rx="15" ry="8" fill="#efe7d6" stroke="#d6cab2" stroke-width="1.5"/><ellipse cx="120" cy="222" rx="15" ry="8" fill="#efe7d6" stroke="#d6cab2" stroke-width="1.5"/>
    <g class="ce-armL" data-ox="42" data-oy="160"><ellipse cx="38" cy="184" rx="11" ry="14" fill="url(#${k})" stroke="#d6cab2" stroke-width="1.5"/></g>
    <g class="ce-armR" data-ox="158" data-oy="160"><ellipse cx="162" cy="184" rx="11" ry="14" fill="url(#${k})" stroke="#d6cab2" stroke-width="1.5"/></g>
    <g class="ce-head" data-ox="100" data-oy="210">
      <path d="M100 76c-46 0-66 36-66 76c0 40 30 66 66 66s66-26 66-66c0-40-20-76-66-76z" fill="url(#${b})" stroke="#d9cfbb" stroke-width="2"/>
      <path d="M100 82c-10-6-16-18-12-28c6 8 10 8 12 0c2 8 6 8 12 0c4 10-2 22-12 28z" fill="url(#${k})" stroke="#d9cfbb" stroke-width="2"/>
      <path d="M86 86q14 8 28 0" stroke="#cfc3ab" stroke-width="2" fill="none"/>
      <path d="M78 96q-8 20-6 40M122 96q8 20 6 40" stroke="#ece4d4" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M108 56c10-14 30-12 34-4c-10 8-24 10-34 4z" fill="#3f8a2e"/><path d="M110 55q14-4 30-3" stroke="#2c6a1f" stroke-width="1.5" fill="none"/>
      <ellipse cx="62" cy="168" rx="5" ry="3" fill="#fff" opacity=".9"/><path d="M150 168q4 10 0 16q-4-6 0-16z" fill="#fff8e6" stroke="#e8dcc0" stroke-width="1"/>
      ${browsSVG([80, 122], [120, 122], 4, '#b39a74')}
      ${eyesSVG([80, 144], [120, 144], { r: 13, iris: 9.5, irisC: '#4f7a2a', lid: '#f1ebe0' })}
      <ellipse cx="66" cy="168" rx="9" ry="5.5" fill="#ff9b8a" opacity=".45"/><ellipse cx="134" cy="168" rx="9" ry="5.5" fill="#ff9b8a" opacity=".45"/>
      ${mouthsSVG(100, 172, .9)}
    </g>
    ${propsSVG(166, 60)}
  </g></svg>`;
}

/* ---------- Зёрнышко: пушистый эксперт GRANO ---------- */
function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function fur(cx, cy, rx, ry, n, len, r, from = 0, to = Math.PI * 2) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = from + (to - from) * (i / n) + (r() - .5) * .04;
    const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    const nx = Math.cos(a) * ry, ny = Math.sin(a) * rx, nl = Math.hypot(nx, ny);
    const l = len * (.6 + r() * .8), tw = (r() - .5) * .5;
    const ex = x + (nx / nl) * l + (-ny / nl) * l * tw, ey = y + (ny / nl) * l + (nx / nl) * l * tw;
    d += `M${(x - nx / nl * 4).toFixed(1)} ${(y - ny / nl * 4).toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }
  return d;
}
function wheat(x, y, rot, k = 1) {
  let g = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})"><path d="M0 0v-44" stroke="#c9922e" stroke-width="2.5"/>`;
  for (let i = 0; i < 6; i++) {
    const yy = -14 - i * 6;
    g += `<ellipse cx="-4" cy="${yy}" rx="3.6" ry="6.5" transform="rotate(-25 -4 ${yy})" fill="#f2c45a" stroke="#c48a2a" stroke-width="1"/><ellipse cx="4" cy="${yy - 3}" rx="3.6" ry="6.5" transform="rotate(25 4 ${yy - 3})" fill="#f6cf6c" stroke="#c48a2a" stroke-width="1"/>`;
    g += `<path d="M-6 ${yy - 5}l-6 -12M6 ${yy - 8}l6 -12" stroke="#e7b44c" stroke-width="1"/>`;
  }
  return g + `<ellipse cx="0" cy="-54" rx="3.4" ry="6" fill="#f6cf6c" stroke="#c48a2a" stroke-width="1"/><path d="M0 -60v-14" stroke="#e7b44c" stroke-width="1"/></g>`;
}
function zernoSVG(uid) {
  const b = `zb${uid}`, pw = `zp${uid}`, r = rnd(7);
  return `<svg class="ch ch-zerno" viewBox="0 0 200 240" aria-hidden="true"><defs>
    <radialGradient id="${b}" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#fff6b8"/><stop offset=".55" stop-color="#ffdc55"/><stop offset="1" stop-color="#e9a628"/></radialGradient>
    <radialGradient id="${pw}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff2df"/><stop offset="1" stop-color="#f3cf9f"/></radialGradient>
  </defs>
  <ellipse class="ce-shadow" cx="100" cy="233" rx="48" ry="6" fill="rgba(0,0,0,.25)"/>
  <g class="ce-body">
    <g fill="url(#${pw})" stroke="#d9a868" stroke-width="1.5"><ellipse cx="80" cy="222" rx="16" ry="8"/><ellipse cx="120" cy="222" rx="16" ry="8"/></g>
    <path d="M70 225v-5M76 226v-6M84 226v-6M116 226v-6M124 226v-6M130 225v-5" stroke="#d9a868" stroke-width="1.5"/>
    <g class="ce-head" data-ox="100" data-oy="200">
      <ellipse cx="100" cy="140" rx="70" ry="82" fill="#ffd94d" opacity=".35"/><path d="${fur(100, 140, 62, 74, 280, 9, r)}" stroke="#f2bf3a" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>
      <ellipse cx="100" cy="140" rx="63" ry="75" fill="url(#${b})"/>
      <path d="${fur(100, 140, 60, 72, 220, 6, r)}" stroke="#ffe680" stroke-width="2.6" stroke-linecap="round"/>
      <path d="${fur(100, 92, 26, 24, 34, 26, r, Math.PI * 1.1, Math.PI * 1.9)}" stroke="#ffd94d" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M86 70q-6-20 2-32M100 66q2-24 -2-38M112 70q8-18 4-34" stroke="#f2c23e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      ${browsSVG([79, 98], [121, 98], 4, '#c9862a')}
      ${eyesSVG([79, 124], [121, 124], { r: 15, iris: 10.5, irisC: '#7a4720', rim: '#f2b2a8', lid: '#ffd968' })}
      <ellipse cx="66" cy="152" rx="9" ry="5.5" fill="#ff9b8a" opacity=".45"/><ellipse cx="134" cy="152" rx="9" ry="5.5" fill="#ff9b8a" opacity=".45"/>
      <ellipse cx="100" cy="148" rx="6.5" ry="5" fill="#f3958f"/><ellipse cx="98" cy="146.5" rx="2" ry="1.4" fill="#fff" opacity=".7"/>
      ${mouthsSVG(100, 163, .9)}
    </g>
    <g class="ce-armL" data-ox="48" data-oy="160"><ellipse cx="44" cy="186" rx="10" ry="13" fill="url(#${pw})" stroke="#d9a868" stroke-width="1.5"/>${wheat(44, 190, -18, .62)}</g>
    <g class="ce-armR" data-ox="152" data-oy="160"><ellipse cx="156" cy="186" rx="10" ry="13" fill="url(#${pw})" stroke="#d9a868" stroke-width="1.5"/></g>
    ${wheat(66, 224, -28, .6)}${wheat(134, 224, 26, .58)}
    ${propsSVG(166, 44)}
  </g></svg>`;
}

/* ---------- brows per mood ---------- */
const BROW = {
  up:   (x, y, s) => `M${x - 9} ${y + 1}q9 ${-7} 18 0`,
  high: (x, y, s) => `M${x - 9} ${y - 4}q9 ${-8} 18 0`,
  down: (x, y, s) => s < 0 ? `M${x - 9} ${y - 2}q9 3 18 5` : `M${x - 9} ${y + 3}q9 0 18 -5`,
  sad:  (x, y, s) => s < 0 ? `M${x - 9} ${y + 4}q9 -3 18 -9` : `M${x - 9} ${y - 5}q9 -3 18 9`,
  tilt: (x, y, s) => s < 0 ? `M${x - 9} ${y - 5}q9 -8 18 0` : `M${x - 9} ${y + 3}q9 0 18 -2`,
};

let UID = 0;
export class Character {
  constructor(el, who = 'shefi', mood = 'calm') {
    this.el = el; this.who = who; this.g = window.gsap;
    el.classList.add('ch-wrap');
    el.innerHTML = ({ zerno: zernoSVG, chefa: chefaSVG, burrata: burrataSVG }[who] || shefiSVG)(++UID);
    this.svg = el.querySelector('svg');
    this.q = (s) => this.svg.querySelector(s);
    this.mood(mood, true); this._idle(); this._blink();
  }
  _idle() {
    const g = this.g; if (!g) return;
    this.tl = [g.to(this.q('.ce-body'), { y: -4, duration: 1.5, yoyo: true, repeat: -1, ease: 'sine.inOut' }),
      g.to(this.q('.ce-shadow'), { scaleX: .88, transformOrigin: '50% 50%', duration: 1.5, yoyo: true, repeat: -1, ease: 'sine.inOut' }),
      g.to(this.q('.ce-head'), { rotate: 1.5, transformOrigin: '50% 100%', duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' })];
  }
  _blink() {
    const tick = () => {
      if (!this.el.isConnected) return;
      if (this.g && this.cur && !['joy', 'victory', 'praise'].includes(this.cur) && MOODS[this.cur].eyes !== 'joy')
        this.g.to(this.svg.querySelectorAll('.ce-eye'), { scaleY: .08, transformOrigin: '50% 50%', duration: .07, yoyo: true, repeat: 1 });
      this.bt = setTimeout(tick, 2400 + Math.random() * 2600);
    };
    this.bt = setTimeout(tick, 1200 + Math.random() * 800);
  }
  mood(name, instant) {
    name = LEGACY[name] || name; const m = MOODS[name] || MOODS.calm; this.cur = name;
    const s = this.svg, g = this.g, dur = instant || !g ? 0 : .3;
    s.querySelectorAll('.ce-mouths [data-m]').forEach((x) => (x.style.display = x.dataset.m === m.mouth ? '' : 'none'));
    s.querySelector('.ce-joy').style.display = m.eyes === 'joy' ? '' : 'none';
    s.querySelector('.ce-eyes').style.display = m.eyes === 'joy' ? 'none' : '';
    s.querySelectorAll('.ce-lid').forEach((x) => (x.style.opacity = m.eyes === 'half' ? 1 : 0));
    s.querySelectorAll('.ce-sadlid').forEach((x) => (x.style.opacity = m.eyes === 'sad' ? 1 : 0));
    const px = m.eyes === 'side' ? 3.5 : 0, py = m.eyes === 'side' ? -2 : m.eyes === 'sad' ? 2 : m.eyes === 'half' ? 2 : 0;
    s.querySelectorAll('.ce-pup').forEach((p) => (g ? g.to(p, { x: px, y: py, duration: dur }) : (p.style.transform = `translate(${px}px,${py}px)`)));
    s.querySelectorAll('.ce-scl').forEach((p) => (g ? g.to(p, { scale: m.eyes === 'wide' ? 1.15 : 1, transformOrigin: '50% 50%', duration: dur }) : 0));
    ['L', 'R'].forEach((k, i) => { const b = s.querySelector('.ce-b' + k); b.setAttribute('d', BROW[m.brows](+b.dataset.x, +b.dataset.y, i ? 1 : -1)); });
    ['L', 'R'].forEach((k, i) => {
      const a = s.querySelector('.ce-arm' + k);
      const o = `${a.dataset.ox}px ${a.dataset.oy}px`;
      if (g) { g.killTweensOf(a); g.to(a, { rotate: m.arms[i], svgOrigin: `${a.dataset.ox} ${a.dataset.oy}`, duration: dur ? .35 : 0, ease: 'back.out(1.7)' }); }
      else { a.style.transformOrigin = o; a.style.transform = `rotate(${m.arms[i]}deg)`; }
    });
    s.querySelectorAll('.ce-props [data-p]').forEach((p) => {
      const on = p.dataset.p === m.prop;
      p.style.display = on ? '' : 'none';
      if (on && g && !instant) g.fromTo(p, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: .45, ease: 'back.out(2.2)' });
    });
    if (m.prop === 'stars' && g) g.fromTo(s.querySelectorAll('.ce-st'), { rotate: -40, transformOrigin: '50% 50%' }, { rotate: 40, duration: .6, yoyo: true, repeat: 3, stagger: .1 });
    return this;
  }
  // mood + body animation
  react(name) {
    name = LEGACY[name] || name; this.mood(name);
    const g = this.g; if (!g) return this;
    const body = this.q('.ce-body'), head = this.q('.ce-head'), arm = this.q('.ce-armR');
    const svgO = (a) => `${a.dataset.ox} ${a.dataset.oy}`;
    if (name === 'joy' || name === 'praise') g.timeline().to(body, { y: -22, scaleY: 1.05, transformOrigin: '50% 100%', duration: .18, ease: 'power2.out' }).to(body, { y: 0, scaleY: .94, duration: .16, ease: 'power2.in' }).to(body, { scaleY: 1, duration: .3, ease: 'elastic.out(1,.4)' });
    if (name === 'praise') g.fromTo(head, { rotate: 0 }, { rotate: 6, transformOrigin: '50% 100%', duration: .16, yoyo: true, repeat: 3 });
    if (name === 'wow') g.fromTo(body, { scale: .9, transformOrigin: '50% 100%' }, { scale: 1, duration: .5, ease: 'elastic.out(1.2,.35)' });
    if (name === 'doubt') g.to(head, { rotate: -8, transformOrigin: '50% 100%', duration: .4, ease: 'power2.out', yoyo: true, repeat: 1, repeatDelay: .6 });
    if (name === 'focus') g.fromTo(body, { y: 0 }, { y: 3, duration: .3, yoyo: true, repeat: 1 });
    if (name === 'wrong') g.fromTo(body, { x: -6 }, { x: 6, duration: .07, yoyo: true, repeat: 5, onComplete: () => g.set(body, { x: 0 }) });
    if (name === 'victory') g.timeline().to(body, { y: -44, rotate: -360, transformOrigin: '50% 60%', duration: .7, ease: 'power2.out' }).to(body, { y: 0, rotate: -360, duration: .4, ease: 'bounce.out' }).set(body, { rotate: 0 });
    if (name === 'hint') g.fromTo(this.q('[data-p="bulb"]'), { opacity: .4 }, { opacity: 1, duration: .15, repeat: 5, yoyo: true });
    if (name === 'invite') g.to(arm, { rotate: -95, svgOrigin: svgO(arm), duration: .2, yoyo: true, repeat: 5, ease: 'sine.inOut' });
    return this;
  }
  enter(from = 'bottom') {
    const g = this.g; if (!g) return Promise.resolve();
    return new Promise((res) => g.fromTo(this.svg, { y: from === 'bottom' ? 140 : 0, x: from === 'side' ? -160 : 0, opacity: 0, scaleY: 1.2, transformOrigin: '50% 100%' },
      { y: 0, x: 0, opacity: 1, scaleY: 1, duration: .55, ease: 'back.out(1.6)', onComplete: res }));
  }
  exit() {
    const g = this.g; if (!g) return Promise.resolve();
    return new Promise((res) => g.timeline({ onComplete: res }).to(this.svg, { y: -16, scaleY: .9, duration: .12 }).to(this.svg, { y: 160, opacity: 0, duration: .32, ease: 'power2.in' }));
  }
  destroy() { clearTimeout(this.bt); (this.tl || []).forEach((t) => t.kill()); }
}

/* ---------- typing bubble ---------- */
export function say(el, text, speed = 15) {
  return new Promise((res) => {
    el.textContent = ''; el.classList.add('show');
    let i = 0; clearInterval(el._t);
    el._t = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) { clearInterval(el._t); res(); } }, speed);
    el.onclick = () => { clearInterval(el._t); el.textContent = text; res(); };
  });
}

/* ---------- Coach: the character pops in at the right moment ---------- */
let active = null;
export async function coach({ who: forceWho, concept, mood = 'calm', text = '', actions = [], duration = 4200, center = false }) {
  if (active) { active.close(true); }
  const who = forceWho || whoFor(concept);
  const box = document.createElement('div');
  box.className = 'coach' + (center ? ' coach-center' : '');
  box.innerHTML = `${center ? '<div class="coach-dim"></div>' : ''}<div class="coach-in"><div class="coach-ch"></div><div class="coach-bub"><span class="coach-name">${CAST[who].name}</span><span class="coach-t"></span>
    ${actions.length ? `<div class="coach-act">${actions.map((a, i) => `<button class="btn sm ${i ? 'ghost' : 'gold'}" data-i="${i}">${a.label}</button>`).join('')}</div>` : ''}</div>
    <button class="coach-x" aria-label="Закрыть">✕</button></div>`;
  document.body.appendChild(box);
  const ch = new Character(box.querySelector('.coach-ch'), who, mood);
  const g = window.gsap;
  if (g) g.from(box.querySelector('.coach-bub'), { scale: .6, opacity: 0, transformOrigin: center ? '50% 0%' : '0% 100%', duration: .35, delay: .3, ease: 'back.out(1.8)' });
  let closed = false, timer;
  const close = async (fast) => {
    if (closed) return; closed = true; clearTimeout(timer);
    if (!fast) { if (g) g.to(box.querySelector('.coach-bub'), { opacity: 0, scale: .8, duration: .2 }); await ch.exit(); }
    ch.destroy(); box.remove(); if (active && active.box === box) active = null;
  };
  active = { box, close };
  box.querySelector('.coach-x').onclick = () => close();
  box.querySelector('.coach-dim')?.addEventListener('click', () => close());
  box.querySelectorAll('.coach-act button').forEach((b) => b.onclick = () => { const a = actions[+b.dataset.i]; close(); a.onClick && a.onClick(); });
  await ch.enter('bottom');
  ch.react(mood);
  await say(box.querySelector('.coach-t'), text);
  if (!actions.length && duration) timer = setTimeout(() => close(), duration);
  return { close, ch };
}
export function closeCoach() { if (active) active.close(true); }
