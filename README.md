# Club San Jorge | Agencias Abed

Sitio estatico comercial e informativo para una agencia mercantil de Club San Jorge.

El objetivo del proyecto es ayudar a usuarios a entender planes de Capitalizacion y Ahorro, explorar el catalogo de opciones y contactar a la agencia para una consulta asistida. No es un checkout, una app transaccional ni una inscripcion online final.

## Estructura

- `index.html`: Home comercial/informativa.
- `planes/`: catalogo principal por categorias.
- `sorteos/`, `adjudicados/`, `recursos/`, `como-funciona/`, `contacto/`: paginas internas.
- `assets/css/`: tokens, base, layout, componentes, utilities y estilos de pagina.
- `assets/js/`: data layer, shell, componentes, helpers y modulos por pagina.
- `assets/js/pages/plans/`: logica del catalogo, separada en assets, filtros, tarjetas, detalle, formularios y normalizacion.
- `assets/img/`: logos, imagenes de planes, favicon, OG image y recursos visuales.
- `assets/docs/`: documentos descargables, como el contrato del Plan 330.
- `data/`: contenido editable local del sitio.
- `scripts/`: utilidades de mantenimiento del catalogo.

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

## Data

La carpeta `data/` es el source-of-truth editable para contenido local. El sitio la consume desde `assets/js/data/api.js` con `fetch("/data/*.json")`.

Archivos principales:

- `site.json`: datos globales del sitio, marca, CTAs, SEO y textos legales.
- `agency-contact.json`: canales de contacto y configuracion de formularios.
- `artemis-backup.json`: respaldo local de sorteos y adjudicados para usar si Artemis no responde.
- `plan_catalog.json`: catalogo principal usado por `/planes/`, Home y formularios de consulta.
- `faq.json`: guia del sistema y preguntas frecuentes del Plan 330.
- `resources.json`: enlaces y recursos oficiales.
- `videos.json`: videos institucionales/explicativos.
- `social-reviews.json`: pruebas sociales y testimonios.
- `recruitment.json`: bloque y formulario de productores.

Los resultados de sorteos, adjudicados destacados de la Home y la tabla de adjudicados se cargan desde Artemis para evitar mantener copias locales de datos oficiales que cambian con frecuencia.
Si Artemis no responde, el sitio usa `data/artemis-backup.json` y `data/plan_catalog.json` como respaldo local.

## Backups de Artemis

Actualizar respaldos manualmente:

```bash
node scripts/update-artemis-backups.mjs
```

Ese comando actualiza:

- `data/artemis-backup.json`

`data/plan_catalog.json` queda como snapshot curado del catalogo y tambien como fallback cuando Artemis no responde.

Tambien existe un workflow mensual en `.github/workflows/update-artemis-backups.yml` para correr el mismo proceso el primer dia de cada mes y commitear cambios si Artemis devuelve informacion nueva.

## Estados de datos

El proyecto usa estados para distinguir informacion final de informacion pendiente:

- `verified`: dato validado o suficientemente confiable.
- `pending_validation`: dato plausible, pendiente de confirmar antes de publicar como definitivo.
- `mock`: dato de estructura o ejemplo para vistas todavia no terminadas.
- `partial_mock`: mezcla de estructura real con datos de ejemplo.
- `temporary_shared_endpoint`: endpoint operativo pero provisorio.

Estos estados no son errores por si mismos. Sirven para que el sitio pueda avanzar sin presentar datos provisorios como definitivos.

## Formularios

`data/agency-contact.json` contiene tres bloques distintos:

- `form`: formulario general de `/contacto/`. Hoy esta en modo `placeholder` porque no hay WhatsApp, email comercial ni endpoint final definidos.
- `planInquiryForm`: formulario de consulta dentro del detalle de un plan. Hoy envia a Formspree con un endpoint provisorio.
- `planEnrollmentForm`: formulario de inscripcion final. Esta apagado porque el sitio no incluye inscripcion online en esta etapa.

La pre-solicitud o consulta asistida no implica contratacion ni inscripcion final.

## Catalogo

`/planes/` usa `data/plan_catalog.json` y los modulos de `assets/js/pages/plans/`.

El catalogo agrupa opciones por:

- `autos`
- `motos`
- `dinero`

Las imagenes de detalle se resuelven por codigo de articulo y carpetas de `assets/img/plans/`. Cuando una carpeta tiene `metadata.json`, se usa para asociar logo/marca y configuracion visual del producto.

## Reglas de renderizado

- Valores `""`, `null` o no definidos se tratan como informacion no disponible.
- Si falta un dato importante, se muestra `A confirmar` o un estado parcial, no se inventa contenido.
- Items `mock` o `partial_mock` no deben presentarse como informacion definitiva.
- CTAs sin destino real se deshabilitan, se marcan como canal en configuracion o se redirigen a una alternativa segura.
- Las acciones comerciales deben mantener claro que la consulta es asistida y requiere validacion posterior.

## Pendientes antes de publicar

- Definir dominio final y actualizar `robots.txt`, `sitemap.xml` y, si corresponde, canonicals.
- Definir WhatsApp comercial real.
- Confirmar endpoint final o politica de recepcion de leads.
- Revisar textos legales con responsable comercial o asesor correspondiente.
- Validar datos marcados como `mock`, `partial_mock` o `pending_validation` que correspondan a vistas publicables.
- Revisar compatibilidad de la imagen OG si se necesita un PNG/JPG final para redes.
- Correr el sitio con servidor estatico y revisar rutas principales.

## Checks utiles

Verificar whitespace del diff:

```bash
git diff --check
```

Verificar sintaxis de modulos JS como ESM:

```bash
mkdir -p /tmp/club-sj-js-check
for file in $(find assets/js scripts -name '*.js' -o -name '*.mjs'); do
  cp "$file" /tmp/club-sj-js-check/check.mjs
  node --check /tmp/club-sj-js-check/check.mjs || exit 1
done
```
