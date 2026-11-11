// Квест «Первая смена в VILKA»: карта ресторана, персонаж Шефи, интерактивное видео, игра «Собери Шеф бургер», симулятор гостя.
import { Character, say } from './characters.js';
const Mascot = class extends Character { constructor(el) { super(el, 'shefi'); } };

const Q = 'first-shift';
const STEPS = [
  { id: 'intro', name: 'Встреча', zone: 'Вход', ic: '👋', at: 0 },
  { id: 'video', name: 'Кухня: как собирают Шеф бургер', zone: 'Кухня', ic: '🎬', at: 0.30 },
  { id: 'burger', name: 'Раздача: собери Шеф бургер', zone: 'Раздача', ic: '🍔', at: 0.58 },
  { id: 'guest', name: 'Зал: гость недоволен стейком', zone: 'Зал', ic: '💬', at: 0.84 },
];
const PATH = 'M180 520 C 60 500 40 440 70 380 S 90 250 80 190 S 170 90 270 120 S 330 230 300 300 S 200 360 230 420 S 330 470 300 520';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function questCard(done) {
  const n = done.size, all = STEPS.length;
  return `<a class="qcardx" href="#/quest">
    <div class="qx-m" id="qxm"></div>
    <div class="qx-t"><span class="qx-k">${n === all ? 'Квест пройден 🎖️' : n ? `Квест · ${n} из ${all}` : 'Новый квест'}</span>
      <b>Первая смена в VILKA</b><span class="qx-s">Шефи проведёт по ресторану: кухня, раздача, зал</span>
      <span class="qx-bar"><i style="width:${Math.round(100 * n / all)}%"></i></span></div></a>`;
}
export function mountCardMascot() { const el = document.getElementById('qxm'); if (el) { const m = new Mascot(el); setTimeout(() => m.react('wave'), 600); } }

export async function loadDone(sb, uid) {
  const { data } = await sb.from('quest_progress').select('step').eq('user_id', uid).eq('quest', Q);
  return new Set((data || []).map((x) => x.step));
}

