/* Project Nexus (To-Do) — Revamp JS
   - Professional task list (localStorage)
   - Card deck viewer with slower flip + holo + cover
   - Lantern sway + blood moon glow
   - Title-only blood drips (no click blocking)
   - Reactive cursor aura on .btn hover (crimson spotlight)
*/

const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const THEME_KEY = 'nexus.theme';
const PREF_KEY  = 'nexus.prefs.v1';


/* ---------- STATE ---------- */
const STORE = "nexus.todo.v1";
let tasks = [];
let filter = "all";
let query  = "";
let deckIndex = 0;
let deckOrder = [];
let cardMode = true; // default ON because you keep asking for cards

/* ---------- ELEMENTS ---------- */
const els = {
  list: $('#list'), empty: $('#empty'),
  tabs: $$('.tab'), search: $('#search'),
  form: $('#f'),
  name: $('#name'), desc: $('#desc'), pri: $('#pri'), cat: $('#cat'), due: $('#due'),
  clear: $('#clearDone'), seed: $('#seed'), toggleCardMode: $('#toggleCardMode'),
  // stats
  sTotal: $('#sTotal'), sToday: $('#sToday'), sDone: $('#sDone'), sProd: $('#sProd'), bar: $('#prodbar i'),
  // deck
  deck: $('#deck'), inner: $('#deckInner'), deckCard: $('#deckCard'),
  frontBody: $('#frontBody'), backBody: $('#backBody'),
  frontToggle: $('#frontToggle'), deckProgress: $('#deckProgress'),
  // cosmetics
  bloodbar: $('#bloodbar'),
  iconLink: $('#iconLink'),
  frontCover: $('#frontCover'), backCover: $('#backCover')
};
let showingBack = false;

/* ---------- STORAGE ---------- */
const load = () => { try { tasks = JSON.parse(localStorage.getItem(STORE)) || []; } catch { tasks = []; } };
const save = () => localStorage.setItem(STORE, JSON.stringify(tasks));
const uid  = () => Math.random().toString(36).slice(2,10);

/* ---------- UTIL ---------- */
const esc  = s => (s||'').replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const fmt  = v => v ? new Date(v).toLocaleString() : 'No due date';
const toast = (t)=>{
  let n = $('#toast'); if(!n){ n=document.createElement('div'); n.id='toast'; n.className='toast'; document.body.appendChild(n); }
  n.textContent = t; n.classList.add('show'); setTimeout(()=>n.classList.remove('show'), 900);
};

/* ---------- STATS / FILTER ---------- */
function stats(){
  const total = tasks.length;
  const done  = tasks.filter(t=>t.done).length;
  const today = tasks.filter(t=> t.due && new Date(t.due).toDateString() === new Date().toDateString()).length;
  const prod  = total ? Math.round(done/Math.max(1,total)*100) : 0;
  els.sTotal.textContent = total; els.sDone.textContent  = done;
  els.sToday.textContent = today; els.sProd.textContent  = prod + "%";
  requestAnimationFrame(()=> els.bar.style.width = prod + "%");
}

function visible(){
  const now = new Date();
  return tasks
    .filter(t =>
      filter === "done"     ? t.done :
      filter === "today"    ? (t.due && new Date(t.due).toDateString() === now.toDateString()) :
      filter === "upcoming" ? (t.due && new Date(t.due) > now) :
      true
    )
    .filter(t => !query || (t.name + " " + (t.desc||"") + " " + (t.category||"")).toLowerCase().includes(query));
}

/* ---------- RENDER LIST ---------- */
function render(){
  stats();
  const data = visible().sort((a,b)=>{
    if(a.done !== b.done) return a.done ? 1 : -1;
    const ad = a.due ? +new Date(a.due) : Infinity;
    const bd = b.due ? +new Date(b.due) : Infinity;
    return ad - bd;
  });

  els.list.innerHTML = "";
  els.empty.style.display = data.length ? "none" : "block";
  data.forEach((t,i)=> els.list.appendChild(row(t,i)));
}

