/* ===== 98_formato_oficial.js — Formato oficial de asistencias (SEPEN Nayarit, ciclo 2026-2027) =====
   Asistencia › Historial › «📄 Formato oficial de asistencias (Excel)».
   · Ventana previa con los datos del encabezado; lo que se escribe se guarda en «Mis datos».
   · Excel .xlsx real (el XML se escribe aquí): oficio horizontal, una página de ancho, texto girado,
     celdas combinadas, bordes y fórmulas COUNTIF para que los totales se recalculen si se corrige una marca.
   · Marcas: «.» asistencia · «/» falta (injustificada o sin clasificar) · «J» falta justificada · vacío sin registro.
   · RASGOS = un renglón por rubro de la disciplina (mín. 4 columnas); CALIFICACIÓN = promedio final.
     Ambos se calculan con ceros (modo de exportación) y con las actividades del periodo elegido. */
const FO_LETRA=['D','L','M','M','J','V','S'];
const FO_DIA=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const FO_MOMENTO={'1':'PRIMER PERIODO','2':'SEGUNDO PERIODO','3':'TERCER PERIODO'};
let foDraft=null;

function foGradoGrupo(name){
  const s=String(name||'').toUpperCase().trim();
  const m=s.match(/(\d)\s*[°º.\-]?\s*([A-ZÑ])\b/)||s.match(/(\d).*?([A-ZÑ])\s*$/);
  return {grado:m?m[1]:((s.match(/\d/)||[''])[0]),grupo:m?m[2]:''};
}
function foDateObj(iso){const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d)}
function foListDays(g){return Object.keys(state.attendance).filter(k=>k.startsWith(g.id+'|')).map(k=>k.split('|')[1]).sort()}
function foClassDays(g,sc){return [...new Set(state.profile.schedule.filter(x=>x.groupId===g.id&&x.scopeId===sc).map(x=>x.day))].sort((a,b)=>FO_DIA.indexOf(a)-FO_DIA.indexOf(b))}
function foAllDays(g){return [...new Set([...foListDays(g),...scDaysInRange(g)])].sort()}
function foDays(g,d){
  let days=foAllDays(g).filter(x=>(!d.desde||x>=d.desde)&&(!d.hasta||x<=d.hasta));
  if(d.soloClase){const ok=new Set(foClassDays(g,d.sc));if(ok.size)days=days.filter(x=>ok.has(FO_DIA[foDateObj(x).getDay()]))}
  return days;
}
function foJoinDays(list){const l=list.map(x=>x.toLowerCase());return l.length<2?l.join(''):l.slice(0,-1).join(', ')+' y '+l[l.length-1]}

