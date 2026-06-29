# Club San Jorge | Agencias Abed

Base estatica para construir el sitio comercial e informativo de una agencia mercantil de Club San Jorge.

## Estructura

- `index.html`: Home V1 real comercial e informativa.
- `planes/`: catalogo V2 por categorias Autos, Motos y Dinero, mas paginas detalle heredadas.
- `sorteos/`, `adjudicados/`, `recursos/`, `preguntas-frecuentes/`, `contacto/`: paginas internas base.
- `assets/css/`: tokens, base, layout, componentes, utilities y estilos de pagina.
- `assets/css/pages/`: estilos segmentados para Home y paginas internas/catalogo.
- `assets/js/`: shell, data layer, helpers de estado, componentes y scripts de pagina.
- `assets/js/pages/home/`: modulos de la Home separados por bloque.
- `assets/img/placeholders/`: placeholders visuales temporales.
- `data/`: source-of-truth editable de contenido local. No se duplica ni se migra.
- `data/plan_catalog.json`: source principal V2 para renderizar catalogo comercial.
- `data/agency-contact.json`: configuracion operativa de contacto/pre-solicitud de la agencia.

## Como correr localmente

Usar un servidor estatico desde la raiz del proyecto:

```bash
python3 -m http.server 8000
```

Abrir:

```text
http://localhost:8000/
```

No abrir con `file://`, porque los modulos JS consumen JSON con `fetch()`.

Si el puerto `8000` esta ocupado, usar otro puerto:

```bash
python3 -m http.server 8010
```

## Data layer

El data layer esta en `assets/js/data/api.js` y consume directamente contenido local desde:

```text
/data/*.json
```

Incluye funciones como:

- `loadSite()`
- `loadPlans()`
- `loadPlanCatalog()`
- `loadFaq()`
- `loadResources()`
- `loadDraws()`
- `loadAdjudications()`
- `loadVideos()`
- `loadAgencyContact()`
- `loadHomeData()`

La Home tambien consume datos oficiales vivos desde Artemis para resultados de sorteos y adjudicados destacados.

Los helpers de estado estan en `assets/js/utils/status.js` y contemplan:

- `ready`
- `partial`
- `empty`
- `disabled`

### Source of truth

`data/` es el source-of-truth editable del proyecto para contenido local, catalogo, FAQ, recursos, contacto, recruitment y textos comerciales. La V2 no duplica ni migra JSON a otra carpeta: las paginas consumen directamente los archivos publicados en esa carpeta.

Excepcion actual: sorteos y adjudicados destacados de la Home se cargan desde Artemis para evitar mantener copias locales de datos oficiales que cambian con frecuencia.

### Separacion conceptual

El sitio mantiene dos capas conceptuales:

- Capa oficial / sistema Club San Jorge: planes, preguntas frecuentes del sistema, recursos oficiales, datos institucionales del data pack y datos vivos de sorteos/adjudicados cuando provienen de Artemis.
- Capa agencia / comercial-operativa: hero comercial, CTAs, contacto, pre-solicitud asistida, formulario, copy de confianza y explicacion del acompanamiento de Agencias Abed.

La separacion esta reflejada en componentes, copy, catalogo y datos de contacto. No requiere crear otra app ni duplicar contenido.

### Catalogo V2

La Home y `/planes/` consumen `data/plan_catalog.json`.

`plans.json` queda como compatibilidad para paginas detalle heredadas y para contenido explicativo historico, pero ya no es la arquitectura principal de planes.

El catalogo V2 agrupa por:

- `autos`
- `motos`
- `dinero`

Cada item soporta `displayName`, `category`, `brand`, `model`, `planLabel`, `months`, `valorNominal`, `cuota`, `status`, `featured`, `notes`, `faqRefs`, `contactPreset` y `sourceStatus`.

Si faltan valores nominales, cuota exacta, marca o modelo, el dato se muestra como `A confirmar` y no se completa con informacion inventada.

## Reglas de renderizado

- Valores `""`, `null` o no definidos se tratan como informacion no disponible.
- Items con `status: pending_validation` pueden mostrarse si ayudan a orientar, pero deben llevar texto de actualizacion o aclaracion.
- Items con `status: mock` no se presentan como informacion definitiva. Se muestran solo como estructura, ejemplo o estado pendiente.
- Secciones parcialmente completas se muestran cuando hay suficiente contexto util. Subbloques incompletos se ocultan o reemplazan por fallback.
- Sorteos sin fecha o numeros, adjudicados con meses faltantes, recursos sin link, videos sin URL y planes con campos incompletos usan estados parciales.
- CTAs sin destino configurado se muestran deshabilitados o se redirigen al flujo asistido cuando existe una alternativa segura.
- Las acciones comerciales no prometen contratacion final: la pre-solicitud es orientativa y requiere validacion posterior.

## Estados de UI

