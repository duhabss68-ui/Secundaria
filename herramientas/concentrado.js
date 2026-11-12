/* ===== 99_concentrado.js — otros grupos, colores editables, concentrado por periodo y promedio por rubro ===== */

/* ---------- 1 · Crear la actividad también en otros grupos ---------- */
/* Solo grupos activos que llevan la misma disciplina; solo se pueden marcar si tienen un rubro con el mismo
   nombre (sin importar mayúsculas ni acentos). Cada copia es independiente: no se copian notas ni calificaciones. */
function otrosGruposDe(g,sc){return activeGroups().filter(x=>x.id!==g.id&&scopesForGroup(x).some(s=>s.id===sc))}
function rubroIgualEn(x,sc,nombre){const n=normName(nombre);return rubrosOf(x,sc).items.find(it=>normName(it.name)===n)||null}
function otrosGruposHTML(g,sc){
  const otros=otrosGruposDe(g,sc);if(!otros.length)return '';
  return `<fieldset class="og-box" id="ogBox"><legend>También crearla en <span class="helper">(copias independientes)</span></legend><div class="og-list">${otros.map(x=>
    `<label class="og-item" data-g="${esc(x.id)}"><input type="checkbox" value="${esc(x.id)}" onchange="window.ogMarcados=otrosMarcados()"><span><b>${esc(x.name)}</b><small class="og-note"></small></span></label>`).join('')}</div>
    <p class="helper">Se copia el nombre, cómo se califica, el puntaje, la rúbrica, «cuenta en el promedio», la fecha y el periodo. Las notas y calificaciones son de cada grupo.</p></fieldset>`;
}
function otrosRefresh(){
  const box=document.getElementById('ogBox'),g=group();if(!box||!g)return;
  const sc=scopeId(g),sel=document.getElementById('actType'),val=sel?sel.value:'',R=rubrosOf(g,sc),it=R.items.find(x=>x.id===val);
  const prev=new Set(window.ogMarcados||[]);
  box.querySelectorAll('.og-item').forEach(lab=>{
    const x=state.groups.find(y=>y.id===lab.dataset.g),inp=lab.querySelector('input'),note=lab.querySelector('.og-note');
    let ok=true,msg='';
    if(val==='__new'){ok=false;msg='(el rubro nuevo solo se crea aquí)'}
    else if(!it||!x||!rubroIgualEn(x,sc,it.name)){ok=false;msg='(no tiene ese rubro)'}
    inp.disabled=!ok;inp.checked=ok&&prev.has(lab.dataset.g);lab.classList.toggle('off',!ok);note.textContent=msg;
  });
  window.ogMarcados=otrosMarcados();
}
function otrosMarcados(){return [...document.querySelectorAll('#ogBox .og-item input:checked:not(:disabled)')].map(i=>i.value)}
function copiarActividadA(a,gids){
  const g=state.groups.find(x=>x.id===a.groupId),R=rubrosOf(g,a.scopeId,a.period),it=R.items.find(x=>x.id===a.rubro),hechos=[],faltan=[];
  const pdaTxt=new Map(pdaList(g,a.scopeId).map(p=>[p.id,normName(p.t)]));
  for(const id of gids){
    const x=state.groups.find(y=>y.id===id);if(!x)continue;
    const rx=it&&rubroIgualEn(x,a.scopeId,it.name);if(!rx){faltan.push(x.name);continue}
    const pdx=pdaList(x,a.scopeId),pdas=(a.pdas||[]).map(pid=>{const t=pdaTxt.get(pid);const m=t&&pdx.find(p=>normName(p.t)===t);return m?m.id:null}).filter(Boolean);
    const c={id:gid(),groupId:x.id,name:a.name,date:a.date,max:a.max,type:a.type,scopeId:a.scopeId,period:a.period,archived:false,notes:'',mode:a.mode,counts:a.counts,pdas,rubro:rx.id};
    if(a.rubric){c.rubric=copy(a.rubric);c.rubric.criteria.forEach(cr=>{cr.pda=''});c.rubricFrom=a.rubricFrom}
    state.activities.push(c);hechos.push(x.name);
  }
  return {hechos,faltan};
}
function listaNombres(n){return n.length<2?n.join(''):n.slice(0,-1).join(', ')+' y '+n[n.length-1]}
{const _add=addActivity;addActivity=function(){
  const marcados=otrosMarcados(),antes=state.activities.length;_add();window.ogMarcados=[];
  const a=state.activities.length>antes?state.activities[state.activities.length-1]:null;if(!a||!marcados.length)return;
  const r=copiarActividadA(a,marcados);save();render();
  if(r.hechos.length)notify(`«${a.name}» también quedó en ${listaNombres(r.hechos)}.`,'success',{ms:8000});
  if(r.faltan.length)warn(`No se creó en ${listaNombres(r.faltan)}: ese grupo no tiene el rubro.`);
}}
{const _af=afRubro;afRubro=function(p){_af(p);if(p==='act')otrosRefresh()}}

