
/* ===== 99_portal_familias.js — Portal de familias (Más › Portal de familias) =====
   · La app sigue funcionando sin internet. Con conexión, «Publicar ahora» manda a tu Google Sheets
     un resumen de los grupos elegidos: actividades de las últimas semanas (entregó / pendiente /
     no entregó, calificación y nivel de logro; la calificación se puede apagar), anuncios, notas y,
     si lo eliges, el PROMEDIO de los trimestres ya cerrados (el mismo que calcula el Concentrado).
   · Cada padre entra a familias.html con el código de su hijo (tarjeta con QR) y ve SOLO lo de su hijo.
   · La configuración (dirección del script, clave, anuncios, notas y códigos) se guarda aparte,
     NO va en las copias de seguridad: así una copia enviada por WhatsApp nunca lleva tu clave.
   · Reglas de estado: casilla vacía = Pendiente · «✗ No entregó» o un 0 escrito = No entregó ·
     cualquier otra evaluación = Entregó («½ Incompleto» se avisa como comentario). */
const PF_KEY=KEY+'_familias';
const PF_TIPOS=['Aviso','Tarea','Material','Evento','Reunión'];
let pfNotaGrupo='',pfBusy=false,pfAnEdit=null;
function pfCfg(){
  let c={};try{c=JSON.parse(localStorage.getItem(PF_KEY)||'{}')||{}}catch(e){}
  return {url:c.url||'',clave:c.clave||'',portal:c.portal||'',grupos:Array.isArray(c.grupos)?c.grupos:[],semanas:[2,4,6,8].includes(c.semanas)?c.semanas:4,
    nivel:c.nivel!==false,calif:c.calif!==false,anuncios:Array.isArray(c.anuncios)?c.anuncios:[],notas:c.notas&&typeof c.notas==='object'?c.notas:{},
    trims:Array.isArray(c.trims)?c.trims.filter(t=>['1','2','3'].includes(String(t))).map(String):[],
    codigos:c.codigos&&typeof c.codigos==='object'?c.codigos:{},ultima:c.ultima||'',probado:c.probado||''};
}
function pfSave(c){try{localStorage.setItem(PF_KEY,JSON.stringify(c));return true}catch(e){warn('No se pudo guardar la configuración del portal en este navegador.');return false}}
function pfSet(k,v){const c=pfCfg();c[k]=v;pfSave(c)}
function pfPortal(c){
  if(c.portal)return c.portal.split('#')[0].split('?')[0];
  try{return new URL('familias.html',location.href).href.split('?')[0]}catch(e){return 'familias.html'}
}
function pfListo(c){return /^https:\/\/script\.google(usercontent)?\.com\/.+/.test(c.url)&&c.clave.length>=8}
function pfShift(iso,dias){const [y,m,d]=iso.split('-').map(Number);const x=new Date(y,m-1,d+dias);return x.toLocaleDateString('en-CA')}
function pfNid(){return 'an'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}

/* ---------- Promedio del trimestre (mismo cálculo que el Concentrado: rubros y porcentajes del trimestre) ---------- */
function pfPromediosDe(g,st,trims){
  const out=[];
  for(const p of trims){
    for(const sc of scopesForGroup(g)){
      const v=concPeriodAvg(g,sc.id,p,st);if(v===null||v===undefined||!isFinite(v))continue;
      const R=rubrosOf(g,sc.id,p);
      const rubros=R.items.map(it=>{const x=concRubroAvg(g,sc.id,p,st,it.id);return x===null||x===undefined?null:{n:it.name,w:R.pct?Number(it.w)||0:null,v:round2(x)}}).filter(Boolean);
      out.push({alumno_id:st.id,periodo:p,titulo:periodName(g,p),disciplina:scopeName(g,sc.id)||sc.name||'',promedio:round2(v),
        rubros:JSON.stringify(rubros),verde:colorVerde(),amarillo:colorAmarillo()});
    }
  }
  return out;
}
function pfToggleTrim(p,on){const c=pfCfg();c.trims=c.trims.filter(x=>x!==p);if(on)c.trims.push(p);c.trims.sort();pfSave(c);render()}

