// --- Fast-Safe City Navigator (no turn penalty) ---

// Canvas + layout
const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');

// Grid settings
const rows = 15, cols = 15;
const diagAllowed = true;
const cellGap = 2;
const W = canvas.width, H = canvas.height;
const cellW = Math.floor((W - 16) / cols);
const cellH = Math.floor((H - 16) / rows);
const padX = Math.floor((W - cellW * cols) / 2);
const padY = Math.floor((H - cellH * rows) / 2);

// Helpers
const idOf = (r,c)=> r*cols + c;
const rcOf = (id)=> [Math.floor(id/cols), id%cols];
function cellRect(r,c){
  const x = padX + c*cellW, y = padY + r*cellH;
  return [x+cellGap, y+cellGap, cellW-2*cellGap, cellH-2*cellGap];
}

// State
let src = null, dst = null;
let blocks = new Set();
let nightMode = false;
let alpha = 1.0;
let lastPath = [];
let lastExpanded = 0;

// UI refs
const alphaEl = document.getElementById('alpha');
const alphaOut = document.getElementById('alphaOut');
const nightEl = document.getElementById('night');
const statDist = document.getElementById('statDist');
const statRisk = document.getElementById('statRisk');
const statCost = document.getElementById('statCost');
const statExp = document.getElementById('statExp');
const srcLabel = document.getElementById('srcLabel');
const dstLabel = document.getElementById('dstLabel');
const btnRun = document.getElementById('btnRun');
const btnReset = document.getElementById('btnReset');
const btnSwap = document.getElementById('btnSwap');
const btnClearSel = document.getElementById('btnClearSel');

// Risk map
function baseRisk(r,c){
  const spots = [[4,11,0.9],[10,3,0.75],[7,7,0.85],[12,12,0.6]];
  let v = 0.08;
  for (const [rr,cc,inten] of spots){
    const d2 = (r-rr)*(r-rr)+(c-cc)*(c-cc);
    v += inten * Math.exp(-d2/12);
  }
  v = nightMode ? Math.min(1, v+0.15) : Math.max(0, v-0.05);
  return Math.max(0, Math.min(1, v));
}

// Graph
function buildAdj(){
  const adj = new Map();
  const dirs4 = [[1,0],[0,1],[-1,0],[0,-1]];
  const dirs8 = [[1,1],[1,-1],[-1,1],[-1,-1]];
  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      const u = idOf(r,c);
      const list = [];
      if (blocks.has(u)) { adj.set(u, list); continue; }
      const consider = diagAllowed ? dirs4.concat(dirs8) : dirs4;
      for (const [dr,dc] of consider){
        const nr=r+dr, nc=c+dc;
        if (nr<0||nc<0||nr>=rows||nc>=cols) continue;
        const v = idOf(nr,nc);
        if (blocks.has(v)) continue;
        const dx=Math.abs(dr), dy=Math.abs(dc);
        const dist = (dx+dy===2) ? Math.SQRT2 : 1;
        const risk = baseRisk(nr,nc);
        const dir = Math.atan2(nr-r, nc-c) * 180/Math.PI;
        list.push({to:v, dist, risk, dir});
      }
      adj.set(u, list);
    }
  }
  return adj;
}

// Min-heap PQ
class MinPQ{ constructor(){this.a=[]} size(){return this.a.length}
  push(x){this.a.push(x); this._up(this.a.length-1)}
  pop(){const t=this.a[0], e=this.a.pop(); if(this.a.length){this.a[0]=e; this._down(0)} return t}
  _up(i){for(;i;){const p=(i-1)>>1; if(this.a[p].key<=this.a[i].key) break; [this.a[p],this.a[i]]=[this.a[i],this.a[p]]; i=p}}
  _down(i){for(;;){let l=i*2+1,r=l+1,s=i; if(l<this.a.length&&this.a[l].key<this.a[s].key)s=l; if(r<this.a.length&&this.a[r].key<this.a[s].key)s=r; if(s===i)break; [this.a[s],this.a[i]]=[this.a[i],this.a[s]]; i=s}}
}

// Cost
function edgeCost(e, alpha){ return e.dist * (1 + alpha * e.risk); }

// Dijkstra
function dijkstra(adj, src, dst){
  const N = rows*cols, INF = 1e18;
  const dist = new Array(N).fill(INF);
  const prev = new Array(N).fill(-1);
  const pq = new MinPQ();

  dist[src] = 0;
  pq.push({key:0, node:src});
  let expanded = 0;

  while (pq.size()){
    const {key:du, node:u} = pq.pop();
    if (du !== dist[u]) continue;
    expanded++;
    if (u === dst) break;

    for (const e of adj.get(u)){
      const w  = edgeCost(e, alpha);
      const nd = du + w;
      if (nd < dist[e.to]){
        dist[e.to] = nd;
        prev[e.to] = u;
        pq.push({key:nd, node:e.to});
      }
    }
  }

  const path = [];
  if (dist[dst] < INF){
    for (let v = dst; v !== -1; v = prev[v]) path.push(v);
    path.reverse();
  }
  lastExpanded = expanded;
  return { path, cost: dist[dst] };
}

// Stats
function pathStats(path){
  if (!path || path.length<2) return {d:0, r:0, effective:0};
  let d=0, r=0, eff=0;
  for (let i=0;i<path.length-1;i++){
    const [r1,c1] = rcOf(path[i]);
    const [r2,c2] = rcOf(path[i+1]);
    const dx=Math.abs(r2-r1), dy=Math.abs(c2-c1);
    const dist = (dx+dy===2) ? Math.SQRT2 : 1;
    const risk = baseRisk(r2,c2);
    const cost = dist * (1 + alpha * risk);
    d += dist; r += risk; eff += cost;
  }
  return {d, r, effective: eff};
}

