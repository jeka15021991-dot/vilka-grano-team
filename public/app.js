import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

import { vQuest, vSim, questCard, loadDone, loadQuests } from './quest.js';
import { Character, coach, closeCoach, MOODS, CAST, whoFor } from './characters.js';
import { vTeam, feedUnread } from './team.js';
import { vCompete, aCompete, compeSummary } from './compete.js';
import { vShift } from './lead.js';
import { importStaff } from './importer.js';
import { aMaterials, videoEmbed } from './materials.js';
import { mountDaily } from './daily.js';
import { vBuild, vSpot, aSpot } from './games.js';
import { vPath, aCerts } from './path.js';
import { mountStories, gamesRow, mountFeedPreview } from './home.js';
import { aDash, aControl, aAssign, homeAssignments, bindHomeAssignments, homeBrief, publicBrief, homeSummary, bindHomeSummary } from './control.js';

const SB_URL = 'https://qapsxeriquyidfxgtccj.supabase.co';
const SB_KEY = 'sb_publishable_pkhdRyL8FhjAHaKgXmuh6Q_Oi0zlZ9S';
const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

const CONTACT = { who: 'Евгения Борисовна, сервис-менеджер VILKA и GRANO', tel: '8 777 521 89 09' };
const LEVELS = [[0, 'Новичок', '🌱'], [150, 'Стажёр', '🍽️'], [400, 'Знаток', '📖'], [800, 'Профи', '⭐'], [1500, 'Эксперт', '🔥'], [2500, 'Гуру', '👑']];
const POS = { waiter: 'Официант', bartender: 'Бармен', hostess: 'Хостес', manager: 'Администратор' };
const REASON = { shop: 'Магазин наград', refund: 'Возврат баллов', quest: 'Квест: этап', quest_done: 'Квест пройден', lesson: 'Урок изучен', item: 'Новый верный ответ', review: 'Повторение', quiz: 'Квиз пройден', test: 'Тест сдан', day: 'Активный день', review_done: 'Повторение дня', speed: 'Блиц', bonus: 'Бонус', thanks: 'Рахмет от коллеги', challenge: 'Задание выполнено', daily: 'Вопрос дня', exam: 'Аттестация', game_build: 'Игра «Собери блюдо»', game_spot: 'Игра «Найди ошибку»', review_done: 'Повторение дня', birthday: 'Подарок на день рождения' };

