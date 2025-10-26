const rows = 15, cols = 15; // square grid
}
if (dst!==null){
const [r,c]=rcOf(dst); const [x,y,w,h]=cellRect(r,c);
ctx.fillStyle = '#f59e0b'; ctx.fillRect(x+4,y+4,w-8,h-8);
}
}


function setLabels(){
srcLabel.textContent = (src===null? '—' : src);
dstLabel.textContent = (dst===null? '—' : dst);
}


function run(){
if (src===null || dst===null) return;
const adj = buildAdj();
const {path, cost} = dijkstra(adj, src, dst);
lastPath = path;
const ps = pathStats(path);
statDist.textContent = ps.d.toFixed(2);
statRisk.textContent = ps.r.toFixed(2);
statCost.textContent = ps.effective.toFixed(2);
statExp.textContent = String(lastExpanded);
draw();
}


// --- Events ---
alphaEl.addEventListener('input', e=>{ alpha = parseFloat(e.target.value); alphaOut.textContent = alpha.toFixed(1); run(); });
turnEl.addEventListener('input', e=>{ turnPenalty = parseFloat(e.target.value); turnOut.textContent = String(turnPenalty); run(); });
nightEl.addEventListener('change', e=>{ nightMode = e.target.checked; run(); });


// canvas clicks
canvas.addEventListener('click', (e)=>{
const rect = canvas.getBoundingClientRect();
const mx = (e.clientX - rect.left) * (canvas.width/rect.width);
const my = (e.clientY - rect.top) * (canvas.height/rect.height);
// locate cell
const c = Math.floor((mx - padX)/cellW); const r = Math.floor((my - padY)/cellH);
if (r<0||c<0||r>=rows||c>=cols) return;
const id = idOf(r,c);
if (e.shiftKey){
if (id===src || id===dst) return; // don't block endpoints
if (blocks.has(id)) blocks.delete(id); else blocks.add(id);
run(); draw(); return;
}
if (src===null) src = id; else if (dst===null) dst = id; else { src = id; dst = null; }
setLabels(); run(); draw();
});


// buttons
const btnRun = document.getElementById('btnRun');
const btnReset = document.getElementById('btnReset');
const btnSwap = document.getElementById('btnSwap');
const btnClearSel = document.getElementById('btnClearSel');


btnRun.addEventListener('click', run);
btnReset.addEventListener('click', ()=>{ blocks.clear(); src=null; dst=null; lastPath=[]; setLabels(); statDist.textContent=statRisk.textContent=statCost.textContent=statExp.textContent='—'; draw(); });
btnSwap.addEventListener('click', ()=>{ if(src!==null && dst!==null){ const t=src; src=dst; dst=t; setLabels(); run(); }});
btnClearSel.addEventListener('click', ()=>{ src=null; dst=null; setLabels(); run(); draw(); });


// initial draw
alphaOut.textContent = alpha.toFixed(1);
turnOut.textContent = String(turnPenalty);
setLabels();
draw();
