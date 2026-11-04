/* Revista Pulso · organización de cada página y juegos extra
   (¿Miedo o ansiedad?, memorama de síntomas, sopa de letras).
   Usa las utilidades globales que expone revista.js en window.Pulso. */
(function(){
const P=window.Pulso; if(!P) return;
const {$, $$, esc, confetti, sections, reduce}=P;
const at=el=>{ const r=el.getBoundingClientRect(); return [r.left+r.width/2,r.top+r.height/2]; };

/* ========== 1. Organización: rótulos, "Lo esencial" y "En esta página" ========== */
const ESS={
  p1:['Es una alarma del cuerpo ante algo que <b>podría</b> pasar, no ante lo que está pasando.','En dosis pequeñas <b>ayuda</b> a concentrarse y rendir.','Se vuelve un problema cuando la alarma suena <b>todo el tiempo</b>.'],
  p2:['Se nota en tres lugares: el <b>cuerpo</b>, la <b>mente</b> y lo que <b>haces</b>.','Es normal si tiene una causa clara y <b>se va</b> cuando pasa la situación.','Si dura semanas o te limita, <b>vale la pena consultar</b>.'],
  p3:['Casi nunca hay <b>una sola causa</b>.','Se suman una base personal y las <b>presiones del día a día</b>.','El <b>sueño</b> y la <b>cafeína</b> pesan más de lo que parece.'],
  p4:['Primero se calma el <b>cuerpo</b>, después la mente.','Exhalar más largo de lo que inhalas <b>frena la alarma</b>.','Usar los sentidos te <b>regresa al presente</b>.'],
  p5:['Los hábitos hacen que las crisis lleguen <b>menos seguido</b>.','<b>Dormir</b> y <b>moverse</b> son los que más efecto tienen.','Pedir ayuda también es <b>cuidarse</b>.']
};
sections.forEach((s,si)=>{
  const ess=ESS[s.id]; if(!ess) return;
  const heads=$$('.h-sec',s);
  const items=heads.map((h,j)=>{
    const no=si+'.'+(j+1); h.id=h.id||(s.id+'-b'+(j+1));
    const tag=h.parentElement.querySelector('.tag'); const kind=tag?tag.textContent.split('·')[0].trim():'';
    h.insertAdjacentHTML('afterbegin',`<span class="secno">${no}</span>`);
    return `<button type="button" class="op" data-to="${h.id}"><b>${no}</b>${esc(h.textContent.replace(no,'').trim())}${kind?`<small>${esc(kind)}</small>`:''}</button>`;
  });
  const box=document.createElement('div'); box.className='orga rv';
  box.innerHTML=`<nav class="onpage" aria-label="Para practicar en esta sección"><p class="ess-t">Ahora, a practicar ↓</p><div class="op-row">${items.join('')}</div></nav>`;
  const st=s.querySelector('.story')||s.querySelector('.title-block'); st.after(box);
});
document.addEventListener('click',e=>{
  const b=e.target.closest('.op'); if(!b) return;
  const t=document.getElementById(b.dataset.to); if(!t) return;
  const box=t.closest('.panel')||t; box.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash');
});

/* ========== 2. ¿Miedo o ansiedad? ========== */
const SORT=[
  ['Un perro te viene persiguiendo en la calle.','m','El peligro es real y está enfrente. Eso es miedo: dura lo que dura la amenaza.'],
  ['Llevas una semana pensando en la entrevista de trabajo del jueves.','a','La amenaza está en el futuro y todavía no pasa. Eso es ansiedad.'],
  ['Empieza a temblar y suena la alerta sísmica.','m','Hay una amenaza inmediata. El miedo te hace reaccionar rápido, y eso te protege.'],
  ['Revisas el celular veinte veces esperando una respuesta que todavía no llega.','a','No hay nada que ver todavía. La preocupación es por lo que podría decir.'],
  ['Un carro se te atraviesa y frenas de golpe.','m','Reacción en milisegundos ante un peligro real. Miedo puro.'],
  ['No puedes dormir pensando en si te alcanzará el dinero del mes.','a','Es una preocupación por algo incierto que todavía no pasa. Ansiedad.']
];
const sg=$('#sort'); if(sg){
  let i=0, sc=0;
  const card=$('.sort-card',sg), txt=$('.sort-txt',sg), fb=$('.sort-fb',sg), btns=$('.sort-btns',sg), nx=$('.sort-next',sg), dots=$('.sort-dots',sg);
  dots.innerHTML=SORT.map(()=>'<i></i>').join('');
  const draw=()=>{
    $$('i',dots).forEach((d,k)=>{ d.className=k<i?'done':k===i?'on':''; });
    if(i>=SORT.length){ card.className='sort-card end'; txt.textContent=`${sc} de ${SORT.length}`; fb.hidden=false;
      fb.textContent= sc===SORT.length?'Perfecto. Ya distingues el miedo (presente) de la ansiedad (futuro).':'La clave: el miedo responde a lo que pasa ahora; la ansiedad, a lo que podría pasar.';
      btns.hidden=true; nx.hidden=false; nx.textContent='Jugar otra vez'; if(sc>=5) confetti(...at(card)); return; }
    card.className='sort-card'; txt.textContent=SORT[i][0]; fb.hidden=true; btns.hidden=false; nx.hidden=true;
  };
  btns.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return;
    const ok=b.dataset.a===SORT[i][1]; if(ok) sc++;
    card.className='sort-card '+(ok?'good':'bad')+' '+(SORT[i][1]==='m'?'to-l':'to-r');
    fb.hidden=false; fb.innerHTML=`<b>${ok?'Correcto':'Casi'} · ${SORT[i][1]==='m'?'Miedo':'Ansiedad'}</b>${esc(SORT[i][2])}`;
    btns.hidden=true; nx.hidden=false; nx.textContent=i===SORT.length-1?'Ver resultado':'Siguiente';
  });
  nx.addEventListener('click',()=>{ if(i>=SORT.length){ i=0; sc=0; } else i++; draw(); });
  draw();
}

