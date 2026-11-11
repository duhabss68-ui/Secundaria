/* ===== 99_sin_clases.js — «No hubo clases» (CTE, suspensión, festivo u otro) =====
   · Se marca solo en el grupo actual: state.noClasses['idGrupo|AAAA-MM-DD'] = {motivo, texto, lista, at}.
   · Si ya había lista ese día, se guarda tal cual dentro del registro (lista) y sale de state.attendance:
     así ese día no cuenta como falta en porcentajes, historial, alertas, ficha ni portal de familias.
   · «↩ Quitar «sin clases»» regresa la lista igual que estaba.
   · Todo son declaraciones de función: normalizeState las usa al cargar, antes de que corra este bloque. */
function scMotivos(){return {
  cte:{ico:'🏫',label:'CTE (Consejo Técnico Escolar)',corto:'CTE',leyenda:'CTE'},
  suspension:{ico:'⛔',label:'Suspensión de clases',corto:'Suspensión',leyenda:'SUSPENSIÓN DE CLASES'},
  festivo:{ico:'🎉',label:'Día festivo',corto:'Festivo',leyenda:'DÍA FESTIVO'},
  otro:{ico:'📝',label:'Otro',corto:'Otro',leyenda:''}}}
function scNormalize(raw,gOk,attendance){
  const out={},M=scMotivos();if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
  for(const [k,v] of Object.entries(raw)){
    const [g,d,...r]=String(k).split('|');if(r.length||!gOk(g)||!DATE_RE.test(d||'')||!v||typeof v!=='object')continue;
    const motivo=M[v.motivo]?v.motivo:'otro',texto=String(v.texto==null?'':v.texto).trim().slice(0,80);
    let lista=null;
    if(v.lista&&typeof v.lista==='object'&&!Array.isArray(v.lista)){lista={};for(const [sid,st] of Object.entries(v.lista))if(typeof sid==='string'&&ID_RE.test(sid)&&ATT_CODES.includes(st))lista[sid]=st}
    out[k]={motivo,texto:motivo==='otro'?(texto||'Sin clases'):texto,lista,at:Number(v.at)||0};
    if(attendance&&attendance[k]){if(!lista)out[k].lista=attendance[k];delete attendance[k]}   /* un día sin clases nunca tiene lista activa */
  }
  return out;
}
function scGet(g,d){return g&&state.noClasses?state.noClasses[attKey(g,d)]||null:null}
function scLabel(x){const m=scMotivos()[x.motivo]||scMotivos().otro;return x.motivo==='otro'?x.texto:m.label}
function scLeyenda(x){const m=scMotivos()[x.motivo];return (x.motivo==='otro'||!m?x.texto:m.leyenda).toUpperCase()}
function scIcon(x){return (scMotivos()[x.motivo]||scMotivos().otro).ico}

