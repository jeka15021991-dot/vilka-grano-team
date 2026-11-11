import json, re, random, html as H
random.seed(42)
from html.parser import HTMLParser

g = json.load(open('build/grano.json'))
blocks, cards, items = [], [], []

def clean(s): return re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', ' ', s or ''))).strip()

# ---------- GRANO blocks/cards
facts = []  # (concept, block, group, name, text)
for si, s in enumerate(g['book']['sections']):
    bid = 'grano:' + s['id']
    blocks.append(dict(id=bid, concept='grano', section_id=s['id'], title=s['t'], color=s.get('col'), sort=si))
    for gi, gr in enumerate(s['groups']):
        nts = []
        for it in gr['items']:
            if 'c' in it or ('ph' in it and 's' in it and s.get('dish')) or (s['id'] == 'pivo' and 't' in it and 'ph' in it):
                comp = it.get('c') or (re.sub(r'^Состав:\s*','',it.get('t','')) if s['id'] == 'pivo' else '')
                ph = g['photos'].get(it.get('ph')) if it.get('ph') else None
                cards.append(dict(id='grano:' + it['id'], concept='grano', block_id=bid, group_title=gr.get('t') or '', name=re.sub(r'^\d+\.\s*','',it['n']),
                                  descr=it.get('s', ''), comp=comp, allergens=it.get('a', []), photo=ph, sort=len(cards)))
            elif 't' in it and 'n' in it:
                nts.append((it['n'], it['t']))
        if len(nts) >= 3:
            facts.append(('grano', bid, gr.get('t') or s['t'], nts))

# ---------- VILKA
body = open('build/vilka_body.html').read()
secs = re.findall(r'<section class="sec (menu|info) ([^"]*)" id="([^"]+)">(.*?)</section>', body, re.S)
for si, (kind, cls, sid, inner) in enumerate(secs):
    title = clean(re.search(r'<h2>(.*?)</h2>', inner, re.S).group(1))
    bid = 'vilka:' + sid
    blocks.append(dict(id=bid, concept='vilka', section_id=sid, title=title, color=cls.replace('c-', ''), sort=si))
    for k, art in enumerate(re.findall(r'<article class="dish"[^>]*>(.*?)</article>', inner, re.S)):
        name = clean(re.search(r'<h3>(.*?)</h3>', art, re.S).group(1))
        d = re.search(r'<p class="desc">(.*?)</p>', art, re.S)
        c = re.search(r'<p class="comp"><span class="lbl">[^<]*</span>(.*?)</p>', art, re.S)
        ph = re.search(r'<img class="ph"[^>]*src="([^"]+)"', art)
        cards.append(dict(id='%s:%d' % (bid, k), concept='vilka', block_id=bid, group_title='', name=name,
                          descr=clean(d.group(1)) if d else '', comp=clean(c.group(1)) if c else '',
                          allergens=[], photo=ph.group(1) if ph else None, sort=len(cards)))
    nts = []
    for b_, p_ in re.findall(r'<div>(?:<span class="num">\d</span>)?<b>(.*?)</b><p>(.*?)</p></div>', inner, re.S):
        nts.append((clean(b_), clean(p_)))
    for h3, p_ in re.findall(r'<div class="dn[^"]*">.*?<h3>(.*?)</h3><p>(.*?)</p>', inner, re.S):
        nts.append((clean(re.sub(r'<em>.*?</em>', '', h3)), clean(p_)))
    for dt, dd in re.findall(r'<dt>(.*?)</dt>\s*<dd>(.*?)</dd>', inner, re.S):
        nts.append((clean(dt), clean(dd)))
    for b_, p_ in re.findall(r'<div><b>(.*?)</b><p>(.*?)</p></div>', inner, re.S):
        pass
    if len(nts) >= 3:
        facts.append(('vilka', bid, title, nts))

# ---------- question generation
def ingredients(comp):
    comp = re.sub(r'\(.*?\)', '', comp)
    comp = re.split(r'(?i)маринад:|соус:', comp)[0] if len(comp) > 0 else comp
    parts = re.split(r'[,;.]| и ', comp)
    out = []
    for p in parts:
        p = p.strip(' —-:').strip()
        p = p.split(':')[0].strip()
        if re.match(r'(?i)(подаём|подаем|подаётся|подается)', p): continue
        if 3 <= len(p) <= 32 and not re.search(r'\d', p):
            out.append(p[0].upper() + p[1:])
    return list(dict.fromkeys(out))

