#!/usr/bin/env python3
"""Convierte el HTML de Mi Bitácora Secundaria (versión para laptop) en la versión para tablet.

Uso:
    python3 herramientas/hacer_tablet.py fuente/MiBitacora_Secundaria_v0.13.0_laptop.html index.html

Cada cambio busca un texto exacto del original. Si el original cambia y algún texto ya no
aparece, el script se detiene y dice cuál, para que nunca salga una versión a medias.
No toca la forma en que se guardan los datos ni el formato de los respaldos.
"""
import sys

ORIGEN, DESTINO = sys.argv[1], sys.argv[2]
html = open(ORIGEN, encoding='utf-8').read()


def cambia(viejo, nuevo, veces=1):
    global html
    n = html.count(viejo)
    if n != veces:
        sys.exit(f'ERROR: se esperaban {veces} coincidencia(s) y hay {n} de:\n  {viejo[:120]}')
    html = html.replace(viejo, nuevo)


# ---------------------------------------------------------------- disciplina «Integración Curricular»
# No pertenece a un solo campo formativo: se agrega con su propia sección («Integración de los campos
# formativos») y su color, para elegirla en cualquier grupo como cualquier otra disciplina.
cambia("{id:'dhc',name:'De lo Humano y lo Comunitario',sheet:'Humano y Comunitario'}];",
       "{id:'dhc',name:'De lo Humano y lo Comunitario',sheet:'Humano y Comunitario'},\n"
       "  {id:'icu_campos',name:'Integración de los campos formativos',sheet:'Integración curricular'}];")
cambia("{id:'tut',name:'Educación Socioemocional / Tutoría',campo:'dhc',sheet:'Tutoría y Socioemocional'}];",
       "{id:'tut',name:'Educación Socioemocional / Tutoría',campo:'dhc',sheet:'Tutoría y Socioemocional'},\n"
       "  {id:'icu',name:'Integración Curricular',campo:'icu_campos'}];")
cambia("Secundaria:['#1E3F78','#2F5FA7','#6F95CE','#D8A45A']}",
       "Secundaria:['#1E3F78','#2F5FA7','#6F95CE','#D8A45A','#5B6B85']}")

# ---------------------------------------------------------------- PDA ocultos por ahora (los datos NO se borran)
# Se ocultan la pestaña «Avance por PDA», las casillas de PDA al crear actividades, la columna PDA de las
# rúbricas y la sección de la ficha. Para volver a mostrarlos basta con poner PDA_VISIBLES = True.
PDA_VISIBLES = False
if not PDA_VISIBLES:
    cambia("function pdaEnabled(){return EDITION!=='Primaria'}", "function pdaEnabled(){return false}")
    cambia("['pda','🎯 Avance por PDA'],['opciones','⚙️ Opciones del cuaderno']",
           "['opciones','⚙️ Opciones del cuaderno']")
    cambia("if(EDITION==='Primaria')VIEWS.pda=function", "if(!pdaEnabled())VIEWS.pda=function")
    # Al corregir una actividad o su rúbrica se conservan los PDA que ya tenía ligados
    cambia("Object.assign(a,{name:d.name,date:d.date,max:d.max,mode:d.mode,counts:d.counts,pdas:d.pdas,notes})",
           "Object.assign(a,{name:d.name,date:d.date,max:d.max,mode:d.mode,counts:d.counts,"
           "pdas:pdaEnabled()?d.pdas:(a.pdas||[]),notes})")
    cambia("const valid=new Set(pdaList(group(),a.scopeId).map(x=>x.id));r.criteria.forEach(c=>{if(!valid.has(c.pda))c.pda=''});",
           "if(pdaEnabled()){const valid=new Set(pdaList(group(),a.scopeId).map(x=>x.id));r.criteria.forEach(c=>{if(!valid.has(c.pda))c.pda=''})}"
           "else{const old=new Map(((a.rubric&&a.rubric.criteria)||[]).map(c=>[c.id,c.pda||'']));r.criteria.forEach(c=>{c.pda=old.get(c.id)||''})}")

