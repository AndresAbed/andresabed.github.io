# Club San Jorge | Agencias Abed - Implementation Plan

## 1. Resumen del proyecto

El proyecto es una web estatica comercial e informativa para una agencia mercantil de Club San Jorge en Argentina. La V1 debe construirse con HTML semantico, CSS moderno y JavaScript vanilla modular, consumiendo archivos JSON locales desde `data_pack_v2/`.

`data_pack_v2/` es el source-of-truth editable del proyecto. Por ahora no se deben duplicar, migrar ni normalizar los JSON en otra carpeta; cualquier ajuste de contenido debe hacerse ahi y la web debe consumirlos directamente.

La web no debe presentarse como una app transaccional ni como un sistema de contratacion automatica. Su rol principal es orientar, explicar y captar consultas calificadas para una venta asistida por personas.

## 2. Objetivos de negocio y UX

Objetivos comerciales:

- Captar leads calificados.
- Generar consultas por WhatsApp o formulario.
- Orientar la conversion especialmente hacia planes 330, con prioridad comercial en `auto-330`.
- Facilitar el inicio de solicitud sin prometer contratacion automatica.

Objetivos informativos:

- Explicar con claridad que es Club San Jorge y como funcionan Capitalizacion y Ahorro.
- Aclarar que los planes 330 forman capital / ahorro y participan en sorteos estimulo bajo condiciones vigentes.
- Evitar mensajes que parezcan promesa de entrega automatica de auto, moto o dinero.
- Explicar rescates, sorteos, adjudicacion, continuidad del titulo y recursos oficiales.
- Mostrar datos no verificados con tratamiento prudente o directamente ocultarlos hasta validar.

Principios UX para la V1:

- Priorizar accesibilidad WCAG 2.2 AA.
- Mobile-first.
- Jerarquia visual simple: entender primero, convertir despues.
- CTAs claros y repetidos en puntos naturales, sin presion ni claims exagerados.
- Estados vacios y fallback para datos pendientes.
- Todo dato `pending_validation` o `mock` debe marcarse en codigo con `TODO: PENDING VALIDATION` si llega a renderizarse.

## Separacion conceptual de contenido

La arquitectura debe distinguir dos capas conceptuales, aunque ambas se consuman desde el mismo `data_pack_v2/`.

### A. Contenido oficial / sistema Club San Jorge

Esta capa explica el sistema y debe tratarse con mayor prudencia editorial. Incluye:

- Planes y condiciones generales: `plans.json`.
- FAQ del sistema: `faq.json`.
- Sorteos y reglas: `draws.json`.
- Adjudicados: `adjudications.json`.
- Recursos oficiales y gestiones: `resources.json`.
- Datos institucionales del club y textos legales: `site.json` (`club`, `legal`, parte de `brand`).

Reglas para esta capa:

- Renderizar con tono informativo, no comercial agresivo.
- No completar huecos con inferencias.
- Priorizar datos `verified`.
- Mostrar fallbacks o enlaces oficiales cuando haya datos incompletos.
- Evitar claims que modifiquen el sentido contractual del plan.

### B. Contenido comercial / operativo de la agencia

Esta capa orienta la conversion asistida y la confianza comercial de Agencias Abed. Incluye:

- Hero comercial y lockup: `site.json` (`agency`, `cta`).
- CTAs de asesoramiento e inicio de solicitud.
- WhatsApp, email y redes.
- Formularios y lead capture: `site.json` (`forms`).
- Explicacion del proceso con la agencia: `faq.json` categoria `agencia-y-proceso`.
- Copy de confianza, cobertura y acompanamiento.

Reglas para esta capa:

- Puede guiar al usuario a consultar, pero no debe prometer resultados del sistema.
- Las acciones sin destino configurado deben deshabilitarse u ocultarse.
- Los datos de contacto vacios no deben generar links rotos.
- El proceso debe aclarar que la inscripcion final es asistida por la agencia.

## 3. Inventario del data pack

Todos los JSON dentro de `data_pack_v2/` son sintacticamente validos.

Resumen global de estados detectados:

- `verified`: 54 apariciones.
- `pending_validation`: 21 apariciones.
- `mock`: 8 apariciones.
- `partial_mock`: 1 aparicion.

### `data_pack_v2/site.json`

Uso propuesto: configuracion global de marca, agencia, CTAs, SEO, disclaimers y formulario.

Estructura:

- `meta`: version y politica de estados.
- `agency`: nombre, lockup, tagline, descriptor legal, cobertura y canales de contacto.
- `brand`: nombre del club, area, flag para referencia institucional y paleta.
- `club`: headline, claim y estadisticas oficiales.
- `cta`: CTAs primario, secundario y WhatsApp.
- `forms`: provider y endpoint.
- `seo`: title, description y OG image.
- `legal`: texto de rol del sitio y disclaimer.

Listo para renderizar:

- Nombre de agencia, lockup, tagline, descriptor legal y cobertura.
- Estadisticas del club, todas `verified`.
- CTA primario y secundario.
- SEO base.
- Textos legales.