function openSinClases(){
  const g=group();if(!g)return warn('Primero elige un grupo.');
  if(scGet(g,currentDate))return warn('Ese día ya está marcado como «sin clases».');
  const rec=state.attendance[attKey(g,currentDate)],M=scMotivos();
  openModal(`<h2>🚫 No hubo clases</h2>
  <p class="helper"><b>${esc(g.name)}</b> · ${esc(fmtIso(currentDate))}. Solo se marca en este grupo. Ese día no contará como falta para nadie.${rec?' <b>Ya habías pasado lista:</b> se guarda aparte y regresa si quitas «sin clases».':''}</p>
  <div class="sc-opts">${['cte','suspension','festivo'].map(k=>`<button class="sc-opt" onclick="applySinClases('${k}')"><span class="sc-ico">${M[k].ico}</span><b>${M[k].label}</b></button>`).join('')}
    <div class="sc-opt sc-otro"><span class="sc-ico">${M.otro.ico}</span><b>Otro</b>
      <input class="field" id="scOtro" maxlength="80" placeholder="Escribe el motivo (ej. Evento cívico)" onkeydown="if(event.key==='Enter'){event.preventDefault();applySinClases('otro')}">
      <button class="primary" onclick="applySinClases('otro')">Marcar con este motivo</button></div></div>
  <div class="actions"><button class="secondary" onclick="closeModal()">Cancelar</button></div>`,{label:'No hubo clases',wide:true});
}
function applySinClases(motivo){
  const g=group();if(!g)return;const M=scMotivos();if(!M[motivo])return;
  let texto='';
  if(motivo==='otro'){const el=document.getElementById('scOtro');texto=(el&&el.value||'').trim().slice(0,80);
    if(!texto){warn('Escribe el motivo para poder marcar «Otro» (por ejemplo, «Evento cívico»).');if(el)el.focus();return}}
  if(!state.noClasses||typeof state.noClasses!=='object')state.noClasses={};
  const k=attKey(g,currentDate),d=currentDate;if(state.noClasses[k])return;
  const lista=state.attendance[k]?copy(state.attendance[k]):null;
  state.noClasses[k]={motivo,texto,lista,at:Date.now()};delete state.attendance[k];
  save();closeModal();render();
  notify(`${fmtIso(d)} quedó como «Sin clases: ${scLabel(state.noClasses[k])}» en ${g.name}.${lista?' La lista de ese día quedó guardada aparte.':''}`,'success',{ms:9000,undo:()=>quitarSinClases(d,g.id)});
}
function quitarSinClases(d,gid){
  const g=gid?state.groups.find(x=>x.id===gid):group();d=d||currentDate;if(!g)return;
  const k=attKey(g,d),x=state.noClasses[k];if(!x)return;
  if(x.lista&&!state.attendance[k])state.attendance[k]=copy(x.lista);
  delete state.noClasses[k];save();render();
  notify(`Se quitó «sin clases» del ${fmtIso(d)} en ${g.name}.${x.lista?' La lista regresó tal como estaba.':' Ese día vuelve a estar sin lista.'}`,'success',{ms:7000});
}
/* Pasar lista: botón junto a la fecha y, si el día está marcado, una tarjeta en lugar de la lista */
function scDecorarAsistencia(c,g){
  if(!g)return;const sec=c.querySelector('section.panel');if(!sec)return;const x=scGet(g,currentDate),bar=sec.querySelector('.flex');
  if(bar&&!x){const b=document.createElement('button');b.className='secondary sc-btn';b.type='button';b.textContent='🚫 No hubo clases (CTE, suspensión…)';b.onclick=openSinClases;bar.appendChild(b)}
  if(!x)return;
  const chip=bar&&bar.querySelector('.chip');if(chip){chip.className='chip sc-chip';chip.textContent='🚫 Sin clases'}
  sec.querySelectorAll('.att-grid,.save-bar,.status-row').forEach(el=>el.remove());
  [...sec.querySelectorAll(':scope > p.helper')].forEach(el=>el.remove());
  const card=document.createElement('div');card.className='sc-card';
  card.innerHTML=`<div class="sc-card-ico">${scIcon(x)}</div><div><h3>Sin clases: ${esc(scLabel(x))}</h3><p>El ${esc(fmtIso(currentDate))} no hubo clases en <b>${esc(g.name)}</b>. Este día no cuenta como falta para nadie: ni en porcentajes, ni en el historial, ni en las alertas, ni en la ficha del alumno.${x.lista?' La lista que habías pasado está guardada aparte y regresa si quitas «sin clases».':''}</p>
    <div class="actions"><button class="primary" onclick="quitarSinClases()">↩ Quitar «sin clases»</button><button class="secondary" onclick="switchTo('historial')">Ver historial →</button></div></div>`;
  (bar?bar.after(card):sec.prepend(card));
}
{const _va=VIEWS.asistencia;VIEWS.asistencia=function(c,g){_va(c,g);try{scDecorarAsistencia(c,g)}catch(e){}}}
/* Nada puede crear una lista en un día marcado «sin clases» */
{const _er=ensureRecord;ensureRecord=function(g,d){if(scGet(g,d)){warn('Ese día está marcado «Sin clases». Quítalo primero si quieres pasar lista.');return {}}return _er(g,d)}}
/* Historial: sección «Días sin clases: N» (respeta el rango de fechas) */
function scDaysInRange(g,from,to){return Object.keys(state.noClasses||{}).filter(k=>k.startsWith(g.id+'|')).map(k=>k.split('|')[1]).filter(d=>(!from||d>=from)&&(!to||d<=to)).sort()}
{const _vh=VIEWS.historial;VIEWS.historial=function(c,g){_vh(c,g);try{
  if(!g)return;const sec=c.querySelector('section.panel');if(!sec)return;
  const days=scDaysInRange(g,attRange.from,attRange.to),box=document.createElement('div');box.className='sc-hist';
  box.innerHTML=`<h3>🚫 Días sin clases: ${days.length}</h3>${days.length?`<ul>${days.map(d=>{const x=scGet(g,d);return `<li><b>${esc(fmtIso(d))}</b> — ${scIcon(x)} ${esc(scLabel(x))}${x.lista?' <small>(con lista guardada aparte)</small>':''} <button class="mini" onclick="currentDate='${d}';switchTo('asistencia')">Abrir</button></li>`}).join('')}</ul>`:'<p class="helper">No hay días marcados como «sin clases» en estas fechas. Se marcan en Pasar lista con «🚫 No hubo clases».</p>'}`;
  sec.appendChild(box)}catch(e){}}}
