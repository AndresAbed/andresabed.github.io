# Observaciones estáticas de seguridad

## Alcance

Estas observaciones describen el cliente y los artefactos locales. No demuestran explotabilidad ni el estado actual de servidores. No se enviaron requests, no se probaron credenciales y no se reproduce la clave opaca del path Artemis ni datos personales reales.

## Resumen priorizado

| Observación | Evidencia | Impacto potencial | Confianza |
|---|---|---|---|
| Password de productor dentro del query string GET | `/vended` q contiene `activo:<password>` | URLs pueden aparecer en logs, diagnósticos, proxies o historiales aunque TLS cifre el tránsito | Alta |
| Respuesta de login solicita el campo `password` | h.columns de `/vended`; `User.password` | La credencial queda modelada en el cliente más allá del filtro de autenticación | Alta |
| No hay token/cookie de sesión app-level | inventario de headers, interceptores y modelos | La autenticación aparente es “lista no vacía”; no se observó control de autorización por request | Alta para el cliente; servidor desconocido |
| Segmento opaco de stream hardcodeado | `libapp.so+0x0c0618` | Material estático extraíble; no debe considerarse secreto robusto | Alta |
| Datos de identidad y documentación sensibles | regsubscriber, upload ZIP, payment | DNI, CUIT, domicilio, contacto, selfie, frente/dorso y firma salen del dispositivo | Alta |
| Sin pinning TLS/custom CA | manifest, AOT/JADX searches | El cliente confía en el almacén TLS de plataforma; no hay defensa app-level adicional observada | Alta |
| WebView acepta redirect dinámico y decide por path | response `redirect`; AOT path checks | No se recuperó allowlist de host antes de clasificar éxito/fallo | Alta |
| Incoherencia `validateStatus`/`handleResponse` | Dio defaults + `ApiClient.handleResponse 0x54a53c` | Errores personalizados 400/401/405/422 normalmente no se alcanzan | Alta |
| Snapshot estático contiene PII real | `data/artemis-backup.json` | Riesgo de exposición por publicación/control de versiones del sitio | Alta; valores omitidos |

## Autenticación y sesión

### Login por filtro GET

La aplicación construye:

```text
GET /vended?q={"numvende":"...","activo":"<password>"}&h={..."password"...}
```

`q` y `h` se percent-encodean como valores de query, pero el password sigue formando parte semántica de la URL. HTTPS lo protege en tránsito frente a observadores pasivos, no frente a logging de URL en componentes que ya ven la request.

El cliente considera autenticado al productor si la respuesta es una lista no vacía y puede convertir el primer registro a `User`. No se encontró:

- `Authorization`/Bearer;
- token de acceso o refresh;
- cookie app-level;
- endpoint de refresh/logout;
- interceptor de autenticación;
- firma HMAC por request.

Esto no prueba que el servidor carezca de controles adicionales; sólo describe lo serializado por el APK.

### Modelo local

`User` incluye `password`. `flutter_secure_storage` está registrado y se lee la clave local `user`; no se recuperó de forma inequívoca el punto de escritura en los call sites alcanzables. El control de inactividad usa Remote Config `session_timeout_minutes` con default 120. Remote Config ajusta una política local, no emite credenciales Artemis.

## Material estático sensible

La base Artemis contiene un segmento opaco dentro de `/api/stream/.../media`. Al estar en `libapp.so`, cualquier persona con el APK puede extraerlo. Puede ser un identificador o una capacidad por URL; sin documentación del servidor no se afirma su alcance. Se redactó en todos los outputs.

La configuración Firebase incluye identificadores públicos de cliente, proyecto y bucket. No se reproducen claves de cliente crudas en este informe. No se encontró un secreto de servidor Firebase ni cuenta de servicio.

## Datos personales tratados

El flujo de alta procesa o transmite:

- nombre y apellido;
- DNI y una transformación `dni + "1"` convertida a entero;
- CUIT;
- fecha de nacimiento;
- domicilio y códigos postales actual/de nacimiento;
- teléfono y email;
- sexo/género y estado civil;
- PEP y sujeto obligado/UIF;
- número de productor;
- frente y dorso del DNI;
- selfie;
- firma;
- datos de pago mínimos y URL de redirect.

`/contrato` solicita nueve columnas, aunque el APK sólo usa `numsort`; las otras ocho incluyen identidad y contacto. Minimizar la proyección reduciría exposición del lado cliente.

## Upload de documentos

El archivo `test1.zip` contiene, en orden:

1. `dni_dorso.jpg`
2. `dni_frente.jpg`
3. `selfie.jpg`
4. `Firma.jpg`

Hallazgos:

- `doc_number` es el DNI crudo; `numdoc` en otros endpoints agrega el sufijo `1`.
- La parte `images` usa `application/octet-stream`, sin checksum, firma ni metadata de tamaño.
- No se encontraron límites explícitos de tamaño, redimensionado o compresión de imagen antes del ZIP.
- El ZIP usa `ZipOutputStream` por defecto, sin nivel o método configurado por la app.
- `Firma.jpg` contiene bytes PNG según la construcción estática, generando discrepancia extensión/formato.
- El body de respuesta del upload se ignora; cualquier 2xx aceptado por Dio permite continuar.
- No hay retry explícito, idempotency key ni compensación si upload funciona y `/mkcontract` falla.
- El ZIP se crea en el directorio de documentos de la app y se elimina el archivo anterior antes de recrearlo. No se confirmó borrado posterior al éxito.

