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
  <p class="helper">${esc(g.name)} · Excel tamaño oficio horizontal, listo para imprimir. Revisa los datos del encabezado: lo que escribas se guarda para la próxima vez.</p>
  <div class="fo-grid">
    <label>Disciplina<select class="field" id="fo_sc" onchange="foSet('sc',this.value)">${scopes.map(s=>`<option value="${esc(s.id)}" ${s.id===d.sc?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>
    <label>Momento de registro<select class="field" id="fo_momento" onchange="foSet('momento',this.value)">${['1','2','3'].map(n=>`<option value="${n}" ${d.momento===n?'selected':''}>${FO_MOMENTO[n].charAt(0)+FO_MOMENTO[n].slice(1).toLowerCase()}</option>`).join('')}</select></label>
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
  if(c)c.innerHTML=days.length?`Saldrán <b>${nList} ${nList===1?'día':'días'} con lista</b>${nNC?` y <b>${nNC} sin clases</b>`:''} en esas fechas${d.soloClase&&cls.length&&inRange!==days.length?` (de ${inRange} con registro, contando solo los días de clase)`:''}, con <b>${n} alumnos</b>.${days.length>31?' La hoja se hace más ancha para que quepan, y sigue saliendo en una página de ancho.':''}`
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

/* ---------- Excel ---------- */
function foXlsxFiles(g,d,days){
  const ros=roster(g),scn=scopeName(g,d.sc),RS=foRasgos(g,d.sc,d.momento);
  const withJ=state.settings.attRule==='withJustified';
  const nD=Math.max(31,days.length),nR=Math.max(4,RS.items.length);
  const C_NUM=0,C_NAME=1,C_D0=2,C_T0=C_D0+nD,C_R0=C_T0+4,C_CAL=C_R0+nR,LAST=C_CAL;
  /* estilos (ver foStyles): índices de cellXfs */
  const S={TITLE:1,ESC:2,BOXL:3,BOXV:4,DISC:5,PROF:6,HDR:7,HROT:8,LET:9,DROT:10,MARK:11,NAME:12,NUM:13,INT:14,PCT:15,DEC:16,DECB:17,SPACED:18,NOTE:19,BORDER:20,
    RES:21,SIGLINE:22,SIGLBL:23,SEAL:24,PCTB:25,NC:{6:26,7:27,8:28,9:29}};
  const FO_TITULO_COL0=Math.min(C_D0+10,LAST);
  const rows=[],merges=[],heights={};
  const put=(r,c,o)=>{(rows[r]=rows[r]||[])[c]=o};
  const box=(r,c,o)=>put(r,c,typeof o==='object'?o:{v:o,s:S.BORDER});
  const merge=(r1,c1,r2,c2,o)=>{put(r1,c1,o);for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++)if(r!==r1||c!==c1)put(r,c,{s:o.s});if(r1!==r2||c1!==c2)merges.push(colName(c1)+(r1+1)+':'+colName(c2)+(r2+1))};
  /* 1–3: títulos */
  ['SISTEMA INTEGRAL INFORMATIVA EDUCATIVA','LISTA PARA EL REGISTRO DE ASISTENCIAS Y CALIFICACIONES','SERVICIOS DE EDUCACION PUBLICA DEL ESTADO DE NAYARIT']
    .forEach((t,i)=>{merge(i,FO_TITULO_COL0,i,LAST,{v:t,s:S.TITLE});heights[i]=20});   /* a la derecha del logo de Nayarit */
  /* 4–5: escuela, recuadros y servicio escolar */
  merge(3,C_NUM,4,C_NAME,{v:String(d.escuela||'').toUpperCase(),s:S.ESC});
  const boxes=[['CLAVE DEL C.C.T.',String(d.cct||'').toUpperCase()],['SECTOR',d.sector],['ZONA ESCOLAR',d.zona],['GRADO',d.grado],['GRUPO',String(d.grupo||'').toUpperCase()],['TURNO',String(d.turno||'').toUpperCase()]];
  boxes.forEach(([l,v],k)=>{const a=C_D0+Math.floor(k*nD/6),b=C_D0+Math.floor((k+1)*nD/6)-1;merge(3,a,3,b,{v:l,s:S.BOXL});merge(4,a,4,b,{v:v||'',s:S.BOXV})});
  merge(3,C_T0,3,LAST,{v:'SERVICIO ESCOLAR',s:S.BOXL});merge(4,C_T0,4,LAST,{v:d.ciclo||'',s:S.BOXV});
  heights[3]=13;heights[4]=24;
  /* 6–7: disciplina, profesor y momento */
  const mid=C_D0+Math.floor(nD*0.6);
  merge(5,C_NUM,5,mid,{v:'DISCIPLINA: '+String(scn).toUpperCase(),s:S.DISC});
  merge(6,C_NUM,6,mid,{v:'NOMBRE DEL PROFESOR: '+String(d.profesor||'').toUpperCase(),s:S.PROF});
  merge(5,C_T0,5,LAST,{v:'MOMENTO DE REGISTRO DE EVALUACIÓN',s:S.BOXL});merge(6,C_T0,6,LAST,{v:FO_MOMENTO[d.momento]||'',s:S.BOXV});
  heights[5]=26;heights[6]=20;
  /* 8–10: cabeza de la tabla */
  const H0=7;
  merge(H0,C_NUM,H0+2,C_NUM,{v:'NUM. DE LISTA',s:S.HROT});
  merge(H0,C_NAME,H0+2,C_NAME,{v:'NOMBRE DEL ALUMNO',s:S.HDR});
  merge(H0,C_D0,H0,C_T0-1,{v:'A S I S T E N C I A S',s:S.SPACED});
  for(let i=0;i<nD;i++){
    const iso=days[i];
    put(H0+1,C_D0+i,{v:iso?FO_LETRA[foDateObj(iso).getDay()]:'',s:S.LET});
    put(H0+2,C_D0+i,{v:iso?foDateObj(iso).toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}):'',s:S.DROT});
  }
  ['ASISTENCIAS','FALTAS JUSTIFICADAS','FALTAS INJUSTIFICADAS','% ASISTENCIA'].forEach((t,k)=>merge(H0,C_T0+k,H0+2,C_T0+k,{v:t,s:S.HROT}));
  merge(H0,C_R0,H0,C_CAL-1,{v:'RASGOS',s:S.HDR});
  for(let k=0;k<nR;k++){const x=RS.items[k];merge(H0+1,C_R0+k,H0+2,C_R0+k,{v:x?String(x.it.name).toUpperCase()+(RS.R.pct?` (${numfmt(x.it.w)} %)`:''):'',s:S.HROT})}
  merge(H0,C_CAL,H0+2,C_CAL,{v:'CALIFICACIÓN',s:S.HROT});
  heights[H0]=18;heights[H0+1]=15;heights[H0+2]=118;
  /* alumnos */
  const MARK={P:'.',F:'/',FI:'/',FJ:'J'};
  ros.forEach((st,i)=>{
    const r=H0+3+i,R1=r+1,rng=`${colName(C_D0)}${R1}:${colName(C_T0-1)}${R1}`;
    put(r,C_NUM,{v:i+1,s:S.NUM});put(r,C_NAME,{v:String(st.name).toUpperCase(),s:S.NAME});
    let P=0,J=0,I=0,n=0;
    for(let k=0;k<nD;k++){
      const iso=days[k];if(iso&&scGet(g,iso))continue;   /* columna «sin clases»: se llena abajo */
      const x=iso?(state.attendance[g.id+'|'+iso]||{})[st.id]:undefined,m=x?MARK[x]:'';
      if(m){n++;if(m==='.')P++;else if(m==='J')J++;else I++}
      put(r,C_D0+k,{v:m,s:S.MARK});
    }
    const cA=colName(C_T0)+R1,cJ=colName(C_T0+1)+R1,cI=colName(C_T0+2)+R1;
    put(r,C_T0,{f:`COUNTIF(${rng},".")`,v:P,s:S.INT});
    put(r,C_T0+1,{f:`COUNTIF(${rng},"J")`,v:J,s:S.INT});
    put(r,C_T0+2,{f:`COUNTIF(${rng},"/")`,v:I,s:S.INT});
    /* % sobre los días en que el alumno tiene marca (sin COUNTA: no cuenta las leyendas de «sin clases») */
    put(r,C_T0+3,{f:`IF((${cA}+${cJ}+${cI})=0,"",${withJ?`(${cA}+${cJ})`:cA}/(${cA}+${cJ}+${cI}))`,v:n?((withJ?P+J:P)/n):'',t:n?undefined:'str',s:S.PCT});
    for(let k=0;k<nR;k++){const x=RS.items[k],v=x?foRasgoValue(st,x):null;put(r,C_R0+k,{v:v===null?'':v,s:S.DEC})}
    const cal=averageInScope(g,{id:d.sc},st,RS.acts);put(r,C_CAL,{v:cal===null?'':round2(cal),s:S.DECB});
    heights[r]=15;
  });
  const F0=H0+3,FL=H0+2+ros.length,end=H0+3+ros.length;
  /* columnas «sin clases»: casillas combinadas con la leyenda girada y fondo gris */
  if(ros.length)days.forEach((iso,k)=>{const x=scGet(g,iso);if(!x)return;const ley=scLeyenda(x)||'SIN CLASES';
    const altoPt=ros.length*15-6,size=Math.max(6,Math.min(9,Math.floor(altoPt/(ley.length*0.72))));
    merge(F0,C_D0+k,FL,C_D0+k,{v:ley,s:S.NC[size]})});
  /* resumen del grupo y firmas (una fila en blanco después del último alumno) */
  let notaFila=end+1;
  if(ros.length){
    const Q=end+1,colF=c=>colName(c),cal=`${colF(C_CAL)}${F0+1}:${colF(C_CAL)}${FL+1}`,nom=`${colF(C_NAME)}${F0+1}:${colF(C_NAME)}${FL+1}`;
    const sumJ=`SUM(${colF(C_T0+1)}${F0+1}:${colF(C_T0+1)}${FL+1})`,sumI=`SUM(${colF(C_T0+2)}${F0+1}:${colF(C_T0+2)}${FL+1})`;
    const cals=ros.map(st=>{const v=averageInScope(g,{id:d.sc},st,RS.acts);return v===null?null:round2(v)}).filter(v=>v!==null);
    const nAp=cals.filter(v=>v>=6).length,nRe=cals.filter(v=>v<6).length,reales=days.filter(x=>!scGet(g,x)).length,prog=foProgramadas(g,d,days);
    let totJ=0,totI=0;ros.forEach(st=>days.forEach(iso=>{if(scGet(g,iso))return;const x=(state.attendance[g.id+'|'+iso]||{})[st.id];if(x==='FJ')totJ++;else if(x==='F'||x==='FI')totI++}));
    const tot=totJ+totI,span=k=>[C_D0+Math.floor(k*nD/9),C_D0+Math.floor((k+1)*nD/9)-1];
    const cell=(k,row)=>colF(span(k)[0])+(row+1);
    merge(Q,C_NUM,Q+2,C_NAME,{v:'RESUMEN DEL GRUPO',s:S.RES});
    [['Aprobación',0,1],['Reprobación',2,3],['Días de clases',4,5],['Inasistencias',6,7]].forEach(([t,a,b])=>merge(Q,span(a)[0],Q,span(b)[1],{v:t,s:S.HDR}));
    merge(Q,span(8)[0],Q+1,span(8)[1],{v:'Promedio General',s:S.HDR});
    ['Alumnos','Porcentaje','Alumnos','Porcentaje','Programadas','Reales','Total','Porcentaje'].forEach((t,k)=>merge(Q+1,span(k)[0],Q+1,span(k)[1],{v:t,s:S.HDR}));
    const V=Q+2,pct=(a,b)=>b?a/b:'';
    const vals=[
      {f:`COUNTIF(${cal},">=6")`,v:nAp,s:S.INT},
      {f:`IF(COUNT(${cal})=0,"",${cell(0,V)}/COUNT(${cal}))`,v:pct(nAp,cals.length),t:cals.length?undefined:'str',s:S.PCTB},
      {f:`COUNTIF(${cal},"<6")`,v:nRe,s:S.INT},
      {f:`IF(COUNT(${cal})=0,"",${cell(2,V)}/COUNT(${cal}))`,v:pct(nRe,cals.length),t:cals.length?undefined:'str',s:S.PCTB},
      {v:prog,s:S.INT},{v:reales,s:S.INT},
      {f:`${sumJ}+${sumI}`,v:tot,s:S.INT},
      {f:`IF(COUNTA(${nom})*${cell(5,V)}=0,"",${cell(6,V)}/(COUNTA(${nom})*${cell(5,V)}))`,v:pct(tot,ros.length*reales),t:ros.length*reales?undefined:'str',s:S.PCTB}];
    vals.forEach((o,k)=>merge(V,span(k)[0],V,span(k)[1],o));
    merge(V,span(8)[0],V,span(8)[1],{f:`IF(COUNT(${cal})=0,"",AVERAGE(${cal}))`,v:cals.length?round2(cals.reduce((a,b)=>a+b,0)/cals.length):'',t:cals.length?undefined:'str',s:S.DECB});
    /* firmas y sello a la derecha, en las mismas filas */
    /* Vo.Bo. sobre ASISTENCIAS…FALTAS INJ.; un espacio (% ASISTENCIA); Profesor sobre la mitad de los rasgos; un espacio; sello hasta CALIFICACIÓN */
    const w2=Math.max(2,Math.floor(nR/2)),s1a=C_T0,s1b=C_T0+2,s2a=C_R0,s2b=C_R0+w2-1,sea=C_R0+w2+1;
    merge(Q,s1a,Q+1,s1b,{v:'',s:S.SIGLINE});merge(Q+2,s1a,Q+2,s1b,{v:'Vo.Bo. Subdirector',s:S.SIGLBL});
    merge(Q,s2a,Q+1,s2b,{v:'',s:S.SIGLINE});merge(Q+2,s2a,Q+2,s2b,{v:'Firma del Profesor',s:S.SIGLBL});
    merge(Q,Math.min(sea,LAST),Q+2,LAST,{v:'Sello de la Escuela',s:S.SEAL});
    heights[Q]=18;heights[Q+1]=24;heights[Q+2]=22;
    notaFila=Q+4;
  }
  merge(notaFila,C_NUM,notaFila,LAST,{v:`Marcas: «.» asistencia · «/» falta (injustificada o sin clasificar) · «J» falta justificada. % de asistencia = ${withJ?'(asistencias + justificadas)':'asistencias'} ÷ días en que el alumno tiene marca (los días «sin clases» no cuentan). Rasgos y calificación: promedio de 0 a 10 del ${FO_MOMENTO[d.momento].toLowerCase()}; las actividades sin calificar se cuentan como 0. No son calificaciones oficiales hasta que el docente las revise.`,s:S.NOTE});
  heights[notaFila]=30;
  /* anchos */
  const cols=[];cols[C_NUM]=4.6;cols[C_NAME]=34;for(let k=0;k<nD;k++)cols[C_D0+k]=3.3;for(let k=0;k<4;k++)cols[C_T0+k]=k===3?6.5:5;for(let k=0;k<nR;k++)cols[C_R0+k]=6;cols[C_CAL]=7;
  return foPackage(foSheetXml(rows,merges,heights,cols,LAST,H0,true),'Asistencias',`Formato oficial de asistencias — ${g.name} — ${scn}`,true);
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
function foSheetXml(rows,merges,heights,cols,LAST,H0,conLogo){
  const n=rows.length;let data='';
  for(let r=0;r<n;r++){const row=rows[r]||[];let cells='';for(let c=0;c<=LAST;c++)cells+=foCellXml(r,c,row[c]);
    data+=`<row r="${r+1}"${heights[r]?` ht="${heights[r]}" customHeight="1"`:''}>${cells}</row>`}
  const colsXml='<cols>'+cols.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')+'</cols>';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${XML_NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:${colName(LAST)}${n}"/><sheetViews><sheetView showGridLines="0" workbookViewId="0" zoomScale="90"><pane xSplit="2" ySplit="${H0+3}" topLeftCell="C${H0+4}" activePane="bottomRight" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>${colsXml}<sheetData>${data}</sheetData><mergeCells count="${merges.length}">${merges.map(m=>`<mergeCell ref="${m}"/>`).join('')}</mergeCells><printOptions horizontalCentered="1"/><pageMargins left="0.25" right="0.25" top="0.35" bottom="0.35" header="0.2" footer="0.2"/><pageSetup paperSize="5" orientation="landscape" fitToWidth="1" fitToHeight="0"/>${conLogo?'<drawing r:id="rId1"/>':''}</worksheet>`;
}
function foStyles(){
  const font=(sz,b)=>`<font>${b?'<b/>':''}<sz val="${sz}"/><color rgb="FF000000"/><name val="Arial"/><family val="2"/></font>`;
  const fonts=[font(9),font(11,1),font(12,1),font(7),font(14,1),font(16,1),font(9,1),font(8,1),font(6,1),font(7,1),font(8,1),font(9,1)];   /* 8–11: leyendas «sin clases» 6–9 pt */
  const al=(h,v,o)=>`<alignment horizontal="${h}" vertical="${v||'center'}"${o&&o.rot?` textRotation="${o.rot}"`:''}${o&&o.wrap?' wrapText="1"':''}/>`;
  const xf=(num,f,b,align,fill)=>`<xf numFmtId="${num}" fontId="${f}" fillId="${fill||0}" borderId="${b}" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"${fill?' applyFill="1"':''}>${align}</xf>`;
  const x=[
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
    xf(0,1,0,al('center')),                      /* 1 TITLE */
    xf(0,2,1,al('left','center',{wrap:1})),      /* 2 ESC */
    xf(0,3,1,al('center','center',{wrap:1})),    /* 3 BOXL */
    xf(0,4,1,al('center')),                      /* 4 BOXV */
    xf(0,5,0,al('left')),                        /* 5 DISC */
    xf(0,6,0,al('left')),                        /* 6 PROF */
    xf(0,7,1,al('center','center',{wrap:1})),    /* 7 HDR */
    xf(0,7,1,al('center','center',{rot:90,wrap:1})), /* 8 HROT */
    xf(0,6,1,al('center')),                      /* 9 LET */
    xf(0,3,1,al('center','center',{rot:90,wrap:1})), /* 10 DROT */
    xf(0,6,1,al('center')),                      /* 11 MARK */
    xf(0,0,1,al('left')),                        /* 12 NAME */
    xf(0,0,1,al('center')),                      /* 13 NUM */
    xf(1,0,1,al('center')),                      /* 14 INT */
    xf(9,0,1,al('center')),                      /* 15 PCT */
    xf(164,0,1,al('center')),                    /* 16 DEC */
    xf(164,6,1,al('center')),                    /* 17 DECB */
    xf(0,6,1,al('center')),                      /* 18 SPACED */
    xf(0,3,0,al('left','top',{wrap:1})),         /* 19 NOTE */
    xf(0,0,1,al('center')),                      /* 20 BORDER */
    xf(0,2,0,al('center','center',{wrap:1})),    /* 21 RES «RESUMEN DEL GRUPO» */
    xf(0,0,2,al('center','bottom')),             /* 22 SIGLINE: solo borde inferior */
    xf(0,9,0,al('center','top',{wrap:1})),       /* 23 SIGLBL (7 pt) */
    xf(0,3,1,al('center','bottom',{wrap:1})),    /* 24 SEAL */
    xf(10,6,1,al('center')),                     /* 25 PCTB 0.00 % */
    xf(0,8,1,al('center','center',{rot:90,wrap:1}),2),  /* 26 NC 6 pt */
    xf(0,9,1,al('center','center',{rot:90,wrap:1}),2),  /* 27 NC 7 pt */
    xf(0,10,1,al('center','center',{rot:90,wrap:1}),2), /* 28 NC 8 pt */
    xf(0,11,1,al('center','center',{rot:90,wrap:1}),2)  /* 29 NC 9 pt */
  ];
  const thin='<left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right><top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/>';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${XML_NS}"><numFmts count="1"><numFmt numFmtId="164" formatCode="0.00"/></numFmts><fonts count="${fonts.length}">${fonts.join('')}</fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE3E3E3"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border><border>${thin}</border><border><left/><right/><top/><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${x.length}">${x.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
}
function foPackage(sheetXml,sheetName,title,conLogo){
  const R='http://schemas.openxmlformats.org/officeDocument/2006/relationships',PR='http://schemas.openxmlformats.org/package/2006/relationships',CT='application/vnd.openxmlformats-officedocument.spreadsheetml',hdr='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return [
    ['[Content_Types].xml',hdr+`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${conLogo?'<Default Extension="png" ContentType="image/png"/>':''}<Override PartName="/xl/workbook.xml" ContentType="${CT}.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="${CT}.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="${CT}.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>${conLogo?'<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>':''}</Types>`],
    ['_rels/.rels',hdr+`<Relationships xmlns="${PR}"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="${PR}/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`],
    ['docProps/core.xml',hdr+`<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEsc(title)}</dc:title><dc:creator>${APP_NAME} ${EDITION}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().replace(/\.\d+Z$/,'Z')}</dcterms:created></cp:coreProperties>`],
    ['xl/workbook.xml',hdr+`<workbook xmlns="${XML_NS}" xmlns:r="${R}"><bookViews><workbookView activeTab="0"/></bookViews><sheets><sheet name="${xmlEsc(sheetName)}" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Titles" localSheetId="0">'${sheetName}'!$8:$10</definedName></definedNames><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`],
    ['xl/_rels/workbook.xml.rels',hdr+`<Relationships xmlns="${PR}"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${R}/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml',foStyles()],
    ['xl/worksheets/sheet1.xml',sheetXml],
    ...(conLogo?foLogoParts(hdr,R,PR):[])
  ];
}

/* Logo de los Servicios de Educación Pública del Estado de Nayarit: el PNG va tal cual (sin redimensionar ni
   comprimir) en xl/media/image1.png, anclado en A1 con 72 px de alto y el ancho proporcional. */
function foLogoBytes(){const b=atob(FO_LOGO_SEPEN_B64),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
function foLogoParts(hdr,R,PR){
  const EMU=9525,alto=72,ancho=Math.round(alto*FO_LOGO_SEPEN_W/FO_LOGO_SEPEN_H),cx=ancho*EMU,cy=alto*EMU;
  const dr=hdr+`<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${R}"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>38100</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>28575</xdr:rowOff></xdr:from><xdr:ext cx="${cx}" cy="${cy}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="Logo SEPEN Nayarit" descr="Servicios de Educación Pública del Estado de Nayarit"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>`;
  return [
    ['xl/worksheets/_rels/sheet1.xml.rels',hdr+`<Relationships xmlns="${PR}"><Relationship Id="rId1" Type="${R}/drawing" Target="../drawings/drawing1.xml"/></Relationships>`],
    ['xl/drawings/drawing1.xml',dr],
    ['xl/drawings/_rels/drawing1.xml.rels',hdr+`<Relationships xmlns="${PR}"><Relationship Id="rId1" Type="${R}/image" Target="../media/image1.png"/></Relationships>`],
    ['xl/media/image1.png',foLogoBytes()]
  ];
}
