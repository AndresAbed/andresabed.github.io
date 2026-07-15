# Club San Jorge | Agencias Abed

Sitio estático comercial e informativo para una agencia mercantil de Club San Jorge.

El objetivo del proyecto es ayudar a usuarios a entender planes de Capitalización y Ahorro, explorar el catálogo de opciones y dejar una preinscripción o consulta asistida desde el detalle de un plan. No es un checkout, una app transaccional ni una inscripción online final.

## Estructura

- `index.html`: Home comercial/informativa.
- `planes/`: catálogo principal por categorías.
- `adjudicados/`, `como-funciona/`: páginas internas informativas.
- `recomenda-y-gana/`: herramienta de referidos y registro de participaciones de Agencias Abed.
- `privacidad/`, `baja/`: política de privacidad y baja de comunicaciones.
- `assets/css/`: entrada CSS y parciales agrupados por `core`, `components` y `pages`.
- `assets/js/`: entrada JS y módulos internos agrupados por `components`, `data`, `pages` y `utils`.
- `assets/js/modules/pages/plans/`: lógica del catálogo, separada en assets, filtros, tarjetas, detalle, formularios y normalización.
- `assets/img/`: logos, imágenes de planes, favicon, OG image y recursos visuales.
- `assets/docs/`: documentos descargables, como el contrato del Plan 330.
- `data/`: contenido editable local del sitio.
- `scripts/`: utilidades de mantenimiento del catálogo, CSS, imágenes y respaldos.
- `.github/workflows/`: despliegue en GitHub Pages y actualización automática de respaldos.

## Requisitos

- Python 3 para servir el sitio localmente.
- Node.js 24 recomendado para ejecutar los scripts de mantenimiento y coincidir con GitHub Actions.
- `sharp` solo es necesario para regenerar variantes responsive de imágenes.

## Cómo correr localmente

Usar un servidor estático desde la raíz del proyecto:

```bash
python3 -m http.server 8000
```

Abrir:

```text
http://localhost:8000/
```

No abrir con `file://`, porque los módulos JS consumen JSON con `fetch()`.

En `localhost` y `127.0.0.1`, los JSON se cargan con `cache: "no-store"` y sin caché interna de la aplicación. Así, al recargar la página se reflejan los cambios de `data/*.json` sin tener que vaciar el caché del navegador.

Si el puerto `8000` está ocupado, usar otro puerto:

```bash
python3 -m http.server 8010
```

## Data

La carpeta `data/` es el source-of-truth editable para contenido local. El sitio la consume desde `assets/js/modules/data/api.js` con `fetch("/data/*.json")`.

Archivos principales:

- `site.json`: datos globales del sitio, marca, CTAs, SEO y textos legales.
- `agency-contact.json`: canales comerciales, endpoints y configuración operativa de formularios.
- `artemis-backup.json`: respaldo local de sorteos y adjudicados para usar si Artemis no responde.
- `plan_catalog.json`: catálogo principal usado por `/planes/`, Home y formularios de consulta.
- `plan-media-index.json`: índice generado desde los `metadata.json` de imágenes de planes.
- `faq.json`: guía del sistema y preguntas frecuentes del Plan 330.
- `resources.json`: enlaces y recursos oficiales.
- `videos.json`: videos institucionales/explicativos.
- `social-reviews.json`: pruebas sociales y testimonios.
- `recruitment.json`: bloque y formulario de productores.
- `referral-program.json`: contenido de Recomendá y Ganá, opciones de vendedores y textos del formulario.
- `privacy.json`: contenido de privacidad y tratamiento de datos.

El sitio público funciona local-first: sorteos, adjudicados destacados, tabla de adjudicados y catálogo de planes se leen primero desde archivos versionados en `data/`.
Artemis se usa para actualizar respaldos y, en sorteos/adjudicados, como segunda opción si no existe un respaldo local usable. El catálogo no se consulta en vivo desde el navegador.

## Backups de Artemis

Actualizar respaldos manualmente:

```bash
node scripts/update-artemis-backups.mjs
```

Ese comando actualiza:

- `data/artemis-backup.json`
- `assets/img/adjudicados/` con imágenes destacadas disponibles

La Home espera 8 adjudicados destacados. Si Artemis devuelve menos de 8 registros válidos o no se logran respaldar 8 imágenes locales, el script mantiene el bloque anterior para no achicar la landing ni borrar imágenes todavía necesarias.

`data/plan_catalog.json` queda como snapshot curado del catálogo principal. Debe estar presente y ser válido para que el catálogo funcione.

También existe un workflow mensual en `.github/workflows/update-artemis-backups.yml` para correr el mismo proceso el primer día de cada mes y commitear cambios si Artemis devuelve información nueva.

## Estados de datos

El proyecto usa estados para distinguir información final de información pendiente:

- `verified`: dato validado o suficientemente confiable.
- `pending_validation`: dato plausible, pendiente de confirmar antes de publicar como definitivo.
- `mock`: dato de estructura o ejemplo para vistas todavía no terminadas.
- `partial_mock`: mezcla de estructura real con datos de ejemplo.

Estos estados no son errores por sí mismos. Sirven para que el sitio pueda avanzar sin presentar datos provisorios como definitivos.

## Formularios

`data/agency-contact.json` contiene la configuración operativa de formularios comerciales vinculados al catálogo:

- `planInquiryForm`: formulario de consulta dentro del detalle de un plan. Envía a Google Apps Script para guardar la información en Google Sheets.
- `newsletterForm`: suscripción voluntaria a novedades por email.
- `planEnrollmentForm`: formulario de inscripción final. Está apagado porque el sitio no incluye inscripción online en esta etapa.
- `referralProgram`: formulario activo del módulo Recomendá y Ganá, conectado al despliegue público de Google Apps Script.

