/* Кабинет: сводка, SERVICE CONTROL (проверки, отчёты смен, задачи администраторам), задания сотрудникам */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const ru = (s) => s ? new Date(String(s).length === 10 ? s + 'T12:00' : s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '';
const short = (n) => String(n || '').replace(/^VILKA\s+/, '');
const tone = (v) => v == null ? '' : v >= 85 ? 'ok' : v >= 70 ? 'mid' : 'bad';
const SIGN = 'Евгения Борисовна, сервис-менеджер · 8 777 521 89 09';
let C;
const rests = () => C.S.rests.filter((r) => r.concept === C.S.concept);
const rname = (id) => C.S.rests.find((r) => r.id === id)?.name || '';

function modal(html, cls = '') {
  const m = document.createElement('div'); m.className = 'modal ' + cls; m.innerHTML = `<div class="card stack">${html}</div>`;
  m.onclick = (e) => { if (e.target === m || e.target.closest('[data-x]')) m.remove(); };
  document.body.appendChild(m); return m;
}
function copyModal(title, text) {
  const m = modal(`<div class="row between"><b class="h2">${esc(title)}</b><button class="pm" data-x>✕</button></div><textarea rows="14" id="rt">${esc(text)}</textarea>
    <button class="btn" id="rc">Скопировать</button>`);
  m.querySelector('#rc').onclick = async () => { try { await navigator.clipboard.writeText(m.querySelector('#rt').value); C.toast('Скопировано — вставьте в чат'); } catch (e) { m.querySelector('#rt').select(); C.toast('Выделено — скопируйте вручную'); } };
}

/* ============ СВОДКА ============ */
export async function aDash(ctx, ab) {
  C = ctx; const { sb, S } = ctx;
  const [{ data: d, error }, { data: dsc }] = await Promise.all([sb.rpc('admin_dashboard', { p_concept: S.concept }), sb.rpc('admin_discipline', { p_concept: S.concept })]);
  if (error) { ab.innerHTML = `<p class="muted">${esc(error.message)}</p>`; return; }
  const R = d.rests || [];
  const sum = R.reduce((a, r) => ({ staff: a.staff + r.staff, act: a.act + r.active7 }), { staff: 0, act: 0 });
  ab.innerHTML = `
  <div class="dash-h"><div><span class="small muted">Неделя ${ru(d.week_from)}–${ru(d.week_to)}</span><div class="h2">${S.concept === 'grano' ? 'GRANO' : 'VILKA'}: заходили ${sum.act} из ${sum.staff} сотрудников</div></div>
    <button class="btn sm" id="wr">📋 Отчёт за неделю</button></div>
  <div class="rsgrid">${R.map((r) => {
    const a = r.last_audit, rp = r.reports || { ok: 0, late: 0, none: 0 };
    return `<div class="rcard"><div class="rc-h"><b class="h2">${esc(short(r.name))}</b>
        <a class="ring sm ${tone(a?.score)}" style="--p:${a?.score ?? 0}" href="#/admin/control/audits" title="Последняя проверка"><span>${a ? a.score + '%' : '—'}</span></a></div>
      <span class="small muted">${a ? `Проверка ${ru(a.at)}${r.audit30 != null ? ` · среднее за 30 дней ${r.audit30}%` : ''}` : 'Проверок ещё не было'}</span>
      <div class="kpis"><div><b>${r.active7}/${r.staff}</b><small>заходили за 7 дней</small></div><div><b>${Math.round(r.week_pts)}</b><small>баллов на человека</small></div><div><b>${r.tests}</b><small>тестов сдано</small></div></div>
      ${(() => { const x = (dsc || {})[r.id] || {}, b = x.brief || {}, mk = (v) => v === 'ok' ? '✓' : v === 'late' ? '!' : v === 'none' ? '✕' : '·';
        return `<a class="rrow" href="#/admin/control/reports"><span>Пятиминутки за неделю</span><span class="dots"><i class="ok">${b.ok || 0}</i><i class="mid">${b.late || 0}</i><i class="bad">${b.none || 0}</i></span></a>
        <a class="rrow" href="#/admin/control/reports"><span>Генуборка · инвентаризация · табель</span><b class="mk">${mk(x.clean)} ${mk(x.inventory)} ${mk(x.tabel)}</b></a>
        <a class="rrow" href="#/admin/control/reports"><span>Видео пятиминуток за месяц</span><b>${x.videos || 0} из ${x.admins || 0}</b></a>`; })()}
      <a class="rrow" href="#/admin/control/reports"><span>Все отметки дисциплины</span><span class="dots"><i class="ok">${rp.ok}</i><i class="mid">${rp.late}</i><i class="bad">${rp.none}</i></span></a>
      <a class="rrow" href="#/admin/control/tasks"><span>Задачи администраторам</span><b class="${r.overdue ? 'bad-t' : ''}">${r.open_tasks}${r.overdue ? ` · просрочено ${r.overdue}` : ''}</b></a></div>`;
  }).join('')}</div>
  <div class="dgrid">
    <div class="card stack"><b>💤 Не заходили 7+ дней</b>${(d.idle || []).length ? d.idle.slice(0, 12).map((p) => `<div class="li"><span>${esc(p.name)}</span><span class="small muted">${esc(short(rname(p.rest)))} · ${p.seen ? ru(p.seen) : 'ни разу'}</span></div>`).join('') : '<span class="small muted">Все на месте 👍</span>'}</div>
    <div class="card stack"><b>🎯 Где ошибаются чаще всего</b>${(d.weak || []).length ? d.weak.map((w) => `<a class="li" href="#/admin/questions/${encodeURIComponent(w.block_id)}"><span>${esc(w.question)}</span><span class="pill" style="color:var(--bad)">${w.pct}%</span></a>`).join('') + '<span class="small muted">Процент неверных ответов. Эти темы стоит разобрать на пятиминутке.</span>' : '<span class="small muted">Пока мало ответов для выводов.</span>'}</div>
  </div>
  <div class="dgrid">
    <a class="card rrow" href="#/admin/shop"><span>🎁 Заказы магазина ждут выдачи</span><b>${d.orders}</b></a>
    <div class="card stack"><b>🎂 Дни рождения в ближайшие 2 недели</b>${(d.bdays || []).length ? d.bdays.map((b) => `<span>${esc(b.name)} — ${b.md}</span>`).join('') : '<span class="small muted">Нет</span>'}</div>
  </div>`;
  ab.querySelector('#wr').onclick = () => {
    const L = [`Отчёт по обучению и сервису ${S.concept === 'grano' ? 'GRANO' : 'VILKA'}`, `Неделя ${ru(d.week_from)}–${ru(d.week_to)}`, ''];
    R.forEach((r) => {
      const rp = r.reports || {};
      L.push(`▪️ ${r.name}`, `Заходили в обучение: ${r.active7} из ${r.staff}`, `Баллов на сотрудника за неделю: ${Math.round(r.week_pts)}`, `Сдано тестов всего: ${r.tests}`,
        `Последняя проверка сервиса: ${r.last_audit ? r.last_audit.score + '% (' + ru(r.last_audit.at) + ')' : 'не проводилась'}`,
        `Отчёты и пятиминутки: вовремя ${rp.ok || 0}, с опозданием ${rp.late || 0}, не сделано ${rp.none || 0}`,
        `Открытые задачи администраторов: ${r.open_tasks}${r.overdue ? `, из них просрочено ${r.overdue}` : ''}`, '');
    });
    if ((d.weak || []).length) { L.push('Темы, где чаще ошибаются:'); d.weak.slice(0, 3).forEach((w) => L.push(`— ${w.question} (${w.pct}% ошибок)`)); L.push(''); }
    L.push(`Подготовила: ${SIGN}`);
    copyModal('Отчёт за неделю', L.join('\n'));
  };
}

/* ============ SERVICE CONTROL ============ */
const CSUB = [['audits', 'Проверки'], ['reports', 'Дисциплина'], ['briefs', 'Пятиминутки'], ['tasks', 'Задачи администраторам'], ['setup', 'Администраторы и чек-листы']];
export async function aControl(ctx, ab, sub = 'audits') {
  C = ctx;
  ab.innerHTML = `<div class="subtabs">${CSUB.map(([k, n]) => `<a href="#/admin/control/${k}" class="${sub === k ? 'on' : ''}">${n}</a>`).join('')}</div><div id="cb" class="stack"><div class="spin"></div></div>`;
  const cb = ab.querySelector('#cb');
  if (sub === 'reports') return reports(cb);
  if (sub === 'tasks') return tasks(cb);
  if (sub === 'briefs') return briefs(cb);
  if (sub === 'setup') return setup(cb);
  return audits(cb);
}
const loadMgrs = async () => (await C.sb.from('managers').select('*').order('name')).data || [];

async function audits(cb) {
  const { sb } = C;
  const ids = rests().map((r) => r.id);
  const [{ data: list }, mg, { data: cls }] = await Promise.all([
    sb.from('audits').select('*').in('restaurant_id', ids).order('at', { ascending: false }).limit(60), loadMgrs(),
    sb.from('checklists').select('*').eq('active', true).or(`concept.is.null,concept.eq.${C.S.concept}`).order('sort')]);
  const mn = (id) => mg.find((m) => m.id === id)?.name || '';
  cb.innerHTML = `<div class="card stack"><b>Новая проверка</b><div class="grid2">
      <select id="ar">${rests().map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select>
      <select id="am"></select>
      <select id="ac">${(cls || []).map((c) => `<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select>
      <button class="btn" id="ago">Начать проверку</button></div>
      ${mg.length ? '' : '<span class="small muted">Добавьте администраторов во вкладке «Администраторы и чек-листы», чтобы видеть оценки по каждому.</span>'}</div>
    ${(list || []).length ? `<div class="alist">${list.map((a) => `<button class="arow" data-a="${a.id}"><span class="ring sm ${tone(a.score)}" style="--p:${a.score}"><span>${a.score}%</span></span>
      <span class="at"><b>${esc(a.title || 'Проверка')}</b><small>${esc(rname(a.restaurant_id))}${a.manager_id ? ' · ' + esc(mn(a.manager_id)) : ''} · ${new Date(a.at).toLocaleDateString('ru-RU')}</small></span><span class="go">›</span></button>`).join('')}</div>`
      : '<p class="muted">Проверок пока нет. Начните первую — займёт 5 минут, отмечайте пункты прямо в зале с телефона.</p>'}`;
  const fillM = () => { const r = cb.querySelector('#ar').value; cb.querySelector('#am').innerHTML = '<option value="">Администратор: не указан</option>' + mg.filter((m) => m.active && m.restaurant_id === r).map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join(''); };
  cb.querySelector('#ar').onchange = fillM; fillM();
  cb.querySelector('#ago').onclick = () => { const cl = (cls || []).find((c) => c.id === +cb.querySelector('#ac').value); if (!cl) return C.toast('Нет чек-листа'); runAudit(cl, cb.querySelector('#ar').value, +cb.querySelector('#am').value || null, mn(+cb.querySelector('#am').value)); };
  cb.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => viewAudit(list.find((x) => x.id === +b.dataset.a), mn, cls || []));
}

function score(ans, cl) {
  let y = 0, n = 0; cl.sections.forEach((s, i) => s.items.forEach((_, j) => { const v = ans[i + '.' + j]?.v; if (v === 1) y++; if (v === 0) n++; }));
  return y + n ? Math.round(100 * y / (y + n)) : 0;
}

function runAudit(cl, rest, mid, mname) {
  const ans = {};
  const o = document.createElement('div'); o.className = 'audit';
  const total = cl.sections.reduce((a, s) => a + s.items.length, 0);
  o.innerHTML = `<div class="au-top"><button class="pm" id="ax">✕</button><div><b>${esc(cl.title)}</b><small>${esc(rname(rest))}${mname ? ' · ' + esc(mname) : ''}</small></div>
      <span class="ring sm" id="asc" style="--p:0"><span>0%</span></span></div>
    <div class="au-body">${cl.sections.map((s, i) => `<section><div class="h2">${esc(s.t)}</div>${s.items.map((it, j) => `<div class="ai" data-k="${i}.${j}">
      <span class="ait">${esc(it)}</span><div class="aib"><button data-v="1" aria-label="Да">✓</button><button data-v="0" aria-label="Нет">✕</button><button data-v="n" aria-label="Комментарий">💬</button></div>
      <input class="an" placeholder="Комментарий" hidden></div>`).join('')}</section>`).join('')}
      <textarea id="acm" rows="3" placeholder="Общий вывод и что исправить"></textarea>
      <button class="btn block" id="asv">Сохранить проверку</button></div>`;
  document.body.appendChild(o); document.body.classList.add('playing');
  const upd = () => { const sc = score(ans, cl), el = o.querySelector('#asc'), done = Object.values(ans).filter((x) => x.v != null).length; el.style.setProperty('--p', sc); el.className = 'ring sm ' + tone(sc); el.innerHTML = `<span>${sc}%</span>`; o.querySelector('#asv').textContent = `Сохранить проверку (${done} из ${total})`; };
  o.querySelectorAll('.ai').forEach((row) => {
    const k = row.dataset.k;
    row.querySelectorAll('[data-v]').forEach((b) => b.onclick = () => {
      if (b.dataset.v === 'n') { const n = row.querySelector('.an'); n.hidden = !n.hidden; if (!n.hidden) n.focus(); return; }
      const v = +b.dataset.v; ans[k] = ans[k] || {}; ans[k].v = ans[k].v === v ? null : v;
      row.classList.toggle('y', ans[k].v === 1); row.classList.toggle('n', ans[k].v === 0); if (ans[k].v === 0) row.querySelector('.an').hidden = false; upd();
    });
    row.querySelector('.an').oninput = (e) => { ans[k] = ans[k] || {}; ans[k].c = e.target.value; };
  });
  upd();
  const close = () => { o.remove(); document.body.classList.remove('playing'); };
  o.querySelector('#ax').onclick = async () => { if (!Object.keys(ans).length || await C.ask('Выйти без сохранения?', 'Выйти', true)) close(); };
  o.querySelector('#asv').onclick = async (e) => {
    if (!Object.values(ans).some((x) => x.v != null)) return C.toast('Отметьте хотя бы один пункт');
    e.target.disabled = true;
    const { error } = await C.sb.from('audits').insert({ restaurant_id: rest, manager_id: mid, checklist_id: cl.id, title: cl.title, answers: { sections: cl.sections, a: ans }, score: score(ans, cl), comment: o.querySelector('#acm').value.trim() || null });
    if (error) { C.toast(error.message); e.target.disabled = false; return; }
    close(); C.toast('Проверка сохранена'); location.hash = '#/admin/control/audits'; C.route();
  };
}

function viewAudit(a, mn) {
  const secs = a.answers?.sections || [], A = a.answers?.a || {};
  const bad = [], good = [];
  secs.forEach((s, i) => s.items.forEach((it, j) => { const x = A[i + '.' + j]; if (x?.v === 0) bad.push([s.t, it, x.c]); if (x?.v === 1) good.push(it); }));
  const m = modal(`<div class="row between"><div><b class="h2">${esc(a.title)}</b><div class="small muted">${esc(rname(a.restaurant_id))}${a.manager_id ? ' · ' + esc(mn(a.manager_id)) : ''} · ${new Date(a.at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div></div>
      <span class="ring ${tone(a.score)}" style="--p:${a.score}"><span>${a.score}%</span></span></div>
    <b>Выполнено: ${good.length} · Не выполнено: ${bad.length}</b>
    ${bad.length ? `<div class="stack" style="gap:6px">${bad.map(([s, it, c]) => `<div class="bad-it"><small>${esc(s)}</small><span>✕ ${esc(it)}</span>${c ? `<i>${esc(c)}</i>` : ''}</div>`).join('')}</div>` : '<span class="pill ok">Все отмеченные пункты выполнены</span>'}
    ${a.comment ? `<p><b>Вывод:</b> ${esc(a.comment)}</p>` : ''}
    <button class="btn" id="vt">Текст для администратора</button><button class="btn ghost" id="vd" style="color:var(--bad)">Удалить проверку</button><button class="btn ghost" data-x>Закрыть</button>`, 'wide-m');
  m.querySelector('#vt').onclick = () => {
    const L = [`Итоги проверки: ${a.title}`, `${rname(a.restaurant_id)}, ${new Date(a.at).toLocaleDateString('ru-RU')}`, `Результат: ${a.score}%`, ''];
    if (bad.length) { L.push('Что нужно исправить:'); bad.forEach(([, it, c]) => L.push(`— ${it}${c ? ` (${c})` : ''}`)); L.push(''); }
    if (a.comment) L.push(a.comment, '');
    L.push('Прошу Вас разобрать эти пункты с командой на ближайшей пятиминутке и сообщить мне о результате.', '', SIGN);
    m.remove(); copyModal('Сообщение администратору', L.join('\n'));
  };
  m.querySelector('#vd').onclick = async () => { if (!(await C.ask('Удалить эту проверку?', 'Удалить', true))) return; await C.sb.from('audits').delete().eq('id', a.id); m.remove(); C.route(); };
}

/* --- дисциплина: ежедневные, еженедельные и ежемесячные обязательства --- */
const SLOTS = [['brief', 'П', 'Пятиминутка в 10:45'], ['morning', 'У', 'Утренний отчёт: официанты и стоп-лист'], ['evening', 'В', 'Вечерний отчёт: резервы и официанты'], ['night', 'Н', 'Ночной отчёт: закрытие смены']];
const NEXT = { undefined: 'ok', ok: 'late', late: 'none', none: undefined };
const ST = { ok: 'Вовремя', late: 'С опозданием', none: 'Не сделано' };
const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const DEAD = { inventory: 28, tabel: 5 };
let wkOff = 0, mOff = 0;
async function reports(cb) {
  const t = new Date(); t.setDate(t.getDate() - ((t.getDay() + 6) % 7) + wkOff * 7);
  const days = [...Array(7)].map((_, i) => { const d = new Date(t); d.setDate(t.getDate() + i); return d; });
  const m0 = new Date(); m0.setDate(1); m0.setMonth(m0.getMonth() + mOff); const mS = ymd(m0);
  const ids = rests().map((r) => r.id);
  const [{ data }, { data: mc }, mg] = await Promise.all([
    C.sb.from('shift_reports').select('*').in('restaurant_id', ids).gte('day', ymd(days[0])).lte('day', ymd(days[6])),
    C.sb.from('monthly_checks').select('*').in('restaurant_id', ids).eq('month', mS), loadMgrs()]);
  const M = {}, SRC = {}; (data || []).forEach((x) => { const k = `${x.restaurant_id}|${x.day}|${x.slot}`; M[k] = x.status; if (x.source === 'lead') SRC[k] = x.at; });
  const MC = {}; (mc || []).forEach((x) => (MC[`${x.restaurant_id}|${x.kind}|${x.manager_id || 0}`] = x));
  const today = ymd(new Date());
  const cell = (r, d, s, l, tt) => { const k = `${r}|${d}|${s}`, v = M[k], self = SRC[k]; return `<button class="s ${v || ''} ${self ? 'self' : ''}" data-r="${r}" data-d="${d}" data-s="${s}" title="${tt}${v ? ': ' + ST[v] : ''}${self ? ' · отметил администратор в ' + new Date(self).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}">${l}</button>`; };
  const mbtn = (r, kind, mid, label) => { const x = MC[`${r}|${kind}|${mid || 0}`]; return `<button class="mchk ${x?.status || ''}" data-mr="${r}" data-mk="${kind}" data-mm="${mid || ''}"><span>${label}</span><b>${x?.status ? ST[x.status] : 'Отметить'}</b></button>`; };
  cb.innerHTML = `<div class="disc-note">Отмечайте одним нажатием: <span class="s ok">✓</span> вовремя, <span class="s late">!</span> с опозданием или позже (например, «пятиминутку проведём после уборки»), <span class="s none">✕</span> не сделано. Повторное нажатие очищает. Квадрат с точкой — администратор отметил сам; наведите или нажмите, чтобы поправить.</div>
    <div class="row between"><button class="btn sm ghost" id="wp">‹</button><b>Неделя ${ru(ymd(days[0]))} – ${ru(ymd(days[6]))}</b><button class="btn sm ghost" id="wn" ${wkOff >= 0 ? 'disabled' : ''}>›</button></div>
    <div class="legend small muted">П — пятиминутка · У — утренний отчёт · В — вечерний · Н — ночной · Г — генеральная уборка (воскресенье)</div>
    <div class="tw"><table class="t rep"><tr><th></th>${days.map((d) => `<th class="${ymd(d) === today ? 'td' : ''}">${d.toLocaleDateString('ru-RU', { weekday: 'short' })}<br><small>${d.getDate()}</small></th>`).join('')}<th>Итог</th></tr>
    ${rests().map((r) => {
      let ok = 0, all = 0;
      days.forEach((d) => [...SLOTS.map((x) => x[0]), 'clean'].forEach((s) => { const v = M[`${r.id}|${ymd(d)}|${s}`]; if (v) { all++; if (v === 'ok') ok++; } }));
      return `<tr><th class="rn">${esc(short(r.name))}</th>${days.map((d, i) => `<td class="${ymd(d) === today ? 'td' : ''}"><div class="sl">${SLOTS.map(([s, l, tt]) => cell(r.id, ymd(d), s, l, tt)).join('')}${i === 6 ? cell(r.id, ymd(d), 'clean', 'Г', 'Генеральная уборка') : ''}</div></td>`).join('')}
        <td><b>${all ? Math.round(100 * ok / all) + '%' : '—'}</b><div class="small muted">вовремя</div></td></tr>`;
    }).join('')}</table></div>
    <div class="row between" style="margin-top:8px"><button class="btn sm ghost" id="mp">‹</button><b class="h2" style="text-transform:capitalize">${MONTHS[m0.getMonth()]} ${m0.getFullYear()}</b><button class="btn sm ghost" id="mn" ${mOff >= 0 ? 'disabled' : ''}>›</button></div>
    <div class="rsgrid">${rests().map((r) => {
      const ad = mg.filter((m) => m.active && m.restaurant_id === r.id);
      return `<div class="rcard"><b class="h2">${esc(short(r.name))}</b>
        ${mbtn(r.id, 'inventory', null, `📦 Инвентаризация до ${DEAD.inventory}-го`)}${mbtn(r.id, 'tabel', null, `🗓️ Табель до ${DEAD.tabel}-го`)}
        <span class="small muted">🎥 Видео пятиминутки — раз в месяц от каждого администратора</span>
        ${ad.length ? ad.map((m) => { const x = MC[`${r.id}|video|${m.id}`]; return `${mbtn(r.id, 'video', m.id, m.name)}${x?.link ? `<a class="small" href="${esc(x.link)}" target="_blank" rel="noopener">▶ Смотреть видео</a>` : ''}`; }).join('') : '<span class="small muted">Добавьте администраторов во вкладке «Администраторы и чек-листы».</span>'}</div>`;
    }).join('')}</div>`;
  cb.querySelector('#wp').onclick = () => { wkOff--; reports(cb); };
  cb.querySelector('#wn').onclick = () => { if (wkOff < 0) { wkOff++; reports(cb); } };
  cb.querySelector('#mp').onclick = () => { mOff--; reports(cb); };
  cb.querySelector('#mn').onclick = () => { if (mOff < 0) { mOff++; reports(cb); } };
  cb.querySelectorAll('.s[data-r]').forEach((b) => b.onclick = async () => {
    const k = `${b.dataset.r}|${b.dataset.d}|${b.dataset.s}`, nv = NEXT[M[k]];
    const q = nv ? C.sb.from('shift_reports').upsert({ restaurant_id: b.dataset.r, day: b.dataset.d, slot: b.dataset.s, status: nv, source: 'admin', at: new Date().toISOString() })
      : C.sb.from('shift_reports').delete().match({ restaurant_id: b.dataset.r, day: b.dataset.d, slot: b.dataset.s });
    M[k] = nv; delete SRC[k]; b.className = 's ' + (nv || '');
    const { error } = await q; if (error) C.toast(error.message);
  });
  cb.querySelectorAll('.mchk').forEach((b) => b.onclick = () => {
    const r = b.dataset.mr, kind = b.dataset.mk, mid = +b.dataset.mm || null, x = MC[`${r}|${kind}|${mid || 0}`];
    const m = modal(`<div class="row between"><b class="h2">${esc(b.querySelector('span').textContent)}</b><button class="pm" data-x>✕</button></div>
      <span class="small muted">${esc(rname(r))} · ${MONTHS[m0.getMonth()]}</span>
      <div class="stack" style="gap:8px">${Object.entries(ST).map(([k, v]) => `<button class="btn ${x?.status === k ? '' : 'ghost'}" data-st="${k}">${v}</button>`).join('')}</div>
      ${kind === 'video' ? `<input id="vl" placeholder="Ссылка на видео (Google Диск, Telegram, YouTube)" value="${esc(x?.link || '')}">` : ''}
      <input id="vn" placeholder="Комментарий (необязательно)" value="${esc(x?.note || '')}">
      ${x ? '<button class="btn ghost" data-st="">Очистить отметку</button>' : ''}`);
    m.querySelectorAll('[data-st]').forEach((s) => s.onclick = async () => {
      let error;
      if (x) ({ error } = s.dataset.st ? await C.sb.from('monthly_checks').update({ status: s.dataset.st, link: m.querySelector('#vl')?.value.trim() || null, note: m.querySelector('#vn').value.trim() || null, updated_at: new Date().toISOString() }).eq('id', x.id) : await C.sb.from('monthly_checks').delete().eq('id', x.id));
      else ({ error } = await C.sb.from('monthly_checks').insert({ restaurant_id: r, month: mS, kind, manager_id: mid, status: s.dataset.st, link: m.querySelector('#vl')?.value.trim() || null, note: m.querySelector('#vn').value.trim() || null }));
      if (error) return C.toast(error.message); m.remove(); reports(cb);
    });
  });
}

/* --- пятиминутки: темы и материалы --- */
async function briefs(cb) {
  const { data: list } = await C.sb.from('briefs').select('*').or(`concept.is.null,concept.eq.${C.S.concept}`).order('day', { ascending: false }).limit(60);
  const today = ymd(new Date());
  const url = (b) => `${location.origin}${location.pathname}#/brief/${b.token}`;
  const up = (list || []).filter((b) => b.day >= today).reverse(), past = (list || []).filter((b) => b.day < today);
  const row = (b) => `<div class="brief-r ${b.day === today ? 'now' : ''}"><div class="bd-d"><b>${new Date(b.day + 'T12:00').getDate()}</b><small>${new Date(b.day + 'T12:00').toLocaleDateString('ru-RU', { month: 'short', weekday: 'short' })}</small></div>
    <div class="bt"><b>${esc(b.title)}</b>${b.body ? `<small>${esc(b.body.slice(0, 120))}${b.body.length > 120 ? '…' : ''}</small>` : ''}<small class="muted">${b.concept ? b.concept.toUpperCase() : 'Обе команды'}</small></div>
    <div class="row" style="gap:4px"><button class="btn sm" data-bs="${b.id}">Отправить</button><button class="pm" data-be="${b.id}" aria-label="Изменить">✎</button></div></div>`;
  cb.innerHTML = `<div id="sums" class="stack"></div><p class="small muted">Задайте тему заранее. Администратор получит ссылку на материал (без входа в приложение), а сотрудники увидят тему дня на главной.</p>
    <button class="btn" id="bn">+ Тема пятиминутки</button>
    <div class="sec-t"><span class="h2">Ближайшие</span></div>${up.length ? up.map(row).join('') : '<p class="muted">Тем на ближайшие дни нет.</p>'}
    ${past.length ? `<details><summary class="small muted">Прошедшие (${past.length})</summary><div class="stack" style="gap:8px;margin-top:8px">${past.map(row).join('')}</div></details>` : ''}`;
  const edit = (b) => {
    const m = modal(`<div class="row between"><b class="h2">${b ? 'Тема пятиминутки' : 'Новая тема'}</b><button class="pm" data-x>✕</button></div>
      <label class="small muted" style="display:flex;flex-direction:column;gap:4px">Дата<input id="bd" type="date" value="${b?.day || today}"></label>
      <select id="bc"><option value="${C.S.concept}">Только ${C.S.concept === 'grano' ? 'GRANO' : 'VILKA'}</option><option value="" ${b && !b.concept ? 'selected' : ''}>Обе команды</option></select>
      <input id="bt" placeholder="Тема, например: «Встреча гостя без вопроса „Вас ожидают?“»" value="${esc(b?.title || '')}">
      <textarea id="bb" rows="10" placeholder="Материал для администратора: что сказать команде, примеры фраз, на что обратить внимание">${esc(b?.body || '')}</textarea>
      <button class="btn" id="bs">Сохранить</button>${b ? '<button class="btn ghost" id="bdel" style="color:var(--bad)">Удалить</button>' : ''}`, 'wide-m');
    m.querySelector('#bs').onclick = async () => {
      const row = { day: m.querySelector('#bd').value, concept: m.querySelector('#bc').value || null, title: m.querySelector('#bt').value.trim(), body: m.querySelector('#bb').value.trim() || null };
      if (!row.title || !row.day) return C.toast('Укажите дату и тему');
      const { error } = b ? await C.sb.from('briefs').update(row).eq('id', b.id) : await C.sb.from('briefs').insert(row);
      if (error) return C.toast(error.message); m.remove(); C.toast('Сохранено'); briefs(cb);
    };
    if (b) m.querySelector('#bdel').onclick = async () => { if (!(await C.ask('Удалить тему?', 'Удалить', true))) return; await C.sb.from('briefs').delete().eq('id', b.id); m.remove(); briefs(cb); };
  };
  summaries(cb.querySelector('#sums'));
  cb.querySelector('#bn').onclick = () => edit(null);
  cb.querySelectorAll('[data-be]').forEach((x) => x.onclick = () => edit(list.find((b) => b.id === +x.dataset.be)));
  cb.querySelectorAll('[data-bs]').forEach((x) => x.onclick = () => {
    const b = list.find((y) => y.id === +x.dataset.bs);
    copyModal('Сообщение администраторам', [`Пятиминутка ${new Date(b.day + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })}`, `Тема: ${b.title}`, '', `Материал: ${url(b)}`, '', 'Прошу Вас заранее ознакомиться с материалом и провести пятиминутку с командой в 10:45.', '', SIGN].join('\n'));
  });
}

/* --- задачи администраторам --- */
async function tasks(cb) {
  const ids = rests().map((r) => r.id);
  const [{ data: list }, mg] = await Promise.all([C.sb.from('mtasks').select('*').in('restaurant_id', ids).order('done_at', { nullsFirst: true }).order('due', { nullsFirst: false }).limit(150), loadMgrs()]);
  const mn = (id) => mg.find((m) => m.id === id)?.name || '';
  const today = ymd(new Date());
  const open = (list || []).filter((t) => !t.done_at), done = (list || []).filter((t) => t.done_at).slice(0, 30);
  const row = (t) => `<div class="task ${t.done_at ? 'dn' : ''} ${!t.done_at && t.due && t.due < today ? 'late' : ''}"><label><input type="checkbox" data-d="${t.id}" ${t.done_at ? 'checked' : ''}></label>
    <div class="tt"><b>${esc(t.title)}</b><small>${esc(short(rname(t.restaurant_id)))}${t.manager_id ? ' · ' + esc(mn(t.manager_id)) : ''}${t.due ? ' · до ' + ru(t.due) : ''}${t.done_at ? ' · выполнено ' + ru(t.done_at) : ''}</small>${t.note ? `<span class="small">${esc(t.note)}</span>` : ''}</div>
    <button class="pm" data-del="${t.id}" aria-label="Удалить">✕</button></div>`;
  cb.innerHTML = `<p class="small muted">Задачи после тренингов и проверок: что администратор должен закрепить с персоналом. Отмечайте выполнение — просроченные видны в сводке.</p>
    <form class="card stack" id="tf"><b>Новая задача</b><div class="grid2">
      <select id="tr">${rests().map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select><select id="tm"></select>
      <input id="tt" placeholder="Задача, например: отработать встречу гостя с новыми официантами" required>
      <label class="small muted" style="display:flex;flex-direction:column;gap:4px">Срок<input id="td" type="date"></label></div>
      <textarea id="tn" rows="2" placeholder="Подробности (необязательно)"></textarea><button class="btn">Добавить задачу</button></form>
    <div class="stack" style="gap:8px">${open.length ? open.map(row).join('') : '<p class="muted">Открытых задач нет.</p>'}</div>
    ${done.length ? `<details><summary class="small muted">Выполненные (${done.length})</summary><div class="stack" style="gap:8px;margin-top:8px">${done.map(row).join('')}</div></details>` : ''}`;
  const fillM = () => { const r = cb.querySelector('#tr').value; cb.querySelector('#tm').innerHTML = '<option value="">Всем администраторам точки</option>' + mg.filter((m) => m.active && m.restaurant_id === r).map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join(''); };
  cb.querySelector('#tr').onchange = fillM; fillM();
  cb.querySelector('#tf').onsubmit = async (e) => {
    e.preventDefault(); const f = (id) => cb.querySelector('#' + id).value;
    const { error } = await C.sb.from('mtasks').insert({ restaurant_id: f('tr'), manager_id: +f('tm') || null, title: f('tt').trim(), due: f('td') || null, note: f('tn').trim() || null });
    C.toast(error ? error.message : 'Задача добавлена'); if (!error) tasks(cb);
  };
  cb.querySelectorAll('[data-d]').forEach((c) => c.onchange = async () => { await C.sb.from('mtasks').update({ done_at: c.checked ? new Date().toISOString() : null }).eq('id', c.dataset.d); tasks(cb); });
  cb.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => { if (!(await C.ask('Удалить задачу?', 'Удалить', true))) return; await C.sb.from('mtasks').delete().eq('id', b.dataset.del); tasks(cb); });
}

/* --- администраторы и чек-листы --- */
async function setup(cb) {
  const [mg, { data: cls }] = await Promise.all([loadMgrs(), C.sb.from('checklists').select('*').or(`concept.is.null,concept.eq.${C.S.concept}`).order('sort')]);
  const ids = new Set(rests().map((r) => r.id));
  cb.innerHTML = `<div class="card stack"><b>Администраторы</b><span class="small muted">Только имена для проверок и задач. Аккаунтов у администраторов нет.</span>
      <form class="row" id="mf" style="flex-wrap:wrap"><input id="mnm" placeholder="Имя и фамилия" required style="flex:2;min-width:160px"><select id="mr" style="flex:1;min-width:140px">${rests().map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select><button class="btn sm">Добавить</button></form>
      ${mg.filter((m) => ids.has(m.restaurant_id)).map((m) => `<div class="li" style="${m.active ? '' : 'opacity:.5'}"><span><b>${esc(m.name)}</b> <span class="small muted">${esc(short(rname(m.restaurant_id)))}</span></span><button class="btn sm ghost" data-ma="${m.id}" data-on="${m.active ? 0 : 1}">${m.active ? 'Скрыть' : 'Вернуть'}</button></div>`).join('') || '<span class="small muted">Пока никого.</span>'}</div>
    <div class="card stack"><b>Чек-листы проверок</b><span class="small muted">Формат: строка с # — раздел, строка с - — пункт проверки.</span>
      ${(cls || []).map((c) => `<div class="li"><span><b>${esc(c.title)}</b> <span class="small muted">${c.sections.reduce((a, s) => a + s.items.length, 0)} пунктов${c.active ? '' : ' · скрыт'}</span></span><button class="btn sm ghost" data-ce="${c.id}">Изменить</button></div>`).join('')}
      <button class="btn sm" id="cnew">+ Новый чек-лист</button></div>`;
  cb.querySelector('#mf').onsubmit = async (e) => { e.preventDefault(); const { error } = await C.sb.from('managers').insert({ name: cb.querySelector('#mnm').value.trim(), restaurant_id: cb.querySelector('#mr').value }); C.toast(error ? error.message : 'Добавлено'); setup(cb); };
  cb.querySelectorAll('[data-ma]').forEach((b) => b.onclick = async () => { await C.sb.from('managers').update({ active: b.dataset.on === '1' }).eq('id', b.dataset.ma); setup(cb); });
  const edit = (c) => {
    const txt = c ? c.sections.map((s) => '# ' + s.t + '\n' + s.items.map((i) => '- ' + i).join('\n')).join('\n\n') : '# Раздел\n- Пункт проверки';
    const m = modal(`<div class="row between"><b class="h2">${c ? 'Чек-лист' : 'Новый чек-лист'}</b><button class="pm" data-x>✕</button></div>
      <input id="ct" value="${esc(c?.title || '')}" placeholder="Название"><select id="cc"><option value="">Для обеих команд</option><option value="vilka" ${c?.concept === 'vilka' ? 'selected' : ''}>Только VILKA</option><option value="grano" ${c?.concept === 'grano' ? 'selected' : ''}>Только GRANO</option></select>
      <textarea id="cx" rows="16">${esc(txt)}</textarea>
      ${c ? `<label class="switch"><input type="checkbox" id="ca" ${c.active ? 'checked' : ''}> Показывать при проверке</label>` : ''}
      <button class="btn" id="cs">Сохранить</button>`, 'wide-m');
    m.querySelector('#cs').onclick = async () => {
      const secs = []; m.querySelector('#cx').value.split('\n').map((l) => l.trim()).filter(Boolean).forEach((l) => {
        if (l.startsWith('#')) secs.push({ t: l.replace(/^#+\s*/, ''), items: [] });
        else { if (!secs.length) secs.push({ t: 'Проверка', items: [] }); secs[secs.length - 1].items.push(l.replace(/^[-•*]\s*/, '')); }
      });
      const body = { title: m.querySelector('#ct').value.trim() || 'Чек-лист', concept: m.querySelector('#cc').value || null, sections: secs.filter((s) => s.items.length) };
      if (c) body.active = m.querySelector('#ca').checked;
      const { error } = c ? await C.sb.from('checklists').update(body).eq('id', c.id) : await C.sb.from('checklists').insert(body);
      if (error) return C.toast(error.message); m.remove(); C.toast('Сохранено'); setup(cb);
    };
  };
  cb.querySelectorAll('[data-ce]').forEach((b) => b.onclick = () => edit(cls.find((c) => c.id === +b.dataset.ce)));
  cb.querySelector('#cnew').onclick = () => edit(null);
}

/* ============ ЗАДАНИЯ СОТРУДНИКАМ ============ */
const AK = { msg: '💬 Личное сообщение', lesson: '📖 Изучить урок', test: '✅ Сдать тест', quest: '🗺️ Пройти квест', text: '📝 Своё задание' };
export async function aAssign(ctx, ab) {
  C = ctx; const { sb, S } = ctx;
  const [{ data: list }, { data: ppl }, { data: qs }] = await Promise.all([
    sb.from('assignments').select('*').eq('concept', S.concept).order('created_at', { ascending: false }).limit(40),
    sb.from('profiles').select('id,full_name,restaurant_id').eq('concept', S.concept).eq('role', 'staff').eq('active', true).order('full_name'),
    sb.from('quests').select('id,title').eq('concept', S.concept).eq('active', true)]);
  const who = (a) => a.user_id ? (ppl || []).find((p) => p.id === a.user_id)?.full_name || 'сотрудник' : a.restaurant_id ? rname(a.restaurant_id) : 'Все сотрудники ' + S.concept.toUpperCase();
  ab.innerHTML = `<p class="muted">Сотрудник увидит это на главной. Личное сообщение — с кнопкой «Прочитал(а)», вы видите, кто прочитал. Уроки, тесты и квесты отмечаются выполненными сами, своё задание сотрудник отмечает кнопкой «Сделано».</p>
  <form class="card stack" id="sf"><b>Новое задание</b><div class="grid2">
    <select id="sw"><option value="">Все сотрудники ${S.concept.toUpperCase()}</option>${rests().map((r) => `<option value="r:${r.id}">Только ${esc(r.name)}</option>`).join('')}${(ppl || []).map((p) => `<option value="u:${p.id}">${esc(p.full_name)}</option>`).join('')}</select>
    <select id="sk">${Object.entries(AK).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
    <select id="st"></select>
    <input id="sx" placeholder="Название задания" hidden>
    <label class="small muted" style="display:flex;flex-direction:column;gap:4px">Срок<input id="sd" type="date"></label></div>
    <textarea id="sn" rows="2" placeholder="Комментарий для сотрудника (необязательно)"></textarea><button class="btn">Отправить задание</button></form>
  ${(list || []).map((a) => `<button class="arow" data-s="${a.id}"><span class="e">${AK[a.kind].split(' ')[0]}</span><span class="at"><b>${esc(a.title)}</b><small>${esc(who(a))}${a.due ? ' · до ' + ru(a.due) : ''}</small></span><span class="pill" data-p="${a.id}">…</span></button>`).join('') || '<p class="muted">Заданий пока нет.</p>'}`;
  const f = (id) => ab.querySelector('#' + id);
  const fillT = () => {
    const k = f('sk').value, free = k === 'text' || k === 'msg'; f('st').hidden = free; f('sx').hidden = !free; f('sx').placeholder = k === 'msg' ? 'Коротко: о чём сообщение (например «Продажа десертов»)' : 'Название задания'; f('sn').placeholder = k === 'msg' ? 'Текст сообщения, например: «Увеличьте продажу десертов, предлагайте их каждому столу. И не забывайте улыбаться 🙂»' : 'Комментарий для сотрудника (необязательно)';
    f('st').innerHTML = k === 'quest' ? (qs || []).map((q) => `<option value="${q.id}">${esc(q.title)}</option>`).join('') : S.blocks.map((b) => `<option value="${esc(b.id)}">${esc(b.title)}</option>`).join('');
  };
  f('sk').onchange = fillT; fillT();
  f('sf').onsubmit = async (e) => {
    e.preventDefault(); const k = f('sk').value, w = f('sw').value;
    const free = k === 'text' || k === 'msg';
    if (k === 'msg' && !f('sn').value.trim()) return C.toast('Напишите текст сообщения');
    const title = free ? f('sx').value.trim() || (k === 'msg' ? 'Сообщение от сервис-менеджера' : '') : `${AK[k].slice(3)}: ${f('st').selectedOptions[0]?.textContent || ''}`;
    if (!title) return C.toast('Напишите название задания');
    const { error } = await sb.from('assignments').insert({ concept: S.concept, kind: k, target: free ? null : f('st').value, title, note: f('sn').value.trim() || null, due: f('sd').value || null,
      restaurant_id: w.startsWith('r:') ? w.slice(2) : null, user_id: w.startsWith('u:') ? w.slice(2) : null });
    C.toast(error ? error.message : 'Задание отправлено'); if (!error) aAssign(ctx, ab);
  };
  for (const a of list || []) {
    sb.rpc('assignment_status', { p_id: a.id }).then(({ data }) => { const el = ab.querySelector(`[data-p="${a.id}"]`); if (!el) return; const d = data || []; const n = d.filter((x) => x.done).length; el.textContent = `${n} из ${d.length}`; el.className = 'pill ' + (d.length && n === d.length ? 'ok' : ''); a._st = d; });
  }
  ab.querySelectorAll('[data-s]').forEach((b) => b.onclick = () => {
    const a = list.find((x) => x.id === +b.dataset.s), d = a._st || [];
    const m = modal(`<div class="row between"><b class="h2">${esc(a.title)}</b><button class="pm" data-x>✕</button></div>${a.note ? `<p class="small">${esc(a.note)}</p>` : ''}
      ${d.map((x) => `<div class="li"><span>${esc(x.name)} <span class="small muted">${esc(short(rname(x.rest)))}</span></span><span class="pill ${x.done ? 'ok' : ''}">${x.done ? (a.kind === 'msg' ? 'Прочитано' : 'Выполнено') : (a.kind === 'msg' ? 'Не прочитано' : 'Ещё нет')}</span></div>`).join('') || '<span class="muted">Нет сотрудников</span>'}
      <button class="btn ghost" id="adel" style="color:var(--bad)">Удалить задание</button>`, 'wide-m');
    m.querySelector('#adel').onclick = async () => { if (!(await C.ask('Удалить задание?', 'Удалить', true))) return; await sb.from('assignments').delete().eq('id', a.id); m.remove(); aAssign(ctx, ab); };
  });
}

/* ============ задания на главной у сотрудника ============ */
export async function homeAssignments(ctx) {
  const { data } = await ctx.sb.rpc('my_assignments');
  const all = (data || []).filter((a) => !a.done);
  const msgs = all.filter((a) => a.kind === 'msg'), open = all.filter((a) => a.kind !== 'msg');
  const mhtml = msgs.map((a) => `<div class="msgcard"><div class="mh"><span>💬</span><small>Сообщение от сервис-менеджера</small></div><b>${esc(a.title)}</b>${a.note ? `<p>${esc(a.note).replace(/\n/g, '<br>')}</p>` : ''}<button class="btn sm" data-asd="${a.id}">Прочитал(а) 👍</button></div>`).join('');
  if (!open.length) return mhtml;
  const link = (a) => a.kind === 'quest' ? `#/quest/${encodeURIComponent(a.target)}` : a.kind === 'text' ? '' : `#/block/${encodeURIComponent(a.target)}`;
  return mhtml + `<div class="assign"><div class="as-h"><span>📌</span><b>Задания от сервис-менеджера</b></div>
    ${open.map((a) => { const late = a.due && a.due < ymd(new Date()); return `<div class="as-i ${late ? 'late' : ''}"><div><b>${esc(a.title)}</b>${a.note ? `<small>${esc(a.note)}</small>` : ''}${a.due ? `<small class="due">${late ? 'Срок прошёл' : 'Срок'}: ${ru(a.due)}</small>` : ''}</div>
      ${link(a) ? `<a class="btn sm" href="${link(a)}">Начать</a>` : `<button class="btn sm" data-asd="${a.id}">Сделано</button>`}</div>`; }).join('')}</div>`;
}
export function bindHomeAssignments(ctx) {
  document.querySelectorAll('[data-asd]').forEach((b) => b.onclick = async () => {
    b.disabled = true; const { error } = await ctx.sb.from('assignment_done').insert({ assignment_id: +b.dataset.asd, user_id: ctx.S.me.id });
    if (error) { ctx.toast(error.message); b.disabled = false; return; }
    const card = b.closest('.msgcard'); if (card) { card.remove(); ctx.toast('Отлично!'); return; }
    ctx.confetti(); b.closest('.as-i').remove(); if (!document.querySelector('.as-i')) document.querySelector('.assign')?.remove();
  });
}

/* ============ тема пятиминутки на главной ============ */
export async function homeBrief(ctx) {
  const { data: b } = await ctx.sb.rpc('today_brief');
  if (!b) return '';
  return `<details class="brief-home"><summary><span class="e">📣</span><div><small>Тема пятиминутки сегодня</small><b>${esc(b.title)}</b></div></summary>${b.body ? `<div class="bb">${esc(b.body).replace(/\n/g, '<br>')}</div>` : ''}</details>`;
}
/* ============ публичная страница материала (для администраторов, без входа) ============ */
export async function publicBrief(sb, token, $app) {
  const { data: b } = await sb.rpc('brief_public', { p_token: token });
  if (b?.concept) document.documentElement.dataset.concept = b.concept;
  $app.innerHTML = b ? `<article class="pub"><div class="pub-k">Пятиминутка · ${new Date(b.day + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })}</div>
      <h1 class="h1">${esc(b.title)}</h1>${b.body ? `<div class="pub-b">${esc(b.body).replace(/\n/g, '<br>')}</div>` : ''}
      <div class="sign">Материал подготовила: ${SIGN}</div></article>`
    : '<div class="card stack"><b>Материал не найден</b><p class="muted">Ссылка устарела. Запросите новую у сервис-менеджера.</p></div>';
}

/* ============ итоги пятиминутки ============ */
export async function homeSummary(ctx) {
  const { data } = await ctx.sb.rpc('summary_today');
  const list = (data || []);
  if (!list.length) return '';
  return list.map((x) => `<div class="sumcard ${x.read ? 'rd' : ''}"><div class="mh"><span>📝</span><small>Итоги пятиминутки · ${esc(x.author || 'администратор')}</small></div>
    <p>${esc(x.body).replace(/\n/g, '<br>')}</p>${x.read ? '<span class="small muted">✓ Вы ознакомились</span>' : `<button class="btn sm" data-sum="${x.id}">Ознакомлен(а)</button>`}</div>`).join('');
}
export function bindHomeSummary(ctx) {
  document.querySelectorAll('[data-sum]').forEach((b) => b.onclick = async () => {
    b.disabled = true; const { error } = await ctx.sb.rpc('summary_read', { p_id: +b.dataset.sum });
    if (error) { ctx.toast(error.message); b.disabled = false; return; }
    b.outerHTML = '<span class="small muted">✓ Вы ознакомились</span>'; ctx.toast('Отмечено');
  });
}
async function summaries(box) {
  const { data } = await C.sb.rpc('summary_stats', { p_concept: C.S.concept });
  const by = {}; (data || []).forEach((x) => (by[x.rest || ''] = x));
  box.innerHTML = `<div class="sec-t"><span class="h2">Итоги пятиминутки сегодня</span></div>
    <p class="small muted">Пишет администратор во вкладке «Смена» или вы здесь. Итоги закрепляются у сотрудников точки на главной до конца дня, у каждого кнопка «Ознакомлен(а)».</p>
    ${rests().map((r) => { const x = by[r.id]; const st = x?.staff || [], rd = st.filter((p) => p.read);
      return `<div class="card stack"><div class="row between"><b>${esc(r.name)}</b>${x ? `<span class="pill ${rd.length === st.length && st.length ? 'ok' : ''}">прочитали ${rd.length} из ${st.length}</span>` : '<span class="pill">нет итогов</span>'}</div>
        ${x ? `<p class="small">${esc(x.body).replace(/\n/g, '<br>')}</p><span class="small muted">${esc(x.author || '')} · ${new Date(x.at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
          ${st.length - rd.length ? `<details><summary class="small muted">Не прочитали (${st.length - rd.length})</summary><div class="small">${st.filter((p) => !p.read).map((p) => esc(p.name)).join(', ')}</div></details>` : ''}` : ''}
        <button class="btn sm ghost" data-sw="${r.id}">${x ? 'Изменить' : 'Написать итоги'}</button></div>`; }).join('')}`;
  box.querySelectorAll('[data-sw]').forEach((b) => b.onclick = () => {
    const x = by[b.dataset.sw];
    const m = modal(`<div class="row between"><b class="h2">Итоги пятиминутки</b><button class="pm" data-x>✕</button></div><span class="small muted">${esc(rname(b.dataset.sw))} · сегодня</span>
      <textarea id="sb" rows="8" placeholder="Сегодня: …\nПодытожим: …">${esc(x?.body || '')}</textarea><button class="btn" id="ss">Опубликовать</button>`, 'wide-m');
    m.querySelector('#ss').onclick = async () => { const { error } = await C.sb.rpc('summary_save', { p_rest: b.dataset.sw, p_body: m.querySelector('#sb').value }); if (error) return C.toast(error.message); m.remove(); summaries(box); };
  });
}