La detección facial ML Kit comprueba localmente que haya al menos una cara; no se encontró liveness, matching biométrico, OCR remoto o envío a ML Kit como servicio web.

## Capa HTTP y errores

Defaults reconstruidos:

- `ResponseType.json`;
- `followRedirects: true`;
- `maxRedirects: 5`;
- `validateStatus: 200 <= status < 300`;
- `persistentConnection: true`;
- `receiveDataWhenStatusError: true`;
- `ListFormat.multi`;
- timeouts connect/send/receive nulos;
- sin retries app-level;
- sin headers globales;
- sin interceptores app-level;
- `ImplyContentTypeInterceptor` interno;
- `IOHttpClientAdapter` estándar.

`ApiClient.handleResponse` sólo devuelve 200/201. Tiene ramas para 302, 400, 401, 405 y 422, pero Dio normalmente lanza `DioException.badResponse` antes para no-2xx. A su vez, 202-299 pasan `validateStatus` y luego terminan como `UnimplementedError` en `ApiClient`. Las llamadas directas a Dio aceptan cualquier 2xx.

`/mkcontract` y `/contrato` acceden a `[0]` sin comprobar lista vacía. Los fallos de forma pueden convertirse en excepciones de runtime en lugar de errores de dominio.

`ApiClient` imprime/repropaga excepciones. Dependiendo de `DioException.toString`, una excepción de `/vended` podría incorporar la URI que contiene el filtro de password. No se afirma que ocurra siempre; el riesgo deriva de combinar URL sensible y logging genérico.

## Headers y autorización aparente

Headers definidos por la app en las rutas confirmadas:

- GET: ninguno.
- POST Map: `content-type: application/json` inferido por Dio.
- Multipart: `content-type: multipart/form-data; boundary=...` generado por Dio.

No se recuperaron `Authorization`, API-key header, CSRF token, cookies, idempotency header o user-agent custom. Headers de transporte como `Host`, `Content-Length`, `Accept-Encoding` o un eventual `User-Agent` de `dart:io` son runtime y no se inventaron.

## TLS, red Android e integridad

- Todas las URLs de negocio confirmadas son HTTPS.
- El manifest no declara `networkSecurityConfig` ni `usesCleartextTraffic` explícito.
- No se encontraron `CertificatePinner`, TrustManager custom, `badCertificateCallback`, `HttpOverrides` o validación SSL propia.
- No se encontraron App Check, Play Integrity ni SafetyNet. `in_app_update`/Play Core no implica Play Integrity.
- No se encontró pinning en Java/Kotlin, Dart AOT ni librerías nativas de negocio.

La ausencia de pinning no es por sí sola una vulnerabilidad; significa que se aplica la confianza TLS de plataforma.

## WebView y pago

`generatePaymentLink` devuelve `redirect`, que se carga en InAppWebView. La app detecta finalización comparando `URL.path` con:

- `/capitalizacion-y-ahorro/productores/pago/exito`
- `/capitalizacion-y-ahorro/productores/pago/fallo`

No se recuperó una validación previa del scheme/host del redirect ni una allowlist de orígenes. Tampoco se conoce el host legítimo porque es dinámico y nunca se observó una respuesta.

`DebugScreen` contiene una URI artificial con host Pantheon de prueba. El AndroidManifest no registra un intent-filter entrante para `csjcapapp`, por lo que no se confirmó un deep link externo.

## Firebase y servicios Google

Firebase Remote Config se usa de forma confirmada. Firebase Installations es una dependencia técnica del SDK. El bucket Storage está configurado pero no hay plugin/call site de Storage. No se detectaron Firebase Functions, App Check, Analytics, Crashlytics, Dynamic Links o Messaging app-level.

Google ML Kit Face Detection opera con librería/modelos empaquetados. El barcode scanner procesa el DNI localmente. No se halló evidencia de OCR o reconocimiento facial remoto.

## Datos estáticos del repositorio

`data/artemis-backup.json` contiene nombres y datos de adjudicación/domicilio derivados de un snapshot previo. Este informe no reproduce ningún valor personal. Si el repositorio o el sitio es público, conviene revisar necesidad, consentimiento, retención, minimización y control de publicación de ese archivo. Esta observación pertenece al artefacto web, no al APK.

## Controles no demostrables estáticamente

Sin acceso al backend no se puede determinar:

- autorización real por recurso;
- rate limits;
- validación server-side;
- almacenamiento/cifrado/retención;
- antivirus y validación del ZIP;
- revocación o alcance del segmento opaco;
- protección contra replay;
- CORS del sitio;
- configuración TLS/certificados actuales;
- cumplimiento normativo.

No se hicieron pruebas para resolver ninguna de estas incógnitas.