/* ---------------- the map ---------------- */
export async function vQuest(ctx) {
  const { sb, S, $app } = ctx;
  document.body.classList.add('playing', 'questing');
  const done = await loadDone(sb, S.me.id);
  const next = STEPS.find((s) => !done.has(s.id));
  $app.innerHTML = `
  <div class="qmap-wrap">
    <div class="qhud"><a class="back" href="#/home">✕</a><div class="qtitle"><b>Первая смена</b><span>${done.size} из ${STEPS.length} точек</span></div><span class="chip gem" id="qstars">⭐ ${S.stats.total}</span></div>
    <div class="qmap">
      <svg viewBox="0 0 360 560" class="qmap-svg" aria-hidden="true">
        <defs>
          <pattern id="tiles" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#2a1c14"/><path d="M0 0h24v24" fill="none" stroke="#33231a" stroke-width="2"/></pattern>
          <radialGradient id="fire" cx="50%" cy="60%" r="60%"><stop offset="0" stop-color="#ffd25a"/><stop offset=".5" stop-color="#ff6a1a"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="6"/></filter>
        </defs>
        <rect width="360" height="560" rx="28" fill="url(#tiles)"/>
        <!-- kitchen -->
        <rect x="14" y="14" width="168" height="196" rx="20" fill="#3a2418" stroke="#4d3122" stroke-width="3"/>
        <text x="30" y="42" class="zl">Кухня</text>
        <rect x="34" y="60" width="128" height="40" rx="8" fill="#151010"/><g class="flame"><ellipse cx="60" cy="80" rx="16" ry="12" fill="url(#fire)"/><ellipse cx="98" cy="80" rx="16" ry="12" fill="url(#fire)"/><ellipse cx="136" cy="80" rx="16" ry="12" fill="url(#fire)"/></g>
        <path d="M44 74h108M44 86h108" stroke="#5a4a40" stroke-width="2"/>
        <rect x="34" y="118" width="60" height="26" rx="6" fill="#5b3b29"/><rect x="104" y="118" width="58" height="26" rx="6" fill="#5b3b29"/>
        <!-- pass -->
        <rect x="196" y="14" width="150" height="150" rx="20" fill="#3a2418" stroke="#4d3122" stroke-width="3"/>
        <text x="212" y="42" class="zl">Раздача</text>
        <rect x="214" y="60" width="114" height="18" rx="6" fill="#8a5a3a"/><circle cx="236" cy="69" r="8" fill="#f6ece0"/><circle cx="266" cy="69" r="8" fill="#f6ece0"/><circle cx="296" cy="69" r="8" fill="#f6ece0"/>
        <circle class="bell" cx="300" cy="120" r="12" fill="#ffb020"/><rect x="290" y="128" width="20" height="5" rx="2" fill="#a86d10"/>
        <!-- hall -->
        <rect x="190" y="196" width="156" height="210" rx="20" fill="#2f2017" stroke="#4d3122" stroke-width="3"/>
        <text x="206" y="224" class="zl">Зал</text>
        <g fill="#6b4630"><circle cx="230" cy="270" r="20"/><circle cx="300" cy="300" r="20"/><circle cx="240" cy="360" r="20"/></g>
        <g fill="#c58b5a"><circle cx="206" cy="270" r="7"/><circle cx="254" cy="270" r="7"/><circle cx="276" cy="300" r="7"/><circle cx="324" cy="300" r="7"/><circle cx="216" cy="360" r="7"/><circle cx="264" cy="360" r="7"/></g>
        <!-- entrance -->
        <rect x="120" y="470" width="120" height="76" rx="18" fill="#3a2418" stroke="#4d3122" stroke-width="3"/>
        <text x="134" y="498" class="zl">Вход</text>
        <rect x="136" y="508" width="88" height="16" rx="6" fill="#ff6a1a" opacity=".85"/>
        <!-- route -->
        <path id="qpath" d="${PATH}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="16" stroke-linecap="round"/>
        <path d="${PATH}" fill="none" stroke="#ffb020" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round" class="route"/>
        <g id="coins"></g>
      </svg>
      <div class="qnodes" id="qnodes"></div>
      <div class="qhero" id="qhero"><div class="qbubble" id="qbub"></div><div class="qmascot" id="qm"></div></div>
    </div>
    <div class="qbottom" id="qbot"></div>
  </div>`;

  const svg = $app.querySelector('.qmap-svg'), path = svg.getElementById ? svg.getElementById('qpath') : svg.querySelector('#qpath');
  const L = path.getTotalLength();
  const toPct = (t) => { const p = path.getPointAtLength(L * t); return { x: p.x / 360 * 100, y: p.y / 560 * 100 }; };
  const finishAt = 0.995;

  // stations
  const nodes = document.getElementById('qnodes');
  const all = [...STEPS, { id: 'finish', name: 'Финиш', ic: '🏆', at: finishAt }];
  all.forEach((s) => {
    const p = toPct(s.at), isDone = done.has(s.id), isNext = next && next.id === s.id, finishOpen = s.id === 'finish' && !next;
    const b = document.createElement('button');
    b.className = 'qnode' + (isDone ? ' done' : '') + (isNext || finishOpen ? ' open' : '') + (!isDone && !isNext && !finishOpen ? ' lock' : '');
    b.style.left = p.x + '%'; b.style.top = p.y + '%';
    b.innerHTML = `<span>${isDone ? '✓' : s.ic}</span><em>${s.id === 'finish' ? 'Финиш' : s.zone}</em>`;
    b.onclick = () => (isNext || isDone || finishOpen) ? openStep(s) : bump(`Сначала пройди «${next ? next.zone : ''}»`);
    nodes.appendChild(b);
  });

  // coins on the not-yet-walked part of the route
  const coins = svg.querySelector('#coins');
  const reached = next ? next.at : finishAt;
  for (let t = 0.04; t < finishAt; t += 0.045) {
    if (t <= reached || STEPS.some((s) => Math.abs(s.at - t) < 0.03)) continue;
    const p = path.getPointAtLength(L * t);
    coins.insertAdjacentHTML('beforeend', `<g class="coin" data-t="${t.toFixed(3)}" transform="translate(${p.x} ${p.y})"><circle r="7" fill="#ffd25a" stroke="#c78a10" stroke-width="2"/><path d="M-2 -3l2-1v8" stroke="#c78a10" stroke-width="2" fill="none"/></g>`);
  }

  // mascot
  const hero = document.getElementById('qhero');
  const m = new Mascot(document.getElementById('qm'));
  const bub = document.getElementById('qbub');
  const startT = (() => { const d = STEPS.filter((s) => done.has(s.id)); return d.length ? d[d.length - 1].at : 0; })();
  const place = (t) => { const p = toPct(t); hero.style.left = p.x + '%'; hero.style.top = p.y + '%'; };
  place(startT);
  const g = window.gsap;
  function bump(t) { m.react('no'); say(bub, t); setTimeout(() => m.mood('happy'), 1200); }

  async function walk(to) {
    const st = { t: parseFloat(hero.dataset.t || startT) };
    hero.dataset.t = to;
    bub.classList.remove('show'); bub.textContent = '';
    m.mood('happy');
    if (!g) { place(to); return; }
    await new Promise((res) => g.to(st, { t: to, duration: Math.max(.8, Math.abs(to - st.t) * 5), ease: 'power1.inOut',
      onUpdate: () => {
        place(st.t);
        coins.querySelectorAll('.coin:not(.got)').forEach((c) => { if (Math.abs(+c.dataset.t - st.t) < .02) { c.classList.add('got'); g.to(c, { y: '-=30', opacity: 0, duration: .5, ease: 'power2.out' }); } });
      }, onComplete: res }));
    g.fromTo(hero.querySelector('.chefi'), { y: 0 }, { y: -14, duration: .15, yoyo: true, repeat: 1 });
  }

  const bot = document.getElementById('qbot');
  const label = next ? `Дальше: ${next.zone}` : 'Забрать награду';
  bot.innerHTML = `<button class="btn block gold" id="qgo">${esc(label)}</button>`;
  document.getElementById('qgo').onclick = async () => {
    const target = next || { id: 'finish', at: finishAt };
    document.getElementById('qgo').disabled = true;
    await walk(target.at);
    openStep(target);
  };

  // greeting
  if (!done.size) {
    await sleep(400);
    m.react('wave');
    await say(bub, `Привет, ${S.me.full_name.split(' ')[0]}! Я Шефи. Сегодня твоя первая смена — пройдём ресторан вместе?`);
  } else if (next) {
    say(bub, `С возвращением! Нас ждёт ${next.zone.toLowerCase()}. Жми «Дальше».`);
  } else {
    m.react('party'); say(bub, 'Смена пройдена! Забирай награду на финише.');
  }

  async function openStep(s) {
    if (s.id === 'intro') return stepIntro(ctx, m, bub);
    if (s.id === 'video') return stepVideo(ctx);
    if (s.id === 'burger') return stepBurger(ctx);
    if (s.id === 'guest') return stepGuest(ctx);
    if (s.id === 'finish') return stepFinish(ctx);
  }
}