/* ========== 3. Memorama de síntomas ========== */
const PAIRS=[
  ['Corazón acelerado','Adrenalina'],
  ['Nudo en el estómago','Digestión frenada'],
  ['Despertar a las 3 a. m.','Cortisol alto'],
  ['Mente en blanco','Memoria ocupada'],
  ['Mandíbula tensa','Músculos en alerta'],
  ['Hormigueo en los dedos','Respirar de más']
];
const mg=$('#memo'); if(mg){
  const grid=$('.memo-grid',mg), st=$('.memo-st',mg), info=$('.memo-info',mg);
  let open=[], lock=false, moves=0, found=0;
  const deal=()=>{
    const cards=[]; PAIRS.forEach((p,k)=>{ cards.push({k,t:p[0],s:'síntoma'}); cards.push({k,t:p[1],s:'causa'}); });
    for(let i=cards.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [cards[i],cards[j]]=[cards[j],cards[i]]; }
    grid.innerHTML=cards.map((c,i)=>`<button type="button" class="mc" data-k="${c.k}" aria-label="Carta ${i+1}"><span class="mc-in"><span class="mc-a">?</span><span class="mc-b ${c.s==='causa'?'cause':''}"><small>${c.s}</small>${esc(c.t)}</span></span></button>`).join('');
    open=[]; lock=false; moves=0; found=0; upd(); info.innerHTML='Voltea dos cartas: un <b>síntoma</b> y su <b>causa</b> en el cuerpo.';
  };
  const upd=()=>{ st.textContent=`Parejas: ${found} de ${PAIRS.length} · Intentos: ${moves}`; };
  grid.addEventListener('click',e=>{
    const c=e.target.closest('.mc'); if(!c||lock||c.classList.contains('up')) return;
    c.classList.add('up'); open.push(c);
    if(open.length<2) return;
    moves++; const [a,b]=open; open=[];
    if(a.dataset.k===b.dataset.k){ a.classList.add('ok'); b.classList.add('ok'); found++;
      const p=PAIRS[+a.dataset.k]; info.innerHTML=`<b>${esc(p[0])}</b> ← ${esc(p[1])}`;
      if(found===PAIRS.length){ info.innerHTML=`Completado en ${moves} intentos. Cada síntoma tiene una explicación física: no es que "estés exagerando".`; confetti(...at(grid)); }
    } else { lock=true; setTimeout(()=>{ a.classList.remove('up'); b.classList.remove('up'); lock=false; },950); }
    upd();
  });
  $('.memo-reset',mg).addEventListener('click',deal);
  deal();
}

