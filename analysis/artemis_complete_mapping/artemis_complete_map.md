# Mapa estático completo de Artemis — CSJ Productores 3.3.6

Fecha de consolidación: 2026-07-20  
Package: `com.activarte.csj_cap_app`  
Versión/build: `3.3.6` / `326`  
Modalidad: análisis estático, sin ejecución ni actividad de red

## Resumen ejecutivo

El APK contiene una única base Artemis de negocio hardcodeada sobre `artemis.clubsanjorge.com.ar`, dos operaciones REST directas sobre `clubsanjorge.com.ar` y dos familias de imágenes Artemis. Se confirmaron 12 recursos/operaciones usados por el APK al separar los dos contratos distintos de `/issue` y los recursos de imágenes. No aparecieron otros endpoints de negocio, ambientes Artemis alternativos, IP literales, GraphQL, WebSocket ni call sites PUT/PATCH/DELETE/download.

La API central tiene esta forma, con el segmento sensible intencionalmente redactado:

```text
https://artemis.clubsanjorge.com.ar/api/stream/<STREAM_KEY_REDACTED>/media
```

Los flujos recuperados son:

1. Login de productor mediante `GET /vended`, con número y password dentro de `q` en el query string. No hay token ni refresh.
2. Home mediante dos consultas `GET /issue`: último sorteo y adjudicados cerrados.
3. Catálogo mediante `GET /listapre`, con modelo `Plan` e imágenes `/images/<articulo>.webp`.
4. Alta de cliente mediante localidades `/locmae`, `POST /regsubscriber`, un ZIP multipart con DNI/selfie/firma, `POST /mkcontract` y `GET /contrato`.
5. Pago mediante `POST generatePaymentLink` y carga del `redirect` en InAppWebView.
6. Sesión local con Firebase Remote Config `session_timeout_minutes`, default 120.

El repositorio del sitio aporta dos referencias Artemis adicionales que no deben atribuirse al APK: consulta de adjudicaciones por período y un PDF de términos. También confirma un consumidor web de `/listapre`, pero usa `descsart`, mientras el APK usa `descart`.

No se reprodujeron credenciales ni PII real. La clave opaca del stream existe en el binario pero fue redactada. Ningún hallazgo implica que un endpoint esté actualmente activo o que acepte requests.

## Estados usados

- `CONFIRMED_USED`: hay string/constructor y call site funcional concreto.
- `CONFIRMED_UNUSED`: el artefacto demuestra que existe pero no se usa; no se asignó a endpoints porque no apareció ninguno que cumpliera ambas condiciones.
- `INDIRECT_REFERENCE`: configuración, recurso, dependencia o código sin call site funcional suficiente.
- `INFERRED_ONLY`: interpretación razonable sin evidencia concreta de operación.
- `DISCARDED`: falso positivo de runtime/dependencia o hipótesis sin soporte.

## Corpus e integridad

Se revisaron los cinco APK, sus recursos extraídos, manifiestos, DEX, clases JADX, snapshot Flutter AOT reconstruido, strings nativas, reportes previos y artefactos web del repositorio.

| Archivo | SHA-256 |
|---|---|
| `base.apk` | `d06d04473ac14ca5efaebba992550c3abdb29a8ab571ee4c34c7334e08936df0` |
| `split_config.arm64_v8a.apk` | `055acc3c9f8838d0ebf928f1234166206679dfd67d96ccff584a91b5fbd15fcf` |
| `libapp.so` | `e348c8afe9c2ffc0e2c049ced230f82be70d0bbe070810ea3996998da2326409` |
| `libflutter.so` | `ee37eb8be8e01a0d840558f75e0a09c4ca135d721c2ca6145c050e4f89785129` |
| `classes.dex` | `dbd81f74bc953e0197a28d785bbabeaf8e0f7fd36beb20d4e78d7a2660488cd3` |

Los hashes y rutas completas de evidencia están en `artemis_evidence_index.md`.

## Cobertura por tipo de artefacto

### APK, manifiesto y recursos Android

Confirmado por `aapt`:

- package `com.activarte.csj_cap_app`;
- versión 3.3.6, versionCode 326;
- minSdk 24, targetSdk 36;
- permisos `INTERNET`, `CAMERA`, `FLASHLIGHT`, `ACCESS_NETWORK_STATE`;
- `MainActivity` Flutter exportada sólo como launcher;
- sin intent-filter BROWSABLE propio para `csjcapapp`;
- sin `networkSecurityConfig` y sin `usesCleartextTraffic` explícito.

El DEX/JADX muestra registrants de Firebase Core/Remote Config, WebView, secure storage, ML Kit Face Detection, barcode scanner, image picker, archive, in-app update, SQFlite y utilidades. No hay plugins de Firebase Functions, Storage, App Check, Analytics, Crashlytics, Dynamic Links o Messaging.

### Assets Flutter

`AssetManifest.json` contiene fuentes Poppins, imágenes UI, GIF de éxito/error de pago, recursos de barcode scanner e InAppWebView. `NativeAssetsManifest.json` declara `native-assets:{}`. No apareció `.env`, base URL, OpenAPI, JSON de endpoints o configuración de negocio en assets. Los splits de idioma/densidad no aportaron rutas.

### Bibliotecas nativas

- `libapp.so`: snapshot AOT de negocio; contiene bases, rutas, campos y flujo.
- `libflutter.so`: motor Flutter, TLS/Dart y mensajes genéricos; ninguna ruta Artemis adicional.
- `libface_detector_v2_jni.so`: detección facial local con modelos empaquetados.
- `libdatastore_shared_counter.so`: sin endpoints o modelos de negocio.

`libapp.so` está stripped; `nm` no aporta símbolos útiles de aplicación. Blutter recuperó nombres de librerías/clases Dart, literales y desensamblado suficiente para el grafo.

### Reportes anteriores y sitio

Los reportes de primera/segunda fase se usaron como índices, no como autoridad. Todo conflicto se resolvió priorizando AOT/binario. El sitio actual (`assets/js`, `scripts`, `data`) se trató como un consumidor separado. `scripts/update-artemis-backups.mjs` no se ejecutó.

No se encontraron capturas HAR/PCAP, dumps de proxy ni tráfico real. `request_examples.json` de la fase anterior contiene ejemplos sintéticos declarados como ficticios; se usó sólo para comparar la reconstrucción y no como evidencia de servidor.

## Arquitectura de la aplicación

Arquitectura feature-first con `flutter_bloc`, GoRouter y servicios directos:

- Core: `ApiClient`, `ApiResponse`, excepciones y router.
- BLoCs: `AuthBloc`, `ContratoBloc`, `HomeBloc`, `ListadoPlanesBloc`, `WelcomeBloc`.
- Servicio: `ContratoService` para alta/verificación de errores.
- Sesión: `SessionService` + Remote Config + secure storage.
- Modelos: `User`, `UserFormData`, `Localidad`, `Genero`, `EstadoCivil`, `Plan`, `UltimoSorteo`, `UltAdjudicados`, `OpcionInicioPlan`.
- UI de red: login, home, planes, selectores de localidad, etapas de contrato y WebView de pago.

No hay repository de producción ni remote datasource separado entre bloc y red. `mock_plan.dart` se usa como fixture visual/skeleton y no representa un backend.

Rutas GoRouter recuperadas incluyen `/`, `/welcome`, `/debug`, `/login`, `/home`, `/planes`, `/adjudicados`, etapas de formulario y rutas de pago/contrato. `/debug` está compilada, pero no se encontró navegación normal hacia ella.

## Hosts y bases

### Negocio

| Host | Uso | Estado |
|---|---|---|
| `artemis.clubsanjorge.com.ar` | stream/media, catálogo, issues e imágenes | `CONFIRMED_USED` |
| `clubsanjorge.com.ar` | upload REST v2 y link de pago REST v3 | `CONFIRMED_USED` |

Todas las URLs confirmadas son HTTPS. No se hallaron IPs, hosts Artemis staging/QA/dev, `http://`, `ws://` o `wss://` de negocio.