# ---------------------------------------------------------------- cabecera (instalable)
cambia('<meta name="viewport" content="width=device-width,initial-scale=1">',
       '<meta name="viewport" content="width=device-width,initial-scale=1,interactive-widget=resizes-content">'
       '<meta name="theme-color" content="#1E3F78">'
       '<meta name="mobile-web-app-capable" content="yes">'
       '<meta name="apple-mobile-web-app-capable" content="yes">'
       '<meta name="apple-mobile-web-app-title" content="Mi Bitácora">'
       '<link rel="manifest" href="manifest.webmanifest">'
       '<link rel="apple-touch-icon" href="icono-192.png">')

# ---------------------------------------------------------------- barra flotante abajo (con botón Equipos)
INICIO_NAV = '<button class="nav on" data-view="inicio">'
FIN_NAV = 'Mis datos y colores</button></div></div>'
a, b = html.find(INICIO_NAV), html.find(FIN_NAV)
if a < 0 or b < 0 or html.count(INICIO_NAV) != 1 or html.count(FIN_NAV) != 1:
    sys.exit('ERROR: no encontré los botones del menú de arriba')
html = html[:a] + html[b + len(FIN_NAV):]


def boton(vista, icono, texto, on=False):
    return (f'<button class="nav{" on" if on else ""}" data-view="{vista}"><span class="ic" data-ico="{icono}"></span>'
            f'<span class="lbl">{texto}</span></button>')


DOCK = ('<nav class="dock" id="dock" aria-label="Menú principal"><span class="dock-pill" aria-hidden="true"></span>'
        + boton('inicio', 'home', 'Inicio', True) + boton('alumnos', 'users', 'Mi grupo')
        + boton('asistencia', 'attendance', 'Asistencia') + boton('cuadricula', 'grades', 'Calificaciones')
        + boton('actividades', 'activities', 'Actividades')
        + boton('equipos', 'ruleta', 'Equipos')
        + '<div class="more-wrap"><button class="nav" id="moreBtn" aria-haspopup="true" aria-expanded="false" '
          'onclick="toggleMenu()"><span class="ic" data-ico="more"></span><span class="lbl">Más</span></button>'
          '<div class="more-menu" id="moreMenu" hidden>'
          '<button data-view="horario"><span class="ic" data-ico="calendar"></span> &nbsp;Mi horario</button>'
          '<button data-view="datos"><span class="ic" data-ico="save"></span> &nbsp;Copias de seguridad</button>'
          '<button data-view="perfil"><span class="ic" data-ico="settings"></span> &nbsp;Mis datos y colores</button>'
          '</div></div></nav>')
cambia('<div id="content"></div></main></div><script>', '<div id="content"></div></main></div>' + DOCK + '<script>')
cambia("document.querySelectorAll('.side > .nav[data-view]')", "document.querySelectorAll('.dock > .nav[data-view]')")
cambia("NAV_TOP={inicio:'inicio',", "NAV_TOP={inicio:'inicio',ruleta:'equipos',equipos:'equipos',")
cambia("actividades:'cuadricula',libreta:'cuadricula'", "actividades:'actividades',libreta:'cuadricula'")

