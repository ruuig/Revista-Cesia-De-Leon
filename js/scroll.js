/* Revista Pulso · navegación entre secciones y animaciones de scroll que se repiten siempre.
   - Botón "Siguiente" al final de cada sección (y "anterior").
   - Todo lo que entra a la pantalla se anima, cada vez que entra.
   - Aviso de cambio de sección y parallax suave. */
(function(){
const P=window.Pulso; if(!P) return;
const {$, $$, esc, sections, reduce}=P;
const N=sections.length;
const accOf=s=>getComputedStyle(s).getPropertyValue('--acc').trim()||'#D4636B';
const ARROW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';

/* ========== 1. Botón a la siguiente sección ========== */
sections.forEach((s,i)=>{
  const last=i===N-1, t=last?0:i+1, ns=sections[t];
  const kicker= last?'Terminaste el N.º 1' : i===0?'Empieza aquí · Subtema 1 de 5' : t===N-1?'Siguiente · Cierre de la revista' : `Siguiente · Subtema ${t} de 5`;
  const title= last?'Volver a la portada':ns.dataset.label;
  const light= t===N-1; // la contraportada usa coral claro: texto oscuro
  const nav=document.createElement('nav'); nav.className='nextsec'; nav.setAttribute('aria-label','Cambiar de sección');
  nav.innerHTML=`<button type="button" class="ns${light?' light':''}" data-go="${t}" style="--nacc:${accOf(ns)}">
      <span class="ns-txt"><span class="ns-k">${kicker}</span><span class="ns-t">${esc(title)}</span></span>
      <span class="ns-arrow" aria-hidden="true">${last?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>':ARROW}</span>
    </button>
    ${i>0?`<button type="button" class="ns-prev" data-go="${i-1}">← Regresar a ${esc(i-1===0?'la portada':sections[i-1].dataset.label)}</button>`:''}`;
  s.querySelector('.pg-in').appendChild(nav);
});

/* ========== 2. Animaciones de scroll (se repiten) ========== */
const BLOCKS='.rv, .nextsec';
const ITEMS=['.beat','.hook','.sticker','.vs > div','.rc','.body > p','.lead','.ess li','.op','.photo','.video','.stat','.help','.habit','.chip','.cmp li','.fcard','.sub','.vlabel','.note','.mc','.dots button','.popt','.sort-card','.kicker','.ws-list li','.letter p','.refs li','.attn','.by .pill','.theme-lbl','.dek'].join(',');
$$(BLOCKS).forEach(el=>el.classList.add('sa'));
$$(ITEMS).forEach(el=>el.classList.add('sa','sa-i'));
/* escalonado entre hermanos */
const groups=new Map();
$$('.sa-i').forEach(el=>{ const p=el.parentElement; const n=groups.get(p)||0; el.style.setProperty('--d',Math.min(n,8)*55+'ms'); groups.set(p,n+1); });

if(!reduce&&'IntersectionObserver' in window){
  /* Se mide contra lo que de verdad desplaza: la pantalla en modo web y la
     propia hoja en modo revista. Para quitar la animación hay que alejarse
     160px; así el empujón de la animación nunca lo saca y no parpadea. */
  const obs=new Map();
  const pair=root=>{ let p=obs.get(root); if(p) return p;
    p={ enter:new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting) en.target.classList.add('in'); }),{root,rootMargin:'0px 0px -6% 0px'}),
        leave:new IntersectionObserver(es=>es.forEach(en=>{ if(!en.isIntersecting) en.target.classList.remove('in'); }),{root,rootMargin:'160px 0px 160px 0px'}) };
    obs.set(root,p); return p; };
  const watch=el=>{ const p=pair(el.closest('.face.front')||null); p.enter.observe(el); p.leave.observe(el); };
  P.rewatch=()=>{ obs.forEach(p=>{ p.enter.disconnect(); p.leave.disconnect(); }); obs.clear(); $$('.sa').forEach(watch); };
  $$('.sa').forEach(watch);
  /* el juego genera contenido nuevo: se observa también */
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{ if(n.nodeType!==1) return;
    [n,...n.querySelectorAll('*')].forEach(el=>{ if(el.matches&&el.matches(ITEMS)&&!el.classList.contains('sa')){ el.classList.add('sa','sa-i'); watch(el); } });
  }))).observe(document.body,{childList:true,subtree:true});
  /* títulos: se vuelven a animar al regresar */
  const tIO=new IntersectionObserver(es=>es.forEach(en=>{ const s=en.target.closest('.pg'); if(!s) return;
    if(en.isIntersecting){ if(!s.classList.contains('play')){ s.classList.add('play'); } }
    else if(!en.target.closest('.leaf')) s.classList.remove('play');
  }),{rootMargin:'0px 0px -10% 0px'});
  $$('.title-block').forEach(t=>tIO.observe(t));
}