### Externos

Firebase Remote Config e Installations están confirmados como servicios SDK. ML Kit Face Detection funciona localmente. Google Play Core se usa para actualización. El bucket Firebase Storage es sólo `INDIRECT_REFERENCE`, sin plugin/call site.

Detalle exhaustivo en `artemis_hosts.md`.

## Tabla maestra

| Recurso | Método | Estado | Uso funcional | Host | Ruta | Evidencia | Confianza |
|---|---|---|---|---|---|---|---|
| `vended_login` | GET | `CONFIRMED_USED` | Login productor | Artemis | `/media/vended` | `libapp+0x070ba1`; AuthBloc `0x80a010` | Alta |
| `register_subscriber` | POST | `CONFIRMED_USED` | Alta suscriptor | Artemis | `/media/regsubscriber` | `libapp+0x03eeb7`; ContratoBloc `0x577904` | Alta |
| `locations_by_province` | GET | `CONFIRMED_USED` | Localidades | Artemis | `/media/locmae` | `libapp+0x081e98`; selectores AOT | Alta |
| `latest_draw_issue` | GET | `CONFIRMED_USED` | Último sorteo | Artemis | `/media/issue` | `libapp+0x094c7d`; Home/ContratoBloc | Alta |
| `latest_adjudications_issue` | GET | `CONFIRMED_USED` | Adjudicados recientes | Artemis | `/media/issue` | `libapp+0x042208`; HomeBloc | Alta |
| `active_plan_catalog` | GET | `CONFIRMED_USED` | Planes activos | Artemis | `/media/listapre` | `libapp+0x054fad`; ListadoPlanesBloc | Alta |
| `upload_contract_documents` | POST | `CONFIRMED_USED` | ZIP DNI/selfie/firma | Club REST | `/api/rest/v2/uploadFile` | `libapp+0x07ea69`; ContratoBloc | Alta |
| `make_contract` | POST | `CONFIRMED_USED` | Crear contrato | Artemis | `/media/mkcontract` | `libapp+0x03c861`; ContratoBloc | Alta |
| `contract_lookup_after_creation` | GET | `CONFIRMED_USED` | Obtener `numsort` | Artemis | `/media/contrato` | `libapp+0x041ef3`; ContratoBloc | Alta |
| `generate_payment_link` | POST | `CONFIRMED_USED` | Redirect de pago | Club REST | `/api/rest/v3/generatePaymentLink` | `libapp+0x032c6d`; ContratoBloc | Alta |
| `plan_article_image` | GET | `CONFIRMED_USED` | Imagen de plan | Artemis | `/images/<articulo>.webp` | `libapp+0x0a6721`; cuatro call sites | Alta |
| `winner_image` | GET | `CONFIRMED_USED` | Imagen adjudicado | Artemis | `/images/winners/<id>.webp` | `libapp+0x057a70`; HomeScreen | Alta |
| `adjudications_by_period` | GET | `CONFIRMED_USED` | Tabla mensual del sitio | Artemis | `/media/issue` | `api.js:456-491`; no APK | Alta |
| `terms_and_conditions_pdf` | GET | `INDIRECT_REFERENCE` | PDF del sitio | Artemis | `/6/assets/Terminos_y_Condiciones.pdf` | `resources.json:104`; no APK | Alta en referencia |
| Firebase RC fetch | POST | `CONFIRMED_USED` | Timeout de sesión | Google | SDK template | SessionService/JADX | Alta |
| Firebase Storage bucket | — | `INDIRECT_REFERENCE` | Configuración sin uso | Firebase | — | recursos; no plugin | Alta |
| Debug payment URI | — | `INDIRECT_REFERENCE` | Prueba de navegación | Pantheon custom URI | path de éxito | DebugScreen | Media |
| package:http negocio | — | `DISCARDED` | Cliente alternativo | — | — | sin call site | Alta |
| GraphQL/WebSocket | — | `DISCARDED` | API alternativa | — | — | sin host/operación | Alta |
| PUT/PATCH/DELETE | — | `DISCARDED` | Mutaciones adicionales | — | — | métodos genéricos sin call site | Alta |