# ---------------------------------------------------------------- estilos para pantalla táctil
CSS_TABLET = r"""
/* ===== 95_tablet.css — uso con el dedo en tablet (Huawei MatePad 12 X y similares) ===== */
html{touch-action:manipulation;-webkit-text-size-adjust:100%}
body{-webkit-tap-highlight-color:transparent}
/* Arriba solo queda el logotipo y los botones A+ y ?; ya no se queda fijo al bajar */
.side{position:relative;flex-wrap:nowrap;min-height:64px}
.main{padding-bottom:calc(120px + env(safe-area-inset-bottom))!important}
#toasts{bottom:calc(112px + env(safe-area-inset-bottom))}
/* ===== Barra flotante de abajo, efecto vidrio ===== */
.dock{position:fixed;left:0;right:0;margin:0 auto;width:max-content;max-width:calc(100vw - 24px);
  bottom:calc(16px + env(safe-area-inset-bottom));z-index:90;display:flex;align-items:center;gap:2px;padding:7px;
  border-radius:32px;isolation:isolate;
  transition:transform .4s cubic-bezier(.2,.9,.3,1.15),opacity .25s ease}
.dock::before{content:"";position:absolute;inset:0;z-index:-2;border-radius:inherit;
  background:linear-gradient(180deg,rgba(255,255,255,.66),rgba(255,255,255,.40));
  -webkit-backdrop-filter:blur(26px) saturate(190%);backdrop-filter:blur(26px) saturate(190%);
  border:1px solid rgba(255,255,255,.78);
  box-shadow:0 20px 44px -14px rgba(16,36,72,.38),0 2px 8px rgba(16,36,72,.08),
    inset 0 1px 0 rgba(255,255,255,.95),inset 0 -1px 2px rgba(255,255,255,.35),inset 0 0 0 .5px rgba(30,63,120,.08)}
.dock::after{content:"";position:absolute;left:14px;right:14px;top:1px;height:46%;z-index:-1;border-radius:30px 30px 18px 18px;pointer-events:none;
  background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,0))}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.dock::before{background:rgba(250,252,255,.94)}}
.dock .nav{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
  min-width:86px;height:64px;padding:6px 12px;border:0;border-radius:25px;background:transparent!important;
  color:#3E5373;font-size:13px;font-weight:700;letter-spacing:.01em;white-space:nowrap;
  transition:color .25s ease,transform .15s ease}
.dock .nav .svgi{width:25px;height:25px;color:#2F5FA7;transition:transform .3s cubic-bezier(.3,1.4,.5,1)}
.dock .nav.on{color:#1E3F78}
.dock .nav.on .svgi{color:#1E3F78;transform:translateY(-1px) scale(1.08)}
.dock .nav:active{transform:scale(.93)}
.dock-pill{position:absolute;top:0;left:0;z-index:-1;border-radius:25px;pointer-events:none;opacity:0;
  background:linear-gradient(180deg,rgba(47,95,167,.22),rgba(47,95,167,.10));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.85),inset 0 0 0 1px rgba(47,95,167,.16),0 6px 14px -6px rgba(30,63,120,.45);
  transition:transform .5s cubic-bezier(.3,1.3,.5,1),width .5s cubic-bezier(.3,1.3,.5,1),opacity .2s}
.dock .more-wrap{position:relative}
.dock .more-menu{top:auto;bottom:calc(100% + 16px);right:-7px;left:auto;min-width:250px;padding:8px;border-radius:24px;
  background:rgba(255,255,255,.80);-webkit-backdrop-filter:blur(26px) saturate(180%);backdrop-filter:blur(26px) saturate(180%);
  border:1px solid rgba(255,255,255,.85);box-shadow:0 20px 44px -14px rgba(16,36,72,.38),inset 0 1px 0 #fff}
.dock .more-menu button{border-radius:16px}
.big-text .dock{zoom:1.1}
@media(max-width:760px){.dock .nav{min-width:72px;padding:6px 8px;font-size:12px}}
/* Mientras escribes, la barra se esconde para no tapar el teclado */
body.typing .dock{transform:translateY(160%);opacity:0;pointer-events:none}
@media print{.dock{display:none!important}}
@media(prefers-reduced-motion:reduce){.dock,.dock-pill,.dock .nav,.dock .nav .svgi{transition:none}}
/* Temas: Alegre y Personalizado usan su color; Oscuro, vidrio oscuro */
body.themed .dock .nav.on,body.themed .dock .nav.on .svgi{color:var(--accent-dark,#1E3F78)}
body.themed .dock .nav .svgi{color:var(--accent,#2F5FA7)}
body.themed .dock-pill{background:color-mix(in srgb,var(--accent,#2F5FA7) 18%,transparent)}
body.theme-dark .dock::before{background:linear-gradient(180deg,rgba(44,58,82,.66),rgba(18,26,40,.52));border-color:rgba(255,255,255,.14);
  box-shadow:0 20px 44px -14px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.18),inset 0 -1px 2px rgba(255,255,255,.05)}
body.theme-dark .dock::after{background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,0))}
body.theme-dark .dock .nav{color:#B9C8DD}
body.theme-dark .dock .nav .svgi{color:#8FB0E6}
body.theme-dark .dock .nav.on,body.theme-dark .dock .nav.on .svgi{color:#fff}
body.theme-dark .dock-pill{background:linear-gradient(180deg,rgba(130,170,240,.30),rgba(130,170,240,.14));box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 6px 14px -6px #000}
body.theme-dark .dock .more-menu{background:rgba(26,36,52,.85);border-color:rgba(255,255,255,.14);box-shadow:0 20px 44px -14px rgba(0,0,0,.6)}
/* Botones y casillas cómodos para el dedo (mínimo 44 px) */
.tool-btn{min-width:46px;min-height:46px}
.toast-x{min-width:44px;min-height:44px}
.more-menu button,.colmenu button{min-height:48px}
.mini{min-height:42px;padding:8px 14px}
.seg-b{min-height:44px;padding:8px 16px}
.linkbtn{min-height:40px;padding-top:8px;padding-bottom:8px}
.att-toggle{min-height:48px;padding:8px 4px}
.att-btn{min-height:44px;padding:9px 14px}
.att-card{padding:16px}
summary{min-height:44px;display:flex;align-items:center;gap:8px}
select,.field{min-height:46px}
input[type=checkbox],input[type=radio]{width:24px;height:24px;flex:none}
label:has(>input[type=checkbox]),label:has(>input[type=radio]){min-height:40px}
.eval-st{min-height:48px}
/* Cuadrícula de notas: filas más altas para tocar sin equivocarse */
.sheet-wrap.dens-compact{--rowh:44px}
.sheet-wrap.dens-normal{--rowh:50px}
.sheet-wrap.dens-wide{--rowh:58px}
.gradegrid .colbtn{min-height:52px}
.gradegrid .gh-name{-webkit-hyphens:auto;hyphens:auto;word-break:normal;overflow-wrap:normal}
.sheet-wrap{-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}
/* Copias automáticas: lista de puntos de regreso */
.snap-list{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.snap-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:10px 12px;background:rgba(255,255,255,.65);border-radius:12px}
.snap-row small{display:block;color:#56708F;font-weight:500;margin-top:2px}
body.theme-dark .snap-row{background:rgba(255,255,255,.05)}
body.theme-dark .snap-row small{color:#9FB2CB}
"""
cambia('</style></head>', CSS_TABLET + '</style></head>')

