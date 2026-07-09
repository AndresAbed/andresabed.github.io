---
name: "Club San Jorge | Agencias Abed"
description: "Sistema visual para un sitio comercial e informativo de planes Club San Jorge."
colors:
  brand-red: "#be002f"
  brand-red-dark: "#8f0024"
  brand-red-soft: "#fff0f3"
  brand-green: "#61af54"
  brand-green-dark: "#26763a"
  ink: "#292929"
  ink-soft: "#4e5350"
  muted: "#73786f"
  neutral-mid: "#939389"
  line: "#deded6"
  surface: "#ffffff"
  surface-soft: "#f6f6f2"
  surface-warm: "#fbf5ee"
  success: "#1f7a45"
  warning: "#9a5b00"
  error: "#b42318"
  focus: "#005fcc"
typography:
  display:
    fontFamily: "Poppins, sans-serif"
    fontSize: "clamp(2.45rem, 4.8vw, 4.15rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0"
  headline:
    fontFamily: "Poppins, sans-serif"
    fontSize: "clamp(1.8rem, 3vw, 3.35rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "0"
  title:
    fontFamily: "Poppins, sans-serif"
    fontSize: "clamp(1.15rem, 1.9vw, 1.8rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "0"
  body:
    fontFamily: "Poppins, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "Poppins, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.04em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "18px"
  drawer: "22px"
  button-shape: "0 12px 0 12px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
  "8": "64px"
components:
  button-primary:
    backgroundColor: "{colors.brand-red}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button-shape}"
    padding: "0.72rem 1rem"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.brand-red-dark}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button-shape}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button-shape}"
    padding: "0.72rem 1rem"
    height: "44px"
  card-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.5}"
  chip-filter:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brand-red}"
    rounded: "{rounded.button-shape}"
    padding: "0.42rem 0.55rem"
---

# Design System: Club San Jorge | Agencias Abed

## 1. Overview

**Creative North Star: "Agencia clara, catalogo confiable"**

El sistema visual combina presencia institucional con una capa comercial mas moderna y facil de navegar. El rojo de Club San Jorge lleva el peso de marca y conversion; el verde aparece como acento de progreso, resultado o apoyo visual. El gris oscuro funciona como ancla seria para navegacion, tablas, footer y elementos de alto contraste.

La interfaz debe sentirse sobria, directa y util. No busca parecer una app transaccional ni una landing SaaS generica: funciona como catalogo asistido, centro de consulta y explicacion del sistema. Las composiciones pueden ser fuertes, pero la informacion siempre tiene que quedar clara antes que decorativa.

**Key Characteristics:**

- Rojo institucional como color dominante en heroes, CTAs y estados activos.
- Verde como acento secundario, no como color principal del sitio.
- Superficies blancas o gris suave con bordes finos y sombras medidas.
- Tipografia unica Poppins, con contraste por peso y escala.
- Botones y controles con esquina diagonal `0 12px 0 12px`.
- Lineas superiores rojo-verde para unir tarjetas y paneles al lenguaje de marca.

## 2. Colors

La paleta es institucional y comercial: rojo para accion y jerarquia, verde para acento y validacion, gris oscuro para confianza, y superficies neutras para lectura.

### Primary

- **Rojo San Jorge** (`#be002f`): color principal de marca. Usar en heroes, CTAs primarios, estados activos, lineas de marca y acentos de catalogo.
- **Rojo profundo** (`#8f0024`): hover, fondos oscuros dentro de la familia roja y degradados de hero.
- **Rojo suave** (`#fff0f3`): fondos muy livianos para llamadas secundarias, no para bloques grandes de contenido.

### Secondary

- **Verde adjudicacion** (`#61af54`): acento positivo y segunda mitad de gradientes de marca. Usar con moderacion en indicadores, resultados, detalles de tarjetas y contrastes rojo-verde.
- **Verde profundo** (`#26763a`): texto o iconos verdes que necesiten contraste sobre fondos claros.

### Neutral