La tabla completa y machine-readable está en `artemis_master_table.csv`.

## Contratos HTTP confirmados

### GET `/vended`

URL:

```text
<ARTEMIS_BASE>/vended?q=<percent-encoded-json>&h=<percent-encoded-json>
```

Construcción:

```dart
final q = jsonEncode({"numvende": numeroProductor, "activo": password});
final h = jsonEncode({
  "columns": [
    "numvende", "nomvende", "ncuit", "domvende",
    "codpost", "password", "ctacob", "activo"
  ]
});
await apiClient.get("/vended", queryParameters: {"q": q, "h": h});
```

Dio percent-encodea cada valor de query. No hay body, content-type o header app-level. Se consume sólo `[0]` como `User`; lista vacía es fallo. Tipos esperados: enteros para `numvende/codpost/activo`, string para nombre/CUIT/domicilio/password, `ctacob` nullable.

### POST `/regsubscriber`

Body compacto JSON en este orden de construcción:

```json
{
  "numdoc": "int.parse(dni + '1')",
  "nomsoc": "nombre + ' ' + apellido",
  "domicsoc": "direccion",
  "codpost": "localidadActual.codpost",
  "fecnac": "ddMMyyyy",
  "telefono": "telefono",
  "email": "email",
  "estcivil": "EstadoCivil.id",
  "naciona": "ARG",
  "pep": "1 or 0",
  "sujeobli": "1 or 0",
  "lugnacim": "localidadNacimiento.codpost ?? 0",
  "acid": 0,
  "ncuit": "cuit",
  "sexosoc": "Genero.id"
}
```

`pep` y `sujeobli` son enteros: los radios muestran Sí=1/No=0. `sexosoc`: Femenino=1, Masculino=2, `nodefinido`=3. Estado civil usa IDs 1..7. `ImplyContentTypeInterceptor` infiere `application/json`; el transformer usa JSON UTF-8 compacto.

Respuesta: estructura dinámica list/map. El helper rechaza lista vacía, busca `error == true` y extrae `detail`; cualquier otro payload se conserva como éxito opaco. ApiClient sólo devuelve 200/201.

### GET `/locmae`

Literal antes de normalización URI:

```text
/locmae?q={"codprov":"<codigo>"}&h={"limit":10000,"columns":["codpost","desloc","desprov","despais","cartel","desdepto"]}
```

No usa `jsonEncode` ni `queryParameters`: interpola el código en un path raw. `Uri` normaliza caracteres prohibidos. Devuelve `List<Localidad>` con seis campos nullable. Los dos call sites capturan errores y devuelven lista vacía.

### GET `/issue` — sorteo

```text
/issue?q={"related_project":"SORTEO","issue_summary":"ULTIMO"}&h={"columns":["issue_descr"]}
```

El path completo es literal. HomeBloc separa contenido posicional de `issue_descr` y construye `UltimoSorteo(date,next_draw_date,first_winner,second_winner,third_winner)`. ContratoBloc reutiliza la misma operación y procesa una posición para el inicio del plan. La especificación del tuple no está embebida, por lo que no se asignan nombres server-side a todas sus posiciones.

### GET `/issue` — adjudicados

```text
/issue?q={"assigned_to":6,"status":"CLOSED","related_project":"ADJUDI"}&h={"columns":["issue_descr"],"offset":0,"limit":8}
```

`UltAdjudicados.fromJson` requiere datos posicionales y separa `issue_descr[3]` por `;`. Se recuperan accesos a posiciones 4 y 5 del tuple; la posición 5 se usa como id de imagen. Los nombres privados del modelo quedaron stripped, por lo que el reporte conserva nombres neutrales para dos valores display.

### GET `/listapre`

URL raw compilada:

```text
<ARTEMIS_BASE>/listapre?q={"activo":1}&h={"columns":["activo","plan","descart","articulo","orden","impocuo","impovn","cantprem","cate","subcate"]}
```