Pendiente / riesgoso:

- `agency.status` esta `pending_validation`.
- WhatsApp principal/secundario, email, Instagram y Facebook estan vacios.
- `cta.whatsapp.target` esta vacio.
- `forms.leadEndpoint` esta vacio y `forms.status` esta `pending_validation`.
- `brand.palette.primaryRed.value` esta vacio y `status` esta `pending_validation`.
- Colores neutros y blanco son `mock`.

Recomendacion:

- En Etapa 1, no renderizar botones de WhatsApp ni links sociales si su URL esta vacia.
- Usar paleta fallback accesible en CSS hasta validar rojo institucional.
- El formulario puede funcionar como UI preparada, pero sin envio real hasta tener endpoint.

### `data_pack_v2/plans.json`

Uso propuesto: paginas de planes, cards, comparador, bloques explicativos y FAQs relacionadas.

Estructura:

- `meta`: version, foco comercial y plan destacado.
- `systemSummary`: terminos oficiales, tipos de plan y reglas de rescate.
- `plans`: lista de planes con slug, orden, foco comercial, copy, imagenes, badges, aclaraciones, rescate y `faqRefs`.
- `comparator`: variante y columnas.

Planes:

- `auto-330`: plan prioritario, `termMonths`, `amortizationType`, rescate y textos clave `verified`.
- `moto-330`: plan secundario, varios campos `pending_validation`.
- `dinero`: plan secundario, plazo, amortizacion y rescate pendientes o nulos.

Relaciones:

- Todas las referencias `faqRefs` existen en `faq.json`.
- `meta.featuredPlanSlug` apunta a `auto-330`, que existe.
- `comparator.columns` apunta a los tres slugs existentes.

Listo para renderizar:

- Cards de planes.
- Pagina detalle de `auto-330`.
- Comparador basico si la UI contempla valores pendientes.
- Bloques "que es", "que obtenes al final", "aclaraciones importantes" y rescate.

Pendiente / riesgoso:

- `moto-330.termMonths`, `amortizationType`, rescate y una respuesta de cierre estan `pending_validation`.
- `dinero.termMonths`, `amortizationType` y rescate estan `null` + `pending_validation`.
- Imagenes apuntan a `/assets/img/...`, pero no existen todavia.

Recomendacion:

- La V1 puede publicar Auto 330 como pagina fuerte.
- Moto 330 y Dinero deben tener copy mas prudente y badges de informacion a confirmar si se muestran datos especificos.
- El comparador debe mostrar "A confirmar" para valores `null` o pendientes, nunca celdas vacias.

### `data_pack_v2/faq.json`

Uso propuesto: pagina FAQ, accordions por categoria, FAQs destacadas en Home y FAQs contextuales por plan.

Estructura:

- `meta`: version.
- `featuredFaqIds`: FAQs destacadas.
- `categories`: categorias con `slug`, `title`, `sortOrder` e `items`.

Categorias:

- `funcionamiento-general`: 4 items.
- `sorteos-y-adjudicacion`: 4 items.
- `plan-dinero`: 2 items.
- `pagos-y-gestiones`: 2 items.
- `agencia-y-proceso`: 2 items.

Listo para renderizar:

- Todas las FAQs actuales estan `verified`.
- `featuredFaqIds` contiene IDs existentes.

Pendiente / riesgoso:

- No hay search index ni tags; si se agrega buscador, debe generarse en JS.
- Algunas respuestas contienen informacion comercial/legal sensible y deben conservar tono informativo.

Recomendacion:

- Implementar accordions accesibles con `<button>` y `aria-expanded`.
- Mantener respuestas cortas; para explicaciones largas, enlazar a paginas de plan o recursos.

### `data_pack_v2/resources.json`

Uso propuesto: hub de recursos oficiales, pagos y gestiones.

Estructura:

- `groups`: grupos con recursos externos.
- Grupo `gestiones`: 5 items.
- Grupo `informacion-oficial`: 3 items.

Listo para renderizar:

- `pagar-cuota`, `el-sistema`, `faq-oficial` y `adjudicados-oficial` tienen URLs verificadas.

Pendiente / riesgoso:

- `descargar-boleta`, `medios-de-pago`, `debito-automatico` y `boleta-digital` no tienen URL y estan `pending_validation`.

Recomendacion:

- Renderizar recursos sin URL como cards deshabilitadas o bajo una seccion "A validar", no como enlaces rotos.
- Abrir enlaces externos con `target="_blank"` y `rel="noopener noreferrer"`.

### `data_pack_v2/draws.json`

Uso propuesto: bloque de sorteos en Home y pagina de sorteos/resultados.

Estructura:

- `schedule`: regla oficial de sorteos.
- `lastDraw`: fecha pendiente.
- `nextDraw`: fecha pendiente.
- `stimuli`: tres estimulos con numeros ganadores pendientes.

Listo para renderizar:

- Regla oficial de sorteos, `verified`.

Pendiente / riesgoso:

- `lastDraw.date`, `nextDraw.date` y `winningNumber` estan vacios.
- Todos esos campos estan `pending_validation`.

Recomendacion:

- En V1, mostrar la regla oficial y un estado vacio honesto: "Resultados pendientes de carga / validar en fuente oficial".
- No mostrar cajas de numeros si estan vacias.

### `data_pack_v2/adjudications.json`

Uso propuesto: pagina de adjudicados, tabla filtrable por anio/mes y preview en Home.

Estructura:

- `meta`: version, `partial_mock` y columnas.
- `availableYears`: 2026, 2025, 2024.
- `availableMonthsByYear`: meses mock.
- `data`: una fila mock en junio 2026.

Listo para renderizar:

- Columnas de tabla verificadas.
- Anios disponibles verificados.

Pendiente / riesgoso:

- `meta.status` es `partial_mock`.
- Meses disponibles son `mock`.
- Datos de adjudicados contienen una fila de ejemplo `mock`.

Recomendacion:

- No publicar tabla con datos mock como si fueran reales.
- Hasta validar datos, usar CTA/link hacia "Adjudicados oficiales" de `resources.json`.
- Si se arma la UI, incluir estado vacio y comentario `TODO: PENDING VALIDATION` para carga real.

### `data_pack_v2/videos.json`

Uso propuesto: bloque opcional de videos pedagogicos.

Estructura:

- `items`: videos con titulo, descripcion, URL de YouTube, thumbnail y estado.

Listo para renderizar:

- Titulos y descripciones sirven como placeholders de contenido.

Pendiente / riesgoso:

- `youtubeUrl` esta vacio en ambos videos.
- Thumbnails apuntan a imagenes placeholder no existentes.
- Ambos items estan `pending_validation`.

Recomendacion:

- No mostrar seccion de videos en V1 salvo que haya URLs reales.
- Si se mantiene el slot, dejarlo como componente preparado pero oculto cuando no haya videos validos.

### `data_pack_v2/home-sections.json`

Uso propuesto: orden y activacion de secciones de Home.

Estructura:

- `sections`: lista ordenada de secciones habilitadas.

Secciones actuales:

- `hero`
- `featured-plans`
- `how-it-works`
- `draws-summary`
- `adjudications-preview`
- `faq-highlight`
- `resources-hub`
- `lead-form`

Listo para renderizar:

- Sirve como declaracion de orden.

Pendiente / riesgoso:

- Las secciones `draws-summary`, `adjudications-preview`, `videos` si se agregara, y `lead-form` dependen de datos incompletos.

Recomendacion:

- El renderer de Home debe poder saltar secciones cuando no hay datos suficientes, aunque `enabled` sea `true`.

## 4. Riesgos, pendientes y validaciones

Riesgos comerciales / legales:

- No presentar "pagar X cuotas = entrega automatica de auto/moto".
- No convertir sorteos estimulo en promesa de adjudicacion.
- No publicar datos `mock` de adjudicados.
- No publicar numeros de sorteos vacios o no validados.
- No ocultar que la inscripcion final es asistida por la agencia.
- Reforzar lectura de contrato y condiciones vigentes.

Datos a validar antes de publicar:

- WhatsApp principal y secundario.
- Email y redes sociales de la agencia.
- Endpoint real del formulario.
- Rojo institucional o paleta oficial completa.
- URLs de descargar boleta, medios de pago, debito automatico y boleta digital.
- Fechas y resultados de sorteos.
- Base real de adjudicados o decision de enlazar solo a fuente oficial.
- URLs de videos oficiales si se usaran.
- Confirmacion especifica de datos pendientes en Moto 330 y Plan Dinero.

Campos que pueden romper UI si vienen vacios:

- `agency.primaryWhatsapp`, `cta.whatsapp.target`: botones sin destino.
- `forms.leadEndpoint`: formulario sin accion.
- `brand.palette.primaryRed.value`: token CSS invalido si se usa directo.
- `draws.lastDraw.date`, `draws.nextDraw.date`, `stimuli[].winningNumber`: tarjetas vacias.
- `resources.groups[].items[].url`: links rotos.
- `plans[].termMonths.value`, `plans[].rescue.canRequestFromInstallment`: comparador con celdas vacias.
- `videos[].youtubeUrl`: embeds rotos.
- `heroImage`, `cardImage`, `thumbnail`, `seo.defaultOgImage`: imagenes inexistentes.

Regla de implementacion:

- Todo render de dato `pending_validation`, `mock` o `partial_mock` debe pasar por helpers de estado.
- Todo dato oficial dudoso debe quedar con comentario `TODO: PENDING VALIDATION`.
- Los componentes deben tener fallback visible: "A confirmar", "Disponible proximamente" o enlace a fuente oficial.

## 5. Arquitectura de carpetas propuesta

Estructura recomendada para V1:

```text
/
  index.html
  planes/
    index.html
    auto-330.html
    moto-330.html
    dinero.html
  adjudicados/
    index.html
  sorteos/
    index.html
  recursos/
    index.html
  faq/
    index.html
  iniciar-solicitud/
    index.html
  assets/
    css/
      main.css
      tokens.css
      base.css
      layout.css
      components.css
      utilities.css
      pages.css
    js/
      main.js
      data/
        api.js
        normalizers.js
        validators.js
      components/
        header.js
        footer.js
        plan-card.js
        faq-accordion.js
        plan-comparator.js
        resource-card.js
        draw-summary.js
        adjudications-table.js
        lead-form.js
        callout.js
      pages/
        home.js
        plans.js
        plan-detail.js
        faq.js
        resources.js
        draws.js
        adjudications.js
        lead.js
      utils/
        dom.js
        formatters.js
        status.js
    img/
      plans/
      placeholders/
      og/
  data_pack_v2/
    *.json
```

Notas:

- Mantener `data_pack_v2/` como source-of-truth editable y versionado para esta V1.
- No mover JSON a `assets/data/` en Etapa 1. Si mas adelante el deploy exige otra ubicacion publica, la copia debe tratarse como artefacto de build, no como fuente editable.
- Cada pagina HTML debe tener estructura semantica minima y cargar solo el JS de pagina necesario.
- La navegacion puede hidratar header/footer desde componentes JS simples para evitar duplicacion.

## 6. Estrategia de datos

Carga:

- Usar `fetch("/data_pack_v2/site.json")` y equivalentes desde un data layer pequeno.
- Consumir directamente desde `data_pack_v2/`; no duplicar ni migrar contenido a `assets/data/`.
- Servir localmente con un server estatico durante desarrollo; abrir archivos con `file://` puede bloquear `fetch`.
- Centralizar rutas en `assets/js/data/api.js`.

Data layer:

- `loadSite()`
- `loadPlans()`
- `loadFaq()`
- `loadResources()`
- `loadDraws()`
- `loadAdjudications()`
- `loadVideos()`
- `loadHomeSections()`
- `loadAllForHome()`

Helpers recomendados:

- `getPlanBySlug(slug)`
- `getFeaturedPlan()`
- `getFaqById(id)`
- `getFaqsForPlan(plan)`
- `getFeaturedFaqs()`
- `getResourceById(id)`
- `getResourcesByGroup(slug)`
- `getRenderableResources(items)`
- `hasValidUrl(item)`
- `hasRenderableDrawResults(draws)`
- `getStatusBadge(status)`
- `formatNullable(value, fallback = "A confirmar")`

Validacion ligera:

- Validar existencia de arrays antes de iterar.
- Validar `slug`, `id`, `title`, `name` antes de renderizar cards.
- Validar URL antes de crear `<a>`.
- Validar `status` antes de mostrar datos sensibles.
- Loguear advertencias en desarrollo, no romper la pagina publica.

Estados vacios:

- Sin WhatsApp: ocultar CTA WhatsApp.
- Sin endpoint: mostrar alternativa de contacto o formulario deshabilitado con texto claro.
- Sin sorteos: mostrar regla oficial y enlace a fuente oficial.
- Sin adjudicados reales: mostrar enlace a adjudicados oficiales.
- Sin imagen: usar placeholder local con alt honesto o un bloque visual no fotografico.

## Data Rendering Rules

Estas reglas deben aplicarse en el data layer y en todos los componentes antes de renderizar contenido de `data_pack_v2/`.

### Source-of-truth

- `data_pack_v2/` es la unica fuente editable de datos para la V1.
- Los componentes no deben hardcodear contenido oficial ni duplicar datos del pack.
- Si un dato falta o necesita correccion, se actualiza el JSON correspondiente en `data_pack_v2/`.
- Cualquier cache, transformacion o copia futura debe considerarse derivada y descartable.

### Valores vacios, nulos o indefinidos

Aplica a valores como `""`, `null`, `undefined`, arrays inexistentes o strings con solo espacios.

- No renderizar strings vacios en pantalla.
- No crear enlaces, botones, embeds, imagenes ni filas de tabla con valores vacios.
- Mostrar fallback textual solo cuando el dato sea relevante para entender la seccion.
- Fallback recomendado para datos informativos: "Informacion en actualizacion".
- Fallback recomendado para valores comparativos: "A confirmar".
- Si el valor vacio corresponde a una accion, la accion debe quedar `disabled` u oculta.
- Si el valor vacio corresponde a una imagen, usar placeholder o layout sin imagen, nunca imagen rota.

### Items con `status: pending_validation`

- Pueden mostrarse solo si ayudan a entender la experiencia y no comunican una promesa sensible.
- Deben pasar por helper de estado antes de renderizar.
- Si son datos contractuales, comerciales, de contacto, resultados, fechas o enlaces, tratarlos como `partial` o `disabled` hasta validar.
- En codigo, cualquier render de estos datos debe incluir comentario `TODO: PENDING VALIDATION`.
- En UI publica, no mostrar la etiqueta tecnica `pending_validation`; usar copy humano como "Informacion en actualizacion" o "A confirmar".
- Si hay una fuente oficial disponible, preferir CTA hacia esa fuente antes que mostrar un dato pendiente.

