/* ===== 99_rubros_trimestre.js — rubros propios por trimestre (opcional) =====
   · Por omisión cada grupo y disciplina usa los mismos rubros todo el ciclo: state.rubros['idGrupo|idDisciplina'].
   · Si el docente lo pide, el Segundo o el Tercer Trimestre tienen los suyos: state.rubros['idGrupo|idDisciplina|T2'] (o |T3).
     Empiezan como copia del trimestre anterior (mismos ids, así cada actividad conserva su rubro).
   · rubroKey(g,sc,p) devuelve la lista que usa ese trimestre (si no se dice, el trimestre actual), así que guardar,
     agregar un rubro desde Nueva actividad o copiar a otros grupos trabajan sobre la lista de ese trimestre.
   · Todo son declaraciones de función: el resto del programa las usa desde que arranca. */
function periodName(g,n){return ({'1':'Primer','2':'Segundo','3':'Tercer'}[String(n)]||'Primer')+' Trimestre'}
function rubBaseKey(g,sc){return g.id+'|'+sc}
function rubOwnKey(g,sc,p){return rubBaseKey(g,sc)+'|T'+String(p)}
function rubTienePropios(g,sc,p){p=String(p||currentPeriod);return p!=='1'&&!!(state.rubros&&state.rubros[rubOwnKey(g,sc,p)])}
function rubroKey(g,sc,p){p=String(p||currentPeriod);return rubTienePropios(g,sc,p)?rubOwnKey(g,sc,p):rubBaseKey(g,sc)}
function rubrosOf(g,sc,p){return state.rubros[rubroKey(g,sc,p)]||defaultRubros()}
/* ¿La actividad usa la lista guardada en la clave k? */
function rubActEn(a,g,sc,k){return a.groupId===g.id&&a.scopeId===sc&&rubroKey(g,sc,a.period)===k}
/* Cada actividad del trimestre p cuyo rubro ya no está pasa al rubro con el mismo nombre (o al primero). Devuelve cuántas cambiaron. */
function rubReasignar(g,sc,p,oldItems,newItems){
  let n=0;
  state.activities.forEach(a=>{if(a.groupId!==g.id||a.scopeId!==sc||String(a.period||'1')!==String(p))return;if(newItems.some(it=>it.id===a.rubro))return;
    const was=oldItems.find(it=>it.id===a.rubro),hit=(was&&newItems.find(it=>normName(it.name)===normName(was.name)))||newItems[0];a.rubro=hit.id;n++});
  return n;
}
function rubPropiosOn(){
  const g=group();if(!g)return;const sc=scopeId(g),p=String(currentPeriod);
  if(p==='1'||rubTienePropios(g,sc,p))return;
  const d=rubDrafts[rubroKey(g,sc)];if(d&&d.dirty)return warn('Primero guarda o descarta los cambios de los rubros.');
  const prev=String(Number(p)-1),src=rubrosOf(g,sc,prev),old=rubrosOf(g,sc,p).items;
  withUndo(`El ${periodName(g,p)} de ${g.name} · ${scopeName(g,sc)} ya tiene sus propios rubros (copiados del ${periodName(g,prev)}). Cámbialos aquí sin afectar los otros trimestres.`,()=>{
    state.rubros[rubOwnKey(g,sc,p)]=copy(src);delete rubDrafts[rubBaseKey(g,sc)];
    rubReasignar(g,sc,p,old,src.items);
  });
}
function rubPropiosOff(){
  const g=group();if(!g)return;const sc=scopeId(g),p=String(currentPeriod),k=rubOwnKey(g,sc,p);
  if(!rubTienePropios(g,sc,p))return;
  const own=state.rubros[k].items,base=(state.rubros[rubBaseKey(g,sc)]||defaultRubros()).items;
  const mover=state.activities.filter(a=>a.groupId===g.id&&a.scopeId===sc&&String(a.period||'1')===p&&!base.some(it=>it.id===a.rubro)).length;
  openModal(`<h2>Usar los rubros de todo el ciclo</h2><p>El <b>${esc(periodName(g,p))}</b> de ${esc(g.name)} · ${esc(scopeName(g,sc))} dejará de tener rubros propios y usará los de todo el ciclo: ${base.map(it=>'<b>'+esc(it.name)+'</b>').join(', ')}.</p>
  ${mover?`<p>${mover===1?'Hay <b>1</b> actividad':'Hay <b>'+mover+'</b> actividades'} en un rubro que no existe en esa lista; ${mover===1?'pasa':'pasan'} al rubro con el mismo nombre o, si no hay, al primero. Sus calificaciones no cambian.</p>`:'<p>Las actividades de este trimestre conservan su rubro y sus calificaciones.</p>'}
  <div class="actions"><button class="primary" data-autofocus onclick="rubPropiosOffConfirm()">Usar los de todo el ciclo</button><button class="secondary" onclick="closeModal()">Cancelar</button></div>`,{label:'Usar los rubros de todo el ciclo'});
}
function rubPropiosOffConfirm(){
  const g=group();if(!g)return closeModal();const sc=scopeId(g),p=String(currentPeriod),k=rubOwnKey(g,sc,p);if(!state.rubros[k])return closeModal();
  closeModal();
  withUndo(`El ${periodName(g,p)} de ${g.name} · ${scopeName(g,sc)} vuelve a usar los rubros de todo el ciclo.`,()=>{
    const own=state.rubros[k].items;delete state.rubros[k];delete rubDrafts[k];delete rubDrafts[rubBaseKey(g,sc)];
    rubReasignar(g,sc,p,own,(state.rubros[rubBaseKey(g,sc)]||defaultRubros()).items);
  });
}
function rubTrimSet(n){setPeriod(String(n))}
/* ¿Qué trimestres usan la lista de todo el ciclo? */
function rubUsanCiclo(g,sc){return ['1','2','3'].filter(p=>!rubTienePropios(g,sc,p))}
function rubTrimCardHTML(g,sc){
  const p=String(currentPeriod),own=rubTienePropios(g,sc,p),usan=rubUsanCiclo(g,sc),propios=['2','3'].filter(x=>rubTienePropios(g,sc,x));
  const tabs=`<div class="seg rub-trim-tabs" role="tablist" aria-label="Trimestre">${['1','2','3'].map(n=>`<button class="seg-b ${p===n?'on':''}" role="tab" aria-selected="${p===n}" onclick="rubTrimSet('${n}')">${esc(periodName(g,n))}${rubTienePropios(g,sc,n)?' <span class="rt-tag">propios</span>':''}</button>`).join('')}</div>`;
  let txt,btn='';
  if(own){txt=`El <b>${esc(periodName(g,p))}</b> tiene <b>sus propios rubros</b>. Lo que cambies aquí solo afecta a este trimestre.`;
    btn=`<button class="secondary" onclick="rubPropiosOff()">↩ Usar los rubros de todo el ciclo</button>`}
  else{const lista=usan.map(n=>periodName(g,n));
    txt=`Estos son los rubros <b>de todo el ciclo</b>${propios.length?` (los usan: ${esc(lista.join(', '))})`:''}. Lo que cambies aquí aplica a ${usan.length===3?'los tres trimestres':esc(lista.join(' y '))}.`;
    if(p!=='1')btn=`<button class="secondary" onclick="rubPropiosOn()">✏️ Que el ${esc(periodName(g,p))} tenga sus propios rubros</button>`;
    else txt+=` <span class="helper">Si un trimestre necesita otros rubros, elígelo arriba.</span>`}
  return `<div class="rub-trim${own?' own':''}">${tabs}<p>${txt}</p>${btn?`<div class="actions">${btn}${p!=='1'&&!own?`<span class="helper">Empieza como copia del ${esc(periodName(g,String(Number(p)-1)))}; después agregas, quitas o cambias porcentajes. Es opcional.</span>`:''}</div>`:''}</div>`;
}
{const _vr=VIEWS.rubros;VIEWS.rubros=function(c,g){_vr(c,g);try{
  if(!g)return;const sc=scopeId(g),ctl=c.querySelector('section.panel .scope-controls');if(!ctl)return;
  ctl.insertAdjacentHTML('afterend',rubTrimCardHTML(g,sc));
  const own=rubTienePropios(g,sc),b=c.querySelector('section.panel .actions button.primary[onclick="rubSave()"]');
  if(b)b.textContent=`Guardar rubros de ${scopeName(g,sc)} · ${own?periodName(g,currentPeriod):'todo el ciclo'}`;
  const cp=c.querySelector('.copy-targets');if(cp&&String(currentPeriod)!=='1'&&own){const h=cp.previousElementSibling;if(h&&h.classList.contains('helper'))h.insertAdjacentHTML('beforeend',` <b>Se copian como rubros propios del ${esc(periodName(g,currentPeriod))}</b> en cada grupo marcado; sus otros trimestres no cambian.`)}
}catch(e){}}}
/* Opciones del cuaderno: el resumen dice si el trimestre actual tiene rubros propios */
{const _vo=VIEWS.opciones;VIEWS.opciones=function(c,g){_vo(c,g);try{
  if(!g)return;const ul=c.querySelector('.opt-sum');if(!ul)return;const n=scopesForGroup(g).filter(sc=>rubTienePropios(g,sc.id)).length;
  if(n)ul.insertAdjacentHTML('beforeend',`<li>${esc(periodName(g,currentPeriod))}: ${n===1?'1 disciplina con rubros propios':n+' disciplinas con rubros propios'}</li>`);
}catch(e){}}}
/* Copiar a otros grupos: si la lista de origen es propia del trimestre, se copia como propia del mismo trimestre */
function rubKeyDestino(x,t){const p=String(currentPeriod);return rubTienePropios(x.g,x.sc,p)?rubOwnKey(t.g,t.sc,p):rubroKey(t.g,t.sc,p)}
