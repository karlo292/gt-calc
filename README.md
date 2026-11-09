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
- 1,095 splice recipes, searchable
- Expected seeds back per tree (rarity-based tree seed drop + seeds from breaking blocks)
- Farmables tagged with a green **F**, and replanted from their own seeds instead of
  being spliced again, which cuts both the splicing and the starting seeds
- Items that share a recipe are marked "1 of N": that tree drops a random one of them
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
`data/recipes.json` holds `rec` (recipes), `rar` (rarity), `leafR`, `max` (blocks per
tree, where more than 4) and `vars` (items sharing a recipe). `data/build_db.py` merges
the community recipe lists; `data/fix_db.py` then cleans them, folds in the wiki data
and regenerates `js/recipes.js`. Its inputs are `data/farmables.txt` (the wiki's
Farmability Guide) and `data/new_items.tsv` ({RecipeSplice} scraped from every page in
the wiki's Splicable category).

Checked against the wiki in November 2026:

- all 1,095 rarities come from the wiki's *Items By Rarity* list, and every rarity that
  was already here matched it
- 44 recipes were read off their own wiki pages and all 44 match
- the 262 items added from the Splicable category close the gap that used to leave
  roughly a quarter of the game missing
- items with **?** for a rarity appear on no rarity list, so their trees are counted as
  dropping no seed

Known limit: 178 items share a recipe with at least one other, because one tree drops a
random one of the set (all 13 surgical tools come off Biohazard Sign + High Tech Wall,
all 41 superhero pieces off Rainbow Block + Gateway To Adventure). The wiki gives no
per-variant odds, so the page warns instead of guessing a multiplier: the tree count is
right, but which variant you get is not.

## Previewing
`.claude/launch.json` serves the folder on port 8777; any static server works, as does
opening `index.html` straight from disk.

Unofficial fan tool. Not affiliated with Ubisoft or Growtopia.
