/* Кабинет → Обучение → Мои материалы: свои уроки, страницы, видео и вопросы */
import { shrink } from './team.js';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const POSN = { waiter: 'Официанты', hostess: 'Хостес', bartender: 'Бармены', manager: 'Администраторы' };
let C;

async function upload(file) {
  const blob = await shrink(file);
  const path = `${C.S.me.id}/m-${Date.now()}.jpg`;
  const { error } = await C.sb.storage.from('feed').upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw new Error('Фото не загрузилось');
  return C.sb.storage.from('feed').getPublicUrl(path).data.publicUrl;
}

export async function aMaterials(ctx, ab) {
  C = ctx; const { sb, S } = ctx;
  const { data: list } = await sb.from('blocks').select('*').eq('custom', true).order('created_at', { ascending: false });
  const { data: qc } = await sb.from('quiz_items').select('block_id').like('block_id', 'my:%');
  const n = {}; (qc || []).forEach((q) => (n[q.block_id] = (n[q.block_id] || 0) + 1));
  const who = (b) => [b.concept.toUpperCase(), b.restaurant_id ? S.rests.find((r) => r.id === b.restaurant_id)?.name : null, b.positions?.length ? b.positions.map((p) => POSN[p]).join(', ') : 'все должности'].filter(Boolean).join(' · ');
  ab.innerHTML = `<p class="muted">Свои уроки после тренингов: страницы с текстом, фото и видео, плюс вопросы. У сотрудников они появляются в «Обучении» отдельной тарелкой с пометкой «Новое» — с уроком, квизом, тестом и повторением ошибок.</p>
    <button class="btn" id="mnew">+ Новый материал</button>
    ${(list || []).map((b) => `<button class="arow" data-b="${esc(b.id)}"><span class="e">${b.cover ? `<img src="${esc(b.cover)}" alt="" style="width:44px;height:44px;border-radius:12px;object-fit:cover">` : '📘'}</span>
      <span class="at"><b>${esc(b.title)}</b><small>${esc(who(b))} · ${n[b.id] || 0} вопросов${b.enabled ? '' : ' · черновик'}</small></span><span class="go">›</span></button>`).join('') || '<p class="muted">Материалов пока нет.</p>'}`;
  ab.querySelector('#mnew').onclick = () => editor(null, ab);
  ab.querySelectorAll('[data-b]').forEach((x) => x.onclick = () => editor((list || []).find((b) => b.id === x.dataset.b), ab));
}

