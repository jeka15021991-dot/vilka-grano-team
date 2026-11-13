/* Вкладка «Смена» для администратора точки */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ru = (s) => s ? new Date(String(s).length === 10 ? s + 'T12:00' : s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '';
const hm = (s) => new Date(s).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
const SL = [['brief', '📣', 'Пятиминутка проведена', 'в 10:45'], ['morning', '☀️', 'Утренний отчёт отправлен', 'официанты, стоп-лист'], ['evening', '🌆', 'Вечерний отчёт отправлен', 'резервы, официанты'], ['night', '🌙', 'Ночной отчёт отправлен', 'закрытие смены']];
const ST = { ok: 'Вовремя', late: 'С опозданием', none: 'Не сделано' };

export async function vShift(ctx) {
  const { sb, S, $app, toast } = ctx;
  $app.innerHTML = '<div class="splash"><div class="spin"></div></div>';
  const { data: d, error } = await sb.rpc('lead_state');
  if (error) throw error;
  const slots = d.dow === 7 ? SL.concat([['clean', '🧽', 'Генеральная уборка проведена', 'каждое воскресенье']]) : SL;
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  const open = d.tasks.filter((t) => !t.done_at), done = d.tasks.filter((t) => t.done_at);
  const idle = d.team.filter((p) => !p.seen || Date.now() - new Date(p.seen) > 7 * 864e5);
  const v = d.video;
  $app.innerHTML = `<div class="stack">
    <div><span class="small muted" style="text-transform:capitalize">${today}</span><div class="h1">Смена · ${esc(String(d.rest || '').replace(/^VILKA\s+/, ''))}</div></div>
    ${d.brief ? `<details class="brief-home" open><summary><span class="e">📣</span><div><small>Тема пятиминутки сегодня</small><b>${esc(d.brief.title)}</b></div></summary>${d.brief.body ? `<div class="bb">${esc(d.brief.body).replace(/\n/g, '<br>')}</div>` : ''}</details>`
      : '<div class="card small muted">На сегодня тема пятиминутки не задана — проведите её по текущим задачам смены.</div>'}
    <div class="card stack" id="lsum"><b>📝 Итоги пятиминутки</b><span class="small muted">Напишите кратко после пятиминутки — итоги появятся у ваших сотрудников на главной, каждый нажмёт «Ознакомлен(а)».</span><div class="spin" style="width:22px;height:22px"></div></div>
    <div class="sec-t"><span class="h2">Отметки дня</span></div>
    <div class="marks">${slots.map(([k, e, t, sub]) => { const m = d.marks[k]; const byAdmin = m && m.source === 'admin';
      return `<button class="mark ${m ? 'on ' + m.status : ''}" data-m="${k}" ${byAdmin ? 'disabled' : ''}><span class="e">${e}</span><span class="mt"><b>${t}</b><small>${m ? (byAdmin ? 'Отметил сервис-менеджер: ' + ST[m.status] : 'Отмечено в ' + hm(m.at)) : sub}</small></span><span class="ck">${m ? '✓' : ''}</span></button>`; }).join('')}</div>
    <div class="sec-t"><span class="h2">Мои задачи</span><span class="small muted">${open.length ? `открыто ${open.length}` : ''}</span></div>
    ${open.length ? open.map((t) => task(t)).join('') : '<p class="muted">Открытых задач нет 👍</p>'}
    ${done.length ? `<details><summary class="small muted">Выполненные (${done.length})</summary><div class="stack" style="gap:8px;margin-top:8px">${done.map((t) => task(t)).join('')}</div></details>` : ''}
    <div class="sec-t"><span class="h2">Видео пятиминутки</span></div>
    <div class="card stack"><span class="small muted">Раз в месяц запишите видео одной пятиминутки и вставьте ссылку (Google Диск, Telegram, YouTube).</span>
      ${v?.link ? `<div class="row between"><span class="pill ${v.status === 'none' ? '' : 'ok'}">${v.status === 'late' ? 'Сдано с опозданием' : v.status === 'none' ? 'Не засчитано' : 'Сдано за этот месяц'}</span><a href="${esc(v.link)}" target="_blank" rel="noopener" class="small">▶ Открыть</a></div>` : ''}
      <div class="row"><input id="vl" placeholder="https://…" value="${esc(v?.link || '')}"><button class="btn sm" id="vs">${v?.link ? 'Обновить' : 'Отправить'}</button></div></div>
    <div class="sec-t"><span class="h2">Моя команда</span><span class="small muted">${d.team.length - idle.length} из ${d.team.length} заходили за неделю</span></div>
    <div class="card stack">${idle.length ? `<span class="small">Давно не заходили в обучение — напомните им:</span>${idle.map((p) => `<div class="li"><span>${esc(p.name)}</span><span class="small muted">${p.seen ? 'был(а) ' + ru(p.seen) : 'ни разу'}</span></div>`).join('')}` : '<span class="small muted">Вся команда занимается — отлично!</span>'}</div>
    ${d.audits.length ? `<div class="sec-t"><span class="h2">Мои проверки</span></div>${d.audits.map((a) => {
      const bad = []; (a.answers?.sections || []).forEach((s, i) => s.items.forEach((it, j) => { const x = a.answers.a?.[i + '.' + j]; if (x?.v === 0) bad.push(it + (x.c ? ` (${x.c})` : '')); }));
      return `<details class="card"><summary class="row between" style="cursor:pointer"><span><b>${esc(a.title)}</b><br><small class="muted">${ru(a.at)}</small></span><span class="pill ${a.score >= 85 ? 'ok' : ''}">${a.score}%</span></summary>
        ${bad.length ? `<div class="stack" style="gap:6px;margin-top:10px">${bad.map((b) => `<div class="bad-it"><span>✕ ${esc(b)}</span></div>`).join('')}</div>` : ''}${a.comment ? `<p class="small" style="margin-top:8px">${esc(a.comment)}</p>` : ''}</details>`; }).join('')}` : ''}
    <div class="sign">Вопросы — Евгения Борисовна, сервис-менеджер<br><b>8 777 521 89 09</b></div>
  </div>`;
  sb.rpc('lead_summary').then(({ data: sm }) => {
    const box = $app.querySelector('#lsum'); if (!box) return;
    box.querySelector('.spin').outerHTML = `<textarea id="lst" rows="5" placeholder="Сегодня: …&#10;Подытожим: …">${esc(sm?.body || '')}</textarea>
      <div class="row between"><span class="small muted">${sm ? `Ознакомились: ${sm.reads} из ${sm.staff}` : ''}</span><button class="btn sm" id="lss">${sm ? 'Обновить' : 'Опубликовать'}</button></div>`;
    box.querySelector('#lss').onclick = async () => { const { error: e } = await sb.rpc('summary_save', { p_rest: null, p_body: box.querySelector('#lst').value }); toast(e ? e.message : 'Итоги опубликованы'); if (!e) vShift(ctx); };
  });
  $app.querySelectorAll('[data-m]').forEach((b) => b.onclick = async () => {
    const on = !b.classList.contains('on'); b.disabled = true;
    const { error: e } = await sb.rpc('lead_mark', { p_slot: b.dataset.m, p_done: on });
    if (e) { toast(e.message); b.disabled = false; return; }
    if (on) ctx.plus && navigator.vibrate?.(20);
    vShift(ctx);
  });
  $app.querySelectorAll('[data-t]').forEach((c) => c.onchange = async () => {
    const { error: e } = await sb.rpc('lead_task', { p_id: +c.dataset.t, p_done: c.checked });
    if (e) toast(e.message); else { if (c.checked) ctx.confetti(); vShift(ctx); }
  });
  $app.querySelector('#vs').onclick = async () => {
    const { error: e } = await sb.rpc('lead_video', { p_link: $app.querySelector('#vl').value });
    toast(e ? e.message : 'Видео отправлено'); if (!e) vShift(ctx);
  };
  function task(t) {
    const late = !t.done_at && t.due && t.due < new Date().toISOString().slice(0, 10);
    return `<div class="task ${t.done_at ? 'dn' : ''} ${late ? 'late' : ''}"><label><input type="checkbox" data-t="${t.id}" ${t.done_at ? 'checked' : ''}></label>
      <div class="tt"><b>${esc(t.title)}</b><small>${t.personal ? 'Лично вам' : 'Всем администраторам точки'}${t.due ? ' · до ' + ru(t.due) : ''}${t.done_at ? ' · выполнено ' + ru(t.done_at) : ''}</small>${t.note ? `<span class="small">${esc(t.note)}</span>` : ''}</div></div>`;
  }
}
