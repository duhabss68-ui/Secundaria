# Mi Bitácora · Secundaria (tablet)

Versión de **Mi Bitácora Secundaria v0.13.0** adaptada para usarse con el dedo en tablet (probada para Huawei MatePad 12 X). Funciona sin internet una vez instalada.

**Abrir:** https://duhabss68-ui.github.io/Secundaria/

## Instalarla en la tablet (una sola vez, con internet)

1. En la tablet, abre el **Navegador Huawei** y entra a la dirección de arriba.
2. Toca el menú del navegador (☰ o ⋮) → **Añadir a la pantalla de inicio** (o «Añadir acceso directo»).
3. Desde entonces ábrela con el ícono de **Mi Bitácora**. Ya no necesita internet.

## Para no perder tu trabajo

- Ábrela siempre desde el mismo ícono y el mismo navegador.
- **No borres los datos del navegador** ni la caché del Navegador Huawei: ahí viven tus datos.
- Cada semana: **Más → Copias de seguridad → Guardar una copia** (queda en Descargas) o **Enviar copia** (correo, WhatsApp o Drive).
- Para pasar datos desde la laptop: en la laptop haz «Guardar copia»; en la tablet, «Recuperar desde una copia». Los promedios no cambian.

## Qué cambia respecto a la versión de laptop

- Instalable y sin internet.
- Menú en una **barra flotante abajo** con efecto vidrio: Inicio, Mi grupo, Asistencia, Calificaciones, **Actividades**, **Equipos** y Más. Se esconde mientras escribes.
- Botones, casillas y filas de la cuadrícula de al menos 44 px para el dedo.
- **PDA ocultos por ahora**: no aparece «Avance por PDA» ni las casillas de PDA. Los PDA ya capturados no se borran; para mostrarlos de nuevo, pon `PDA_VISIBLES = True` en `herramientas/hacer_tablet.py`.
- Al calificar, el teclado muestra «Siguiente» y baja al siguiente alumno.
- Copias de seguridad pensadas para la tablet: Descargas y «Enviar copia».
- Los datos y el formato de los respaldos son los mismos: una copia de la laptop se recupera en la tablet sin cambios.

## Para actualizar con una versión nueva de laptop

```
python3 herramientas/hacer_tablet.py fuente/<html de laptop> index.html
```

Si algún texto del original cambió, el script se detiene y dice cuál. Después sube `VERSION` en `sw.js` para que la tablet descargue la versión nueva.
