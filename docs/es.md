# GDACS

Siga desde Gladys las grandes catástrofes naturales del mundo: terremotos, ciclones tropicales,
inundaciones, erupciones volcánicas, sequías e incendios forestales, tal como los clasifica
[GDACS](https://www.gdacs.org) (Global Disaster Awareness and Coordination System, una cooperación de las
Naciones Unidas y la Comisión Europea). Cada evento recibe un nivel de alerta verde, naranja o rojo, según
su impacto humanitario previsto.

La integración conserva los eventos de **su zona**: un radio alrededor de su casa, los países que elija
y, si lo desea, todas las alertas rojas del mundo (familia en el extranjero, viajes). Sin cuenta, sin
clave de API.

Es un complemento, no es un sistema de alerta de seguridad: en caso de emergencia, siga las instrucciones
de sus autoridades locales. Sin afiliación con GDACS, la Comisión Europea ni las Naciones Unidas.

## Qué obtiene

- Un dispositivo **Alertas GDACS**: número de alertas activas en su zona, nivel de alerta más alto, último
  evento (en palabras) y distancia del evento más cercano, con su historial.
- Un **widget del panel** que enumera las alertas actuales, primero el nivel más alto y luego las más
  cercanas, cada una con su informe GDACS.
- Dos **disparadores de escena**: un nuevo evento en su zona, y el nivel de alerta de un evento elevado.
- Una **acción de escena** que lee las alertas actuales en una frase, para enviarla por mensaje o leerla
  en voz alta.

## Requisitos

- Gladys Assistant 5.1 o posterior.
- Acceso a Internet desde el equipo de Gladys (la integración lee `www.gdacs.org`).
- Para el radio alrededor de su casa: una ubicación para su casa en Gladys (Ajustes → Casas), o
  coordenadas introducidas en la configuración.

## Configuración

### Ajustes

| Ajuste                         | Efecto                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Latitud y longitud del centro  | Centro de la zona. Deje ambas vacías para usar la ubicación de su casa en Gladys. Se acepta la coma decimal.        |
| Radio                          | De 100 a 5000 km alrededor del centro (1000 km por defecto).                                                        |
| Países                         | Códigos ISO (`ES` o `ESP`, separados por comas): los eventos que afectan a estos países, esté donde esté su centro. |
| Tipos de evento                | Los peligros que seguir (los seis por defecto).                                                                     |
| Nivel de alerta mínimo         | Verde (por defecto), naranja o rojo.                                                                                |
| Alertas rojas de todo el mundo | Seguir también todas las alertas rojas, estén donde estén (desactivado por defecto).                                |
| Intervalo de actualización     | 10, 15 (por defecto), 30 o 60 minutos.                                                                              |
| Idioma de los textos           | Nombres de las funciones (al crearlas) y textos enviados a las escenas. Francés por defecto.                        |

Guarde, abra la pestaña **Descubrir** de la integración y cree el dispositivo **Alertas GDACS**. El botón
**Mostrar las alertas actuales** de la configuración enumera enseguida las alertas de su zona: una forma
rápida de comprobar los ajustes.

### La zona seguida

Un evento se sigue cuando está en curso en GDACS, es de un tipo elegido, tiene el nivel mínimo o uno
superior, y:

- su punto está dentro del radio alrededor del centro. El punto es el que indica GDACS: el epicentro de un
  terremoto, la posición actual de un ciclón, el centro de una inundación, una sequía o un incendio;
- o afecta a uno de los países elegidos (la lista de países afectados que publica GDACS);
- o es una alerta roja y «Alertas rojas de todo el mundo» está activado.

Una sequía o una inundación puede extenderse miles de kilómetros: su centro puede estar lejos de usted
aunque su país esté afectado. Añada su país al ajuste **Países** para detectarlas.

Los niveles de GDACS: **verde**, un evento limitado, sin ayuda internacional prevista; **naranja**, puede
necesitarse ayuda; **rojo**, una catástrofe grave. Verde no significa «no ha pasado nada»: un terremoto de
magnitud 4,5 cerca de su casa es verde.

## Dispositivo

| Función                          | Tipo           | Valor                                                                                                            |
| -------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Alertas activas                  | Contador       | Número de eventos seguidos                                                                                       |
| Nivel de alerta más alto         | Riesgo         | 0 sin alerta, 1 verde, 2 naranja, 3 rojo (el distintivo de riesgo de Gladys, un paso por encima del color GDACS) |
| Último evento                    | Texto          | El evento más reciente, p. ej. `Naranja · Ciclón tropical SIMON-26 250 km/h · México · 3279 km`                  |
| Distancia del evento más cercano | Distancia (km) | Distancia al evento seguido más cercano; 20 038 km (lo más lejos que puede estar un punto) si no hay ninguno     |

Sin centro (ni ubicación de la casa ni coordenadas), la distancia no se publica. Los valores se leen en el
contenedor en cada intervalo: Gladys no consulta el dispositivo.

## Widget del panel

**Alertas GDACS**: un título con el número de alertas y, después, hasta 8 eventos, primero el nivel más
alto y luego los más cercanos. Cada fila muestra el tipo y la magnitud, el país y la distancia, y el nivel
como distintivo. Toque una fila para ver la descripción GDACS del evento, sus fechas y el enlace a su
informe GDACS. El pie indica la fuente y la hora de la última lectura, con un enlace a gdacs.org.

## Disparadores de escena