# ---------------------------------------------------------------- textos: tablet en lugar de computadora
cambia('Mi Bitácora Secundaria · v0.13.0<br>Datos guardados en este navegador',
       'Mi Bitácora Secundaria · v0.13.0 · Tablet 1.5<br>Datos guardados en esta tablet')
cambia("'Escribe las notas como en una hoja de Excel: Tab pasa a la derecha y Enter baja.'",
       "'Toca una casilla y escribe la nota. La tecla «Siguiente» del teclado baja al siguiente alumno.'")
cambia("'Escribe cada nota en su casilla. Tab pasa a la derecha y Enter baja.'",
       "'Toca una casilla y escribe la nota. La tecla «Siguiente» del teclado baja al siguiente alumno.'")
cambia('cada toque cambia la marca (o usa las teclas 1, 2 y 3).', 'cada toque cambia la marca.')
cambia("'Toca «Guardar una copia» para bajar tu información a la computadora.'",
       "'Toca «Guardar una copia»: el archivo queda en la carpeta Descargas de la tablet.'")
cambia('Solo cambia la pantalla de esta computadora', 'Solo cambia la pantalla de esta tablet')
cambia("'Baja tu información a la computadora'", "'Guarda tu información en la tablet'")
cambia('aria-label="Arrastra aquí tu lista de Excel o toca para elegir el archivo"',
       'aria-label="Toca para elegir tu lista de Excel"')