/* ---------- Qué se publica ---------- */
/* Calificación como la ve el docente: «8.5 / 10». Solo número y rúbrica (en icono y nivel ya se ve el estado o el nivel). */
function pfCalif(a,sid){
  if(a.mode!=='num'&&a.mode!=='rubric')return '';
  const v=scoreOf(a,sid);if(v===undefined||v===null||!isFinite(v))return '';
  return numfmt(round2(v))+' / '+numfmt(a.max);
}
function pfEstado(a,sid,conNivel,conCalif){
  const k=a.id+'|'+sid;
  if(!hasEvaluation(a,sid))return {estado:'pendiente',nivel:'',comentario:'',calificacion:''};
  if(a.mode==='icon'){
    if(state.marks[k]==='NO')return {estado:'no_entregado',nivel:'',comentario:'',calificacion:''};
    return {estado:'entregado',nivel:'',comentario:state.marks[k]==='MID'?'Entregó incompleto':'',calificacion:''};
  }
  if(a.mode==='num'&&Number(state.grades[k])===0)return {estado:'no_entregado',nivel:'',comentario:'',calificacion:conCalif?pfCalif(a,sid):''};
  let nivel='';
  if(conNivel){
    if(a.mode==='level'){const m=LEVEL_MARKS.find(x=>x.c===state.marks[k]);nivel=m?m.name:''}
    else{const m=levelOfTen(gradeOnTen(a,sid));nivel=m?m.name:''}
  }
  return {estado:'entregado',nivel,comentario:'',calificacion:conCalif?pfCalif(a,sid):''};
}
function pfGruposElegidos(c){return activeGroups().filter(g=>c.grupos.includes(g.id))}
function pfPaquete(){
  const c=pfCfg(),gs=pfGruposElegidos(c),hoy=todayISO(),desde=pfShift(hoy,-7*c.semanas),hasta=pfShift(hoy,7);
  const alumnos=[],actividades=[],notas=[],promedios=[];
  for(const g of gs){
    const ros=roster(g);
    const acts=liveActivities().filter(a=>a.groupId===g.id&&a.scopeId&&a.mode!=='text'&&a.date>=desde&&a.date<=hasta);
    for(const st of ros){
      alumnos.push({id:st.id,grupo:g.name,nombre:st.name});
      const n=c.notas[st.id];if(n&&n.t&&n.t.trim())notas.push({alumno_id:st.id,nota:n.t.trim(),fecha:n.f||hoy});
      for(const a of acts){
        const e=pfEstado(a,st.id,c.nivel,c.calif);
        actividades.push({alumno_id:st.id,fecha:a.date,actividad:a.name,tipo:scopeName(g,a.scopeId)||a.type||'',estado:e.estado,calificacion:e.calificacion,nivel:e.nivel,comentario:e.comentario});
      }
      promedios.push(...pfPromediosDe(g,st,c.trims));
    }
  }
  const nombreDe=id=>{const g=gs.find(x=>x.id===id);return g?g.name:''};
  const anuncios=c.anuncios.filter(an=>an.grupo==='TODOS'||nombreDe(an.grupo)).map(an=>({
    grupo:an.grupo==='TODOS'?'TODOS':nombreDe(an.grupo),fecha:an.fecha||hoy,tipo:an.tipo||'Aviso',titulo:an.titulo||'',texto:an.texto||'',vigente_hasta:an.hasta||''}));
  return {accion:'publicar',clave:c.clave,grupos:gs.map(g=>g.name),alumnos,actividades,anuncios,notas,promedios,reemplazarTodos:true};
}