function row(t,i){
  const n = document.createElement('div');
  n.className = 'task'; n.dataset.id = t.id; n.tabIndex = 0;
  n.style.setProperty('--y', (i%2?2:-2)+'px');

  const left = document.createElement('div');
  left.innerHTML = `
    <div class="tTitle">${esc(t.name)} ${t.done?'✅':''}</div>
    <div class="tDesc">${esc(t.desc||'')}</div>
    <div class="badges">
      <span class="pill pri-${t.priority}">${t.priority}</span>
      <span class="pill">${t.category ? '#'+esc(t.category) : '#general'}</span>
      <span class="pill">${fmt(t.due)}</span>
    </div>
  `;

  const right = document.createElement('div'); right.className='actions';
  right.append(
    btn(t.done?'Mark Pending':'Mark Done','btn small good',()=>{ t.done=!t.done; if(t.done) t.completedAt=Date.now(); save(); render(); }),
    btn('Edit','btn small',()=>edit(t.id)),
    btn('Delete','btn small bad',()=>{ tasks = tasks.filter(x=>x.id!==t.id); save(); render(); })
  );

  n.addEventListener('click', e=>{
    if(e.target.tagName === 'BUTTON') return;
    if(cardMode) openDeck(t.id);
  });

  // keyboard "Enter" opens card
  n.addEventListener('keydown', e=>{ if(e.key==='Enter'){ openDeck(t.id); } });

  n.append(left,right);
  return n;
}

function btn(text, cls, fn){ const b=document.createElement('button'); b.className=cls; b.textContent=text; b.onclick=fn; return b; }

function edit(id){
  const t = tasks.find(x=>x.id===id); if(!t) return;
  const n = prompt('Task', t.name); if(n===null) return;
  const d = prompt('Description', t.desc||''); const c = prompt('Category', t.category||'');
  const p = prompt('Priority High/Medium/Low', t.priority); const due = prompt('Due yyyy-mm-ddThh:mm', t.due||'');
  t.name=n.trim()||t.name; t.desc=(d||'').trim(); t.category=(c||'').trim();
  if(/^(High|Medium|Low)$/i.test(p||'')) t.priority=p[0].toUpperCase()+p.slice(1).toLowerCase();
  t.due=due||null; save(); render();
}

/* ---------- FORM + CONTROLS ---------- */
els.form.addEventListener('submit', e=>{
  e.preventDefault();
  const name=els.name.value.trim(); if(!name) return;
  tasks.push({id:uid(), name, desc:els.desc.value.trim(), priority:els.pri.value, category:els.cat.value.trim(), due:els.due.value||null, done:false, createdAt:Date.now()});
  save(); e.target.reset(); render(); toast('Saved');
});
els.clear.onclick = ()=>{ const n=tasks.length; tasks = tasks.filter(t=>!t.done); save(); render(); toast(`Cleared ${n - tasks.length}`); };
els.seed.onclick  = ()=>{ tasks.push(
  {id:uid(), name:"Summon pumpkins", desc:"Spawn sprites", priority:"Medium", category:"fx", due:null, done:false, createdAt:Date.now()},
  {id:uid(), name:"Polish card flip", desc:"Ease + cover art", priority:"High", category:"dev", due:null, done:false, createdAt:Date.now()},
  {id:uid(), name:"Study algorithms", desc:"30 mins practice", priority:"High", category:"school", due:null, done:true, completedAt:Date.now(), createdAt:Date.now()}
); save(); render(); toast('Seeded'); };
els.toggleCardMode && (els.toggleCardMode.onclick = ()=>{
  cardMode = !cardMode; els.toggleCardMode.classList.toggle('primary', cardMode);
  els.toggleCardMode.textContent = cardMode? 'Card Mode: On' : 'Card Mode';
});

els.tabs.forEach(t=> t.addEventListener('click', ()=>{
  els.tabs.forEach(x=>x.classList.remove('active'));
  t.classList.add('active'); filter=t.dataset.filter; render();
}));
els.search.addEventListener('input', e=>{ query = e.target.value.toLowerCase(); render(); });
document.addEventListener('keydown', e=>{
  if(e.key==='/'){ e.preventDefault(); els.search.focus(); els.search.select(); }
  if(e.key.toLowerCase()==='n'){ els.name.focus(); }
});