function openFormatoOficial(){
  const g=group();if(!g)return warn('Primero elige un grupo.');
  const scopes=scopesForGroup(g);if(!scopes.length)return warn('Este grupo todavía no tiene disciplinas. Agrégalas en Mi grupo › Disciplinas.');
  const all=foAllDays(g);if(!all.length)return warn('Este grupo todavía no tiene listas guardadas. Pasa lista primero en «Asistencia».');
  const p=state.profile,gg=foGradoGrupo(g.name),cur=scopeId(g),sc=scopes.some(s=>s.id===cur)?cur:scopes[0].id;
  foDraft={sc,momento:String(currentPeriod),desde:attRange.from||all[0],hasta:attRange.to||all[all.length-1],
    escuela:p.school||'',cct:p.cct||'',sector:p.sector||'',zona:p.zona||'',grado:gg.grado,grupo:gg.grupo,
    turno:p.shift||'',ciclo:p.cycle||'',profesor:p.teacher||'',soloClase:foClassDays(g,sc).length>0};
  const d=foDraft,f=(k,label,ph,extra)=>`<label>${label}<input class="field" id="fo_${k}" value="${esc(d[k])}" placeholder="${esc(ph||'')}" ${extra||''} oninput="foSet('${k}',this.value)"></label>`;
  openModal(`<div class="fo-box"><h2>📄 Formato oficial de asistencias</h2>
  <p class="helper">${esc(g.name)} · Excel igual al formato oficial del SIIE (oficio horizontal, 21 alumnos por hoja), listo para imprimir. Revisa los datos del encabezado: lo que escribas se guarda para la próxima vez.</p>
  <div class="fo-grid">
    <label>Disciplina<select class="field" id="fo_sc" onchange="foSet('sc',this.value)">${scopes.map(s=>`<option value="${esc(s.id)}" ${s.id===d.sc?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>
    <label>Periodo de evaluación<select class="field" id="fo_momento" onchange="foSet('momento',this.value)">${['1','2','3'].map(n=>`<option value="${n}" ${d.momento===n?'selected':''}>${FO_MOMENTO[n].charAt(0)+FO_MOMENTO[n].slice(1).toLowerCase()}</option>`).join('')}</select></label>
    <label>Desde<input class="field" type="date" id="fo_desde" value="${esc(d.desde)}" onchange="foSet('desde',this.value)"></label>
    <label>Hasta<input class="field" type="date" id="fo_hasta" value="${esc(d.hasta)}" onchange="foSet('hasta',this.value)"></label>
  </div>
  <label class="check-inline fo-clase"><input type="checkbox" id="fo_soloClase" ${d.soloClase?'checked':''} onchange="foSet('soloClase',this.checked)"> <span id="fo_claseTxt"></span></label>
  <p class="fo-count" id="fo_count" role="status"></p>
  <details class="import-panel fo-head" open><summary>Datos del encabezado</summary><div class="fo-grid">
    ${f('escuela','Escuela','Nombre de la escuela','maxlength="160"')}${f('cct','Clave del C.C.T.','Ej. 18DES0000X','maxlength="20" style="text-transform:uppercase"')}
    ${f('sector','Sector','Ej. 02','maxlength="20"')}${f('zona','Zona escolar','Ej. 015','maxlength="20"')}
    ${f('grado','Grado','Ej. 3','maxlength="10"')}${f('grupo','Grupo','Ej. A','maxlength="10" style="text-transform:uppercase"')}
    <label>Turno<select class="field" id="fo_turno" onchange="foSet('turno',this.value)"><option value="">Sin indicar</option>${SHIFTS.map(s=>`<option ${d.turno===s?'selected':''}>${s}</option>`).join('')}</select></label>
    ${f('ciclo','Ciclo escolar','Ej. 2026-2027','maxlength="20"')}${f('profesor','Nombre del profesor','Nombre completo','maxlength="120"')}
  </div></details>
  <div class="actions"><button class="primary big" id="fo_go" onclick="foGenerate()">📄 Generar Excel</button><button class="secondary" onclick="closeModal()">Cancelar</button></div></div>`,{label:'Formato oficial de asistencias',wide:true});
  foRefresh();
}
function foSet(k,v){if(!foDraft)return;foDraft[k]=v;if(k==='sc'&&!foClassDays(group(),v).length)foDraft.soloClase=false;foRefresh()}
function foRefresh(){
  const g=group(),d=foDraft;if(!g||!d)return;
  const cls=foClassDays(g,d.sc),scn=scopeName(g,d.sc),box=document.getElementById('fo_soloClase'),txt=document.getElementById('fo_claseTxt');
  if(box){box.disabled=!cls.length;box.checked=!!(d.soloClase&&cls.length)}
  if(txt)txt.innerHTML=cls.length?`Solo los días de clase de ${esc(scn)} (${esc(foJoinDays(cls))}, según tu horario)`:`Solo los días de clase de ${esc(scn)} <span class="helper">— no está en tu horario; se usan todos los días con lista</span>`;
  const days=foDays(g,d),inRange=foAllDays(g).filter(x=>(!d.desde||x>=d.desde)&&(!d.hasta||x<=d.hasta)).length,n=roster(g).length;
  const nNC=days.filter(x=>scGet(g,x)).length,nList=days.length-nNC;
  const c=document.getElementById('fo_count'),go=document.getElementById('fo_go');
  if(c)c.innerHTML=days.length?`Saldrán <b>${nList} ${nList===1?'día':'días'} con lista</b>${nNC?` y <b>${nNC} sin clases</b>`:''} en esas fechas${d.soloClase&&cls.length&&inRange!==days.length?` (de ${inRange} con registro, contando solo los días de clase)`:''}, con <b>${n} alumnos</b>.${days.length>45?' Son más de 45: la hoja se hace más ancha para que quepan, y sigue saliendo en una página de ancho.':''} ${n>FO_POR_HOJA?`Saldrán <b>${Math.ceil(n/FO_POR_HOJA)} hojas</b> (21 alumnos por hoja, como el oficial).`:''}`
    :'<span class="imp-flag">No hay días con lista en esas fechas'+(d.soloClase?' para los días de clase de la disciplina':'')+'. Cambia las fechas o quita la casilla.</span>';
  if(go)go.disabled=!days.length||(d.desde&&d.hasta&&d.desde>d.hasta);
  if(d.desde&&d.hasta&&d.desde>d.hasta&&c)c.innerHTML='<span class="imp-flag">«Desde» no puede ser después de «Hasta».</span>';
}
function foGenerate(){
  const g=group(),d=foDraft;if(!g||!d)return;const days=foDays(g,d);
  if(!days.length)return warn('No hay días con lista para ese periodo. No se generó el archivo.');
  const p=state.profile;   /* se guardan en «Mis datos» para la próxima vez */
  p.school=String(d.escuela).trim().slice(0,160);p.cct=String(d.cct).trim().toUpperCase().slice(0,20);p.sector=String(d.sector).trim().slice(0,20);p.zona=String(d.zona).trim().slice(0,20);
  if(SHIFTS.includes(d.turno))p.shift=d.turno;p.cycle=String(d.ciclo).trim().slice(0,20);p.teacher=String(d.profesor).trim().slice(0,120);save();
  let blob,name;
  try{
    EXPORT_CEROS=true;   /* rasgos y calificación con ceros; se apaga siempre en finally */
    const files=foXlsxFiles(g,d,days);blob=zipBlob(files);
    name='Formato_asistencias_'+safeName(g.name)+'_'+safeName(scopeName(g,d.sc))+'_P'+d.momento+'.xlsx';
  }catch(e){return warn('No se pudo generar el formato oficial ('+(e&&e.message||e)+'). No se descargó nada.')}
  finally{EXPORT_CEROS=false}
  download(name,blob);closeModal();
  notify(`Formato oficial listo en Descargas: ${name} (${days.length} días, ${roster(g).length} alumnos).`,'success',{ms:9000});
}

/* Días programados: los días de la semana de la disciplina en el horario (o de lunes a viernes),
   entre «Desde» y «Hasta», sin los días marcados «sin clases» de este grupo. */
function foProgramadas(g,d,days){
  const desde=d.desde||days[0],hasta=d.hasta||days[days.length-1];if(!desde||!hasta||desde>hasta)return 0;
  const cls=foClassDays(g,d.sc),ok=new Set(cls.length?cls:['Lunes','Martes','Miércoles','Jueves','Viernes']);
  let n=0;for(let t=foDateObj(desde);t<=foDateObj(hasta);t.setDate(t.getDate()+1)){const iso=t.toLocaleDateString('en-CA');if(ok.has(FO_DIA[t.getDay()])&&!scGet(g,iso))n++}
  return n;
}
/* ---------- cálculo de rasgos y calificación (con ceros, periodo elegido) ---------- */
function foRasgos(g,sc,momento){
  const R=rubrosOf(g,sc,momento),acts=scopedActivities(g,sc,momento).filter(countsInAverage);
  return {R,acts,items:R.items.map(it=>({it,acts:acts.filter(a=>a.rubro===it.id)}))};
}
function foRasgoValue(st,x){if(!x.acts.length)return null;const v=x.acts.map(a=>gradeOnTen(a,st.id)).filter(n=>n!==null);return v.length?round2(v.reduce((a,b)=>a+b,0)/v.length):null}

/* ---------- Excel: igual al formato del SIIE «LISTA PARA REGISTRO DE ASISTENCIA Y CALIFICACIONES» ----------
   · Oficio horizontal, letra monoespaciada (Noto Sans Mono), 21 alumnos por hoja; cada hoja repite el encabezado
     completo, «HOJA n DE m», el resumen del grupo y las firmas (el resumen siempre es del grupo completo).
   · 45 columnas de días (más si hay más días), ASISTENCIAS · FALTAS JUSTIFICADAS · FALTAS NO JUSTIFICADAS · % DE ASISTENCIA,
     8 columnas para los rasgos (tus rubros; más si tienes más) y PROMEDIO.
   · Medidas tomadas del PDF oficial a 300 ppp (anchos en píxeles de pantalla, altos en puntos). */
const FO_POR_HOJA=21,FO_FONT='Noto Sans Mono';
function foXlsxFiles(g,d,days){
  const ros=roster(g),scn=scopeName(g,d.sc),RS=foRasgos(g,d.sc,d.momento);
  const withJ=state.settings.attRule==='withJustified';
  const nD=Math.max(45,days.length),nR=Math.max(8,RS.items.length);
  const C_D0=7,C_T0=C_D0+nD,C_R0=C_T0+4,C_PR=C_R0+nR,LAST=C_PR;
  const dc=k=>C_D0+Math.round(k*nD/45),rc=k=>C_R0+Math.round(k*nR/8);
  const cells=[],bd=[],merges=[],heights={},breaks=[],anchors=[];
  const cell=(r,c)=>{const row=(cells[r]=cells[r]||[]);return row[c]=row[c]||{}};
  const put=(r,c,v,s,extra)=>{const o=cell(r,c);if(v!==undefined)o.v=v;if(s)o.s=s;if(extra)Object.assign(o,extra);return o};
  const RANK={thin:1,medium:2,double:3};
  const side=(r,c,k,w)=>{const row=(bd[r]=bd[r]||[]),o=(row[c]=row[c]||{});if(!o[k]||RANK[w]>RANK[o[k]])o[k]=w};
  const rect=(r1,c1,r2,c2,w)=>{for(let c=c1;c<=c2;c++){side(r1,c,'t',w);side(r2,c,'b',w)}for(let r=r1;r<=r2;r++){side(r,c1,'l',w);side(r,c2,'r',w)}};
  const grid=(r1,c1,r2,c2,w)=>{for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++)rect(r,c,r,c,w)};
  const merge=(r1,c1,r2,c2,v,s,extra)=>{put(r1,c1,v,s,extra);for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++)cell(r,c);if(r1!==r2||c1!==c2)merges.push(colName(c1)+(r1+1)+':'+colName(c2)+(r2+1))};
  const T=(sz,h,v,o)=>Object.assign({sz,h:h||'center',v:v||'center'},o||{});
  const up=x=>String(x==null?'':x).toUpperCase();
  const MARK={P:'.',F:'/',FI:'/',FJ:'J'};
  const nP=Math.max(1,Math.ceil(ros.length/FO_POR_HOJA)),ahora=new Date();
  const fecha=`${String(ahora.getDate()).padStart(2,'0')}/${String(ahora.getMonth()+1).padStart(2,'0')}/${ahora.getFullYear()} ${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`;
  /* columnas del resumen (debajo de NOMBRE DEL ALUMNO) */
  const SUM=[[1,1],[2,2],[3,3],[4,4],[5,5],[6,C_D0+1],[C_D0+2,dc(6)-1],[dc(6),dc(11)-1]],SPR=[dc(11),dc(20)-1];
  /* datos del grupo completo para el resumen */
  const cals=ros.map(st=>{const v=averageInScope(g,{id:d.sc},st,RS.acts);return v===null?null:round2(v)});
  const calsOk=cals.filter(v=>v!==null),nAp=calsOk.filter(v=>v>=6).length,nRe=calsOk.filter(v=>v<6).length;
  const reales=days.filter(x=>!scGet(g,x)).length,prog=foProgramadas(g,d,days);
  let totJ=0,totI=0;ros.forEach(st=>days.forEach(iso=>{if(scGet(g,iso))return;const x=(state.attendance[g.id+'|'+iso]||{})[st.id];if(x==='FJ')totJ++;else if(x==='F'||x==='FI')totI++}));
  const blocks=[],summaryCells=[];
  let R0=0,blockPt=0;
  for(let pi=0;pi<nP;pi++){
    const list=ros.slice(pi*FO_POR_HOJA,(pi+1)*FO_POR_HOJA),first=pi*FO_POR_HOJA;
    const h=(r,pt)=>{heights[r]=pt};
    /* 1–2: logo, títulos y HOJA n DE m */
    anchors.push(R0);
    merge(R0,dc(7),R0,C_T0+1,'SISTEMA INTEGRAL DE INFORMACION EDUCATIVA',T(14));
    merge(R0,rc(4),R0,rc(5)-1,'HOJA',T(8,'right'));merge(R0,rc(5),R0,rc(7)-1,pi+1,T(9));rect(R0,rc(5),R0,rc(7)-1,'thin');
    merge(R0,rc(7),R0,C_PR-1,'DE',T(8));put(R0,C_PR,nP,T(9));rect(R0,C_PR,R0,C_PR,'thin');
    merge(R0+1,dc(7),R0+1,C_T0+1,'LISTA PARA REGISTRO DE ASISTENCIA Y CALIFICACIONES',T(9));
    h(R0,20);h(R0+1,12);
    /* 3–4: dependencia y entidad */
    merge(R0+2,4,R0+2,dc(38)-1,'SERVICIOS DE EDUCACIÓN PÚBLICA DEL ESTADO DE NAYARIT',T(8,'left','bottom',{ind:1}));
    merge(R0+2,dc(39),R0+2,rc(6)-1,'NAYARIT',T(8,'left','bottom',{ind:1}));
    for(let c=4;c<dc(38);c++)side(R0+2,c,'b','medium');for(let c=dc(39);c<rc(6);c++)side(R0+2,c,'b','medium');
    merge(R0+3,4,R0+3,dc(38)-1,'SECRETARIA DE EDUCACION U ORGANISMO PUBLICO DESCENTRALIZADO',T(5,'left','top',{ind:1}));
    merge(R0+3,dc(39),R0+3,rc(6)-1,'ENTIDAD FEDERATIVA',T(5,'left','top',{ind:1}));
    merge(R0+3,rc(6),R0+3,C_PR,fecha,T(4,'right','bottom'));
    h(R0+2,12.5);h(R0+3,11);
    /* 5–8: recuadro de datos de la escuela */
    const H1=R0+4,S1=[[0,2,'CLAVE SEGUN CCT',up(d.cct),'left'],[3,dc(20)-1,'NOMBRE OFICIAL DE LA ESCUELA SEGUN CATALOGO DE CENTROS DE TRABAJO',up(d.escuela),'left'],
      [dc(20),dc(30)-1,'SECTOR',d.sector,'center'],[dc(30),dc(43)-1,'ZONA ESCOLAR',d.zona,'center'],[dc(43),C_T0+1,'GRADO',d.grado,'center'],
      [C_T0+2,rc(1)-1,'GRUPO',up(d.grupo),'center'],[rc(1),rc(5)-1,'TURNO',up(d.turno),'center'],[rc(5),C_PR,'PERIODO ESCOLAR',d.ciclo,'center']];
    const S2=[[0,dc(9)-1,'ASIGNATURA',up(scn),'left'],[dc(9),C_T0,'NOMBRE DEL PROFESOR',up(d.profesor),'left'],[C_T0+1,C_PR,'PERIODO DE EVALUACION',FO_MOMENTO[d.momento]||'','left']];
    [[H1,S1],[H1+2,S2]].forEach(([r,S])=>S.forEach(([a,b,l,v,al])=>{
      merge(r,a,r,b,l,T(5,al,'top',{ind:al==='left'?1:0}));merge(r+1,a,r+1,b,v==null?'':String(v),T(9,al,'center',{ind:al==='left'?1:0}));rect(r,a,r+1,b,'thin')}));
    for(let r=H1;r<=H1+1;r++){side(r,C_T0+1,'r','medium')}   /* línea gruesa entre GRUPO… y TURNO como el original */
    rect(H1,0,H1+3,C_PR,'medium');for(let c=0;c<=C_PR;c++)side(H1+3,c,'b','double');
    h(H1,8.5);h(H1+1,15);h(H1+2,8);h(H1+3,13);h(H1+4,4);
    /* 10–11: cabeza de la tabla */
    const H0=R0+9,F0=H0+2,FL=F0+list.length-1;
    merge(H0,0,H0+1,0,'NUMERO DE LISTA',T(5,'center','bottom',{rot:90,wrap:1}));
    merge(H0,1,H0+1,6,'NOMBRE DEL ALUMNO',T(7));
    merge(H0,C_D0,H0,C_T0-1,'A S I S T E N C I A S',T(9));
    for(let k=0;k<nD;k++){const iso=days[k];put(H0+1,C_D0+k,iso?iso.slice(8,10)+'/'+iso.slice(5,7):'',T(5,'center','center',{rot:90}))}
    ['ASISTENCIAS','FALTAS JUSTIFICADAS','FALTAS NO JUSTIFICADAS','% DE ASISTENCIA'].forEach((t,k)=>merge(H0,C_T0+k,H0+1,C_T0+k,t,T(5,'center','bottom',{rot:90,wrap:1})));
    for(let k=0;k<nR;k++){const x=RS.items[k];merge(H0,C_R0+k,H0+1,C_R0+k,x?up(x.it.name)+(RS.R.pct?` ${numfmt(x.it.w)}%`:''):'',T(5,'center','bottom',{rot:90,wrap:1}))}
    merge(H0,C_PR,H0+1,C_PR,'PROMEDIO',T(6,'center','center',{rot:90}));
    grid(H0,0,H0+1,C_PR,'thin');h(H0,21);h(H0+1,20);
    /* alumnos */
    list.forEach((st,j)=>{
      const i=first+j,r=F0+j,R1=r+1,rng=`${colName(C_D0)}${R1}:${colName(C_T0-1)}${R1}`;
      put(r,0,i+1,T(9,'right'));merge(r,1,r,6,up(st.name),T(9,'left','center',{shrink:1}));
      let P=0,J=0,I=0,n=0;
      for(let k=0;k<nD;k++){
        const iso=days[k];if(iso&&scGet(g,iso))continue;   /* columna «sin clases»: se llena abajo */
        const x=iso?(state.attendance[g.id+'|'+iso]||{})[st.id]:undefined,m=x?MARK[x]:'';
        if(m){n++;if(m==='.')P++;else if(m==='J')J++;else I++}
        put(r,C_D0+k,m,T(7));
      }
      const cA=colName(C_T0)+R1,cJ=colName(C_T0+1)+R1,cI=colName(C_T0+2)+R1;
      put(r,C_T0,undefined,T(7,'center','center',{num:1}),{f:`COUNTIF(${rng},".")`,v:P});
      put(r,C_T0+1,undefined,T(7,'center','center',{num:1}),{f:`COUNTIF(${rng},"J")`,v:J});
      put(r,C_T0+2,undefined,T(7,'center','center',{num:1}),{f:`COUNTIF(${rng},"/")`,v:I});
      put(r,C_T0+3,undefined,T(6,'center','center',{num:9}),{f:`IF((${cA}+${cJ}+${cI})=0,"",${withJ?`(${cA}+${cJ})`:cA}/(${cA}+${cJ}+${cI}))`,v:n?((withJ?P+J:P)/n):'',t:n?undefined:'str'});
      for(let k=0;k<nR;k++){const x=RS.items[k],v=x?foRasgoValue(st,x):null;put(r,C_R0+k,v===null?'':v,T(6,'center','center',{num:164}))}
      put(r,C_PR,cals[i]===null?'':cals[i],T(7,'center','center',{num:164}));
      h(r,15);
    });
    if(list.length)grid(F0,0,FL,C_PR,'thin');
    /* líneas gruesas como el original */
    const bot=list.length?FL:H0+1;
    for(let c=0;c<=C_PR;c++){side(H0,c,'t','medium');side(H0+1,c,'b','medium')}
    [0,C_D0,C_T0,C_R0,C_PR].forEach(c=>{for(let r=H0;r<=bot;r++)side(r,c,'l','medium')});
    for(let r=H0;r<=bot;r++)side(r,C_PR,'r','medium');
    /* columnas «sin clases»: casillas combinadas con la leyenda girada y fondo gris */
    if(list.length)days.forEach((iso,k)=>{const x=scGet(g,iso);if(!x)return;const ley=scLeyenda(x)||'SIN CLASES';
      const altoPt=list.length*15-6,size=Math.max(5,Math.min(9,Math.floor(altoPt/(ley.length*0.62))));
      merge(F0,C_D0+k,FL,C_D0+k,ley,T(size,'center','center',{rot:90,wrap:1,fill:1}))});
    /* hueco hasta el resumen (la última hoja deja los renglones vacíos, como el original) */
    const GAP=(list.length?FL:H0+1)+1;h(GAP,15.7+(FO_POR_HOJA-list.length)*15);
    /* resumen del grupo */
    const Q=GAP+1;
    [['Aprobación',0,1],['Reprobación',2,3],['Días de Clases',4,5],['Inasistencias',6,7]].forEach(([t,a,b])=>merge(Q,SUM[a][0],Q,SUM[b][1],t,T(9,'center','center',{wrap:1})));
    merge(Q,SPR[0],Q,SPR[1],'Promedio General',T(9,'center','center',{wrap:1}));
    ['Alumnos','Porcentaj','Alumnos','Porcentaj','Programad','Reales','Total','Porcentaj'].forEach((t,k)=>merge(Q+1,SUM[k][0],Q+1,SUM[k][1],t,T(7)));
    SUM.forEach(([a,b])=>{rect(Q,a,Q+2,b,'thin')});rect(Q+1,SPR[0],Q+2,SPR[1],'thin');rect(Q,SPR[0],Q,SPR[1],'thin');
    for(let k=0;k<4;k++)rect(Q,SUM[2*k][0],Q,SUM[2*k+1][1],'thin');
    rect(Q,1,Q+2,SPR[1],'medium');
    summaryCells.push(Q+2);
    /* firmas y sello */
    for(let c=dc(23);c<dc(42);c++)side(Q+1,c,'b','thin');
    merge(Q+2,dc(23),Q+2,dc(42)-1,'Nombre y Firma del Subdirector de la Escuela',T(6,'center','top'));
    merge(Q+1,dc(43),Q+1,rc(4)-1,up(d.profesor),T(7,'center','bottom'));for(let c=dc(43);c<rc(4);c++)side(Q+1,c,'b','thin');
    merge(Q+2,dc(43),Q+2,rc(4)-1,'Firma del Profesor',T(6,'center','top'));
    merge(Q+1,rc(5),Q+1,C_PR,'Sello de la\nescuela',T(6,'center','center',{wrap:1}));
    put(Q+2,rc(5),undefined,T(6));side(Q+2,rc(5),'l','thin');side(Q+2,rc(5),'b','thin');
    put(Q+2,C_PR,undefined,T(6));side(Q+2,C_PR,'r','thin');side(Q+2,C_PR,'b','thin');
    h(Q,38);h(Q+1,17.7);h(Q+2,21.6);
    blocks.push({F0,FL,n:list.length});
    if(pi<nP-1)breaks.push(Q+3);   /* salto de página después de la fila Q+2 (1-based = Q+3) */
    let pt=0;for(let r=R0;r<=Q+2;r++)pt+=heights[r]||15;blockPt=Math.max(blockPt,pt);
    R0=Q+3;
  }
  /* valores del resumen (iguales en cada hoja, con fórmulas sobre todo el grupo) */
  const ranges=c=>blocks.filter(b=>b.n).map(b=>`${colName(c)}${b.F0+1}:${colName(c)}${b.FL+1}`);
  const calR=ranges(C_PR).join(','),nomR=ranges(1).join(','),jR=ranges(C_T0+1).join(','),iR=ranges(C_T0+2).join(',');
  const cnt=crit=>ranges(C_PR).map(x=>`COUNTIF(${x},"${crit}")`).join('+')||'0';
  const pct=(a,b)=>b?a/b:'';
  summaryCells.forEach(V=>{
    const ref=k=>colName(SUM[k][0])+(V+1);
    const vals=[
      {f:cnt('>=6'),v:nAp,s:T(8,'center','center',{num:1})},
      {f:calR?`IF(COUNT(${calR})=0,"",${ref(0)}/COUNT(${calR}))`:'""',v:pct(nAp,calsOk.length),t:calsOk.length?undefined:'str',s:T(8,'center','center',{num:10})},
      {f:cnt('<6'),v:nRe,s:T(8,'center','center',{num:1})},
      {f:calR?`IF(COUNT(${calR})=0,"",${ref(2)}/COUNT(${calR}))`:'""',v:pct(nRe,calsOk.length),t:calsOk.length?undefined:'str',s:T(8,'center','center',{num:10})},
      {v:prog,s:T(8,'center','center',{num:1})},{v:reales,s:T(8,'center','center',{num:1})},
      {f:jR?`SUM(${jR})+SUM(${iR})`:'0',v:totJ+totI,s:T(8,'center','center',{num:1})},
      {f:nomR?`IF(COUNTA(${nomR})*${ref(5)}=0,"",${ref(6)}/(COUNTA(${nomR})*${ref(5)}))`:'""',v:pct(totJ+totI,ros.length*reales),t:ros.length*reales?undefined:'str',s:T(8,'center','center',{num:10})}];
    vals.forEach((o,k)=>{const {s,...x}=o;merge(V,SUM[k][0],V,SUM[k][1],undefined,s,x)});
    merge(V-1,SPR[0],V,SPR[1],undefined,T(9,'center','center',{num:164}),{f:calR?`IF(COUNT(${calR})=0,"",AVERAGE(${calR}))`:'""',v:calsOk.length?round2(calsOk.reduce((a,b)=>a+b,0)/calsOk.length):'',t:calsOk.length?undefined:'str'});
  });
  /* anchos (unidades de Excel) medidos del original */
  const cols=[];cols[0]=3.7;[8.0,7.5,8.23,7.86,7.86,5.11].forEach((w,k)=>cols[1+k]=w);
  for(let k=0;k<nD;k++)cols[C_D0+k]=1.71;[3.29,3.24,3.24,3.74].forEach((w,k)=>cols[C_T0+k]=w);
  const RW=[4.07,3.61,3.61,3.61,3.66,3.61,4.39,3.89];for(let k=0;k<nR;k++)cols[C_R0+k]=RW[k]||3.7;cols[C_PR]=4.57;
  const anchoPt=cols.reduce((a,w)=>a+w*7,0)*0.75;   /* el ancho guardado ya incluye el margen de la celda */
  const escala=Math.max(10,Math.min(100,Math.floor(Math.min(972/anchoPt,574/blockPt)*92)));
  /* estilos: se juntan el formato de la celda y sus bordes */
  const reg=new Map(),XF=[],FONTS=[],FKEY=new Map(),BORDERS=[],BKEY=new Map();
  const fontId=sz=>{const k=String(sz);if(!FKEY.has(k)){FKEY.set(k,FONTS.length+1);FONTS.push(`<font><sz val="${sz}"/><color rgb="FF000000"/><name val="${FO_FONT}"/><family val="3"/></font>`)}return FKEY.get(k)};
  const brdId=o=>{if(!o)return 0;const k=['l','r','t','b'].map(x=>o[x]||'').join('|');if(k==='|||')return 0;
    if(!BKEY.has(k)){BKEY.set(k,BORDERS.length+1);const e=(tag,w)=>w?`<${tag} style="${w}"><color rgb="FF000000"/></${tag}>`:`<${tag}/>`;BORDERS.push(`<border>${e('left',o.l)}${e('right',o.r)}${e('top',o.t)}${e('bottom',o.b)}<diagonal/></border>`)}return BKEY.get(k)};
  const xfId=(s,b)=>{s=s||T(7);const bi=brdId(b),key=JSON.stringify(s)+'#'+bi;if(reg.has(key))return reg.get(key);
    const al=`<alignment horizontal="${s.h}" vertical="${s.v}"${s.rot?` textRotation="${s.rot}"`:''}${s.wrap?' wrapText="1"':''}${s.shrink?' shrinkToFit="1"':''}${s.ind?` indent="${s.ind}"`:''}/>`;
    XF.push(`<xf numFmtId="${s.num||0}" fontId="${fontId(s.sz)}" fillId="${s.fill?2:0}" borderId="${bi}" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"${s.fill?' applyFill="1"':''}>${al}</xf>`);
    reg.set(key,XF.length);return XF.length};
  const nRows=Math.max(cells.length,bd.length),rowsOut=[];
  for(let r=0;r<nRows;r++){const row=[];for(let c=0;c<=LAST;c++){const o=cells[r]&&cells[r][c],b=bd[r]&&bd[r][c];if(!o&&!b)continue;const x=Object.assign({},o||{});x.s=xfId(x.s,b);row[c]=x}rowsOut[r]=row}
  const styles=foStyles(FONTS,BORDERS,XF);
  const sheet=foSheetXml(rowsOut,merges,heights,cols,LAST,breaks,escala,nRows);
  return foPackage(sheet,'Asistencias',`Formato oficial de asistencias — ${g.name} — ${scn}`,styles,anchors);
}
function foCellXml(r,c,o){
  if(!o)return '';const ref=colName(c)+(r+1),sa=o.s?` s="${o.s}"`:'';
  if(o.f!==undefined){
    const cached=o.v===''||o.v===undefined?'':(typeof o.v==='number'?`<v>${o.v}</v>`:`<v>${xmlEsc(o.v)}</v>`);
    return `<c r="${ref}"${sa}${o.t==='str'||typeof o.v==='string'?' t="str"':''}><f>${xmlEsc(o.f)}</f>${cached||(o.t==='str'?'<v></v>':'')}</c>`;
  }
  if(o.v===undefined||o.v===null||o.v==='')return sa?`<c r="${ref}"${sa}/>`:'';
  if(typeof o.v==='number'&&Number.isFinite(o.v))return `<c r="${ref}"${sa}><v>${o.v}</v></c>`;
  return `<c r="${ref}"${sa} t="inlineStr"><is><t xml:space="preserve">${xmlEsc(String(o.v))}</t></is></c>`;
}
function foSheetXml(rows,merges,heights,cols,LAST,breaks,escala,n){
  let data='';
  for(let r=0;r<n;r++){const row=rows[r]||[];let cells='';for(let c=0;c<=LAST;c++)cells+=foCellXml(r,c,row[c]);
    data+=`<row r="${r+1}"${heights[r]?` ht="${heights[r]}" customHeight="1"`:''}>${cells}</row>`}
  const colsXml='<cols>'+cols.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')+'</cols>';
  const brk=breaks.length?`<rowBreaks count="${breaks.length}" manualBreakCount="${breaks.length}">${breaks.map(b=>`<brk id="${b}" max="16383" man="1"/>`).join('')}</rowBreaks>`:'';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${XML_NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><dimension ref="A1:${colName(LAST)}${n}"/><sheetViews><sheetView showGridLines="0" workbookViewId="0" zoomScale="100"/></sheetViews><sheetFormatPr defaultRowHeight="15"/>${colsXml}<sheetData>${data}</sheetData><mergeCells count="${merges.length}">${merges.map(m=>`<mergeCell ref="${m}"/>`).join('')}</mergeCells><printOptions horizontalCentered="1"/><pageMargins left="0.25" right="0.25" top="0.25" bottom="0.25" header="0" footer="0"/><pageSetup paperSize="5" orientation="landscape" scale="${escala}"/>${brk}<drawing r:id="rId1"/></worksheet>`;
}
function foStyles(FONTS,BORDERS,XF){
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${XML_NS}"><numFmts count="1"><numFmt numFmtId="164" formatCode="0.00"/></numFmts><fonts count="${FONTS.length+1}"><font><sz val="10"/><color rgb="FF000000"/><name val="Arial"/><family val="2"/></font>${FONTS.join('')}</fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE3E3E3"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="${BORDERS.length+1}"><border><left/><right/><top/><bottom/><diagonal/></border>${BORDERS.join('')}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${XF.length+1}"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>${XF.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
}
function foPackage(sheetXml,sheetName,title,styles,anchors){
  const R='http://schemas.openxmlformats.org/officeDocument/2006/relationships',PR='http://schemas.openxmlformats.org/package/2006/relationships',CT='application/vnd.openxmlformats-officedocument.spreadsheetml',hdr='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return [
    ['[Content_Types].xml',hdr+`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/xl/workbook.xml" ContentType="${CT}.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="${CT}.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="${CT}.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>`],
    ['_rels/.rels',hdr+`<Relationships xmlns="${PR}"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="${PR}/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`],
    ['docProps/core.xml',hdr+`<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEsc(title)}</dc:title><dc:creator>${APP_NAME} ${EDITION}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().replace(/\.\d+Z$/,'Z')}</dcterms:created></cp:coreProperties>`],
    ['xl/workbook.xml',hdr+`<workbook xmlns="${XML_NS}" xmlns:r="${R}"><bookViews><workbookView activeTab="0"/></bookViews><sheets><sheet name="${xmlEsc(sheetName)}" sheetId="1" r:id="rId1"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`],
    ['xl/_rels/workbook.xml.rels',hdr+`<Relationships xmlns="${PR}"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${R}/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml',styles],
    ['xl/worksheets/sheet1.xml',sheetXml],
    ...foLogoParts(hdr,R,PR,anchors)
  ];
}

/* Logo del formato oficial del SIIE (Gobierno de Nayarit · Servicios de Educación Pública del Estado de Nayarit),
   tomado del PDF oficial; uno por hoja, arriba a la izquierda, 37 px de alto como en el original. */
function foLogoBytes(){const b=atob(FO_LOGO_SEPEN_B64),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
function foLogoParts(hdr,R,PR,anchors){
  const EMU=9525,alto=37,ancho=Math.round(alto*FO_LOGO_SEPEN_W/FO_LOGO_SEPEN_H),cx=ancho*EMU,cy=alto*EMU;
  const pics=(anchors&&anchors.length?anchors:[0]).map((row,i)=>`<xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>9525</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>19050</xdr:rowOff></xdr:from><xdr:ext cx="${cx}" cy="${cy}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${i+2}" name="Logo Nayarit ${i+1}" descr="Servicios de Educación Pública del Estado de Nayarit"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`).join('');
  const dr=hdr+`<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${R}">${pics}</xdr:wsDr>`;
  return [
    ['xl/worksheets/_rels/sheet1.xml.rels',hdr+`<Relationships xmlns="${PR}"><Relationship Id="rId1" Type="${R}/drawing" Target="../drawings/drawing1.xml"/></Relationships>`],
    ['xl/drawings/drawing1.xml',dr],
    ['xl/drawings/_rels/drawing1.xml.rels',hdr+`<Relationships xmlns="${PR}"><Relationship Id="rId1" Type="${R}/image" Target="../media/image1.png"/></Relationships>`],
    ['xl/media/image1.png',foLogoBytes()]
  ];
}