- `ready`: datos suficientes para mostrar el bloque y habilitar acciones.
- `partial`: se muestra el bloque con fallback, aviso o subbloques ocultos.
- `empty`: se muestra un estado vacio cuando la seccion es importante para la navegacion o se oculta si no aporta valor.
- `disabled`: se renderiza la accion sin ejecucion, con `aria-disabled` y texto de canal en configuracion.

Texto base para datos incompletos: `Informacion en actualizacion`.

## Hecho en Etapa 1

- Estructura de carpetas estatica.
- Rutas base navegables.
- Header, navegacion y footer renderizados desde `site.json`.
- CSS base con tokens, layout y componentes iniciales.
- Data layer JS para consumir `data/` sin duplicar datos.
- Helpers para valores vacios, estados, URLs y fallbacks.
- Home tecnica minima con snapshots de capa oficial y capa agencia.
- Placeholders visuales para planes, videos y OG.

## Hecho en Etapa 2

- Home V1 real con hero comercial, confianza, planes destacados, como funciona, sorteos, adjudicados, preguntas frecuentes, recursos y CTA final.
- Secciones conectadas a `data/`.
- Fallbacks para sorteos incompletos, adjudicados mock, links faltantes y canales de contacto pendientes.
- Separacion visible entre informacion oficial del sistema y contenido operativo de agencia.

## Hecho en Etapa 3

- Hub inicial de planes en `/planes/`.
- Comparador simple tipo opcion B con datos de `plans.json` como antecedente V1.
- Paginas de detalle heredadas para auto, moto y dinero.
- Componentes reutilizables de planes en `assets/js/components/plan-components.js`.
- Fallbacks para campos pendientes o incompletos en moto y dinero.

## Hecho en Etapa 4

- Pagina real de sorteos con resumen, estados parciales y aclaraciones.
- Pagina de adjudicados con selector año/mes, tabla preparada y proteccion contra datos mock.
- Pagina de recursos agrupados, con links verificados y estados pendientes.
- Preguntas frecuentes agrupadas por categoria con preguntas sensibles priorizadas.
- Componentes reutilizables de paginas informativas en `assets/js/components/info-components.js`.

## Hecho en Etapa 5

- Pagina real de contacto / pre-solicitud asistida.
- Formulario V1 con validacion frontend, estados y armado de payload.
- Configuracion operativa separada en `data/agency-contact.json`.
- Arquitectura preparada para endpoint, mailto o modo placeholder.
- CTAs del sitio orientados a `/contacto/` con intencion y plan cuando aplica.

## Hecho en Etapa 6

- Hardening de navegacion, CTAs y footer legal.
- Skip link global para navegacion por teclado.
- Metas SEO/social basicos en todas las paginas HTML.
- Canonicals relativos por pagina, preparados para reemplazo por dominio final si se define.
- `robots.txt`, `sitemap.xml`, favicon PNG y `site.webmanifest`.
- Ajuste del OG image del data pack para apuntar al asset existente.
- Documentacion de reglas de renderizado, estados de UI y checklist de publicacion.

## Rebuild V2

- Home reconstruida con narrativa comercial: hero fuerte, categorias, sistema, catalogo destacado, respaldo, sorteos/adjudicados, preguntas frecuentes, recursos y contacto.
- `/planes/` reconstruida como catalogo navegable por categorias.
- Nuevo data model `data/plan_catalog.json`.
- Contacto actualizado para recibir opciones de catalogo.
- Copy global reducido en disclaimers repetidos y ajustado a tono comercial sobrio.
- Paginas internas alineadas con la nueva arquitectura y CTAs.

## Corresponde a una futura integracion

- Configurar WhatsApp real, email comercial o endpoint.
- Reemplazar modo placeholder por POST real.
- Definir politica de almacenamiento y tratamiento de leads.
- Reemplazar `https://example.com` en `sitemap.xml` y `robots.txt` por el dominio final.
- Definir si los canonicals pasan a URL absoluta con dominio productivo.
- Reemplazar imagen OG SVG por PNG/JPG final si se necesita compatibilidad maxima en redes sociales.

## Pendientes de validacion

- WhatsApp y canales de contacto.
- Endpoint real del formulario.
- Rojo institucional definitivo.
- Links de gestiones pendientes.
- Verificar periodicamente que los endpoints de Artemis sigan disponibles y con la misma estructura.
- Assets finales de imagenes.

## Checklist antes de publicar

- Confirmar dominio final y actualizar `robots.txt`, `sitemap.xml` y, si corresponde, canonicals.
- Confirmar datos comerciales de `data/agency-contact.json`.
- Confirmar textos legales con responsable comercial o asesor correspondiente.
- Validar datos pendientes del data pack y reemplazar `mock` / `pending_validation` donde aplique.
- Correr el sitio con servidor estatico y revisar todas las rutas principales.