- **Tinta principal** (`#292929`): texto principal, navbar oscura, footer, tablas oscuras y botones de cierre.
- **Tinta suave** (`#4e5350`): texto secundario cuando el fondo es claro.
- **Texto atenuado** (`#73786f`): apoyo, descripciones y notas. Verificar contraste si se usa sobre fondos tintados.
- **Linea neutra** (`#deded6`): bordes, separadores y divisores.
- **Superficie blanca** (`#ffffff`): tarjetas, paneles y formularios.
- **Superficie suave** (`#f6f6f2`): fondo general y bloques neutros.
- **Superficie calida** (`#fbf5ee`): usar de forma muy puntual; no convertirlo en tema beige dominante.

### Named Rules

**The Red-First Rule.** El rojo es el color de accion y marca. Si una pantalla necesita un solo acento, usar rojo antes que verde.

**The Green-Is-Accent Rule.** El verde acompana o confirma; no debe dominar una vista completa.

**The Dark-Anchor Rule.** Para zonas de gestion, footer, tablas o cierres, `#292929` aporta seriedad sin depender de negro puro.

## 3. Typography

**Display Font:** Poppins, sans-serif  
**Body Font:** Poppins, sans-serif  
**Label Font:** Poppins, sans-serif

**Character:** La marca usa una sola familia geometrica, redondeada y comercial. La personalidad viene de la escala, el peso y el espacio, no de mezclar fuentes.

### Hierarchy

- **Display** (700, `clamp(2.45rem, 4.8vw, 4.15rem)`, 1.05): heroes y titulos de paginas internas. Debe sentirse fuerte pero legible.
- **Headline** (700, `clamp(1.8rem, 3vw, 3.35rem)`, 1.18): secciones principales, bloques comerciales y encabezados de paneles.
- **Title** (650-800, `clamp(1.15rem, 1.9vw, 1.8rem)`, 1.18): tarjetas, modales, filtros y subtitulos relevantes.
- **Body** (400-500, 16px, 1.6): explicaciones, parrafos y contenido informativo. Mantener lineas de 65-75 caracteres cuando sea posible.
- **Label** (700-800, 0.78rem, 0.03-0.1em): etiquetas cortas, filtros, encabezados de tabla y metadata. Usar mayusculas solo en labels breves.

### Named Rules

**The Single-Family Rule.** No introducir otra fuente sin una razon de marca fuerte. Poppins ya define la voz del sitio.

**The No-Shouting Rule.** Reservar pesos 800-900 para labels, cifras o acentos puntuales; no convertir todo el contenido en bold.

## 4. Elevation

El sistema usa una elevacion hibrida: bordes finos para estructura, sombras suaves para paneles flotantes y sombras mas marcadas solo en overlays o drawers. La profundidad debe ayudar a separar niveles de informacion, no decorar cada tarjeta.

### Shadow Vocabulary

- **Card shadow** (`0 8px 24px rgb(41 41 41 / 0.08)`): tarjetas y superficies contenidas.
- **Soft panel shadow** (`0 18px 50px rgb(41 41 41 / 0.10)`): paneles amplios, secciones elevadas y contenedores principales.
- **Header shadow** (`0 16px 42px rgb(41 41 41 / 0.06)`): navbar clara fija.
- **Drawer shadow** (`-24px 0 72px rgb(0 0 0 / 0.28)`): modal lateral de detalle de plan.

### Named Rules

**The Border-Then-Shadow Rule.** Primero usar borde neutro; sumar sombra solo si el elemento necesita separarse visualmente del fondo.

**The Overlay-Is-Heavy Rule.** La elevacion fuerte queda reservada para drawers, modales y estados superpuestos.

## 5. Components

### Buttons

- **Shape:** esquina diagonal `0 12px 0 12px`.
- **Primary:** rojo `#be002f`, texto blanco, minimo 44px de alto, padding base `0.72rem 1rem`.
- **Hover / Focus:** hover a rojo profundo `#8f0024`; foco visible con outline azul `#005fcc` o halo rojo cuando el componente ya define uno.
- **Secondary:** fondo blanco, borde `#deded6`, texto `#292929`.
- **Dark / Close:** fondo `#151a17` o `#292929`, texto blanco, mismo ADN de forma.

### Chips

