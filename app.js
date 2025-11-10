/* Minimal professional app + optional Halloween + card deck */

const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const STORE = "todo.pro.v1";
let tasks = [];
let filter = "all";
let query  = "";
let deckIndex = 0;
let deckOrder = [];

const els = {
  list: $('#list'), empty: $('#empty'),
  tabs: $$('.tab'), search: $('#search'),
  name: $('#name'), desc: $('#desc'), pri: $('#pri'), cat: $('#cat'), due: $('#due'),
  form: $('#f'), add: $('#addBtn'), clear: $('#clearDone'), seed: $('#seed'),
  sTotal: $('#sTotal'), sToday: $('#sToday'), sDone: $('#sDone'), sProd: $('#sProd'), bar: $('#prodbar i'),
  deck: $('#deck'), deckInner: $('#deckInner'), cardFront: $('#cardFront'), cardBack: $('#cardBack'),
  halloween: $('#halloween'),
  toast: $('#toast'), iconLink: $('#iconLink'),
};

// --- storage
const load = () => { try { tasks = JSON.parse(localStorage.getItem(STORE)) || []; } catch { tasks = []; } };
const save = () => localStorage.setItem(STORE, JSON.stringify(tasks));
const uid  = () => Math.random().toString(36).slice(2,10);
const esc  = s => (s||'').replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const fmt  = v => v ? new Date(v).toLocaleString() : 'No due date';
const toast = t => { els.toast.textContent = t; els.toast.classList.add('show'); setTimeout(()=>els.toast.classList.remove('show'), 900); };

// --- stats
function stats(){
  const total = tasks.length;
  const done  = tasks.filter(t=>t.done).length;
  const today = tasks.filter(t=> t.due && new Date(t.due).toDateString() === new Date().toDateString()).length;
  const prod  = total ? Math.round(done/Math.max(1,total)*100) : 0;
  els.sTotal.textContent = total;
  els.sDone.textContent  = done;
  els.sToday.textContent = today;
  els.sProd.textContent  = prod + "%";
  requestAnimationFrame(()=> els.bar.style.width = prod + "%");
}

// --- filter/search
function visible(){
  return tasks
    .filter(t => filter === "all" ? true : filter === "done" ? t.done : !t.done)
    .filter(t => !query || (t.name + " " + (t.desc||"") + " " + (t.category||"")).toLowerCase().includes(query));
}

// --- render list
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

function row(t, i){
  const n = document.createElement('div'); n.className='task'; n.dataset.id=t.id;

  const left = document.createElement('div');
  left.innerHTML = `<div class="tTitle">${esc(t.name)} ${t.done?'✅':''}</div>
                    <div class="tDesc">${esc(t.desc||'')}</div>`;

  const right = document.createElement('div'); right.className='actions';
  right.append(
    btn(t.done?'Mark Pending':'Mark Done','btn small good',()=>{ t.done=!t.done; if(t.done) t.completedAt=Date.now(); save(); render(); }),
    btn('Edit','btn small',()=>edit(t.id)),
    btn('Delete','btn small bad',()=>{ tasks = tasks.filter(x=>x.id!==t.id); save(); render(); })
  );

  n.addEventListener('click', e=>{
    // ignore button clicks
    if(e.target.tagName === 'BUTTON') return;
    openDeck(t.id);
  });

  // badges row
  const badges = document.createElement('div'); badges.className='badges';
  badges.append(pill(`${t.priority}`, 'pri-'+t.priority), pill(t.category?('#'+t.category):'#general'), pill(fmt(t.due)));
  left.appendChild(badges);

  n.append(left,right);
  return n;
}

function pill(text, cls=''){ const s=document.createElement('span'); s.className='pill '+cls; s.textContent=text; return s; }
function btn(text, cls, fn){ const b=document.createElement('button'); b.className=cls; b.textContent=text; b.onclick=fn; return b; }

// --- edit via prompts (fast + reliable local)
function edit(id){
  const t = tasks.find(x=>x.id===id); if(!t) return;
  const n = prompt('Task', t.name); if(n===null) return;
  const d = prompt('Description', t.desc||''); const c = prompt('Category', t.category||'');
  const p = prompt('Priority High/Medium/Low', t.priority);
  const due = prompt('Due yyyy-mm-ddThh:mm', t.due||'');
  t.name=n.trim()||t.name; t.desc=(d||'').trim(); t.category=(c||'').trim();
  if(/^(High|Medium|Low)$/i.test(p||'')) t.priority=p[0].toUpperCase()+p.slice(1).toLowerCase();
  t.due = due||null; save(); render();
}

// --- form actions
els.form.addEventListener('submit', e=>{
  e.preventDefault();
  const name=els.name.value.trim(); if(!name) return;
  tasks.push({id:uid(), name, desc:els.desc.value.trim(), priority:els.pri.value, category:els.cat.value.trim(), due:els.due.value||null, done:false, createdAt:Date.now()});
  save(); e.target.reset(); render(); toast('Saved');
});
els.clear.onclick = ()=>{ const n=tasks.length; tasks = tasks.filter(t=>!t.done); save(); render(); toast(`Cleared ${n - tasks.length}`); };
els.seed.onclick  = ()=>{ tasks.push(
  {id:uid(), name:"Study algorithms", desc:"30 mins LeetCode", priority:"High", category:"school", due:null, done:false, createdAt:Date.now()},
  {id:uid(), name:"Gym", desc:"Push day", priority:"Medium", category:"health", due:null, done:false, createdAt:Date.now()},
  {id:uid(), name:"Ship card flip", desc:"Deck polish", priority:"Low", category:"dev", due:null, done:true, completedAt:Date.now(), createdAt:Date.now()}
); save(); render(); toast('Seeded'); };