/* ---------- CARD DECK ---------- */
function openDeck(id){
  deckOrder = visible().map(t=>t.id);
  deckIndex = Math.max(0, deckOrder.indexOf(id));
  showingBack = false;
  els.deck.style.display='flex';
  els.frontCover.style.backgroundImage = `url("${halloweenCoverURL()}")`;
  els.backCover.style.backgroundImage  = `url("${cardBackURL()}")`;
  els.inner.style.transform='rotateY(0deg)';
  ensureDeckNav(); // buttons
  renderDeckFaces();
  wireHoloEffects(); wireParallaxCovers();
}

function renderDeckFaces(){
  const cur = tasks.find(t=>t.id===deckOrder[deckIndex]);
  els.frontBody.innerHTML = cardFrontHTML(cur);
  els.backBody.innerHTML  = cardBackHTML();
  els.deckProgress.textContent = `${deckIndex+1} / ${deckOrder.length}`;

  // draw monster
  const cnv = els.frontBody.querySelector('#monCanvas');
  if (cnv) drawMonster(cnv, cur);

  // wire actions
  const doneBtn = els.frontBody.querySelector('#actDone');
  const editBtn = els.frontBody.querySelector('#actEdit');
  const delBtn  = els.frontBody.querySelector('#actDelete');

  if (doneBtn){
    doneBtn.onclick = (e)=>{ e.stopPropagation();
      cur.done = !cur.done; if(cur.done) cur.completedAt = Date.now();
      save(); render(); renderDeckFaces();
    };
  }
  if (editBtn){
    editBtn.onclick = (e)=>{ e.stopPropagation(); edit(cur.id); renderDeckFaces(); };
  }
  if (delBtn){
    delBtn.onclick = (e)=>{ e.stopPropagation();
      tasks = tasks.filter(x=>x.id!==cur.id); save(); render();
      if(!tasks.length){ closeDeck(); return; }
      deckOrder = visible().map(t=>t.id);
      deckIndex = Math.min(deckIndex, deckOrder.length-1);
      renderDeckFaces();
    };
  }
}
function drawMonster(c, t){
  const ctx = c.getContext('2d');
  const seed = (s)=>{ let h=0; for(let i=0;i<s.length;i++) h=(h*31 + s.charCodeAt(i))|0; return ()=> (h = (h*1664525 + 1013904223)|0, (h>>>0)/4294967296); };
  const rnd = seed((t.id||'x') + (t.name||''));
  const W=c.width, H=c.height; ctx.clearRect(0,0,W,H);

  // dark nebula
  const gx = W*(.4+.2*rnd()), gy = H*(.5+.2*rnd());
  const g = ctx.createRadialGradient(gx,gy,10, gx,gy, Math.max(W,H)*.9);
  g.addColorStop(0,'rgba(106,58,168,.35)'); g.addColorStop(1,'rgba(10,10,16,1)');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

  // body
  const cx=W*0.5, cy=H*0.60, r=52+38*rnd();
  ctx.save(); ctx.translate(cx,cy); ctx.rotate((rnd()-.5)*0.35);
  ctx.fillStyle='#1a1024'; ctx.strokeStyle='#6a3aa8'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.ellipse(0,0,r*1.2,r,0,0,Math.PI*2); ctx.fill(); ctx.stroke();

  // eyes
  const eyeY=-r*0.25, spread=24+10*rnd();
  ['L','R'].forEach((_,i)=>{
    const ex=i?spread:-spread; ctx.fillStyle='#ffd46a';
    ctx.beginPath(); ctx.ellipse(ex,eyeY,11,13,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#2a0d0d'; ctx.beginPath(); ctx.arc(ex+(i?2:-2),eyeY+1,6,0,Math.PI*2); ctx.fill();
  });

  // mouth
  ctx.strokeStyle='#cf1432'; ctx.lineWidth=4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-22, 10); ctx.quadraticCurveTo(0, 22, 22, 10); ctx.stroke();

  // horns or stem
  if(rnd()>.5){ ctx.fillStyle='#cf1432';
    ctx.beginPath(); ctx.moveTo(-12,-r); ctx.lineTo(-2,-r-16); ctx.lineTo(6,-r); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12,-r); ctx.lineTo(2,-r-16); ctx.lineTo(-6,-r); ctx.closePath(); ctx.fill();
  } else { ctx.fillStyle='#3c8a3c'; ctx.fillRect(-4,-r-10,8,12); }

  // aura sparks
  for(let i=0;i<12;i++){
    const a=rnd()*Math.PI*2, rr=r+20+rnd()*40;
    const x=Math.cos(a)*rr, y=Math.sin(a)*rr;
    ctx.fillStyle=`rgba(207,20,50,${0.12+0.2*rnd()})`;
    ctx.beginPath(); ctx.arc(x,y, 3+4*rnd(), 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();

  // floor shadow
  ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(cx,H-16,r*1.1,10,0,0,Math.PI*2); ctx.fill();
}

function flipNext(){
  if(!showingBack){ els.inner.style.transform='rotateY(180deg)'; showingBack=true; return; }
  // from back -> advance to next front
  showingBack=false;
  deckIndex=(deckIndex+1)%deckOrder.length;
  els.inner.style.transform='rotateY(0deg)';
  renderDeckFaces();
}

function flipPrev(){
  if(showingBack){ els.inner.style.transform='rotateY(0deg)'; showingBack=false; return; }
  deckIndex=(deckIndex-1+deckOrder.length)%deckOrder.length;
  renderDeckFaces();
}



function cardFrontHTML(t){
  if(!t) return `<div class="tDesc">No task</div>`;
  const due = t.due ? new Date(t.due).toLocaleString() : 'No due date';
  const pct = t.done ? 100 : (t.priority==='High'? 35 : t.priority==='Medium'? 22 : 12); // starting “HP”
  return `
    <div class="pk-top">
      <div class="pk-title">${esc(t.name)}</div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="pk-rarity">${t.priority}</span>
        <div class="hpRing" style="--pct:${pct}%"></div>
      </div>
    </div>

    <div class="pk-art">
      <canvas id="monCanvas" width="600" height="240"></canvas>
      <div class="foilLayer"></div>
    </div>

    <div class="pk-stickers">
      <span class="pill">${t.category ? '#'+esc(t.category) : '#general'}</span>
      <span class="pill">${due}</span>
      <span class="pill">${t.done ? 'Completed' : 'Pending'}</span>
      <span class="pill">Created ${t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'}</span>
    </div>

    <div class="pk-actions">
      <button class="btn small good" id="actDone">${t.done?'Mark Pending':'Mark Done'}</button>
      <button class="btn small" id="actEdit">Edit</button>
      <button class="btn small bad" id="actDelete">Delete</button>
    </div>
  `;
}

function cardBackHTML(){
  return `
    <div class="pk-back">
      <div class="pk-back-logo">PROJECT&nbsp;NEXUS</div>
      <div class="pk-tip">Flip again for next • Space/→ next • ← previous • Esc close</div>
    </div>
  `;
}


function cardBackHTML(){
  return `
    <div class="pk-back">
      <div class="pk-back-logo">PROJECT&nbsp;NEXUS</div>
      <div class="pk-tip">Flip again to view the next task. Space/→ next • ← previous • Esc close</div>
    </div>
  `;
}




// deck interactions
function ensureDeckNav(){
  if (document.querySelector('.deckNav')) return;
  const bar = document.createElement('div');
  bar.className = 'deckNav';
  const prev = document.createElement('button'); prev.className='navBtn'; prev.textContent='← Prev';
  const next = document.createElement('button'); next.className='navBtn'; next.textContent='Next →';
  const close= document.createElement('button'); close.className='navBtn'; close.textContent='Esc ×';
  prev.onclick = (e)=>{ e.stopPropagation(); flipPrev(); };
  next.onclick = (e)=>{ e.stopPropagation(); flipNext(); };
  close.onclick= (e)=>{ e.stopPropagation(); closeDeck(); };
  bar.append(prev,next,close);
  document.getElementById('deckCard').appendChild(bar);
}

function closeDeck(){
    els.deck.style.display='none';
    showingBack = false;
    els.inner.style.transform = 'rotateY(0deg)';
    unwireHolo(); unwireParrallaxCovers();
}
els.deckCard.addEventListener('click', flipNext);
els.deck.addEventListener('click', e=>{ if(e.target===els.deck) closeDeck(); });
els.frontToggle.addEventListener('click', e=>{
  e.stopPropagation();
  const id = deckOrder[deckIndex];
  const t = tasks.find(x=>x.id===id); if(!t) return;
  t.done = !t.done; if(t.done) t.completedAt = Date.now();
  save(); render(); renderDeckFaces();
});
document.addEventListener('keydown', e=>{
  if(els.deck.style.display!=='flex') return;
  if(e.key==='Escape') closeDeck();
  if(e.key===' ' || e.key==='ArrowRight') { e.preventDefault(); flipNext(); }
  if(e.key==='ArrowLeft') { e.preventDefault(); flipPrev(); }
});
// swipe
let startX=0, dx=0;
els.deckCard.addEventListener('pointerdown', e=>{ startX=e.clientX; dx=0; els.deckCard.setPointerCapture(e.pointerId); });
els.deckCard.addEventListener('pointermove', e=>{
  if(!startX) return; dx = e.clientX - startX; els.inner.style.transform = `rotateY(${dx/6}deg)`;
});
els.deckCard.addEventListener('pointerup', ()=>{
  if(Math.abs(dx)>70) { dx>0 ? flipPrev() : flipNext(); }
  else { els.inner.style.transform='rotateY(0deg)'; }
  startX=0; dx=0;
});

/* ---------- HOLO + PARALLAX ---------- */
let mover, foilF, foilB, shineF, shineB;
function wireHoloEffects(){
  foilF = $('#cardFront .foil'); foilB = $('#cardBack .foil');
  shineF = $('#cardFront .shine'); shineB = $('#cardBack .shine');
  mover = e=>{
    const r = els.deckCard.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height;
    const rx = (y - .5) * -8, ry = (x - .5) * 8;
    els.deckCard.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    const bgp = `${(x*100).toFixed(1)}% ${(y*100).toFixed(1)}%`;
    [foilF,foilB,shineF,shineB].forEach(el=> el && (el.style.backgroundPosition = bgp));
  };
  document.addEventListener('mousemove', mover);
}
function unwireHolo(){ document.removeEventListener('mousemove', mover); els.deckCard.style.transform='none'; }

// cover parallax
let coverMover;
function wireParallaxCovers(){
  const front = els.frontCover, back = els.backCover;
  coverMover = e=>{
    const r = els.deckCard.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    const tx = (x*12).toFixed(2), ty = (y*12).toFixed(2);
    if(front) front.style.transform = `translate(${tx}px, ${ty}px) scale(1.03)`;
    if(back)  back.style.transform  = `translate(${tx/2}px, ${ty/2}px) scale(1.02)`;
  };
  document.addEventListener('mousemove', coverMover);
}
function unwireParallaxCovers(){ document.removeEventListener('mousemove', coverMover); if(els.frontCover) els.frontCover.style.transform='none'; if(els.backCover) els.backCover.style.transform='none'; }

/* ---------- BLOODLINE DRIPS (click-through) ---------- */
(function drips(){
  const bar = els.bloodbar; if(!bar) return;
  const mk = (leftPct, delay) => {
    const d = document.createElement('i');
    d.className = 'drip'; d.style.left = leftPct; bar.appendChild(d);
    d.animate(
      [
        { transform:'translateY(-10px) scaleY(.3)', opacity:0 },
        { opacity:1, offset:.22 },
        { transform:'translateY(34px)', opacity:1, offset:.62 },
        { transform:'translateY(60px)', opacity:0 }
      ],
      { duration:5200, delay, iterations:Infinity, easing:'cubic-bezier(.2,.8,.2,1)' }
    );
  };
  mk('18%', 500); mk('51%', 1900); mk('82%', 3300);
})();

/* ---------- LANTERNS SWAY + BLOOD MOON PULSE ---------- */
(function skyFX(){
  // sway already handled via CSS keyframes; add soft moon pulse if element exists
  const moon = document.querySelector('.blood-moon');
  if(!moon) return;
  moon.animate(
    [{ filter:'saturate(1) brightness(1)' }, { filter:'saturate(1.15) brightness(1.12)' }, { filter:'saturate(1) brightness(1)' }],
    { duration: 4200, iterations: Infinity, easing: 'ease-in-out' }
  );
})();

/* ---------- REACTIVE CURSOR AURA ON BUTTONS ---------- */
(function reactiveButtons(){
  const root = document.documentElement;
  let currentAura;
  function enter(e){
    currentAura = document.createElement('span');
    currentAura.className = 'btn-aura';
    e.currentTarget.appendChild(currentAura);
  }
  function move(e){
    if(!currentAura) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    currentAura.style.left = x + 'px'; currentAura.style.top = y + 'px';
  }
  function leave(){ if(currentAura){ currentAura.remove(); currentAura=null; } }
  function wire(btn){
    btn.style.position='relative'; btn.style.overflow='hidden';
    btn.addEventListener('pointerenter', enter);
    btn.addEventListener('pointermove', move);
    btn.addEventListener('pointerleave', leave);
  }
  $$('.btn').forEach(wire);
  // future buttons
  const mo = new MutationObserver(muts=>{
    muts.forEach(m=>{
      m.addedNodes.forEach(n=>{
        if(n.nodeType===1 && n.classList.contains('btn')) wire(n);
        if(n.nodeType===1) n.querySelectorAll && n.querySelectorAll('.btn').forEach(wire);
      });
    });
  });
  mo.observe(document.body, { childList:true, subtree:true });
})();

function initSettings(){
  const open = $('#openSettings'), dlg = $('#settings');
  const close = $('#closeSettings'), themeSel = $('#themeSelect');
  const densitySel = $('#densitySelect'), tStats = $('#toggleStats'), tDecor = $('#toggleDecor');
  const resetBtn = $('#resetTheme');

  if(!open || !dlg) return;

  const savedTheme = localStorage.getItem(THEME_KEY) || 'halloween';
  const prefs = loadPrefs();
  themeSel.value   = savedTheme;
  densitySel.value = prefs.density || 'roomy';
  tStats.checked   = prefs.showStats !== false;
  tDecor.checked   = prefs.decor !== false;

  open.onclick = ()=> dlg.classList.remove('hide');
  close.onclick= ()=> dlg.classList.add('hide');
  dlg.addEventListener('click', e=>{ if(e.target===dlg) dlg.classList.add('hide'); });

  themeSel.onchange = ()=> applyTheme(themeSel.value);
  densitySel.onchange = ()=> { const p=loadPrefs(); p.density=densitySel.value; savePrefs(p); applyPrefs(p); };
  tStats.onchange = ()=> { const p=loadPrefs(); p.showStats=tStats.checked; savePrefs(p); applyPrefs(p); };
  tDecor.onchange = ()=> { const p=loadPrefs(); p.decor=tDecor.checked; savePrefs(p); applyPrefs(p); toggleDecor(p.decor!==false); };

  resetBtn.onclick = ()=>{
    themeSel.value = matchMedia('(prefers-color-scheme: light)').matches ? 'light-basic' : 'dark-basic';
    themeSel.dispatchEvent(new Event('change'));
  };
}


/* ---------- HALLOWEEN COVER ART (SVG→data URL) ---------- */
function halloweenCoverURL(){
  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 960'>
  <defs>
    <linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#241335'/><stop offset='1' stop-color='#0a0a14'/>
    </linearGradient>
  </defs>
  <rect width='640' height='960' fill='url(#sky)'/>
  <g transform='translate(480 140)'>
    <circle r='92' fill='#cf1432'/>
    <circle r='82' fill='#0d0f1e' transform='translate(22,0)'/>
    <path d='M86,-10 L126,0 L86,10 Z' fill='#cf1432'/>
  </g>
  <radialGradient id='fog' cx='50%' cy='60%' r='60%'>
    <stop offset='0' stop-color='#4c2a7a'/><stop offset='1' stop-color='transparent'/>
  </radialGradient>
  <circle cx='320' cy='640' r='420' fill='url(#fog)' opacity='.33'/>
</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}


function cardBackURL(){
  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 960'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='#2b133c'/><stop offset='1' stop-color='#0d0f1e'/>
    </linearGradient>
  </defs>
  <rect width='640' height='960' fill='url(#g)'/>
  <circle cx='320' cy='420' r='180' fill='none' stroke='#cf1432' stroke-width='10' opacity='.85'/>
  <circle cx='320' cy='420' r='140' fill='none' stroke='#6a3aa8' stroke-width='8' opacity='.65'/>
  <g fill='none' stroke='#cf1432' stroke-width='4' opacity='.7' transform='translate(320 420)'>
    <polygon points='0,-110 95,55 -95,55' />
    <line x1='0' y1='-110' x2='0' y2='80'/>
    <line x1='-95' y1='55' x2='95' y2='55'/>
  </g>
</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}


function applyTheme(name){
  document.documentElement.setAttribute('data-theme', name);
  localStorage.setItem(THEME_KEY, name);
}
function applyPrefs(p){
  document.documentElement.setAttribute('data-density', p.density || 'roomy');
  document.body.classList.toggle('hide-stats', p.showStats === false);
  document.body.classList.toggle('no-decor', p.decor === false);
}
function loadPrefs(){
  try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch { return {}; }
}
function savePrefs(p){ localStorage.setItem(PREF_KEY, JSON.stringify(p)); }

/* ---------- INIT ---------- */
(function init(){
  initThemeUI()
  load(); render();
  // theme + prefs
  const savedTheme = localStorage.getItem(THEME_KEY) || 'halloween';
  applyTheme(savedTheme);
  applyPrefs(loadPrefs());
  initSettings();

  // pumpkins (decor)
  if((loadPrefs().decor !== false)) buildPumpkins();

  // default due one hour from now
  const d=new Date(Date.now()+3600e3);
  if(els.due) els.due.value = new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
})();

function buildPumpkins(count=7){
  const row = $('#pumpkinRow'); if(!row) return;
  row.innerHTML = '';
  const svgPumpkin = (scale=1)=> `
  <svg viewBox="0 0 100 100" width="${84*scale}" height="${84*scale}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="pGrad" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="#ffb36a"/>
        <stop offset="55%" stop-color="#ff8a3a"/>
        <stop offset="100%" stop-color="#d45b1f"/>
      </radialGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="rgba(255,230,160,1)"/>
        <stop offset="100%" stop-color="rgba(255,230,160,0)"/>
      </radialGradient>
    </defs>
    <!-- body -->
    <ellipse cx="50" cy="60" rx="38" ry="30" fill="url(#pGrad)" stroke="#6a2a14" stroke-width="2"/>
    <ellipse cx="32" cy="60" rx="14" ry="26" fill="url(#pGrad)" stroke="#6a2a14" stroke-width="2"/>
    <ellipse cx="68" cy="60" rx="14" ry="26" fill="url(#pGrad)" stroke="#6a2a14" stroke-width="2"/>
    <!-- grooves -->
    <path d="M50 30 C40 50 40 70 50 90" stroke="#8a3a1e" stroke-width="2" fill="none" opacity=".6"/>
    <path d="M38 35 C30 52 30 68 38 85" stroke="#8a3a1e" stroke-width="2" fill="none" opacity=".6"/>
    <path d="M62 35 C70 52 70 68 62 85" stroke="#8a3a1e" stroke-width="2" fill="none" opacity=".6"/>
    <!-- stem -->
    <path d="M48 26 q4 -10 10 0" stroke="#2d682d" stroke-width="4" fill="none"/>
    <!-- candle -->
    <g class="flame">
      <ellipse cx="50" cy="61" rx="6" ry="5" fill="rgba(255,210,120,.9)"/>
      <ellipse cx="50" cy="60" rx="3.5" ry="8" fill="#ffd46a"/>
      <ellipse cx="50" cy="60" rx="2" ry="5" fill="#fff2b3"/>
    </g>
    <circle cx="50" cy="60" r="20" fill="url(#glow)" opacity=".25"/>
    <!-- face -->
    <circle cx="40" cy="58" r="4.2" fill="#1a0808"/>
    <circle cx="60" cy="58" r="4.2" fill="#1a0808"/>
    <path d="M38 70 q12 6 24 0" stroke="#1a0808" stroke-width="4" fill="none" stroke-linecap="round"/>
  </svg>`;

  // scatter pumpkins
  for(let i=0;i<count;i++){
    const d = document.createElement('div');
    d.className = 'pumpkin';
    const s = 0.9 + Math.random()*0.5;
    d.style.left = Math.round(4 + Math.random()*92) + '%';
    d.style.animationDelay = (Math.random()*2).toFixed(2)+'s';
    d.innerHTML = svgPumpkin(s);
    row.appendChild(d);
  }
}

function toggleDecor(on){
  const sky = $('.sky'); const row = $('#pumpkinRow');
  if(sky) sky.style.display = on ? '' : 'none';
  if(row){ row.style.display = on ? '' : 'none'; if(on && !row.children.length) buildPumpkins(); }
}

