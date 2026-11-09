# Merges the community recipe lists into recipes.json.
# Run data/fix_db.py afterwards: it applies the wiki-checked clean-up
# (duplicate names, max blocks per tree, farmables) and regenerates js/recipes.js.
import re, json, sys
dl = sys.argv[1]
def norm(s):
    s = s.strip().strip('.')
    s = re.sub(r'\s+Seeds?$', '', s)
    s = re.sub(r'\s+', ' ', s)
    return s
rec, src, rar = {}, {}, {}
# Macper (with rarity)
for line in open(f"{dl}/Macper-dev_GrowtopiaServerAS/RecipeData/Splicables.txt", encoding="utf-8", errors="ignore"):
    m = re.match(r'^//\s*(.+?)\s*\[R(\d+)\]\s*=\s*(.+?)\s*\+\s*(.+?)\s*$', line)
    if m:
        it = norm(m[1]); rec[it] = sorted([norm(m[3]), norm(m[4])]); src[it]="M"; rar[it]=int(m[2])
base=set()
for f in ["kabuokis_growtopia-data/recapies.txt","PnosaJC_mass/data/recipes.txt"]:
    tier=None
    for line in open(f"{dl}/{f}", encoding="utf-8", errors="ignore"):
        t=line.strip()
        if t.startswith("Tier "): tier=t; continue
        m = re.match(r'^(.+?)\s*=\s*(.+?)\s*\+\s*(.+?)$', t)
        if m:
            it=norm(m[1]); r=sorted([norm(m[2]),norm(m[3])])
            if it not in rec: rec[it]=r; src[it]=f[0]
            elif rec[it]!=r: print("CONFLICT",it,rec[it],r,file=sys.stderr)
        elif tier=="Tier 1 Items" and t: base.add(norm(t))
base.discard("Magic Eg"); base.add("Magic Egg")
json.dump({"rec":rec,"rar":rar,"base":sorted(base)}, open("/home/claude/tools/merged.json","w"), indent=0)
ing=set(x for r in rec.values() for x in r)
unres=sorted(i for i in ing if i not in rec and i not in base)
print(len(rec),"recipes; base",sorted(base)); print(len(unres),"unresolved:",unres)
# ---- clean ----
alias={"Death Spike":"Death Spikes","Sharship Floor Tile":"Starship Floor Tile","Tangram Block (any)":"Tangram Block","Tangram Block A":"Tangram Block","Magic Eg":"Magic Egg","Card Block":"Card Block - Spade"}
clean={}
for it,(a,b) in rec.items():
    if any(re.match(r'^\d',x) or '(' in x or ' + ' in x for x in (a,b)): continue
    a,b=alias.get(a,a),alias.get(b,b)
    if a==b or it in (a,b): continue
    clean[it]=[a,b]
# drop cycles
def has_cycle(x,stack):
    if x in stack: return True
    if x not in clean: return False
    return any(has_cycle(y,stack|{x}) for y in clean[x])
cyc=[x for x in clean if has_cycle(x,set())]
print("cycles:",cyc)
for x in cyc: clean.pop(x,None)
leaves=sorted(set(x for r in clean.values() for x in r)-set(clean))
print(len(clean),"clean recipes;",len(leaves),"leaf seeds:",leaves)
json.dump({"rec":clean,"rar":{k:v for k,v in rar.items() if k in clean},"base":sorted(base)},open("/home/claude/tools/clean.json","w"))
for t in ["Science Station","Toxic Waste Barrel","Military Radio","Acid","Barrel","Bathtub","Toilet","Sheet Music: Sharp Piano","Biohazard Sign","Orange Block","Bush","Poppy"]:
    print(t,clean.get(t),rar.get(t))
