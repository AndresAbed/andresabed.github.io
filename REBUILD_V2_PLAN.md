# Rebuild V2 Plan - Club San Jorge | Agencias Abed

## Diagnostico de V1

La V1 dejo una base tecnica util, pero la arquitectura comercial quedo demasiado generica. El mayor problema esta en planes: el sitio presenta tres cards abstractas como si fueran productos cerrados de software, cuando deberia funcionar como catalogo comercial de una agencia mercantil de Club San Jorge.

Problemas a corregir:

- `Auto 330`, `Moto 330` y `Plan Dinero` aparecen como nombres principales. En V2, `330` debe tratarse como caracteristica del sistema/plazo cuando aplique, no como naming comercial.
- `/planes/` funciona como hub comparativo de tres opciones. En V2 debe ser un catalogo navegable por categoria: Autos, Motos y Dinero.
- La home explica, pero no vende ni orienta con suficiente jerarquia. En V2 debe presentar agencia, categorias, sistema, catalogo destacado, respaldo, sorteos/adjudicados, FAQ y contacto.
- Hay demasiados textos defensivos en bloques visibles. En V2 los disclaimers se concentran en footer, contacto, FAQ y aclaraciones puntuales.
- Las paginas internas sirven como base, pero necesitan tono mas editorial, CTAs consistentes y menos copy repetitivo.

## Referencias usadas

- `IMPLEMENTATION_PLAN.md`
- `README.md`
- `data_pack_v2/`
- `data_pack_v2/agency-contact.json`
- HTML/CSS/JS vanilla actual
- Web oficial de Club San Jorge:
  - `https://clubsanjorge.com.ar/capitalizacion-y-ahorro/el-sistema`
  - `https://clubsanjorge.com.ar/capitalizacion-y-ahorro/preguntas-frecuentes`

Puntos oficiales usados para evitar claims incorrectos:

- El objeto del contrato es formar un capital equivalente al Valor Nominal del Titulo al final del plazo.
- Los planes 330 meses son no amortizantes.
- Los planes 90 y 120 meses son amortizantes.
- En planes 330, el rescate puede solicitarse desde cuota 18.
- Los sorteos se realizan mediante LOTBA, salvo excepciones aprobadas por IGJ.
- Si el titulo sale favorecido y la persona sigue pagando, puede volver a ganar si el numero vuelve a repetirse.
- No corresponde comunicar entrega automatica de auto o moto por el simple pago de cuotas.

## Que se conserva

- Stack multipagina HTML + CSS + JS vanilla.
- `data_pack_v2/` como source-of-truth editable.
- Shell global: header, nav, footer y skip link.
- Data layer modular en `assets/js/data/api.js`.
- Paginas internas existentes: sorteos, adjudicados, recursos, FAQ y contacto.
- Estados `ready`, `partial`, `empty`, `disabled`.
- Fallbacks para datos no validados.

## Que se rehace

- Home completa.
- `/planes/` completo.
- Modelo de datos de planes/catalogo.
- Componentes visuales de catalogo.
- Copy principal, CTAs y tono editorial.
- CSS de hero, catalogo, fichas, sistema, bloques de confianza y cierres.

## Nuevo data model

Crear `data_pack_v2/plan_catalog.json`.

Estructura:

- `meta`: version, fuente editorial, categorias destacadas.
- `categories`: Autos, Motos, Dinero, con `slug`, `label`, `description`, `theme`, `sortOrder`.
- `items`: listado catalogable con:
  - `id`
  - `slug`
  - `category`
  - `displayName`
  - `brand`
  - `model`
  - `planLabel`
  - `months`
  - `valorNominal`
  - `cuota`
  - `currency`
  - `status`
  - `featured`
  - `description`
  - `notes`
  - `faqRefs`
  - `contactPreset`
  - `sourceStatus`

No se inventan valores nominales, cuotas ni modelos si no estan confirmados. Los items pueden existir como opciones comerciales con datos pendientes, siempre que la UI los marque como `A confirmar`.

