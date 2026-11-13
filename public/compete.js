/* Соревнования: битва ресторанов, задания недели, сезонные челленджи */
import { Character, coach } from './characters.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const short = (n) => String(n || '').replace(/^VILKA\s+/, '');
const METRIC = { points: 'баллов', lessons: 'уроков', tests: 'тестов', days: 'дней', speed: 'блицев', review: 'повторений', thanks: 'спасибо', quests: 'квестов' };
const METRIC_FULL = { points: 'Баллы', lessons: 'Изученные уроки', tests: 'Сданные тесты', days: 'Активные дни', speed: 'Сыгранные блицы', review: 'Повторения', thanks: 'Спасибо коллегам', quests: 'Пройденные квесты' };
const daysLeft = (d) => Math.max(0, Math.ceil((new Date(d + 'T23:59:59+05:00') - Date.now()) / 864e5));
const dl = (n) => n === 0 ? 'последний день' : n === 1 ? 'остался 1 день' : (n < 5 ? `осталось ${n} дня` : `осталось ${n} дней`);

let C, st, per = 'week';

export async function compeSummary(sb, concept) {
  const { data } = await sb.rpc('compete_state', { p_concept: concept });
  if (!data) return null;
  const wk = (data.challenges || []).filter((c) => c.kind === 'week');
  return { done: wk.filter((c) => c.progress >= c.target).length, total: wk.length, claim: (data.challenges || []).some((c) => canClaim(c, data)) };
}
function canClaim(c, d) {
  if (c.claimed) return false;
  if (c.scope === 'personal') return c.progress >= c.target;
  return d.my_rest && (c.teams?.[d.my_rest] ?? 0) >= c.target;
}

export async function vCompete(ctx) {
  C = ctx; const { sb, S, $app } = ctx;
  $app.innerHTML = '<div class="splash"><div class="spin"></div></div>';
  const { data, error } = await sb.rpc('compete_state', { p_concept: S.concept });
  if (error) throw error;
  st = data;
  const ch = st.challenges || [], week = ch.filter((c) => c.kind === 'week'), season = ch.filter((c) => c.kind === 'season');
  $app.innerHTML = `<div class="stack">
    <div class="row"><a class="back" href="#/team">‹</a><div class="h1">Соревнования</div></div>
    <section class="arena">
      <div class="ar-top"><div><span class="ar-k">Битва ресторанов</span><b class="ar-t">${per === 'week' ? 'Эта неделя' : 'Этот месяц'}</b></div>
        <div class="seg sm" id="per"><button data-p="week" class="${per === 'week' ? 'on' : ''}">Неделя</button><button data-p="month" class="${per === 'month' ? 'on' : ''}">Месяц</button></div></div>
      <div class="ar-cols" id="cols"></div>
      <p class="ar-n">Считаем средние баллы на одного сотрудника — так честно для команд любого размера.${st.prev_winner ? ` Победитель прошлой недели: <b>${esc(st.prev_winner)}</b> 🏆` : ''}</p>
    </section>
    <div class="sec-t"><span class="h2">Задания недели</span><span class="small muted">${dl(daysLeft(st.week_ends))}</span></div>
    ${week.length ? week.map(card).join('') : '<p class="muted">Задания появятся в понедельник.</p>'}
    ${season.length ? `<div class="sec-t"><span class="h2">Сезонный челлендж</span></div>${season.map(seasonCard).join('')}` : ''}
    <div class="sign">Новые задания — каждый понедельник. Награда приходит, когда нажмёшь «Забрать».</div>
  </div>`;
  drawCols();
  document.querySelectorAll('#per button').forEach((b) => b.onclick = () => { per = b.dataset.p; document.querySelectorAll('#per button').forEach((x) => x.classList.toggle('on', x === b)); document.querySelector('.ar-t').textContent = per === 'week' ? 'Эта неделя' : 'Этот месяц'; drawCols(); });
  document.querySelectorAll('[data-claim]').forEach((b) => b.onclick = () => claim(+b.dataset.claim, b));
  if (window.gsap) window.gsap.from('.chl', { y: 16, opacity: 0, stagger: .07, duration: .35, ease: 'power2.out', delay: .2 });
}

