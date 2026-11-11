import re, json, base64, io, hashlib, sys
from PIL import Image
G = 'src/vkusnaya-kniga-grano.html'
V = 'src/vilka.html'
OUT = 'public'

def save_img(b64, path, maxw=900):
    im = Image.open(io.BytesIO(base64.b64decode(b64)))
    im = im.convert('RGB')
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    im.save(OUT + '/' + path, 'JPEG', quality=74, optimize=True, progressive=True)
    return path

# ---------- GRANO
h = open(G, encoding='utf8').read()
book = json.loads(re.search(r'id="book"[^>]*>(.*?)</script>', h, re.S).group(1))
photos = json.loads(re.search(r'id="photos"[^>]*>(.*?)</script>', h, re.S).group(1))
gmap = {}
for i, (k, v) in enumerate(photos.items()):
    gmap[k] = save_img(v, 'img/g/%03d.jpg' % i)
json.dump({'book': book, 'photos': gmap}, open('build/grano.json', 'w'), ensure_ascii=False)
# the viewer shell: everything except the two data scripts
shell = re.sub(r'(<script type="application/json" id="book">).*?(</script>)', r'\1{}\2', h, flags=re.S)
shell = re.sub(r'(<script type="application/json" id="photos">).*?(</script>)', r'\1{}\2', shell, flags=re.S)
open('build/grano_shell.html', 'w').write(shell)
print('grano photos', len(gmap), 'shell', len(shell))

# ---------- VILKA
v = open(V, encoding='utf8').read()
n = [0]
def rep(m):
    mime, data = m.group(1), m.group(2)
    n[0] += 1
    if mime.startswith('image/'):
        p = save_img(data, 'img/v/%03d.jpg' % n[0])
    else:
        p = 'img/v/%03d.mp4' % n[0]
        open(OUT + '/' + p, 'wb').write(base64.b64decode(data))
    return p
v2 = re.sub(r'data:([a-z]+/[a-z0-9+.-]+);base64,([A-Za-z0-9+/=]+)', rep, v)
i = v2.find('<div class="wrap">'); j = v2.find('<script>', i)
body = v2[i:j]
head = v2[:i]
tail = v2[j:]
open('build/vilka_body.html', 'w').write(body)
open('build/vilka_head.html', 'w').write(head)
open('build/vilka_tail.html', 'w').write(tail)
print('vilka media', n[0], 'body', len(body), 'head', len(head))
