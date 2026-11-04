/* Revista Pulso · navegación (web / flipbook), interactivos de cada página, encuesta y animaciones */
(function(){
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Hoja de información ---------- */
const sheet=$('#sheet'), sheetBody=$('#sheet-body');
let lastFocus=null;
function openSheet(html){ lastFocus=document.activeElement; sheetBody.innerHTML=html; sheet.hidden=false; $('.x',sheet).focus(); }
function closeSheet(){ sheet.hidden=true; if(lastFocus&&lastFocus.focus) lastFocus.focus(); }
sheet.addEventListener('click',e=>{ if(e.target.closest('[data-close]')) closeSheet(); const a=e.target.closest('[data-go]'); if(a){e.preventDefault();closeSheet();go(+a.dataset.go);} });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!sheet.hidden) closeSheet(); });
function openTap(el){
  openSheet((el.dataset.img?`<img src="${esc(el.dataset.img)}" alt="">`:'')+`<h3 id="sheet-t">${esc(el.dataset.t)}</h3><p>${esc(el.dataset.d)}</p>${el.dataset.img?'<p class="credit">Foto: Unsplash</p>':''}`);
}
document.addEventListener('click',e=>{ const t=e.target.closest('.tap'); if(t&&!movedRecently) openTap(t); });
document.addEventListener('keydown',e=>{ const t=e.target.closest&&e.target.closest('.tap'); if(t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openTap(t);} });

/* ---------- Secciones y navegación ---------- */
const web=$('#webview'), sections=$$('.pg',web), N=sections.length;
const leavesWrap=$('#leaves'), book=$('#book');
let mode='web', cur=0, leaves=[], movedRecently=false;

const BACKS=[
  ['Solo 1 de cada 4 personas que necesitan atención por ansiedad la recibe.','OMS, 2023'],
  ['La amígdala detecta una amenaza antes de que la parte racional del cerebro termine de analizarla.','Por eso el susto llega primero y la explicación después'],
  ['El GAD-2 tiene solo dos preguntas y se usa en consultorios de todo el mundo como primer filtro.','Kroenke y col., 2007'],
  ['Más de 400 mg de cafeína al día pueden producir síntomas parecidos a la ansiedad.','FDA'],
  ['Exhalar más largo de lo que inhalas activa el sistema nervioso parasimpático, el que frena.','Balban y col., 2023'],
  ['150 minutos de movimiento a la semana. Unos 20 al día.','OMS, 2020'],
  ['Gracias por leer.','Un respiro para tu mente · N.º 1']
];

function go(i){
  i=Math.max(0,Math.min(N-1,i));
  if(mode==='web'){ if(window.Pulso&&window.Pulso.showSection) window.Pulso.showSection(i); else sections[i].scrollIntoView({block:'start'}); }
  else { cur=i; renderBook(); }
}
document.addEventListener('click',e=>{ const a=e.target.closest('[data-go]'); if(a&&!sheet.contains(a)){ e.preventDefault(); go(+a.dataset.go); } });

/* índice */
$('#fab').addEventListener('click',()=>{
  openSheet(`<h3 id="sheet-t">Índice</h3><nav class="toc">`+sections.map((s,i)=>`<a href="#${s.id}" data-go="${i}"><i>${i===0?'P':i===N-1?'C':i}</i>${esc(s.dataset.label)}</a>`).join('')+`</nav>`);
});

