/* Игры на фото: «Собери блюдо» и «Найди ошибку» */
import { Character, coach } from './characters.js';
import { shrink } from './team.js';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ROUNDS = 5;

function tokens(comp) {
  return [...new Set(String(comp || '').replace(/\(.*?\)/g, '').split(/[,;.]|\sи\s/).map((t) => t.trim().replace(/^[-–—]\s*/, ''))
    .filter((t) => t.length >= 3 && t.length <= 32 && !/^(подаём|подается|подаётся|маринад|соус:|не маринуем)/i.test(t))
    .map((t) => t[0].toUpperCase() + t.slice(1)))];
}

function finish(ctx, game, ok, total) {
  const { sb, $app, S } = ctx;
  sb.rpc('game_award', { p_game: game, p_score: ok * 2 }).then(({ data }) => { if (data) ctx.plus(data); ctx.loadBase(); });
  const pct = Math.round(100 * ok / total);
  $app.innerHTML = `<div class="result"><div class="res-ch" style="width:150px;height:170px"></div><div class="h1">${pct >= 80 ? 'Отлично!' : pct >= 50 ? 'Неплохо!' : 'Есть куда расти'}</div>
    <div class="big">${ok} из ${total}</div><p class="muted">До 10 баллов в день за игру</p>
    <a class="btn block" href="#/game/${game}?r=${Date.now()}">Ещё раз</a><a class="btn ghost block" href="#/games">К играм</a></div>`;
  const c = new Character($app.querySelector('.res-ch'), 'shefi', pct >= 80 ? 'victory' : pct >= 50 ? 'praise' : 'wrong'); setTimeout(() => c.react(pct >= 80 ? 'victory' : 'praise'), 300);
  if (pct >= 80) ctx.confetti();
  document.body.classList.remove('playing'); void S;
}

/* ---------- Собери блюдо ---------- */
export async function vBuild(ctx) {
  const { sb, S, $app } = ctx;
  const { data } = await sb.from('kb_cards').select('id,name,comp,photo').eq('concept', S.concept).not('photo', 'is', null).not('comp', 'is', null);
  const cards = (data || []).map((c) => ({ ...c, t: tokens(c.comp) })).filter((c) => c.t.length >= 3 && !String(c.id).startsWith('my:'));
  if (cards.length < 6) { $app.innerHTML = '<div class="card">Для этой игры пока мало блюд с фото и составом.</div>'; return; }
  const pool = [...new Set(cards.flatMap((c) => c.t))];
  const rounds = shuffle(cards).slice(0, ROUNDS);
  let i = 0, ok = 0;
  document.body.classList.add('playing');
  const draw = () => {
    const c = rounds[i], right = shuffle(c.t).slice(0, Math.min(4, c.t.length));
    const lc = new Set(c.t.map((x) => x.toLowerCase()));
    const wrong = shuffle(pool.filter((x) => !lc.has(x.toLowerCase()))).slice(0, 8 - right.length);
    const chips = shuffle(right.concat(wrong)), pick = new Set();
    $app.innerHTML = `<div class="game-b"><div class="qtop"><a class="back" href="#/games">✕</a><div class="segs">${rounds.map((_, k) => `<i class="${k < i ? 'ok' : k === i ? 'cur' : ''}"></i>`).join('')}</div></div>
      <div class="gb-dish"><img src="${esc(c.photo)}" alt=""><div class="gb-plate" id="plate"></div></div>
      <div class="h2">${esc(c.name)}</div><p class="small muted">Выбери ${right.length} ингредиента, которые есть в этом блюде</p>
      <div class="chips">${chips.map((x, k) => `<button class="chip-i" data-k="${k}">${esc(x)}</button>`).join('')}</div>
      <button class="btn block" id="chk" disabled>Проверить</button></div>`;
    const btn = $app.querySelector('#chk'), plate = $app.querySelector('#plate');
    $app.querySelectorAll('.chip-i').forEach((b) => b.onclick = () => {
      const k = +b.dataset.k;
      if (pick.has(k)) pick.delete(k); else { if (pick.size >= right.length) return; pick.add(k); }
      b.classList.toggle('on', pick.has(k));
      plate.innerHTML = [...pick].map((x) => `<span>${esc(chips[x])}</span>`).join('');
      btn.disabled = pick.size !== right.length;
      if (pick.has(k) && window.gsap) window.gsap.from(plate.lastElementChild, { y: -40, opacity: 0, duration: .35, ease: 'bounce.out' });
    });
    btn.onclick = () => {
      const rs = new Set(right.map((x) => x.toLowerCase()));
      let good = 0; $app.querySelectorAll('.chip-i').forEach((b) => { const v = chips[+b.dataset.k], isR = rs.has(v.toLowerCase()); b.disabled = true; if (isR) b.classList.add('right'); if (pick.has(+b.dataset.k)) { if (isR) good++; else b.classList.add('wrong'); } });
      const win = good === right.length; if (win) ok++;
      const sh = document.createElement('div'); sh.className = 'sheet ' + (win ? 'ok' : 'bad');
      sh.innerHTML = `<div class="v">${win ? 'Верно!' : `Угадано ${good} из ${right.length}`}</div><span class="small">Состав: ${esc(c.comp)}</span><button class="btn ${win ? 'okb' : 'badb'}">${i + 1 < rounds.length ? 'Дальше' : 'Итог'}</button>`;
      document.body.appendChild(sh);
      sh.querySelector('button').onclick = () => { sh.remove(); i++; i < rounds.length ? draw() : finish(ctx, 'build', ok, rounds.length); };
    };
  };
  coach({ concept: S.concept, mood: 'invite', text: 'Собери блюдо! Выбери ингредиенты, которые в нём есть — лишние я подмешал из других блюд.', duration: 4200 });
  draw();
}

