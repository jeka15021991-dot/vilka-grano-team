/* Импорт сотрудников из анкеты Jotform (CSV) */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MON = [['янв', 1], ['фев', 2], ['мар', 3], ['апр', 4], ['мая', 5], ['май', 5], ['июн', 6], ['июл', 7], ['авг', 8], ['сен', 9], ['окт', 10], ['ноя', 11], ['дек', 12]];
const POS = { 'официант': 'waiter', 'хостес': 'hostess', 'администратор': 'manager', 'бармен': 'bartender' };
const POSN = { waiter: 'Официант', hostess: 'Хостес', manager: 'Администратор', bartender: 'Бармен' };
function csv(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true; else if (c === ',' || c === ';') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}
function bday(s) {
  const m = String(s || '').toLowerCase().match(/([а-яё]+)\.?\s*(\d{1,2}),?\s*(\d{4})/); if (!m) return null;
  const mo = MON.find(([p]) => m[1].startsWith(p)); if (!mo) return null;
  return `${m[3]}-${String(mo[1]).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}
function rest(s) {
  s = String(s || '').toLowerCase();
  if (s.includes('grano')) return 'grano';
  if (s.includes('абая')) return 'vilka-abaya';
  if (s.includes('казыбек')) return 'vilka-kazybek';
  if (s.includes('муратбаев')) return 'vilka-muratbaeva';
  return null;
}
function norm(p) { let d = String(p || '').replace(/\D/g, ''); if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1); if (d.length === 10 && d[0] === '7') d = '7' + d; return d.length === 11 && d[0] === '7' ? d : ''; }

export function importStaff(ctx, existingPhones, done) {
  const { S, toast, adminCall } = ctx;
  const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div class="card stack imp"><div class="row between"><b class="h2">Импорт из анкеты</b><button class="pm" data-x>✕</button></div>
    <span class="small muted">Скачайте ответы анкеты из Jotform в CSV и выберите файл. Кассиры и повторные анкеты пропускаются автоматически.</span>
    <input type="file" accept=".csv,text/csv" id="if"><textarea id="it" rows="3" placeholder="…или вставьте содержимое CSV сюда"></textarea>
    <button class="btn ghost" id="ip">Показать список</button><div id="iv"></div></div>`;
  document.body.appendChild(m);
  m.onclick = (e) => { if (e.target === m || e.target.closest('[data-x]')) m.remove(); };
  m.querySelector('#if').onchange = async (e) => { const f = e.target.files[0]; if (f) { m.querySelector('#it').value = await f.text(); preview(); } };
  m.querySelector('#ip').onclick = preview;
  let rows = [];
  function preview() {
    const t = csv(m.querySelector('#it').value.replace(/^﻿/, ''));
    if (t.length < 2) return toast('Не вижу строк в файле');
    const H = t[0].map((x) => x.toLowerCase());
    const ix = (w) => H.findIndex((x) => x.includes(w));
    const iF = ix('фамил'), iN = ix('имя'), iP = ix('должн'), iR = ix('точк'), iB = ix('рожд'), iT = ix('телеф');
    const seen = new Set(), seenN = new Set(); rows = [];
    t.slice(1).forEach((r) => {
      const posRaw = (r[iP] || '').trim().toLowerCase(), pos = POS[posRaw];
      const x = { full_name: `${(r[iN] || '').trim()} ${(r[iF] || '').trim()}`.trim(), phone: norm(r[iT]), restaurant_id: rest(r[iR]), position: pos, birthday: bday(r[iB]), raw: r[iP] };
      let why = '';
      if (!pos) why = posRaw ? `${r[iP]} — не добавляем` : 'нет должности';
      else if (!x.restaurant_id) why = 'точка не распознана';
      else if (!x.phone) why = 'неверный телефон';
      else if (existingPhones.has(x.phone)) why = 'уже есть в платформе';
      else if (seen.has(x.phone) || seenN.has(x.full_name.toLowerCase())) why = 'повторная анкета';
      x.skip = why; if (!why) { seen.add(x.phone); seenN.add(x.full_name.toLowerCase()); }
      rows.push(x);
    });
    const ok = rows.filter((x) => !x.skip), sk = rows.filter((x) => x.skip);
    const rn = (id) => S.rests.find((r) => r.id === id)?.name || '—';
    m.querySelector('#iv').innerHTML = `<b>Будет добавлено: ${ok.length}</b>
      <div class="tw" style="max-height:40dvh"><table class="t"><tr><th>Сотрудник</th><th>Точка</th><th>Должность</th><th>ДР</th></tr>${ok.map((x) => `<tr><td>${esc(x.full_name)}<div class="small muted">${x.phone}</div></td><td class="small">${esc(rn(x.restaurant_id))}</td><td class="small">${POSN[x.position]}</td><td class="small">${x.birthday ? x.birthday.split('-').reverse().join('.') : '—'}</td></tr>`).join('')}</table></div>
      ${sk.length ? `<details><summary class="small muted">Пропущено: ${sk.length}</summary>${sk.map((x) => `<div class="small">${esc(x.full_name)} — ${esc(x.skip)}</div>`).join('')}</details>` : ''}
      <button class="btn block" id="igo" ${ok.length ? '' : 'disabled'}>Создать ${ok.length} аккаунтов и выдать коды</button>`;
    m.querySelector('#igo').onclick = async (e) => {
      e.target.disabled = true; e.target.textContent = 'Создаём… это займёт около минуты';
      try {
        const r = await adminCall({ action: 'bulk', rows: ok.map(({ full_name, phone, restaurant_id, position, birthday }) => ({ full_name, phone, restaurant_id, position, birthday })) });
        result(r.results || []);
      } catch (er) { toast(er.message); e.target.disabled = false; e.target.textContent = 'Повторить'; }
    };
  }
  function result(res) {
    const good = res.filter((x) => x.ok), bad = res.filter((x) => !x.ok);
    const rn = (id) => S.rests.find((r) => r.id === id)?.name || '';
    const fmt = (d) => `8 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;
    good.sort((a, b) => rn(a.restaurant_id).localeCompare(rn(b.restaurant_id)) || a.full_name.localeCompare(b.full_name));
    m.querySelector('.imp').innerHTML = `<div class="row between"><b class="h2">Готово: ${good.length} аккаунтов</b><button class="pm" data-x>✕</button></div>
      <span class="small muted">Коды показываются только сейчас — скачайте таблицу. Если код потеряется, его можно выдать заново кнопкой «Новый код».</span>
      <button class="btn" id="idl">⬇ Скачать таблицу с кодами (Excel)</button>
      <div class="tw" style="max-height:45dvh"><table class="t" id="itab"><tr><th>Точка</th><th>Сотрудник</th><th>Должность</th><th>Телефон</th><th>Код</th></tr>${good.map((x) => `<tr><td class="small">${esc(rn(x.restaurant_id))}</td><td>${esc(x.full_name)}</td><td class="small">${POSN[x.position]}</td><td class="small">${fmt(x.phone)}</td><td><b>${x.code}</b></td></tr>`).join('')}</table></div>
      ${bad.length ? `<b style="color:var(--bad)">Не создано: ${bad.length}</b>${bad.map((x) => `<div class="small">${esc(x.full_name)} — ${esc(x.error)}</div>`).join('')}` : ''}`;
    m.querySelector('#idl').onclick = () => {
      const link = `${location.origin}${location.pathname}`;
      const lines = [['Точка', 'Сотрудник', 'Должность', 'Телефон (логин)', 'Личный код', 'Ссылка']].concat(good.map((x) => [rn(x.restaurant_id), x.full_name, POSN[x.position], fmt(x.phone), x.code, link]));
      const csvOut = '﻿' + lines.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csvOut], { type: 'text/csv' })); a.download = `kody-sotrudnikov-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    };
    done && done();
  }
}
