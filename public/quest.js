// Движок квестов и симуляторов. Содержание хранится в базе (таблица quests) и редактируется в кабинете.
import { Character, say } from './characters.js';

const PATH = 'M180 520 C 60 500 40 440 70 380 S 90 250 80 190 S 170 90 270 120 S 330 230 300 300 S 200 360 230 420 S 330 470 300 520';
const AT4 = [0, 0.30, 0.58, 0.84];
const FINISH = 0.995;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const atOf = (i, n) => (n === 4 ? AT4[i] : n <= 1 ? 0 : (0.84 * i) / (n - 1));

export async function loadQuests(sb, concept) {
  const { data } = await sb.from('quests').select('*').order('sort');
  return (data || []).filter((q) => q.active && (!q.concept || q.concept === concept));
}
export async function loadDone(sb, uid, qid) {
  if (!qid) return new Set();
  const { data } = await sb.from('quest_progress').select('step').eq('user_id', uid).eq('quest', qid);
  return new Set((data || []).map((x) => x.step));
}

export function questCard(q, done) {
  if (!q) return '';
  const n = q.steps.filter((s) => done.has(s.id)).length, all = q.steps.length;
  return `<a class="qcardx ${q.concept === 'grano' ? 'qx-grano' : ''}" href="#/quest/${encodeURIComponent(q.id)}">
    <div class="qx-m"></div>
    <div class="qx-t"><span class="qx-k">${n === all ? 'Квест пройден 🎖️' : n ? `Квест · ${n} из ${all}` : 'Новый квест'}</span>
      <b>${esc(q.title)}</b><span class="qx-s">Шефи проведёт по ресторану: ${esc((q.subtitle || '').toLowerCase())}</span>
      <span class="qx-bar"><i style="width:${Math.round(100 * n / all)}%"></i></span></div></a>`;
}