/* ---------- Найди ошибку ---------- */
export async function vSpot(ctx) {
  const { sb, S, $app } = ctx;
  const { data } = await sb.from('spot_items').select('*').eq('active', true).or(`concept.is.null,concept.eq.${S.concept}`);
  if (!data?.length) { $app.innerHTML = '<div class="stack"><a class="back" href="#/games">‹</a><div class="card">Фото с ошибками скоро появятся.</div></div>'; return; }
  const rounds = shuffle(data).slice(0, ROUNDS);
  let i = 0, ok = 0;
  document.body.classList.add('playing');
  const draw = () => {
    const it = rounds[i]; let tries = 2;
    $app.innerHTML = `<div class="game-b"><div class="qtop"><a class="back" href="#/games">✕</a><div class="segs">${rounds.map((_, k) => `<i class="${k < i ? 'ok' : k === i ? 'cur' : ''}"></i>`).join('')}</div></div>
      <div class="h2">Найди ошибку</div><p class="small muted">Нажми на фото там, где что-то не так. Две попытки.</p>
      <div class="spot" id="sp"><img src="${esc(it.photo)}" alt=""></div></div>`;
    const sp = $app.querySelector('#sp');
    sp.onclick = (e) => {
      const r = sp.getBoundingClientRect(), x = 100 * (e.clientX - r.left) / r.width, y = 100 * (e.clientY - r.top) / r.height;
      const hit = Math.hypot(x - it.x, (y - it.y) * r.height / r.width) <= it.r;
      const m = document.createElement('i'); m.className = 'tap ' + (hit ? 'hit' : 'miss'); m.style.left = x + '%'; m.style.top = y + '%'; sp.appendChild(m);
      if (!hit && --tries > 0) { ctx.toast('Не здесь. Ещё одна попытка'); return; }
      sp.onclick = null;
      const ring = document.createElement('i'); ring.className = 'ans'; ring.style.left = it.x + '%'; ring.style.top = it.y + '%'; ring.style.width = ring.style.height = (it.r * 2) + '%'; sp.appendChild(ring);
      if (hit) ok++;
      const sh = document.createElement('div'); sh.className = 'sheet ' + (hit ? 'ok' : 'bad');
      sh.innerHTML = `<div class="v">${hit ? 'Нашёл!' : 'Ошибка здесь'}</div><b>${esc(it.title)}</b>${it.explain ? `<span class="small">${esc(it.explain)}</span>` : ''}<button class="btn ${hit ? 'okb' : 'badb'}">${i + 1 < rounds.length ? 'Дальше' : 'Итог'}</button>`;
      document.body.appendChild(sh);
      sh.querySelector('button').onclick = () => { sh.remove(); i++; i < rounds.length ? draw() : finish(ctx, 'spot', ok, rounds.length); };
    };
  };
  draw();
}