/* ---------- 2 · Colores de las calificaciones (rangos editables) ---------- */
function normColorRanges(c){
  const v=c&&typeof c==='object'?Number(c.verde):NaN,a=c&&typeof c==='object'?Number(c.amarillo):NaN;
  if(Number.isFinite(v)&&Number.isFinite(a)&&v>=0&&v<=10&&a>=0&&a<=10&&a<=v)return {verde:round2(v),amarillo:round2(a)};
  return {verde:8,amarillo:6};
}
function colorVerde(){const c=state&&state.settings&&state.settings.colorRanges;return c?c.verde:8}
function colorAmarillo(){const c=state&&state.settings&&state.settings.colorRanges;return c?c.amarillo:6}
function hastaDe(n){return numfmt(Math.max(0,Math.round((n-0.1)*10)/10))}
function colorTextos(){const v=colorVerde(),a=colorAmarillo();
  return {ok:`${numfmt(v)} a 10`,mid:a<v?`${numfmt(a)} a ${hastaDe(v)}`:'—',low:a>0?`Menos de ${numfmt(a)}`:'—'}}
function colorLegendText(){const t=colorTextos();return `${t.ok} · ${t.mid} · ${t.low}`}
function colorLegendSpans(pre){const t=colorTextos(),p=pre||['','',''];
  return `<span class="lg g-ok">${p[0]}${t.ok}</span><span class="lg g-mid">${p[1]}${t.mid}</span><span class="lg g-low">${p[2]}${t.low}</span>`}
function colorRangesHTML(){
  const v=colorVerde(),a=colorAmarillo();
  return `<section class="panel cr-box" id="colores"><h3>🎨 Colores de las calificaciones</h3>
  <p class="helper">Así se pintan las calificaciones en la cuadrícula, los promedios, el cuaderno, el concentrado y las fichas (escala de 0 a 10). Ajústalos para que coincidan con tus niveles de logro.</p>
  <div class="cr-rows">
    <div class="cr-row g-ok"><b>Nivel esperado (verde)</b><span>desde <input class="field cr-in" id="crVerde" type="number" inputmode="decimal" min="0" max="10" step="0.1" value="${v}" oninput="crPreview()"> hasta 10</span></div>
    <div class="cr-row g-mid"><b>En proceso (amarillo)</b><span>desde <input class="field cr-in" id="crAmarillo" type="number" inputmode="decimal" min="0" max="10" step="0.1" value="${a}" oninput="crPreview()"> hasta <b id="crHasta">${hastaDe(v)}</b></span></div>
    <div class="cr-row g-low"><b>Requiere apoyo (rojo)</b><span>menos de <b id="crRojo">${numfmt(a)}</b></span></div>
  </div>
  <p class="helper" id="crMsg"></p>
  <div class="actions"><button class="primary" onclick="guardarColores()">Guardar colores</button><button class="secondary" onclick="restaurarColores()">Volver a 8 y 6</button></div></section>`;
}
function crPreview(){
  const v=Number(document.getElementById('crVerde').value),a=Number(document.getElementById('crAmarillo').value),m=document.getElementById('crMsg');
  if(Number.isFinite(v))document.getElementById('crHasta').textContent=hastaDe(v);
  if(Number.isFinite(a))document.getElementById('crRojo').textContent=numfmt(a);
  m.textContent=crError(v,a)||'';m.classList.toggle('imp-flag',!!crError(v,a));
}
function crError(v,a){
  if(!Number.isFinite(v)||!Number.isFinite(a))return 'Escribe los dos números.';
  if(v<0||v>10||a<0||a>10)return 'Los números deben estar entre 0 y 10.';
  if(a>v)return 'El amarillo no puede empezar más arriba que el verde.';
  return '';
}
function guardarColores(){
  const v=Number(document.getElementById('crVerde').value),a=Number(document.getElementById('crAmarillo').value),e=crError(v,a);
  if(e)return warn(e+' No se guardaron los colores.');
  const prev=copy(state.settings.colorRanges||{verde:8,amarillo:6});
  state.settings.colorRanges={verde:round2(v),amarillo:round2(a)};save();render();
  notify(`Colores guardados: ${colorLegendText()}. La cuadrícula ya se volvió a pintar.`,'success',{ms:8000,undo:()=>{state.settings.colorRanges=prev;save();render()}});
}
function restaurarColores(){
  const prev=copy(state.settings.colorRanges||{verde:8,amarillo:6});
  state.settings.colorRanges={verde:8,amarillo:6};save();render();
  notify('Colores de vuelta a 8 y 6.','success',{undo:()=>{state.settings.colorRanges=prev;save();render()}});
}
function irAColores(){switchTo('niveles');setTimeout(()=>{const el=document.getElementById('colores');if(el)el.scrollIntoView({behavior:'smooth',block:'start'})},60)}
{const _vn=VIEWS.niveles;VIEWS.niveles=function(c,g){_vn(c,g);
  title('CALIFICACIONES','Nivel de logro y colores','Cuánto vale cada nivel y desde qué calificación se pinta verde, amarillo o rojo.');
  c.insertAdjacentHTML('beforeend',colorRangesHTML())}}