/* ---------------- quest map ---------------- */
export async function vQuest(ctx, id) {
  const { sb, S, $app } = ctx;
  const { data: q } = await sb.from('quests').select('*').eq('id', id).maybeSingle();
  if (!q) { location.hash = '#/games'; return; }
  document.body.classList.add('playing', 'questing');
  const done = await loadDone(sb, S.me.id, q.id);
  const steps = q.steps.map((s, i) => ({ ...s, at: atOf(i, q.steps.length) }));
  const next = steps.find((s) => !done.has(s.id));
  const Z = (q.zones && q.zones.length === 4) ? q.zones : ['Кухня', 'Раздача', 'Зал', 'Вход'];
  const grano = q.concept === 'grano';
  const room = grano ? '#4a4a2a' : '#3a2418', edge = grano ? '#5c5c34' : '#4d3122';
  $app.innerHTML = `
  <div class="qmap-wrap">
    <div class="qhud"><a class="back" href="#/games">✕</a><div class="qtitle"><b>${esc(q.title)}</b><span>${steps.filter((s) => done.has(s.id)).length} из ${steps.length} точек</span></div><span class="chip gem">⭐ ${S.stats.balance ?? S.stats.total}</span></div>
    <div class="qmap">
      <svg viewBox="0 0 360 560" class="qmap-svg" aria-hidden="true">
        <defs>
          <pattern id="tiles" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="${grano ? '#3a3a22' : '#2a1c14'}"/><path d="M0 0h24v24" fill="none" stroke="${grano ? '#44452a' : '#33231a'}" stroke-width="2"/></pattern>
          <radialGradient id="fire" cx="50%" cy="60%" r="60%"><stop offset="0" stop-color="#ffd25a"/><stop offset=".5" stop-color="#ff6a1a"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
        </defs>
        <rect width="360" height="560" rx="28" fill="url(#tiles)"/>
        <rect x="14" y="14" width="168" height="196" rx="20" fill="${room}" stroke="${edge}" stroke-width="3"/>
        <text x="30" y="42" class="zl">${esc(Z[0])}</text>
        ${grano ? `<g fill="#f4ecd6" stroke="#cfc3a2" stroke-width="2"><circle cx="58" cy="90" r="18"/><circle cx="100" cy="84" r="14"/><rect x="128" y="74" width="34" height="32" rx="6"/></g><g fill="#e9dcb8"><circle cx="58" cy="140" r="12"/><circle cx="92" cy="146" r="12"/><circle cx="126" cy="140" r="12"/></g>`
          : `<rect x="34" y="60" width="128" height="40" rx="8" fill="#151010"/><g class="flame"><ellipse cx="60" cy="80" rx="16" ry="12" fill="url(#fire)"/><ellipse cx="98" cy="80" rx="16" ry="12" fill="url(#fire)"/><ellipse cx="136" cy="80" rx="16" ry="12" fill="url(#fire)"/></g><path d="M44 74h108M44 86h108" stroke="#5a4a40" stroke-width="2"/><rect x="34" y="118" width="60" height="26" rx="6" fill="#5b3b29"/><rect x="104" y="118" width="58" height="26" rx="6" fill="#5b3b29"/>`}
        <rect x="196" y="14" width="150" height="150" rx="20" fill="${room}" stroke="${edge}" stroke-width="3"/>
        <text x="212" y="42" class="zl">${esc(Z[1])}</text>
        ${grano ? `<path d="M222 140v-46a50 50 0 0 1 100 0v46z" fill="#8a5a3a" stroke="#6b432a" stroke-width="3"/><path d="M246 140v-26a26 26 0 0 1 52 0v26z" fill="#1a1210"/><g class="flame"><ellipse cx="262" cy="128" rx="12" ry="10" fill="url(#fire)"/><ellipse cx="282" cy="130" rx="12" ry="10" fill="url(#fire)"/></g>`
          : `<rect x="214" y="60" width="114" height="18" rx="6" fill="#8a5a3a"/><circle cx="236" cy="69" r="8" fill="#f6ece0"/><circle cx="266" cy="69" r="8" fill="#f6ece0"/><circle cx="296" cy="69" r="8" fill="#f6ece0"/><circle cx="300" cy="120" r="12" fill="#ffb020"/>`}
        <rect x="190" y="196" width="156" height="210" rx="20" fill="${grano ? '#3f3f24' : '#2f2017'}" stroke="${edge}" stroke-width="3"/>
        <text x="206" y="224" class="zl">${esc(Z[2])}</text>
        <g fill="${grano ? '#7a6a3a' : '#6b4630'}"><circle cx="230" cy="270" r="20"/><circle cx="300" cy="300" r="20"/><circle cx="240" cy="360" r="20"/></g>
        <g fill="${grano ? '#c9b37a' : '#c58b5a'}"><circle cx="206" cy="270" r="7"/><circle cx="254" cy="270" r="7"/><circle cx="276" cy="300" r="7"/><circle cx="324" cy="300" r="7"/><circle cx="216" cy="360" r="7"/><circle cx="264" cy="360" r="7"/></g>
        <rect x="120" y="470" width="120" height="76" rx="18" fill="${room}" stroke="${edge}" stroke-width="3"/>
        <text x="134" y="498" class="zl">${esc(Z[3])}</text>
        <rect x="136" y="508" width="88" height="16" rx="6" fill="${grano ? '#d99a1e' : '#ff6a1a'}" opacity=".85"/>
        <path id="qpath" d="${PATH}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="16" stroke-linecap="round"/>
        <path d="${PATH}" fill="none" stroke="#ffb020" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round" class="route"/>
        <g id="coins"></g>
      </svg>
      <div class="qnodes" id="qnodes"></div>
      <div class="qhero" id="qhero"><div class="qbubble" id="qbub"></div><div class="qmascot" id="qm"></div></div>
    </div>
    <div class="qbottom" id="qbot"></div>
  </div>`;

  const svg = $app.querySelector('.qmap-svg'), path = svg.querySelector('#qpath');
  const L = path.getTotalLength();
  const toPct = (t) => { const p = path.getPointAtLength(L * t); return { x: p.x / 360 * 100, y: p.y / 560 * 100 }; };
  const nodes = document.getElementById('qnodes');
  [...steps, { id: '__finish', ic: '🏆', zone: 'Финиш', at: FINISH }].forEach((s) => {
    const p = toPct(s.at), isDone = done.has(s.id), isNext = next && next.id === s.id, finOpen = s.id === '__finish' && !next;
    const b = document.createElement('button');
    b.className = 'qnode' + (isDone ? ' done' : '') + (isNext || finOpen ? ' open' : '') + (!isDone && !isNext && !finOpen ? ' lock' : '');
    b.style.left = p.x + '%'; b.style.top = p.y + '%';
    b.innerHTML = `<span>${isDone ? '✓' : esc(s.ic || '⭐')}</span><em>${esc(s.zone || '')}</em>`;
    b.onclick = () => (isNext || isDone || finOpen) ? open(s) : bump(`Сначала пройди «${next ? next.zone : ''}»`);
    nodes.appendChild(b);
  });
  const coins = svg.querySelector('#coins'), reached = next ? next.at : FINISH;
  for (let t = 0.04; t < FINISH; t += 0.045) {
    if (t <= reached || steps.some((s) => Math.abs(s.at - t) < 0.03)) continue;
    const p = path.getPointAtLength(L * t);
    coins.insertAdjacentHTML('beforeend', `<g class="coin" data-t="${t.toFixed(3)}" transform="translate(${p.x} ${p.y})"><circle r="7" fill="#ffd25a" stroke="#c78a10" stroke-width="2"/><path d="M-2 -3l2-1v8" stroke="#c78a10" stroke-width="2" fill="none"/></g>`);
  }
  const hero = document.getElementById('qhero'), bub = document.getElementById('qbub');
  const m = new Character(document.getElementById('qm'), 'shefi', 'calm');
  const doneSteps = steps.filter((s) => done.has(s.id));
  const startT = doneSteps.length ? doneSteps[doneSteps.length - 1].at : 0;
  const place = (t) => { const p = toPct(t); hero.style.left = p.x + '%'; hero.style.top = p.y + '%'; };
  place(startT); hero.dataset.t = startT;
  const g = window.gsap;
  function bump(t) { m.react('wrong'); say(bub, t); setTimeout(() => m.mood('calm'), 1200); }
  async function walk(to) {
    const st = { t: parseFloat(hero.dataset.t) }; hero.dataset.t = to;
    bub.classList.remove('show'); bub.textContent = ''; m.mood('focus');
    if (!g) { place(to); return; }
    await new Promise((res) => g.to(st, { t: to, duration: Math.max(.8, Math.abs(to - st.t) * 5), ease: 'power1.inOut',
      onUpdate: () => { place(st.t); coins.querySelectorAll('.coin:not(.got)').forEach((c) => { if (Math.abs(+c.dataset.t - st.t) < .02) { c.classList.add('got'); g.to(c, { y: '-=30', opacity: 0, duration: .5 }); } }); },
      onComplete: res }));
    m.react('joy');
  }
  const bot = document.getElementById('qbot');
  bot.innerHTML = `<button class="btn block gold" id="qgo">${next ? `Дальше: ${esc(next.zone)}` : 'Забрать награду'}</button>`;
  document.getElementById('qgo').onclick = async (e) => { e.target.disabled = true; const tgt = next || { id: '__finish', at: FINISH }; await walk(tgt.at); open(tgt); };
  if (!done.size) { await sleep(300); m.react('invite'); await say(bub, `Привет, ${S.me.full_name.split(' ')[0]}! Сегодня твоя первая смена — пройдём ресторан вместе?`); }
  else if (next) say(bub, `С возвращением! Дальше — ${next.zone.toLowerCase()}. Жми «Дальше».`);
  else { m.react('victory'); say(bub, 'Смена пройдена! Забирай награду на финише.'); }

  async function open(s) {
    const run = { ctx, quest: q, step: s, back: () => ctx.route() };
    if (s.id === '__finish') return stepFinish(run);
    if (s.type === 'intro') return stepIntro(run, m, bub);
    return RUN[s.type] ? RUN[s.type](run) : ctx.toast('Этот тип задания пока не поддерживается');
  }
}