/* ---------- кабинет: фото для «Найди ошибку» ---------- */
export async function aSpot(ctx, ab) {
  const { sb, S, toast, ask } = ctx;
  const { data: list } = await sb.from('spot_items').select('*').order('created_at', { ascending: false });
  ab.innerHTML = `<p class="muted">Снимите подачу или сервировку с намеренной ошибкой: нет соуса, не тот гарнир, приборы не на месте, грязный стол. Загрузите фото, нажмите на ошибку и напишите, как правильно. Для старта хватит 10–15 фото.</p>
    <label class="btn"><input type="file" accept="image/*" id="sf" hidden>📷 Добавить фото с ошибкой</label>
    <div class="spot-grid">${(list || []).map((x) => `<div class="spot-it ${x.active ? '' : 'off'}"><div class="spot"><img src="${esc(x.photo)}" alt=""><i class="ans" style="left:${x.x}%;top:${x.y}%;width:${x.r * 2}%;height:${x.r * 2}%"></i></div>
      <b>${esc(x.title)}</b><small class="muted">${x.concept ? x.concept.toUpperCase() : 'Обе команды'}</small><button class="btn sm ghost" data-del="${x.id}">Удалить</button></div>`).join('') || ''}</div>`;
  ab.querySelector('#sf').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    toast('Загружаю фото…');
    let url;
    try { const blob = await shrink(f); const path = `${S.me.id}/s-${Date.now()}.jpg`; const { error } = await sb.storage.from('feed').upload(path, blob, { contentType: 'image/jpeg' }); if (error) throw error; url = sb.storage.from('feed').getPublicUrl(path).data.publicUrl; }
    catch (er) { return toast('Фото не загрузилось'); }
    let pt = null;
    const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div class="card stack" style="max-height:92dvh;overflow:auto"><b class="h2">Где ошибка?</b><span class="small muted">Нажмите на фото в месте ошибки</span>
      <div class="spot" id="sp"><img src="${esc(url)}" alt=""></div>
      <input id="st" placeholder="Что не так, например «Нет соуса к стейку»"><textarea id="se" rows="2" placeholder="Как правильно (необязательно)"></textarea>
      <select id="sc"><option value="${S.concept}">Только ${S.concept === 'grano' ? 'GRANO' : 'VILKA'}</option><option value="">Обе команды</option></select>
      <button class="btn" id="ss">Сохранить</button><button class="btn ghost" id="sx">Отмена</button></div>`;
    document.body.appendChild(m);
    const sp = m.querySelector('#sp');
    sp.onclick = (ev) => { const r = sp.getBoundingClientRect(); pt = { x: Math.round(1000 * (ev.clientX - r.left) / r.width) / 10, y: Math.round(1000 * (ev.clientY - r.top) / r.height) / 10 };
      sp.querySelector('.ans')?.remove(); const a = document.createElement('i'); a.className = 'ans'; a.style.left = pt.x + '%'; a.style.top = pt.y + '%'; a.style.width = a.style.height = '24%'; sp.appendChild(a); };
    m.querySelector('#sx').onclick = () => m.remove();
    m.querySelector('#ss').onclick = async () => {
      if (!pt) return toast('Нажмите на место ошибки на фото');
      const title = m.querySelector('#st').value.trim(); if (!title) return toast('Напишите, что не так');
      const { error } = await sb.from('spot_items').insert({ photo: url, x: pt.x, y: pt.y, r: 12, title, explain: m.querySelector('#se').value.trim() || null, concept: m.querySelector('#sc').value || null });
      if (error) return toast(error.message); m.remove(); toast('Добавлено в игру'); aSpot(ctx, ab);
    };
  };
  ab.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => { if (!(await ask('Удалить фото из игры?', 'Удалить', true))) return; await sb.from('spot_items').delete().eq('id', b.dataset.del); aSpot(ctx, ab); });
}