/* ---------- Modo ---------- */
function setMode(m){
  if(m===mode) return;
  mode=m; document.body.dataset.mode=m;
  $$('.seg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===m)));
  if(m==='flip'){ cur=currentWebIndex(); buildBook(); window.scrollTo(0,0); maybeTip(); }
  else { sections.forEach(s=>web.appendChild(s)); leavesWrap.innerHTML=''; leaves=[]; requestAnimationFrame(()=>{ if(window.Pulso&&window.Pulso.showSection) window.Pulso.showSection(cur,true); else sections[cur].scrollIntoView({block:'start'}); webLive(); lastSec=-1; onScrollFx(); }); }
  store.set('pulso-mode',m);
  try{ history.replaceState(null,'',m==='flip'?'#revista':'#web'); }catch(e){}
  updateProgress();
}
$$('.seg button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));

function currentWebIndex(){
  if(window.Pulso&&window.Pulso.cur) return window.Pulso.cur();
  let idx=0; const y=window.innerHeight*0.35;
  sections.forEach((s,i)=>{ if(s.getBoundingClientRect().top<=y) idx=i; });
  return idx;
}

/* ---------- Flipbook ---------- */
function buildBook(){
  leavesWrap.innerHTML=''; leaves=[];
  sections.forEach((s,i)=>{
    const leaf=document.createElement('div'); leaf.className='leaf';
    const f=document.createElement('div'); f.className='face front'; f.appendChild(s);
    const b=document.createElement('div'); b.className='face back';
    const bk=BACKS[i]||BACKS[0];
    b.innerHTML=`<div class="bk-top">Un respiro</div><div><p class="bk-fact">${esc(bk[0])}</p><p class="bk-src" style="margin-top:10px">${esc(bk[1])}</p></div><div class="bk-pg">PÁG. ${i+1}</div>`;
    leaf.append(f,b); leavesWrap.appendChild(leaf); leaves.push(leaf);
  });
  $('#pdots').innerHTML=sections.map(()=>'<i></i>').join('');
  layoutBook(); renderBook(true);
}
function layoutBook(){
  const fv=$('#flipview'); const nav=$('.fnav');
  const availH=fv.clientHeight-nav.offsetHeight-26;
  const vw=window.innerWidth; const spread=vw>=980;
  let pw,ph;
  if(spread){ ph=Math.min(availH,880); pw=Math.min((vw-80)/2, ph*0.74, 560); }
  else { pw=Math.min(vw-20,560); ph=Math.min(availH,pw*2.1); }
  book.style.setProperty('--pw',Math.round(pw)+'px'); book.style.setProperty('--ph',Math.round(ph)+'px');
  book.classList.toggle('spread',spread);
}
let zTimer=null, lastCur=0;
function renderBook(instant){
  const moving=new Set(); const a=Math.min(lastCur,cur), b=Math.max(lastCur,cur);
  for(let i=a;i<b;i++) moving.add(i);
  leaves.forEach((l,i)=>{
    if(instant) l.style.transition='none';
    l.classList.toggle('flipped',i<cur);
    l.style.zIndex = moving.has(i)&&!instant ? 500+(cur>lastCur? i : N-i) : (i<cur? i+1 : 2*N-i);
    l.setAttribute('aria-hidden',String(i!==cur));
    l.inert = i!==cur;
  });
  if(instant){ void leavesWrap.offsetWidth; leaves.forEach(l=>l.style.transition=''); }
  else moving.forEach(i=>{ const l=leaves[i]; l.classList.add('turning'); setTimeout(()=>l.classList.remove('turning'),950); });
  pageShown(cur);
  clearTimeout(zTimer);
  zTimer=setTimeout(()=>leaves.forEach((l,i)=>l.style.zIndex=(i<cur? i+1 : 2*N-i)),950);
  lastCur=cur;
  const f=leaves[cur]&&leaves[cur].querySelector('.face.front'); if(f) f.scrollTop=0;
  $('#f-name').textContent=sections[cur].dataset.label;
  $('#f-num').textContent=`Página ${cur+1} de ${N}`;
  $$('#pdots i').forEach((d,i)=>d.classList.toggle('on',i===cur));
  $('#f-prev').disabled=cur===0; $('#f-next').disabled=cur===N-1;
  book.querySelector('.book-empty').style.visibility=cur===0?'visible':'hidden';
  updateProgress();
}
$('#f-prev').addEventListener('click',()=>go(cur-1));
$('#f-next').addEventListener('click',()=>go(cur+1));
document.addEventListener('keydown',e=>{
  if(mode!=='flip'||!sheet.hidden) return;
  if(e.target.matches&&e.target.matches('input')) return;
  if(e.key==='ArrowRight') go(cur+1); if(e.key==='ArrowLeft') go(cur-1);
});
/* deslizar */
let sx=0,sy=0,sOk=false;
book.addEventListener('touchstart',e=>{ const t=e.touches[0]; sx=t.clientX; sy=t.clientY; sOk=!e.target.closest('[data-noswipe]'); },{passive:true});
book.addEventListener('touchend',e=>{
  if(!sOk) return; const t=e.changedTouches[0]; const dx=t.clientX-sx, dy=t.clientY-sy;
  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5){ movedRecently=true; setTimeout(()=>movedRecently=false,350); dx<0?go(cur+1):go(cur-1); }
},{passive:true});
window.addEventListener('resize',()=>{ if(mode==='flip') layoutBook(); });
function maybeTip(){
  if(store.get('pulso-tip')) return; store.set('pulso-tip','1');
  const t=document.createElement('div'); t.className='swipe-tip';
  t.innerHTML=window.innerWidth<980?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M19 12H5M9 8l-4 4 4 4"/></svg>Desliza para pasar la página':'Usa las flechas o el teclado ← →';
  $('#flipview').appendChild(t); setTimeout(()=>t.remove(),3600);
}

/* ---------- Progreso y aparición ---------- */
function updateProgress(){
  let p;
  if(mode==='flip') p=cur/(N-1);
  else { const h=document.documentElement.scrollHeight-window.innerHeight; p=h>0?window.scrollY/h:0; }
  $('#progress').style.width=(p*100).toFixed(1)+'%';
}
window.addEventListener('scroll',updateProgress,{passive:true});
/* las animaciones de aparición viven en js/scroll.js */

/* =========== P1: mapa del cuerpo =========== */
const BODY=[
  ['Cerebro','La amígdala, una estructura pequeña con forma de almendra, detecta el peligro y da la señal de alarma en milisegundos. Lo hace antes de que la corteza prefrontal, la parte que razona, termine de analizar la situación. Por eso a veces sientes el susto antes de saber por qué.'],
  ['Hombros y mandíbula','Los músculos se tensan para estar listos para huir o defenderse. Si la tensión dura todo el día aparecen el dolor de cuello, la espalda cargada y los dientes apretados sin darte cuenta.'],
  ['Pulmones','La respiración se vuelve rápida y corta. Si sigue así un rato puedes sentir mareo u hormigueo en los dedos, porque estás sacando más dióxido de carbono del normal. No es que te falte aire: estás respirando de más.'],
  ['Corazón','La adrenalina acelera el pulso para mandar más sangre a los músculos. Es la sensación de que el corazón "se te sale". Asusta, pero en una persona sana no es peligroso.'],
  ['Estómago','Para el cuerpo, digerir no es prioridad cuando hay una amenaza, así que la digestión se frena. De ahí vienen el nudo en el estómago, las náuseas y las ganas repentinas de ir al baño antes de algo importante.'],
  ['Manos','La sangre se concentra en los músculos grandes y las manos se enfrían, sudan o tiemblan. Por eso cuesta escribir o sostener algo con firmeza cuando estás muy nerviosa o nervioso.']
];
const mapinfo=$('#mapinfo');
$$('.hot').forEach(h=>h.addEventListener('click',()=>{
  const k=+h.dataset.k; $$('.hot').forEach(x=>x.setAttribute('aria-pressed',String(x===h)));
  mapinfo.innerHTML=`<span class="ico">${k+1} de 6</span><h4>${BODY[k][0]}</h4><p>${BODY[k][1]}</p>`;
}));

/* curva */
const cl=$('#curve-line'), cd=$('#curve-dot'), cr=$('#curve-range'), co=$('#curve-out');
const cy=x=>{ const u=(x-110)/100; return 94-72*(1-u*u); };
let pts=[]; for(let x=10;x<=210;x+=4) pts.push(x+','+cy(x).toFixed(1)); cl.setAttribute('points',pts.join(' '));
function upCurve(){
  const v=+cr.value, x=10+v*2; cd.setAttribute('cx',x); cd.setAttribute('cy',cy(x));
  let t,d;
  if(v<28){t='Te da igual';d='Sin nada de activación no hay motivación. Todo se deja para mañana, o para nunca.';}
  else if(v<=68){t='Zona útil';d='Estás alerta y con energía. Esta ansiedad ayuda: te pone en marcha y te mantiene concentrada o concentrado.';}
  else {t='Bloqueo';d='Lees la misma línea cinco veces y nada entra. Pasada cierta intensidad, la ansiedad le quita espacio a la memoria y al razonamiento.';}
  co.innerHTML=`<b>${t}</b>${d}`;
}
cr.addEventListener('input',upCurve); upCurve();

/* =========== P2: tarjetas =========== */
const CARDS=[
  ['cuerpo','"Llevo tres días con el estómago revuelto y no he comido nada raro."','El sistema digestivo es de los primeros en reaccionar al estrés. Náuseas, colitis y falta de apetito son muy comunes en épocas de mucha presión.'],
  ['mente','"¿Y si me quedo en blanco? ¿Y si todos se dan cuenta?"','Los pensamientos que empiezan con "¿y si…?" son típicos de la ansiedad. El cerebro ensaya desastres que no han pasado para "prepararse".'],
  ['conducta','"Mejor no voy a la reunión. Digo que me enfermé."','Evitar alivia en el momento, pero le confirma al cerebro que la situación era peligrosa. La próxima vez cuesta más.'],
  ['cuerpo','"Me desperté a las 3 de la mañana pensando en todo lo pendiente."','Con el cortisol alto cuesta dormir de corrido. Despertarse de madrugada con la cabeza acelerada es una señal muy común.'],
  ['mente','"Leí la página tres veces y no sé qué dice."','La preocupación ocupa la memoria de trabajo, que es justo la que necesitas para concentrarte. No es que seas menos capaz.'],
  ['conducta','"Abrí TikTok cinco minutos y se me fue una hora."','Procrastinar muchas veces no es pereza. Es una manera de escapar del malestar que te genera la tarea.'],
  ['cuerpo','"Me duele la mandíbula y no sé por qué."','Apretar los dientes sin darte cuenta, sobre todo de noche, aparece mucho con la tensión acumulada.']
];
$('#cards').innerHTML=CARDS.map((c,i)=>`<button type="button" class="fcard" aria-pressed="false" aria-label="Tarjeta ${i+1}: ${esc(c[1])}"><div class="in">
  <div class="fa"><span class="cat ${c[0]}">${c[0]}</span><p class="q">${esc(c[1])}</p><span class="turn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5"/></svg>Toca para voltear</span></div>
  <div class="fb"><span class="cat">qué está pasando</span><p>${esc(c[2])}</p><span class="turn" style="color:#D9C6C8">Toca para regresar</span></div>
</div></button>`).join('');
$$('.fcard').forEach(c=>c.addEventListener('click',()=>c.setAttribute('aria-pressed',String(c.getAttribute('aria-pressed')!=='true'))));

/* comparativa */
$$('#cmp-toggle button').forEach(b=>b.addEventListener('click',()=>{
  $$('#cmp-toggle button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  $('#cmp-ok').hidden=b.dataset.v!=='ok'; $('#cmp-alert').hidden=b.dataset.v!=='alert';
}));

/* GAD-2 */
function upGad(){
  const a=$('input[name=g1]:checked'), b=$('input[name=g2]:checked'), r=$('#gad-res');
  if(!a||!b){ r.innerHTML='<b>Responde las dos</b>Tu resultado aparece aquí. Nadie más lo ve.'; r.style.background='var(--mist)'; return; }
  const s=+a.value + +b.value;
  if(s>=3){ r.style.background='var(--blush-l)'; r.innerHTML=`<b>Puntaje: ${s} de 6</b>Un puntaje de 3 o más indica que valdría la pena hablar con un profesional para una evaluación completa. No es un diagnóstico. Es una señal para no dejarlo pasar. En la página 5 hay opciones.`; }
  else { r.style.background='var(--sage-l)'; r.innerHTML=`<b>Puntaje: ${s} de 6</b>Está por debajo del punto de corte. Igual, si algo de lo que leíste te sonó familiar, las herramientas de la página 4 te sirven para los días pesados.`; }
}
$$('#gad input').forEach(i=>i.addEventListener('change',upGad)); upGad();

/* =========== P3: mochila =========== */
const BAG=[['Muchos pendientes a la vez',3],['Demasiado trabajo',3],['Dormir 5 horas',3],['Problemas en casa',3],['Deudas o falta de dinero',3],['Hablar en público',2],['Compararme en redes sociales',2],['No saber qué viene en el futuro',2],['Discutir con alguien cercano',2],['Cuatro cafés al día',2],['Mensajes sin responder',1],['Tráfico de dos horas',1]];
const chips=$('#bag-chips');
chips.innerHTML=BAG.map((b,i)=>`<button type="button" class="chip" aria-pressed="false" data-i="${i}">${esc(b[0])}<span class="w">+${b[1]}</span></button>`).join('');
function upBag(){
  const on=$$('.chip[aria-pressed="true"]',chips); const w=on.reduce((s,c)=>s+BAG[+c.dataset.i][1],0);
  const max=18, p=Math.min(1,w/max);
  $('#bag-meter').style.width=(p*100)+'%';
  const f=$('#bag-fill'); f.setAttribute('height',(104*p).toFixed(1)); f.setAttribute('y',(132-104*p).toFixed(1));
  $('#bag-svg').style.transform=`rotate(${(p*10).toFixed(1)}deg) translateY(${(p*6).toFixed(1)}px)`;
  let m;
  if(w===0) m='Vacía. Empieza a cargarla.';
  else if(w<=4) m='Ligera. Se puede caminar.';
  else if(w<=9) m='Pesa, pero aguanta. Buen momento para soltar algo.';
  else if(w<=14) m='Ya se nota en la espalda. Toca recortar o pedir ayuda.';
  else m='Así nadie camina bien. No es falta de capacidad: es demasiada carga para una sola persona.';
  $('#bag-msg').textContent=m;
}
chips.addEventListener('click',e=>{ const c=e.target.closest('.chip'); if(!c) return; c.setAttribute('aria-pressed',String(c.getAttribute('aria-pressed')!=='true')); upBag(); });
$('#bag-reset').addEventListener('click',()=>{ $$('.chip',chips).forEach(c=>c.setAttribute('aria-pressed','false')); upBag(); });

/* cafés */
const cups=$('#cups'); let nc=0;
cups.innerHTML=[1,2,3,4,5].map(n=>`<button type="button" aria-pressed="false" aria-label="${n} ${n>1?'cafés':'café'}" data-n="${n}">☕</button>`).join('');
cups.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; const n=+b.dataset.n; nc=(nc===n)?n-1:n;
  $$('button',cups).forEach(x=>x.setAttribute('aria-pressed',String(+x.dataset.n<=nc)));
  const mg=nc*95; $('#caf-out').innerHTML=`${mg} mg<small>de cafeína aprox.</small>`;
  $('#caf-msg').textContent = mg===0?'La FDA considera que hasta 400 mg al día es una cantidad que en general no causa problemas en adultos sanos.'
    : mg<=285?'Vas dentro del rango. Ojo con el café después de las 4 de la tarde: la cafeína tarda horas en salir del cuerpo y afecta el sueño.'
    : mg<=400?'Cerca del límite de 400 mg que menciona la FDA. Si ya sientes el pulso rápido, el siguiente que sea agua.'
    : 'Pasaste los 400 mg. A estas dosis la cafeína produce temblor, taquicardia e insomnio, muy parecidos a la ansiedad.';
});