/* ---------------- simulator (one dialogue) ---------------- */
export async function vSim(ctx, id) {
  const { data: q } = await ctx.sb.from('quests').select('*').eq('id', id).maybeSingle();
  if (!q) { location.hash = '#/games'; return; }
  const s = q.steps.find((x) => x.type === 'dialogue');
  if (!s) { location.hash = '#/games'; return; }
  stepDialogue({ ctx, quest: q, step: s, back: () => (location.hash = '#/games'), title: q.title });
}

async function complete(run, score, max) {
  const { data, error } = await run.ctx.sb.rpc('quest_step', { p_quest: run.quest.id, p_step: run.step.id, p_score: score, p_max: max });
  if (error) { run.ctx.toast('Нет связи. Результат не сохранился, попробуйте ещё раз'); return null; }
  if (data.points) run.ctx.plus(data.points);
  await run.ctx.loadBase();
  return data;
}
function overlay(cls = '') {
  document.querySelector('.qov')?.remove();
  const o = document.createElement('div'); o.className = 'qov ' + cls; document.body.appendChild(o);
  if (window.gsap) window.gsap.from(o, { opacity: 0, duration: .25 });
  return o;
}
function close(run) { document.querySelector('.qov')?.remove(); run.back(); }
function resultCard(o, run, { emoji, title, text, score, max, pts }) {
  const stars = score / max >= .99 ? 3 : score / max >= .66 ? 2 : score / max > 0 ? 1 : 0;
  o.innerHTML = `<div class="qres"><div class="res-ch" id="rch"></div><div class="stars">${[0, 1, 2].map((k) => `<span data-k="${k}">⭐</span>`).join('')}</div>
    <div class="h1">${esc(emoji)} ${esc(title)}</div><p class="muted">${esc(text)}</p>
    <div class="rgrid"><div><b>${score}/${max}</b><span>результат</span></div><div><b style="color:var(--acc2)">+${pts || 0}</b><span>баллов</span></div><div><b>${stars}★</b><span>оценка</span></div></div>
    <button class="btn block gold" id="qdone">${run.title ? 'К играм' : 'К карте'}</button></div>`;
  const ch = new Character(o.querySelector('#rch'), 'shefi', 'calm'); ch.enter().then(() => ch.react(stars >= 2 ? 'victory' : stars ? 'praise' : 'wrong'));
  o.querySelectorAll('.stars span').forEach((el) => { const k = +el.dataset.k; if (k < stars) setTimeout(() => el.classList.add('on'), 300 + k * 260); });
  if (stars >= 2) setTimeout(run.ctx.confetti, 800);
  o.querySelector('#qdone').onclick = () => close(run);
}

