/* Карта развития сотрудника и аттестации */
import { Character } from './characters.js';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ICON = ['🌱', '🧭', '📖', '🎓', '🍽️', '⭐', '👑'];
const ICON_L = ['🗝️', '📖', '⏰', '✅', '🎥', '👑'];

export async function vPath(ctx) {
  const { sb, S, $app } = ctx;
  const { data: p, error } = await sb.rpc('my_path');
  if (error) throw error;
  const lead = p.role === 'lead', ic = lead ? ICON_L : ICON, n = p.stages.length;
  const pct = Math.round(100 * p.done / n);
  $app.innerHTML = `<div class="stack">
    <div class="row"><a class="back" href="#/me">‹</a><div class="h1">Карта развития</div></div>
    <div class="path-hero"><div class="ph-ch"></div><div><small>${lead ? 'Путь администратора' : 'Путь от новичка до эксперта'}</small>
      <b class="h2">${p.done >= n ? 'Вы прошли весь путь!' : `Этап ${p.done + 1} из ${n}: ${esc(p.stages[p.done].t)}`}</b>
      <div class="bar"><i style="width:${pct}%"></i></div></div></div>
    <div class="road">${p.stages.map((st, i) => {
      const state = i < p.done ? 'done' : i === p.done ? 'cur' : 'lock';
      const items = st.items.map((x) => `<div class="ri"><span>${esc(x.n)}</span><div class="bar"><i style="width:${Math.min(100, Math.round(100 * x.v / x.of))}%"></i></div><b>${x.of === 1 ? (x.v >= 1 ? '✓' : '—') : `${x.v}/${x.of}`}</b></div>`).join('');
      let act = '';
      if (state === 'cur') {
        if (st.cert === 'mid') act = `<a class="btn gold" href="#/play/exam">Пройти экзамен · 20 вопросов</a>${p.mid?.score != null ? `<small class="muted">Лучший результат: ${p.mid.score}%</small>` : ''}`;
        else if (st.cert === 'final') act = `<span class="small">Сервис-менеджер проведёт живую аттестацию в зале — договоритесь о времени. ${p.final && !p.final.passed ? `<br>Прошлая попытка: ${p.final.score ?? ''}% ${esc(p.final.note || '')}` : ''}</span>`;
        else if (i === 1 && !lead) act = '<a class="btn" href="#/quest">Начать квест</a>';
        else if (st.t === 'Знаю меню' || st.t === 'Знаток меню' || st.t === 'Знаю, чему учу') act = '<a class="btn" href="#/learn">К обучению</a>';
        else if (st.t === 'Мастер сервиса') act = '<a class="btn" href="#/games">К симуляторам</a>';
        else if (lead) act = '<a class="btn" href="#/shift">Во вкладку «Смена»</a>';
      }
      return `<div class="stn ${state} ${i % 2 ? 'r' : 'l'}"><div class="dot">${state === 'done' ? '✓' : ic[i] || '⭐'}</div>
        <div class="sc"><small>Этап ${i + 1}</small><b>${esc(st.t)}</b><span class="small muted">${esc(st.d)}</span>${state !== 'done' ? items : ''}${act}</div></div>`;
    }).join('')}</div>
    <div class="sign">Аттестации проводит Евгения Борисовна, сервис-менеджер<br><b>8 777 521 89 09</b></div>
  </div>`;
  const ch = new Character($app.querySelector('.ph-ch'), 'shefi', p.done >= n ? 'victory' : 'invite'); setTimeout(() => ch.react(p.done >= n ? 'victory' : 'joy'), 400);
  if (window.gsap) window.gsap.from('.stn', { x: (i) => (i % 2 ? 30 : -30), opacity: 0, stagger: .08, duration: .45, ease: 'power2.out' });
  document.querySelector('.stn.cur')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  void S;
}

