import os, json, base64, secrets, subprocess
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
OUT='public/data/'
keys={}
def enc(concept, obj):
    k=AESGCM.generate_key(256); iv=os.urandom(12)
    ct=AESGCM(k).encrypt(iv, json.dumps(obj,ensure_ascii=False).encode(), None)
    name='%s-%s.bin'%(concept, secrets.token_hex(6))
    open(OUT+name,'wb').write(iv+ct)
    keys[concept]={'key':base64.b64encode(k).decode(),'file':'data/'+name}
g=json.load(open('grano.json'))
enc('grano', g)
enc('vilka', {'html': open('vilka_body.html').read()})
# import file (gpg armored, symmetric)
pw=secrets.token_urlsafe(24)
imp='imp-%s.txt'%secrets.token_hex(8)
subprocess.run(['gpg','--batch','--yes','--symmetric','--cipher-algo','AES256','--armor','--passphrase',pw,'-o',OUT+imp,'import.json'],check=True)
keys['_import']={'file':'data/'+imp,'pw':pw}
json.dump(keys,open('keys.json','w'))
print({k:v['file'] for k,v in keys.items()})