### Items con `status: mock`

- No deben publicarse como contenido real.
- Pueden usarse solo para probar estructura visual localmente.
- En UI publica, deben ocultarse, reemplazarse por estado vacio o derivar a una fuente oficial.
- En codigo, cualquier uso temporal debe incluir comentario `TODO: MOCK DATA - DO NOT PUBLISH`.
- Las tablas o listados basados mayormente en mock deben considerarse `empty` para produccion.

### Secciones parcialmente completas

Una seccion es `partial` cuando tiene contenido suficiente para orientar, pero faltan datos secundarios o acciones completas.

- Sorteos sin fecha o numeros: mostrar la regla oficial verificada y un fallback "Resultados en actualizacion"; ocultar tarjetas de numeros vacios.
- Recursos con links faltantes: mostrar recursos con URL valida como links; mostrar recursos sin URL como cards deshabilitadas o moverlos a un bloque "Gestiones a validar".
- Adjudicados con meses faltantes o data mock: no mostrar tabla como real; mostrar enlace a adjudicados oficiales y estado informativo.
- Videos sin URL: ocultar embeds y cards de video; no mostrar thumbnails sin video.
- Plan Dinero o Moto 330 con campos incompletos: mostrar descripcion general verificada, ocultar o marcar como "A confirmar" los campos especificos pendientes.
- Plan Auto 330: puede tratarse como `ready` para la V1 porque sus datos clave estan verificados.

### CTAs o acciones sin destino configurado

- WhatsApp vacio: ocultar el boton de WhatsApp o mostrarlo deshabilitado solo si el contexto necesita explicar que el canal estara disponible.
- Endpoint de formulario vacio: no enviar formularios; mostrar formulario deshabilitado, alternativa de contacto validada o mensaje "Canal de solicitud en configuracion".
- Links externos vacios: no renderizar `<a href="">`.
- CTA primario/secundario con destino interno valido: puede mostrarse.
- Si una accion esta deshabilitada, debe tener texto visible que explique el motivo y no depender solo de color.

### Estados de UI

Cada componente o seccion debe resolver uno de estos estados antes de renderizar:

- `ready`: datos minimos completos, sin dependencias criticas pendientes. Se muestra la seccion completa y sus acciones.
- `partial`: hay contenido util, pero faltan campos secundarios. Se muestra la seccion, se ocultan subbloques incompletos y se usan fallbacks como "A confirmar" o "Informacion en actualizacion".
- `empty`: no hay datos suficientes para que la seccion aporte valor. Se muestra un estado vacio si la seccion es importante para la confianza, o se oculta si es secundaria.
- `disabled`: la seccion o accion existe conceptualmente, pero no puede usarse por falta de destino, datos mock o validacion pendiente. Se muestra deshabilitada solo si ayuda a explicar el proceso; si no, se oculta.

Criterios de render:

- Mostrar la seccion igual cuando tenga informacion `verified` suficiente para orientar al usuario.
- Ocultar un subbloque cuando sus campos requeridos esten vacios, `mock` o sean acciones sin destino.
- Mostrar fallback cuando el dato faltante sea esperado por el usuario y su ausencia necesite explicacion.
- Deshabilitar una accion cuando el usuario podria intentar usarla pero falta configuracion.
- Usar "Informacion en actualizacion" para datos oficiales incompletos.
- Usar "A confirmar" para campos comparativos o especificaciones puntuales.
- Usar enlaces oficiales cuando la data local no esta lista pero existe fuente confiable.

## 7. Estrategia de componentes

Los componentes deben respetar la separacion conceptual entre contenido oficial/sistema y contenido comercial/operativo de la agencia. La separacion es de responsabilidad editorial y UX, no de carpetas de datos: todo sigue saliendo de `data_pack_v2/`.

Componentes base:

- `SiteHeader`: navegacion, CTA principal, menu mobile.
- `SiteFooter`: disclaimer legal, recursos oficiales, datos de agencia disponibles.
- `CtaBand`: CTA reutilizable con variante primaria/secundaria.
- `StatusBadge`: `verified`, `pending_validation`, `mock`; en produccion solo usar internamente o para estados "A confirmar".
- `LegalCallout`: aclaraciones sensibles.
- `EmptyState`: mensaje y accion sugerida.

Componentes de contenido oficial / sistema:

- `PlanCard`: imagen, nombre, resumen, badges, CTA.
- `PlanDetailHero`: headline, resumen, disclaimers y CTA.
- `PlanFacts`: plazo, tipo, rescate.
- `PlanComparator`: columnas definidas por `plans.comparator.columns`.
- `FaqAccordion`: accesible, agrupado por categoria.
- `ResourceCard`: link externo o estado deshabilitado.
- `DrawSummary`: regla oficial, proximo/ultimo sorteo si existen.
- `AdjudicationsTable`: tabla con filtros, solo cuando haya datos reales.
- `VideoCard`: solo si `youtubeUrl` es valida.

