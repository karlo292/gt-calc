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
data/             recipes.json, farmables.txt and the scripts that build them
```

## Features
- 833 splice recipes, searchable
- Expected seeds back per tree (rarity-based tree seed drop + seeds from breaking blocks)
- Farmables tagged with a green **F**, and replanted from their own seeds instead of
  being spliced again, which cuts both the splicing and the starting seeds
- Safety margin, seeds you already own, and "buy instead" for any seed in the tree
- Add or fix recipes in the page (saved in your browser)

## Drop model (community averages)
- Average blocks per tree: 2.5 / 3.75 / 5 / 6.25 for "up to" 4 / 8 / 12 / 16
- Seed from a tree harvest: 1 / (floor(rarity / 4) + 3)
- Breaking a block: 25% seed, 10% block back (~1 seed per 3.6 blocks)

Buffs (Harvester, Deep Sorrow, roles) are not included.

The wiki's own Farmables table implies a slightly more generous tree-seed drop than
the formula above (Rice at rarity 23 is listed at 28 seeds per 200 trees, where the
formula gives 25), so the estimate errs on the side of needing more seeds.

## Farmables and replanting
The wiki defines a farmable as an item whose tree can drop 8 or more blocks. Those get
a green **F**, and the "replant rounds" setting regrows them from their own seeds
instead of splicing them again. Non-farmables are always spliced: below 8 blocks a tree
gives back less than the seed it cost, so replanting them shrinks away rather than
paying for itself.

## Data
`data/recipes.json` holds `rec` (recipes), `rar` (rarity), `leafR` and `max` (blocks per
tree, where more than 4). It is merged from community recipe lists that follow the
Growtopia Wiki splice guides by `data/build_db.py`, then cleaned by `data/fix_db.py`,
which also regenerates `js/recipes.js`. `data/farmables.txt` is the wiki's
Farmability Guide list.

Checked against the wiki in November 2026:

- all 833 rarities match the wiki's *Items By Rarity* list
- 34 recipes were read off their wiki pages and all 34 match
- Egg Wallpaper and Cardboard Egg are spliceable but appear on no rarity list, so they
  are stored as rarity 0 and their trees are counted as dropping no seed

Still missing: the wiki's Splicable category has about 1,100 items against the 833 here,
so roughly 270 — mostly added since 2022 — are absent. Use "Add or fix a recipe" in the
page for those.

## Previewing
`.claude/launch.json` serves the folder on port 8777; any static server works, as does
opening `index.html` straight from disk.

Unofficial fan tool. Not affiliated with Ubisoft or Growtopia.