async function complete(ctx, step, score, max) {
  const { data, error } = await ctx.sb.rpc('quest_step', { p_quest: Q, p_step: step, p_score: score, p_max: max });
  if (error) { ctx.toast('Нет связи. Результат не сохранился, попробуйте ещё раз'); return null; }
  if (data.points) ctx.plus(data.points);
  await ctx.loadBase();
  return data;
}

/* ---------------- overlay shell ---------------- */
function overlay(cls = '') {
  document.querySelector('.qov')?.remove();
  const o = document.createElement('div');
  o.className = 'qov ' + cls;
  document.body.appendChild(o);
  if (window.gsap) window.gsap.from(o, { opacity: 0, duration: .25 });
  return o;
}
function closeOverlay(ctx) { document.querySelector('.qov')?.remove(); ctx.route(); }
function resultCard(o, ctx, { emoji, title, text, score, max, pts, onDone }) {
  const stars = score / max >= .99 ? 3 : score / max >= .66 ? 2 : score / max > 0 ? 1 : 0;
  o.innerHTML = `<div class="qres"><div class="stars">${[0, 1, 2].map((k) => `<span data-k="${k}">⭐</span>`).join('')}</div>
    <div class="qres-e">${emoji}</div><div class="h1">${esc(title)}</div><p class="muted">${esc(text)}</p>
    <div class="rgrid"><div><b>${score}/${max}</b><span>результат</span></div><div><b style="color:var(--acc2)">+${pts || 0}</b><span>баллов</span></div><div><b>${stars}★</b><span>оценка</span></div></div>
    <button class="btn block gold" id="qdone">К карте</button></div>`;
  o.querySelectorAll('.stars span').forEach((el) => { const k = +el.dataset.k; if (k < stars) setTimeout(() => el.classList.add('on'), 200 + k * 260); });
  if (stars >= 2) setTimeout(ctx.confetti, 700);
  o.querySelector('#qdone').onclick = onDone || (() => closeOverlay(ctx));
}