/* ---------------- step: intro ---------------- */
async function stepIntro(run, m, bub) {
  for (const l of run.step.data.lines || []) { m.mood('calm'); await say(bub, l); await sleep(1100); }
  m.react('praise'); await complete(run, 1, 1); await sleep(700); run.ctx.route();
}

/* ---------------- step: interactive video ---------------- */
function stepVideo(run) {
  const d = run.step.data, stops = d.stops || [];
  const o = overlay('qvideo');
  o.innerHTML = `<div class="qv-top"><button class="back" id="qx">✕</button><div class="segs">${stops.map(() => '<i></i>').join('')}</div></div>
    <div class="qv-stage"><video id="qvid" playsinline muted preload="auto" ${d.poster ? `poster="${esc(d.poster)}"` : ''}><source src="${esc(d.src)}" type="video/mp4"></video>
      <div class="qv-hint" id="qvh">${esc(d.intro || 'Смотри внимательно — видео остановится с вопросом')}</div><div class="qv-q" id="qvq" hidden></div></div>
    <button class="btn block gold" id="qplay">▶ Смотреть</button>`;
  o.querySelector('#qx').onclick = () => close(run);
  const v = o.querySelector('#qvid'), qbox = o.querySelector('#qvq'), segs = o.querySelectorAll('.segs i');
  let i = 0, score = 0, first = true;
  const ask = () => {
    v.pause(); const s = stops[i]; qbox.hidden = false;
    qbox.innerHTML = `<div class="row" style="align-items:flex-end"><div class="mini-ch" id="qvc"></div><b>${esc(s.q)}</b></div><div class="opts">${s.o.map((x, k) => `<button class="opt" data-k="${k}"><span class="k">${'АБВГ'[k]}</span><span>${esc(x)}</span></button>`).join('')}</div><div id="qvx"></div>`;
    if (window.gsap) window.gsap.from(qbox, { y: 40, opacity: 0, duration: .3, ease: 'back.out(1.6)' });
    const vc = new Character(qbox.querySelector('#qvc'), 'shefi', 'doubt');
    qbox.querySelectorAll('.opt').forEach((b) => b.onclick = () => {
      if (+b.dataset.k === s.a) {
        vc.react('praise'); b.classList.add('ok'); if (first) score++; segs[i].className = first ? 'ok' : 'bad';
        qbox.querySelectorAll('.opt').forEach((x) => (x.disabled = true));
        qbox.querySelector('#qvx').innerHTML = `<p class="small">${esc(s.ex || '')}</p><button class="btn block" id="qc">${i + 1 < stops.length ? 'Смотреть дальше' : 'Готово'}</button>`;
        qbox.querySelector('#qc').onclick = () => { qbox.hidden = true; i++; first = true; if (i < stops.length) v.play(); else fin(); };
      } else {
        vc.react('wrong'); b.classList.add('bad'); b.disabled = true; first = false;
        qbox.querySelector('#qvx').innerHTML = `<button class="btn sm ghost" id="qrw">↺ Пересмотреть момент</button>`;
        qbox.querySelector('#qrw').onclick = () => { qbox.hidden = true; v.currentTime = Math.max(0, (s.t > 50 ? v.duration : s.t) - 2.2); v.play(); };
      }
    });
  };
  v.addEventListener('timeupdate', () => { const s = stops[i]; if (s && qbox.hidden && s.t < 50 && v.currentTime >= s.t) ask(); });
  v.addEventListener('ended', () => { if (qbox.hidden && stops[i]) ask(); });
  o.querySelector('#qplay').onclick = (e) => { e.target.remove(); o.querySelector('#qvh').remove(); v.playbackRate = d.rate || 1; v.play(); };
  async function fin() { const r = await complete(run, score, stops.length); resultCard(o, run, { emoji: '🎬', title: score === stops.length ? 'Отличный глаз!' : 'Видео изучено', text: 'Дальше — следующее задание на карте.', score, max: stops.length, pts: r?.points }); }
}

