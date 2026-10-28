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


# ---------------------------------------------------------------- cabecera (instalable)
cambia('<meta name="viewport" content="width=device-width,initial-scale=1">',
       '<meta name="viewport" content="width=device-width,initial-scale=1,interactive-widget=resizes-content">'
       '<meta name="theme-color" content="#1E3F78">'
       '<meta name="mobile-web-app-capable" content="yes">'
       '<meta name="apple-mobile-web-app-capable" content="yes">'
       '<meta name="apple-mobile-web-app-title" content="Mi Bitácora">'
       '<link rel="manifest" href="manifest.webmanifest">'
       '<link rel="apple-touch-icon" href="icono-192.png">')

# ---------------------------------------------------------------- estilos para pantalla táctil
CSS_TABLET = r"""
/* ===== 95_tablet.css — uso con el dedo en tablet (Huawei MatePad 12 X y similares) ===== */
html{touch-action:manipulation;-webkit-text-size-adjust:100%}
body{-webkit-tap-highlight-color:transparent}
/* Menú de arriba siempre en un renglón; en vertical se oculta el nombre junto al logotipo */
.side{flex-wrap:nowrap}
.side .nav{white-space:nowrap}
@media(max-width:1180px){.side .brand-txt{display:none}.side .brand{padding-right:4px}.side .nav{padding:12px 13px}}
@media(max-width:860px){.side{padding-left:12px;padding-right:12px}.side .nav{padding:12px 10px}}
/* Con el teclado abierto en horizontal, el menú deja de estar fijo para dejar ver más filas */
@media(max-height:560px){.side{position:static}}
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
"""
cambia('</style></head>', CSS_TABLET + '</style></head>')

# ---------------------------------------------------------------- textos: tablet en lugar de computadora
cambia('Mi Bitácora Secundaria · v0.13.0<br>Datos guardados en este navegador',
       'Mi Bitácora Secundaria · v0.13.0 · Tablet<br>Datos guardados en esta tablet')
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
