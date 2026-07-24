# Hosts, bases y ambientes detectados

## Alcance y criterio

Este inventario se obtuvo exclusivamente de strings, recursos y call sites estáticos. No se resolvió DNS, no se consultaron certificados y no se contactó ningún host. La URL base de Artemis contiene un segmento opaco incrustado en `libapp.so`; se conserva redactado como `<STREAM_KEY_REDACTED>` porque funciona como material sensible de acceso por ruta.

## Hosts de negocio confirmados en el APK

| Host | Estado | Uso | Base o plantilla | Evidencia |
|---|---|---|---|---|
| `artemis.clubsanjorge.com.ar` | `CONFIRMED_USED` | API stream/media, catálogo, issues e imágenes | `https://artemis.clubsanjorge.com.ar/api/stream/<STREAM_KEY_REDACTED>/media` | `libapp.so+0x0c0618`; varios call sites AOT |
| `artemis.clubsanjorge.com.ar` | `CONFIRMED_USED` | CDN/media de artículos | `https://artemis.clubsanjorge.com.ar/images/` | `libapp.so+0x0a6721`; AOT `0x60895c`, `0x609384`, `0x5ee80c`, `0x5ef448` |
| `artemis.clubsanjorge.com.ar` | `CONFIRMED_USED` | Imágenes de adjudicados | `https://artemis.clubsanjorge.com.ar/images/winners/` | `libapp.so+0x057a70`; AOT `home_screen.dart 0x5ca558` |
| `clubsanjorge.com.ar` | `CONFIRMED_USED` | Upload de documentos y creación de link de pago | `https://clubsanjorge.com.ar/api/rest/` | `libapp.so+0x07ea69` y `+0x032c6d` |

Toda comunicación de negocio confirmada usa HTTPS. No se detectaron plantillas de negocio `http://`, `ws://`, `wss://`, GraphQL o direcciones IP literales.

## Bases exactas reconstruidas

- Artemis media: `https://artemis.clubsanjorge.com.ar/api/stream/<STREAM_KEY_REDACTED>/media`
- Upload REST v2: `https://clubsanjorge.com.ar/api/rest/v2/uploadFile`
- Pago REST v3: `https://clubsanjorge.com.ar/api/rest/v3/generatePaymentLink`
- Imágenes de planes: `https://artemis.clubsanjorge.com.ar/images/<articulo>.webp`
- Imágenes de adjudicados: `https://artemis.clubsanjorge.com.ar/images/winners/<image_id>.webp`

El segmento opaco de la primera base está hardcodeado; no se encontró que Remote Config, un asset o un archivo de propiedades lo reemplace. Su string cruda aparece en `libapp.so+0x0c0618` y en literales de URLs completas. Este informe no la reproduce.

## Referencias Artemis sólo del sitio/artefactos adicionales

| Host | Estado | Recurso | Procedencia |
|---|---|---|---|
| `artemis.clubsanjorge.com.ar` | `CONFIRMED_USED` | `/media/issue` para adjudicaciones por período | `assets/js/modules/data/api.js:456-491`; usado por código web, no por el APK |
| `artemis.clubsanjorge.com.ar` | `CONFIRMED_USED` | `/media/listapre` con `descsart` | `assets/js/modules/pages/plans/catalog-api.js:6-51`; usado por código web, no prueba comportamiento del APK |
| `artemis.clubsanjorge.com.ar` | `INDIRECT_REFERENCE` | `/6/assets/Terminos_y_Condiciones.pdf` | `data/resources.json:99-106`; enlace estático, no descargado |
| `artemis.clubsanjorge.com.ar` | `INDIRECT_REFERENCE` | URLs materializadas `/images/<articulo>.webp` | `data/plan_catalog.json`; snapshot local, no requests durante la auditoría |

`scripts/update-artemis-backups.mjs` contiene lógica de fetch y descarga de imágenes para mantener snapshots, pero el script no fue ejecutado. Es evidencia de diseño de la automatización, no tráfico generado por este análisis.

## Ambientes y hosts de prueba

- No se encontraron bases Artemis alternativas de desarrollo, QA, staging, homologación ni direcciones IP.
- La cadena `test-san-jorge.pantheonsite.io` aparece dentro de la URI personalizada `csjcapapp://...` de `DebugScreen` (`AOT 0x606474-0x6064a8`; string `libapp.so+0x072dc6`). Es una utilidad de prueba del flujo de pago, no una URL HTTP ni un host Artemis.
- `/debug` está registrado en GoRouter (`main.dart 0x60a240`), pero no se encontró navegación normal hacia esa pantalla. Se clasifica como `INDIRECT_REFERENCE`, no como endpoint.

## Servicios externos presentes en el APK

| Servicio/host | Estado | Función estática observada | Evidencia y límites |
|---|---|---|---|
| `firebaseremoteconfig.googleapis.com` | `CONFIRMED_USED` | Fetch de Firebase Remote Config | `ConfigFetchHttpClient.java:92`; `SessionService._initRemoteConfig 0x57ae2c`; proyecto `173181011447` |
| `firebaseremoteconfigrealtime.googleapis.com` | `INDIRECT_REFERENCE` | Endpoint realtime incluido por el SDK | `JADX B3/n.java:118`; no se confirmó suscripción de la app |
| `firebaseinstallations.googleapis.com` | `CONFIRMED_USED` | Identidad técnica requerida por Firebase/Remote Config | `JADX W2/c.java:22`; registrars del manifest |
| `club-cya.firebasestorage.app` | `INDIRECT_REFERENCE` | Bucket configurado en recursos Firebase | Configuración de Firebase; no existe plugin/call site de Firebase Storage |
| `play.google.com` / Google Play Core | `CONFIRMED_USED` | Chequeo de actualización in-app | AndroidManifest, `GeneratedPluginRegistrant`, feature `check_updates` |
| Google ML Kit Face Detection | `CONFIRMED_USED` | Detección facial local en selfie | plugin registrant, `libface_detector_v2_jni.so`, modelos empaquetados y AOT `FotosScreen`; no es OCR remoto |
| Android secure storage / Tink | `CONFIRMED_USED` | Persistencia cifrada local de sesión | plugin `flutter_secure_storage`; referencias Tink son tipos criptográficos locales, no hosts |
| InAppWebView/Custom Tabs | `CONFIRMED_USED` | Apertura del redirect de pago | plugin registrant y flujo AOT de pago |
| Google Data Transport CCT | `INDIRECT_REFERENCE` | Backend incluido transitivamente por Firebase | AndroidManifest `TransportBackendDiscovery`; no se encontró Analytics/Crashlytics app-level |

## Servicios buscados sin evidencia de uso

Se descartaron como servicios de negocio, por ausencia de configuración y call sites: AWS, Azure, Sentry, OpenCV, GraphQL, Retrofit, WebSocket, Firebase Functions, Firebase Dynamic Links, Firebase App Check, Firebase Analytics, Crashlytics, push notifications, mapas/geolocalización y OCR remoto. La presencia de palabras genéricas dentro del runtime o dependencias no se elevó a hallazgo.

## IP, DNS y certificados

- IP literales Artemis encontradas: ninguna.
- DNS/IP resueltas por la auditoría: ninguna; hacerlo implicaría interacción externa.
- Certificados inspeccionados desde red: ninguno.
- Pinning o CA personalizada en el APK: no encontrados.