/* =========== P4: respiración =========== */
const BR={
  sigh:{help:'Dos inhalaciones por la nariz (una larga y otra cortita para terminar de llenar los pulmones) y una exhalación lenta por la boca.',
    ph:[['Inhala por la nariz',2,.85],['Un poquito más',1,1],['Exhala lento por la boca',6,.42]]},
  box:{help:'Cuatro tiempos iguales: inhalas, sostienes, exhalas y sostienes. La usan bomberos y deportistas para bajar las revoluciones.',
    ph:[['Inhala',4,1],['Sostén',4,1],['Exhala',4,.42],['Sostén',4,.42]]}
};
let brMode='sigh', brOn=false, brT=null, brTick=null, brRound=0;
const circle=$('#br-circle'), brTxt=$('#br-txt'), brCount=$('#br-count'), brBtn=$('#br-btn');
$$('#br-mode button').forEach(b=>b.addEventListener('click',()=>{
  $$('#br-mode button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  brMode=b.dataset.v; $('#br-help').textContent=BR[brMode].help; stopBr();
}));
function stopBr(){ brOn=false; clearTimeout(brT); clearInterval(brTick); circle.style.transitionDuration='1.2s'; circle.style.transform='scale(.45)'; brTxt.textContent='Listo cuando tú lo estés'; brCount.textContent=''; brBtn.textContent='Empezar'; }
function runPhase(i){
  if(!brOn) return;
  const ph=BR[brMode].ph; if(i>=ph.length){ brRound++; i=0; if(brRound>=6){ stopBr(); brTxt.textContent='Bien hecho. ¿Cómo te sientes?'; return; } }
  const [t,d,s]=ph[i];
  circle.style.transitionDuration=d+'s'; circle.style.transform=`scale(${s})`;
  brTxt.textContent=t; let left=d; brCount.textContent=left;
  clearInterval(brTick); brTick=setInterval(()=>{ left--; if(left>0) brCount.textContent=left; },1000);
  brT=setTimeout(()=>runPhase(i+1),d*1000);
}
brBtn.addEventListener('click',()=>{ if(brOn){ stopBr(); return; } brOn=true; brRound=0; brBtn.textContent='Detener'; runPhase(0); });

/* 5-4-3-2-1 */
const G54=[[5,'cosas que puedes ver','Nómbralas en voz baja y toca un círculo por cada una.'],[4,'cosas que puedes tocar','La mesa, tu ropa, el celular. Fíjate en la textura.'],[3,'sonidos que escuchas','Los de lejos también cuentan: un carro, un ventilador.'],[2,'olores','Si no hueles nada, piensa en dos olores que te gusten.'],[1,'sabor','El último café, la pasta de dientes, lo que sea.']];
let gs=0,gc=0;
function drawG(){
  $$('#g54-steps i').forEach((x,i)=>x.classList.toggle('on',i<gs));
  if(gs>=5){ $('#g54-n').textContent='✓'; $('#g54-t').textContent='De regreso al presente'; $('#g54-h').textContent='La mente tiene que ocuparse en lo que percibe ahora, y eso le quita espacio a la preocupación.'; $('#g54-dots').innerHTML=''; $('#g54-reset').hidden=false; return; }
  const [n,t,h]=G54[gs]; $('#g54-n').textContent=n; $('#g54-t').textContent=t; $('#g54-h').textContent=h; $('#g54-reset').hidden=true;
  $('#g54-dots').innerHTML=Array.from({length:n},(_,i)=>`<button type="button" aria-pressed="${i<gc}" aria-label="${i+1}">${i+1}</button>`).join('');
}
$('#g54-dots').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; gc++; b.setAttribute('aria-pressed','true'); if(gc>=G54[gs][0]){ setTimeout(()=>{gs++;gc=0;drawG();},350);} else drawG(); });
$('#g54-reset').addEventListener('click',()=>{gs=0;gc=0;drawG();});
drawG();

