"""One-off clean-up of data/recipes.json, checked against the Growtopia Wiki.

- drops duplicate keys that are misspellings or variant names of another entry
- drops Surgical Tool, which is a wiki index page for 14 tools, not a splicable item
- renames Star Tools to its real name, Star Tool
- rarity 0 now means "no rarity on the wiki's Items By Rarity list"
- adds "max": blocks per tree, from the per-item "Up to N" counts plus
  data/farmables.txt (anything farmable drops at least 8)
"""
import json, re, sys, pathlib

here = pathlib.Path(__file__).parent
root = here.parent
db = json.loads((here / "recipes.json").read_text())
rec, rar, leafR = db["rec"], db["rar"], db["leafR"]

# Duplicates: bad name -> name the wiki uses. Checked one by one; in every case
# both entries already held the same recipe, so only the key is dropped.
DUPES = {
    "Stinky Sock": "Stinky Socks",
    "TommyGun": "Tommygun",
    "Tangram Block A": "Tangram Block",
    "Tangram Block (A to L)": "Tangram Block",
    "Card Block": "Card Block - Spade",
    "Cuddly Bunny/Psychotic Bunny": "Cuddly Bunny",
    "Tramsmog Crystal": "Transmog Crystal",
    "Olde-Timey Hat": "Old-Timey Hat",
}
BOGUS = ["Surgical Tool"]
RENAME = {"Star Tools": "Star Tool"}
# Splicable, but absent from the wiki's rarity list: no known in-game rarity.
NO_RARITY = ["Egg Wallpaper", "Cardboard Egg"]

for bad, good in DUPES.items():          # re-runnable: skip what is already gone
    assert good in rec, good
    if bad in rec:
        assert sorted(rec[bad]) == sorted(rec[good]), (bad, rec[bad], rec[good])
        rec.pop(bad); rar.pop(bad, None)
for bad in BOGUS:
    rec.pop(bad, None); rar.pop(bad, None)
for bad, good in RENAME.items():
    if bad in rec:
        assert good not in rec, good
        rec[good] = rec.pop(bad)
        if bad in rar: rar[good] = rar.pop(bad)
for it in NO_RARITY:
    rar[it] = 0

names = set(rec) | {x for r in rec.values() for x in r}
for bad in list(DUPES) + BOGUS + list(RENAME):
    assert bad not in names, f"{bad} is still referenced as an ingredient"

# Items scraped from the wiki's Splicable category that the merged lists missed.
for line in (here / "new_items.tsv").read_text().splitlines():
    if not line.strip() or line.startswith("#"): continue
    item, a, b, r = line.split("\t")
    if item in rec: continue                 # an existing entry wins
    rec[item] = sorted([a, b]); rar[item] = int(r)

# "Up to N can be dropped from harvesting its tree", from each item's wiki page.
UP_TO = {
    16: ["Grass"],
    12: ["Bricks", "Wood Block", "Wooden Background", "Rock Background", "Stone Wall"],
    8: ["Glass Pane", "Amber Glass", "Brown Block", "Grey Block", "Black Block", "Lava Rock",
        "Evil Bricks", "Red Block", "Wheat", "Wooden Platform", "Aqua Block", "Blue Block",
        "Brick Background", "Green Block", "Orange Block", "Red Bricks", "White Block",
        "Yellow Block", "Window", "Ice", "Death Spikes", "Barn Block", "Sheet Music: Blank",
        "Sheet Music: Piano Note", "Sheet Music: Sharp Piano", "Sheet Music: Sharp Bass",
        "Sheet Music: Sharp Sax", "Sheet Music: Sharp Spanish Guitar", "Sheet Music: Sharp Violin",
        "Sheet Music: Flat Bass", "Sheet Music: Flat Flute", "Sheet Music: Flat Piano",
        "Sheet Music: Flat Sax", "Sheet Music: Flat Spanish Guitar", "Sheet Music: Bass Note",
        "Sheet Music: Drums", "Sheet Music: Repeat Begin", "Sheet Music: Repeat End",
        "Sheet Music: Sax Note", "Egg Shell Spikes", "Dark Green Block", "Pastel Green Block",
        "Stripey Wallpaper", "Copper Plumbing", "Hanging Guytrap", "Grimstone", "Viney Block",
        "Viney Wallpaper", "Rice", "Steel Block", "Golden Block", "Pepper Tree", "High Tech Block",
        "Roshambo Block", "Chandelier", "Sorcerer Stone", "Pinball Bumper", "Venus Guytrap",
        "Fish Tank", "Space Connector", "Sugar Cane"],
}
names = set(rec) | {x for r in rec.values() for x in r}   # recomputed: new items are in now
mx = {n: size for size, group in UP_TO.items() for n in group}
dropped = sorted(n for n in mx if n not in names)      # items the DB doesn't have yet
mx = {n: v for n, v in mx.items() if n in names}

# Farmable means "drops 8 or more", so anything on the list is at least 8.
farm = [l.strip() for l in (here / "farmables.txt").read_text().splitlines()
        if l.strip() and not l.startswith("#")]
added = sorted(n for n in farm if n in names and n not in mx)
for n in added:
    mx[n] = 8

# Several items share one recipe: that tree drops a random one of them, so the
# page warns rather than pretending a given variant is what you get.
groups = {}
for it, r in rec.items():
    groups.setdefault("|".join(r), []).append(it)
db["vars"] = {it: sorted(g) for g in groups.values() if len(g) > 1 for it in g}

db["rec"], db["rar"], db["max"] = rec, rar, dict(sorted(mx.items()))
(here / "recipes.json").write_text(json.dumps(db, separators=(",", ":")))

js = root / "js" / "recipes.js"
head = "\n".join(js.read_text().split("\n")[:2])
js.write_text(f"{head}\nconst DB = {json.dumps(db, separators=(',', ':'))};\n")

# sanity: no cycles, every ingredient resolves
def cyclic(x, stack):
    if x in stack: return True
    return x in rec and any(cyclic(y, stack | {x}) for y in rec[x])
cyc = [x for x in rec if cyclic(x, set())]
assert not cyc, f"recipe cycles: {cyc}"
leaves = sorted({x for r in rec.values() for x in r} - set(rec))

print(f"{len(rec)} recipes, {len(mx)} with a max drop over 4 "
      f"({sum(1 for v in mx.values() if v >= 8)} farmable)")
print(f"{len(leaves)} leaf seeds, {len(db['vars'])} items in a shared-recipe group")
print(f"dropped {len(DUPES)} duplicate keys, {len(BOGUS)} non-splicable, renamed {len(RENAME)}")
print(f"'Up to N' entries for items not in the DB (skipped): {dropped}")
print(f"farmable per the wiki but previously treated as 'up to 4' ({len(added)}): {added}")
