// Calculation logic (no DOM). Needs js/recipes.js loaded first.
const CORE4 = ["Dirt","Rock","Lava","Cave Background"];
const RECIPES = {...DB.rec};
const RAR = {...DB.rar};
// "Up to N can be dropped from harvesting its tree", from the Growtopia Wiki. Anything not listed drops up to 4.
const DEFAULT_MAX = {...DB.max};
// The wiki's definition: a tree that can drop 8 or more blocks is farmable.
function maxDrop(x){ return DEFAULT_MAX[x]||4; }
function isFarmable(x){ return maxDrop(x)>=8; }
// Items that share a recipe come off one tree, which drops a random one of them.
function variants(x){ return DB.vars[x]||null; }

function isLeaf(x){ return !RECIPES[x]; }
// 0 means the item is spliceable but has no rarity on the wiki's list, so its
// tree's seed chance is unknown; callers treat it as dropping no seed.
function rarity(x){
  if (RAR[x]!==undefined) return RAR[x];
  if (isLeaf(x)) return DB.leafR[x]||1;
  const seen=new Set();
  const f=y=>{ if (RAR[y]) return RAR[y]; if (isLeaf(y)) return DB.leafR[y]||1; if(seen.has(y)) return 1; seen.add(y); return RECIPES[y].reduce((a,z)=>a+f(z),0); };
  return f(x);
}
function treeSeedChance(r){ return r>0 ? 1/(Math.floor(r/4)+3) : 0; }
function avgBlocks(max){ return 1.25*(1+max/4); }
function seedsPerTree(x, s){
  let e = s.treeSeeds ? treeSeedChance(rarity(x)) : 0;
  if (s.breakBlocks) e += avgBlocks(s.max[x]||maxDrop(x)) * (s.pSeed/(1-s.pBack));
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
// Plan for one item: how many to splice, and (if it is farmable and replanting is on)
// how many extra trees to grow from its own seeds instead of splicing them.
function planItem(need, e, s, x){
  const m = 1 + s.margin;
  // Only farmables are worth replanting, and only while a tree gives back more
  // than the seed it cost: at e <= 1 the planting dies out instead of paying for itself.
  const rounds = (s.regrow>0 && isFarmable(x) && e>1) ? s.regrow : 0;
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
  if (s.mode==="seeds"){ const have=s.have[s.target]||0; targetTrees = planItem(Math.max(0,s.qty-have), eT, {...s,regrow:0}, s.target).spliced; }
  plan[s.target]={spliced:targetTrees, regrown:0, harvested:targetTrees};
  RECIPES[s.target].forEach(y=>demand[y]=(demand[y]||0)+targetTrees);
  for (const x of topDown){
    if (x===s.target) continue;
    const need = Math.max(0,(demand[x]||0)-(s.have[x]||0));
    if (isLeaf(x)) { leaves[x]=need; continue; }
    if (s.buy[x]) { buyList[x]=need; continue; }
    const p = planItem(need, seedsPerTree(x,s), s, x);
    plan[x]=p;
    if (p.spliced>0) RECIPES[x].forEach(y=>demand[y]=(demand[y]||0)+p.spliced);
  }
  const steps = ord.filter(x=>!isLeaf(x) && !(s.buy[x]&&x!==s.target) && plan[x] && plan[x].spliced>0).map(x=>{
    const isT=x===s.target, e=isT?eT:seedsPerTree(x,s), p=plan[x];
    return {item:x, rarity:rarity(x), trees:p.spliced, regrown:p.regrown, a:RECIPES[x][0], b:RECIPES[x][1],
      blocks:p.harvested*avgBlocks(s.max[x]||maxDrop(x)), seedsBack:p.harvested*e - p.regrown, perTree:e,
      needed:isT?null:(demand[x]||0), isTarget:isT};
  });
  const totalTrees = steps.reduce((a,x)=>a+x.trees,0);
  const totalRegrown = steps.reduce((a,x)=>a+x.regrown,0);
  const fin = {trees:targetTrees, blocks:targetTrees*avgBlocks(s.max[s.target]||maxDrop(s.target)), seeds:targetTrees*eT};
  return {steps, leaves, buyList, totalTrees, totalRegrown, fin, ord};
}