/* pensamientos */
const TH=[
  ['Fallar','Voy a hacerlo mal y todos se van a dar cuenta de que no sirvo.','Es un reto y estoy nerviosa. Si algo sale mal, se puede corregir. Hoy puedo avanzar en una parte y descansar bien.'],
  ['Hablar en público','Me voy a trabar y todos se van a reír de mí.','Puede que me trabe un poco. A casi todos les pasa y casi nadie lo recuerda al día siguiente. Si practico dos veces en voz alta, voy a estar más tranquilo.'],
  ['Mensaje','No me ha contestado. Seguro está enojada conmigo.','Hay muchas razones por las que alguien no contesta: está trabajando, en el bus o se le olvidó. Si mañana sigo con la duda, le pregunto.'],
  ['Futuro','Todos tienen su vida resuelta menos yo.','Estoy comparando mi día a día con lo mejor que otros publican. La mayoría de las personas también está improvisando.']
];
let th=0;
$('#th-chips').innerHTML=TH.map((t,i)=>`<button type="button" class="chip" aria-pressed="${i===0}" data-i="${i}">${t[0]}</button>`).join('');
function drawTh(){ $('#th-q').textContent='"'+TH[th][1]+'"'; $('#th-alt-t').textContent=TH[th][2]; $('#th-alt').hidden=true; $('#th-btn').hidden=false; }
$('#th-chips').addEventListener('click',e=>{ const b=e.target.closest('.chip'); if(!b) return; th=+b.dataset.i; $$('#th-chips .chip').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); drawTh(); });
$('#th-btn').addEventListener('click',()=>{ $('#th-alt').hidden=false; $('#th-btn').hidden=true; });
drawTh();