/* ---------- 3 · Concentrado por periodo ---------- */
var CONC_COLORES=['#2F5FA7','#B07A2A','#3F8F6B','#8A6BBE','#C2665A','#3C8DAE','#7A6A3C','#5B6B85'];
function concTabs(g){return [['1',periodName(g,'1')],['2',periodName(g,'2')],['3',periodName(g,'3')],['final','Final']]}
function concScopes(g){const all=scopesForGroup(g),f=window.concDisc||'todas';return f==='todas'?all:all.filter(s=>s.id===f)}
function concRubroAvg(g,sc,period,st,itemId){
  const acts=scopedActivities(g,sc,period).filter(a=>countsInAverage(a)&&a.rubro===itemId);if(!acts.length)return null;
  return meanOf(acts.map(a=>gradeOnTen(a,st.id)));
}
function concPeriodAvg(g,sc,period,st){const acts=scopedActivities(g,sc,period);if(!acts.length)return null;const v=averageInScope(g,{id:sc},st,acts);return v===null||v===undefined?null:v}
function concFinal(g,sc,st){const p=['1','2','3'].map(n=>concPeriodAvg(g,sc,n,st));return {p,gen:meanOf(p)}}
/* Columnas de un bloque (disciplina) para la pestaña elegida */
function concColumns(g,sc,tab){
  if(tab==='final')return [...['1','2','3'].map(n=>({label:periodName(g,n),avg:false,val:st=>concPeriodAvg(g,sc,n,st)})),{label:'Promedio general',avg:true,val:st=>concFinal(g,sc,st).gen}];
  const R=rubrosOf(g,sc,tab);
  return [...R.items.map(it=>({label:it.name+(R.pct?` (${numfmt(it.w)} %)`:''),avg:false,val:st=>concRubroAvg(g,sc,tab,st,it.id)})),{label:'Promedio',avg:true,val:st=>concPeriodAvg(g,sc,tab,st)}];
}
function concPill(v){return v===null||v===undefined?'<span class="cc-none">—</span>':`<span class="cc-pill ${gradeClass(v,10)}">${numfmt(round2(v))}</span>`}
VIEWS.concentrado=function(c,g){
  const tab=window.concTab||String(currentPeriod),tabs=g?concTabs(g):[];
  title('CALIFICACIONES','Concentrado','Promedios por '+(g?periodLabel(g).toLowerCase():'periodo')+' y promedio general de cada disciplina. Lo pendiente no cuenta.');
  if(!g){c.innerHTML='<section class="panel"><div class="empty">Elige un grupo para ver su concentrado.</div></section>';return}
  const all=scopesForGroup(g);if(!all.length){c.innerHTML=`<section class="panel">${groupSelect()}<div class="empty">Este grupo todavía no tiene disciplinas.</div></section>`;return}
  if(window.concDisc&&window.concDisc!=='todas'&&!all.some(s=>s.id===window.concDisc))window.concDisc='todas';
  const scopes=concScopes(g),ros=roster(g),blocks=scopes.map((s,i)=>({s,col:CONC_COLORES[all.findIndex(x=>x.id===s.id)%CONC_COLORES.length],cols:concColumns(g,s.id,tab)}));
  const head1=blocks.map(b=>`<th colspan="${b.cols.length}" class="cc-disc" style="--dc:${b.col}">${esc(b.s.name)}</th>`).join('');
  const head2=blocks.map(b=>b.cols.map((x,j)=>`<th class="cc-h${x.avg?' cc-avg':''}${j===0?' cc-start':''}">${esc(x.label)}</th>`).join('')).join('');
  const body=ros.map((st,i)=>`<tr><th class="cc-name"><span class="cc-n">${i+1}</span>${esc(st.name)}</th>${blocks.map(b=>b.cols.map((x,j)=>`<td class="${x.avg?'cc-avg':''}${j===0?' cc-start':''}">${concPill(x.val(st))}</td>`).join('')).join('')}</tr>`).join('');
  const foot=`<tr class="cc-group"><th class="cc-name">Promedio del grupo</th>${blocks.map(b=>b.cols.map((x,j)=>`<td class="${x.avg?'cc-avg':''}${j===0?' cc-start':''}">${concPill(meanOf(ros.map(st=>x.val(st))))}</td>`).join('')).join('')}</tr>`;
  c.innerHTML=`<section class="panel">
    <div class="flex cc-top">${groupSelect()}
      ${all.length>1?`<label class="label-inline">Disciplina <select class="field" onchange="window.concDisc=this.value;render()"><option value="todas">Todas</option>${all.map(s=>`<option value="${esc(s.id)}" ${window.concDisc===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>`:''}
      <button class="primary" onclick="exportConcentrado()">⬇ Excel del concentrado</button><button class="secondary" onclick="switchTo('libreta')">📒 Cuaderno</button></div>
    <div class="seg cc-tabs" role="tablist">${tabs.map(([k,l])=>`<button class="seg-b ${tab===k?'on':''}" role="tab" aria-selected="${tab===k}" onclick="window.concTab='${k}';render()">${esc(l)}</button>`).join('')}</div>
    <p class="helper">${tab==='final'?`Promedio general = promedio de los ${esc(periodLabel(g).toLowerCase())}s que ya tienen calificación. Cada disciplina tiene el suyo; no se promedian disciplinas entre sí.`:`Cada rubro es el promedio del alumno en ese rubro; «Promedio» los combina con sus porcentajes, igual que el cuaderno. «—» = sin actividades calificadas.`} Colores: ${esc(colorLegendText())}.</p>
    ${ros.length?`<div class="cc-wrap"><table class="cc-table"><thead><tr><th class="cc-name cc-corner" rowspan="2">Alumno</th>${head1}</tr><tr>${head2}</tr></thead><tbody>${body}${foot}</tbody></table></div>`:'<div class="empty">Este grupo todavía no tiene alumnos.</div>'}
  </section>`;
};
/* Excel: 4 hojas (periodos y Final); las casillas vacías valen 0 (modo de exportación que siempre se apaga) */
function buildConcentradoSheets(g){
  const all=scopesForGroup(g),ros=roster(g),acc=EDITION_ACCENT[EDITION],DARK=acc.dark.slice(1);
  const S={title:{b:1,sz:16,color:DARK},sub:{i:1,color:'5B6B7A'},note:{i:1,b:1,color:'8A4B12'},name:{b:1,border:1},corner:{b:1,border:1,fill:'EEF2F5',h:'left',v:'center'},
    head:{b:1,border:1,h:'center',wrap:1,fill:'F4F6F9'},headAvg:{b:1,border:1,h:'center',wrap:1,fill:'E3E9F2'},val:{border:1,h:'center',num:'0.00'},avg:{b:1,border:1,h:'center',num:'0.00',fill:'E3E9F2'},
    grpName:{b:1,i:1,border:1,fill:'EEF2F5'},grp:{b:1,i:1,border:1,h:'center',num:'0.00',fill:'EEF2F5'},grpAvg:{b:1,i:1,border:1,h:'center',num:'0.00',fill:'D6DFEC'}};
  return concTabs(g).map(([k,l])=>{
    const blocks=all.map((s,i)=>({s,col:CONC_COLORES[i%CONC_COLORES.length],cols:concColumns(g,s.id,k)}));
    const sh={name:l.slice(0,31),rows:[],heights:{},merges:[],cols:[34],freeze:null,tab:acc.main.slice(1)};
    sh.rows.push([{v:`Concentrado ${l} — ${g.name}`,s:S.title}]);sh.heights[0]=26;
    sh.rows.push([{v:'Las casillas vacías se cuentan como 0. No son calificaciones oficiales.',s:S.note}]);
    sh.rows.push([{v:k==='final'?'Promedio general = promedio de los periodos con calificación. No se promedian disciplinas entre sí.':'Promedio = combinación de los rubros con sus porcentajes, igual que el cuaderno.',s:S.sub}]);
    sh.rows.push([]);
    const r1=sh.rows.length,top=[{v:'Alumno',s:S.corner}],sub=[{v:'',s:S.corner}];let c0=1;
    blocks.forEach(b=>{const fill=b.col.slice(1),tc=textOn(b.col).slice(1);
      b.cols.forEach((x,j)=>{top.push({v:j===0?b.s.name:'',s:{b:1,sz:12,border:1,h:'center',color:tc,fill}});sub.push({v:x.label,s:x.avg?S.headAvg:S.head});sh.cols.push(x.avg?14:13)});
      if(b.cols.length>1)sh.merges.push(`${colName(c0)}${r1+1}:${colName(c0+b.cols.length-1)}${r1+1}`);c0+=b.cols.length});
    sh.rows.push(top);sh.rows.push(sub);sh.merges.push(`A${r1+1}:A${r1+2}`);sh.heights[r1]=22;sh.heights[r1+1]=36;
    ros.forEach(st=>sh.rows.push([{v:st.name,s:S.name},...blocks.flatMap(b=>b.cols.map(x=>{const v=x.val(st);return {v:v===null||v===undefined?null:round2(v),s:x.avg?S.avg:S.val}}))]));
    sh.rows.push([{v:'Promedio del grupo',s:S.grpName},...blocks.flatMap(b=>b.cols.map(x=>{const m=meanOf(ros.map(st=>x.val(st)));return {v:m===null?null:round2(m),s:x.avg?S.grpAvg:S.grp}}))]);
    sh.freeze={x:1,y:r1+2};return sh;
  });
}
function exportConcentrado(){
  const g=group();if(!g)return warn('Elige un grupo.');if(!scopesForGroup(g).length)return warn('Este grupo todavía no tiene disciplinas.');
  let files;
  EXPORT_CEROS=true;
  try{files=xlsxFiles(buildConcentradoSheets(g),new StyleBook(),'Concentrado '+g.name)}
  catch(e){return warn('No se pudo generar el Excel del concentrado ('+(e&&e.message||e)+'). No se descargó nada.')}
  finally{EXPORT_CEROS=false}
  const name='Concentrado_'+safeName(g.name)+'.xlsx';download(name,zipBlob(files));
  notify(`Excel del concentrado listo en Descargas: ${name} (con las casillas vacías contadas como 0).`,'success',{ms:8000});
}
ICON_EMOJI.concentrado='📊';ICON_FOR_VIEW.concentrado='concentrado';NAV_TOP.concentrado='cuadricula';

/* ---------- 4 · Promedio por rubro solo en el Excel del cuaderno ---------- */
function rubroCols(g,scope,acts){
  const sc=scope&&scope.id?scope.id:scope,R=rubrosOf(g,sc);
  return R.items.filter(it=>acts.some(a=>a.rubro===it.id&&countsInAverage(a))).map(it=>({it,acts:acts.filter(a=>a.rubro===it.id&&countsInAverage(a)),
    label:`Promedio ${it.name}${R.pct?` (${numfmt(it.w)} %)`:''} /10`}));
}
function rubroAvgOf(st,x){const v=meanOf(x.acts.map(a=>gradeOnTen(a,st.id)));return v===null?null:round2(v)}
/* Al dibujar Actividades, las casillas de «También crearla en» se ajustan al rubro elegido */
{const _vact=VIEWS.actividades;VIEWS.actividades=function(c,g){_vact(c,g);try{otrosRefresh()}catch(e){}}}
/* Excel del cuaderno con ceros: la casilla vacía de una actividad que cuenta también se ve como 0 (no solo en los promedios) */
{const _ev=exportValue;exportValue=function(a,sid){const v=_ev(a,sid);return EXPORT_CEROS&&countsInAverage(a)&&!hasEvaluation(a,sid)&&(v===null||v===undefined||v==='')?0:v}}