def stem(w): return w.lower().replace('ё', 'е')[:5]

def shuffle_opts(correct, wrong):
    opts = [correct] + wrong
    random.shuffle(opts)
    return opts, opts.index(correct)

by_block = {}
for c in cards: by_block.setdefault(c['block_id'], []).append(c)
by_concept = {}
for c in cards: by_concept.setdefault(c['concept'], []).append(c)

def pool(c):
    p = [x for x in by_block[c['block_id']] if x['name'] != c['name']]
    if len(set(x['name'] for x in p)) < 3:
        p += [x for x in by_concept[c['concept']] if x['name'] != c['name'] and x not in p]
    names = list(dict.fromkeys(x['name'] for x in p))
    return names

def add(c, qtype, q, opts, ans, expl, photo=None, block=None):
    items.append(dict(concept=c, block_id=block, qtype=qtype, question=q, options=opts, answer=ans, explain=expl, photo=photo))

for c in cards:
    names = pool(c)
    if len(names) < 3: continue
    near = [n for n in names if n in [x['name'] for x in by_block[c['block_id']]]]
    far = [n for n in names if n not in near]
    def wrong3():
        w = random.sample(near, min(3, len(near)))
        if len(w) < 3: w += random.sample(far, 3 - len(w))
        return w
    expl = c['name'] + (': ' + c['comp'] if c['comp'] else (': ' + c['descr'] if c['descr'] else ''))
    if c['comp'] and len(c['comp']) > 12:
        comp_q = c['comp']
        for w in c['name'].split():
            if len(w) > 3: comp_q = re.sub(re.escape(w), '…', comp_q, flags=re.I)
        o, a = shuffle_opts(c['name'], wrong3())
        add(c['concept'], 'by_comp', 'Какое блюдо по составу?\n' + comp_q, o, a, expl, block=c['block_id'])
    if c['photo']:
        o, a = shuffle_opts(c['name'], wrong3())
        add(c['concept'], 'photo', 'Что за блюдо на фото?', o, a, expl, photo=c['photo'], block=c['block_id'])
    ing = ingredients(c['comp'])
    if len(ing) >= 2:
        low = c['comp'].lower().replace('ё', 'е') + ' ' + c['name'].lower()
        others = []
        for x in by_block[c['block_id']] + by_concept[c['concept']]:
            if x['name'] == c['name']: continue
            for i in ingredients(x['comp']):
                if all(stem(w) not in low for w in i.split() if len(w) > 2) and i not in others:
                    others.append(i)
        if len(others) >= 3:
            right = random.choice(ing)
            o, a = shuffle_opts(right, random.sample(others[:25], 3))
            add(c['concept'], 'ingredient', 'Что входит в блюдо «%s»?' % c['name'], o, a, expl, block=c['block_id'])
    if c['descr'] and not c['comp']:
        d = c['descr']
        for w in c['name'].split():
            if len(w) > 3: d = re.sub(re.escape(w[:-1]) + r'\w*', '…', d, flags=re.I)
        o, a = shuffle_opts(c['name'], wrong3())
        add(c['concept'], 'by_desc', 'О каком блюде речь?\n' + d, o, a, expl, block=c['block_id'])

for concept, bid, gt, nts in facts:
    names = list(dict.fromkeys(n for n, t in nts))
    if len(names) < 4: continue
    for n, t in nts:
        t1 = t.split('\nГде есть')[0]
        if len(t1) < 8: continue
        tq = t1
        for w in n.split():
            if len(w) > 3: tq = re.sub(re.escape(w[:-1]) + r'\w*', '…', tq, flags=re.I)
        tq = tq if len(tq) <= 220 else tq[:217] + '…'
        w = random.sample([x for x in names if x != n], 3)
        o, a = shuffle_opts(n, w)
        add(concept, 'fact', '%s: о чём это?\n%s' % (gt, tq), o, a, n + ' — ' + t1, block=bid)

json.dump(dict(blocks=blocks, cards=cards, items=items), open('build/import.json', 'w'), ensure_ascii=False)
import collections
print(len(blocks), 'blocks', len(cards), 'cards', len(items), 'items')
print(collections.Counter((i['concept'], i['qtype']) for i in items))
print(collections.Counter(i['block_id'] for i in items))
for i in random.sample(items, 8): print(json.dumps(i, ensure_ascii=False)[:400])