Se llama con `Dio().request(..., Options(method:"GET"))`. La respuesta se vuelve a serializar (`jsonEncode(response.data)`) y decodificar antes de mapear `Plan`. Categorías exactas: Autos, Dinero, Motos. Subcategorías: Alta Gama, Baja Gama, `-`, Utilitarios.

### POST `uploadFile`

URL directa:

```text
https://clubsanjorge.com.ar/api/rest/v2/uploadFile
```

Multipart:

```text
field: doc_number = DNI crudo
file:  images
       filename = test1.zip
       content-type = application/octet-stream
```

ZIP en orden: `dni_dorso.jpg`, `dni_frente.jpg`, `selfie.jpg`, `Firma.jpg`. `Firma.jpg` contiene PNG. El boundary interno es `--dio-boundary-` + entero aleatorio de 32 bits como decimal padded a 10; los delimitadores del body agregan `--`. No hay límite/resize explícito. La respuesta se ignora; completar sin excepción bajo cualquier 2xx es éxito.

### POST `/mkcontract`

```json
{
  "articulo": "Plan.articulo",
  "numdoc": "int.parse(dni + '1')",
  "tipo": 0,
  "cbu": "NONE",
  "numvende": "User.numvende",
  "cuota1": "OpcionInicioPlan.numero"
}
```

Consume `[0].result` entero sin guard de lista vacía.

### GET `/contrato`

```text
/contrato?q={"numtit":"<mkcontract.result>"}&h={"columns":["numdoc","numtit","nomsoc","domicsoc","codpost","telefono","email","articulo","numsort"]}
```

`result` se interpola como string JSON. Sólo `[0].numsort` se consume; las otras ocho columnas se solicitan pero no se usan.

### POST `generatePaymentLink`

URL directa:

```text
https://clubsanjorge.com.ar/api/rest/v3/generatePaymentLink
```

Body JSON:

```json
{
  "article_id": "Plan.articulo",
  "amount": "double",
  "first_name": "nombre",
  "last_name": "apellido",
  "identification_type": "DNI",
  "identification_number": "DNI crudo",
  "email": "email"
}
```

Consume `response.data["redirect"]` como String y lo carga en WebView. La UI compara sólo `URL.path` con rutas de éxito/fallo.

### Imágenes

```text
https://artemis.clubsanjorge.com.ar/images/<Plan.articulo>.webp
https://artemis.clubsanjorge.com.ar/images/winners/<issue-derived-image-id>.webp
```

Son plantillas confirmadas por construcción, no evidencia de que cualquier identificador arbitrario exista.

La representación completa estructurada está en `artemis_endpoints.json`.

## Capa de red Dio

### ApiClient

Pseudocódigo recuperado:

```dart
class ApiClient {
  final Dio dio;
  static const base =
      "https://artemis.clubsanjorge.com.ar/api/stream/<STREAM_KEY_REDACTED>/media";

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      final response = await dio.get(
        base + path,
        queryParameters: queryParameters,
        options: Options(),
      );
      return handleResponse(response);
    } catch (e) {
      print(e);
      rethrow;
    }
  }

  Future<Response> post(String path, {dynamic data}) async {
    try {
      final response = await dio.post(
        base + path,
        data: data,
        queryParameters: null,
        options: Options(),
      );
      return handleResponse(response);
    } catch (e) {
      print(e);
      throw e;
    }
  }
}
```

Defaults confirmados:

- `baseUrl: ""` en Dio; la app concatena URL completa;
- `ResponseType.json`;
- headers/query/extra vacíos;
- redirects true, máximo 5;
- conexión persistente;
- `receiveDataWhenStatusError: true`;
- `validateStatus: 200 <= status < 300`;
- timeouts connect/send/receive nulos;
- `ListFormat.multi`;
- `FusedTransformer` con umbral 51200;
- `IOHttpClientAdapter`;
- sólo `ImplyContentTypeInterceptor` interno;
- sin interceptores, auth, cookies, retry o logging estructurado app-level.

`handleResponse`:

```text
200/201 → Response
302     → UnimplementedError
400     → BadRequestException
401     → UnauthorizedException
405     → NotAllowedException
422     → json.decode(String data) → ValidationException.fromJson
otro    → UnimplementedError
```

La mayoría de no-2xx no alcanzan esas ramas porque el default de Dio lanza antes. Los 202-299 sí alcanzan `handleResponse` y son rechazados. Las llamadas Dio directas aceptan cualquier 2xx.

## Entidades y relaciones

Principales relaciones confirmadas:

```text
User.numvende ───────────────→ MkContractRequest.numvende
UserFormData.dni + "1" ──────→ regsubscriber.numdoc / mkcontract.numdoc
UserFormData.dni raw ─────────→ upload.doc_number / payment.identification_number
Localidad.codpost ────────────→ regsubscriber.codpost / lugnacim
Plan.articulo ────────────────→ plan image / mkcontract.articulo / payment.article_id
mkcontract[0].result ─────────→ contrato.q.numtit
contrato[0].numsort ──────────→ client numSorteo
Issue.issue_descr ────────────→ UltimoSorteo / UltAdjudicados
UltAdjudicados image id ──────→ winner image URL
payment.redirect ─────────────→ InAppWebView
```

No se afirma que `vended`, `locmae`, `listapre`, `issue` o `contrato` sean tablas reales; son nombres de recursos expuestos en URLs. No aparecieron nombres verificables de procedimientos SQL, vistas o stored procedures. `mkcontract` y `regsubscriber` parecen operaciones remotas por semántica/call site, pero su implementación server-side no es visible.

El diccionario campo por campo está en `artemis_entities.json`.

### Conceptos de negocio sin endpoint propio demostrado

- Cobranzas: `User.ctacob` es un campo nullable confirmado; no apareció `/cobranza`, operación de cuenta o recurso equivalente.
- Cuotas: `Plan.impocuo` y `mkcontract.cuota1` son campos confirmados; no hay endpoint de cuotas o pagos periódicos.
- Premios: `Plan.cantprem` y datos posicionales de adjudicación están confirmados; no hay recurso `/premio` independiente.
- Artículos: `Plan.articulo` relaciona catálogo, imagen, contrato y pago; no hay endpoint `/articulo` propio.
- Comprobantes/reportes/PDF: no hay generación o descarga remota en el APK. El sitio contiene recursos/PDF locales y un enlace de términos, pero no prueban un servicio Artemis de reportes.
- Notificaciones: no hay plugin push ni endpoint de notificaciones app-level.
- Usuarios/clientes: `User` representa al productor y `regsubscriber` registra al suscriptor; no se infirió `/cliente` o `/usuario` sólo por esos nombres.

## Flujos funcionales

### Login

`LoginScreen → AuthBloc → ApiClient.get → /vended → User`

El password entra en q; la lista no vacía autentica localmente. No hay token.

### Home

`HomeScreen → HomeBloc → /issue SORTEO → UltimoSorteo`

`HomeScreen → HomeBloc → /issue ADJUDI → UltAdjudicados → winner image`

### Planes

`ListadoPlanesScreen → ListadoPlanesBloc → Dio directo → /listapre → Plan → article image`

### Alta y contrato

`DNI barcode/manual → UserFormData → /locmae → /regsubscriber → ZIP/upload → /mkcontract → /contrato`

El upload precede a la creación. No hay rollback visible.

### Pago

`Pantalla pago → ContratoBloc → generatePaymentLink → redirect → InAppWebView → path de éxito/fallo`

El grafo expandido está en `artemis_call_graph.md`.

## Recursos indirectos, ocultos y código no productivo