/* ---------- Conexión con Google Sheets ---------- */
async function pfPost(body){
  const c=pfCfg();
  const r=await fetch(c.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),redirect:'follow'});
  const t=await r.text();let d;
  try{d=JSON.parse(t)}catch(e){throw new Error('La dirección no respondió como el script. Revisa que sea la URL que termina en /exec y que el acceso sea «Cualquier usuario».')}
  if(!d.ok)throw new Error(d.error||'El script no aceptó la publicación.');
  return d;
}
async function pfProbar(){
  pfLeerConexion();const c=pfCfg();
  if(!pfListo(c))return warn('Falta la dirección del script (la que termina en /exec) o la clave.');
  if(navigator.onLine===false)return warn('Sin internet no se puede probar la conexión.');
  try{await pfPost({accion:'probar',clave:c.clave});c.probado=new Date().toISOString();pfSave(c);notify('Conexión correcta con tu hoja de Google.','success');render()}
  catch(e){warn('No se pudo conectar: '+(e&&e.message||e))}
}
async function pfPublicar(){
  if(pfBusy)return;const c=pfCfg();
  if(!pfListo(c))return warn('Primero configura la conexión (abajo, en «Conexión con Google Sheets»).');
  if(!pfGruposElegidos(c).length)return warn('Elige al menos un grupo para publicar.');
  if(navigator.onLine===false)return warn('Sin internet no se puede publicar. Tus datos siguen guardados; publica cuando tengas conexión.');
  const p=pfPaquete();pfBusy=true;render();
  try{
    const d=await pfPost(p);const c2=pfCfg();
    (d.codigos||[]).forEach(x=>{c2.codigos[x.id]=x.codigo});
    c2.ultima=new Date().toISOString();pfSave(c2);
    const nuevos=p.alumnos.filter(a=>!c.codigos[a.id]).length;
    notify('Publicado: '+p.alumnos.length+' alumnos de '+p.grupos.join(', ')+'.'+(nuevos?' Se crearon '+nuevos+' códigos nuevos: imprime sus tarjetas.':''),'success',{ms:9000});
  }catch(e){warn('No se pudo publicar: '+(e&&e.message||e))}
  finally{pfBusy=false;render()}
}
function pfLeerConexion(){
  const c=pfCfg(),v=id=>(document.getElementById(id)?.value||'').trim();
  if(document.getElementById('pf_url')){c.url=v('pf_url');c.clave=v('pf_clave');c.portal=v('pf_portal')}
  pfSave(c);
}
function pfToggleGrupo(id,on){const c=pfCfg();c.grupos=c.grupos.filter(x=>x!==id);if(on)c.grupos.push(id);pfSave(c);render()}

/* ---------- Anuncios ---------- */
function pfAnuncioForm(an){
  const c=pfCfg(),gs=activeGroups(),a=an||{grupo:'TODOS',tipo:'Aviso',titulo:'',texto:'',hasta:''};
  pfAnEdit=an?an.id:null;
  openModal(`<h2>${an?'Editar anuncio':'📢 Nuevo anuncio'}</h2>
  <p class="helper">Lo verán las familias del grupo elegido la próxima vez que publiques.</p>
  <div class="pf-grid">
    <label>Para<select class="field" id="pfa_grupo"><option value="TODOS" ${a.grupo==='TODOS'?'selected':''}>Todos mis grupos</option>${gs.map(g=>`<option value="${esc(g.id)}" ${a.grupo===g.id?'selected':''}>${esc(g.name)}</option>`).join('')}</select></label>
    <label>Tipo<select class="field" id="pfa_tipo">${PF_TIPOS.map(t=>`<option ${a.tipo===t?'selected':''}>${t}</option>`).join('')}</select></label>
  </div>
  <label>Título<input class="field" id="pfa_titulo" maxlength="90" value="${esc(a.titulo)}" placeholder="Ej. Traer audífonos para el podcast"></label>
  <label>Texto<textarea class="field" id="pfa_texto" rows="4" maxlength="600" placeholder="Detalles para los padres">${esc(a.texto)}</textarea></label>
  <label>Mostrar hasta (opcional)<input class="field" type="date" id="pfa_hasta" value="${esc(a.hasta||'')}"></label>
  <p class="helper">Después de esa fecha deja de verse solo.</p>
  <div class="actions"><button class="primary" onclick="pfAnuncioGuardar()">Guardar anuncio</button><button class="secondary" onclick="closeModal()">Cancelar</button></div>`,{label:'Anuncio para familias'});
  setTimeout(()=>document.getElementById('pfa_titulo')?.focus(),50);
}
function pfAnuncioGuardar(){
  const v=id=>(document.getElementById(id)?.value||'').trim(),titulo=v('pfa_titulo');
  if(!titulo)return warn('Escribe un título para el anuncio.');
  const c=pfCfg(),datos={grupo:v('pfa_grupo')||'TODOS',tipo:v('pfa_tipo')||'Aviso',titulo,texto:v('pfa_texto'),hasta:v('pfa_hasta')};
  if(pfAnEdit){const x=c.anuncios.find(a=>a.id===pfAnEdit);if(x)Object.assign(x,datos)}
  else c.anuncios.unshift({id:pfNid(),fecha:todayISO(),...datos});
  pfSave(c);closeModal();render();notify('Anuncio guardado. Se verá cuando publiques.','success');
}
function pfAnuncioEditar(id){const a=pfCfg().anuncios.find(x=>x.id===id);if(a)pfAnuncioForm(a)}
function pfAnuncioBorrar(id){
  const c=pfCfg(),a=c.anuncios.find(x=>x.id===id);if(!a)return;
  if(!confirm('¿Quitar el anuncio «'+a.titulo+'»? Desaparece del portal cuando vuelvas a publicar.'))return;
  c.anuncios=c.anuncios.filter(x=>x.id!==id);pfSave(c);render();
}
function pfLimpiarVencidos(){const c=pfCfg(),hoy=todayISO(),n=c.anuncios.length;c.anuncios=c.anuncios.filter(a=>!a.hasta||a.hasta>=hoy);pfSave(c);render();notify((n-c.anuncios.length)+' anuncio(s) vencido(s) quitados.','info')}

