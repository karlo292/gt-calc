// Page UI: reads inputs, runs calculate(), renders the results.
(function(){
  const $ = id=>document.getElementById(id);
  const esc = t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const st = {mode:"trees", max:{...DEFAULT_MAX}, have:{}, buy:{}};
  let custom = {};
  try { custom = JSON.parse(localStorage.getItem("gtCustomRecipes")||"{}"); } catch(e){}
  function applyCustom(){ for (const [k,v] of Object.entries(custom)){ RECIPES[k]=v.r; if (v.rar) RAR[k]=v.rar; else delete RAR[k]; } }
  applyCustom();
  function fillList(){
    $("itemList").innerHTML = Object.keys(RECIPES).sort((a,b)=>a.localeCompare(b)).map(x=>`<option value="${esc(x)}">`).join("");
    $("count").textContent = Object.keys(RECIPES).length.toLocaleString();
  }
  fillList();
  document.querySelectorAll("#mode button").forEach(b=>b.onclick=()=>{
    st.mode=b.dataset.m; document.querySelectorAll("#mode button").forEach(o=>o.classList.toggle("on",o===b)); run();
  });
  const fmt = n => Math.round(n).toLocaleString();
  const fmt1 = n => (Math.round(n*10)/10).toLocaleString();
  let lastTarget = "Science Station";

  function currentTarget(){
    const v = $("target").value.trim();
    const hit = Object.keys(RECIPES).find(k=>k.toLowerCase()===v.toLowerCase());
    $("targetMsg").textContent = hit ? "" : (v ? (DB.leafR[v]!==undefined || Object.values(RECIPES).some(r=>r.includes(v)) ? `${v} can't be spliced (you get it another way).` : "No spliced item with that name. Pick one from the list.") : "");
    if (hit) lastTarget = hit;
    return hit || null;
  }

  // Green F: farmable, i.e. the tree can drop 8 or more blocks.
  const fTag = x => isFarmable(x) ? '<span class="tag f" title="Farmable: up to '+maxDrop(x)+' blocks per tree">F</span>' : "";
  const rarityText = x => rarity(x) || "?";
  // One tree, several possible items: say so rather than implying you get the one you picked.
  const vTag = x => { const v=variants(x); return v ? `<span class="tag v" title="${esc(v.join(", "))}">1 of ${v.length}</span>` : ""; };

  function itemsTable(ord){
    const rows = ord.map(x=>{
      const L = isLeaf(x);
      return `<tr class="${st.buy[x]?"buy":""}"><td>${esc(x)}${fTag(x)}${vTag(x)}${custom[x]?'<span class="tag">custom</span>':""}</td><td class="num">${rarityText(x)}</td><td>${L?(CORE4.includes(x)?"break the block":"<i>not spliceable: get it another way</i>"):esc(RECIPES[x].join(" + "))}</td>
      <td class="num">${L?"–":`<input class="sm" type="number" min="1" step="1" data-k="max" data-i="${esc(x)}" value="${st.max[x]||maxDrop(x)}">`}</td>
      <td class="num"><input class="sm" type="number" min="0" step="1" data-k="have" data-i="${esc(x)}" value="${st.have[x]||0}"></td>
      <td>${L||x===lastTarget?"":`<input type="checkbox" data-k="buy" data-i="${esc(x)}" ${st.buy[x]?"checked":""}>`}</td></tr>`;
    }).join("");
    $("items").innerHTML = `<tr><th>Item</th><th class="num">Rarity</th><th>Recipe</th><th class="num">Max blocks</th><th class="num">Seeds owned</th><th>Buy</th></tr>${rows}`;
    $("items").querySelectorAll("input").forEach(inp=>inp.onchange=()=>{
      const k=inp.dataset.k, i=inp.dataset.i;
      if (k==="buy") st.buy[i]=inp.checked; else st[k][i]=Math.max(0,+inp.value||0);
      run();
    });
  }

  function run(){
    const target = currentTarget() || lastTarget;
    const s = {...st, target, qty:Math.max(1,+$("qty").value||1),
      pSeed:(+$("pSeed").value||0)/100, pBack:Math.min(.9,(+$("pBack").value||0)/100),
      margin:(+$("margin").value||0)/100, breakBlocks:$("breakBlocks").checked, regrow:Math.max(0,+$("regrow").value||0), treeSeeds:$("treeSeeds").checked};
    const r = calculate(s);
    $("goalName").textContent = target;
    const tv = variants(target);
    $("targetVariants").innerHTML = tv
      ? `This recipe is shared by ${tv.length} items and its tree drops a random one of them, so expect well over ${fmt(r.fin.trees)} trees before you have the ${esc(target)} you want: ${esc(tv.join(", "))}.`
      : "";
    $("baseStats").innerHTML = CORE4.map(b=>`<div class="stat"><div class="n">${fmt(r.leaves[b]||0)}</div><div class="l">${b} seeds</div></div>`).join("")
      + `<div class="stat"><div class="n">${fmt(r.totalTrees)}</div><div class="l">trees to splice in total</div></div>`
      + (r.totalRegrown ? `<div class="stat"><div class="n">${fmt(r.totalRegrown)}</div><div class="l">more trees regrown from seeds</div></div>` : "");
    const other = Object.entries(r.leaves).filter(([x,n])=>n>0 && !CORE4.includes(x));
    const buys = Object.entries(r.buyList).filter(([,n])=>n>0);
    let note = "";
    if (other.length) note += "<b>Also collect (these can't be spliced):</b> " + other.map(([x,n])=>`${fmt(n)} × ${esc(x)}`).join(", ") + "<br>";
    if (buys.length) note += "<b>Buy from vends:</b> " + buys.map(([x,n])=>`${fmt(n)} × ${esc(x)} seeds`).join(", ");
    $("buyNote").innerHTML = note;
    const f = r.fin;
    $("finalStats").innerHTML = `
      <div class="stat"><div class="n">${fmt(f.trees)}</div><div class="l">${esc(target)} trees spliced</div></div>
      <div class="stat"><div class="n">~${fmt(f.blocks)}</div><div class="l">${esc(target)} blocks (avg)</div></div>
      <div class="stat"><div class="n">~${fmt1(f.seeds)}</div><div class="l">${esc(target)} seeds from the trees</div></div>
      <div class="stat"><div class="n">~${fmt1(f.blocks*s.pSeed/(1-s.pBack))}</div><div class="l">more seeds if you break all the blocks</div></div>`;
    $("plan").innerHTML = `<tr><th>#</th><th>Splice</th><th>Recipe</th><th class="num">Rarity</th><th class="num">Seeds needed</th><th class="num">Splice</th><th class="num">Regrow</th><th class="num">Blocks (avg)</th><th class="num">Seeds back</th></tr>` +
      r.steps.map((x,i)=>`<tr><td class="step">${i+1}</td><td>${esc(x.item)}${fTag(x.item)}${vTag(x.item)}${x.isTarget?'<span class="tag t">goal</span>':""}</td><td>${esc(x.a)} + ${esc(x.b)}</td>
      <td class="num">${x.rarity||"?"}</td><td class="num">${x.needed==null?"–":fmt(x.needed)}</td><td class="num">${fmt(x.trees)}</td><td class="num">${x.regrown?fmt(x.regrown):"–"}</td>
      <td class="num">${fmt(x.blocks)}</td><td class="num">${fmt1(x.seedsBack)}</td></tr>`).join("");
    itemsTable(r.ord.slice().reverse());
  }

  function customList(){
    const ks = Object.keys(custom);
    $("customList").innerHTML = ks.length ? ks.map(k=>`<div>${esc(k)} = ${esc(custom[k].r.join(" + "))} <button class="mini" data-del="${esc(k)}">remove</button></div>`).join("") : "<i>No custom recipes yet.</i>";
    $("customList").querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{
      const k=b.dataset.del; delete custom[k];
      if (DB.rec[k]) { RECIPES[k]=DB.rec[k]; RAR[k]=DB.rar[k]; } else { delete RECIPES[k]; delete RAR[k]; }
      save(); fillList(); customList(); run();
    });
  }
  function save(){ try{ localStorage.setItem("gtCustomRecipes", JSON.stringify(custom)); }catch(e){} }
  $("addBtn").onclick=()=>{
    const it=$("cItem").value.trim(), a=$("cA").value.trim(), b=$("cB").value.trim(), rr=+$("cR").value||0;
    if (!it||!a||!b||a===b||it===a||it===b){ $("cMsg").textContent="Fill in the item and two different seeds."; return; }
    // reject cycles
    const reach=(x,seen=new Set())=>{ if(x===it) return true; if(seen.has(x)||!RECIPES[x]) return false; seen.add(x); return RECIPES[x].some(y=>reach(y,seen)); };
    if (reach(a)||reach(b)){ $("cMsg").textContent="That recipe would loop back on itself."; return; }
    custom[it]={r:[a,b], rar:rr||null}; applyCustom(); save(); fillList(); customList();
    $("cMsg").textContent=`Added ${it}.`; ["cItem","cA","cB","cR"].forEach(i=>$(i).value=""); run();
  };
  $("target").addEventListener("input", ()=>{ if (currentTarget()) run(); });
  $("target").addEventListener("change", run);
  ["qty","pSeed","pBack","margin","regrow","breakBlocks","treeSeeds"].forEach(id=>{$(id).oninput=$(id).onchange=run;});
  customList(); run();
})();