/* ---------------- 1. intro ---------------- */
async function stepIntro(ctx, m, bub) {
  const lines = [
    'Здесь всё как в нашем ресторане: кухня, раздача, зал и вход.',
    'На каждой точке — задание. За задания — баллы и награды в профиле.',
    'Ошибаться можно: я подскажу, как правильно. Поехали!',
  ];
  for (const l of lines) { m.mood('happy'); await say(bub, l); await sleep(1100); }
  m.react('yes');
  await complete(ctx, 'intro', 1, 1);
  await sleep(700);
  ctx.route();
}

/* ---------------- 2. interactive video ---------------- */
async function stepVideo(ctx) {
  const stops = [
    { t: 3.0, q: 'Стоп! Что лежит прямо на котлете?', o: ['Карамелизированный лук', 'Айсберг', 'Маринованные огурцы', 'Помидоры'], a: 0, ex: 'Сверху на котлете — карамелизированный лук, а над ним чеддер.' },
    { t: 6.6, q: 'А что под котлетой?', o: ['Чеддер', 'Маринованные огурцы', 'Помидоры', 'Пикантный соус'], a: 1, ex: 'Под котлетой — маринованные огурцы, ниже айсберг и соус.' },
    { t: 99, q: 'Финальный вопрос: какой соус в Шеф бургере?', o: ['Барбекю', '1000 островов', 'Фирменный пикантный', 'Грибной'], a: 2, ex: 'В Шеф бургере фирменный пикантный соус — сверху и снизу.' },
  ];
  const o = overlay('qvideo');
  o.innerHTML = `<div class="qv-top"><button class="back" id="qx">✕</button><div class="segs">${stops.map(() => '<i></i>').join('')}</div></div>
    <div class="qv-stage"><video id="qvid" playsinline muted preload="auto" poster="img/v/027.jpg"><source src="img/v/028.mp4" type="video/mp4"></video>
      <div class="qv-hint" id="qvh">Смотри, как собирают Шеф бургер. Видео остановится с вопросом</div>
      <div class="qv-q" id="qvq" hidden></div></div>
    <button class="btn block gold" id="qplay">▶ Смотреть</button>`;
  o.querySelector('#qx').onclick = () => closeOverlay(ctx);
  const v = o.querySelector('#qvid'), qbox = o.querySelector('#qvq');
  v.playbackRate = 0.55;
  let i = 0, score = 0, firstTry = true;
  const segs = o.querySelectorAll('.segs i');
  const ask = () => {
    v.pause();
    const s = stops[i];
    qbox.hidden = false;
    qbox.innerHTML = `<div class="row" style="align-items:flex-end"><div class="mini-ch" id="qvc"></div><b>${esc(s.q)}</b></div><div class="opts">${s.o.map((x, k) => `<button class="opt" data-k="${k}"><span class="k">${'АБВГ'[k]}</span><span>${esc(x)}</span></button>`).join('')}</div><div id="qvx"></div>`;
    if (window.gsap) window.gsap.from(qbox, { y: 40, opacity: 0, duration: .3, ease: 'back.out(1.6)' });
    const vc = new Character(qbox.querySelector('#qvc'), 'shefi', 'doubt');
    qbox.querySelectorAll('.opt').forEach((b) => b.onclick = () => {
      const k = +b.dataset.k;
      if (k === s.a) {
        vc.react('praise'); b.classList.add('ok'); if (firstTry) score++; segs[i].className = firstTry ? 'ok' : 'bad';
        qbox.querySelector('#qvx').innerHTML = `<p class="small">${esc(s.ex)}</p><button class="btn block" id="qcont">${i + 1 < stops.length ? 'Смотреть дальше' : 'Готово'}</button>`;
        qbox.querySelectorAll('.opt').forEach((x) => (x.disabled = true));
        qbox.querySelector('#qcont').onclick = async () => {
          qbox.hidden = true; i++; firstTry = true;
          if (i < stops.length) v.play(); else finish();
        };
      } else {
        vc.react('wrong'); b.classList.add('bad'); b.disabled = true; firstTry = false;
        qbox.querySelector('#qvx').innerHTML = `<button class="btn sm ghost" id="qrw">↺ Пересмотреть момент</button>`;
        qbox.querySelector('#qrw').onclick = () => { qbox.hidden = true; v.currentTime = Math.max(0, (stops[i].t > 50 ? v.duration : stops[i].t) - 2.2); v.play(); rewound = true; };
      }
    });
  };
  let rewound = false;
  v.addEventListener('timeupdate', () => {
    const s = stops[i]; if (!s || !qbox.hidden) return;
    if (v.currentTime >= s.t && s.t < 50) { if (rewound) { rewound = false; } ask(); }
  });
  v.addEventListener('ended', () => { if (i === stops.length - 1 && qbox.hidden) ask(); else if (i < stops.length - 1 && qbox.hidden && rewound) { rewound = false; ask(); } });
  o.querySelector('#qplay').onclick = (e) => { e.target.remove(); o.querySelector('#qvh').remove(); v.playbackRate = 0.55; v.play(); };
  async function finish() {
    const r = await complete(ctx, 'video', score, stops.length);
    resultCard(o, ctx, { emoji: '🎬', title: score === 3 ? 'Отличный глаз!' : 'Видео изучено', text: 'Ты знаешь, как устроен Шеф бургер. Дальше — собери его сам.', score, max: 3, pts: r?.points });
  }
}