/* ---------- Notas para la familia ---------- */
function pfNota(sid,txt){const c=pfCfg();const t=String(txt||'').trim();if(t)c.notas[sid]={t,f:todayISO()};else delete c.notas[sid];pfSave(c)}
function pfBorrarNotas(gid){
  const g=activeGroups().find(x=>x.id===gid);if(!g)return;
  if(!confirm('¿Borrar todas las notas para familias de '+g.name+'?'))return;
  const c=pfCfg();roster(g).forEach(s=>delete c.notas[s.id]);pfSave(c);render();
}

/* ---------- Tarjetas de acceso ---------- */
function pfQR(texto){
  try{const q=qrcode(0,'M');q.addData(texto);q.make();return q.createSvgTag({cellSize:3,margin:0,scalable:true})}catch(e){return ''}
}
function pfImprimirTarjetas(gid){
  const c=pfCfg(),g=activeGroups().find(x=>x.id===gid);if(!g)return;
  const lista=roster(g).filter(s=>c.codigos[s.id]);
  if(!lista.length)return warn('Este grupo todavía no tiene códigos. Publica primero y luego imprime.');
  const base=pfPortal(c),prof=state.profile.teacher||'',esc2=esc;
  const tarjetas=lista.map(s=>{const cod=c.codigos[s.id],url=base+'?c='+cod;return `<div class="pf-card">
    <div class="pf-c-top"><b>Mi Bitácora · Familias</b><span>${esc2(prof)}</span></div>
    <div class="pf-c-body"><div class="pf-c-qr">${pfQR(url)}</div><div class="pf-c-txt">
      <div class="pf-c-nom">${esc2(s.name)}</div><div class="pf-c-gr">Grupo ${esc2(g.name)}</div>
      <div class="pf-c-lbl">Código</div><div class="pf-c-cod">${esc2(cod)}</div></div></div>
    <div class="pf-c-pie">Escanee el código QR con la cámara del celular, o entre a<br><b>${esc2(base.replace(/^https?:\/\//,''))}</b> y escriba el código.<br>Es personal: solo muestra la información de su hijo o hija.</div></div>`}).join('');
  const css=`<style>#printArea .pf-hoja{display:grid;grid-template-columns:1fr 1fr;gap:6mm;font-family:Arial,Helvetica,sans-serif;color:#111}
  #printArea .pf-card{border:1.5px dashed #555;border-radius:4mm;padding:4mm;break-inside:avoid;page-break-inside:avoid;height:62mm;box-sizing:border-box;display:flex;flex-direction:column}
  #printArea .pf-c-top{display:flex;justify-content:space-between;gap:3mm;font-size:9pt;border-bottom:1px solid #0f4c5c;padding-bottom:1.5mm;color:#0f4c5c}
  #printArea .pf-c-body{display:flex;gap:4mm;align-items:center;flex:1;padding:2mm 0}
  #printArea .pf-c-qr{width:30mm;height:30mm;flex:none}#printArea .pf-c-qr svg{width:100%;height:100%;display:block}
  #printArea .pf-c-nom{font-weight:bold;font-size:11pt;line-height:1.15}#printArea .pf-c-gr{font-size:9pt;color:#444;margin-top:1mm}
  #printArea .pf-c-lbl{font-size:8pt;color:#666;margin-top:3mm;text-transform:uppercase;letter-spacing:.05em}
  #printArea .pf-c-cod{font:bold 17pt "Courier New",monospace;letter-spacing:.08em}
  #printArea .pf-c-pie{font-size:7.5pt;color:#333;line-height:1.3}</style>`;
  printHTML(css+`<div class="pf-hoja">${tarjetas}</div>`);
}
async function pfEnviarCodigo(sid){
  const c=pfCfg(),cod=c.codigos[sid];let st=null,g=null;
  for(const x of activeGroups()){const s=x.students.find(y=>y.id===sid);if(s){st=s;g=x;break}}
  if(!cod||!st)return;
  const url=pfPortal(c)+'?c='+cod,prof=state.profile.teacher?(' del '+state.profile.teacher):'';
  const txt=`Buen día. Este es el acceso al portal de familias${prof} para consultar las actividades y avisos de ${st.name} (grupo ${g.name}).\n\nEntre aquí: ${url}\nCódigo: ${cod}\n\nEl código es personal, por favor no lo comparta.`;
  if(navigator.share){try{await navigator.share({title:'Portal de familias',text:txt});return}catch(e){if(e&&e.name==='AbortError')return}}
  try{await navigator.clipboard.writeText(txt);notify('Mensaje copiado. Pégalo en WhatsApp.','success')}catch(e){prompt('Copia este mensaje:',txt)}
}