els.tabs.forEach(t=> t.addEventListener('click', ()=>{
  els.tabs.forEach(x=>x.classList.remove('active'));
  t.classList.add('active'); filter=t.dataset.filter; render();
}));
els.search.addEventListener('input', e=>{ query = e.target.value.toLowerCase(); render(); });

document.addEventListener('keydown', e=>{
  if(e.key==='/'){ e.preventDefault(); els.search.focus(); els.search.select(); }
});

// --- card deck
function ensureDeck(){
  // already in DOM via HTML; just wire handlers
  const card = $('#deckCard');
  card.addEventListener('click', flipNext);
  els.deck.addEventListener('click', e=>{ if(e.target===els.deck) closeDeck(); });
  document.addEventListener('keydown', e=>{
    if(els.deck.style.display!=='flex') return;
    if(e.key==='Escape') closeDeck();
    if(e.key===' ' || e.key==='ArrowRight') flipNext();
    if(e.key==='ArrowLeft') flipPrev();
  });
}

function openDeck(id){
  deckOrder = visible().map(t=>t.id);
  deckIndex = Math.max(0, deckOrder.indexOf(id));
  els.deck.style.display='flex';
  renderDeckFaces();
}
function closeDeck(){ els.deck.style.display='none'; els.deckInner.style.transform='rotateY(0deg)'; }

let flipping=false;
function flipNext(){
  if(flipping) return; flipping=true;
  els.deckInner.style.transform='rotateY(180deg)';
  setTimeout(()=>{ deckIndex=(deckIndex+1)%deckOrder.length; renderDeckFaces(); els.deckInner.style.transform='rotateY(0deg)'; setTimeout(()=>flipping=false,610); },610);
}
function flipPrev(){
  if(flipping) return; flipping=true;
  els.deckInner.style.transform='rotateY(-180deg)';
  setTimeout(()=>{ deckIndex=(deckIndex-1+deckOrder.length)%deckOrder.length; renderDeckFaces(); els.deckInner.style.transform='rotateY(0deg)'; setTimeout(()=>flipping=false,610); },610);
}

function renderDeckFaces(){
  const cur = tasks.find(t=>t.id===deckOrder[deckIndex]);
  const nxt = tasks.find(t=>t.id===deckOrder[(deckIndex+1)%deckOrder.length]);
  els.cardFront.innerHTML = cardHTML(cur,'Task');
  els.cardBack.innerHTML  = cardHTML(nxt,'Next');
}
function cardHTML(t, title){
  if(!t) return `<div class="deckTitle">Empty</div>`;
  return `
    <div class="deckTitle">${esc(title)}</div>
    <div class="deckBody">
      <div style="font-weight:800;font-size:1.2rem;margin-bottom:6px">${esc(t.name)} ${t.done?'✅':''}</div>
      <div>${esc(t.desc||'')}</div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <span class="pill pri-${t.priority}">${t.priority}</span>
        <span class="pill">${t.category?('#'+esc(t.category)):'#general'}</span>
        <span class="pill">${fmt(t.due)}</span>
      </div>
    </div>
    <div class="deckFooter">
      <button class="btn small ${t.done?'bad':'good'}" onclick="toggleFromDeck('${t.id}');event.stopPropagation();">
        ${t.done?'Mark Pending':'Mark Done'}
      </button>
      <span class="tDesc">${t.done?'Completed':'Active'}</span>
    </div>
  `;
}
window.toggleFromDeck = function(id){
  const t = tasks.find(x=>x.id===id); if(!t) return;
  t.done=!t.done; if(t.done) t.completedAt=Date.now();
  save(); render(); renderDeckFaces();
};

// --- theme + icon
(function init(){
  load(); render(); ensureDeck();

  // default due = +1h (local)
  const d=new Date(Date.now()+3600e3);
  $('#due').value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);

  // Halloween toggle persistence
  const K='todo.theme.halloween';
  const saved = localStorage.getItem(K)==='1';
  if(saved){ document.documentElement.classList.add('halloween'); els.halloween.checked=true; }
  els.halloween.onchange = ()=>{
    const on = els.halloween.checked;
    document.documentElement.classList.toggle('halloween', on);
    localStorage.setItem(K, on?'1':'0');
  };

  // Icon download (also serves as favicon file if you save it as icon.svg)
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7e0b22"/><stop offset=".5" stop-color="#d21e3c"/><stop offset="1" stop-color="#ff6b88"/>
    </linearGradient>
  </defs>
  <rect x="64" y="64" width="896" height="896" rx="180" fill="#0c0f16"/>
  <rect x="64" y="64" width="896" height="896" rx="180" fill="none" stroke="url(#g)" stroke-width="10" opacity=".9"/>
  <path d="M64,280 Q160,340 256,280 T448,280 T640,280 T832,280 T960,280 L960,960 H64Z" fill="url(#g)" opacity=".25"/>
  <g fill="url(#g)">
    <path d="M340 330h170c86 0 134 43 134 104 0 49-33 85-83 98 60 13 96 52 96 110 0 76-59 137-170 137H340V330z"/>
  </g>
</svg>`;
  els.iconLink.href = URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
})();