Componentes comerciales / operativos de agencia:

- `AgencyHero`: lockup, tagline, cobertura y CTA principal desde `site.agency` y `site.cta`.
- `ContactOptions`: WhatsApp, email y redes solo cuando tengan destino valido.
- `LeadForm`: formulario progresivo, preparado para endpoint futuro.
- `AgencyProcessSteps`: explicacion breve de solicitud asistida.
- `TrustCopyBlock`: mensajes de acompanamiento, claridad y lectura de documentacion.
- `CommercialCtaBand`: CTA de asesoramiento con fallback si WhatsApp o formulario no estan listos.

Componentes compartidos:

- `LegalCallout`: para aclaraciones contractuales y rol de la agencia.
- `EmptyState`: para datos oficiales incompletos o acciones no configuradas.
- `StatusAwareBlock`: wrapper simple para resolver `ready`, `partial`, `empty` o `disabled`.
- `SafeLink`: helper/componente para no crear anchors sin URL.
- `FallbackMedia`: imagen o bloque visual alternativo cuando falten assets.

Patron sin framework:

- Cada componente exporta una funcion pura que recibe data y devuelve un nodo DOM o string seguro.
- Evitar `innerHTML` con datos externos cuando no sea necesario; usar helpers DOM para texto.
- Separar componentes genericos de scripts de pagina.
- Los componentes deben fallar suave si faltan campos.
- Cada componente debe declarar sus campos requeridos y su estado resultante (`ready`, `partial`, `empty`, `disabled`) antes de pintar.

## 8. Estrategia de estilos

Organizacion:

- `tokens.css`: colores, tipografia, radios, sombras, espaciado, breakpoints.
- `base.css`: reset, body, links, headings, focus styles.
- `layout.css`: containers, grids, page shells, section spacing.
- `components.css`: botones, cards, accordions, callouts, tablas, formularios.
- `utilities.css`: helpers de display, spacing, visually-hidden.
- `pages.css`: ajustes especificos por pagina.
- `main.css`: imports.

Tokens iniciales:

- Usar `brandGreen` verificado como acento confiable.
- Definir rojo institucional como fallback hasta validar `primaryRed`.
- Neutros mock pueden usarse como base tecnica, con comentario de validacion.
- Garantizar contraste AA para botones, textos y focus states.

Lineamientos UI:

- Mobile-first con container maximo para lectura.
- Secciones de explicacion con pasos cortos.
- Cards simples, sin anidar cards dentro de cards.
- Botones con verbos: "Quiero asesoramiento", "Ver plan", "Consultar por este plan".
- Accordions con botones nativos y foco visible.
- Tablas responsivas con scroll horizontal controlado o layout por cards en mobile.

## 9. Estrategia de imagenes y placeholders

Problema actual:

- Los JSON referencian imagenes en `/assets/img/...`, pero esas imagenes no existen todavia.

Convencion propuesta:

```text
assets/img/
  plans/
    auto-330-hero.jpg
    auto-330-card.jpg
    moto-330-hero.jpg
    moto-330-card.jpg
    dinero-hero.jpg
    dinero-card.jpg
  placeholders/
    plan-card.jpg
    plan-hero.jpg
    video-thumb-1.jpg
    video-thumb-2.jpg
  og/
    default-og.jpg
```

Fallbacks:

- Si la imagen no existe o no esta validada, usar placeholder neutral.
- No usar imagenes que prometan entrega de auto/moto si el copy habla de capitalizacion y ahorro.
- Alt text descriptivo y prudente: "Imagen ilustrativa del plan Auto 330", si no es imagen oficial.
- Evitar imagenes oscuras, borrosas o puramente decorativas en Hero.

## 10. Mapa del sitio V1

Paginas recomendadas:

1. Home (`/index.html`)
   - Entrada comercial e informativa.
   - Debe priorizar Auto 330, explicar el sistema y guiar a consulta asistida.

2. Planes (`/planes/index.html`)
   - Hub comparativo de planes.
   - Ayuda a decidir sin sobrecargar la Home.

3. Plan Auto 330 (`/planes/auto-330.html`)
   - Pagina prioritaria por foco comercial.
   - Debe tener la explicacion mas completa y clara.

4. Plan Moto 330 (`/planes/moto-330.html`)
   - Pagina secundaria.
   - Publicar con cautela por campos pendientes.

5. Plan Dinero (`/planes/dinero.html`)
   - Pagina secundaria.
   - Debe evitar confundirse con entrega de bien fisico.

6. Sorteos / resultados (`/sorteos/index.html`)
   - Explica regla oficial y eventualmente muestra resultados.
   - Mientras falten datos, debe enlazar a fuente oficial o mostrar estado pendiente.

