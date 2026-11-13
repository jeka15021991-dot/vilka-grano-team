/* Лента команды: посты с фото, «спасибо коллеге», дни рождения, реакции, комментарии */
import { Character, coach } from './characters.js';

const EMOJI = ['❤️', '🔥', '👏', '😂', '🎉'];
const POS = { waiter: 'Официант', bartender: 'Бармен', hostess: 'Хостес', manager: 'Менеджер' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ini = (n) => String(n || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const first = (n) => String(n || '').split(' ')[0];
function ago(t) {
  const s = (Date.now() - new Date(t)) / 1000;
  if (s < 60) return 'только что';
  if (s < 3600) return Math.floor(s / 60) + ' мин назад';
  if (s < 86400) return Math.floor(s / 3600) + ' ч назад';
  if (s < 172800) return 'вчера';
  return new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}
const linkify = (t) => esc(t).replace(/\n/g, '<br>');

let C, people = [], posts = [], end = false;
const rest = (id) => C.S.rests.find((r) => r.id === id)?.name || '';
const sub = (pos, rid, role) => role === 'admin' ? 'Сервис-менеджер' : [POS[pos], rest(rid)].filter(Boolean).join(', ');

export async function feedUnread(sb, concept) {
  const { data } = await sb.rpc('feed_unread', { p_concept: concept });
  return data || 0;
}

export async function vTeam(ctx) {
  C = ctx; const { sb, S, $app } = ctx; end = false;
  $app.innerHTML = '<div class="splash"><div class="spin"></div></div>';
  await sb.rpc('ensure_birthdays');
  const [pp, fl] = await Promise.all([sb.rpc('team_people', { p_concept: S.concept }), sb.rpc('feed_list', { p_concept: S.concept })]);
  people = pp.data || []; posts = fl.data || []; end = posts.length < 20;
  sb.from('feed_reads').upsert({ user_id: S.me.id, seen_at: new Date().toISOString() }).then(() => { S.unread = 0; document.querySelector('#tabs .dotn')?.remove(); });

  const today = new Date(), md = (d) => String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const soon = [];
  for (let i = 1; i <= 7; i++) { const d = new Date(today); d.setDate(d.getDate() + i); people.filter((p) => p.bday === md(d)).forEach((p) => soon.push([p, d])); }

  $app.innerHTML = `<div class="stack">
    <div class="row between"><div class="h1">Команда</div><div class="row" style="gap:6px"><a class="chip" href="#/compete">⚔️ Битва</a><a class="chip gem" href="#/rating">🏆 Рейтинг</a></div></div>
    <div class="compose">
      <button class="cp-main" id="cpPost"><span class="ava sm"><b>${esc(ini(S.me.full_name))}</b></span><span class="muted">Поделиться с командой…</span><span class="cp-ph">📷</span></button>
      <button class="cp-thx" id="cpThx"><span>🙏</span><b>Рахмет коллеге</b><small>+10 баллов ему</small></button>
    </div>
    ${soon.length ? `<div class="soon"><span class="small muted">Скоро день рождения</span>${soon.map(([p, d]) => `<span class="sb"><b>${esc(first(p.full_name))}</b> ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>`).join('')}</div>` : ''}
    <div id="feed" class="feed"></div>
    <div id="more"></div>
  </div>`;
  document.getElementById('cpPost').onclick = () => composer();
  document.getElementById('cpThx').onclick = () => thanks();
  try { if (sessionStorage.getItem('vg_thx')) { sessionStorage.removeItem('vg_thx'); setTimeout(thanks, 300); } } catch (e) {}
  draw();
}

function draw() {
  const box = document.getElementById('feed'); if (!box) return;
  box.innerHTML = posts.length ? posts.map(card).join('') : `<div class="empty-feed"><div class="ef-ch"></div><b>Здесь пока тихо</b><p class="muted small">Скажи рахмет коллеге или поделись фото смены — ты будешь первым.</p></div>`;
  if (!posts.length) new Character(box.querySelector('.ef-ch'), 'shefi', 'invite');
  box.querySelectorAll('.bd-ch').forEach((el) => { const c = new Character(el, 'shefi', 'victory'); setTimeout(() => c.react('victory'), 400); });
  bind(box);
  const more = document.getElementById('more');
  more.innerHTML = end ? '' : '<button class="btn ghost block" id="mr">Показать ещё</button>';
  if (!end) document.getElementById('mr').onclick = async () => {
    const { data } = await C.sb.rpc('feed_list', { p_concept: C.S.concept, p_before: posts[posts.length - 1].id });
    posts = posts.concat(data || []); end = (data || []).length < 20; draw();
  };
}

function head(p) {
  const mine = p.author === C.S.me.id, can = mine || C.S.me.role === 'admin';
  return `<div class="ph"><span class="ava sm ${p.author_role === 'admin' ? 'boss' : ''}"><b>${esc(ini(p.author_name))}</b></span>
    <div class="pw"><b>${esc(p.author_name)}</b><span class="small muted">${esc(sub(p.author_pos, p.author_rest, p.author_role))} · ${ago(p.created_at)}</span></div>
    ${p.pinned ? '<span class="pill acc">📌</span>' : ''}${can ? `<button class="pm" data-menu="${p.id}" aria-label="Действия">⋯</button>` : ''}</div>`;
}

function card(p) {
  let inner = '';
  if (p.kind === 'birthday') {
    inner = `<div class="bd"><div class="bd-ch"></div><div><span class="small">🎂 Сегодня день рождения</span><div class="h2">${esc(p.to_name)}</div>
      <span class="small muted">${esc(sub(p.to_pos, p.to_rest))}</span></div></div>
      <p class="small">${p.to_user === C.S.me.id ? 'С днём рождения! Команда дарит тебе ⭐ 50 баллов. Загляни в комментарии 💛' : 'Поздравь коллегу в комментариях — ему будет приятно!'}</p>`;
  } else if (p.kind === 'thanks') {
    inner = head(p) + `<div class="thx"><div class="thx-to"><span>🙏 Рахмет</span><b>${esc(p.to_name)}</b><small>${esc(sub(p.to_pos, p.to_rest))}</small></div>
      <p>${linkify(p.body)}</p><span class="thx-pt">+10 ⭐</span></div>`;
  } else {
    inner = head(p) + (p.body ? `<p class="pb">${linkify(p.body)}</p>` : '') + (p.photo ? `<img class="pi" src="${esc(p.photo)}" alt="" loading="lazy">` : '');
  }
  const r = p.reactions || {}, mine = new Set(p.mine || []);
  return `<article class="post k-${p.kind}" data-id="${p.id}">${p.kind === 'official' ? '<span class="off">От сервис-менеджера</span>' : ''}${inner}
    <div class="pr">${EMOJI.map((e) => `<button class="re ${mine.has(e) ? 'on' : ''}" data-re="${e}">${e}${r[e] ? `<i>${r[e]}</i>` : ''}</button>`).join('')}
      <button class="re cm" data-cm>💬${p.comments ? `<i>${p.comments}</i>` : ''}</button></div>
    <div class="cms" hidden></div></article>`;
}

function bind(box) {
  box.querySelectorAll('.post').forEach((el) => {
    const id = +el.dataset.id, p = posts.find((x) => x.id === id);
    el.querySelectorAll('[data-re]').forEach((b) => b.onclick = () => react(p, b.dataset.re, el));
    el.querySelector('[data-cm]').onclick = () => comments(p, el);
    const m = el.querySelector('[data-menu]'); if (m) m.onclick = () => menu(p);
    el.querySelector('.pi')?.addEventListener('click', (e) => { const z = document.createElement('div'); z.className = 'zoom'; z.innerHTML = `<img src="${e.target.src}" alt="">`; z.onclick = () => z.remove(); document.body.appendChild(z); });
  });
}

async function react(p, e, el) {
  const { sb, S } = C; const mine = new Set(p.mine || []); p.reactions = p.reactions || {};
  if (mine.has(e)) { mine.delete(e); p.reactions[e] = Math.max(0, (p.reactions[e] || 1) - 1); sb.from('post_reactions').delete().match({ post_id: p.id, user_id: S.me.id, emoji: e }).then(() => {}); }
  else { mine.add(e); p.reactions[e] = (p.reactions[e] || 0) + 1; sb.from('post_reactions').insert({ post_id: p.id, user_id: S.me.id, emoji: e }).then(() => {}); }
  p.mine = [...mine];
  const b = el.querySelector(`[data-re="${e}"]`); b.classList.toggle('on', mine.has(e)); b.innerHTML = e + (p.reactions[e] ? `<i>${p.reactions[e]}</i>` : '');
  if (mine.has(e) && window.gsap) window.gsap.fromTo(b, { scale: 1.45 }, { scale: 1, duration: .45, ease: 'back.out(3)' });
}

async function comments(p, el) {
  const box = el.querySelector('.cms');
  if (!box.hidden) { box.hidden = true; return; }
  box.hidden = false; box.innerHTML = '<div class="spin" style="width:24px;height:24px"></div>';
  const load = async () => {
    const { data } = await C.sb.rpc('feed_comments', { p_post: p.id });
    const list = data || []; p.comments = list.length;
    el.querySelector('[data-cm]').innerHTML = '💬' + (list.length ? `<i>${list.length}</i>` : '');
    box.innerHTML = list.map((c) => `<div class="cmt"><span class="ava xs"><b>${esc(ini(c.name))}</b></span><div><b>${esc(c.name)}</b> <span class="small muted">${ago(c.created_at)}</span><p>${linkify(c.body)}</p></div>
      ${c.user_id === C.S.me.id || C.S.me.role === 'admin' ? `<button class="pm" data-dc="${c.id}" aria-label="Удалить">✕</button>` : ''}</div>`).join('') +
      `<form class="cf"><input maxlength="500" placeholder="${p.kind === 'birthday' ? 'Напиши поздравление…' : 'Комментарий…'}" required><button class="btn sm">➤</button></form>`;
    box.querySelector('.cf').onsubmit = async (ev) => {
      ev.preventDefault(); const inp = ev.target.querySelector('input'), t = inp.value.trim(); if (!t) return;
      inp.disabled = true;
      const { error } = await C.sb.from('post_comments').insert({ post_id: p.id, user_id: C.S.me.id, body: t });
      if (error) { C.toast('Не отправилось. Проверьте интернет'); inp.disabled = false; return; }
      load();
    };
    box.querySelectorAll('[data-dc]').forEach((b) => b.onclick = async () => { await C.sb.from('post_comments').delete().eq('id', b.dataset.dc); load(); });
  };
  load();
}

function menu(p) {
  const admin = C.S.me.role === 'admin';
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="card stack">${admin && p.kind !== 'birthday' ? `<button class="btn ghost" data-a="pin">${p.pinned ? 'Открепить' : '📌 Закрепить наверху'}</button>` : ''}
    <button class="btn" style="background:var(--bad);color:#fff" data-a="del">Удалить запись</button><button class="btn ghost" data-a="x">Отмена</button></div>`;
  m.onclick = async (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a && e.target !== m) return; m.remove();
    if (a === 'del') { const { error } = await C.sb.from('posts').delete().eq('id', p.id); if (error) return C.toast(error.message); posts = posts.filter((x) => x.id !== p.id); draw(); C.toast('Запись удалена'); }
    if (a === 'pin') { await C.sb.from('posts').update({ pinned: !p.pinned }).eq('id', p.id); vTeam(C); }
  };
  document.body.appendChild(m);
}

export async function shrink(file) {
  const img = await createImageBitmap(file).catch(() => null);
  if (!img) throw new Error('Не удалось открыть фото');
  const k = Math.min(1, 1280 / Math.max(img.width, img.height));
  const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
  cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
  return await new Promise((r) => cv.toBlob(r, 'image/jpeg', .82));
}

function sheet(html) {
  const m = document.createElement('div'); m.className = 'modal up'; m.innerHTML = `<div class="card stack cmp">${html}</div>`;
  m.onclick = (e) => { if (e.target === m || e.target.closest('[data-x]')) m.remove(); };
  document.body.appendChild(m); return m;
}

function composer() {
  const { S, sb } = C, admin = S.me.role === 'admin';
  const m = sheet(`<div class="row between"><b class="h2">Новая запись</b><button class="pm" data-x aria-label="Закрыть">✕</button></div>
    <textarea id="pt" rows="4" maxlength="1500" placeholder="Что нового? Фото подачи, итог смены, идея для команды…"></textarea>
    <label class="photo-in"><input type="file" accept="image/*" id="pf" hidden><span id="pfl">📷 Добавить фото</span></label>
    <img id="pv" class="pv" hidden alt="">
    ${admin ? `<label class="switch"><input type="checkbox" id="pof" checked> Официально, от сервис-менеджера</label>
      <label class="switch"><input type="checkbox" id="ppin"> Закрепить наверху</label>
      <select id="pcn"><option value="${S.concept}">Только ${S.concept === 'grano' ? 'GRANO' : 'VILKA'}</option><option value="">Для обеих команд</option></select>` : ''}
    <button class="btn block" id="pgo">Опубликовать</button>`);
  let blob = null;
  m.querySelector('#pf').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { blob = await shrink(f); const v = m.querySelector('#pv'); v.src = URL.createObjectURL(blob); v.hidden = false; m.querySelector('#pfl').textContent = '📷 Заменить фото'; }
    catch (er) { C.toast(er.message); }
  };
  m.querySelector('#pgo').onclick = async (e) => {
    const body = m.querySelector('#pt').value.trim();
    if (!body && !blob) return C.toast('Напишите текст или добавьте фото');
    e.target.disabled = true; e.target.textContent = 'Публикуем…';
    let photo = null;
    if (blob) {
      const path = `${S.me.id}/${Date.now()}.jpg`;
      const { error } = await sb.storage.from('feed').upload(path, blob, { contentType: 'image/jpeg' });
      if (error) { C.toast('Фото не загрузилось. Попробуйте ещё раз'); e.target.disabled = false; e.target.textContent = 'Опубликовать'; return; }
      photo = sb.storage.from('feed').getPublicUrl(path).data.publicUrl;
    }
    const official = admin && m.querySelector('#pof').checked;
    const row = { author: S.me.id, body: body || null, photo, kind: official ? 'official' : 'post',
      concept: admin ? (m.querySelector('#pcn').value || null) : S.concept, pinned: admin && m.querySelector('#ppin').checked };
    const { error } = await sb.from('posts').insert(row);
    if (error) { C.toast(error.message); e.target.disabled = false; e.target.textContent = 'Опубликовать'; return; }
    m.remove(); C.toast('Опубликовано'); vTeam(C);
  };
}

function thanks() {
  const { S, sb } = C;
  const list = people.filter((p) => p.id !== S.me.id && p.role !== 'admin');
  if (!list.length) return C.toast('Коллеги появятся, когда сервис-менеджер их добавит');
  const m = sheet(`<div class="row between"><b class="h2">Рахмет коллеге</b><button class="pm" data-x aria-label="Закрыть">✕</button></div>
    <p class="small muted">Коллега получит ⭐ 10 баллов, а вся команда увидит, за что. В день можно сказать 3 рахмета.</p>
    <input id="tq" placeholder="Найти по имени" autocomplete="off">
    <div class="who-list" id="tl"></div>
    <textarea id="tt" rows="3" maxlength="300" placeholder="За что рахмет? Например: подменил на смене, помог с банкетом"></textarea>
    <button class="btn block gold" id="tgo" disabled>Сказать рахмет</button>`);
  let pick = null;
  const drawList = () => {
    const q = m.querySelector('#tq').value.trim().toLowerCase();
    m.querySelector('#tl').innerHTML = list.filter((p) => !q || p.full_name.toLowerCase().includes(q)).slice(0, 30).map((p) =>
      `<button class="who ${pick === p.id ? 'on' : ''}" data-p="${p.id}"><span class="ava xs"><b>${esc(ini(p.full_name))}</b></span><span><b>${esc(p.full_name)}</b><small>${esc(sub(p.pos, p.restaurant_id))}</small></span></button>`).join('') || '<p class="small muted">Никого не нашли</p>';
    m.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { pick = b.dataset.p; drawList(); m.querySelector('#tgo').disabled = false; m.querySelector('#tt').focus(); });
  };
  m.querySelector('#tq').oninput = drawList; drawList();
  m.querySelector('#tgo').onclick = async (e) => {
    e.target.disabled = true;
    const { error } = await sb.rpc('thank', { p_to: pick, p_text: m.querySelector('#tt').value });
    if (error) { C.toast(error.message); e.target.disabled = false; return; }
    const who = first(list.find((p) => p.id === pick)?.full_name);
    m.remove(); C.confetti();
    coach({ concept: S.concept, mood: 'praise', text: `Рахмет отправлен! ${who} получит ⭐ 10 баллов. Добрые слова делают смену лучше.`, duration: 4500 });
    vTeam(C);
  };
}