/* =========== P5: hábitos =========== */
const HAB=[['Dormir entre 7 y 9 horas','Es lo recomendado para adultos jóvenes.'],['Moverme al menos 20 minutos al día','Caminar rápido cuenta.'],['Comer a mis horas','Saltarse comidas baja el azúcar y se siente como ansiedad.'],['No pasar de 3 o 4 cafés','Ni de bebidas energizantes.'],['Dejar el celular un rato antes de dormir','Media hora sin pantalla ayuda a conciliar el sueño.'],['Hablar con alguien de cómo me siento','Aunque sea un mensaje.'],['Tener un rato para algo que disfruto','Sin culpa y sin que tenga que ser productivo.']];
$('#habits').innerHTML=HAB.map((h,i)=>`<button type="button" class="habit" aria-pressed="false" data-i="${i}"><i>✓</i><span><b>${esc(h[0])}</b><small>${esc(h[1])}</small></span></button>`).join('');
$('#habits').addEventListener('click',e=>{ const b=e.target.closest('.habit'); if(!b) return; b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'));
  const n=$$('.habit[aria-pressed="true"]').length; $('#hab-n').textContent=n+'/7';
  $('#hab-msg').textContent= n===0?'Marca tus hábitos para ver el resultado.': n<=2?'Por algo se empieza. Escoge uno más para esta semana, solo uno.': n<=5?'Vas bien. Fíjate cuál de los que faltan te cuesta menos.':'Tu base está muy bien cuidada. Esto también es prevención.';
});

/* mito o realidad */
const MY=[
  ['La ansiedad es falta de carácter.','m','Influyen la genética, la química del cerebro y lo que cada persona ha vivido. Le pasa también a gente muy disciplinada.'],
  ['El ejercicio regular reduce los síntomas de ansiedad.','r','Varios metaanálisis lo respaldan. Incluso caminar con regularidad tiene efecto.'],
  ['En un ataque de pánico lo mejor es respirar dentro de una bolsa de papel.','m','Ya no se recomienda, porque puede bajar demasiado el oxígeno. Es mejor exhalar lento, más largo de lo que inhalas.'],
  ['Evitar lo que te da ansiedad hace que desaparezca.','m','La alivia por un rato y la hace crecer a largo plazo. Enfrentarlo poco a poco es lo que funciona.'],
  ['La terapia cognitivo-conductual es de los tratamientos con más evidencia para la ansiedad.','r','Es uno de los tratamientos recomendados en las guías clínicas para los trastornos de ansiedad.'],
  ['Ir al psicólogo es solo para gente con problemas graves.','m','Es como ir al médico por un dolor que no se quita. No hace falta esperar a estar muy mal.'],
  ['Las bebidas energéticas pueden provocar síntomas parecidos a un ataque de ansiedad.','r','Por la cafeína y otros estimulantes: taquicardia, temblor e inquietud.']
];
let mi=0, ms=0;
function drawMy(){
  const c=$('#my-card');
  if(mi>=MY.length){ c.className='card good'; $('#my-stmt').textContent=`Acertaste ${ms} de ${MY.length}.`; $('#my-v').hidden=true;
    $('#my-exp').hidden=false; $('#my-exp').textContent= ms>=6?'Sabes más de ansiedad que la mayoría.':'Ahora ya sabes las que te faltaban.';
    $('#my-btns').hidden=true; $('#my-next').hidden=false; $('#my-next').textContent='Jugar otra vez'; $('#my-i').textContent='Terminado'; return; }
  c.className='card'; $('#my-stmt').textContent=MY[mi][0]; $('#my-v').hidden=true; $('#my-exp').hidden=true;
  $('#my-btns').hidden=false; $('#my-next').hidden=true; $('#my-i').textContent=`${mi+1} de ${MY.length}`; $('#my-s').textContent=`Aciertos: ${ms}`;
}
$('#my-btns').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return;
  const ok=b.dataset.a===MY[mi][1]; if(ok) ms++;
  const c=$('#my-card'); c.className='card '+(ok?'good':'bad');
  $('#my-v').hidden=false; $('#my-v').textContent=(ok?'Correcto · ':'No · ')+(MY[mi][1]==='m'?'Es un mito':'Es realidad');
  $('#my-exp').hidden=false; $('#my-exp').textContent=MY[mi][2];
  $('#my-btns').hidden=true; $('#my-next').hidden=false; $('#my-next').textContent=mi===MY.length-1?'Ver resultado':'Siguiente'; $('#my-s').textContent=`Aciertos: ${ms}`;
});
$('#my-next').addEventListener('click',()=>{ if(mi>=MY.length){mi=0;ms=0;} else mi++; drawMy(); });
drawMy();