**GDACS: nuevo evento en mi zona** se activa cuando un evento entra por primera vez en la zona seguida: un
nuevo terremoto, un ciclón que se acerca, una alerta roja en cualquier lugar si lo eligió. Filtros: tipos
de evento, nivel de alerta.

**GDACS: nivel de alerta elevado** se activa cuando un evento seguido pasa de verde a naranja o rojo, o de
naranja a rojo. Filtros: tipos de evento, nuevo nivel.

Los eventos ya presentes en el primer arranque de la integración, o cuando cambia su configuración, no
activan nada: no son noticia. Lo que se ha visto se guarda, así que un reinicio tampoco activa nada. Como
máximo 20 eventos por actualización.

Variables de ambos disparadores: `event_type` (`earthquake`, `tropical_cyclone`, `flood`, `volcano`,
`drought`, `wildfire`), `level` (`green`, `orange`, `red`), `event_type_name` y `level_name` (en
palabras), `name` (tipo y magnitud), `country`, `distance_km`, `summary` (una línea, como la función Último
evento) y `url` (informe GDACS). El disparador de nivel añade `previous_level` y `previous_level_name`.

## Acción de escena

**GDACS: leer las alertas actuales** vuelve a consultar GDACS si la última lectura tiene más de un
intervalo y devuelve:

- `text`: las alertas en una frase, p. ej. `2 alertas GDACS: Naranja · Ciclón tropical SIMON-26 250 km/h
en México, a 3279 km; Verde · Terremoto M4,5 en Panama, a 182 km.` (5 eventos como máximo, y después «y N
  más»);
- `count`: el número de alertas;
- `max_level`: `none`, `green`, `orange` o `red`.

## Ejemplos de escenas

- **Mensaje cuando un gran evento está cerca**: disparador «GDACS: nuevo evento en mi zona» filtrado en
  naranja y rojo, acción «Enviar un mensaje» con `{{triggerEvent.data.summary}}` y
  `{{triggerEvent.data.url}}`.
- **Resumen de la mañana**: todos los días a las 7:30, «GDACS: leer las alertas actuales» y después «Enviar
  un mensaje» con su `text`, solo si `count` es mayor que 0.
- **Familia en el extranjero**: active «Alertas rojas de todo el mundo» y envíe un mensaje con cada nuevo
  evento rojo: `Alerta {{triggerEvent.data.level_name}}: {{triggerEvent.data.name}},
{{triggerEvent.data.country}}`.
- **Una lámpara en la entrada**: cuando «Nivel de alerta más alto» pase a 2 o más, encender una lámpara en
  naranja.

## Fuentes, condiciones y cuotas

- Datos © GDACS (Comisión Europea JRC y ECHO, ONU OCHA y UNOSAT), leídos desde la API pública de eventos de
  GDACS, sin cuenta. La fuente se cita en el widget, como pide la política de reutilización de la Comisión
  Europea.
- Las notificaciones de GDACS sobre terremotos y ciclones las producen modelos, automáticamente, sin
  revisión humana: pueden ser erróneas, tardías o incompletas, y el servicio puede no estar disponible.
  Nunca sustituyen las alertas de las autoridades locales o nacionales, las únicas encargadas de alertar a
  la población. Consulte las
  [condiciones de uso de GDACS](https://www.gdacs.org/About/termofuse.aspx).
- Cuotas: GDACS no publica ninguna. La integración consulta una vez por intervalo (15 minutos por
  defecto): una búsqueda para las sequías y otra para los demás peligros, 100 eventos por página, 10
  páginas como máximo. El 15/10/2026, un ciclo necesitaba 5 solicitudes en el nivel verde (270 eventos en
  curso, sobre todo incendios forestales) y 2 en el nivel naranja.

## Solución de problemas

- **«Sin centro» en la configuración**: indique la ubicación de su casa en Gladys (Ajustes → Casas), o
  introduzca coordenadas. Los países y las alertas rojas mundiales funcionan sin ello.
- **«GDACS no responde»**: el sitio no funciona o no es accesible desde el equipo de Gladys. Los últimos
  valores se mantienen; la integración vuelve a intentarlo en cada intervalo y lo indica una vez en sus
  registros.
- **«GDACS enumera demasiados eventos»**: coinciden más de 1000 eventos (sobre todo incendios forestales en
  el nivel verde). Suba el nivel mínimo o desmarque algunos tipos.
- **Ningún disparador tras un cambio de ajustes**: es lo esperado, los eventos que ya estaban no son
  noticia.
- **Los nombres de las funciones no están en el idioma correcto**: se fijan al crear el dispositivo.
  Cambie el idioma, elimine el dispositivo y vuelva a crearlo desde la pestaña Descubrir.
- Registros: página de la integración en Gladys, pestaña Logs. `LOG_LEVEL=debug` añade una línea por
  lectura.

## Límites

- La distancia se mide hasta un punto del evento, no hasta su contorno: una gran inundación o un gran
  incendio puede alcanzarle aunque su centro esté más allá del radio. Use el ajuste Países para ellos.
- GDACS cubre las grandes catástrofes con posible impacto internacional, no los peligros locales
  (tormentas, crecidas locales, olas de calor): para ellos, consulte las alertas oficiales de su país.
- Los nombres de países y eventos proceden de GDACS, en inglés.
- Las alertas de tsunami de GDACS forman parte de sus eventos de terremoto; no se enumeran aparte.
- Desarrollada y probada contra el servicio real de GDACS; sus comentarios sobre alertas reales son
  bienvenidos en el foro.
