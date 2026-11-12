# Mi Bitácora · Secundaria (tablet)

Versión de **Mi Bitácora Secundaria v0.13.0** adaptada para usarse con el dedo en tablet (probada para Huawei MatePad 12 X y Samsung Galaxy Tab S10 FE). Funciona sin internet una vez instalada.

**Abrir:** https://duhabss68-ui.github.io/Secundaria/

## Instalarla en la tablet (una sola vez, con internet)

1. En la tablet, abre el navegador y entra a la dirección de arriba: **Chrome** en Samsung, **Navegador Huawei** en Huawei.
2. Toca el menú del navegador (⋮ o ☰) → **Instalar app** / **Añadir a la pantalla de inicio**.
3. Desde entonces ábrela con el ícono de **Mi Bitácora**. Ya no necesita internet.

## Actualizaciones

- Con internet, la app siempre abre la versión más nueva. Si llega una mientras la usas, sale **«Hay una versión nueva · Actualizar ahora»**.
- En **Más** se ve la versión instalada (por ejemplo «Tablet 1.7») y el botón **«Buscar actualización»**. Tus datos no se tocan.
- Nunca borres los datos del navegador para actualizar: ahí viven tus datos.

## Para no perder tu trabajo

- Ábrela siempre desde el mismo ícono y el mismo navegador.
- **No borres los datos del navegador** ni la caché del Navegador Huawei: ahí viven tus datos.
- Cada semana: **Más → Copias de seguridad → Guardar una copia** (queda en Descargas) o **Enviar copia** (correo, WhatsApp o Drive).
- Para pasar datos desde la laptop: en la laptop haz «Guardar copia»; en la tablet, «Recuperar desde una copia». Los promedios no cambian.

## Qué cambia respecto a la versión de laptop