La preinscripción o consulta asistida no implica contratación ni inscripción final. La vista general de contacto fue retirada; las rutas comerciales se concentran en el catálogo y en las gestiones oficiales configuradas en `resources.json`.

### Agregar vendedores a Recomendá y Ganá

Las opciones del selector “Código de vendedor” se editan en `data/referral-program.json`, dentro de `form.sellerOptions`.

Ejemplo para agregar un vendedor:

```json
"sellerOptions": [
  {
    "value": "COD001",
    "label": "Nombre del vendedor — COD001"
  }
],
```

- `value` es el código interno enviado al endpoint como `codigoVendedor`. Debe ser único, estable y no contener datos sensibles.
- `label` es el texto que ve la persona en el selector. Conviene usar el formato `Nombre — CÓDIGO`.
- Para agregar más vendedores, separar cada objeto con una coma dentro del array.
- Para dejar el selector sin vendedores disponibles, usar `"sellerOptions": []`.
- No agregar comentarios con `//` dentro del archivo: JSON no admite comentarios.

Un vendedor configurado también puede compartir un enlace que preseleccione su código:

```text
https://agenciasabed.com.ar/recomenda-y-gana/?v=COD001
```

El valor de `v` debe coincidir exactamente con un `value` existente en `sellerOptions`. Después de editar el archivo, validar el JSON antes de publicar.

## Catálogo

`/planes/` usa `data/plan_catalog.json` y los módulos de `assets/js/modules/pages/plans/`.

El catálogo agrupa opciones por:

- `autos`
- `motos`
- `dinero`

Las imágenes de detalle se resuelven por código de artículo y carpetas de `assets/img/plans/`. Cuando una carpeta tiene `metadata.json`, se usa para asociar logo/marca y configuración visual del producto. El navegador consume el índice agregado `data/plan-media-index.json` para evitar una solicitud por carpeta.

Para regenerar el snapshot del catálogo desde un JSON oficial descargado:

```bash
node scripts/update-plan-catalog.mjs /ruta/al/catalog.json data/plan_catalog.json
```

Revisar el diff y los estados de datos antes de publicar el resultado; el script no reemplaza la validación comercial del catálogo.

## Reglas de renderizado

- Valores `""`, `null` o no definidos se tratan como información no disponible.
- Si falta un dato importante, se muestra `A confirmar` o un estado parcial, no se inventa contenido.
- Ítems `mock` o `partial_mock` no deben presentarse como información definitiva.
- CTAs sin destino real se deshabilitan, se marcan como canal en configuración o se redirigen a una alternativa segura.
- Las acciones comerciales deben mantener claro que la consulta es asistida y requiere validación posterior.

## SEO y publicación

La URL pública configurada para metadatos, `robots.txt` y `sitemap.xml` es:

```text
https://agenciasabed.com.ar/
```

Si el sitio cambia de dominio, actualizar el mismo origen en:

- `CNAME`
- `data/site.json` (`seo.siteUrl`)
- `robots.txt`
- `sitemap.xml`
- canonicals, `og:url` y JSON-LD de los HTML principales

El sitio se despliega automáticamente en GitHub Pages al hacer push a `main`, mediante `.github/workflows/deploy-pages.yml`. También puede ejecutarse manualmente desde GitHub Actions.

El workflow publica los archivos ya versionados: no regenera CSS ni imágenes. Antes de hacer commit deben estar actualizados los bundles generados que correspondan.

### Versionado de caché

Los HTML y algunos imports de JavaScript usan parámetros `?v=` para evitar que el navegador conserve archivos anteriores. Cuando se modifica un CSS o módulo servido al público:

1. regenerar los bundles necesarios;
2. incrementar la versión `?v=` del recurso o de su importador;
3. comprobar que la página solicite la nueva versión.

## Pendientes antes de publicar

- Definir WhatsApp comercial real.
- Confirmar y monitorear los endpoints activos de Google Apps Script y su política de recepción de leads.
- Revisar textos legales con responsable comercial o asesor correspondiente.
- Validar datos marcados como `mock`, `partial_mock` o `pending_validation` que correspondan a vistas publicables.
- Revisar compatibilidad de la imagen OG si se necesita un PNG/JPG final para redes.
- Correr el sitio con servidor estático y revisar rutas principales.

## Checks útiles

Regenerar el CSS de producción después de modificar parciales en `assets/css/`:

```bash
node scripts/build-css.mjs
```

El comando conserva `assets/css/site.css` para desarrollo y genera bundles minificados por ruta (`site-base`, `site-home`, `site-plans`, `site-privacy` y `site-referral`).

Validar un JSON editado:

```bash
node -e 'JSON.parse(require("fs").readFileSync("data/referral-program.json", "utf8")); console.log("JSON OK")'
```

Regenerar el índice de metadata del catálogo después de modificar `assets/img/plans/*/metadata.json`:

```bash
node scripts/build-plan-media-index.mjs
```

Las variantes responsive del catálogo y de los adjudicados se generan con `scripts/build-plan-card-images.mjs`, que requiere `sharp` disponible en el entorno.

Verificar whitespace del diff:

```bash
git diff --check
```

Verificar sintaxis de módulos JS como ESM:

```bash
mkdir -p /tmp/club-sj-js-check
find assets/js scripts -type f \( -name '*.js' -o -name '*.mjs' \) -print0 | while IFS= read -r -d '' file; do
  cp "$file" /tmp/club-sj-js-check/check.mjs
  node --check /tmp/club-sj-js-check/check.mjs || exit 1
done
```