Mantener `plans.json` como compatibilidad para paginas detalle existentes, pero la V2 de Home y `/planes/` debe consumir `plan_catalog.json`.

## Nueva arquitectura de `/planes/`

1. Hero de catalogo:
   - Explica que la persona puede explorar Autos, Motos y Dinero.
   - CTA principal a contacto y CTA secundario a explicacion del sistema.

2. Navegacion por categoria:
   - Tabs/anclas: Autos, Motos, Dinero.
   - Debe funcionar sin SPA.

3. Catalogo por categoria:
   - Fichas/listado comercial.
   - Mostrar titulo, categoria, marca/modelo si existe, plazo, valor nominal, cuota, observaciones y CTA.
   - Si falta data: `A confirmar`, no inventar.

4. Bloque del sistema:
   - Capitalizacion y ahorro.
   - Pago de cuotas para formar capital.
   - Sorteos/adjudicaciones.
   - Final del plan.
   - 330 como plazo/caracteristica del sistema, no como naming comercial.

5. FAQ breve:
   - Preguntas sensibles relacionadas con final del plan, sorteos, continuidad y cuotas.

## Nueva Home V2

1. Hero fuerte:
   - Agencia mercantil, asesoramiento y exploracion de catalogo.
   - Maximo 2 CTAs.
   - Panel visual con Autos, Motos, Dinero y datos de respaldo.

2. Entrada a categorias:
   - Autos, Motos, Dinero como puertas de catalogo.

3. Como funciona:
   - Pasos visuales y callouts sobrios.
   - Enfasis en capital, cuotas, sorteos, adjudicacion y final del plan.

4. Catalogo destacado:
   - Items destacados de cada categoria, no tres cards abstractas.

5. Respaldo:
   - Datos verificados del data pack y rol de agencia.

6. Sorteos/adjudicados:
   - Bloque integrado con sistema y links a secciones/fuente oficial.

7. FAQ:
   - Dudas sensibles.

8. Cierre/contacto:
   - Consulta asistida y pre-solicitud.

## Disclaimers y copy

Eliminar repeticion defensiva en:

- Hero.
- Fichas de catalogo.
- Cierres de cada seccion.

Mantener aclaraciones en:

- Footer.
- Contacto/pre-solicitud.
- FAQ.
- Bloques sensibles del sistema.
- Recursos/contrato cuando aplique.

## Paginas internas

- `/sorteos/`: tono mas claro y CTA a contacto; evitar texto defensivo repetido.
- `/adjudicados/`: mantener proteccion contra datos mock, pero con copy menos pesado.
- `/recursos/`: mejorar orientacion y acceso a gestiones.
- `/faq/`: priorizar preguntas sensibles, sin sobreactuar disclaimer.
- `/contacto/`: usar opciones de catalogo en select y copy comercial mas claro.

## Archivos a tocar

- Crear `REBUILD_V2_PLAN.md`.
- Crear `data_pack_v2/plan_catalog.json`.
- Actualizar `README.md`.
- Actualizar `assets/js/data/api.js`.
- Rehacer `assets/js/pages/home.js`.
- Rehacer `assets/js/pages/plans.js`.
- Rehacer o ampliar `assets/js/components/plan-components.js`.
- Ajustar `assets/js/components/contact-components.js`.
- Ajustar `assets/js/pages/contact.js`.
- Ajustar `assets/js/pages/info-pages.js`.
- Ajustar `assets/css/pages.css`.
- Ajustar `assets/css/components.css`, `layout.css` o tokens si hace falta.
- Actualizar copy/meta en HTML si corresponde.

## Criterio de verificacion

- JSON valido.
- JS valido como ES modules.
- Rutas principales responden 200 en servidor estatico.
- Home, `/planes/`, paginas internas y assets cargan sin errores basicos.
- No quedan cards SaaS de tres planes como arquitectura principal.