/* ---------------- step: quiz with photos ---------------- */
function stepQuiz(run) {
  const d = run.step.data, items = d.items || [];
  const o = overlay('qquiz');
  let i = 0, score = 0;
  const draw = () => {
    const it = items[i];
    o.innerHTML = `<div class="qv-top"><button class="back" id="qx">✕</button><div class="segs">${items.map((x, k) => `<i class="${k < i ? 'ok' : k === i ? 'cur' : ''}"></i>`).join('')}</div></div>
      <div class="qcard"><span class="lbl">${esc(d.title || 'Задание')}</span>${it.photo ? `<img class="qimg" src="${esc(it.photo)}" alt="">` : ''}<div class="q"><b>${esc(it.q)}</b></div>
      <div class="opts">${it.o.map((x, k) => `<button class="opt" data-k="${k}"><span class="k">${'АБВГ'[k]}</span><span>${esc(x)}</span></button>`).join('')}</div></div>`;
    o.querySelector('#qx').onclick = () => close(run);
    o.querySelectorAll('.opt').forEach((b) => b.onclick = () => {
      const ok = +b.dataset.k === it.a; if (ok) score++;
      o.querySelectorAll('.opt').forEach((x) => (x.disabled = true));
      b.classList.add(ok ? 'ok' : 'bad'); if (!ok) o.querySelector(`.opt[data-k="${it.a}"]`).classList.add('ok');
      const sh = document.createElement('div'); sh.className = 'sheet ' + (ok ? 'ok' : 'bad');
      sh.innerHTML = `<div class="row" style="align-items:flex-end"><div class="mini-ch"></div><div class="v">${ok ? 'Верно!' : 'Не страшно! Правильно:'}</div></div>${ok ? '' : `<b>${esc(it.o[it.a])}</b>`}<span class="small">${esc(it.ex || '')}</span><button class="btn block ${ok ? 'okb' : 'badb'}" id="qn">${i + 1 < items.length ? 'Дальше' : 'Итог'}</button>`;
      o.appendChild(sh); new Character(sh.querySelector('.mini-ch'), 'shefi').react(ok ? 'praise' : 'wrong');
      sh.querySelector('#qn').onclick = async () => { i++; if (i < items.length) draw(); else { const r = await complete(run, score, items.length); resultCard(o, run, { emoji: '🧀', title: score === items.length ? 'Знаток!' : 'Задание пройдено', text: 'Ошибки повтори во «Вкусной книге».', score, max: items.length, pts: r?.points }); } };
    });
  };
  draw();
}