async function editor(b, ab) {
  const { sb, S, toast } = C;
  let pages = [{ name: '', descr: '', photo: null, video: '' }], qs = [];
  if (b) {
    const [{ data: cards }, { data: items }] = await Promise.all([sb.from('kb_cards').select('*').eq('block_id', b.id).order('sort'), sb.from('quiz_items').select('*').eq('block_id', b.id).order('id')]);
    if (cards?.length) pages = cards.map((c) => ({ name: c.name, descr: c.descr || '', photo: c.photo, video: c.video || '' }));
    qs = (items || []).map((q) => ({ q: q.question, o: q.options.slice(), a: q.answer, ex: q.explain || '' }));
  }
  let cover = b?.cover || null;
  const o = document.createElement('div'); o.className = 'audit';
  document.body.appendChild(o); document.body.classList.add('playing');
  const close = () => { o.remove(); document.body.classList.remove('playing'); };
  const draw = () => {
    o.innerHTML = `<div class="au-top"><button class="pm" id="mx">✕</button><div><b>${b ? 'Материал' : 'Новый материал'}</b><small>Сохраняется для сотрудников сразу после «Опубликовать»</small></div></div>
    <div class="au-body">
      <section class="card stack"><b>Основное</b>
        <input id="mt" placeholder="Название, например «Продажа десертов»" value="${esc(b?.title || '')}">
        <label class="photo-in"><input type="file" accept="image/*" id="mc" hidden>${cover ? `<img src="${esc(cover)}" class="pv" alt="">` : '📷 Обложка (необязательно)'}</label>
        <div class="grid2"><select id="mk"><option value="vilka" ${(b?.concept || S.concept) === 'vilka' ? 'selected' : ''}>VILKA</option><option value="grano" ${(b?.concept || S.concept) === 'grano' ? 'selected' : ''}>GRANO</option></select>
          <select id="mr"><option value="">Все точки</option>${S.rests.map((r) => `<option value="${r.id}" ${b?.restaurant_id === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></div>
        <div class="row" style="flex-wrap:wrap;gap:8px"><span class="small muted">Кому:</span>${Object.entries(POSN).map(([k, v]) => `<label class="switch"><input type="checkbox" data-pos="${k}" ${!b?.positions?.length || b.positions.includes(k) ? 'checked' : ''}> ${v}</label>`).join('')}</div>
      </section>
      <div class="h2">Страницы урока</div>
      ${pages.map((p, i) => `<section class="card stack pg" data-i="${i}"><div class="row between"><b>Страница ${i + 1}</b>${pages.length > 1 ? `<button class="pm" data-pdel="${i}">✕</button>` : ''}</div>
        <input data-f="name" placeholder="Заголовок страницы" value="${esc(p.name)}">
        <textarea data-f="descr" rows="5" placeholder="Текст: правило, пример фразы, на что обратить внимание">${esc(p.descr)}</textarea>
        <label class="photo-in"><input type="file" accept="image/*" data-ph="${i}" hidden>${p.photo ? `<img src="${esc(p.photo)}" class="pv" alt="">` : '📷 Фото (необязательно)'}</label>
        <input data-f="video" placeholder="Ссылка на видео — YouTube, Google Диск (необязательно)" value="${esc(p.video)}"></section>`).join('')}
      <button class="btn ghost" id="padd">+ Страница</button>
      <div class="h2">Вопросы для квиза и теста</div>
      <p class="small muted">Минимум 3 вопроса, лучше 5–10. Отметьте кружком правильный ответ.</p>
      ${qs.map((q, i) => `<section class="card stack qq" data-i="${i}"><div class="row between"><b>Вопрос ${i + 1}</b><button class="pm" data-qdel="${i}">✕</button></div>
        <input data-f="q" placeholder="Вопрос" value="${esc(q.q)}">
        ${q.o.map((x, k) => `<div class="row"><input type="radio" name="a${i}" data-a="${k}" ${q.a === k ? 'checked' : ''} style="width:22px;height:22px;flex:none"><input data-o="${k}" placeholder="Вариант ${k + 1}" value="${esc(x)}"></div>`).join('')}
        <input data-f="ex" placeholder="Пояснение после ответа (необязательно)" value="${esc(q.ex)}"></section>`).join('')}
      <button class="btn ghost" id="qadd">+ Вопрос</button>
      <label class="switch"><input type="checkbox" id="mas" ${b ? '' : 'checked'}> Отправить сотрудникам как задание «Изучить урок»</label>
      <button class="btn block" id="msave">Опубликовать</button>
      ${b ? `<button class="btn ghost block" id="mdraft">${b.enabled ? 'Скрыть от сотрудников' : 'Показать сотрудникам'}</button><button class="btn ghost block" id="mdel" style="color:var(--bad)">Удалить материал</button>` : ''}
    </div>`;
    const grab = () => {
      o.querySelectorAll('.pg').forEach((el) => { const p = pages[+el.dataset.i]; el.querySelectorAll('[data-f]').forEach((f) => (p[f.dataset.f] = f.value)); });
      o.querySelectorAll('.qq').forEach((el) => { const q = qs[+el.dataset.i]; q.q = el.querySelector('[data-f="q"]').value; q.ex = el.querySelector('[data-f="ex"]').value; el.querySelectorAll('[data-o]').forEach((f) => (q.o[+f.dataset.o] = f.value)); const a = el.querySelector('[data-a]:checked'); q.a = a ? +a.dataset.a : -1; });
      if (b) b.title = o.querySelector('#mt').value; else tmp.title = o.querySelector('#mt').value;
    };
    const tmp = {};
    o.querySelector('#mx').onclick = async () => { if (await C.ask('Закрыть без сохранения?', 'Закрыть', true)) close(); };
    o.querySelector('#mc').onchange = async (e) => { try { toast('Загружаю фото…'); grab(); cover = await upload(e.target.files[0]); draw(); } catch (er) { toast(er.message); } };
    o.querySelectorAll('[data-ph]').forEach((f) => f.onchange = async (e) => { try { toast('Загружаю фото…'); grab(); pages[+f.dataset.ph].photo = await upload(e.target.files[0]); draw(); } catch (er) { toast(er.message); } });
    o.querySelector('#padd').onclick = () => { grab(); pages.push({ name: '', descr: '', photo: null, video: '' }); draw(); };
    o.querySelector('#qadd').onclick = () => { grab(); qs.push({ q: '', o: ['', '', '', ''], a: 0, ex: '' }); draw(); };
    o.querySelectorAll('[data-pdel]').forEach((x) => x.onclick = () => { grab(); pages.splice(+x.dataset.pdel, 1); draw(); });
    o.querySelectorAll('[data-qdel]').forEach((x) => x.onclick = () => { grab(); qs.splice(+x.dataset.qdel, 1); draw(); });
    o.querySelector('#msave').onclick = async (e) => {
      grab();
      const title = o.querySelector('#mt').value.trim();
      const pos = [...o.querySelectorAll('[data-pos]:checked')].map((x) => x.dataset.pos);
      const P = pages.filter((p) => p.name.trim() || p.descr.trim() || p.photo || p.video.trim());
      const Q = qs.map((q) => ({ ...q, o: q.o.map((x) => x.trim()).filter(Boolean) })).filter((q) => q.q.trim());
      if (!title) return toast('Напишите название');
      if (!P.length) return toast('Добавьте хотя бы одну страницу');
      if (!pos.length) return toast('Выберите, кому показывать');
      const badQ = Q.findIndex((q) => q.o.length < 2 || q.a < 0 || q.a >= q.o.length);
      if (badQ >= 0) return toast(`Вопрос ${badQ + 1}: нужно минимум 2 варианта и отмеченный правильный`);
      e.target.disabled = true; e.target.textContent = 'Сохраняю…';
      const id = b?.id || 'my:' + Date.now().toString(36);
      const concept = o.querySelector('#mk').value, rest = o.querySelector('#mr').value || null;
      const row = { id, concept, title, custom: true, enabled: true, cover: cover || P.find((p) => p.photo)?.photo || null, positions: pos.length === 4 ? null : pos, restaurant_id: rest, section_id: null, sort: b?.sort ?? -1 };
      try {
        const r1 = await sb.from('blocks').upsert(row); if (r1.error) throw r1.error;
        await sb.from('kb_cards').delete().eq('block_id', id);
        const r2 = await sb.from('kb_cards').insert(P.map((p, k) => ({ id: `${id}:${k}`, concept, block_id: id, name: p.name.trim() || title, descr: p.descr.trim() || null, photo: p.photo, video: p.video.trim() || null, sort: k }))); if (r2.error) throw r2.error;
        const { data: old } = await sb.from('quiz_items').select('id,question').eq('block_id', id);
        const keep = new Set();
        for (const q of Q) {
          const ex = (old || []).find((x) => x.question === q.q.trim() && !keep.has(x.id));
          const body = { concept, block_id: id, qtype: 'mine', question: q.q.trim(), options: q.o, answer: q.a, explain: q.ex.trim() || null, approved: true };
          if (ex) { keep.add(ex.id); await sb.from('quiz_items').update(body).eq('id', ex.id); } else { const { error } = await sb.from('quiz_items').insert(body); if (error) throw error; }
        }
        const drop = (old || []).filter((x) => !keep.has(x.id)).map((x) => x.id);
        if (drop.length) await sb.from('quiz_items').delete().in('id', drop);
        if (o.querySelector('#mas').checked) await sb.from('assignments').insert({ concept, kind: 'lesson', target: id, title: 'Изучить урок: ' + title, restaurant_id: rest });
        close(); toast('Материал опубликован'); await C.loadBase(); aMaterials(C, ab);
      } catch (er) { toast(er.message || 'Не удалось сохранить'); e.target.disabled = false; e.target.textContent = 'Опубликовать'; }
    };
    if (b) {
      o.querySelector('#mdraft').onclick = async () => { await sb.from('blocks').update({ enabled: !b.enabled }).eq('id', b.id); close(); await C.loadBase(); aMaterials(C, ab); };
      o.querySelector('#mdel').onclick = async () => { if (!(await C.ask('Удалить материал вместе с вопросами? Прогресс сотрудников по нему тоже удалится.', 'Удалить', true))) return; await sb.from('blocks').update({ enabled: false }).eq('id', b.id); await sb.from('quiz_items').delete().eq('block_id', b.id); await sb.from('kb_cards').delete().eq('block_id', b.id); await sb.from('blocks').delete().eq('id', b.id); close(); await C.loadBase(); aMaterials(C, ab); };
    }
  };
  draw();
}

/* видео внутри страницы урока */
export function videoEmbed(url) {
  if (!url) return '';
  let m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) return `<div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/${m[1]}" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
  m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (m) return `<div class="vid"><iframe src="https://drive.google.com/file/d/${m[1]}/preview" allow="autoplay" allowfullscreen loading="lazy"></iframe></div>`;
  return `<a class="btn ghost block" href="${esc(url)}" target="_blank" rel="noopener">▶ Смотреть видео</a>`;
}
