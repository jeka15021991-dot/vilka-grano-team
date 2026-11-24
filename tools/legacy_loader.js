(function () {
  var SB = 'https://qapsxeriquyidfxgtccj.supabase.co', KEY = 'sb_publishable_pkhdRyL8FhjAHaKgXmuh6Q_Oi0zlZ9S', AK = 'gk_editor';
  var base = JSON.parse(document.getElementById('basedata').textContent);
  base.baseKeys = Object.keys(base.photos || {});
  function hdr(tok) { return { apikey: KEY, Authorization: 'Bearer ' + (tok || KEY), 'Content-Type': 'application/json' }; }
  function getAuth() { try { return JSON.parse(localStorage.getItem(AK) || 'null'); } catch (e) { return null; } }
  function putAuth(a) { try { if (a) localStorage.setItem(AK, JSON.stringify(a)); else localStorage.removeItem(AK); } catch (e) {} }
  function keep(r) { return { t: r.access_token, r: r.refresh_token, x: Date.now() + (r.expires_in || 3600) * 1000 }; }
  function token() {
    var a = getAuth(); if (!a) return Promise.reject(new Error('auth'));
    if (a.x - Date.now() > 60000) return Promise.resolve(a.t);
    return fetch(SB + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: hdr(), body: JSON.stringify({ refresh_token: a.r }) })
      .then(function (r) { if (!r.ok) { putAuth(null); throw new Error('auth'); } return r.json(); })
      .then(function (j) { var n = keep(j); putAuth(n); return n.t; });
  }
  function admin() {
    window.__BOOK_ADMIN = true;
    window.__BOOK_SAVE = function (book, photos) {
      return token().then(function (t) {
        return fetch(SB + '/rest/v1/legacy_book?on_conflict=concept', { method: 'POST', headers: Object.assign(hdr(t), { Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify({ concept: 'grano', book: book, photos: photos }) });
      }).then(function (r) { if (!r.ok) throw new Error('save ' + r.status); });
    };
  }
  function start() { var s = document.createElement('script'); s.textContent = document.getElementById('appsrc').textContent; document.body.appendChild(s); }
  function norm(p) { var d = String(p || '').replace(/\D/g, ''); if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1); if (d.length === 10) d = '7' + d; return d; }
  function loginForm() {
    var ov = document.createElement('div'); ov.className = 'ov';
    ov.innerHTML = '<form class="form" id="lgf"><h3>Вход для редактора</h3><label for="lg_p">Телефон</label><input id="lg_p" type="tel" autocomplete="username" placeholder="8 777 000 00 00">' +
      '<label for="lg_c">Код</label><input id="lg_c" type="password" inputmode="numeric" autocomplete="current-password"><p class="fmsg" id="lg_m"></p>' +
      '<div class="fbtn"><button type="submit">Войти</button><button type="button" id="lg_x">Отмена</button></div></form>';
    document.body.appendChild(ov);
    document.getElementById('lg_x').onclick = function () { ov.remove(); };
    document.getElementById('lgf').onsubmit = function (e) {
      e.preventDefault(); var m = document.getElementById('lg_m'), ph = norm(document.getElementById('lg_p').value), cd = document.getElementById('lg_c').value.trim();
      if (ph.length !== 11 || !cd) { m.textContent = 'Проверьте телефон и код.'; return; }
      m.textContent = 'Проверяю…';
      fetch(SB + '/auth/v1/token?grant_type=password', { method: 'POST', headers: hdr(), body: JSON.stringify({ email: ph + '@staff.vilka-grano.team', password: cd }) })
        .then(function (r) { if (!r.ok) throw new Error('bad'); return r.json(); })
        .then(function (j) {
          var a = keep(j);
          return fetch(SB + '/rest/v1/rpc/is_admin', { method: 'POST', headers: hdr(a.t), body: '{}' }).then(function (r) { return r.json(); }).then(function (ok) {
            if (ok !== true) throw new Error('role');
            putAuth(a); location.replace(location.pathname);
          });
        })
        .catch(function (er) { m.textContent = er.message === 'role' ? 'Редактировать книгу может только сервис-менеджер.' : 'Неверный телефон или код.'; });
    };
  }
  if (getAuth()) admin();
  var done = false;
  function go() {
    if (done) return; done = true; window.__BOOK = base; start();
    if (/[?&]edit\b/.test(location.search) && !getAuth()) loginForm();
  }
  setTimeout(go, 5000);
  fetch(SB + '/rest/v1/legacy_book?concept=eq.grano&select=book,photos', { headers: hdr(), cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (a) { if (a && a[0] && a[0].book) { base.book = a[0].book; Object.assign(base.photos, a[0].photos || {}); } })
    .catch(function () {}).then(go);
})();