/* ---------------- step: stack / sequence game ---------------- */
function stepStack(run) {
  const d = run.step.data, L = d.items || [], list = d.style === 'list';
  const o = overlay('qburger');
  let lives = 3, idx = 0, mistakes = 0, time = d.time || 60, over = false;
  const tiles = L.map((l, k) => ({ ...l, k })).sort(() => Math.random() - .5);
  o.innerHTML = `<div class="qv-top"><button class="back" id="qx">✕</button><div class="qb-h"><b>${esc(d.title || 'Собери по порядку')}</b><span>${esc(d.hint || '')}</span></div><span class="timer" id="qbt">${time}</span></div>
    <div class="qb-lives" id="qbl">❤️❤️❤️</div>
    <div class="qb-stage ${list ? 'qb-list' : ''}"><div class="qb-stack" id="qbs">${list ? '' : '<div class="qb-plate"></div>'}</div><div class="qb-tip" id="qbtip">${list ? 'Что идёт первым?' : 'Начни с основы ↓'}</div><div class="qb-ch" id="qbch"></div></div>
    <div class="qb-tiles ${list ? 'one' : ''}">${tiles.map((t) => `<button class="qb-tile" data-k="${t.k}" data-g="${esc(t.g || 'k' + t.k)}">${list ? '' : `<i class="ly ${esc(t.c || '')}"></i>`}<span>${esc(t.n)}</span></button>`).join('')}</div>`;
  const stack = o.querySelector('#qbs'), tip = o.querySelector('#qbtip'), g = window.gsap;
  const bc = new Character(o.querySelector('#qbch'), 'shefi', 'focus');
  const tm = setInterval(() => { if (over) return clearInterval(tm); time--; o.querySelector('#qbt').textContent = time; if (time <= 0) end(); }, 1000);
  o.querySelector('#qx').onclick = () => { over = true; clearInterval(tm); close(run); };
  o.querySelectorAll('.qb-tile').forEach((b) => b.onclick = () => {
    if (over) return;
    const want = L[idx], k = +b.dataset.k, ok = k === idx || (want.g && b.dataset.g === want.g);
    if (ok) {
      const el = document.createElement(list ? 'div' : 'i');
      if (list) { el.className = 'qb-step'; el.innerHTML = `<span>${idx + 1}</span>${esc(L[idx].n)}`; } else { el.className = 'ly big ' + (L[idx].c || ''); el.style.zIndex = 10 + idx; }
      stack.appendChild(el);
      if (g) g.from(el, list ? { x: -40, opacity: 0, duration: .35, ease: 'back.out(1.7)' } : { y: -260, opacity: 0, duration: .45, ease: 'bounce.out' });
      b.disabled = true; b.classList.add('used'); idx++;
      tip.textContent = idx < L.length ? `Готово: ${idx} из ${L.length}` : 'Готово! 🔥';
      bc.react(idx === L.length ? 'victory' : idx % 3 === 0 ? 'joy' : 'focus');
      if (idx === L.length) setTimeout(end, 600);
    } else {
      mistakes++; lives--; o.querySelector('#qbl').textContent = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(3 - Math.max(0, lives));
      if (g) g.fromTo(b, { x: -8 }, { x: 8, duration: .06, yoyo: true, repeat: 5, onComplete: () => g.set(b, { x: 0 }) });
      tip.textContent = `Не то. Подсказка: следующим — «${L[idx].n.toLowerCase()}»`; bc.react('hint');
      if (lives <= 0) end();
    }
  });
  async function end() {
    if (over) return; over = true; clearInterval(tm);
    const score = Math.max(0, idx - mistakes), r = await complete(run, score, L.length);
    resultCard(o, run, { emoji: idx === L.length ? '🔥' : '⏱️', title: idx === L.length ? 'Собрано!' : 'Почти получилось', text: `Готово: ${idx} из ${L.length}, ошибок: ${mistakes}. ${d.done || ''}`, score, max: L.length, pts: r?.points });
  }
}