/* encuesta */
const POLL=[['examenes','El trabajo o los estudios'],['dinero','El dinero'],['futuro','El futuro'],['exponer','Hablar en público'],['relaciones','Familia, pareja o amigos'],['redes','Las redes sociales']];
let counts={}, myVote=store.get('pulso-voto'), shared=false, voteFn=null, uid=null;
const popts=$('#poll-opts'), pnote=$('#poll-note');
function drawPoll(){
  const tot=Object.values(counts).reduce((a,b)=>a+b,0);
  popts.innerHTML=POLL.map(([k,l])=>{ const c=counts[k]||0, p=tot?Math.round(c/tot*100):0;
    return `<button type="button" class="popt" data-k="${k}" aria-pressed="${myVote===k}"><span class="barfill" style="width:${myVote?p:0}%"></span><span>${esc(l)}</span><span class="pct">${myVote?p+'%':''}</span></button>`; }).join('');
  if(shared) pnote.textContent = tot? `${tot} ${tot===1?'voto':'votos'} de quienes han abierto la revista.` : 'Todavía no hay votos. Sé la primera persona.';
}
popts.addEventListener('click',async e=>{ const b=e.target.closest('.popt'); if(!b) return; const k=b.dataset.k;
  if(voteFn){ const prev=myVote; myVote=k; store.set('pulso-voto',k); drawPoll();
    try{ await voteFn(k); }catch(err){ shared=false; voteFn=null; localOnly(prev); } }
  else { localOnly(myVote); myVote=k; store.set('pulso-voto',k); counts={}; counts[k]=1; drawPoll(); pnote.textContent='Tu respuesta quedó guardada en este dispositivo.'; }
});
function localOnly(){ counts={}; if(myVote) counts[myVote]=1; drawPoll(); pnote.textContent='Tu respuesta quedó guardada en este dispositivo.'; }
if(myVote){ counts[myVote]=1; }
drawPoll(); pnote.textContent='Escoge una opción para ver los resultados.';
(async()=>{
  try{
    if(!window.claude||!window.claude.use) return;
    const [db,user]=await Promise.all([claude.use('db'),claude.use('user')]);
    if(!db||!user) return;
    uid=await user.id(); if(!uid) return;
    const can=user.can?await user.can('data.write'):null;
    const col=db.collection('votos');
    const timer=setTimeout(()=>{ if(!shared) pnote.textContent='Los resultados están tardando en cargar.'; },10000);
    col.onSnapshot(snap=>{
      clearTimeout(timer); shared=true; counts={};
      snap.docs.forEach(d=>{ const o=d.data()&&d.data().o; if(o) counts[o]=(counts[o]||0)+1; if(d.id===uid&&o){ myVote=o; } });
      drawPoll();
    },()=>{ clearTimeout(timer); shared=false; voteFn=null; });
    if(can!==false) voteFn=k=>col.doc(uid).set({o:k,t:Date.now()});
  }catch(e){}
})();

/* ================= CAPA CREATIVA ================= */
const SEC={
  portada:{deco:'petals',next:'#DCE9EF'},
  p1:{num:'01',tick:['amígdala','adrenalina','alarma','cortisol','anticipación'],deco:'rings',next:'#F5E5D3'},
  p2:{num:'02',tick:['¿y si…?','nudo en el estómago','insomnio','evitar','procrastinar'],deco:'questions',next:'#DCE8DA'},
  p3:{num:'03',tick:['pendientes','dinero','futuro','redes','cafeína','sueño'],deco:'weights',next:'#FFE3E3'},
  p4:{num:'04',tick:['inhala','sostén','exhala','5-4-3-2-1','aquí y ahora'],deco:'bubbles',next:'#F5E5D3'},
  p5:{num:'05',tick:['dormir','moverse','hablar','pedir ayuda','escribir'],deco:'leaves',next:'#3B2A2E'},
  fin:{tick:['gracias por leer','un respiro para tu mente','respira','hasta la próxima'],deco:'sparkles'}
};
const rnd=(a,b)=>a+Math.random()*(b-a);
const COLS=['#F8A3A0','#FDC0C3','#D4636B','#A5C3A3','#F5E5D3','#DCE9EF'];