- `/debug` y una URI `csjcapapp://...Pantheon.../pago/exito`: `INDIRECT_REFERENCE`; compilados, sin navegación UI normal confirmada.
- `mock_plan.dart`: `INDIRECT_REFERENCE`; fixture visual, no red.
- SQFlite: `INDIRECT_REFERENCE`; plugin incluido, sin esquema/call site Artemis.
- `package:http`: `INDIRECT_REFERENCE` como dependencia, pero `DISCARDED` como cliente de negocio en esta build.
- Firebase Storage bucket: `INDIRECT_REFERENCE`; configuración sin plugin.
- Remote Config realtime: `INDIRECT_REFERENCE`; template SDK sin listener app-level.
- Payment redirect host: `INFERRED_ONLY`; es dinámico y no se puede identificar.
- PUT/PATCH/DELETE/download: `DISCARDED` como operaciones de negocio; sólo símbolos genéricos.

No apareció un endpoint compilado sin uso demostrable que justificara `CONFIRMED_UNUSED`. La ausencia de esa categoría en endpoints es un resultado, no una omisión.

## Otros servicios

- Firebase Core + Remote Config: `CONFIRMED_USED`.
- Firebase Installations: `CONFIRMED_USED` como soporte técnico.
- ML Kit Face Detection: `CONFIRMED_USED`, local; comprueba al menos una cara.
- Barcode scanner: `CONFIRMED_USED`, local; parseo de DNI.
- InAppWebView/Custom Tabs/URL Launcher: `CONFIRMED_USED`.
- Flutter Secure Storage: `CONFIRMED_USED` para lectura de sesión local; escritura no localizada con igual confianza.
- In-app update / Google Play: `CONFIRMED_USED`.
- Firebase Storage, Data Transport CCT: `INDIRECT_REFERENCE`.
- AWS, Azure, Sentry, OpenCV, OCR remoto, Firebase Functions, Analytics, Crashlytics, Dynamic Links, App Check y push: `DISCARDED` por falta de SDK/config/call site app-level.

## Sitio y automatizaciones del repositorio

El sitio aporta evidencia separada:

1. `api.js` construye q/h con `URL.searchParams.set(JSON.stringify(...))`.
2. Sorteo usa la misma consulta SORTEO/ULTIMO.
3. Home web usa ADJUDI/CLOSED pero solicita limit 16, frente a limit 8 del APK.
4. Adjudicaciones por período usan `issue_summary: "01/MM/YYYY"`; no existe ese call site en el APK.
5. Catálogo web usa `descsart`, no `descart`.
6. `data/resources.json` enlaza un PDF Artemis.
7. `data/artemis-backup.json` contiene un snapshot con PII real; no se reprodujo ningún valor.

El código web contiene fetch, pero la auditoría no lo ejecutó. Un call site web `CONFIRMED_USED` significa que el código está conectado al flujo web, no que se haya enviado tráfico ni que el servidor responda.

## Contradicciones resueltas

1. `acid`: el primer informe lo relacionó tentativamente con `codigo_actividad`; el AOT profundo confirma `acid: 0` constante.
2. Status `300/302`: la constante Dart etiquetada corresponde lógicamente a 302. Los reportes antiguos que decían 300 quedaron superados.
3. ZIP: el orden confirmado es dorso, frente, selfie, firma. Listados genéricos previos no deben usarse.
4. Plan description: APK `descart`; sitio/snapshot `descsart`. No se unificó automáticamente.
5. Adjudicados home: APK limit 8; sitio actual limit 16 para obtener un target de 8.
6. PEP/UIF: la inspección de los widgets confirma valores enteros Sí=1/No=0; ejemplos textuales previos no eran contratos wire.
7. Evidencia web reciente: puede reflejar evolución posterior y no reemplaza la evidencia de la build 3.3.6.

## Observaciones de seguridad

Hechos estáticos principales:

- password en query GET y solicitado en respuesta;
- base con segmento opaco hardcodeado;
- ausencia de token/header auth app-level;
- tratamiento de DNI, CUIT, domicilio, selfie, DNI escaneado y firma;
- upload sin límites explícitos ni validación de body;
- no pinning TLS/custom TrustManager;
- redirect WebView dinámico con clasificación por path;
- inconsistencia Dio/ApiClient en status;
- `[0]` sin guard en contrato;
- snapshot web con PII real;
- posible logging de excepción con URI sensible, dependiente del contenido de `DioException.toString`.

