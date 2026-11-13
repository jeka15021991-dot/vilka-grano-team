/* Новая главная: истории, игры-карусель, превью ленты */
import { Character } from './characters.js';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const br = (s) => esc(s).replace(/\n/g, '<br>');
const md = (d = new Date()) => String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const first = (n) => String(n || '').split(' ')[0];
const ini = (n) => String(n || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/* ---------- истории ---------- */
export async function mountStories(ctx, el, bdayEl) {
  const { sb, S } = ctx, admin = S.me.role === 'admin';
  const [news, reads, brief, sums, ppl, asg, cs] = await Promise.all([
    sb.from('news').select('*').or(`concept.is.null,concept.eq.${S.concept}`).order('created_at', { ascending: false }).limit(8),
    sb.from('news_reads').select('news_id').eq('user_id', S.me.id),
    sb.rpc('today_brief'), admin ? { data: [] } : sb.rpc('summary_today'),
    sb.rpc('team_people', { p_concept: S.concept }), admin ? { data: [] } : sb.rpc('my_assignments'),
    sb.rpc('compete_state', { p_concept: S.concept })]);
  const rd = new Set((reads.data || []).map((r) => r.news_id));
  const stories = [];
  const N = news.data || [];
  if (N.length) stories.push({ k: 'news', ic: '📣', label: 'Новости', unread: N.some((n) => !rd.has(n.id)),
    slides: N.slice(0, 5).map((n) => ({ kicker: 'Новости · ' + new Date(n.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }), title: n.title, body: n.body, onShow: () => { if (!rd.has(n.id)) { rd.add(n.id); sb.from('news_reads').insert({ news_id: n.id, user_id: S.me.id }).then(() => {}); } } })) });
  const S2 = (sums.data || []), B = brief.data;
  if (S2.length || B) stories.push({ k: 'brief', ic: '📝', label: 'Пятиминутка', unread: S2.some((x) => !x.read),
    slides: [...(B ? [{ kicker: 'Тема пятиминутки сегодня', title: B.title, body: B.body }] : []),
      ...S2.map((x) => ({ kicker: 'Итоги пятиминутки · ' + (x.author || ''), title: 'Подытожим', body: x.body,
        actions: x.read ? [] : [{ label: 'Ознакомлен(а) 👍', fn: async (v) => { await sb.rpc('summary_read', { p_id: x.id }); x.read = true; v.next(); } }] }))] });
  const bd = (ppl.data || []).filter((p) => p.bday === md() && p.role !== 'admin');
  if (bd.length) {
    stories.push({ k: 'bday', ic: '🎂', label: 'Праздник', unread: true, slides: bd.map((p) => ({ kicker: 'Сегодня день рождения', title: p.full_name, body: p.id === S.me.id ? 'С днём рождения! Команда дарит тебе ⭐ 50 баллов 💛' : 'Поздравь коллегу в ленте команды — ему будет приятно!', bday: true, actions: p.id === S.me.id ? [] : [{ label: 'Поздравить 🎉', href: '#/team' }] })) });
    if (bdayEl) {
      const me = bd.find((p) => p.id === S.me.id);
      bdayEl.innerHTML = `<a class="bdband" href="#/team"><div class="bb-ch"></div><div><small>${me ? 'Это твой день!' : 'Сегодня день рождения'}</small><b>${me ? 'С днём рождения, ' + esc(first(me.full_name)) + '!' : bd.map((p) => esc(first(p.full_name))).join(', ')}</b><span>${me ? 'Подарок от команды: ⭐ 50' : 'Нажми, чтобы поздравить'}</span></div><span class="bb-c">🎉</span></a>`;
      const c = new Character(bdayEl.querySelector('.bb-ch'), 'shefi', 'victory'); setTimeout(() => c.react('victory'), 500);
    }
  }
  const A = (asg.data || []).filter((a) => !a.done);
  if (A.length) stories.push({ k: 'tasks', ic: '📌', label: 'Задания', unread: true, slides: A.map((a) => ({ kicker: a.kind === 'msg' ? 'Сообщение от сервис-менеджера' : 'Задание' + (a.due ? ' · до ' + new Date(a.due + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : ''), title: a.title, body: a.note,
    actions: a.kind === 'quest' ? [{ label: 'Начать квест', href: '#/quest/' + encodeURIComponent(a.target) }] : (a.kind === 'lesson' || a.kind === 'test') ? [{ label: 'Начать', href: '#/block/' + encodeURIComponent(a.target) }]
      : [{ label: a.kind === 'msg' ? 'Прочитал(а) 👍' : 'Сделано ✓', fn: async (v) => { await sb.from('assignment_done').insert({ assignment_id: a.id, user_id: S.me.id }); v.next(); } }] })) });
  const C = cs.data;
  if (C) {
    const all = (C.battle || []).filter((r) => r.staff > 0).sort((a, b) => b.week - a.week);
    const pos = all.findIndex((r) => r.id === C.my_rest) + 1, wk = (C.challenges || []).filter((c) => c.kind === 'week');
    stories.push({ k: 'battle', ic: '⚔️', label: 'Битва', unread: (C.challenges || []).some((c) => !c.claimed && (c.scope === 'personal' ? c.progress >= c.target : (c.teams?.[C.my_rest] ?? 0) >= c.target)),
      slides: [{ kicker: 'Битва ресторанов · неделя', title: pos ? `Твой ресторан на ${pos} месте` : 'Кто сильнее на этой неделе?', body: all.slice(0, 4).map((r, i) => `${['🥇', '🥈', '🥉', '4.'][i]} ${r.name} — ${Math.round(r.week)} баллов на человека`).join('\n'),
        actions: [{ label: 'Открыть битву', href: '#/compete' }] },
      { kicker: 'Задания недели', title: `Выполнено ${wk.filter((c) => c.progress >= c.target).length} из ${wk.length}`, body: wk.map((c) => `${c.icon} ${c.title}: ${Math.min(c.progress, c.target)}/${c.target}`).join('\n'), actions: [{ label: 'К заданиям', href: '#/compete' }] }] });
  }
  stories.sort((a, b) => (b.unread ? 1 : 0) - (a.unread ? 1 : 0));
  el.innerHTML = stories.map((s, i) => `<button class="st ${s.unread ? 'new' : ''} st-${s.k}" data-i="${i}"><span class="st-r"><span class="st-c">${s.ic}</span></span><small>${s.label}</small></button>`).join('');
  el.querySelectorAll('.st').forEach((b) => b.onclick = () => { const s = stories[+b.dataset.i]; s.unread = false; b.classList.remove('new'); viewer(s, stories, +b.dataset.i); });
  if (window.gsap) window.gsap.from(el.querySelectorAll('.st'), { scale: 0.6, opacity: 0, stagger: 0.06, duration: 0.4, ease: 'back.out(2)' });
}

function viewer(story, all, idx) {
  let i = 0;
  const o = document.createElement('div'); o.className = 'story-v st-' + story.k;
  document.body.appendChild(o); document.body.classList.add('playing');
  const close = () => { o.remove(); document.body.classList.remove('playing'); };
  const v = {
    next: () => { if (i + 1 < story.slides.length) { i++; draw(); } else if (idx + 1 < all.length) { close(); viewer(all[idx + 1], all, idx + 1); } else close(); },
    prev: () => { if (i > 0) { i--; draw(); } },
  };
  const draw = () => {
    const s = story.slides[i]; s.onShow && s.onShow();
    o.innerHTML = `<div class="sv-bars">${story.slides.map((_, k) => `<i class="${k < i ? 'f' : k === i ? 'c' : ''}"></i>`).join('')}</div>
      <div class="sv-top"><span class="sv-ic">${story.ic}</span><b>${story.label}</b><button class="sv-x" aria-label="Закрыть">✕</button></div>
      <div class="sv-tapl"></div><div class="sv-tapr"></div>
      <div class="sv-body">${s.bday ? '<div class="sv-ch"></div>' : ''}<small>${esc(s.kicker || '')}</small><div class="sv-t">${esc(s.title || '')}</div>${s.body ? `<p>${br(s.body)}</p>` : ''}
        <div class="sv-act">${(s.actions || []).map((a, k) => a.href ? `<a class="btn gold" href="${a.href}" data-k="${k}">${esc(a.label)}</a>` : `<button class="btn gold" data-k="${k}">${esc(a.label)}</button>`).join('')}</div>
        <span class="sv-hint">${i + 1 < story.slides.length || idx + 1 < all.length ? 'Нажми справа — дальше' : 'Нажми справа — закрыть'}</span></div>`;
    o.querySelector('.sv-x').onclick = close;
    o.querySelector('.sv-tapr').onclick = v.next; o.querySelector('.sv-tapl').onclick = v.prev;
    o.querySelectorAll('[data-k]').forEach((b) => b.onclick = async (e) => { const a = s.actions[+b.dataset.k]; if (a.href) { close(); return; } e.preventDefault(); b.disabled = true; await a.fn(v); });
    if (s.bday) { const c = new Character(o.querySelector('.sv-ch'), 'shefi', 'victory'); setTimeout(() => c.react('victory'), 300); }
    if (window.gsap) window.gsap.from(o.querySelector('.sv-body'), { y: 30, opacity: 0, duration: 0.35, ease: 'power2.out' });
  };
  let sx = 0; o.addEventListener('touchstart', (e) => { sx = e.touches[0].clientY; }, { passive: true });
  o.addEventListener('touchend', (e) => { if (e.changedTouches[0].clientY - sx > 90) close(); });
  draw();
}

/* ---------- игры-карусель ---------- */
export function gamesRow(S) {
  const cards = [];
  (S.quests || []).filter((q) => q.kind === 'quest').forEach((q) => {
    const main = q.id === S.mainQuest?.id, done = main ? S.quest.size : 0, n = q.steps.length;
    if (main && done >= n) return;
    cards.push(`<a class="gc gc-quest" href="#/quest/${encodeURIComponent(q.id)}"><span class="gc-e">🗺️</span><small>Квест${main && done ? ` · ${done}/${n}` : ''}</small><b>${esc(q.title)}</b><span class="gc-go">Играть</span></a>`);
  });
  cards.push(`<a class="gc gc-speed" href="#/play/speed"><span class="gc-e">⚡</span><small>60 секунд</small><b>Блиц</b><span class="gc-go">Играть</span></a>`);
  cards.push(`<a class="gc gc-build" href="#/game/build"><span class="gc-e">🍔</span><small>Фото блюда</small><b>Собери блюдо</b><span class="gc-go">Играть</span></a>`);
  cards.push(`<a class="gc gc-spot" href="#/game/spot"><span class="gc-e">🔍</span><small>Подача и сервировка</small><b>Найди ошибку</b><span class="gc-go">Играть</span></a>`);
  (S.quests || []).filter((q) => q.kind === 'sim').forEach((q) => cards.push(`<a class="gc gc-sim" href="#/sim/${encodeURIComponent(q.id)}"><span class="gc-e">💬</span><small>Симулятор</small><b>${esc(q.title)}</b><span class="gc-go">Играть</span></a>`));
  if (S.stats.due) cards.push(`<a class="gc gc-rev" href="#/play/review"><span class="gc-e">🔁</span><small>${S.stats.due} вопросов ждут</small><b>Повторение</b><span class="gc-go">Повторить</span></a>`);
  return `<div class="grow">${cards.join('')}</div>`;
}

/* ---------- превью ленты ---------- */
export async function mountFeedPreview(ctx, el) {
  const { sb, S } = ctx;
  const { data } = await sb.rpc('feed_list', { p_concept: S.concept, p_limit: 3 });
  const P = data || [];
  el.innerHTML = `${P.length ? P.map((p) => {
    if (p.kind === 'thanks') return `<a class="fp fp-thx" href="#/team"><span class="fp-e">🙏</span><div><small>Рахмет</small><b>${esc(first(p.author_name))} → ${esc(first(p.to_name))}</b><span>${esc(p.body)}</span></div></a>`;
    if (p.kind === 'birthday') return `<a class="fp fp-bd" href="#/team"><span class="fp-e">🎂</span><div><small>День рождения</small><b>${esc(p.to_name)}</b><span>Поздравь в комментариях</span></div></a>`;
    return `<a class="fp" href="#/team">${p.photo ? `<img src="${esc(p.photo)}" alt="" loading="lazy">` : `<span class="fp-a">${esc(ini(p.author_name))}</span>`}<div><small>${esc(first(p.author_name))}${p.kind === 'official' ? ' · сервис-менеджер' : ''}</small><span>${esc(String(p.body || 'Фото смены').slice(0, 90))}</span></div></a>`;
  }).join('') : '<p class="small muted">Здесь пока тихо. Поделись фото смены или скажи рахмет коллеге!</p>'}
    <div class="fp-btns"><a class="btn sm gold" href="#/team" id="fpThx">🙏 Рахмет коллеге</a><a class="btn sm ghost" href="#/team">📷 Фото смены</a></div>`;
  el.querySelector('#fpThx').onclick = () => { try { sessionStorage.setItem('vg_thx', '1'); } catch (e) {} };
}