// Rendering
function draw(){
  ctx.clearRect(0,0,W,H);

  // heatmap
  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      const risk = baseRisk(r,c);
      const [x,y,w,h] = cellRect(r,c);
      const red = Math.floor(255 * risk);
      ctx.fillStyle = `rgba(${red}, 40, 40, ${0.12 + 0.28*risk})`;
      ctx.fillRect(x,y,w,h);
    }
  }

  // grid
  ctx.strokeStyle='#1f2937'; ctx.lineWidth=1;
  for (let r=0;r<=rows;r++){ const y=padY+r*cellH; ctx.beginPath(); ctx.moveTo(padX,y); ctx.lineTo(padX+cols*cellW,y); ctx.stroke(); }
  for (let c=0;c<=cols;c++){ const x=padX+c*cellW; ctx.beginPath(); ctx.moveTo(x,padY); ctx.lineTo(x,padY+rows*cellH); ctx.stroke(); }

  // blocks (with white border)
  for (const id of blocks){
    const [r,c]=rcOf(id); const [x,y,w,h]=cellRect(r,c);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--block').trim() || '#ef4444';
    ctx.globalAlpha = 0.8; ctx.fillRect(x,y,w,h); ctx.globalAlpha=1;
    ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.strokeRect(x,y,w,h);
  }

  // path
  if (lastPath && lastPath.length){
    const pathColor = getComputedStyle(document.documentElement).getPropertyValue('--path').trim() || '#22c55e';
    ctx.strokeStyle = pathColor; ctx.lineWidth=4; ctx.lineJoin='round'; ctx.lineCap='round';
    ctx.beginPath();
    const [sr,sc]=rcOf(lastPath[0]); const [sx,sy]=cellRect(sr,sc);
    ctx.moveTo(sx+cellW/2, sy+cellH/2);
    for (let i=1;i<lastPath.length;i++){
      const [r,c]=rcOf(lastPath[i]); const [x,y]=cellRect(r,c);
      ctx.lineTo(x+cellW/2, y+cellH/2);
    }
    ctx.stroke();
  }

  // endpoints with white border
  const colSrc = getComputedStyle(document.documentElement).getPropertyValue('--src').trim() || '#3b82f6';
  const colDst = getComputedStyle(document.documentElement).getPropertyValue('--dst').trim() || '#f59e0b';
  if (src!==null){
    const [r,c]=rcOf(src); const [x,y,w,h]=cellRect(r,c);
    ctx.fillStyle=colSrc; ctx.fillRect(x+4,y+4,w-8,h-8);
    ctx.strokeStyle='white'; ctx.lineWidth=1.5; ctx.strokeRect(x+4,y+4,w-8,h-8);
  }
  if (dst!==null){
    const [r,c]=rcOf(dst); const [x,y,w,h]=cellRect(r,c);
    ctx.fillStyle=colDst; ctx.fillRect(x+4,y+4,w-8,h-8);
    ctx.strokeStyle='white'; ctx.lineWidth=1.5; ctx.strokeRect(x+4,y+4,w-8,h-8);
  }
}

function setLabels(){ srcLabel.textContent = (src===null?'—':src); dstLabel.textContent = (dst===null?'—':dst); }

function run(){
  if (src===null || dst===null){ draw(); return; }
  const adj = buildAdj();
  const {path} = dijkstra(adj, src, dst);
  lastPath = path;
  const ps = pathStats(path);
  statDist.textContent = ps.d.toFixed(2);
  statRisk.textContent = ps.r.toFixed(2);
  statCost.textContent = ps.effective.toFixed(2);
  statExp.textContent = String(lastExpanded);
  draw();
}

// Events
alphaEl.addEventListener('input', e=>{ alpha=parseFloat(e.target.value); alphaOut.textContent=alpha.toFixed(1); run(); });
nightEl.addEventListener('change', e=>{ nightMode = e.target.checked; run(); });

// Canvas clicks
canvas.addEventListener('click', (e)=>{
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX-rect.left)*(canvas.width/rect.width);
  const my = (e.clientY-rect.top)*(canvas.height/rect.height);
  const c = Math.floor((mx - padX)/cellW);
  const r = Math.floor((my - padY)/cellH);
  if (r<0||c<0||r>=rows||c>=cols) return;
  const id = idOf(r,c);

  if (e.shiftKey){
    if (id===src || id===dst) return;
    if (blocks.has(id)) blocks.delete(id); else blocks.add(id);
    run(); return;
  }

  if (src===null) src=id;
  else if (dst===null) dst=id;
  else { src=id; dst=null; }
  setLabels(); run();
});

// Buttons
btnRun.addEventListener('click', run);
btnReset.addEventListener('click', ()=>{
  blocks.clear(); src=null; dst=null; lastPath=[];
  setLabels();
  statDist.textContent = statRisk.textContent = statCost.textContent = statExp.textContent = '—';
  draw();
});
btnSwap.addEventListener('click', ()=>{ if (src!==null && dst!==null){ const t=src; src=dst; dst=t; setLabels(); run(); }});
btnClearSel.addEventListener('click', ()=>{ src=null; dst=null; setLabels(); run(); });

// Init
alphaOut.textContent = alpha.toFixed(1);
setLabels();
draw();
