// Calculation logic (no DOM). Needs js/recipes.js loaded first.
const CORE4 = ["Dirt","Rock","Lava","Cave Background"];
const RECIPES = {...DB.rec};
const RAR = {...DB.rar};
let DEFAULT_MAX = {"Bricks":12};
["Rice","Steel Block","Golden Block","Pepper Tree","High Tech Block","Roshambo Block","Chandelier","Sorcerer Stone","Laser Grid","Pinball Bumper","Venus Guytrap","Fish Tank","Space Connector","Sugar Cane","Clouds Background"].forEach(x=>DEFAULT_MAX[x]=8);

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
function calculate(s){
  const ord = order(s.target, s);
  const topDown = ord.slice().reverse();
  const demand = {}, trees = {}, buyList = {}, leaves = {};
  const m = 1 + s.margin;
  const eT = seedsPerTree(s.target, {...s, breakBlocks:false});
  let targetTrees = s.qty;
  if (s.mode==="seeds"){ const have=s.have[s.target]||0; targetTrees = Math.ceil(Math.max(0,s.qty-have)*m/Math.max(eT,1e-9)); }
  trees[s.target]=targetTrees;
  RECIPES[s.target].forEach(y=>demand[y]=(demand[y]||0)+targetTrees);
  for (const x of topDown){
    if (x===s.target) continue;
    const need = Math.max(0,(demand[x]||0)-(s.have[x]||0));
    if (isLeaf(x)) { leaves[x]=need; continue; }
    if (s.buy[x]) { buyList[x]=need; continue; }
    const e = seedsPerTree(x,s);
    const t = need>0 ? Math.ceil(need*m/Math.max(e,1e-9)) : 0;
    trees[x]=t;
    if (t>0) RECIPES[x].forEach(y=>demand[y]=(demand[y]||0)+t);
  }
  const steps = ord.filter(x=>!isLeaf(x) && !(s.buy[x]&&x!==s.target) && trees[x]>0).map(x=>{
    const isT=x===s.target, e=isT?eT:seedsPerTree(x,s);
    return {item:x, rarity:rarity(x), trees:trees[x], a:RECIPES[x][0], b:RECIPES[x][1],
      blocks:trees[x]*avgBlocks(s.max[x]||4), seedsBack:trees[x]*e, needed:isT?null:(demand[x]||0), isTarget:isT};
  });
  const totalTrees = steps.reduce((a,x)=>a+x.trees,0);
  const fin = {trees:targetTrees, blocks:targetTrees*avgBlocks(s.max[s.target]||4), seeds:targetTrees*eT};
  return {steps, leaves, buyList, totalTrees, fin, ord};
}