function splitWords(node,counter){
  [...node.childNodes].forEach(n=>{
    if(n.nodeType===3){
      const frag=document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(p=>{
        if(!p) return;
        if(/^\s+$/.test(p)){ frag.appendChild(document.createTextNode(p)); return; }
        const w=document.createElement('span'); w.className='w';
        const inner=document.createElement('span'); inner.textContent=p; inner.style.setProperty('--i',counter());
        w.appendChild(inner); frag.appendChild(w);
      });
      n.replaceWith(frag);
    } else if(n.nodeType===1) splitWords(n,counter);
  });
}
function buildDeco(d,type){
  const make=(cls,n,fn)=>{ for(let i=0;i<n;i++){ const e=document.createElement('span'); e.className=cls; fn(e,i); d.appendChild(e); } };
  const leafy=(n)=>make('d-l',n,e=>{ const s=rnd(26,58); Object.assign(e.style,{width:s+'px',height:s+'px',left:rnd(0,94)+'%',top:rnd(2,96)+'%',animationDuration:rnd(3.5,6)+'s',animationDelay:-rnd(0,5)+'s'}); });
  if(type==='petals'){ const cv=document.createElement('canvas'); cv.className='d-canvas'; d.appendChild(cv); petals(cv); leafy(5); }
  if(type==='rings') make('d-ring',3,(e,i)=>{ e.style.animationDelay=(-i*1.5)+'s'; });
  if(type==='questions') make('d-q',9,(e,i)=>{ e.textContent=['?','¿y si…?','?','…','¿?','?!','¿y si?','?','…'][i]; Object.assign(e.style,{left:rnd(2,80)+'%',top:rnd(3,95)+'%',fontSize:rnd(28,72)+'px',animationDuration:rnd(5,9)+'s',animationDelay:-rnd(0,8)+'s'}); });
  if(type==='weights') make('d-w',8,(e,i)=>{ const s=rnd(26,70); Object.assign(e.style,{width:s+'px',height:(s*rnd(.7,1))+'px',left:rnd(0,92)+'%',top:rnd(2,96)+'%',animationDuration:rnd(4,7)+'s',animationDelay:-rnd(0,6)+'s',background:['#A5C3A3','#F5E5D3','#4F7552','#FFFAF5'][i%4]}); });
  if(type==='bubbles') make('d-b',7,(e,i)=>{ const s=rnd(80,220); Object.assign(e.style,{width:s+'px',height:s+'px',left:rnd(-10,90)+'%',top:rnd(0,92)+'%',animationDelay:-(i*1.1)+'s'}); });
  if(type==='leaves') leafy(10);
  if(type==='sparkles') make('d-s',16,e=>{ e.textContent='✦'; Object.assign(e.style,{left:rnd(2,95)+'%',top:rnd(2,95)+'%',fontSize:rnd(12,34)+'px',animationDuration:rnd(2,4)+'s',animationDelay:-rnd(0,4)+'s'}); });
}
function petals(cv){
  if(reduce) return;
  const ctx=cv.getContext('2d'); let W=0,H=0,ps=[],run=false,raf=0;
  function size(){ const r=cv.parentElement.getBoundingClientRect(); const dpr=Math.min(2,window.devicePixelRatio||1); W=r.width; H=r.height; cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
  function mk(y){ return {x:rnd(0,W),y:y,r:rnd(6,13),vy:rnd(.35,.9),vx:rnd(-.3,.3),a:rnd(0,6.28),va:rnd(-.02,.02),sw:rnd(0,6.28),c:COLS[Math.random()*4|0]}; }
  function frame(){
    ctx.clearRect(0,0,W,H);
    ps.forEach(p=>{ p.sw+=.02; p.y+=p.vy; p.x+=p.vx+Math.sin(p.sw)*.4; p.a+=p.va; if(p.y>H+20) Object.assign(p,mk(-20));
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a); ctx.scale(1,.55+.45*Math.sin(p.sw)); ctx.fillStyle=p.c; ctx.globalAlpha=.7;
      ctx.beginPath(); ctx.ellipse(0,0,p.r,p.r*.6,0,0,6.283); ctx.fill(); ctx.restore(); });
    if(run) raf=requestAnimationFrame(frame);
  }
  cv._start=()=>{ if(run) return; size(); if(!ps.length) ps=Array.from({length:window.innerWidth<600?16:28},()=>mk(rnd(0,H))); run=true; frame(); };
  cv._stop=()=>{ run=false; cancelAnimationFrame(raf); };
  window.addEventListener('resize',()=>{ if(run) size(); });
}
function badge(parent,cls,text,center){
  const id='bp'+Math.random().toString(36).slice(2,7);
  const b=document.createElement('div'); b.className='badge '+cls; b.setAttribute('aria-hidden','true');
  b.innerHTML=`<svg viewBox="0 0 112 112"><defs><path id="${id}" d="M56,56 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0"/></defs><text><textPath href="#${id}">${esc(text)}</textPath></text></svg><b>${center}</b>`;
  parent.appendChild(b);
}

sections.forEach((s,i)=>{
  const c=SEC[s.id]; if(!c) return;
  const d=document.createElement('div'); d.className='deco'; d.setAttribute('aria-hidden','true'); buildDeco(d,c.deco); s.prepend(d);
  if(c.tick){
    const t=document.createElement('div'); t.className='ticker'+(i%2?' alt':''); t.setAttribute('aria-hidden','true');
    const w=c.tick.concat(c.tick); t.innerHTML='<div class="tk">'+w.concat(w).map(x=>`<span>${esc(x)}</span>`).join('')+'</div>';
    s.insertBefore(t,s.querySelector('.pg-in'));
  }
  const h=s.querySelector('.h-pg');
  if(c.num&&h){ const tb=h.parentElement; tb.classList.add('title-block'); const b=document.createElement('span'); b.className='bignum'; b.textContent=c.num; b.setAttribute('aria-hidden','true'); tb.prepend(b); }
  if(h){ let k=0; splitWords(h,()=>k++); }
  if(c.next){ const w=document.createElement('div'); w.className='wave'; w.setAttribute('aria-hidden','true');
    w.innerHTML=`<svg viewBox="0 0 2880 60" preserveAspectRatio="none"><path fill="${c.next}" d="M0 30 C360 62 360 -2 720 30 C1080 62 1080 -2 1440 30 C1800 62 1800 -2 2160 30 C2520 62 2520 -2 2880 30 V60 H0Z"/></svg>`; s.appendChild(w); }
});
const hw=$('.head-wrap'); if(hw) badge(hw,'b-cover','N.º 1 · noviembre 2026 · respira · ','1');
const brp=$('#breath'); if(brp) badge(brp,'b-p4','inhala · sostén · exhala · sostén · ','~');
const endEl=$('#fin .end'); if(endEl) badge(endEl,'b-fin','gracias por leer · gracias por leer · ','♥');

