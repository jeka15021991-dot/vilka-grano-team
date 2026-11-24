# Сборка старой «Вкусной книги GRANO» для Netlify: одна страница + фото, правки берутся из Supabase (legacy_book).
# python3 tools/legacy_build.py <grano.json (расшифрованный)> <папка вывода> <папка pwa>
import sys, json, os, shutil, re
data_path, out, pwa = sys.argv[1:4]
d = json.load(open(data_path, encoding='utf8'))
h = open('public/book-grano.html', encoding='utf8').read()
loader = open('tools/legacy_loader.js', encoding='utf8').read()
safe = lambda o: json.dumps(o, ensure_ascii=False).replace('</', '<\\/')
head_extra = ('<meta name="theme-color" content="#6f7340"><link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon-192.png">'
  '<link rel="apple-touch-icon" href="apple-touch-icon.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
  '<meta name="apple-mobile-web-app-title" content="GRANO"><title>Вкусная книга GRANO</title>')
h = h.replace('<meta name="robots" content="noindex">', '<meta name="robots" content="noindex">' + head_extra, 1)
a = h.index('<script id="app">'); b = h.index('</script>', a)
app = h[a + len('<script id="app">'):b]
h = h[:a] + '<script type="application/json" id="basedata">' + safe({'book': d['book'], 'photos': d['photos']}) + '</script>' \
    + '<script type="text/plain" id="appsrc">' + app.replace('</', '<\\/') + '</script><script>' + loader + '</script>' + h[b + len('</script>'):]
assert 'claude' not in h.lower()
os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'index.html'), 'w', encoding='utf8').write(h)
shutil.copytree('public/img/g', os.path.join(out, 'img/g'), dirs_exist_ok=True)
for f in os.listdir(pwa): shutil.copy(os.path.join(pwa, f), out)
open(os.path.join(out, 'netlify.toml'), 'w').write('[build]\n  publish = "."\n  command = ""\n')
open(os.path.join(out, '_headers'), 'w').write('/index.html\n  Cache-Control: no-cache\n/\n  Cache-Control: no-cache\n')
print('ok', len(h))