7. Adjudicados (`/adjudicados/index.html`)
   - En V1 puede ser hub informativo con link oficial.
   - No publicar tabla mock como resultado real.

8. Recursos / pagos y gestiones (`/recursos/index.html`)
   - Hub de enlaces oficiales y gestiones frecuentes.
   - Debe distinguir enlaces disponibles de pendientes.

9. FAQ (`/faq/index.html`)
   - Resuelve objeciones y reduce confusion.
   - Organizada por categorias del JSON.

10. Iniciar solicitud / contacto (`/iniciar-solicitud/index.html`)
    - Captura lead o deriva a WhatsApp cuando este validado.
    - Debe explicar que la inscripcion final es asistida.

No recomendado para V1:

- Pagina de videos separada, porque no hay URLs validadas.
- Blog o novedades, porque no hay data ni proceso editorial.

## 11. Secciones por pagina

### Home

Objetivo: explicar rapido la propuesta, orientar al plan prioritario y abrir consulta.

Secciones:

- Hero comercial/agencia: `site.json` (`agency`, `cta`) + `plans.meta.featuredPlanSlug`.
- Respaldo institucional/sistema: `site.json` (`club`, `legal`).
- Plan destacado y cards oficiales: `plans.json`.
- Como funciona el sistema: `plans.systemSummary`, `faq.json` y copy pedagogico derivado.
- Sorteos resumen: `draws.json`, con fallback si faltan fechas/numeros.
- Adjudicados preview: `adjudications.json` solo si hay datos reales; si no, `resources.adjudicados-oficial`.
- FAQ destacada: `faq.featuredFaqIds`.
- Recursos oficiales: `resources.json`.
- Lead form / CTA final agencia: `site.forms`, `site.cta`, con fallback si faltan canales.

Componentes:

- `SiteHeader`, `PlanCard`, `CtaBand`, `DrawSummary`, `FaqAccordion`, `ResourceCard`, `LeadForm`, `LegalCallout`.

### Planes

Objetivo: comparar alternativas y conducir a detalle o consulta.

Secciones:

- Intro oficial sobre Capitalizacion y Ahorro: `site.legal`, `plans.systemSummary`.
- Cards de planes: `plans.plans`.
- Comparador: `plans.comparator`.
- Aclaraciones importantes: `plans.systemSummary.planTypes`.
- CTA comercial de asesoramiento: `site.cta`.

Componentes:

- `PlanCard`, `PlanComparator`, `LegalCallout`, `CtaBand`.

### Plan Auto 330

Objetivo: pagina de conversion e informacion principal.

Secciones:

- Hero del plan: `plans.plans[slug=auto-330]`.
- Que es: `whatItIs`.
- Que obtenes al final: `whatYouGetAtEnd`.
- Aclaraciones: `importantClarifications`.
- Rescate: `rescue`.
- FAQs relacionadas: `faqRefs` + `faq.json`.
- Recursos oficiales: `resources.informacion-oficial`.
- CTA final: `site.cta`.

Componentes:

- `PlanDetailHero`, `PlanFacts`, `LegalCallout`, `FaqAccordion`, `ResourceCard`, `CtaBand`.

### Plan Moto 330

Objetivo: informar y captar consulta secundaria sin sobredimensionar datos pendientes.

Secciones:

- Hero del plan: `plans.plans[slug=moto-330]`.
- Que es y aclaraciones: `whatItIs`, `importantClarifications`.
- Datos pendientes con fallback: `termMonths`, `amortizationType`, `rescue`.
- FAQs relacionadas.
- CTA de consulta.

Componentes:

- `PlanDetailHero`, `PlanFacts`, `LegalCallout`, `FaqAccordion`, `CtaBand`.

### Plan Dinero

Objetivo: explicar que es capital/dinero y evitar confusion con bienes fisicos.

Secciones:

- Hero: `plans.plans[slug=dinero]`.
- Que es: `whatItIs`.
- Que se obtiene al final: `whatYouGetAtEnd`.
- Aclaraciones: `importantClarifications`.
- Datos pendientes con fallback.
- FAQs relacionadas.
- CTA de consulta.

Componentes:

- `PlanDetailHero`, `PlanFacts`, `LegalCallout`, `FaqAccordion`, `CtaBand`.

### Sorteos / resultados

Objetivo: explicar la regla oficial y mostrar resultados solo si estan validados.

Secciones:

- Regla oficial: `draws.schedule`.
- Ultimo/proximo sorteo: `draws.lastDraw`, `draws.nextDraw`, solo si hay fechas.
- Estimulos: `draws.stimuli`, solo si hay numeros.
- FAQs relacionadas: categoria `sorteos-y-adjudicacion`.
- Link a recurso oficial si aplica.

Componentes:

- `DrawSummary`, `EmptyState`, `FaqAccordion`, `ResourceCard`.

### Adjudicados

Objetivo: orientar a la consulta oficial y preparar UI para datos reales.

Secciones:

