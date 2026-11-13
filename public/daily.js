/* Вопрос дня от Шефи — на главной */
import { Character } from './characters.js';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function mountDaily(ctx, el, compact) {
  const { sb, S } = ctx;
  const { data: q } = await sb.rpc('daily_question', { p_concept: S.concept });
  if (!q || !el) return;
  let ch, open = !compact;
  const draw = (q) => {
    if (!open && !q.answered) {
      el.innerHTML = `<button class="daily dq-min"><div class="dq-ch"></div><div><small>Вопрос дня от Шефи · +5 ⭐${q.streak ? ` · 🔥 ${q.streak}` : ''}</small><b>${esc(q.question)}</b></div><span class="dq-go">Ответить</span></button>`;
      if (ch) ch.destroy(); ch = new Character(el.querySelector('.dq-ch'), 'shefi', 'doubt');
      el.querySelector('.dq-min').onclick = () => { open = true; draw(q); };
      return;
    }
    if (!open && q.answered) {
      el.innerHTML = `<button class="daily dq-min ${q.correct ? 'ok' : 'bad'}"><div class="dq-ch"></div><div><small>Вопрос дня · ${q.correct ? 'верно, +5 ⭐' : 'попытка засчитана, +1 ⭐'}</small><b>${q.team?.n ? `Команда: верно ${q.team.ok} из ${q.team.n}` : 'Новый вопрос — завтра'}</b></div><span class="dq-go">Разбор</span></button>`;
      if (ch) ch.destroy(); ch = new Character(el.querySelector('.dq-ch'), 'shefi', q.correct ? 'praise' : 'calm');
      el.querySelector('.dq-min').onclick = () => { open = true; draw(q); };
      return;
    }
    const done = q.answered;
    el.innerHTML = `<div class="daily ${done ? (q.correct ? 'ok' : 'bad') : ''}">
      <div class="dq-h"><div class="dq-ch"></div><div><small>Вопрос дня от Шефи${q.streak ? ` · 🔥 ${q.streak} ${q.streak === 1 ? 'день' : q.streak < 5 ? 'дня' : 'дней'} подряд` : ''}</small><b>${esc(q.question)}</b></div></div>
      ${q.photo ? `<img class="dq-ph" src="${esc(q.photo)}" alt="" loading="lazy">` : ''}
      <div class="dq-o">${q.options.map((o, i) => `<button data-c="${i}" class="${done ? (i === q.answer ? 'right' : i === q.choice ? 'wrong' : 'dim') : ''}" ${done ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
      ${done ? `<div class="dq-r"><b>${q.correct ? 'Верно! +5 ⭐' : 'Не совсем. +1 ⭐ за попытку'}</b>${q.explain ? `<span>${esc(q.explain)}</span>` : ''}
        ${q.team?.n ? `<small>Команда сегодня: верно ответили ${q.team.ok} из ${q.team.n}</small>` : ''}<small>Новый вопрос — завтра</small></div>` : '<small class="muted">Один вопрос в день · 5 баллов за верный ответ</small>'}
    </div>`;
    if (ch) ch.destroy();
    ch = new Character(el.querySelector('.dq-ch'), 'shefi', done ? (q.correct ? 'praise' : 'wrong') : 'doubt');
    if (done) setTimeout(() => ch.react(q.correct ? 'praise' : 'wrong'), 200);
    el.querySelectorAll('[data-c]').forEach((b) => b.onclick = async () => {
      el.querySelectorAll('[data-c]').forEach((x) => (x.disabled = true));
      const { data, error } = await sb.rpc('daily_answer', { p_choice: +b.dataset.c, p_concept: S.concept });
      if (error) { ctx.toast(error.message); return; }
      if (data.correct) { ctx.plus(5); ctx.confetti(); } else ctx.plus(1);
      draw(data); ctx.loadBase();
    });
  };
  draw(q);
}