function drawCols() {
  const rows = (st.battle || []).filter((r) => r.staff > 0 || r.id === st.my_rest);
  const all = st.battle || [];
  const max = Math.max(1, ...all.map((r) => +r[per]));
  const lead = all.filter((r) => r.staff > 0).sort((a, b) => b[per] - a[per])[0];
  const box = document.getElementById('cols');
  box.innerHTML = all.map((r) => {
    const v = +r[per], h = r.staff ? Math.max(6, Math.round(100 * v / max)) : 0, me = r.id === st.my_rest, win = lead && lead.id === r.id && v > 0;
    return `<div class="col ${me ? 'me' : ''} ${win ? 'win' : ''} c-${r.concept}">
      <span class="cv">${r.staff ? Math.round(v) : '—'}</span>
      <div class="cb"><i style="height:${h}%">${win ? '<em>👑</em>' : ''}</i></div>
      <b>${esc(short(r.name))}</b><small>${r.staff ? `${r.staff} чел.` : 'нет участников'}${me ? ' · вы' : ''}</small></div>`;
  }).join('');
  if (window.gsap) window.gsap.from('#cols .cb i', { height: 0, duration: .9, stagger: .08, ease: 'power3.out' });
  void rows;
}

function bar(v, t) { const p = Math.min(100, Math.round(100 * v / t)); return `<div class="cbar"><i style="width:${p}%"></i></div>`; }

function card(c) {
  const done = c.progress >= c.target;
  return `<div class="chl ${done ? 'done' : ''} ${c.claimed ? 'got' : ''}"><span class="ci">${esc(c.icon || '🎯')}</span>
    <div class="cm"><b>${esc(c.title)}</b><small>${esc(c.descr || '')}</small>${bar(c.progress, c.target)}
      <span class="cp">${Math.min(c.progress, c.target)} из ${c.target} ${METRIC[c.metric]}</span></div>
    <div class="cr">${c.claimed ? '<span class="pill ok">✓ Получено</span>' : done ? `<button class="btn sm gold" data-claim="${c.id}">Забрать ⭐ ${c.pts}</button>` : `<span class="pill">⭐ ${c.pts}</span>`}</div></div>`;
}

function seasonCard(c) {
  const teams = Object.entries(c.teams || {}).map(([id, v]) => [id, +v, (st.battle || []).find((r) => r.id === id)]).filter((x) => x[2] && (x[2].staff > 0 || x[0] === st.my_rest));
  const mine = st.my_rest ? +(c.teams?.[st.my_rest] ?? 0) : null, ok = mine != null && mine >= c.target;
  return `<div class="season chl"><div class="se-h"><span class="ci">${esc(c.icon || '🏁')}</span><div><b class="h2">${esc(c.title)}</b><small>${dl(daysLeft(c.ends))} · награда каждому ⭐ ${c.pts}</small></div></div>
    <p class="small">${esc(c.descr || '')}</p>
    <div class="se-t">${teams.map(([id, v, r]) => `<div class="se-r ${id === st.my_rest ? 'me' : ''}"><span>${esc(short(r.name))}</span>${bar(v, c.target)}<b>${Math.round(v)}/${c.target}</b></div>`).join('')}</div>
    <span class="small muted">${METRIC_FULL[c.metric]}: в среднем на сотрудника</span>
    ${c.claimed ? '<span class="pill ok">✓ Награда получена</span>' : ok ? `<button class="btn gold block" data-claim="${c.id}">Команда справилась! Забрать ⭐ ${c.pts}</button>` : ''}</div>`;
}

async function claim(id, b) {
  b.disabled = true;
  const { data, error } = await C.sb.rpc('claim_challenge', { p_id: id });
  if (error) { C.toast(error.message); b.disabled = false; return; }
  C.plus(data); C.confetti();
  coach({ concept: C.S.concept, center: true, mood: 'victory', text: `Задание выполнено! ⭐ ${data} баллов уже на счету.`, actions: [{ label: 'Ура!' }] });
  await C.loadBase(); vCompete(C);
}