/* ---------- Pantalla ---------- */
function pfHace(iso){
  if(!iso)return '';const d=new Date(iso),min=Math.round((Date.now()-d)/60000);
  const cuando=min<1?'hace un momento':min<60?'hace '+min+' min':min<1440?'hace '+Math.round(min/60)+' h':'hace '+Math.round(min/1440)+' día(s)';
  return d.toLocaleString('es-MX',{weekday:'long',day:'numeric',month:'long',hour:'numeric',minute:'2-digit'})+' ('+cuando+')';
}
VIEWS.familias=function(c){
  title('FAMILIAS','Portal de familias','Publica avances y avisos; cada padre ve solo lo de su hijo.');
  const cf=pfCfg(),gs=activeGroups(),elegidos=pfGruposElegidos(cf),listo=pfListo(cf),hoy=todayISO();
  if(!pfNotaGrupo||!gs.some(g=>g.id===pfNotaGrupo))pfNotaGrupo=(elegidos[0]||gs[0]||{}).id||'';
  const p=listo&&elegidos.length?pfPaquete():null;
  const resumen=p?`Se enviarán <b>${p.alumnos.length}</b> alumnos, <b>${p.actividades.length}</b> registros de actividades de las últimas ${cf.semanas} semanas, <b>${p.anuncios.length}</b> anuncios y <b>${p.notas.length}</b> notas.`:'';
  const vigentes=cf.anuncios.filter(a=>!a.hasta||a.hasta>=hoy),vencidos=cf.anuncios.length-vigentes.length;
  const nombreG=id=>id==='TODOS'?'Todos mis grupos':(gs.find(g=>g.id===id)||{}).name||'(grupo archivado)';
  const gN=gs.find(g=>g.id===pfNotaGrupo);
  const conCodigos=gs.filter(g=>roster(g).some(s=>cf.codigos[s.id]));
  c.innerHTML=`
  <section class="panel pf-pub">
    <h3>📤 Publicar para las familias</h3>
    ${listo?'':`<div class="hint warn">Primero configura la conexión con tu hoja de Google (abajo).</div>`}
    <p class="helper">Grupos que se publican:</p>
    <div class="pf-chips">${gs.map(g=>`<label class="pf-chip ${cf.grupos.includes(g.id)?'on':''}"><input type="checkbox" ${cf.grupos.includes(g.id)?'checked':''} onchange="pfToggleGrupo('${esc(g.id)}',this.checked)"> ${esc(g.name)}</label>`).join('')||'<span class="helper">Aún no tienes grupos.</span>'}</div>
    <div class="pf-trims">
      <p class="helper"><b>🏆 Promedio del trimestre</b> · márcalo solo cuando el trimestre ya esté cerrado:</p>
      <div class="pf-chips">${['1','2','3'].map(n=>{const on=cf.trims.includes(n),nom=periodName(elegidos[0]||gs[0]||{},n);return `<label class="pf-chip ${on?'on':''}"><input type="checkbox" ${on?'checked':''} onchange="pfToggleTrim('${n}',this.checked)"> ${esc(nom)}</label>`}).join('')}</div>
    </div>
    ${resumen?`<p class="helper">${resumen}${p&&p.promedios.length?` Además, <b>${p.promedios.length}</b> promedios de ${esc(cf.trims.map(n=>periodName(elegidos[0],n)).join(', '))}.`:''}</p>`:''}
    <div class="actions"><button class="primary big" ${pfBusy||!listo||!elegidos.length?'disabled':''} onclick="pfPublicar()">${pfBusy?'Publicando…':'📤 Publicar ahora'}</button></div>
    <p class="helper">${cf.ultima?'Última publicación: <b>'+esc(pfHace(cf.ultima))+'</b>.':'Todavía no has publicado.'} Los padres ven lo de la última publicación, no los cambios en vivo. ${cf.calif?'Se envían las calificaciones de cada actividad.':'No se envían calificaciones numéricas.'}</p>
  </section>

  <section class="panel">
    <h3>📢 Anuncios</h3>
    <div class="actions"><button class="primary" onclick="pfAnuncioForm()">+ Nuevo anuncio</button>${vencidos?`<button class="secondary" onclick="pfLimpiarVencidos()">Quitar ${vencidos} vencido(s)</button>`:''}</div>
    ${cf.anuncios.length?`<div class="pf-anuncios">${cf.anuncios.map(a=>{const venc=a.hasta&&a.hasta<hoy;return `<div class="pf-an ${venc?'venc':''}">
      <div class="pf-an-meta"><span class="pf-tag">${esc(a.tipo||'Aviso')}</span> ${esc(nombreG(a.grupo))}${a.hasta?` · ${venc?'venció':'hasta'} ${esc(a.hasta)}`:''}</div>
      <b>${esc(a.titulo)}</b>${a.texto?`<div class="pf-an-txt">${esc(a.texto)}</div>`:''}
      <div class="pf-an-acc"><button class="linkbtn" onclick="pfAnuncioEditar('${esc(a.id)}')">Editar</button><button class="linkbtn" onclick="pfAnuncioBorrar('${esc(a.id)}')">Quitar</button></div></div>`}).join('')}</div>`
      :'<p class="helper">Sin anuncios. Úsalos para tareas, materiales, fechas y eventos.</p>'}
  </section>

  <section class="panel">
    <h3>✏️ Nota para la familia</h3>
    <p class="helper">Un mensaje corto y personal por alumno (opcional). Se guarda al salir de la casilla.</p>
    ${gs.length?`<div class="pf-row"><select class="field" onchange="pfNotaGrupo=this.value;render()">${gs.map(g=>`<option value="${esc(g.id)}" ${g.id===pfNotaGrupo?'selected':''}>${esc(g.name)}</option>`).join('')}</select>
      ${gN&&roster(gN).some(s=>cf.notas[s.id])?`<button class="linkbtn" onclick="pfBorrarNotas('${esc(gN.id)}')">Borrar notas de este grupo</button>`:''}</div>
    <div class="pf-notas">${gN?roster(gN).map(s=>`<label class="pf-nota"><span>${esc(s.name)}</span><textarea class="field" rows="2" maxlength="400" placeholder="Sin nota" onchange="pfNota('${esc(s.id)}',this.value)">${esc((cf.notas[s.id]||{}).t||'')}</textarea></label>`).join(''):''}</div>`:''}
  </section>

  <section class="panel">
    <h3>🎫 Códigos y tarjetas</h3>
    ${conCodigos.length?`<p class="helper">Imprime una hoja por grupo (8 tarjetas por hoja), o manda el acceso por WhatsApp a cada familia. Los códigos no cambian al volver a publicar.</p>
      ${conCodigos.map(g=>{const ros=roster(g);return `<details class="pf-cod"><summary><b>${esc(g.name)}</b> · ${ros.filter(s=>cf.codigos[s.id]).length} de ${ros.length} con código</summary>
        <div class="actions"><button class="secondary" onclick="pfImprimirTarjetas('${esc(g.id)}')">🖨️ Imprimir tarjetas</button></div>
        <ul class="pf-cod-lista">${ros.map(s=>`<li><span>${esc(s.name)}</span>${cf.codigos[s.id]?`<code>${esc(cf.codigos[s.id])}</code><button class="linkbtn" onclick="pfEnviarCodigo('${esc(s.id)}')">Enviar</button>`:'<em>Sin código: publica</em>'}</li>`).join('')}</ul></details>`}).join('')}`
      :'<p class="helper">Los códigos se crean la primera vez que publicas un grupo.</p>'}
  </section>

  <section class="panel">
    <details class="pf-con" ${listo?'':'open'}><summary><h3 style="display:inline">🔗 Conexión con Google Sheets</h3> ${listo?(cf.probado?'<span class="pf-ok">● conectada</span>':'<span class="pf-ok">● configurada</span>'):'<span class="pf-no">● sin configurar</span>'}</summary>
    <label>Dirección del script (termina en /exec)<input class="field" id="pf_url" value="${esc(cf.url)}" placeholder="https://script.google.com/macros/s/…/exec" inputmode="url" autocomplete="off" spellcheck="false" onchange="pfLeerConexion()"></label>
    <label>Clave para publicar<input class="field" id="pf_clave" type="password" value="${esc(cf.clave)}" autocomplete="off" spellcheck="false" onchange="pfLeerConexion()"></label>
    <label>Dirección de la página de familias<input class="field" id="pf_portal" value="${esc(cf.portal)}" placeholder="${esc(pfPortal({portal:''}))}" inputmode="url" spellcheck="false" onchange="pfLeerConexion()"></label>
    <p class="helper">Si la dejas vacía se usa <b>${esc(pfPortal({portal:''}))}</b>.</p>
    <div class="pf-grid">
      <label>Semanas que se muestran<select class="field" onchange="pfSet('semanas',Number(this.value));render()">${[2,4,6,8].map(n=>`<option value="${n}" ${cf.semanas===n?'selected':''}>Últimas ${n}</option>`).join('')}</select></label>
      <label class="check-inline pf-chk"><input type="checkbox" ${cf.calif?'checked':''} onchange="pfSet('calif',this.checked);render()"> Mostrar la calificación de cada actividad (ej. 8.5 / 10)</label>
      <label class="check-inline pf-chk"><input type="checkbox" ${cf.nivel?'checked':''} onchange="pfSet('nivel',this.checked);render()"> Mostrar nivel de logro (Requiere apoyo / En proceso / Nivel esperado)</label>
    </div>
    <div class="actions"><button class="secondary" onclick="pfProbar()">Probar conexión</button></div>
    <div class="hint">La clave y esta configuración se guardan solo en esta tablet y <b>no</b> van en tus copias de seguridad.</div>
    </details>
  </section>`;
};
if(typeof NAV_TOP==='object')NAV_TOP.familias='more';
(function(){const st=document.createElement('style');st.textContent=`
.pf-chips{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 10px}
.pf-chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:6px 14px;border-radius:999px;border:1.5px solid var(--line,#ccd);cursor:pointer;font-weight:700}
.pf-chip.on{border-color:var(--primary,#0f4c5c);background:color-mix(in srgb,var(--primary,#0f4c5c) 12%,transparent)}
.pf-chip input{width:20px;height:20px}
.pf-trims{margin:4px 0 8px;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--accent,#f2a541) 10%,transparent)}
.pf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;align-items:end}
.pf-anuncios{display:grid;gap:10px;margin-top:10px}
.pf-an{border:1px solid var(--line,#dde);border-left:5px solid var(--accent,#1a9e9a);border-radius:12px;padding:10px 14px}
.pf-an.venc{opacity:.55}.pf-an-meta{font-size:.85em;opacity:.8;margin-bottom:2px}
.pf-tag{font-weight:800;text-transform:uppercase;letter-spacing:.04em}
.pf-an-txt{white-space:pre-line;margin-top:2px}.pf-an-acc{display:flex;gap:14px;margin-top:6px}
.pf-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:10px}.pf-row select{max-width:280px}
.pf-notas{display:grid;gap:8px}.pf-nota{display:grid;grid-template-columns:minmax(140px,1fr) 2fr;gap:10px;align-items:center}
@media (max-width:640px){.pf-nota{grid-template-columns:1fr}}
.pf-cod{border:1px solid var(--line,#dde);border-radius:12px;padding:8px 14px;margin-top:10px}
.pf-cod summary{cursor:pointer;min-height:40px;display:flex;align-items:center}
.pf-cod-lista{list-style:none;margin:6px 0 0;padding:0}
.pf-cod-lista li{display:flex;align-items:center;gap:12px;padding:8px 0;border-top:1px solid var(--line,#eee)}
.pf-cod-lista li span{flex:1}.pf-cod-lista code{font-weight:800;letter-spacing:.06em}
.pf-con summary{cursor:pointer;min-height:44px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.pf-ok{color:#1f8a4c;font-weight:700;font-size:.9em}.pf-no{color:#c0392b;font-weight:700;font-size:.9em}
.pf-chk{display:flex;gap:8px;align-items:center;min-height:44px}
`;document.head.appendChild(st)})();