/* ---------------- 3. burger game ---------------- */
const LAYERS = [
  { id: 'bunb', n: 'Нижняя булочка', c: 'bunb' }, { id: 's1', n: 'Пикантный соус', c: 'sauce', g: 'sauce' }, { id: 'ice', n: 'Айсберг', c: 'ice' },
  { id: 'pick', n: 'Маринованные огурцы', c: 'pick' }, { id: 'pat', n: 'Котлета', c: 'pat' }, { id: 'oni', n: 'Карамелизированный лук', c: 'oni' },
  { id: 'ched', n: 'Чеддер', c: 'ched' }, { id: 'tom', n: 'Помидоры', c: 'tom' }, { id: 's2', n: 'Пикантный соус', c: 'sauce', g: 'sauce' }, { id: 'bunt', n: 'Верхняя булочка', c: 'bunt' },
];
async function stepBurger(ctx) {
  const o = overlay('qburger');
  let lives = 3, idx = 0, mistakes = 0, time = 60, over = false;
  const tiles = LAYERS.map((l, k) => ({ ...l, k })).sort(() => Math.random() - .5);
  o.innerHTML = `<div class="qv-top"><button class="back" id="qx">✕</button><div class="qb-h"><b>Собери Шеф бургер</b><span>Снизу вверх. Ошибка — минус жизнь</span></div><span class="timer" id="qbt">60</span></div>
    <div class="qb-lives" id="qbl">❤️❤️❤️</div>
    <div class="qb-stage"><div class="qb-stack" id="qbs"><div class="qb-plate"></div></div><div class="qb-tip" id="qbtip">Начни с основы ↓</div><div class="qb-ch" id="qbch"></div></div>
    <div class="qb-tiles" id="qbtl">${tiles.map((t) => `<button class="qb-tile" data-k="${t.k}" data-g="${t.g || t.id}"><i class="ly ${t.c}"></i><span>${esc(t.n)}</span></button>`).join('')}</div>`;
  o.querySelector('#qx').onclick = () => { over = true; clearInterval(tm); closeOverlay(ctx); };
  const stack = o.querySelector('#qbs'), tip = o.querySelector('#qbtip'), g = window.gsap;
  const bc = new Character(o.querySelector('#qbch'), 'shefi', 'focus');
  const tm = setInterval(() => { if (over) return clearInterval(tm); time--; o.querySelector('#qbt').textContent = time; if (time <= 0) end(); }, 1000);
  o.querySelectorAll('.qb-tile').forEach((b) => b.onclick = () => {
    if (over) return;
    const want = LAYERS[idx], k = +b.dataset.k, ok = k === idx || (want.g && b.dataset.g === want.g);
    if (ok) {
      const l = LAYERS[idx];
      const el = document.createElement('i'); el.className = 'ly big ' + l.c; el.style.zIndex = 10 + idx;
      stack.appendChild(el);
      if (g) g.from(el, { y: -260, opacity: 0, duration: .45, ease: 'bounce.out' });
      b.disabled = true; b.classList.add('used'); idx++;
      if (navigator.vibrate) navigator.vibrate(12);
      tip.textContent = idx < LAYERS.length ? `Слоёв: ${idx} из ${LAYERS.length}` : 'Готово! 🔥';
      bc.react(idx === LAYERS.length ? 'victory' : idx % 3 === 0 ? 'joy' : 'focus');
      if (idx === LAYERS.length) { setTimeout(end, 600); if (g) g.fromTo(stack, { scale: 1 }, { scale: 1.08, duration: .2, yoyo: true, repeat: 1 }); }
    } else {
      mistakes++; lives--; o.querySelector('#qbl').textContent = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(3 - Math.max(0, lives));
      if (g) g.fromTo(b, { x: -8 }, { x: 8, duration: .06, yoyo: true, repeat: 5, onComplete: () => g.set(b, { x: 0 }) });
      b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 500);
      tip.textContent = `Не тот слой. Подсказка: следующим идёт «${LAYERS[idx].n.toLowerCase()}»`;
      bc.react('hint');
      if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
      if (lives <= 0) end();
    }
  });
  async function end() {
    if (over) return; over = true; clearInterval(tm);
    const score = Math.max(0, idx - mistakes), max = LAYERS.length;
    const r = await complete(ctx, 'burger', score, max);
    resultCard(o, ctx, { emoji: idx === max ? '🍔' : '⏱️', title: idx === max ? 'Бургер собран!' : 'Почти получилось', text: `Собрано слоёв: ${idx} из ${max}, ошибок: ${mistakes}. Порядок слоёв снизу: булочка, соус, айсберг, огурцы, котлета, лук, чеддер, помидоры, соус, булочка.`, score, max, pts: r?.points });
  }
}