/* flipbook: al pasar de página se reinician las animaciones de esa página */
P.onPage=i=>{
  if(reduce) return;
  const s=sections[i]; const els=$$('.sa',s);
  els.forEach(el=>el.classList.remove('in')); void s.offsetWidth;
  const fv=$('#flipview').getBoundingClientRect();
  els.forEach(el=>{ const r=el.getBoundingClientRect(); if(r.top<fv.bottom&&r.bottom>fv.top) el.classList.add('in'); });
};

/* ========== 3. Una sección a la vez, con transición ========== */
let curSec=0, cx='50%', cy='85%';
document.addEventListener('pointerdown',e=>{ cx=e.clientX+'px'; cy=e.clientY+'px'; },{passive:true});
const curtain=document.createElement('div'); curtain.className='curtain'; curtain.hidden=true; curtain.setAttribute('aria-hidden','true');
curtain.innerHTML='<div class="ct-in"><span class="ct-n"></span><span class="ct-k"></span><span class="ct-t"></span></div>';
document.body.appendChild(curtain);
const live=document.createElement('p'); live.className='sr-only'; live.setAttribute('aria-live','polite'); document.body.appendChild(live);
function swap(i){
  sections.forEach((s,k)=>s.classList.toggle('current',k===i)); curSec=i;
  const h=document.documentElement, sb=h.style.scrollBehavior; h.style.scrollBehavior='auto'; window.scrollTo(0,0); h.style.scrollBehavior=sb;
  const s=sections[i]; s.classList.remove('play'); void s.offsetWidth; s.classList.add('play');
  live.textContent=(i===0?'Portada':i===N-1?'Cierre':'Subtema '+i+' de 5')+': '+s.dataset.label;
  window.dispatchEvent(new Event('scroll'));
}
P.cur=()=>curSec;
/* telón de color con el número y el título; cb cambia la página mientras tapa */
P.curtain=(i,cb)=>{
  i=Math.max(0,Math.min(N-1,i));
  if(reduce){ cb(); return; }
  if(!curtain.hidden) return;
  const s=sections[i];
  curtain.style.setProperty('--cacc',accOf(s)); curtain.style.setProperty('--cx',cx); curtain.style.setProperty('--cy',cy);
  curtain.classList.toggle('light',s.id==='fin');
  $('.ct-n',curtain).textContent=i===0?'P':i===N-1?'✦':'0'+i;
  $('.ct-k',curtain).textContent=i===0?'Portada':i===N-1?'Cierre de la revista':'Subtema '+i+' de 5';
  $('.ct-t',curtain).textContent=i===0?'Un respiro para tu mente':s.dataset.label;
  curtain.hidden=false; curtain.classList.remove('close'); void curtain.offsetWidth; curtain.classList.add('open');
  setTimeout(()=>{ cb(); curtain.classList.remove('open'); curtain.classList.add('close'); },950);
  setTimeout(()=>{ curtain.hidden=true; curtain.classList.remove('close'); },1600);
};
P.showSection=(i,instant)=>{
  i=Math.max(0,Math.min(N-1,i));
  if(instant||reduce||P.mode()!=='web'){ swap(i); return; }
  if(i===curSec&&!curtain.hidden) return;
  P.curtain(i,()=>swap(i));
};
document.body.classList.add('paged');
{ const k=sections.findIndex(s=>'#'+s.id===location.hash); swap(k>0?k:0); }

/* ========== 4. Parallax suave (fondos y decoración) ========== */
if(!reduce){
  const layers=$$('.blob, .deco');
  let tick=false;
  const run=()=>{ tick=false; if(P.mode()!=='web') return; const vh=window.innerHeight;
    layers.forEach(l=>{ const s=l.parentElement; const r=s.getBoundingClientRect(); if(r.bottom<0||r.top>vh) return;
      const k=l.classList.contains('blob')?.18:.08; l.style.translate=`0 ${((r.top)*-k).toFixed(1)}px`; });
  };
  window.addEventListener('scroll',()=>{ if(!tick){ tick=true; requestAnimationFrame(run); } },{passive:true});
  run();
}
})();