cambia('<b>Arrastra aquí tu lista de Excel</b><span>o toca para elegir el archivo (.xlsx o .csv)</span>',
       '<b>Toca para elegir tu lista de Excel</b><span>archivo .xlsx o .csv (por ejemplo, de Descargas)</span>')
cambia('En Excel selecciona solo la columna de nombres, pulsa Ctrl+C y luego Ctrl+V en el cuadro.',
       'Copia la columna de nombres desde tu hoja de cálculo; luego mantén el dedo en el cuadro y elige «Pegar».')
cambia('Arrastra tu lista de Excel arriba o escribe el primero.', 'Elige tu lista de Excel arriba o escribe el primero.')
cambia('Arrastra tu lista de Excel o pega los nombres.', 'Elige tu lista de Excel o pega los nombres.')
cambia('aria-label="Arrastra aquí un archivo de rúbricas o toca para elegirlo"',
       'aria-label="Toca para elegir un archivo de rúbricas"')
cambia('<span>arrástralo aquí o toca para elegirlo</span>', '<span>toca para elegirlo</span>')
cambia('title="Clic para modificar"', 'title="Toca para modificar"')

# ---------------------------------------------------------------- teclado de la tablet: «Siguiente» en vez de «Listo»
cambia('step="0.01" inputmode="decimal" ${base}', 'step="0.01" inputmode="decimal" enterkeyhint="next" ${base}')
cambia('class="gcell gtext" type="text" maxlength="300" ${base}',
       'class="gcell gtext" type="text" maxlength="300" enterkeyhint="next" ${base}')
cambia('class="grade-input" onfocus="this.select()" type="number"',
       'class="grade-input" onfocus="this.select()" inputmode="decimal" enterkeyhint="next" type="number"')

# ---------------------------------------------------------------- copias de seguridad en tablet
# La copia automática en carpeta no existe en navegadores de tablet: se oculta siempre.
cambia("supported:typeof window.showDirectoryPicker==='function'", 'supported:false')
cambia('este navegador no permite guardarla sola en una carpeta. Abre ${APP_NAME} en <b>Chrome o Edge</b> para activarla. '
       'Mientras tanto, el programa te recordará guardar tu copia a mano cada semana.',
       'en la tablet no se puede guardar sola en una carpeta. El programa te recordará cada semana guardar tu copia; '
       'después mándala a tu correo o a Drive para tenerla también fuera de la tablet.')
cambia('<p>Guarda una copia en tu computadora. También puedes recuperar una copia anterior.</p>',
       '<p>«Guardar una copia» deja el archivo en la carpeta <b>Descargas</b> de la tablet. '
       '${canShareBackup()?"«Enviar copia» lo manda directo a tu correo, WhatsApp o Drive. ":""}'
       'Para recuperar, toca «Recuperar desde una copia» y busca el archivo en Descargas.</p>')
cambia('<button class="primary" onclick="backup()">↓ Guardar una copia</button><label',
       '<button class="primary" onclick="backup()">↓ Guardar una copia</button>'
       '${canShareBackup()?\'<button class="secondary" onclick="shareBackup()">↗ Enviar copia</button>\':\'\'}<label')
