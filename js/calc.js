// Calculation logic (no DOM). Needs js/recipes.js loaded first.
const CORE4 = ["Dirt","Rock","Lava","Cave Background"];
const RECIPES = {...DB.rec};
const RAR = {...DB.rar};
// "Up to N can be dropped from harvesting its tree", from the Growtopia Wiki. Anything not listed defaults to 4.
let DEFAULT_MAX = {};
const MAX_BY_DROP = {
  16: ["Grass"],
  12: ["Bricks","Wood Block","Wooden Background","Rock Background","Stone Wall"],
  8: ["Glass Pane","Amber Glass","Brown Block","Grey Block","Black Block","Lava Rock","Evil Bricks","Red Block","Wheat",
      "Wooden Platform","Aqua Block","Blue Block","Brick Background","Green Block","Orange Block","Pastel Bricks","Red Bricks",
      "White Block","Yellow Block","Window","Ice","Death Spikes","Barn Block","Sheet Music: Blank","Sheet Music: Piano Note",
      "Sheet Music: Sharp Piano","Sheet Music: Sharp Bass","Sheet Music: Sharp Sax","Sheet Music: Sharp Spanish Guitar",
      "Sheet Music: Sharp Violin","Sheet Music: Flat Bass","Sheet Music: Flat Flute","Sheet Music: Flat Piano","Sheet Music: Flat Sax",
      "Sheet Music: Flat Spanish Guitar","Sheet Music: Bass Note","Sheet Music: Drums","Sheet Music: Repeat Begin",
      "Sheet Music: Repeat End","Sheet Music: Sax Note","Egg Shell Spikes","Dark Green Block","Pastel Green Block",
      "Stripey Wallpaper","Copper Plumbing","Ceramic Tile","Hanging Guytrap","Grimstone","Viney Block","Viney Wallpaper",
      "Rice","Steel Block","Golden Block","Pepper Tree","High Tech Block","Roshambo Block","Chandelier","Sorcerer Stone",
      "Laser Grid","Pinball Bumper","Venus Guytrap","Fish Tank","Space Connector","Sugar Cane","Clouds Background"]
};
for (const [n,list] of Object.entries(MAX_BY_DROP)) list.forEach(x=>DEFAULT_MAX[x]=+n);

function isLeaf(x){ return !RECIPES[x]; }
function rarity(x){
  if (RAR[x]) return RAR[x];
  if (isLeaf(x)) return DB.leafR[x]||1;
  const seen=new Set();
  const f=y=>{ if (RAR[y]) return RAR[y]; if (isLeaf(y)) return DB.leafR[y]||1; if(seen.has(y)) return 1; seen.add(y); return RECIPES[y].reduce((a,z)=>a+f(z),0); };
  return f(x);
}
function treeSeedChance(r){ return 1/(Math.floor(r/4)+3); }
function avgBlocks(max){ return 1.25*(1+max/4); }
function seedsPerTree(x, s){
  let e = s.treeSeeds ? treeSeedChance(rarity(x)) : 0;
  if (s.breakBlocks) e += avgBlocks(s.max[x]||4) * (s.pSeed/(1-s.pBack));
  return e;
}
function order(target, s){
  const out=[], seen=new Set();
  (function dfs(x){
    if (seen.has(x)) return; seen.add(x);
    if (!isLeaf(x) && !(s.buy[x] && x!==target)) RECIPES[x].forEach(dfs);
    out.push(x);
  })(target);
  return out;
}
// Plan for one item: how many to splice, and (if it returns >1 seed per tree and regrowing is on)
// how many extra trees to grow from its own seeds.
function planItem(need, e, s){
  const m = 1 + s.margin;
  // Only worth replanting when a tree clearly gives back more than its seed (>= 1.2 seeds per tree).
  const rounds = (s.regrow>0 && e>=1.2) ? s.regrow : 0;
  const spliced = need>0 ? Math.ceil(need*m/Math.max(Math.pow(e,rounds+1),1e-9)) : 0;
  let regrown = 0, k = spliced;
  for (let i=0;i<rounds;i++){ k = k*e; regrown += k; }
  return {spliced, regrown:Math.round(regrown), harvested: spliced + regrown};
}
function calculate(s){
  const ord = order(s.target, s);
  const topDown = ord.slice().reverse();
  const demand = {}, plan = {}, buyList = {}, leaves = {};
  const eT = seedsPerTree(s.target, s.mode==="seeds" ? s : {...s, breakBlocks:false});
  let targetTrees = s.qty;
  if (s.mode==="seeds"){ const have=s.have[s.target]||0; targetTrees = planItem(Math.max(0,s.qty-have), eT, {...s,regrow:0}).spliced; }
  plan[s.target]={spliced:targetTrees, regrown:0, harvested:targetTrees};
  RECIPES[s.target].forEach(y=>demand[y]=(demand[y]||0)+targetTrees);
  for (const x of topDown){
    if (x===s.target) continue;
    const need = Math.max(0,(demand[x]||0)-(s.have[x]||0));
    if (isLeaf(x)) { leaves[x]=need; continue; }
    if (s.buy[x]) { buyList[x]=need; continue; }
    const p = planItem(need, seedsPerTree(x,s), s);
    plan[x]=p;
    if (p.spliced>0) RECIPES[x].forEach(y=>demand[y]=(demand[y]||0)+p.spliced);
  }
  const steps = ord.filter(x=>!isLeaf(x) && !(s.buy[x]&&x!==s.target) && plan[x] && plan[x].spliced>0).map(x=>{
    const isT=x===s.target, e=isT?eT:seedsPerTree(x,s), p=plan[x];
    return {item:x, rarity:rarity(x), trees:p.spliced, regrown:p.regrown, a:RECIPES[x][0], b:RECIPES[x][1],
      blocks:p.harvested*avgBlocks(s.max[x]||4), seedsBack:p.harvested*e - p.regrown, perTree:e,
      needed:isT?null:(demand[x]||0), isTarget:isT};
  });
  const totalTrees = steps.reduce((a,x)=>a+x.trees,0);
  const totalRegrown = steps.reduce((a,x)=>a+x.regrown,0);
  const fin = {trees:targetTrees, blocks:targetTrees*avgBlocks(s.max[s.target]||4), seeds:targetTrees*eT};
  return {steps, leaves, buyList, totalTrees, totalRegrown, fin, ord};
}