- Instalable y sin internet.
- Menú en una **barra flotante abajo** con efecto vidrio: Inicio, Mi grupo, Asistencia, **＋ Actividades** (botón grande al centro), Calificaciones, Equipos y Más. Se esconde mientras escribes.
- **Franja azul marino arriba** con logo, **frase del día** de un pedagogo al centro (botón «↻ Otra frase») y A+ / ?.
- **Íconos a color** en el menú, Inicio, pestañas y ayuda.
- **Inicio**: la bienvenida es una tarjeta chica junto al saludo.
- Botones, casillas y filas de la cuadrícula de al menos 44 px para el dedo.
- **PDA ocultos por ahora**: no aparece «Avance por PDA» ni las casillas de PDA. Los PDA ya capturados no se borran; para mostrarlos de nuevo, pon `PDA_VISIBLES = True` en `herramientas/hacer_tablet.py`.
- Disciplina **Integración Curricular** disponible para cualquier grupo (sección «Integración de los campos formativos»).
- **Calificar por equipo** a la vista: botón «👥 Calificar por equipo» en Calificar y «Calificar con estos equipos» en cada organización guardada de Equipos. Eliges la actividad, pones una nota por equipo y se copia a cada integrante (con Deshacer).
- **«👥 Por equipos»** también en cada actividad de la lista y en el aviso al crear una actividad.
- **Cuaderno**: «📊 Resumen de alumnos» se abre en ventana (y sí sale al imprimir); el filtro de disciplinas queda plegado; totales en fichas junto al grupo.
- **Exportar el cuaderno con ceros**: en el Excel y el CSV las casillas vacías de actividades que cuentan valen 0 y los promedios se calculan con esos ceros. En la app nada cambia (lo pendiente no cuenta).
- **Formato oficial de asistencias (SEPEN Nayarit)** en Asistencia › Historial: Excel oficio horizontal con fechas giradas, marcas «.» «/» «J», totales con fórmulas, % de asistencia, **rasgos** (tus rubros) y **calificación**. La herramienta está en `herramientas/formato_oficial.js`.
- **Mis datos**: Clave del C.C.T., Sector y Zona escolar.
- **«🚫 No hubo clases»** en Pasar lista (CTE, suspensión, día festivo u otro), solo en el grupo actual. Ese día no cuenta como falta para nadie; si ya había lista, se guarda aparte y regresa con «↩ Quitar «sin clases»». El Historial muestra «Días sin clases: N».
- **Formato oficial**: logo de los Servicios de Educación Pública del Estado de Nayarit (imagen real, `recursos/logo_sepen_nayarit_alta.png` sin cambios), columnas de días sin clases con su leyenda girada, % de asistencia sobre los días con marca, y **resumen del grupo con fórmulas** (aprobación, reprobación, días programados y reales, inasistencias, promedio general) más espacios para Vo.Bo., firma del profesor y sello.
- **Actividades agrupadas por rubro**: en Calificar, Actividades, Cuaderno y Excel se acomodan en el orden de tus rubros (y dentro de cada rubro, en el orden en que las creaste). En Calificar, una franja arriba muestra el nombre y el % de cada rubro. Los datos guardados no se mueven.
- **Crear la actividad también en otros grupos**: en Nueva actividad, «También crearla en» con tus otros grupos de la misma disciplina; solo se pueden marcar los que tienen un rubro con el mismo nombre. Cada copia es independiente.
- **Colores de las calificaciones editables** (Opciones del cuaderno › Nivel de logro y colores): verde desde, amarillo desde; la cuadrícula, promedios, cuaderno, concentrado, fichas y leyendas los usan. Por omisión 8 y 6.
- **📊 Concentrado** (pestaña junto a Cuaderno y botón dentro del Cuaderno): por trimestre (promedio por rubro y de la disciplina) y Final (promedio general de los trimestres con calificación, por disciplina). Excel de 4 hojas con las casillas vacías contadas como 0.
- **Excel del cuaderno**: columnas «Promedio <rubro> (%) /10» antes del promedio final (solo en el Excel, no en pantalla); las casillas vacías salen como 0.
- **Trimestres**: los periodos se llaman **Primer, Segundo y Tercer Trimestre** (el formato oficial SEPEN sigue diciendo «PRIMER PERIODO»).
- **Rubros propios por trimestre (opcional)**: en Opciones del cuaderno › Rubros y porcentajes eliges el trimestre. Por omisión los tres usan los mismos rubros; con «Que el Segundo Trimestre tenga sus propios rubros» ese trimestre arranca con una copia del anterior y lo que cambies (agregar, quitar, porcentajes) solo le afecta a él. Así un grupo puede tener 3 rubros en el Primero, 5 en el Segundo y 4 en el Tercero. «↩ Usar los rubros de todo el ciclo» lo regresa (con Deshacer). Calificar, Concentrado, Excel y formato oficial usan los rubros de cada trimestre.
- Al calificar, el teclado muestra «Siguiente» y baja al siguiente alumno.
- **Copia automática**: una vez al día, al primer toque después de cambiar algo, se guarda sola `MiBitacora_Secundaria_auto_AAAA-MM-DD.json` en **Descargas**. Se puede apagar en Más → Copias de seguridad.
- **Puntos de regreso**: cada día, al abrir la app, se guarda dentro de la tablet cómo estaba tu información (últimos 7 días), con botón «Volver a como estaba».
- Copias a mano: «Guardar una copia» (Descargas) y «Enviar copia» (correo, WhatsApp o Drive).
- Los datos y el formato de los respaldos son los mismos: una copia de la laptop se recupera en la tablet sin cambios.

## Portal de familias (Tablet 1.11)

- En **Más → Portal de familias**: eliges los grupos, escribes anuncios y notas, y tocas **«📤 Publicar ahora»** cuando tengas internet.
- Se envía a tu Google Sheets privada (script `Code.gs`, que **no** va en este repositorio) solo lo necesario: nombre, grupo, actividades de las últimas semanas con *Entregó / Pendiente / No entregó* y nivel de logro. **No** se envían calificaciones numéricas.
- Cada familia entra a **https://duhabss68-ui.github.io/Secundaria/familias.html** con el código de su hijo (tarjeta con QR, que se imprime desde la misma pantalla, o mensaje por WhatsApp con «Enviar»).
- La dirección del script y la clave se guardan solo en la tablet y no van en las copias de seguridad. En `familias.html` se pega la dirección del script en `API_URL`.

## Logo

El logo está en la carpeta `logo/` (con nombre, sin nombre, PNG de 16 a 1024 px, .ico y perfil de Facebook). La app usa la versión sin nombre en la franja de arriba y en la pestaña; los íconos de la app instalada salen de `logo/icono-*.png`.

## Para actualizar con una versión nueva de laptop

```
python3 herramientas/hacer_tablet.py fuente/<html de laptop> index.html
```

Si algún texto del original cambió, el script se detiene y dice cuál. Sube `TABLET_VERSION` en ese mismo script; también genera `sw.js`.