# Sin filtro de tipo: algunos selectores de archivos de Android esconden los .json
cambia('accept=".json,application/json" onchange="restore(this)"', 'onchange="restore(this)"')
cambia('accept=".json,application/json"', '')
cambia('Este prototipo usa el almacenamiento del navegador. Una versión comercial instalará una base de datos SQLite y permitirá respaldos cifrados. No guardes datos reales de alumnos en esta demostración.',
       'Tus datos viven solo en esta tablet, dentro del navegador. <b>No borres los datos del navegador</b> '
       'y guarda tu copia cada semana.')

# ---------------------------------------------------------------- funciones nuevas
JS_TABLET = r"""
/* ===== 95_tablet.js — enviar copia, app instalable y datos protegidos ===== */
function backupFileName(pack,ext){
  const now=new Date(pack.exportedAt);
  const stamp=now.toLocaleDateString('en-CA')+'_'+String(now.getHours()).padStart(2,'0')+String(now.getMinutes()).padStart(2,'0');
  return 'MiBitacora_'+EDITION+'_copia_'+stamp+ext;
}
/* El navegador puede no aceptar .json para compartir; en ese caso se envía como .txt (se recupera igual). */
function shareableBackup(pack){
  const json=JSON.stringify(pack,null,2);
  if(!navigator.canShare)return null;
  for(const [ext,type] of [['.json','application/json'],['.txt','text/plain']]){
    try{const f=new File([json],backupFileName(pack,ext),{type});if(navigator.canShare({files:[f]}))return f}catch(e){}
  }
  return null;
}
function canShareBackup(){
  try{return !!(navigator.canShare&&(navigator.canShare({files:[new File(['{}'],'x.json',{type:'application/json'})]})||navigator.canShare({files:[new File(['{}'],'x.txt',{type:'text/plain'})]})))}catch(e){return false}
}
async function shareBackup(){
  const pack=makeBackupPack(),f=shareableBackup(pack);
  if(!f)return warn('Este navegador no permite enviar archivos. Usa «Guardar una copia»: queda en Descargas y desde ahí la puedes mandar.');
  try{
    await navigator.share({files:[f],title:'Copia de '+APP_NAME+' '+EDITION});
    state.lastBackup=pack.exportedAt;save();render();
    notify('Copia enviada. Revisa que haya llegado a tu correo, WhatsApp o Drive.','success',{ms:9000});
  }catch(e){
    if(e&&e.name==='AbortError')return notify('No se envió la copia porque cerraste la ventana de compartir.','info');
    warn('No se pudo enviar la copia ('+(e&&e.message||e)+'). Usa «Guardar una copia».');
  }
}
/* Barra flotante: la «gota» de vidrio se desliza hasta la sección activa */
function dockPill(){
  const d=document.getElementById('dock'),p=d&&d.querySelector('.dock-pill'),on=d&&d.querySelector('.nav.on');if(!p)return;
  if(!on||!on.offsetWidth){p.style.opacity=0;return}
  let x=0,y=0,el=on;while(el&&el!==d){x+=el.offsetLeft;y+=el.offsetTop;el=el.offsetParent}
  p.style.width=on.offsetWidth+'px';p.style.height=on.offsetHeight+'px';p.style.transform=`translate(${x}px,${y}px)`;p.style.opacity=1;
}
{const _hn=highlightNav;highlightNav=function(){_hn();dockPill()}}
window.addEventListener('resize',dockPill);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(dockPill);
requestAnimationFrame(()=>{highlightNav()});
/* Mientras escribes, la barra se esconde para no tapar el teclado ni las casillas */
const TYPING_SEL='input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=date]):not([type=color]):not([type=range]),textarea';
document.addEventListener('focusin',e=>{if(e.target.matches&&e.target.matches(TYPING_SEL)){document.body.classList.add('typing');setMenu(false)}});
document.addEventListener('focusout',()=>setTimeout(()=>{const a=document.activeElement;if(!(a&&a.matches&&a.matches(TYPING_SEL)))document.body.classList.remove('typing')},60));
/* ===== 96_autocopia.js — copia automática diaria en Descargas + puntos de regreso dentro de la tablet =====
   · Copia en Descargas: una vez al día, al primer toque después de cambiar algo, se baja sola
     MiBitacora_Secundaria_auto_AAAA-MM-DD.json (mismo formato que «Guardar una copia»).
     Se hace dentro de un toque porque Android solo permite descargas que vienen de un toque.
   · Puntos de regreso: al abrir la app se guarda dentro de la tablet cómo estaba la información
     (últimos 7 días), para deshacer un error grande sin buscar archivos. */
const AUTO={key:KEY+'_autocopia',pending:false,keep:7};
function autoToday(){return new Date().toLocaleDateString('en-CA')}
function autoCfg(){let c={};try{c=JSON.parse(localStorage.getItem(AUTO.key)||'{}')||{}}catch(e){}return {on:c.on!==false,day:c.day||'',last:c.last||'',name:c.name||''}}
function autoSave(c){try{localStorage.setItem(AUTO.key,JSON.stringify(c))}catch(e){}}
function autoHasData(){return countsOf(state).students>0&&!!state.profile.onboarded}
function autoMark(){const c=autoCfg();if(c.on&&c.day!==autoToday()&&autoHasData())AUTO.pending=true}
{const _abs=abSchedule;abSchedule=function(){_abs();autoMark()}}
function autoRun(){
  AUTO.pending=false;const c=autoCfg();if(!c.on||c.day===autoToday()||!autoHasData())return;
  try{
    const pack=makeBackupPack(),name='MiBitacora_'+EDITION+'_auto_'+autoToday()+'.json';
    download(name,new Blob([JSON.stringify(pack,null,2)],{type:'application/json'}));
    autoSave({...c,day:autoToday(),last:pack.exportedAt,name});
    state.lastBackup=pack.exportedAt;save();renderTopbar();
    notify('Copia automática del día guardada en Descargas: '+name,'success',{ms:7000});
    if(active==='datos')setTimeout(()=>{if(active==='datos'&&!document.querySelector('#content input:focus,#content textarea:focus'))render()},400);
  }catch(e){warn('No se pudo hacer la copia automática del día ('+(e&&e.message||e)+'). Usa «Guardar una copia».')}
}
/* Se dispara al inicio del toque; NO redibuja la pantalla para no borrar lo que estés escribiendo */
document.addEventListener('click',()=>{if(AUTO.pending)autoRun()},true);
function autoToggle(){
  const c=autoCfg();c.on=!c.on;autoSave(c);
  notify(c.on?'Copia automática activada: se guardará una copia al día en Descargas.':'Copia automática apagada. Recuerda guardar tu copia a mano cada semana.',c.on?'success':'info',{ms:6000});
  if(c.on)autoMark();render();
}
/* ---- puntos de regreso (IndexedDB) ---- */
function snapDb(){return new Promise((res,rej)=>{const r=indexedDB.open('mibitacora_puntos_'+EDITION,1);r.onupgradeneeded=()=>r.result.createObjectStore('dias');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function snapReq(db,mode,fn){return new Promise((res,rej)=>{const tx=db.transaction('dias',mode),q=fn(tx.objectStore('dias'));tx.oncomplete=()=>res(q&&q.result);tx.onerror=()=>rej(tx.error)})}
async function snapTake(){
  try{
    if(!autoHasData())return;const db=await snapDb(),day=autoToday();
    if(await snapReq(db,'readonly',s=>s.get(day)))return;
    const pack=makeBackupPack();
    await snapReq(db,'readwrite',s=>s.put({day,at:pack.exportedAt,counts:pack.counts,json:JSON.stringify(pack)},day));
    const keys=(await snapReq(db,'readonly',s=>s.getAllKeys())).sort().reverse();
    if(keys.length>AUTO.keep)await snapReq(db,'readwrite',s=>{keys.slice(AUTO.keep).forEach(k=>s.delete(k))});
  }catch(e){}
}
async function snapList(){try{const db=await snapDb();return ((await snapReq(db,'readonly',s=>s.getAll()))||[]).sort((a,b)=>b.day.localeCompare(a.day))}catch(e){return null}}
async function snapRestore(day){
  try{const db=await snapDb(),v=await snapReq(db,'readonly',s=>s.get(day));
    if(!v)return warn('Ese punto de regreso ya no existe.');
    await restore({files:[new File([v.json],'punto_'+day+'.json',{type:'application/json'})],value:''});
  }catch(e){warn('No se pudo volver a ese día ('+(e&&e.message||e)+').')}
}
function snapDayName(day){const [y,m,d]=day.split('-').map(Number);const t=new Date(y,m-1,d).toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'});return t.charAt(0).toUpperCase()+t.slice(1)}
async function snapFill(){
  const box=document.getElementById('snapBox');if(!box)return;const list=await snapList();
  if(list===null){box.innerHTML='<b>Puntos de regreso:</b> este navegador no permite guardarlos.';return}
  box.innerHTML=`<b>Puntos de regreso</b> (dentro de la tablet, últimos ${AUTO.keep} días). Cada día, al abrir ${APP_NAME}, se guarda cómo estaba tu información antes de empezar a trabajar. Úsalos si borraste algo por error. No sustituyen la copia en Descargas: si se borran los datos del navegador, también se borran estos.
  ${list.length?`<div class="snap-list">${list.map(v=>`<div class="snap-row"><span><b>${esc(snapDayName(v.day))}</b>, al abrir la app (${esc(new Date(v.at).toLocaleTimeString('es-MX',{hour:'numeric',minute:'2-digit'}))})<small>${v.counts?[[v.counts.groups,'grupo','grupos'],[v.counts.students,'alumno','alumnos'],[v.counts.activities,'actividad','actividades']].map(([n,a,b])=>n+' '+(n===1?a:b)).join(' · '):''}</small></span><button class="secondary" onclick="snapRestore('${esc(v.day)}')">↶ Volver a como estaba</button></div>`).join('')}</div>`:'<p class="helper">Todavía no hay puntos de regreso. El primero se guarda la próxima vez que abras la app.</p>'}`;
}
abPanelHTML=function(){
  const c=autoCfg();setTimeout(snapFill,0);
  return `<div class="hint ${c.on?'ok-hint':'warn'}"><b>Copia automática ${c.on?'activada':'apagada'}.</b> ${c.on
    ?`Una vez al día, al primer toque después de cambiar algo, se guarda sola una copia en la carpeta <b>Descargas</b> (<i>MiBitacora_${EDITION}_auto_fecha.json</i>). ${c.last?'Última: <b>'+esc(new Date(c.last).toLocaleString('es-MX'))+'</b>':'Todavía no se ha hecho ninguna.'}`
    :'Actívala para no depender de acordarte de guardar tu copia.'}
    <div class="actions"><button class="${c.on?'secondary':'primary'}" onclick="autoToggle()">${c.on?'Apagar copia automática':'Activar copia automática'}</button></div></div>
    <div class="hint" id="snapBox"><b>Puntos de regreso:</b> cargando…</div>`;
};
setTimeout(snapTake,1500);
/* Funciona sin internet una vez instalada, y pide al navegador que no borre los datos por falta de espacio */
(function(){
  if(!/^https?:$/.test(location.protocol))return;
  if('serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{})});
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persisted().then(p=>p||navigator.storage.persist()).catch(()=>{})}catch(e){}
})();
"""
i = html.rfind('</script>')
if html.count('</script>') != 1:
    sys.exit('ERROR: se esperaba un solo </script>')
html = html[:i] + JS_TABLET + html[i:]

open(DESTINO, 'w', encoding='utf-8').write(html)
print('Listo:', DESTINO, len(html.encode('utf-8')), 'bytes')