const $app = document.getElementById('app');
const $tabs = document.getElementById('tabs');
const S = { me: null, concept: null, rests: [], blocks: [], stats: null, book: {}, covers: {}, today: 0, quest: new Set(), ach: [] };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const h = (strings, ...vals) => strings.reduce((a, s, i) => a + s + (i < vals.length ? vals[i] : ''), '');
const isAdmin = () => S.me?.role === 'admin';
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function normPhone(p) { let d = String(p || '').replace(/\D/g, ''); if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1); if (d.length === 10) d = '7' + d; return d; }
const fmtPhone = (d) => d && d.length === 11 ? `8 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}` : d;
function toast(t) { const el = document.getElementById('toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 2600); }
function plus(n) { if (!n) return; const el = document.createElement('div'); el.className = 'plus'; el.textContent = '+' + n; document.body.appendChild(el); setTimeout(() => el.remove(), 1100); }
function confetti() {
  const box = document.createElement('div'); box.className = 'confetti';
  const cols = ['#e0731f', '#f2b23a', '#2f9e5b', '#6f7340', '#c9952f', '#d4483b'];
  for (let i = 0; i < 70; i++) { const c = document.createElement('i'); c.style.left = Math.random() * 100 + 'vw'; c.style.background = cols[i % cols.length]; c.style.animationDuration = 1.6 + Math.random() * 1.6 + 's'; c.style.animationDelay = Math.random() * .4 + 's'; box.appendChild(c); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 3600);
}
function ask(text, yes = 'Да', danger = false) {
  return new Promise((res) => {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="card stack"><b>${esc(text)}</b><div class="row"><button class="btn ghost" style="flex:1" data-a="0">Отмена</button><button class="btn" style="flex:1;${danger ? 'background:var(--bad)' : ''}" data-a="1">${esc(yes)}</button></div></div>`;
    m.onclick = (e) => { const a = e.target.closest('[data-a]'); if (a || e.target === m) { m.remove(); res(a?.dataset.a === '1'); } };
    document.body.appendChild(m);
  });
}
function level(p) { let i = 0; while (i + 1 < LEVELS.length && p >= LEVELS[i + 1][0]) i++; const cur = LEVELS[i], nx = LEVELS[i + 1]; return { i, name: cur[1], icon: cur[2], next: nx, pct: nx ? Math.round(100 * (p - cur[0]) / (nx[0] - cur[0])) : 100 }; }
const IC = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8l10-5 10 5-10 5z"/><path d="M6 10v5c3 3 9 3 12 0v-5"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/></svg>',
  rating: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
  me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
  team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.4 3.6 5.2"/></svg>',
  shift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 11l2 2 4-4M9 17h6"/></svg>',
  admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
};

/* ---------------- boot & auth ---------------- */
function setConcept(c) {
  S.concept = c; document.documentElement.dataset.concept = c;
  document.querySelector('meta[name=theme-color]').content = c === 'grano' ? '#f3f2ec' : '#15100c';
  document.title = 'Команда ' + (c === 'grano' ? 'GRANO' : 'VILKA');
}

async function boot() {
  const q = new URLSearchParams(location.search).get('c');
  setConcept(q === 'grano' ? 'grano' : (localStorage.getItem('vg_concept') || 'vilka'));
  const pb = location.hash.match(/^#\/brief\/(\w+)/);
  if (pb) { $tabs.hidden = true; return publicBrief(sb, pb[1], $app); }
  const { data } = await sb.auth.getSession();
  if (!data.session) return renderLogin();
  await afterLogin();
}

function renderLogin(err) {
  $tabs.hidden = true; $app.className = ''; document.body.classList.remove('playing');
  const g = S.concept === 'grano';
  $app.innerHTML = h`
  <form class="login" id="lf" autocomplete="on">
    <div class="login-art"><div class="rings"></div>
      <div class="mark">${g ? 'GRANO' : 'Vilka'}<small>Команда: учимся, играем, растём</small></div></div>
    <div class="stack">
      <input id="ph" type="tel" inputmode="tel" autocomplete="username" placeholder="Номер телефона" aria-label="Номер телефона" required>
      <input id="cd" type="password" inputmode="numeric" autocomplete="current-password" placeholder="Личный код из 6 цифр" aria-label="Личный код" required>
      ${err ? `<div class="err">${esc(err)}</div>` : ''}
      <button class="btn block" id="lb">Войти</button>
    </div>
    <p class="small muted">Код выдаёт сервис-менеджер. Забыли код — позвоните ${CONTACT.tel}. <a href="?c=${g ? 'vilka' : 'grano'}" class="muted">${g ? 'Я из VILKA' : 'Я из GRANO'}</a></p>
  </form>`;
  document.getElementById('lf').onsubmit = async (e) => {
    e.preventDefault();
    const phone = normPhone(document.getElementById('ph').value), code = document.getElementById('cd').value.trim();
    if (phone.length !== 11) return renderLogin('Проверьте номер телефона');
    document.getElementById('lb').disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: phone + '@staff.vilka-grano.team', password: code });
    if (error) return renderLogin(/banned/i.test(error.message) ? 'Доступ отключён' : 'Неверный номер или код');
    await afterLogin();
  };
}

async function afterLogin() {
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return renderLogin();
  const { data: me } = await sb.from('profiles').select('*').eq('id', u.user.id).single();
  if (!me || !me.active) { await sb.auth.signOut(); return renderLogin('Доступ отключён'); }
  S.me = me;
  const { data: rs } = await sb.from('restaurants').select('*').order('sort'); S.rests = rs || [];
  setConcept(isAdmin() ? (localStorage.getItem('vg_concept') || me.concept || 'grano') : me.concept);
  sb.rpc('touch');
  await loadBase();
  window.onhashchange = route;
  route();
}

async function loadBase() {
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const [b, st, cv, td] = await Promise.all([
    sb.from('blocks').select('*').eq('concept', S.concept).eq('enabled', true).order('sort'),
    sb.rpc('my_stats', { p_concept: S.concept }),
    sb.from('kb_cards').select('block_id,photo,sort').eq('concept', S.concept).not('photo', 'is', null).order('sort'),
    sb.from('points_ledger').select('amount').eq('user_id', S.me.id).gte('created_at', t0.toISOString()),
  ]);
  S.blocks = (b.data || []).filter((x) => isAdmin() || !x.custom || ((!x.positions?.length || x.positions.includes(S.me.position)) && (!x.restaurant_id || x.restaurant_id === S.me.restaurant_id)));
  S.blocks.sort((a, z) => (z.custom && isNew(z) ? 1 : 0) - (a.custom && isNew(a) ? 1 : 0)); S.stats = st.data || { total: 0, month: 0, streak: 0, due: 0, blocks: {}, questions: {} };
  S.covers = {}; S.blocks.forEach((x) => { if (x.cover) S.covers[x.id] = x.cover; });
  (cv.data || []).forEach((c) => { if (!S.covers[c.block_id]) S.covers[c.block_id] = c.photo; });
  S.today = (td.data || []).reduce((a, x) => a + x.amount, 0);
  const L = level(S.stats.total);
  if (S.lv != null && S.lvConcept === S.concept && L.i > S.lv) setTimeout(() => coach({ concept: S.concept, center: true, mood: 'victory', text: `Новый уровень: ${L.icon} ${L.name}! Ты растёшь — так держать.`, actions: [{ label: 'Ура!' }] }), 700);
  S.lv = L.i; S.lvConcept = S.concept;
  S.quests = await loadQuests(sb, S.concept); S.mainQuest = S.quests.find((q) => q.kind === 'quest');
  S.quest = await loadDone(sb, S.me.id, S.mainQuest?.id);
  const { data: ach } = await sb.from('achievements').select('*').eq('user_id', S.me.id); S.ach = ach || [];
  S.unread = await feedUnread(sb, S.concept);
}

function tabs(cur) {
  const t = [['home', 'Главная'], ['learn', 'Обучение'], ['team', 'Команда'], ['book', 'Книга'], ['me', 'Профиль']];
  if (isAdmin()) t.push(['admin', 'Кабинет']);
  if (S.me.role === 'lead') t.splice(1, 0, ['shift', 'Смена']);
  $tabs.hidden = false;
  $tabs.innerHTML = t.map(([k, n]) => `<a href="#/${k}" class="${cur === k ? 'on' : ''}">${IC[k]}<span>${n}</span>${k === 'team' && S.unread && cur !== 'team' ? `<i class="dotn">${S.unread > 9 ? '9+' : S.unread}</i>` : ''}</a>`).join('');
}

async function route() {
  if (!S.me) return renderLogin();
  closeCoach();
  const p = (location.hash || '#/home').slice(2).split('/');
  const r = p[0] || 'home';
  $app.className = r === 'admin' ? 'wide' : '';
  document.querySelector('.bookframe')?.remove(); document.querySelectorAll('.sheet,.qov').forEach((x) => x.remove()); document.body.classList.remove('playing', 'questing');
  window.scrollTo(0, 0);
  try {
    if (r === 'home') { tabs('home'); return await vHome(); }
    if (r === 'learn') { tabs('learn'); return await vLearn(); }
    if (r === 'block') { tabs('learn'); return await vBlock(decodeURIComponent(p[1])); }
    if (r === 'lesson') { tabs('learn'); return await vLesson(decodeURIComponent(p[1])); }
    if (r === 'play') { tabs(p[2] ? 'learn' : 'home'); return await vPlay(p[1], p[2] ? decodeURIComponent(p[2]) : null); }
    if (r === 'shop') { tabs('home'); return await vShop(p[1]); }
    if (r === 'games') { tabs('home'); return await vGames(); }
    if (r === 'path') { tabs('me'); return await vPath(ctx()); }
    if (r === 'game') { $tabs.hidden = true; return await (p[1]?.startsWith('spot') ? vSpot(ctx()) : vBuild(ctx())); }
    if (r === 'quest') { $tabs.hidden = true; return await vQuest(ctx(), p[1] ? decodeURIComponent(p[1]) : S.mainQuest?.id); }
    if (r === 'sim') { $tabs.hidden = true; return await vSim(ctx(), decodeURIComponent(p[1])); }
    if (r === 'book') { tabs('book'); return await vBook(p[1]); }
    if (r === 'shift' && S.me.role === 'lead') { tabs('shift'); return await vShift(ctx()); }
    if (r === 'team') { tabs('team'); return await vTeam(ctx()); }
    if (r === 'compete') { tabs('team'); return await vCompete(ctx()); }
    if (r === 'rating') { tabs('team'); return await vRating(p[1] || 'month'); }
    if (r === 'me') { tabs('me'); return await vMe(); }
    if (r === 'admin' && isAdmin()) { tabs('admin'); return await vAdmin(p[1] || 'dash', p[2] ? decodeURIComponent(p[2]) : undefined); }
    location.hash = '#/home';
  } catch (e) { console.error(e); $app.innerHTML = `<div class="card stack"><b>Что-то пошло не так</b><p class="muted small">${esc(e.message || e)}</p><a class="btn" href="#/home">На главную</a></div>`; }
}

/* ---------------- home ---------------- */
const GOAL = 30;
function isNew(b) { return b.custom && b.created_at && Date.now() - new Date(b.created_at) < 14 * 864e5; }
const initials = (n) => String(n || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const pctOf = (id) => { const s = S.stats.blocks[id] || {}; return (s.lesson ? 34 : 0) + ((s.quiz || 0) >= 60 ? 33 : 0) + (s.passed ? 33 : 0); };
const EMO = ['🍽️', '🥩', '🍔', '🥗', '🍲', '🍕', '🍝', '🧀', '🍰', '🍺', '🍹', '☕'];
function plateImg(b, i) { const c = S.covers[b.id]; return c ? `<img src="${esc(c)}" alt="" loading="lazy">` : EMO[i % EMO.length]; }
function nextBlock() {
  const st = S.stats.blocks || {};
  return S.blocks.find((b) => (S.stats.questions[b.id] || 0) > 0 && !st[b.id]?.passed)
    || S.blocks.find((b) => !st[b.id]?.lesson) || null;
}
function hello() { const hr = new Date().getHours(); return hr < 5 ? 'Доброй ночи' : hr < 12 ? 'Доброе утро' : hr < 18 ? 'Добрый день' : 'Добрый вечер'; }
function topBar() {
  const L = level(S.stats.total);
  return `<div class="top"><a class="ava" href="#/me" style="--p:${L.pct}" aria-label="Профиль"><b>${esc(initials(S.me.full_name))}</b></a>
    <div class="who"><span class="small muted">${L.icon} ${L.name}</span><b>${hello()}, ${esc(S.me.full_name.split(' ')[0])}!</b></div>
    <span class="chip fire" title="Дней подряд">🔥 ${S.stats.streak}</span><a class="chip gem" href="#/shop" title="Баллы на счету">⭐ ${S.stats.balance ?? S.stats.total}</a></div>`;
}
async function vHome() {
  const s = S.stats, nb = nextBlock();
  const gp = Math.min(100, Math.round(100 * S.today / GOAL));
  const firstName = S.me.full_name.split(' ')[0];
  const cover = nb ? S.covers[nb.id] : Object.values(S.covers)[0];
  const hero = `<a class="hero2" href="${nb ? '#/block/' + encodeURIComponent(nb.id) : '#/play/speed'}">${cover ? `<img src="${esc(cover)}" alt="">` : ''}
      <div class="h2-ring ring" style="--p:${gp}"><span>${S.today}<small>/${GOAL}</small></span></div>
      <span class="k">${nb ? (s.blocks[nb.id] || {}).lesson ? 'Продолжить обучение' : 'Следующий раздел' : `${firstName}, всё пройдено`} · ${nb ? stepText(nb.id) : 'ты знаешь меню лучше всех'}</span>
      <span class="t">${nb ? esc(nb.title) : 'Сыграй в блиц'}</span>
      <span class="h2-row"><span class="btn gold">${nb ? ((s.blocks[nb.id] || {}).lesson ? 'Продолжить' : 'Начать') : 'Играть'} ›</span><small>${gp >= 100 ? 'Цель дня выполнена 🎉' : `Цель дня: ещё ${GOAL - S.today} баллов`}</small></span></a>`;
  $app.innerHTML = h`
  <div class="stack home2">
    ${topBar()}
    ${isAdmin() ? conceptSwitch() : ''}
    <div class="stories" id="stories"><span class="st sk"></span><span class="st sk"></span><span class="st sk"></span><span class="st sk"></span></div>
    <div id="bdband"></div>
    ${hero}
    <div class="quick">
      <a href="#/learn"><span>🎓</span>Учиться</a><a href="#/book"><span>📖</span>Книга</a><a href="#/rating"><span>🏆</span>Рейтинг</a><a href="#/shop"><span>🎁</span>Магазин</a>
    </div>
    <div id="daily"></div>
    <div class="sec-t"><span class="h2">Играть</span><a href="#/games">Все игры</a></div>
    ${gamesRow(S)}
    <div class="sec-t"><span class="h2">Команда</span><a href="#/team">Лента${S.unread ? ` <i class="dotn" style="position:static;display:inline-grid">${S.unread > 9 ? '9+' : S.unread}</i>` : ''}</a></div>
    <div class="fprev" id="fprev"><div class="spin" style="width:24px;height:24px"></div></div>
  </div>`;
  if (!tour()) greetDaily(nb);
  bindConceptSwitch();
  mountStories(ctx(), document.getElementById('stories'), document.getElementById('bdband'));
  mountDaily(ctx(), document.getElementById('daily'), true);
  mountFeedPreview(ctx(), document.getElementById('fprev'));
  if (window.gsap) window.gsap.from('.hero2, .quick a, .gc', { y: 18, opacity: 0, stagger: 0.04, duration: 0.4, ease: 'power2.out', clearProps: 'all' });
}
const TOUR = [
  { mood: 'invite', t: 'Привет, NAME!', x: 'Я Шефи — твой наставник. За минуту покажу, как здесь всё устроено.' },
  { mood: 'hint', t: '🎓 Учиться', x: 'Каждая тарелка — раздел меню. Проходишь урок, потом квиз и тест. Ошибки вернутся на повторение через 1, 3 и 7 дней — так всё запомнится.' },
  { mood: 'joy', t: '🎮 Играть', x: 'Квесты, блиц на 60 секунд и игры. Чем точнее и быстрее — тем больше баллов.' },
  { mood: 'praise', t: '🏆 Баллы и рейтинг', x: 'Баллы поднимают уровень и место в рейтинге. Цель дня — 30 баллов. Занимайся каждый день, чтобы не прервать серию 🔥.' },
  { mood: 'victory', t: 'Готов?', x: 'Начнём с первого раздела. Я буду рядом с подсказками!' },
];
function tour(force) {
  const k = 'vg_tour_' + S.me.id;
  try { if (!force && localStorage.getItem(k)) return false; localStorage.setItem(k, '1'); localStorage.setItem('vg_hi_' + S.me.id + '_' + S.concept + '_' + new Date().toDateString(), '1'); } catch (e) { if (!force) return false; }
  const o = document.createElement('div'); o.className = 'tour';
  document.body.appendChild(o);
  let i = 0, ch = null;
  const draw = () => {
    const st = TOUR[i], last = i === TOUR.length - 1;
    o.innerHTML = `<div class="tour-in"><button class="tour-skip">${last ? '' : 'Пропустить'}</button>
      <div class="tour-ch"></div>
      <div class="tour-card"><div class="h1">${st.t.replace('NAME', esc(S.me.full_name.split(' ')[0]))}</div><p>${st.x}</p></div>
      <div class="tour-dots">${TOUR.map((x, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <button class="btn block gold" id="tnext">${last ? 'Поехали!' : 'Дальше'}</button></div>`;
    if (ch) ch.destroy();
    ch = new Character(o.querySelector('.tour-ch'), 'shefi', st.mood);
    if (i === 0) ch.enter('bottom').then(() => ch.react(st.mood)); else ch.react(st.mood);
    if (window.gsap) window.gsap.from(o.querySelector('.tour-card'), { y: 24, opacity: 0, duration: .35, ease: 'back.out(1.6)' });
    if (last) confetti();
    o.querySelector('#tnext').onclick = () => { if (last) return close(); i++; draw(); };
    o.querySelector('.tour-skip').onclick = close;
  };
  const close = () => { if (ch) ch.destroy(); o.remove(); const nb = nextBlock(); if (nb && !force) location.hash = '#/block/' + encodeURIComponent(nb.id); };
  draw();
  return true;
}
const OST = { new: ['Оформлен', 'acc'], ready: ['Можно забрать', 'ok'], issued: ['Выдан', ''], cancelled: ['Отменён, баллы вернулись', ''] };
async function vShop(sub) {
  const [{ data: items }, { data: orders }] = await Promise.all([
    sb.from('rewards').select('*').eq('active', true).or(`concept.is.null,concept.eq.${S.concept}`).order('sort'),
    sb.from('orders').select('*').eq('user_id', S.me.id).order('created_at', { ascending: false }).limit(30),
  ]);
  const bal = S.stats.balance ?? S.stats.total;
  const ordersHtml = (orders || []).length ? orders.map((o) => `<div class="ord"><span class="e">${esc(o.icon || '🎁')}</span><div class="t"><b>${esc(o.title)}</b><small>${new Date(o.created_at).toLocaleDateString('ru-RU')} · ⭐ ${o.price}</small></div>
      <div class="c">${o.status === 'new' || o.status === 'ready' ? `<span class="code4">${o.code}</span>` : ''}<span class="pill ${OST[o.status][1]}">${OST[o.status][0]}</span></div></div>`).join('') : '<p class="muted">Заказов пока нет.</p>';
  if (sub === 'orders') {
    $app.innerHTML = `<div class="stack"><div class="row"><a class="back" href="#/shop">‹</a><div class="h1">Мои заказы</div></div>
      <p class="small muted">Покажите код сервис-менеджеру, когда заказ будет «Можно забрать».</p>${ordersHtml}</div>`;
    return;
  }
  $app.innerHTML = h`<div class="stack">
    <div class="row"><a class="back" href="#/home">‹</a><div class="h1">Магазин наград</div></div>
    <div class="shophead"><div><small>На счету</small><b>⭐ ${bal}</b></div><div class="shop-ch" id="shch"></div></div>
    <div class="rewards">${(items || []).map((r) => {
      const can = bal >= r.price && (r.stock == null || r.stock > 0);
      return `<div class="rw ${can ? '' : 'off'}"><span class="e">${esc(r.icon || '🎁')}</span><b>${esc(r.title)}</b>${r.descr ? `<small>${esc(r.descr)}</small>` : ''}
        ${r.stock != null ? `<small class="muted">Осталось: ${r.stock}</small>` : ''}
        <button class="btn sm ${can ? 'gold' : 'ghost'}" data-buy="${r.id}" ${can ? '' : 'disabled'}>⭐ ${r.price}</button>
        ${!can && r.stock !== 0 ? `<small class="need">ещё ${r.price - bal}</small>` : ''}</div>`;
    }).join('') || '<p class="muted">Призы скоро появятся.</p>'}</div>
    <div class="sec-t"><span class="h2">Мои заказы</span><a href="#/shop/orders">Все</a></div>
    ${(orders || []).slice(0, 3).length ? (orders || []).slice(0, 3).map((o) => `<div class="ord"><span class="e">${esc(o.icon || '🎁')}</span><div class="t"><b>${esc(o.title)}</b><small>${new Date(o.created_at).toLocaleDateString('ru-RU')}</small></div><div class="c">${o.status === 'new' || o.status === 'ready' ? `<span class="code4">${o.code}</span>` : ''}<span class="pill ${OST[o.status][1]}">${OST[o.status][0]}</span></div></div>`).join('') : '<p class="muted small">Заказов пока нет.</p>'}
  </div>`;
  const ch = new Character(document.getElementById('shch'), 'shefi', 'invite');
  document.querySelectorAll('[data-buy]').forEach((b) => b.onclick = async () => {
    const r = items.find((x) => x.id === +b.dataset.buy);
    if (!(await ask(`Обменять ⭐ ${r.price} на «${r.title}»?`, 'Обменять'))) return;
    b.disabled = true;
    const { data, error } = await sb.rpc('buy_reward', { p_reward: r.id });
    if (error || data.error) { toast(error ? 'Нет связи, попробуйте ещё раз' : data.error); ch.react('wrong'); b.disabled = false; return; }
    await loadBase(); confetti();
    coach({ concept: S.concept, center: true, mood: 'victory', text: `Готово! «${r.title}» твой. Код получения: ${data.code}. Покажи его сервис-менеджеру, когда заказ будет «Можно забрать».`, actions: [{ label: 'Отлично!', onClick: () => vShop() }] });
  });
}
const TYPE = { intro: 'Приветствие', video: 'Интерактивное видео', quiz: 'Вопросы с фото', stack: 'Игра «по порядку»', dialogue: 'Диалог с гостем' };
async function aQuests(ab, arg) {
  const { data: all } = await sb.from('quests').select('*').order('kind').order('sort');
  const list = (all || []).filter((q) => !q.concept || q.concept === S.concept);
  if (arg) { const [qid, sid] = arg.split('~'); const q = (all || []).find((x) => x.id === qid); return dlgEditor(ab, q || null, sid); }
  ab.innerHTML = h`<p class="muted">Квесты и симуляторы ${S.concept === 'grano' ? 'GRANO' : 'VILKA'}. Диалоги с гостем можно писать и править здесь — без программирования.</p>
    <button class="btn" id="newsim">+ Новый симулятор «ситуация с гостем»</button>
    ${list.map((q) => `<div class="card stack" style="gap:10px"><div class="row between"><div><b>${esc(q.title)}</b><div class="small muted">${q.kind === 'quest' ? 'Квест' : 'Симулятор'} · ${q.concept ? q.concept.toUpperCase() : 'все'}</div></div>
      <label class="switch"><input type="checkbox" data-act="${esc(q.id)}" ${q.active ? 'checked' : ''}> показывать</label></div>
      <div class="stack" style="gap:6px">${q.steps.map((st) => `<div class="row between small"><span>${esc(st.ic || '')} ${esc(st.zone || '')} — ${TYPE[st.type] || st.type} · ${st.pts || 0} баллов</span>${st.type === 'dialogue' ? `<a class="btn sm ghost" href="#/admin/quests/${encodeURIComponent(q.id + '~' + st.id)}">Редактировать</a>` : ''}</div>`).join('')}</div>
      <div><a class="btn sm" href="#/${q.kind === 'quest' ? 'quest' : 'sim'}/${encodeURIComponent(q.id)}">Пройти</a></div></div>`).join('')}`;
  ab.querySelectorAll('[data-act]').forEach((c) => c.onchange = async () => { const { error } = await sb.from('quests').update({ active: c.checked }).eq('id', c.dataset.act); toast(error ? error.message : c.checked ? 'Показывается сотрудникам' : 'Скрыто'); });
  document.getElementById('newsim').onclick = () => dlgEditor(ab, null, null);
}
function dlgEditor(ab, q, sid) {
  const isNew = !q, step = q ? q.steps.find((x) => x.id === (sid || 'guest')) : null;
  const d = step ? JSON.parse(JSON.stringify(step.data)) : { who: 'Гость, стол 1', summary: '', turns: [{ g: '', o: [{ t: '', s: 2, r: '', f: '' }, { t: '', s: 1, r: '', f: '' }, { t: '', s: 0, r: '', f: '' }] }] };
  let title = q ? q.title : '', subtitle = q ? q.subtitle || '' : '', concept = q ? q.concept : S.concept;
  const SC = [[2, '✅ Лучший ответ'], [1, '🟡 Неплохо'], [0, '❌ Ошибка']];
  const draw = () => {
    ab.innerHTML = h`<a class="back" href="#/admin/quests">‹</a>
      <div class="h2">${isNew ? 'Новый симулятор' : esc(q.title)} ${step && q.kind === 'quest' ? '· диалог в квесте' : ''}</div>
      <div class="card stack">
        ${isNew || q.kind === 'sim' ? `<div class="grid2"><input id="dt" placeholder="Название, например «Гость просит счёт раньше»" value="${esc(title)}"><input id="ds" placeholder="Подзаголовок" value="${esc(subtitle)}">
          <select id="dc"><option value="grano" ${concept === 'grano' ? 'selected' : ''}>GRANO</option><option value="vilka" ${concept === 'vilka' ? 'selected' : ''}>VILKA</option></select></div>` : ''}
        <div class="grid2"><input id="dw" placeholder="Кто гость, например «Гость, стол 4»" value="${esc(d.who || '')}"></div>
        <textarea id="dsum" rows="2" placeholder="Вывод в конце: как правильно действовать">${esc(d.summary || '')}</textarea>
      </div>
      ${d.turns.map((t, i) => `<div class="card stack" data-t="${i}"><div class="row between"><b>Шаг ${i + 1}</b>${d.turns.length > 1 ? `<button class="btn sm ghost" data-del="${i}">Удалить шаг</button>` : ''}</div>
        <textarea data-f="g" rows="2" placeholder="Что говорит гость">${esc(t.g)}</textarea>
        ${t.o.map((o, k) => `<div class="stack opt-ed" data-o="${k}" style="gap:6px;border-left:4px solid ${o.s == 2 ? 'var(--ok)' : o.s == 1 ? 'var(--acc2)' : 'var(--bad)'};padding-left:10px">
          <div class="row"><select data-f="s" style="max-width:190px">${SC.map(([v, l]) => `<option value="${v}" ${+o.s === v ? 'selected' : ''}>${l}</option>`).join('')}</select><span class="small muted">Вариант ${'АБВГ'[k]}</span></div>
          <textarea data-f="t" rows="2" placeholder="Ответ официанта">${esc(o.t)}</textarea>
          <input data-f="r" placeholder="Реакция гостя" value="${esc(o.r || '')}"><input data-f="f" placeholder="Пояснение Шефи: почему так или как лучше" value="${esc(o.f || '')}"></div>`).join('')}
      </div>`).join('')}
      <div class="row"><button class="btn ghost" id="addt">+ Шаг диалога</button><button class="btn" id="save">Сохранить</button></div>`;
    const collect = () => {
      title = ab.querySelector('#dt')?.value ?? title; subtitle = ab.querySelector('#ds')?.value ?? subtitle; concept = ab.querySelector('#dc')?.value ?? concept;
      d.who = ab.querySelector('#dw').value; d.summary = ab.querySelector('#dsum').value;
      ab.querySelectorAll('[data-t]').forEach((tc) => { const t = d.turns[+tc.dataset.t]; t.g = tc.querySelector('[data-f="g"]').value;
        tc.querySelectorAll('[data-o]').forEach((oc) => { const o = t.o[+oc.dataset.o]; o.s = +oc.querySelector('[data-f="s"]').value; o.t = oc.querySelector('[data-f="t"]').value; o.r = oc.querySelector('[data-f="r"]').value; o.f = oc.querySelector('[data-f="f"]').value; }); });
    };
    ab.querySelector('#addt').onclick = () => { collect(); d.turns.push({ g: '', o: [{ t: '', s: 2, r: '', f: '' }, { t: '', s: 1, r: '', f: '' }, { t: '', s: 0, r: '', f: '' }] }); draw(); };
    ab.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => { collect(); d.turns.splice(+b.dataset.del, 1); draw(); });
    ab.querySelector('#save').onclick = async () => {
      collect();
      d.turns = d.turns.map((t) => ({ ...t, o: t.o.filter((o) => o.t.trim()) })).filter((t) => t.g.trim() && t.o.length);
      if (!d.turns.length) return toast('Заполните хотя бы один шаг: слова гостя и ответы');
      if (d.turns.some((t) => t.o.length < 2 || !t.o.some((o) => o.s === 2))) return toast('В каждом шаге нужно минимум 2 ответа и один «лучший»');
      if ((isNew || q.kind === 'sim') && !title.trim()) return toast('Введите название');
      let error;
      if (isNew) ({ error } = await sb.from('quests').insert({ id: 'sim-' + Date.now().toString(36), concept, kind: 'sim', title, subtitle, steps: [{ id: 'guest', zone: 'Зал', ic: '💬', type: 'dialogue', pts: 30, data: d }] }));
      else { const steps = q.steps.map((x) => (x.id === step.id ? { ...x, data: d } : x)); ({ error } = await sb.from('quests').update({ steps, ...(q.kind === 'sim' ? { title, subtitle, concept } : {}), updated_at: new Date().toISOString() }).eq('id', q.id)); }
      if (error) return toast(error.message);
      toast('Сохранено'); await loadBase(); location.hash = '#/admin/quests';
    };
  };
  draw();
}
async function aShop(ab) {
  const [{ data: items }, { data: orders }, { data: ppl }] = await Promise.all([
    sb.from('rewards').select('*').order('sort'),
    sb.from('orders').select('*').order('created_at', { ascending: false }).limit(200),
    sb.from('profiles').select('id,full_name,restaurant_id'),
  ]);
  const who = (id) => (ppl || []).find((p) => p.id === id);
  const open = (orders || []).filter((o) => o.status === 'new' || o.status === 'ready');
  const done = (orders || []).filter((o) => !(o.status === 'new' || o.status === 'ready')).slice(0, 30);
  const row = (o) => { const p = who(o.user_id); return `<tr><td><b>${esc(o.icon || '')} ${esc(o.title)}</b><div class="small muted">⭐ ${o.price} · ${new Date(o.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div></td>
    <td>${esc(p?.full_name || '—')}<div class="small muted">${esc(S.rests.find((r) => r.id === p?.restaurant_id)?.name || '')}</div></td><td><span class="code4">${o.code}</span></td>
    <td><span class="pill ${OST[o.status][1]}">${OST[o.status][0]}</span>${o.status === 'new' || o.status === 'ready' ? `<div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px">${o.status === 'new' ? `<button class="btn sm ghost" data-st="ready" data-o="${o.id}">Готов</button>` : ''}<button class="btn sm" data-st="issued" data-o="${o.id}">Выдан</button><button class="btn sm ghost" data-st="cancelled" data-o="${o.id}">Отменить</button></div>` : ''}</td></tr>`; };
  ab.innerHTML = h`
  <div class="row between"><b>Заказы к выдаче: ${open.length}</b><input id="codeq" placeholder="Найти по коду" style="max-width:180px" inputmode="numeric"></div>
  <div class="tw"><table class="t"><tr><th>Приз</th><th>Сотрудник</th><th>Код</th><th>Статус</th></tr>${open.map(row).join('') || '<tr><td colspan="4" class="muted">Открытых заказов нет</td></tr>'}</table></div>
  <details><summary class="small muted">Закрытые заказы (${done.length})</summary><div class="tw"><table class="t">${done.map(row).join('')}</table></div></details>
  <div class="h2">Каталог призов</div>
  <p class="small muted">Цены в баллах. Остаток пустой — без ограничений. Цены и призы — ваше решение, сейчас стоят примеры.</p>
  <div class="tw"><table class="t"><tr><th>Значок</th><th>Приз</th><th>Цена</th><th>Остаток</th><th>Для</th><th>В магазине</th></tr>
  ${(items || []).map((r) => `<tr data-r="${r.id}"><td><input value="${esc(r.icon || '')}" data-f="icon" style="width:58px"></td><td><input value="${esc(r.title)}" data-f="title"><input value="${esc(r.descr || '')}" data-f="descr" placeholder="Описание" style="margin-top:6px"></td>
    <td><input type="number" value="${r.price}" data-f="price" style="width:90px"></td><td><input type="number" value="${r.stock ?? ''}" data-f="stock" style="width:80px"></td>
    <td><select data-f="concept"><option value="">Все</option><option value="grano" ${r.concept === 'grano' ? 'selected' : ''}>GRANO</option><option value="vilka" ${r.concept === 'vilka' ? 'selected' : ''}>VILKA</option></select></td>
    <td><label class="switch"><input type="checkbox" data-f="active" ${r.active ? 'checked' : ''}> да</label></td></tr>`).join('')}</table></div>
  <form class="card stack" id="addr"><b>Добавить приз</b><div class="grid2"><input id="ni" placeholder="Значок, например 🍕" value="🎁"><input id="nt" placeholder="Название" required><input id="np" type="number" placeholder="Цена в баллах" required><input id="ns" type="number" placeholder="Остаток (необязательно)"></div><button class="btn">Добавить</button></form>`;
  ab.querySelectorAll('[data-st]').forEach((b) => b.onclick = async () => {
    if (b.dataset.st === 'cancelled' && !(await ask('Отменить заказ и вернуть баллы сотруднику?', 'Отменить', true))) return;
    const { data, error } = await sb.rpc('set_order_status', { p_order: +b.dataset.o, p_status: b.dataset.st });
    toast(error ? error.message : data.error || ({ ready: 'Отмечено: можно забрать', issued: 'Приз выдан', cancelled: 'Заказ отменён, баллы вернулись' })[b.dataset.st]); aShop(ab);
  });
  ab.querySelector('#codeq').oninput = (e) => { const v = e.target.value.trim(); ab.querySelectorAll('.tw table tr').forEach((tr) => { const c = tr.querySelector('.code4'); if (c) tr.style.display = !v || c.textContent.includes(v) ? '' : 'none'; }); };
  ab.querySelectorAll('[data-r] [data-f]').forEach((inp) => inp.onchange = async () => {
    const id = +inp.closest('[data-r]').dataset.r, f = inp.dataset.f;
    let v = inp.type === 'checkbox' ? inp.checked : inp.value;
    if (f === 'price') v = Math.max(1, parseInt(v) || 1); if (f === 'stock') v = v === '' ? null : Math.max(0, parseInt(v) || 0); if (f === 'concept') v = v || null;
    const { error } = await sb.from('rewards').update({ [f]: v }).eq('id', id); toast(error ? error.message : 'Сохранено');
  });
  ab.querySelector('#addr').onsubmit = async (e) => { e.preventDefault();
    const { error } = await sb.from('rewards').insert({ icon: ni.value || '🎁', title: nt.value, price: Math.max(1, parseInt(np.value) || 1), stock: ns.value === '' ? null : parseInt(ns.value), sort: (items || []).length + 1 });
    toast(error ? error.message : 'Приз добавлен'); aShop(ab); };
}
async function vGames() {
  const vilka = S.concept === 'vilka';
  $app.innerHTML = h`<div class="stack">
    <div class="row"><a class="back" href="#/home">‹</a><div class="h1">Играть</div></div>
    <a class="game g-comp" href="#/compete"><span class="e">⚔️</span><div><b>Соревнования</b><small>Битва ресторанов и задания недели</small></div><span class="go">›</span></a>
    <div class="sec-t"><span class="h2">Квесты</span></div>
    ${S.quests.filter((q) => q.kind === 'quest').map((q) => questCard(q, q.id === S.mainQuest?.id ? S.quest : new Set())).join('') || '<p class="muted">Квесты скоро появятся.</p>'}
    <div class="sec-t"><span class="h2">Симуляторы: гость</span></div>
    ${S.quests.filter((q) => q.kind === 'sim').map((q) => `<a class="game g-sim" href="#/sim/${encodeURIComponent(q.id)}"><span class="e">💬</span><div><b>${esc(q.title)}</b><small>${esc(q.subtitle || 'Ситуация с гостем')}</small></div><span class="go">›</span></a>`).join('') || '<p class="muted">Симуляторы скоро появятся.</p>'}
    <div class="sec-t"><span class="h2">Игры</span></div>
    <a class="game g-speed" href="#/play/speed"><span class="e">⚡</span><div><b>Блиц 60 секунд</b><small>Сколько верных ответов успеешь? До 15 баллов в день</small></div><span class="go">›</span></a>
    <a class="game g-rev" href="#/play/review"><span class="e">🔁</span><div><b>Повторение</b><small>${S.stats.due ? `${S.stats.due} ${plural(S.stats.due, 'вопрос ждёт', 'вопроса ждут', 'вопросов ждут')} повторения` : 'Сейчас повторять нечего'}</small></div><span class="go">›</span></a>
    <a class="game g-build" href="#/game/build"><span class="e">🍔</span><div><b>Собери блюдо</b><small>Фото блюда — выбери, что в нём есть. До 10 баллов в день</small></div><span class="go">›</span></a>
    <a class="game g-spot" href="#/game/spot"><span class="e">🔍</span><div><b>Найди ошибку на фото</b><small>Подача и сервировка: где ошибка? До 10 баллов в день</small></div><span class="go">›</span></a>
  </div>`;
  document.querySelectorAll('.qx-m').forEach((el) => new Character(el, 'shefi', 'invite').react('invite'));
}
function greetDaily(nb) {
  const k = 'vg_hi_' + S.me.id + '_' + S.concept + '_' + new Date().toDateString();
  try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); } catch (e) { return; }
  const name = S.me.full_name.split(' ')[0], who = CAST.shefi.name;
  let text, actions;
  if (S.mainQuest && S.quest.size < S.mainQuest.steps.length) {
    text = `Привет, ${name}! Я ${who}. Сегодня проходим квест «${S.mainQuest.title}». Готов?`;
    actions = [{ label: 'Начать квест', onClick: () => (location.hash = '#/quest/' + encodeURIComponent(S.mainQuest.id)) }, { label: 'Позже' }];
  } else if (nb) {
    text = `Привет, ${name}! Я ${who}. Сегодня изучаем «${nb.title}». Поехали?`;
    actions = [{ label: 'Начать', onClick: () => (location.hash = '#/block/' + encodeURIComponent(nb.id)) }, { label: 'Позже' }];
  } else {
    text = `Привет, ${name}! Все разделы пройдены — сыграем в блиц?`;
    actions = [{ label: 'Блиц', onClick: () => (location.hash = '#/play/speed') }, { label: 'Позже' }];
  }
  setTimeout(() => coach({ concept: S.concept, mood: 'invite', text, actions }), 450);
}
function plural(n, a, b, c) { n = Math.abs(n) % 100; const n1 = n % 10; if (n > 10 && n < 20) return c; if (n1 > 1 && n1 < 5) return b; if (n1 === 1) return a; return c; }
function stepText(id) {
  const st = S.stats.blocks[id] || {};
  if (!(S.stats.questions[id] || 0)) return st.lesson ? 'Урок изучен' : 'Урок';
  if (!st.lesson) return 'Шаг 1 из 3 · урок';
  if ((st.quiz || 0) < 60) return 'Шаг 2 из 3 · квиз';
  if (!st.passed) return 'Шаг 3 из 3 · тест';
  return 'Блок сдан';
}
function conceptSwitch() {
  return `<div class="seg" id="csw"><button data-c="grano" class="${S.concept === 'grano' ? 'on' : ''}">GRANO</button><button data-c="vilka" class="${S.concept === 'vilka' ? 'on' : ''}">VILKA</button></div>`;
}
function bindConceptSwitch() {
  document.querySelectorAll('#csw button').forEach((b) => b.onclick = async () => {
    localStorage.setItem('vg_concept', b.dataset.c); setConcept(b.dataset.c); await loadBase(); route();
  });
}

/* ---------------- learning ---------------- */
async function vLearn() {
  const st = S.stats.blocks || {};
  const avail = S.blocks.filter((b) => (S.stats.questions[b.id] || 0) > 0);
  const passed = avail.filter((b) => st[b.id]?.passed).length;
  const cur = nextBlock();
  $app.innerHTML = h`
  <div class="stack">
    ${isAdmin() ? conceptSwitch() : ''}
    <div class="h1">Меню знаний</div>
    ${isAdmin() ? '' : '<a class="pathban" href="#/path"><span class="e">🗺️</span><div><b>Моя карта развития</b><small>Где я сейчас и что дальше</small></div><span class="go">›</span></a>'}
    <div class="prog"><div class="bar"><i style="width:${avail.length ? Math.round(100 * passed / avail.length) : 0}%"></i></div><span class="pill acc">${passed}/${avail.length}</span></div>
    <p class="small muted">Каждая тарелка — раздел книги. Урок, квиз и тест закрашивают её по кругу. Ошибки вернутся на повторение через 1, 3 и 7 дней.</p>
    <div class="path">
    ${S.blocks.map((b, i) => {
      const s = st[b.id] || {}, nq = S.stats.questions[b.id] || 0;
      const cls = s.passed ? 'done' : (cur && cur.id === b.id ? 'cur' : (!nq && !s.lesson ? 'lock' : ''));
      return `<a class="node ${cls}" href="#/block/${encodeURIComponent(b.id)}"><div class="pl" style="--p:${pctOf(b.id)}"><div>${plateImg(b, i)}</div></div>
        <div class="tx"><b>${isNew(b) && !s.passed ? '<span class="newb">Новое</span> ' : ''}${esc(b.title)}</b><span>${s.passed ? `Сдан на ${s.test}%` : stepText(b.id)}</span>${cls === 'cur' ? '<br><span class="go">Сейчас</span>' : ''}</div></a>`;
    }).join('')}
    </div>
  </div>`;
  bindConceptSwitch();
  if (!sessionStorage.getItem('vg_learn_hint')) { sessionStorage.setItem('vg_learn_hint', '1'); setTimeout(() => coach({ concept: S.concept, mood: 'hint', text: 'Каждая тарелка — раздел меню. Начни с той, что пульсирует: урок, потом квиз и тест.', duration: 5200 }), 500); }
}

async function vBlock(id) {
  const b = S.blocks.find((x) => x.id === id); if (!b) return (location.hash = '#/learn');
  const s = S.stats.blocks[id] || {}, nq = S.stats.questions[id] || 0;
  const quizOk = (s.quiz || 0) >= 60;
  const nxt = !s.lesson ? 1 : (!nq ? 0 : !quizOk ? 2 : !s.passed ? 3 : 0);
  const step = (n, ic, title, sub, href, done, lock, st) => `<a class="step ${done ? 'done' : ''} ${nxt === n ? 'next' : ''} ${lock ? 'lock' : ''}" href="${href}"><div class="ic">${done ? '✅' : ic}</div><div class="tx"><b>${title}</b><span class="small muted">${sub}</span></div><span class="st">${st}</span></a>`;
  $app.innerHTML = h`
  <div class="cover">${S.covers[id] ? `<img src="${esc(S.covers[id])}" alt="">` : ''}<a class="back" href="#/learn">‹</a>
    <span class="small" style="opacity:.9">${nq ? `${nq} ${plural(nq, 'вопрос', 'вопроса', 'вопросов')} · ${pctOf(id)}% пройдено` : 'Урок по книге'}</span><span class="t">${esc(b.title)}</span></div>
  <div class="steps">
    ${step(1, '📖', 'Урок', b.custom ? 'Материал от сервис-менеджера' : 'Карточки блюд раздела', `#/lesson/${encodeURIComponent(id)}`, s.lesson, false, s.lesson ? 'Изучен' : '+10')}
    ${nq ? step(2, '🎯', 'Квиз', '5 вопросов на закрепление', `#/play/quiz/${encodeURIComponent(id)}`, quizOk, false, quizOk ? `${s.quiz}%` : '+10') : ''}
    ${nq ? step(3, '🏆', 'Тест', 'До 10 вопросов, сдан от 80%', `#/play/test/${encodeURIComponent(id)}`, s.passed, !quizOk, s.passed ? `${s.test}%` : quizOk ? '+50' : '🔒') : ''}
    ${nq ? step(4, '⚡', 'Блиц по разделу', '60 секунд, сколько успеешь', `#/play/speed/${encodeURIComponent(id)}`, false, false, '') : ''}
    ${b.custom ? '' : `<a class="step" href="#/book/${encodeURIComponent(b.section_id)}"><div class="ic">📚</div><div class="tx"><b>Открыть в книге</b><span class="small muted">Весь раздел с фото и подсказками</span></div></a>`}
  </div>`;
}

async function vLesson(id) {
  const b = S.blocks.find((x) => x.id === id); if (!b) return (location.hash = '#/learn');
  const { data: cards } = await sb.from('kb_cards').select('*').eq('block_id', id).order('sort');
  if (!cards || !cards.length) {
    $app.innerHTML = h`<div class="stack"><div class="qtop"><a class="back" href="#/block/${encodeURIComponent(id)}">✕</a></div>
      <div class="today" style="min-height:200px"><span class="k">Урок по книге</span><span class="t">${esc(b.title)}</span></div>
      <p class="muted">Откройте раздел в книге, прочитайте и вернитесь, чтобы отметить урок.</p>
      <a class="btn block" href="#/book/${encodeURIComponent(b.section_id)}">Открыть раздел</a><button class="btn ghost block" id="done">Я изучил(а) · +10</button></div>`;
    document.getElementById('done').onclick = () => finishLesson(id);
    return;
  }
  let i = 0;
  document.body.classList.add('playing');
  setTimeout(() => coach({ concept: S.concept, mood: 'hint', text: 'Листай карточки и запоминай состав — потом проверим в квизе!', duration: 3600 }), 400);
  const draw = () => {
    const c = cards[i];
    $app.innerHTML = h`
    <div class="lesson">
      <div class="qtop"><a class="back" href="#/block/${encodeURIComponent(id)}">✕</a><div class="segs">${cards.map((x, k) => `<i class="${k < i ? 'ok' : k === i ? 'cur' : ''}"></i>`).join('')}</div></div>
      <div class="lcard">${c.photo ? `<img src="${esc(c.photo)}" alt="">` : ''}<div class="in">
        ${c.group_title ? `<span class="lbl">${esc(c.group_title)}</span>` : ''}
        <div class="nm">${esc(c.name)}</div>
        ${c.descr ? `<p>${esc(c.descr).replace(/\n/g, '<br>')}</p>` : ''}
        ${c.video ? videoEmbed(c.video) : ''}
        ${c.comp ? `<div class="comp"><span class="lbl">Состав</span>${esc(c.comp)}</div>` : ''}
      </div></div>
      <div class="row"><button class="btn ghost" id="pv" ${i ? '' : 'disabled'} style="flex:1">Назад</button><button class="btn" id="nx" style="flex:2">${i + 1 < cards.length ? 'Дальше' : 'Урок изучен · +10'}</button></div>
    </div>`;
    document.getElementById('pv').onclick = () => { i--; draw(); };
    document.getElementById('nx').onclick = () => { if (i + 1 < cards.length) { i++; draw(); window.scrollTo(0, 0); } else finishLesson(id); };
  };
  draw();
}
async function finishLesson(id) {
  const { data: pts } = await sb.rpc('mark_lesson', { p_block: id });
  if (pts) { plus(pts); confetti(); }
  await loadBase(); location.hash = '#/block/' + encodeURIComponent(id);
}

/* ---------------- quiz / test / review / speed ---------------- */
async function vPlay(mode, block) {
  $app.innerHTML = '<div class="splash"><div class="spin"></div></div>';
  const { data, error } = await sb.rpc('start_session', { p_mode: mode, p_block: block, p_concept: S.concept });
  if (error) throw error;
  const qs = data.questions || [];
  const backHref = block ? '#/block/' + encodeURIComponent(block) : mode === 'exam' ? '#/path' : '#/home';
  if (!data.session || !qs.length) {
    $app.innerHTML = `<div class="result"><div style="font-size:64px">${mode === 'review' ? '🎉' : '🧑‍🍳'}</div><div class="h2">${mode === 'review' ? 'Повторять пока нечего' : 'Вопросы ещё готовятся'}</div><p class="muted">${mode === 'review' ? 'Вопросы вернутся, когда придёт их время. А пока — новый урок.' : 'Сервис-менеджер скоро добавит вопросы к этому разделу.'}</p><a class="btn block" href="#/learn">К меню знаний</a></div>`;
    return;
  }
  document.body.classList.add('playing');
  const title = { quiz: 'Квиз', test: 'Тест', review: 'Повторение', speed: 'Блиц', exam: 'Аттестация' }[mode];
  const marks = [];
  let i = 0, right = 0, earned = 0, combo = 0, best = 0, ended = false, timeLeft = 60, tmr = null;
  const cleanup = () => { clearInterval(tmr); document.body.classList.remove('playing'); window.removeEventListener('hashchange', cleanup); };
  window.addEventListener('hashchange', cleanup);
  const finish = async () => {
    if (ended) return; ended = true; clearInterval(tmr);
    document.querySelector('.sheet')?.remove();
    const { data: r } = await sb.rpc('finish_session', { p_session: data.session });
    earned += (r?.points || 0);
    await loadBase();
    document.body.classList.remove('playing');
    const total = mode === 'speed' ? i : (r?.total || qs.length), sc = r?.score ?? right;
    const pct = total ? Math.round(100 * sc / total) : 0;
    const stars = mode === 'speed' ? (sc >= 15 ? 3 : sc >= 8 ? 2 : sc >= 3 ? 1 : 0) : (pct >= 100 ? 3 : pct >= 80 ? 2 : pct >= 50 ? 1 : 0);
    const head = mode === 'exam' ? (r?.passed ? 'Аттестация пройдена!' : 'Пока не сдано — нужно 80%') : mode === 'test' ? (r?.passed ? 'Тест сдан!' : 'Почти! Нужно 80%') : mode === 'speed' ? 'Время вышло!' : stars >= 2 ? 'Отлично!' : 'Хорошая попытка';
    $app.innerHTML = h`
    <div class="result">
      <div class="res-ch" id="resch"></div>
      <div class="stars">${[0, 1, 2].map((k) => `<span data-k="${k}">⭐</span>`).join('')}</div>
      <div class="h1">${head}</div>
      <div class="big">${sc}<span class="muted" style="font-size:32px">/${total}</span></div>
      <div class="rgrid"><div><b style="color:var(--acc2)">+${earned}</b><span>баллов</span></div><div><b>${mode === 'speed' ? sc : pct + '%'}</b><span>${mode === 'speed' ? 'верных' : 'точность'}</span></div><div><b style="color:#ff7a1a">${best}🔥</b><span>лучшая серия</span></div></div>
      <p class="muted">${mode === 'exam' ? (r?.passed ? 'Следующий этап на карте развития уже открыт.' : 'Повтори разделы, где ошибался, и попробуй снова.') : mode === 'test' && !r?.passed ? 'Пролистай урок ещё раз — и вперёд.' : mode === 'speed' ? 'Завтра попробуй побить свой результат.' : 'Ошибки вернутся на повторение завтра.'}</p>
      <div class="row" style="width:100%"><a class="btn ghost" style="flex:1" href="${backHref}">Готово</a><button class="btn" style="flex:1" id="again">Ещё раз</button></div>
    </div>`;
    document.querySelectorAll('.stars span').forEach((el) => { const k = +el.dataset.k; if (k < stars) setTimeout(() => el.classList.add('on'), 250 + k * 280); });
    const rc = new Character(document.getElementById('resch'), whoFor(S.concept), 'calm');
    rc.enter('bottom').then(() => rc.react(stars >= 2 ? 'victory' : stars === 1 ? 'praise' : 'wrong'));
    if (stars >= 2) setTimeout(confetti, 900);
    document.getElementById('again').onclick = () => vPlay(mode, block);
  };
  const segs = () => mode === 'speed' ? `<div class="bar" style="flex:1"><i style="width:${Math.round(100 * timeLeft / 60)}%"></i></div>` :
    `<div class="segs">${qs.map((x, k) => `<i class="${marks[k] === true ? 'ok' : marks[k] === false ? 'bad' : k === i ? 'cur' : ''}"></i>`).join('')}</div>`;
  const draw = () => {
    if (i >= qs.length) return finish();
    document.querySelector('.sheet')?.remove();
    const q = qs[i], order = shuffle(q.options.map((o, k) => k));
    const [head, ...rest] = q.question.split('\n');
    $app.innerHTML = h`
    <div class="stack">
      <div class="qtop"><a class="back" href="${backHref}">✕</a>${segs()}${mode === 'speed' ? `<span class="timer" id="tm">${timeLeft}</span>` : `<span class="combo">${combo >= 2 ? combo + '🔥' : ''}</span>`}</div>
      <div class="qcard">
        ${q.photo ? `<img class="qimg" src="${esc(q.photo)}" alt="">` : ''}
        <div class="q"><b>${esc(head)}</b>${esc(rest.join('\n'))}</div>
        <div class="opts">${order.map((k, n) => `<button class="opt" data-k="${k}"><span class="k">${'АБВГ'[n]}</span><span>${esc(q.options[k])}</span></button>`).join('')}</div>
      </div>
    </div>`;
    document.querySelectorAll('.opt').forEach((btn) => btn.onclick = async () => {
      document.querySelectorAll('.opt').forEach((x) => (x.disabled = true));
      const k = +btn.dataset.k;
      const { data: a, error: e } = await sb.rpc('answer', { p_session: data.session, p_item: q.id, p_choice: k });
      if (e) { toast('Нет связи, попробуйте ещё раз'); document.querySelectorAll('.opt').forEach((x) => (x.disabled = false)); return; }
      marks[i] = a.correct;
      if (a.correct) { right++; combo++; best = Math.max(best, combo); btn.classList.add('ok'); } else { combo = 0; btn.classList.add('bad'); document.querySelector(`.opt[data-k="${a.answer}"]`)?.classList.add('ok'); }
      if (a.points) { earned += a.points; plus(a.points); }
      if (navigator.vibrate) navigator.vibrate(a.correct ? 15 : [30, 40, 30]);
      if (mode === 'speed') { i++; setTimeout(() => !ended && draw(), a.correct ? 300 : 650); return; }
      const sh = document.createElement('div');
      sh.className = 'sheet ' + (a.correct ? 'ok' : 'bad');
      const praise = ['Верно!', 'Точно!', 'Супер!', 'Так держать!'][Math.floor(Math.random() * 4)];
      sh.innerHTML = `<div class="row" style="align-items:flex-end"><div class="mini-ch"></div><div class="v">${a.correct ? (combo >= 3 ? `${combo} подряд! 🔥` : praise) : 'Не страшно! Правильно:'}</div></div>${!a.correct ? `<b>${esc(q.options[a.answer])}</b>` : ''}<span class="small">${esc(a.explain || '')}</span><button class="btn block ${a.correct ? 'okb' : 'badb'}" id="nx">${i + 1 < qs.length ? 'Дальше' : 'Результат'}</button>`;
      document.body.appendChild(sh);
      new Character(sh.querySelector('.mini-ch'), whoFor(S.concept)).react(a.correct ? (combo >= 3 ? 'victory' : combo === 2 ? 'joy' : 'praise') : 'wrong');
      document.getElementById('nx').onclick = () => { i++; draw(); window.scrollTo(0, 0); };
    });
  };
  if (mode === 'speed') {
    tmr = setInterval(() => {
      if (!document.getElementById('tm')) { clearInterval(tmr); if (!ended) { ended = true; sb.rpc('finish_session', { p_session: data.session }); } return; }
      timeLeft--; document.getElementById('tm').textContent = timeLeft;
      const bar = document.querySelector('.qtop .bar i'); if (bar) bar.style.width = Math.round(100 * timeLeft / 60) + '%';
      if (timeLeft <= 0) finish();
    }, 1000);
  }
  draw();
}

/* ---------------- book ---------------- */
async function loadBook(c) {
  if (S.book[c]) return S.book[c];
  const { data: k, error } = await sb.from('kb_keys').select('*').eq('concept', c).single();
  if (error || !k) throw new Error('Нет доступа к книге');
  const buf = await (await fetch(k.file, { cache: 'force-cache' })).arrayBuffer();
  const raw = Uint8Array.from(atob(k.key), (ch) => ch.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(buf, 0, 12) }, key, new Uint8Array(buf, 12));
  S.book[c] = JSON.parse(new TextDecoder().decode(pt));
  return S.book[c];
}
async function vBook(section) {
  $app.innerHTML = '<div class="splash"><div class="spin"></div></div>';
  window.__BOOK = await loadBook(S.concept);
  const f = document.createElement('iframe');
  f.className = 'bookframe'; f.title = 'Вкусная книга';
  f.src = `book-${S.concept}.html${section ? '#' + section : ''}`;
  if (section && S.concept === 'vilka') f.onload = () => { try { f.contentWindow.document.getElementById(section)?.scrollIntoView(); } catch (e) {} };
  $app.innerHTML = '';
  document.body.appendChild(f);
}

/* ---------------- rating ---------------- */
async function vRating(per) {
  const { data } = await sb.rpc('leaderboard', { p_period: per, p_concept: S.concept });
  const rows = data || [], top = rows.slice(0, 3);
  const pod = [[top[1], '🥈', ''], [top[0], '👑', 'p1'], [top[2], '🥉', '']];
  const me = rows.find((r) => r.me);
  $app.innerHTML = h`
  <div class="stack">
    ${isAdmin() ? conceptSwitch() : ''}
    <div class="row"><a class="back" href="#/team">‹</a><div class="h1">Рейтинг ${S.concept === 'grano' ? 'GRANO' : 'VILKA'}</div></div>
    <div class="seg" id="per"><button data-p="month" class="${per === 'month' ? 'on' : ''}">Этот месяц</button><button data-p="all" class="${per === 'all' ? 'on' : ''}">За всё время</button></div>
    ${top.length ? `<div class="podium">${pod.map(([r, m, c]) => r ? `<div class="pc ${c}"><div class="av" data-m="${m}">${esc(initials(r.name))}</div><div class="base"><b>${esc(r.name)}</b><span class="small muted">${esc(r.restaurant.replace('VILKA ', ''))}</span><span class="pt">${r.points}</span></div></div>` : '<span></span>').join('')}</div>`
      : `<div class="today" style="min-height:180px"><span class="k">Рейтинг пока пуст</span><span class="t">Первый урок — и ты на вершине</span><a class="btn gold go" href="#/learn">Начать</a></div>`}
    ${me && me.rank > 3 ? `<div class="lb me"><span class="rk">${me.rank}</span><div class="mini">${esc(initials(me.name))}</div><div class="nm"><b>Это ты</b><div class="small muted">${esc(me.restaurant)}</div></div><span class="pt">${me.points}</span></div>` : ''}
    ${rows.slice(3).map((r) => `<div class="lb ${r.me ? 'me' : ''}"><span class="rk">${r.rank}</span><div class="mini">${esc(initials(r.name))}</div><div class="nm"><b>${esc(r.name)}</b><div class="small muted">${esc(r.restaurant)}</div></div><span class="pt">${r.points}</span></div>`).join('')}
  </div>`;
  document.querySelectorAll('#per button').forEach((b) => b.onclick = () => (location.hash = '#/rating/' + b.dataset.p));
  bindConceptSwitch();
}

/* ---------------- profile ---------------- */
function badges() {
  const s = S.stats, bl = Object.values(s.blocks || {});
  const passed = bl.filter((b) => b.passed).length, lessons = bl.filter((b) => b.lesson).length;
  return [
    ['📘', 'Первый урок', lessons >= 1], ['🎓', 'Первый тест', passed >= 1], ['🧠', '5 разделов', passed >= 5], ['🏅', '10 разделов', passed >= 10],
    ['🎖️', 'Первая смена', (S.ach || []).some((a) => a.code.startsWith('quest:'))], ['🔥', '3 дня подряд', s.streak >= 3], ['⚡', 'Неделя подряд', s.streak >= 7], ['💯', '500 баллов', s.total >= 500], ['👑', '1000 баллов', s.total >= 1000],
  ];
}
async function vMe() {
  const L = level(S.stats.total), r = S.rests.find((x) => x.id === S.me.restaurant_id);
  const { data: hist } = await sb.from('points_ledger').select('*').eq('user_id', S.me.id).order('created_at', { ascending: false }).limit(25);
  const got = badges().filter((b) => b[2]).length;
  $app.innerHTML = h`
  <div class="stack">
    <div class="row between"><span></span><button class="btn sm ghost" id="out2">Выйти</button></div>
    <div class="prof"><div class="ava xl" style="--p:${L.pct}"><b>${esc(initials(S.me.full_name))}</b></div>
      <div class="h1">${esc(S.me.full_name)}</div><div class="muted small">${isAdmin() ? 'Сервис-менеджер VILKA и GRANO' : `${POS[S.me.position] || ''}, ${esc(r?.name || '')}`}</div></div>
    ${isAdmin() ? '' : '<a class="pathban" href="#/path"><span class="e">🗺️</span><div><b>Карта развития</b><small>Путь от новичка до эксперта и аттестации</small></div><span class="go">›</span></a>'}
    <div class="lvlcard"><div class="row between"><span class="lv">${L.icon} ${L.name}</span><b>⭐ ${S.stats.total}</b></div><div class="bar"><i style="width:${L.pct}%"></i></div>
      <span class="small" style="opacity:.9">${L.next ? `До уровня «${L.next[1]}» — ${L.next[0] - S.stats.total} баллов` : 'Максимальный уровень'}</span></div>
    <div class="tiles"><div class="tile" style="min-height:auto"><span class="e">🔥</span><b>${S.stats.streak} ${plural(S.stats.streak, 'день', 'дня', 'дней')} подряд</b></div><div class="tile" style="min-height:auto"><span class="e">🏆</span><b>${got} из ${badges().length} наград</b></div></div>
    <div class="sec-t"><span class="h2">Награды</span></div>
    <div class="badges">${badges().map(([e, n, on]) => `<div class="bdg ${on ? '' : 'off'}"><div class="md">${e}</div><b>${n}</b></div>`).join('')}</div>
    <div class="sec-t"><span class="h2">История баллов</span></div>
    <div>${(hist || []).length ? hist.map((x) => `<div class="hist"><div class="nm"><b>${REASON[x.reason] || x.reason}</b><div class="small muted">${new Date(x.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div></div><span class="pt" style="${x.amount < 0 ? 'color:var(--bad)' : ''}">${x.amount > 0 ? '+' : ''}${x.amount}</span></div>`).join('') : '<p class="muted">Баллов пока нет. Начни с первого урока.</p>'}</div>
    <a class="btn ghost" href="#/shop/orders">🎁 Мои заказы</a>
    <button class="btn ghost" id="tourAgain">Знакомство с Шефи ещё раз</button>
    <button class="btn ghost" id="out">Выйти</button>
    <div class="sign">Вопросы по обучению: ${CONTACT.who}<br><b>${CONTACT.tel}</b></div>
  </div>`;
  document.getElementById('tourAgain').onclick = () => tour(true);
  document.getElementById('out2').onclick = () => document.getElementById('out').click();
  document.getElementById('out').onclick = async () => { window.onhashchange = null; await sb.auth.signOut(); S.me = null; history.replaceState(null, '', location.pathname + location.search); renderLogin(); };
}

/* ---------------- admin ---------------- */
async function adminCall(body) {
  const { data, error } = await sb.functions.invoke('staff-admin', { body });
  if (error) { let m = error.message; try { m = (await error.context.json()).error || m; } catch (e) {} throw new Error(m); }
  if (data?.error) throw new Error(data.error);
  return data;
}
function codeModal(name, phone, code) {
  const text = `Вход в обучение ${S.concept === 'grano' ? 'GRANO' : 'VILKA'}\nСсылка: ${location.origin}${location.pathname}\nТелефон: ${fmtPhone(phone)}\nКод: ${code}`;
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="card stack"><b>${esc(name)}</b><span class="muted small">Телефон: ${fmtPhone(phone)}</span><span class="muted small">Личный код:</span><div class="code">${code}</div>
    <p class="small muted">Код показывается один раз. Отправьте его сотруднику лично.</p>
    <button class="btn" id="cp">Скопировать сообщение для сотрудника</button><button class="btn ghost" id="cl">Готово</button></div>`;
  document.body.appendChild(m);
  m.querySelector('#cp').onclick = async () => { try { await navigator.clipboard.writeText(text); toast('Скопировано'); } catch (e) { toast('Не удалось скопировать — выделите код вручную'); } };
  m.querySelector('#cl').onclick = () => m.remove();
}

const AGROUPS = [
  ['dash', 'Сводка', [['dash', 'Сводка']]],
  ['control', 'SERVICE CONTROL', [['control', 'SERVICE CONTROL']]],
  ['team', 'Команда', [['staff', 'Сотрудники'], ['progress', 'Прогресс'], ['certs', 'Карта развития и аттестации']]],
  ['learn', 'Обучение', [['materials', 'Мои материалы'], ['assign', 'Задания и сообщения'], ['spot', 'Игра «Найди ошибку»'], ['questions', 'Вопросы'], ['quests', 'Квесты и симуляторы']]],
  ['fun', 'Вовлечение', [['compete', 'Соревнования'], ['news', 'Новости'], ['shop', 'Магазин'], ['cast', 'Шефи']]],
];
async function vAdmin(tab, arg) {
  const g = AGROUPS.find((x) => x[2].some(([k]) => k === tab)) || AGROUPS[0];
  const top = `<div class="stack"><div class="row between"><div class="h1">Кабинет</div>${conceptSwitch()}</div>
    <div class="agroups">${AGROUPS.map(([k, n, subs]) => `<a href="#/admin/${subs[0][0]}" class="${g[0] === k ? 'on' : ''} ${k === 'control' ? 'sc' : ''}">${n}</a>`).join('')}</div>
    ${g[2].length > 1 ? `<div class="atabs">${g[2].map(([k, n]) => `<a href="#/admin/${k}" class="${tab === k ? 'on' : ''}">${n}</a>`).join('')}</div>` : ''}
    <div id="ab" class="stack"><div class="spin"></div></div></div>`;
  $app.innerHTML = top; bindConceptSwitch();
  const ab = document.getElementById('ab');
  if (tab === 'dash') return aDash(ctx(), ab);
  if (tab === 'control') return aControl(ctx(), ab, arg);
  if (tab === 'assign') return aAssign(ctx(), ab);
  if (tab === 'materials') return aMaterials(ctx(), ab);
  if (tab === 'spot') return aSpot(ctx(), ab);
  if (tab === 'certs') return aCerts(ctx(), ab);
  if (tab === 'staff') return aStaff(ab);
  if (tab === 'questions') return aQuestions(ab, arg);
  if (tab === 'progress') return aProgress(ab);
  if (tab === 'news') return aNews(ab);
  if (tab === 'cast') return aCast(ab);
  if (tab === 'shop') return aShop(ab);
  if (tab === 'quests') return aQuests(ab, arg);
  if (tab === 'compete') return aCompete(ctx(), ab);
}

async function aStaff(ab) {
  const { data: ppl } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
  const rests = S.rests.filter((r) => r.concept === S.concept);
  const list = (ppl || []).filter((p) => p.concept === S.concept || (p.role === 'admin'));
  ab.innerHTML = h`
  <form class="card stack" id="nf"><b>Добавить сотрудника</b>
    <div class="grid2"><input id="fn" placeholder="Имя и фамилия" required><input id="fp" type="tel" placeholder="Телефон 8 7__ ___ __ __" required>
    <select id="fr">${rests.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select>
    <select id="fpos">${Object.entries(POS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
    <label class="small muted" style="display:flex;flex-direction:column;gap:4px">День рождения (необязательно)<input id="fbd" type="date"></label></div>
    <div class="row" style="flex-wrap:wrap"><button class="btn" id="nb">Добавить и выдать код</button><button type="button" class="btn ghost" id="imp">📥 Импорт из анкеты (CSV)</button></div></form>
  <div class="tw"><table class="t"><tr><th>Сотрудник</th><th>Точка</th><th>Был(а)</th><th></th></tr>
  ${list.map((p) => `<tr style="${p.active ? '' : 'opacity:.5'}"><td><b>${esc(p.full_name)}</b>${p.role === 'admin' ? ' <span class="pill acc">сервис-менеджер</span>' : p.role === 'lead' ? ' <span class="pill acc">администратор</span>' : ''}<div class="small muted">${POS[p.position] || ''} · ${fmtPhone(p.phone)}</div>${p.role === 'admin' ? '' : `<label class="bdl small muted">🎂 <input type="date" data-bd="${p.id}" value="${p.birthday || ''}"></label>`}</td>
    <td class="small">${esc(S.rests.find((r) => r.id === p.restaurant_id)?.name || '')}</td>
    <td class="small muted">${p.last_seen_at ? new Date(p.last_seen_at).toLocaleDateString('ru-RU') : 'не входил(а)'}</td>
    <td>${p.role === 'admin' ? '' : `<div class="row" style="flex-wrap:wrap;gap:6px"><button class="btn sm ghost" data-reset="${p.id}">Новый код</button><button class="btn sm ghost" data-act="${p.id}" data-on="${p.active ? 0 : 1}">${p.active ? 'Отключить' : 'Включить'}</button></div>`}</td></tr>`).join('')}
  </table></div>`;
  document.getElementById('imp').onclick = () => importStaff({ ...ctx(), adminCall }, new Set((ppl || []).map((p) => p.phone)), () => aStaff(ab));
  document.getElementById('nf').onsubmit = async (e) => {
    e.preventDefault(); const b = document.getElementById('nb'); b.disabled = true;
    try {
      const r = await adminCall({ action: 'create', full_name: fn.value, phone: fp.value, restaurant_id: fr.value, position: fpos.value });
      if (fbd.value) await sb.from('profiles').update({ birthday: fbd.value }).eq('phone', r.phone);
      codeModal(fn.value, r.phone, r.code); aStaff(ab);
    } catch (er) { toast(er.message); b.disabled = false; }
  };
  ab.querySelectorAll('[data-bd]').forEach((i) => i.onchange = async () => { const { error } = await sb.from('profiles').update({ birthday: i.value || null }).eq('id', i.dataset.bd); toast(error ? error.message : 'День рождения сохранён'); });
  ab.querySelectorAll('[data-reset]').forEach((b) => b.onclick = async () => {
    const p = list.find((x) => x.id === b.dataset.reset);
    if (!(await ask(`Выдать новый код для ${p.full_name}? Старый перестанет работать.`, 'Выдать код'))) return;
    try { const r = await adminCall({ action: 'reset', id: p.id }); codeModal(p.full_name, p.phone, r.code); } catch (er) { toast(er.message); }
  });
  ab.querySelectorAll('[data-act]').forEach((b) => b.onclick = async () => {
    const p = list.find((x) => x.id === b.dataset.act), on = b.dataset.on === '1';
    if (!on && !(await ask(`Отключить ${p.full_name}? Доступ закроется сразу на всех устройствах.`, 'Отключить', true))) return;
    try { await adminCall({ action: 'active', id: p.id, active: on }); toast(on ? 'Доступ включён' : 'Доступ отключён'); aStaff(ab); } catch (er) { toast(er.message); }
  });
}

async function aQuestions(ab, blockId) {
  const { data: blocks } = await sb.from('blocks').select('*').eq('concept', S.concept).order('sort');
  const { data: cnt } = await sb.from('quiz_items').select('block_id,approved').eq('concept', S.concept);
  const by = {}; (cnt || []).forEach((x) => { by[x.block_id] = by[x.block_id] || [0, 0]; by[x.block_id][0]++; if (x.approved) by[x.block_id][1]++; });
  if (!blockId) {
    ab.innerHTML = `<p class="muted">Вопросы собраны автоматически из книги. Сотрудники видят только утверждённые. Откройте блок, проверьте и утвердите.</p>` +
      (blocks || []).map((b) => { const c = by[b.id] || [0, 0]; return `<a class="blk ${c[0] && c[0] === c[1] ? 'done' : ''}" href="#/admin/questions/${encodeURIComponent(b.id)}"><div class="dot">${c[1]}</div><div class="t"><b>${esc(b.title)}</b><span class="small muted">Утверждено ${c[1]} из ${c[0]}</span></div></a>`; }).join('');
    return;
  }
  const { data: qs } = await sb.from('quiz_items').select('*').eq('block_id', blockId).order('id');
  const b = (blocks || []).find((x) => x.id === blockId);
  ab.innerHTML = h`<a class="back" href="#/admin/questions">‹ Все блоки</a><div class="row between"><div class="h2">${esc(b?.title || '')}</div>
    <div class="row"><button class="btn sm" id="all1">Утвердить все</button><button class="btn sm ghost" id="all0">Снять все</button></div></div>
    <div class="stack">${(qs || []).map((q) => `<div class="qi"><div class="row between" style="align-items:flex-start"><div class="q">${esc(q.question)}</div>
      <label class="switch"><input type="checkbox" data-ap="${q.id}" ${q.approved ? 'checked' : ''}> В тестах</label></div>
      ${q.photo ? `<img src="${esc(q.photo)}" alt="">` : ''}
      <ol>${q.options.map((o, k) => `<li class="${k === q.answer ? 'c' : ''}">${esc(o)}</li>`).join('')}</ol>
      <span class="small muted">${esc(q.explain || '')}</span>
      <div><button class="btn sm ghost" data-del="${q.id}">Удалить вопрос</button></div></div>`).join('')}</div>`;
  ab.querySelectorAll('[data-ap]').forEach((c) => c.onchange = async () => { const { error } = await sb.from('quiz_items').update({ approved: c.checked }).eq('id', c.dataset.ap); toast(error ? error.message : c.checked ? 'Вопрос в тестах' : 'Вопрос скрыт'); });
  ab.querySelectorAll('[data-del]').forEach((c) => c.onclick = async () => { if (!(await ask('Удалить этот вопрос?', 'Удалить', true))) return; const { error: de } = await sb.from('quiz_items').delete().eq('id', c.dataset.del); if (de) return toast(de.message); toast('Вопрос удалён'); aQuestions(ab, blockId); });
  const setAll = async (v) => { await sb.from('quiz_items').update({ approved: v }).eq('block_id', blockId); await loadBase(); aQuestions(ab, blockId); toast(v ? 'Все вопросы блока утверждены' : 'Все вопросы скрыты'); };
  document.getElementById('all1').onclick = () => setAll(true);
  document.getElementById('all0').onclick = () => setAll(false);
}

async function aProgress(ab) {
  const [{ data: ppl }, { data: pts }, { data: bs }] = await Promise.all([
    sb.from('profiles').select('*').eq('concept', S.concept).eq('role', 'staff'),
    sb.from('points_ledger').select('user_id,amount,created_at'),
    sb.from('block_status').select('*'),
  ]);
  const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
  const rows = (ppl || []).map((p) => {
    const my = (pts || []).filter((x) => x.user_id === p.id), st = (bs || []).filter((x) => x.user_id === p.id);
    return { p, total: my.reduce((a, x) => a + x.amount, 0), month: my.filter((x) => new Date(x.created_at) >= m0).reduce((a, x) => a + x.amount, 0),
      lessons: st.filter((x) => x.lesson_at).length, passed: st.filter((x) => x.test_passed_at).length, rest: S.rests.find((r) => r.id === p.restaurant_id)?.name || '' };
  }).sort((a, b) => b.month - a.month);
  const byRest = {}; rows.forEach((r) => { byRest[r.rest] = byRest[r.rest] || { n: 0, m: 0, passed: 0, active: 0 }; const x = byRest[r.rest]; x.n++; x.m += r.month; x.passed += r.passed; if (r.p.last_seen_at && Date.now() - new Date(r.p.last_seen_at) < 7 * 864e5) x.active++; });
  ab.innerHTML = h`
  <div class="grid2">${Object.entries(byRest).map(([n, x]) => `<div class="card"><b>${esc(n)}</b><div class="small muted">${x.n} сотр. · заходили за неделю: ${x.active}</div><div class="h2" style="margin-top:6px">${x.m} <span class="small muted">баллов за месяц</span></div><div class="small">Сдано блоков: ${x.passed}</div></div>`).join('') || '<p class="muted">Сотрудников пока нет.</p>'}</div>
  <div class="row between"><b>Сотрудники</b><button class="btn sm ghost" id="csv">Скачать для Excel</button></div>
  <div class="tw"><table class="t"><tr><th>Сотрудник</th><th>Точка</th><th>Месяц</th><th>Всего</th><th>Уроки</th><th>Тесты</th><th>Был(а)</th></tr>
  ${rows.map((r) => `<tr style="${r.p.active ? '' : 'opacity:.5'}"><td><b>${esc(r.p.full_name)}</b></td><td class="small">${esc(r.rest)}</td><td>${r.month}</td><td>${r.total}</td><td>${r.lessons}</td><td>${r.passed}</td><td class="small muted">${r.p.last_seen_at ? new Date(r.p.last_seen_at).toLocaleDateString('ru-RU') : '—'}</td></tr>`).join('')}</table></div>`;
  document.getElementById('csv').onclick = () => {
    const lines = [['Сотрудник', 'Точка', 'Должность', 'Баллы за месяц', 'Баллы всего', 'Уроков', 'Сдано тестов', 'Последний вход']].concat(rows.map((r) => [r.p.full_name, r.rest, POS[r.p.position] || '', r.month, r.total, r.lessons, r.passed, r.p.last_seen_at ? new Date(r.p.last_seen_at).toLocaleDateString('ru-RU') : '']));
    const csv = '﻿' + lines.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `progress-${S.concept}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };
}

const USE = { calm: 'Фон, ожидание', joy: 'Верная серия, старт', wow: 'Новинка, интересный факт', doubt: 'Перед сложным вопросом, в видео', focus: 'Тест, игра, блиц', praise: 'Верный ответ', wrong: 'Ошибка — подбадривает', victory: 'Итог, уровень, награда', hint: 'Подсказка в уроке и игре', invite: 'Приветствие, новый квест' };
async function aCast(ab) {
  ab.innerHTML = '<p class="muted">Утверждённый дизайн и библиотека эмоций. Нажмите на карточку — персонаж покажет реакцию. Внешность одинакова во всех разделах платформы.</p>' +
    Object.entries(CAST).sort((a, b) => (b[1].candidate ? 1 : 0) - (a[1].candidate ? 1 : 0)).map(([who, c]) => `<div class="lib"><div class="lib-who"><div class="big" data-big="${who}"></div><div class="stack" style="gap:6px"><div class="h1">${c.name}</div><span class="pill acc">${c.candidate ? 'Кандидат для GRANO' : c.concept.toUpperCase()}</span><p class="muted">${c.about}</p><button class="btn sm" data-demo="${who}">Показать появление</button></div></div>
      <div class="lib-grid">${Object.entries(MOODS).map(([m, x]) => `<div class="lib-cell" data-who="${who}" data-m="${m}"><div class="c"></div><b>${x.name}</b><span>${USE[m]}</span></div>`).join('')}</div></div>`).join('');
  const chars = [];
  ab.querySelectorAll('[data-big]').forEach((el) => chars.push(new Character(el, el.dataset.big, 'invite')));
  ab.querySelectorAll('.lib-cell').forEach((cell) => { const c = new Character(cell.querySelector('.c'), cell.dataset.who, cell.dataset.m); cell.onclick = () => c.react(cell.dataset.m); });
  ab.querySelectorAll('[data-demo]').forEach((b) => b.onclick = () => coach({ who: b.dataset.demo, concept: CAST[b.dataset.demo].concept, mood: 'invite', text: `Привет! Я ${CAST[b.dataset.demo].name}. Так я появляюсь в нужный момент: с подсказкой, похвалой или новым заданием.`, duration: 5000 }));
}
async function aNews(ab) {
  const { data: news } = await sb.from('news').select('*').order('created_at', { ascending: false }).limit(30);
  const { data: reads } = await sb.from('news_reads').select('news_id');
  const rc = {}; (reads || []).forEach((r) => (rc[r.news_id] = (rc[r.news_id] || 0) + 1));
  ab.innerHTML = h`
  <form class="card stack" id="nw"><b>Новая новость</b><input id="nt" placeholder="Заголовок" required><textarea id="nbd" rows="3" placeholder="Текст (необязательно)"></textarea>
    <select id="nc"><option value="${S.concept}">Только ${S.concept === 'grano' ? 'GRANO' : 'VILKA'}</option><option value="">Для всех</option></select><button class="btn">Опубликовать</button></form>
  ${(news || []).map((n) => `<div class="news"><b>${esc(n.title)}</b>${n.body ? `<span class="small">${esc(n.body)}</span>` : ''}<span class="small muted">${new Date(n.created_at).toLocaleDateString('ru-RU')} · ${n.concept ? n.concept.toUpperCase() : 'для всех'} · прочитали: ${rc[n.id] || 0}</span><div><button class="btn sm ghost" data-del="${n.id}">Удалить</button></div></div>`).join('')}`;
  document.getElementById('nw').onsubmit = async (e) => { e.preventDefault(); const { error } = await sb.from('news').insert({ title: nt.value, body: nbd.value || null, concept: nc.value || null }); toast(error ? error.message : 'Опубликовано'); aNews(ab); };
  ab.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => { if (!(await ask('Удалить новость?', 'Удалить', true))) return; await sb.from('news').delete().eq('id', b.dataset.del); aNews(ab); });
}

const ctx = () => ({ sb, S, $app, toast, plus, confetti, loadBase, route, ask });
function badgeWatch(){ const on=!!document.getElementById('nl-badge-frame'); document.body.classList.toggle('nlb',on); }
new MutationObserver(badgeWatch).observe(document.body,{childList:true}); badgeWatch();
boot();