/* ---------------- 4. guest simulator ---------------- */
const GUEST = [
  { g: 'Я заказывал Рибай medium, а мне принесли почти сухой. Это что такое?', mood: 1, o: [
    { t: 'Прошу прощения! Сейчас же передам на кухню — приготовим новый стейк с прожаркой medium.', s: 2, r: 'Ну хорошо… А долго ждать?', d: 1, f: 'Отлично: извинился и сразу предложил решение.' },
    { t: 'Это medium well — шеф-повар рекомендует именно такую прожарку.', s: 0, r: 'Я не просил рекомендаций! Я просил medium!', d: -1, f: 'Рекомендацию шефа озвучиваем при заказе. Если гость недоволен — не спорим, а решаем.' },
    { t: 'Давайте посмотрю… Да, немного пережарен.', s: 1, r: 'Немного?! И что дальше?', d: 0, f: 'Признать ошибку — хорошо, но гость ждёт решения. Сразу предложи замену.' }] },
  { g: 'И сколько ждать? Я тороплюсь.', o: [
    { t: 'Уточню у кухни точное время и сразу вернусь к вам. Пока ждёте — принести напиток?', s: 2, r: 'Да, давайте воды. Спасибо.', d: 1, f: 'Верно: не называем время наугад, а заботимся о госте, пока он ждёт.' },
    { t: 'Минут пять, наверное.', s: 1, r: 'Наверное? Хорошо, засекаю.', d: 0, f: 'Не называй время наугад — уточни у кухни. Иначе гость будет ждать и злиться.' },
    { t: 'Это зависит от кухни, я не знаю.', s: 0, r: 'Отлично, вообще никто ничего не знает.', d: -1, f: '«Не знаю» звучит как безразличие. Узнай и вернись с ответом.' }] },
  { g: 'Вообще-то вы мне испортили вечер.', o: [
    { t: 'Понимаю вас, мне очень жаль. Я приглашу администратора — он обязательно с вами поговорит.', s: 2, r: 'Хорошо, пусть подойдёт.', d: 1, f: 'Правильно: компенсации и сложные решения — зона администратора. Твоя задача — позвать его.' },
    { t: 'Давайте я сделаю вам скидку 50%.', s: 0, r: 'Ого… а вы точно можете это решать?', d: 0, f: 'Официант не обещает скидки сам. Решение о компенсации принимает администратор.' },
    { t: 'Ещё раз извините, такого больше не повторится.', s: 1, r: 'Посмотрим.', d: 0, f: 'Извинение — хорошо, но вечер гостя уже задет. Подключи администратора.' }] },
  { g: '(Новый стейк готов.) Что сделаешь?', o: [
    { t: 'Поставлю блюдо, назову его: «Ваш Рибай medium», пожелаю приятного аппетита и через пару минут подойду узнать, всё ли нравится.', s: 2, r: 'Вот это совсем другое дело. Спасибо!', d: 2, f: 'Идеально: подача по стандарту и контроль стола после проблемы.' },
    { t: 'Поставлю и не буду подходить, чтобы не мешать.', s: 1, r: '…', d: 0, f: 'После жалобы обязательно вернись к столу и спроси, всё ли в порядке.' },
    { t: 'Скажу: «Вот, теперь как вы хотели» — и уйду.', s: 0, r: 'Могли бы и повежливее.', d: -1, f: 'Тон решает всё. Без упрёков: назови блюдо, пожелай приятного аппетита.' }] },
];
const FACES = ['😡', '😠', '😐', '🙂', '😊', '🤩'];
async function stepGuest(ctx) {
  const o = overlay('qguest');
  let i = 0, score = 0, mood = 1;
  const draw = () => {
    const st = GUEST[i];
    o.innerHTML = `<div class="qv-top"><button class="back" id="qx">✕</button><div class="segs">${GUEST.map((x, k) => `<i class="${k < i ? 'ok' : k === i ? 'cur' : ''}"></i>`).join('')}</div></div>
      <div class="qg-scene">
        <div class="qg-guest"><div class="qg-face" id="qgf">${FACES[mood]}</div><div class="qg-meter"><i style="width:${mood * 20}%"></i></div><span class="small muted">Настроение гостя</span></div>
        <div class="qg-say"><span class="small muted">Гость, стол 4</span><b>${esc(st.g)}</b></div>
      </div>
      <div class="qg-opts">${st.o.map((x, k) => `<button class="opt" data-k="${k}"><span class="k">${'АБВ'[k]}</span><span>${esc(x.t)}</span></button>`).join('')}</div>`;
    o.querySelector('#qx').onclick = () => closeOverlay(ctx);
    if (window.gsap) window.gsap.from(o.querySelector('.qg-say'), { y: 16, opacity: 0, duration: .3 });
    o.querySelectorAll('.opt').forEach((b) => b.onclick = () => {
      const x = st.o[+b.dataset.k]; score += x.s;
      mood = Math.min(5, Math.max(0, mood + x.d));
      o.querySelectorAll('.opt').forEach((y) => (y.disabled = true));
      b.classList.add(x.s === 2 ? 'ok' : 'bad');
      const f = o.querySelector('#qgf'); f.textContent = FACES[mood];
      if (window.gsap) window.gsap.fromTo(f, { scale: .6 }, { scale: 1, duration: .45, ease: 'elastic.out(1,.4)' });
      o.querySelector('.qg-meter i').style.width = mood * 20 + '%';
      o.querySelector('.qg-say b').textContent = x.r;
      const sh = document.createElement('div'); sh.className = 'sheet ' + (x.s === 2 ? 'ok' : 'bad');
      sh.innerHTML = `<div class="row"><div class="qg-chefi" id="qgc"></div><div><div class="v">${x.s === 2 ? 'Шефи: так держать!' : x.s === 1 ? 'Шефи: можно лучше' : 'Шефи: так не надо'}</div><span class="small">${esc(x.f)}</span></div></div><button class="btn block ${x.s === 2 ? 'okb' : 'badb'}" id="qn">${i + 1 < GUEST.length ? 'Дальше' : 'Итог'}</button>`;
      o.appendChild(sh);
      const mm = new Mascot(sh.querySelector('#qgc')); mm.react(x.s === 2 ? 'yes' : 'no');
      sh.querySelector('#qn').onclick = async () => { i++; if (i < GUEST.length) draw(); else { const max = GUEST.length * 2; const r = await complete(ctx, 'guest', score, max);
        resultCard(o, ctx, { emoji: FACES[mood], title: mood >= 4 ? 'Гость уходит довольным' : 'Гость остался недоволен', text: 'Извинись, предложи решение, не называй время наугад, позови администратора и вернись к столу.', score, max, pts: r?.points }); } };
    });
  };
  draw();
}