- **Style:** chips de filtros usan fondo blanco, borde tintado por color del filtro, icono en contenedor suave y texto compacto.
- **State:** activo con borde visible y una marca lateral fina. Evitar sombras difusas rojas en filtros activos.
- **Category chips:** iconos un poco mas grandes que los chips de marca; autos, motos y dinero pueden tener color funcional, pero los CTAs principales siguen el rojo de marca.

### Cards / Containers

- **Corner Style:** tarjetas comunes `8px`; tarjetas de catalogo y paneles grandes `12px-18px`.
- **Background:** blanco para contenido, `#f6f6f2` para fondos de seccion y media.
- **Shadow Strategy:** sombra baja en tarjetas; sombra media en paneles que se superponen al hero.
- **Border:** usar bordes completos o reglas superiores rojo-verde. Evitar nuevas franjas laterales gruesas.
- **Internal Padding:** `24px` para tarjetas base; `32px-48px` para paneles importantes.

### Inputs / Fields

- **Style:** fondo blanco, borde `#deded6`, radio `4px`, altura minima 44px.
- **Focus:** borde azul `#005fcc` o borde rojo con halo suave en filtros especiales.
- **Error / Disabled:** error `#b42318`; disabled con fondo frio `#eef2f7` y texto atenuado.

### Navigation

- **Header:** blanco por defecto, linea superior rojo-verde de 3px, sombra suave y logo amplio.
- **Scrolled:** fondo `#292929`, links claros y CTA WhatsApp verde.
- **Nav links:** texto gris, activo en rojo con subrayado animado de 2px.
- **Mobile:** menu con boton de forma diagonal, drawer de navegacion y CTA destacado.

### Catalog Plan Cards

- **Normal cards:** tarjetas blancas con media superior gris suave, regla superior rojo-verde, imagen contenida y bloque de precio rojo-verde.
- **Featured cards:** layout dividido: informacion a la izquierda, producto a la derecha, badge de chances superpuesto y CTA oscuro/rojo al hover.
- **Tags:** categoria y codigo usan badges grises sobrios, con punto de categoria como pequeno acento.

### Detail Drawer

- **Container:** drawer lateral de ancho amplio, fondo `#f7f7f2`, radio `22px 0 0 22px` en desktop.
- **Product visual:** panel grande con imagen centrada, titulo/logo en bloque separado y control de angulos.
- **Forms:** paneles blancos con inputs alineados, copy claro de preinscripcion y CTA rojo.

### Tables

- **Header:** fondo `#292929`, texto blanco, labels uppercase breves.
- **Container:** borde completo, radio medio, regla superior rojo-verde.
- **Rows:** alternancia muy sutil y hover verde suave.

## 6. Do's and Don'ts

### Do:

- **Do** usar `#be002f` para acciones principales, heroes y estados seleccionados.
- **Do** usar `#61af54` como acento de apoyo, no como tema dominante.
- **Do** mantener el fondo general en `#f6f6f2` y las superficies de contenido en blanco.
- **Do** usar `0 12px 0 12px` para botones y controles de accion.
- **Do** separar contenido complejo con paneles amplios y aire suficiente, especialmente en mobile.
- **Do** mantener textos de ayuda claros, sobrios y no contractuales cuando correspondan a la capa de agencia.
- **Do** verificar contraste cuando uses texto gris sobre fondos rojos, verdes o tintados.

### Don't:

- **Don't** hacer que los planes parezcan suscripciones SaaS o pricing cards de software.
- **Don't** implicar entrega automatica de vehiculo, resultado garantizado o promesas no respaldadas.
- **Don't** llenar la interfaz de disclaimers defensivos; explicar con claridad antes que asustar.
- **Don't** introducir gradientes morados, glassmorphism decorativo o sombras rojas difusas como recurso por defecto.
- **Don't** usar nuevas franjas laterales gruesas como acento de tarjetas; preferir borde completo, regla superior o iconografia.
- **Don't** repetir etiquetas uppercase pequenas encima de cada seccion si no agregan jerarquia real.
- **Don't** usar todo en bold. El sitio necesita contraste de pesos, no grito constante.
- **Don't** duplicar datos de negocio en UI o docs si ya existe una fuente en `data/`.
