# Growtopia Splice Calculator

Plan a splice mass in Growtopia. Pick any spliceable item and how many trees (or seeds) you want; the calculator walks the whole splice tree down to Dirt, Rock, Lava and Cave Background seeds and estimates the seeds you get back at every step.

Plain HTML, CSS and JavaScript with no build step. Open `index.html` in a browser (works straight from disk), or host the folder anywhere static, such as GitHub Pages.

## Files
```
index.html        page layout
css/style.css     styles
js/recipes.js     recipe database (DB)
js/calc.js        calculation logic, no DOM
js/app.js         UI: inputs, rendering, custom recipes
data/             recipes.json + build_db.py (used to generate the database)
```

## Features
- ~840 splice recipes, searchable
- Expected seeds back per tree (rarity-based tree seed drop + seeds from breaking blocks)
- Safety margin, seeds you already own, and "buy instead" for any seed in the tree
- Add or fix recipes in the page (saved in your browser)

## Drop model (community averages)
- Average blocks per tree: 2.5 / 3.75 / 5 / 6.25 for "up to" 4 / 8 / 12 / 16
- Seed from a tree harvest: 1 / (floor(rarity / 4) + 3)
- Breaking a block: 25% seed, 10% block back (~1 seed per 3.6 blocks)

Buffs (Harvester, Deep Sorrow, roles) are not included.

## Data
`data/recipes.json` is merged from community recipe lists that follow the Growtopia Wiki splice guides (last updated around 2022), so newer items may be missing. `data/build_db.py` is the merge script.

Unofficial fan tool. Not affiliated with Ubisoft or Growtopia.