/* ========== 4. Sopa de letras ========== */
const WORDS=['RESPIRA','CALMA','MENTE','APOYO','TERAPIA','SUEÑO','AMIGDALA'];
const ws=$('#sopa'); if(ws){
  const S=9, gridEl=$('.ws-grid',ws), listEl=$('.ws-list',ws), stEl=$('.ws-st',ws);
  const ABC='ABCDEFGHIJLMNOPRSTUVY';
  function rng(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function build(seed){
    const r=rng(seed), g=Array.from({length:S},()=>Array(S).fill('')), pos={};
    const dirs=[[0,1],[1,0],[1,1],[-1,1]];
    for(const w of WORDS){
      let ok=false;
      for(let t=0;t<300&&!ok;t++){
        const [dr,dc]=dirs[r()*dirs.length|0], r0=r()*S|0, c0=r()*S|0, cells=[];
        for(let k=0;k<w.length;k++){ const rr=r0+dr*k, cc=c0+dc*k; if(rr<0||rr>=S||cc<0||cc>=S||(g[rr][cc]&&g[rr][cc]!==w[k])){ cells.length=0; break; } cells.push([rr,cc]); }
        if(cells.length===w.length){ cells.forEach(([rr,cc],k)=>g[rr][cc]=w[k]); pos[w]=cells; ok=true; }
      }
      if(!ok) return null;
    }
    for(let i=0;i<S;i++) for(let j=0;j<S;j++) if(!g[i][j]) g[i][j]=ABC[r()*ABC.length|0];
    return {g,pos};
  }
  let B=null; for(let sd=7;!B;sd++) B=build(sd);
  const found=new Set(); let first=null;
  gridEl.style.setProperty('--n',S);
  gridEl.innerHTML=B.g.map((row,i)=>row.map((ch,j)=>`<button type="button" class="ws-c" data-r="${i}" data-c="${j}">${ch}</button>`).join('')).join('');
  listEl.innerHTML=WORDS.map(w=>`<li data-w="${w}">${w}</li>`).join('');
  const cell=(r,c)=>gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  const upd=()=>{ stEl.textContent= found.size===WORDS.length?'¡Las encontraste todas!':`Encontradas: ${found.size} de ${WORDS.length}. Toca la primera letra y luego la última.`; };
  gridEl.addEventListener('click',e=>{
    const b=e.target.closest('.ws-c'); if(!b) return;
    const r=+b.dataset.r, c=+b.dataset.c;
    if(!first){ first=[r,c]; b.classList.add('sel'); return; }
    const [r0,c0]=first; cell(r0,c0).classList.remove('sel'); first=null;
    const dr=Math.sign(r-r0), dc=Math.sign(c-c0), len=Math.max(Math.abs(r-r0),Math.abs(c-c0))+1;
    if(!(r-r0===0||c-c0===0||Math.abs(r-r0)===Math.abs(c-c0))){ b.classList.add('miss'); setTimeout(()=>b.classList.remove('miss'),400); return; }
    const path=[]; for(let k=0;k<len;k++) path.push([r0+dr*k,c0+dc*k]);
    const key=p=>p.map(x=>x.join(',')).join('|');
    const hit=WORDS.find(w=>!found.has(w)&&(key(B.pos[w])===key(path)||key(B.pos[w])===key(path.slice().reverse())));
    if(hit){ found.add(hit); const col=found.size%5;
      path.forEach(([a,b2])=>{ const el=cell(a,b2); el.classList.add('found','f'+col); });
      listEl.querySelector(`[data-w="${hit}"]`).classList.add('done');
      if(found.size===WORDS.length) confetti(...at(gridEl),140);
    } else { path.forEach(([a,b2])=>{ const el=cell(a,b2); el.classList.add('miss'); setTimeout(()=>el.classList.remove('miss'),400); }); }
    upd();
  });
  upd();
}
})();