/* vida: animaciones solo donde se ve */
function setLive(s,on){ s.classList.toggle('live',on); const cv=s.querySelector('.d-canvas'); if(cv&&cv._start){ on?cv._start():cv._stop(); } }
function webLive(){ sections.forEach(s=>{ const r=s.getBoundingClientRect(); setLive(s,r.bottom>-100&&r.top<window.innerHeight+100); }); }
function pageShown(i){
  sections.forEach((s,j)=>setLive(s,j===i));
  const s=sections[i]; s.classList.remove('play'); void s.offsetWidth; s.classList.add('play');
  if(window.Pulso&&window.Pulso.onPage) window.Pulso.onPage(i);
}
if('IntersectionObserver' in window){
  const liveIO=new IntersectionObserver(es=>es.forEach(en=>{ if(mode==='web') setLive(en.target,en.isIntersecting); }),{rootMargin:'100px 0px'});
  sections.forEach(s=>liveIO.observe(s));
  const playIO=new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting&&mode==='web'){ en.target.closest('.pg').classList.add('play'); playIO.unobserve(en.target); } }),{rootMargin:'0px 0px -12% 0px'});
  $$('.title-block').forEach(t=>playIO.observe(t));
} else sections.forEach(s=>{ setLive(s,true); s.classList.add('play'); });
sections[0].classList.add('play');

/* sección actual, parallax */
let lastSec=-1, ticking=false;
const bigs=$$('.bignum');
function onScrollFx(){
  if(mode!=='web') return;
  const i=currentWebIndex();
  if(i!==lastSec){ lastSec=i; const s=sections[i];
    $('#fab-t').textContent=i===0?'Portada':i===N-1?'Final':i+' · '+s.dataset.label;
    const acc=getComputedStyle(s).getPropertyValue('--acc').trim();
    $('#fab').style.background=acc; $('#fab').style.color=s.id==='fin'?'#3B2A2E':'#FFFAF5'; $('#progress').style.background=acc; }
  if(reduce) return;
  const vh=window.innerHeight;
  bigs.forEach(b=>{ const r=b.parentElement.getBoundingClientRect(); if(r.bottom<-300||r.top>vh+300) return; b.style.transform=`translateY(${((r.top-vh*.3)*-.22).toFixed(1)}px)`; });
}
window.addEventListener('scroll',()=>{ if(!ticking){ ticking=true; requestAnimationFrame(()=>{ ticking=false; onScrollFx(); }); } },{passive:true});
onScrollFx();

/* contador del dato */
const statNum=$('.stat .num');
if(statNum&&'IntersectionObserver' in window&&!reduce){
  const io2=new IntersectionObserver(es=>{ if(!es[0].isIntersecting) return; io2.disconnect(); const t0=performance.now();
    const step=t=>{ const p=Math.min(1,(t-t0)/1500); statNum.textContent=Math.round(301*(1-Math.pow(1-p,3)))+' M'; if(p<1) requestAnimationFrame(step); };
    requestAnimationFrame(step); });
  io2.observe(statNum);
}

/* inclinación 3D con el mouse */
if(window.matchMedia&&matchMedia('(hover:hover)').matches&&!reduce){
  $$('.photo,.video').forEach(p=>{
    p.addEventListener('pointermove',e=>{ if(e.pointerType!=='mouse') return; const r=p.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      p.style.transform=`perspective(700px) rotateY(${(x*12).toFixed(1)}deg) rotateX(${(-y*12).toFixed(1)}deg)`; });
    p.addEventListener('pointerleave',()=>{ p.style.transform=''; });
  });
}

/* confeti */
function confetti(x,y,n){
  if(reduce) return; n=n||110;
  const cv=document.createElement('canvas'); cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:200';
  document.body.appendChild(cv); const dpr=Math.min(2,window.devicePixelRatio||1); const W=window.innerWidth,H=window.innerHeight;
  cv.width=W*dpr; cv.height=H*dpr; const c=cv.getContext('2d'); c.scale(dpr,dpr);
  x=x==null?W/2:x; y=y==null?H*.6:y;
  const ps=Array.from({length:n},()=>({x,y,vx:rnd(-8,8),vy:rnd(-14,-5),r:rnd(5,10),a:rnd(0,6),va:rnd(-.3,.3),c:COLS[Math.random()*COLS.length|0],s:Math.random()<.6}));
  let t=0;
  (function f(){ t++; c.clearRect(0,0,W,H);
    ps.forEach(p=>{ p.vy+=.33; p.vx*=.985; p.x+=p.vx; p.y+=p.vy; p.a+=p.va; c.save(); c.translate(p.x,p.y); c.rotate(p.a); c.fillStyle=p.c; c.globalAlpha=Math.max(0,1-t/120);
      if(p.s) c.fillRect(-p.r/2,-p.r/4,p.r,p.r/2); else { c.beginPath(); c.arc(0,0,p.r/2,0,6.283); c.fill(); } c.restore(); });
    if(t<120) requestAnimationFrame(f); else cv.remove(); })();
}
const at=el=>{ const r=el.getBoundingClientRect(); return [r.left+r.width/2,r.top+r.height/2]; };
$('#g54-dots').addEventListener('click',()=>setTimeout(()=>{ if(!$('#g54-reset').hidden) confetti(...at($('#g54'))); },450));
$('#my-next').addEventListener('click',()=>{ if($('#my-i').textContent==='Terminado') confetti(...at($('#my-card'))); });
$('#habits').addEventListener('click',e=>{ if($$('.habit[aria-pressed="true"]').length===7) confetti(...at(e.target.closest('.habit')||$('#habits')),80); });
$('#poll-opts').addEventListener('click',e=>{ if(e.target.closest('.popt')) confetti(e.clientX,e.clientY,45); });
const seenHot=new Set();
$$('.hot').forEach(h=>h.addEventListener('click',()=>{ seenHot.add(h.dataset.k); if(seenHot.size===6){ seenHot.add('done'); confetti(...at(h),60); } }));
new MutationObserver(()=>{ if(brTxt.textContent.indexOf('Bien hecho')===0) confetti(...at(circle)); }).observe(brTxt,{childList:true,characterData:true,subtree:true});

window.Pulso={$,$$,esc,confetti,sections,reduce,mode:()=>mode};
/* ---------- Arranque ---------- */
document.body.dataset.mode='web';
const startMode=location.hash==='#revista'?'flip':(location.hash==='#web'?'web':store.get('pulso-mode'));
if(startMode==='flip'){ setMode('flip'); cur=0; lastCur=0; renderBook(true); }
updateProgress();
})();