No se explotó ni probó ninguna condición. Ver `artemis_security_observations.md`.

## Strings y falsos positivos

Los barridos ASCII/UTF-8 y UTF-16 LE/BE, más el extractor local con offsets, no revelaron otra base o ruta Artemis. Búsquedas Base64/ofuscadas no produjeron candidatos de negocio adicionales. Strings como `authorization`, `token`, GraphQL, SQL verbs, TLS y WebSocket dentro de Flutter/Dio/WebView/SDK se descartaron sin call site.

El inventario deduplicado y sanitizado está en `artemis_strings.txt`.

## Comandos y herramientas

Comandos locales usados en las fases de extracción/análisis:

```text
unzip -l csj-productores-apks.zip
unzip <zip-or-apk> -d <directory>
zipinfo <apk>
shasum -a 256 <artifact>
aapt dump badging <apk>
aapt dump xmltree <apk> AndroidManifest.xml
aapt dump resources <apk>
apksigner verify --verbose --print-certs <apk>
file <native-library>
nm <native-library>
objdump -p <native-library>
dexdump classes.dex
jadx -d <output> base.apk
strings -a -t x libapp.so
strings -a -e l -t x libapp.so
strings -a -e b -t x libapp.so
python3 blutter.py <arm64-directory> <output>
rg <pattern> <extracted/decompiled/AOT trees>
find / sort / sed / wc / stat
```

También se usó `work/extract_encoded_strings.py` para UTF-8/UTF-16 con offsets. En esta consolidación se usaron `rg`, `sed`, `shasum`, `stat` y validadores locales de JSON/CSV. Ningún comando realizó DNS, HTTP, autenticación o descarga externa.

## Incertidumbres

- Semántica server-side exacta del segmento opaco, recursos, filtros y campos abreviados.
- Nombres originales de dos campos privados de `UltAdjudicados` y documentación completa de `issue_descr`.
- Valores exactos/runtime de `OpcionInicioPlan.numero` bajo todas las fechas; se confirma que alimenta `cuota1`.
- Host/proveedor final del `redirect` de pago.
- Headers añadidos por `dart:io`/sistema (`Host`, `Content-Length`, etc.).
- Boundary, longitudes y paths locales concretos en runtime.
- Disponibilidad/estado/respuesta actual de servidores.
- Autorización, rate limiting, validación, retención y seguridad del backend.
- Si otras versiones del APK contienen endpoints removidos.
- Si configuraciones Firebase no usadas por esta build se usan en otros productos del proyecto.

## Limitaciones

- Snapshot AOT, no source Dart original.
- Binario stripped; los nombres privados pueden perderse.
- Sólo split ARM64 provisto para `libapp.so`; los otros splits son idioma/densidad.
- JADX tuvo decompilaciones parciales, aunque se recuperaron manifest/plugins/clases relevantes.
- Ausencia estática no prueba ausencia absoluta de comportamiento server-side o reflection extrema.
- No se ejecutó la app, no se interceptó tráfico y no se accedió a Remote Config vivo.
- No se verificaron DNS, IP, certificados, redirects, CORS, respuestas o permisos.
- Los datos web pueden ser posteriores a la build y se separaron.
- Los snapshots estáticos pueden contener datos históricos; se revisó sólo esquema/uso y se omitió PII.

## Archivos de salida

- `artemis_complete_map.md`: este informe.
- `artemis_endpoints.json`: contratos estructurados.
- `artemis_entities.json`: diccionario de entidades/campos.
- `artemis_hosts.md`: hosts, bases, ambientes y servicios externos.
- `artemis_strings.txt`: strings relevantes deduplicadas y sanitizadas.
- `artemis_call_graph.md`: grafo pantalla→bloc→cliente→endpoint→modelo.
- `artemis_unconfirmed_candidates.md`: candidatos, descartes y evidencia faltante.
- `artemis_evidence_index.md`: archivos, offsets, funciones y hashes.
- `artemis_security_observations.md`: observaciones estáticas sin explotación.
- `artemis_master_table.csv`: tabla maestra portable.