/* ---------------- finish ---------------- */
async function stepFinish(ctx) {
  const o = overlay('qfinish');
  const { data: a } = await ctx.sb.from('achievements').select('*').eq('user_id', ctx.S.me.id).eq('code', 'quest:' + Q).maybeSingle();
  o.innerHTML = `<div class="qres"><div class="qmedal">🎖️</div><div class="h1">Первая смена пройдена!</div>
    <p class="muted">${a ? 'Награда «Первая смена» уже в твоём профиле.' : 'Награда появится в профиле, как только все точки будут пройдены.'}</p>
    <div class="qg-chefi big" id="qfc"></div>
    <div class="row" style="width:100%"><a class="btn ghost" style="flex:1" href="#/me">В профиль</a><a class="btn gold" style="flex:1" href="#/home">На главную</a></div></div>`;
  const m = new Mascot(o.querySelector('#qfc')); setTimeout(() => m.react('party'), 300);
  ctx.confetti(); setTimeout(ctx.confetti, 900);
  if (window.gsap) window.gsap.from(o.querySelector('.qmedal'), { scale: 0, rotate: -180, duration: .9, ease: 'back.out(1.8)' });
  o.querySelectorAll('a').forEach((x) => x.addEventListener('click', () => o.remove()));
}

/* ---------------- first visit greeting ---------------- */
export function greetOnce(ctx) {
  const key = 'vg_greet_' + ctx.S.me.id;
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (e) { return; }
  const o = overlay('qgreet');
  o.innerHTML = `<div class="qgreet-card"><div class="qg-chefi big" id="qgm"></div><div class="qbubble show" id="qgb"></div>
    <div class="row" style="width:100%"><button class="btn ghost" style="flex:1" id="qlater">Позже</button><a class="btn gold" style="flex:2" href="#/quest" id="qgo2">Начать квест</a></div></div>`;
  const m = new Mascot(o.querySelector('#qgm'));
  setTimeout(() => m.react('wave'), 300);
  say(o.querySelector('#qgb'), `Привет, ${ctx.S.me.full_name.split(' ')[0]}! Я Шефи — твой наставник. Здесь ты изучишь меню, сыграешь в игры и соберёшь награды. Начнём с первой смены?`);
  o.querySelector('#qlater').onclick = () => o.remove();
  o.querySelector('#qgo2').onclick = () => o.remove();
}