/* ---------- кабинет ---------- */
const TPL = [
  ['🔥', 'Набери 150 баллов', 'points', 150], ['🎓', 'Изучи 3 урока', 'lessons', 3], ['✅', 'Сдай 2 теста', 'tests', 2], ['📅', '5 дней из 7', 'days', 5],
  ['⚡', 'Сыграй 5 блицев', 'speed', 5], ['🙏', 'Скажи 3 спасибо', 'thanks', 3], ['🗺️', 'Пройди квест', 'quests', 1],
];
export async function aCompete(ctx, ab) {
  C = ctx; const { sb, S, toast, ask } = ctx;
  const { data: list } = await sb.from('challenges').select('*').gte('ends', new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10)).order('starts', { ascending: false });
  const today = new Date().toISOString().slice(0, 10);
  const sun = new Date(); sun.setDate(sun.getDate() + ((7 - sun.getDay()) % 7)); const sunS = sun.toISOString().slice(0, 10);
  ab.innerHTML = `<p class="muted">Три личных задания недели создаются сами каждый понедельник. Здесь можно добавить своё задание или сезонный челлендж для всей команды ресторана.</p>
  <form class="card stack" id="cf"><b>Новое задание</b>
    <div class="row" style="flex-wrap:wrap;gap:6px">${TPL.map((t, i) => `<button type="button" class="btn sm ghost" data-t="${i}">${t[0]} ${t[1]}</button>`).join('')}</div>
    <div class="grid2">
      <select id="ck"><option value="week">Личное — каждый сам за себя</option><option value="season">Командное — средний результат ресторана</option></select>
      <select id="cc"><option value="">Обе команды</option><option value="vilka">Только VILKA</option><option value="grano">Только GRANO</option></select>
      <input id="ci" placeholder="Иконка-эмодзи" value="🎯" maxlength="4">
      <input id="ct" placeholder="Название, например «Мастер блица»" required>
      <select id="cm">${Object.entries(METRIC_FULL).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      <input id="cn" type="number" min="1" placeholder="Цель (сколько)" required>
      <input id="cp" type="number" min="0" max="1000" placeholder="Награда, баллов" value="30" required>
      <label class="small muted" style="display:flex;flex-direction:column;gap:4px">Начало<input id="cs" type="date" value="${today}" required></label>
      <label class="small muted" style="display:flex;flex-direction:column;gap:4px">Конец<input id="ce" type="date" value="${sunS}" required></label>
    </div>
    <textarea id="cd" rows="2" placeholder="Описание: что нужно сделать (необязательно)"></textarea>
    <button class="btn">Добавить задание</button></form>
  <div class="tw"><table class="t"><tr><th>Задание</th><th>Кому</th><th>Сроки</th><th>Цель</th><th></th></tr>
  ${(list || []).map((c) => `<tr><td>${esc(c.icon)} <b>${esc(c.title)}</b><div class="small muted">${c.scope === 'team' ? 'Командное' : 'Личное'}${c.tpl ? ' · авто' : ''}</div></td>
    <td class="small">${c.concept ? c.concept.toUpperCase() : 'Все'}</td><td class="small">${new Date(c.starts).toLocaleDateString('ru-RU')} – ${new Date(c.ends).toLocaleDateString('ru-RU')}</td>
    <td class="small">${c.target} ${METRIC[c.metric]} → ⭐ ${c.pts}</td><td><button class="btn sm ghost" data-del="${c.id}">Удалить</button></td></tr>`).join('')}</table></div>`;
  const f = (id) => ab.querySelector('#' + id);
  ab.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { const t = TPL[+b.dataset.t]; f('ci').value = t[0]; f('ct').value = t[1]; f('cm').value = t[2]; f('cn').value = t[3]; });
  f('cf').onsubmit = async (e) => {
    e.preventDefault();
    if (f('ce').value < f('cs').value) return toast('Конец раньше начала');
    const team = f('ck').value === 'season';
    const { error } = await sb.from('challenges').insert({ kind: team ? 'season' : 'week', scope: team ? 'team' : 'personal', concept: f('cc').value || null, icon: f('ci').value || '🎯',
      title: f('ct').value.trim(), descr: f('cd').value.trim() || null, metric: f('cm').value, target: +f('cn').value, pts: +f('cp').value, starts: f('cs').value, ends: f('ce').value });
    toast(error ? error.message : 'Задание добавлено'); if (!error) aCompete(ctx, ab);
  };
  ab.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
    if (!(await ask('Удалить задание? Уже выданные баллы останутся у сотрудников.', 'Удалить', true))) return;
    const { error } = await sb.from('challenges').delete().eq('id', b.dataset.del); toast(error ? error.message : 'Удалено'); aCompete(ctx, ab);
  });
}