- Intro y aclaracion de fuente.
- Link a adjudicados oficiales: `resources.json`.
- Tabla solo cuando `adjudications.meta.status` deje de ser `partial_mock`.
- Empty state mientras haya mock.

Componentes:

- `AdjudicationsTable`, `EmptyState`, `ResourceCard`, `LegalCallout`.

### Recursos / pagos y gestiones

Objetivo: centralizar gestiones y fuentes oficiales.

Secciones:

- Recursos destacados: `resources.groups[].items[featured=true]`.
- Pagos y gestiones.
- Informacion oficial.
- FAQ de pagos: categoria `pagos-y-gestiones`.

Componentes:

- `ResourceCard`, `FaqAccordion`, `EmptyState`.

### FAQ

Objetivo: responder preguntas frecuentes y reducir riesgo de malentendidos.

Secciones:

- Intro con promesa de claridad.
- Categorias de FAQ: `faq.categories`.
- CTA de consulta si queda duda.

Componentes:

- `FaqAccordion`, `CtaBand`.

### Iniciar solicitud / contacto

Objetivo: captar lead y derivar a asesoramiento humano.

Secciones:

- Intro comercial/agencia: proceso asistido.
- Formulario operativo: `site.forms`, con estado si no hay endpoint.
- Canales disponibles de agencia: `site.agency`, ocultando vacios.
- Aclaracion oficial/legal: `site.legal`.
- FAQs de agencia y proceso: categoria `agencia-y-proceso`.

Componentes:

- `LeadForm`, `ContactOptions`, `LegalCallout`, `FaqAccordion`.

## 12. Roadmap por etapas

### Etapa 1: Setup estatico y base tecnica

- Crear estructura de carpetas.
- Crear HTML base por pagina con landmarks semanticos.
- Crear CSS base con tokens, reset, layout y componentes iniciales.
- Crear data layer JS para cargar JSON directamente desde `data_pack_v2/`.
- Crear helpers de estado, URL, nulls, status e imagenes fallback.
- Implementar resolucion de estados `ready`, `partial`, `empty` y `disabled`.
- Renderizar header/footer basicos desde `site.json`.
- Definir server estatico simple para desarrollo.

### Etapa 2: Home informativa/comercial

- Implementar secciones habilitadas por `home-sections.json`.
- Priorizar Hero, plan destacado, "como funciona", FAQ destacadas y recursos.
- Agregar fallbacks para sorteos, adjudicados y lead form.
- Revisar mobile y accesibilidad.

### Etapa 3: Planes y comparador

- Implementar `/planes/`.
- Implementar paginas de detalle de Auto 330, Moto 330 y Dinero.
- Implementar comparador con valores "A confirmar".
- Enfatizar Auto 330 como plan prioritario sin ocultar alternativas.

### Etapa 4: FAQ, recursos, sorteos y adjudicados

- Implementar accordions FAQ accesibles.
- Implementar recursos con enlaces externos validados y cards deshabilitadas para pendientes.
- Implementar sorteos con estado vacio honesto.
- Implementar adjudicados como hub oficial o tabla solo si hay data real.

### Etapa 5: Lead capture / contacto

- Implementar formulario progresivo.
- Validar campos minimos: nombre, telefono, interes, provincia/localidad opcional.
- Integrar endpoint cuando este validado.
- Agregar estados loading, success y error.
- Agregar WhatsApp cuando haya numero oficial.

### Etapa 6: Pulido final y QA

- QA responsive mobile/tablet/desktop.
- QA teclado y foco.
- Revisión de contraste.
- Revisión de copy sensible.
- Verificacion de links externos.
- Revision final de `pending_validation` y `mock` antes de publicar.
- SEO tecnico basico: titles, descriptions, OG, sitemap simple si corresponde.

## 13. Recomendaciones para la Etapa 1

Prioridad tecnica:

- Crear estructura base sin contenido hardcodeado final.
- Implementar data layer primero.
- Implementar helpers de estado y reglas de renderizado antes de componentes.
- Mantener `data_pack_v2/` como source-of-truth editable y consumirlo directamente.
- Agregar comentarios `TODO: PENDING VALIDATION` en cualquier render de dato pendiente.

Primeros componentes:

- Header/footer.
- Botones y CTAs.
- PlanCard.
- LegalCallout.
- EmptyState.
- FaqAccordion.
- ResourceCard.

Validaciones antes de avanzar demasiado:

- Confirmar numero de WhatsApp.
- Confirmar endpoint de formulario o decidir que la Etapa 1 no tendra envio.
- Confirmar paleta primaria.
- Decidir si adjudicados se publican como tabla real o solo enlace oficial.

Definicion de terminado para Etapa 1:

- El sitio abre en servidor local.
- Los JSON cargan sin errores.
- Header/footer renderizan desde `site.json`.
- Existe una pagina Home tecnica minima con placeholders controlados, no una home comercial final.
- Los helpers evitan links rotos, imagenes rotas y celdas vacias.
- No se publica ni se presenta como real ningun dato `mock`.