/* ---------- кабинет: аттестации ---------- */
export async function aCerts(ctx, ab) {
  const { sb, S, toast } = ctx;
  const { data, error } = await sb.rpc('admin_paths', { p_concept: S.concept });
  if (error) { ab.innerHTML = `<p class="muted">${esc(error.message)}</p>`; return; }
  const rn = (id) => S.rests.find((r) => r.id === id)?.name || '';
  const ready = (data || []).filter((x) => x.path.stages[x.path.done]?.cert === 'final' && !x.path.final?.passed);
  const dist = {}; (data || []).forEach((x) => { const t = x.path.done >= x.path.stages.length ? 'Прошли путь' : x.path.stages[x.path.done].t; dist[t] = (dist[t] || 0) + 1; });
  ab.innerHTML = `<p class="muted">Карта развития считается автоматически. Промежуточная аттестация — экзамен в приложении (20 вопросов, от 80%). Итоговую проводите вы вживую и отмечаете здесь.</p>
    <div class="card stack"><b>Где сейчас команда</b><div class="row" style="flex-wrap:wrap;gap:6px">${Object.entries(dist).map(([k, v]) => `<span class="pill">${esc(k)}: ${v}</span>`).join('')}</div></div>
    ${ready.length ? `<div class="card stack" style="border:2px solid var(--acc2)"><b>🎓 Готовы к итоговой аттестации: ${ready.length}</b>${ready.map((x) => `<div class="li"><span>${esc(x.name)} <span class="small muted">${esc(rn(x.rest))}</span></span><button class="btn sm gold" data-c="${x.id}">Провести</button></div>`).join('')}</div>` : ''}
    <div class="tw"><table class="t"><tr><th>Сотрудник</th><th>Этап</th><th>Экзамен</th><th>Итоговая</th><th></th></tr>
    ${(data || []).map((x) => { const P = x.path, n = P.stages.length; return `<tr><td><b>${esc(x.name)}</b><div class="small muted">${esc(rn(x.rest))}${x.role === 'lead' ? ' · администратор' : ''}</div></td>
      <td class="small"><div class="bar" style="width:90px"><i style="width:${Math.round(100 * P.done / n)}%"></i></div>${P.done >= n ? 'Весь путь' : esc(P.stages[P.done].t)}</td>
      <td class="small">${x.role === 'lead' ? '—' : P.mid ? (P.mid.passed ? `✓ ${P.mid.score}%` : `${P.mid.score}%`) : '—'}</td>
      <td class="small">${P.final ? (P.final.passed ? `✓ ${P.final.score ?? ''}%` : `не сдал ${P.final.score ?? ''}%`) : '—'}</td>
      <td><button class="btn sm ghost" data-c="${x.id}">Аттестация</button></td></tr>`; }).join('')}</table></div>`;
  ab.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => {
    const x = data.find((y) => y.id === b.dataset.c);
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="card stack"><b class="h2">Итоговая аттестация</b><span>${esc(x.name)} · ${esc(rn(x.rest))}</span>
      <input id="cs" type="number" min="0" max="100" placeholder="Результат, %" value="${x.path.final?.score ?? ''}">
      <textarea id="cn" rows="3" placeholder="Комментарий: что получилось, что подтянуть">${esc(x.path.final?.note || '')}</textarea>
      <div class="row"><button class="btn" style="flex:1;background:var(--bad);color:#fff" data-p="0">Не сдал(а)</button><button class="btn" style="flex:1;background:var(--ok);color:#fff" data-p="1">Сдал(а) · +200 ⭐</button></div>
      <button class="btn ghost" data-p="x">Отмена</button></div>`;
    document.body.appendChild(m);
    m.querySelectorAll('[data-p]').forEach((k) => k.onclick = async () => {
      if (k.dataset.p === 'x') return m.remove();
      const { error: e } = await sb.rpc('cert_set', { p_user: x.id, p_passed: k.dataset.p === '1', p_score: +m.querySelector('#cs').value || null, p_note: m.querySelector('#cn').value });
      if (e) return toast(e.message); m.remove(); toast('Сохранено'); aCerts(ctx, ab);
    });
  });
}