/* ---------------- step: guest dialogue ---------------- */
const FACES = ['😡', '😠', '😐', '🙂', '😊', '🤩'];
function stepDialogue(run) {
  const d = run.step.data, T = d.turns || [];
  const o = overlay('qguest');
  let i = 0, score = 0, mood = 1;
  const draw = () => {
    const st = T[i];
    o.innerHTML = `<div class="qv-top"><button class="back" id="qx">✕</button><div class="segs">${T.map((x, k) => `<i class="${k < i ? 'ok' : k === i ? 'cur' : ''}"></i>`).join('')}</div></div>
      ${run.title && i === 0 ? `<div class="h2" style="text-align:center">${esc(run.title)}</div>` : ''}
      <div class="qg-scene"><div class="qg-guest"><div class="qg-face" id="qgf">${FACES[mood]}</div><div class="qg-meter"><i style="width:${mood * 20}%"></i></div><span class="small muted">Настроение гостя</span></div>
        <div class="qg-say"><span class="small muted">${esc(d.who || 'Гость')}</span><b>${esc(st.g)}</b></div></div>
      <div class="qg-opts">${st.o.map((x, k) => `<button class="opt" data-k="${k}"><span class="k">${'АБВГ'[k]}</span><span>${esc(x.t)}</span></button>`).join('')}</div>`;
    o.querySelector('#qx').onclick = () => close(run);
    o.querySelectorAll('.opt').forEach((b) => b.onclick = () => {
      const x = st.o[+b.dataset.k], s = +x.s || 0; score += s;
      mood = Math.min(5, Math.max(0, mood + (s === 2 ? 1 : s === 1 ? 0 : -1) + (i === T.length - 1 && s === 2 ? 1 : 0)));
      o.querySelectorAll('.opt').forEach((y) => (y.disabled = true));
      b.classList.add(s === 2 ? 'ok' : 'bad');
      const f = o.querySelector('#qgf'); f.textContent = FACES[mood];
      if (window.gsap) window.gsap.fromTo(f, { scale: .6 }, { scale: 1, duration: .45, ease: 'elastic.out(1,.4)' });
      o.querySelector('.qg-meter i').style.width = mood * 20 + '%';
      o.querySelector('.qg-say b').textContent = x.r || '…';
      const sh = document.createElement('div'); sh.className = 'sheet ' + (s === 2 ? 'ok' : 'bad');
      sh.innerHTML = `<div class="row" style="align-items:flex-end"><div class="mini-ch"></div><div><div class="v">${s === 2 ? 'Шефи: так держать!' : s === 1 ? 'Шефи: можно лучше' : 'Шефи: так не надо'}</div><span class="small">${esc(x.f || '')}</span></div></div><button class="btn block ${s === 2 ? 'okb' : 'badb'}" id="qn">${i + 1 < T.length ? 'Дальше' : 'Итог'}</button>`;
      o.appendChild(sh); new Character(sh.querySelector('.mini-ch'), 'shefi').react(s === 2 ? 'praise' : 'wrong');
      sh.querySelector('#qn').onclick = async () => { i++; if (i < T.length) draw(); else { const max = T.length * 2, r = await complete(run, score, max);
        resultCard(o, run, { emoji: FACES[mood], title: mood >= 4 ? 'Гость доволен' : 'Гость остался недоволен', text: d.summary || '', score, max, pts: r?.points }); } };
    });
  };
  draw();
}

/* ---------------- finish ---------------- */
async function stepFinish(run) {
  const { ctx, quest } = run, o = overlay('qfinish');
  const { data: a } = await ctx.sb.from('achievements').select('*').eq('user_id', ctx.S.me.id).eq('code', 'quest:' + quest.id).maybeSingle();
  o.innerHTML = `<div class="qres"><div class="qmedal">🎖️</div><div class="h1">${esc(quest.badge || quest.title)}!</div>
    <p class="muted">${a ? 'Награда уже в твоём профиле.' : 'Награда появится, когда все точки будут пройдены.'}</p><div class="qg-chefi big" id="qfc"></div>
    <div class="row" style="width:100%"><a class="btn ghost" style="flex:1" href="#/me">В профиль</a><a class="btn gold" style="flex:1" href="#/home">На главную</a></div></div>`;
  const m = new Character(o.querySelector('#qfc'), 'shefi', 'calm'); setTimeout(() => m.react('victory'), 300);
  ctx.confetti(); setTimeout(ctx.confetti, 900);
  if (window.gsap) window.gsap.from(o.querySelector('.qmedal'), { scale: 0, rotate: -180, duration: .9, ease: 'back.out(1.8)' });
  o.querySelectorAll('a').forEach((x) => x.addEventListener('click', () => o.remove()));
}

const RUN = { video: stepVideo, quiz: stepQuiz, stack: stepStack, dialogue: stepDialogue };
