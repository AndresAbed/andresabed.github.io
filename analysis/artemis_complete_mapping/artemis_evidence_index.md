# Índice de evidencia

## Raíces del corpus

Para abreviar las tablas:

- `PREV` = `/Users/andresabed/Documents/Codex/2026-07-16/quiero-que-analices-estos-apk-de`
- `AOT` = `PREV/work/blutter_out/asm`
- `JADX` = `PREV/work/jadx_out/sources`
- `NATIVE` = `PREV/work/extracted/split_config.arm64_v8a/lib/arm64-v8a`
- `SITE` = `/Users/andresabed/Desktop/agencias_abed_web`

Integridad de artefactos principales:

| Artefacto | Bytes | SHA-256 |
|---|---:|---|
| `PREV/work/apks/base.apk` | 12,127,257 | `d06d04473ac14ca5efaebba992550c3abdb29a8ab571ee4c34c7334e08936df0` |
| `PREV/work/apks/split_config.arm64_v8a.apk` | 28,095,131 | `055acc3c9f8838d0ebf928f1234166206679dfd67d96ccff584a91b5fbd15fcf` |
| `NATIVE/libapp.so` | 8,455,088 | `e348c8afe9c2ffc0e2c049ced230f82be70d0bbe070810ea3996998da2326409` |
| `NATIVE/libflutter.so` | 11,037,032 | `ee37eb8be8e01a0d840558f75e0a09c4ca135d721c2ca6145c050e4f89785129` |
| `PREV/work/extracted/base/classes.dex` | 3,743,056 | `dbd81f74bc953e0197a28d785bbabeaf8e0f7fd36beb20d4e78d7a2660488cd3` |

## Evidencia de endpoints y requests

| Hallazgo | Archivo | Offset / función | String o fragmento relevante | Referencias cruzadas | Confianza |
|---|---|---|---|---|---|
| Base Artemis | `NATIVE/libapp.so` | file offset `0x0c0618` | `https://artemis.../api/stream/<STREAM_KEY_REDACTED>/media` | `ApiClient.get 0x54a400`, `post 0x570e80` | Alta |
| `/vended` | `NATIVE/libapp.so` | `0x070ba1` | `/vended` | AuthBloc `0x80a010-0x80a464` | Alta |
| q/h login | `AOT/csj_cap_app/features/auth/data/bloc/auth_bloc.dart` | `0x80a010-0x80a464` | `numvende`, `activo`, `columns` | User.fromJson `0x80a4ac` | Alta |
| `/regsubscriber` | `NATIVE/libapp.so` | `0x03eeb7` | `/regsubscriber` | ContratoBloc body `0x577904-0x577f44` | Alta |
| Body suscriptor | `AOT/.../contrato_bloc.dart` | `0x577904-0x577f44` | Map de 15 claves; `acid=0` | ContratoService `0x578030` | Alta |
| Error suscriptor | `AOT/.../contrato_service.dart` | `0x578278` | `error`, `detail`, lista vacía | `/regsubscriber` | Alta |
| `/locmae` | `NATIVE/libapp.so` | `0x081e98` | prefix de q `codprov` | dos selectores de localidad | Alta |
| locmae actual | `AOT/.../localidad_actual_select.dart` | builder `0x5c3fc0`, GET `0x5c4114` | `limit:10000`, seis columnas | Localidad model | Alta |
| locmae nacimiento | `AOT/.../localidad_nacimiento_select.dart` | builder `0x5c4884`, GET `0x5c49d8` | misma plantilla | Localidad model | Alta |
| `/issue` sorteo | `NATIVE/libapp.so` | `0x094c7d` | `SORTEO`, `ULTIMO`, `issue_descr` | HomeBloc y ContratoBloc | Alta |
| Call sorteo home | `AOT/.../home_bloc/home_bloc.dart` | literal/call `0x5c8eac-0x5c8eb8` | path completo con q/h | UltimoSorteo | Alta |
| Call sorteo contrato | `AOT/.../contrato_bloc.dart` | literal/call `0x574f5c-0x574f68` | mismo path | selector inicio de plan | Alta |
| Parse sorteo | `AOT/.../home_bloc/home_bloc.dart` | `0x5c8f3c-0x5c9348` | `issue_descr`, `;`, formatos fecha | `UltimoSorteo.toJson` | Alta/Media |
| `/issue` adjudicados | `NATIVE/libapp.so` | `0x042208` | `assigned_to=6`, `CLOSED`, `ADJUDI`, limit 8 | HomeBloc | Alta |
| Call adjudicados | `AOT/.../home_bloc/home_bloc.dart` | `0x5c93a0-0x5c93ac` | path completo | UltAdjudicados.fromJson | Alta |
| Parse adjudicado | `AOT/.../models/ult_adjudicados.dart` | `0x5c9a34-0x5c9cc0` | acceso `issue_descr`, posiciones y split `;` | winner image | Alta en posiciones |
| `/listapre` | `NATIVE/libapp.so` | `0x054fad` | URL completa; q activo=1; h con `descart` | ListadoPlanesBloc | Alta |
| Call catálogo | `AOT/.../listado_planes_bloc.dart` | `0x607b7c-0x607ccc`; call `0x607bfc` | `Dio().request`, GET | Plan.fromJson | Alta |
| Upload URL | `NATIVE/libapp.so` | `0x07ea69` | `/api/rest/v2/uploadFile` | ContratoBloc | Alta |
| Multipart | `AOT/.../contrato_bloc.dart` | `0x549b48-0x549cc4` | `doc_number`, `images`, `test1.zip` | FormData internals | Alta |
| Boundary multipart | `AOT/dio/src/form_data.dart` | create `0x571094`, finalize `0x56f488`, boundary `0x57126c` | `--dio-boundary-` + random padded decimal | upload | Alta |
| ZIP nativo | `JADX/w3/C1400g.java` | ZipOutputStream path | default Java ZIP behavior | four entries from AOT | Alta |
| `/mkcontract` | `NATIVE/libapp.so` | `0x03c861` | `/mkcontract` | ContratoBloc | Alta |
| Body/response contract | `AOT/.../contrato_bloc.dart` | `0x549d0c-0x54a098` | six keys; `[0].result` | `/contrato` | Alta |
| `/contrato` | `NATIVE/libapp.so` | `0x041ef3` | query prefix `numtit` | ContratoBloc | Alta |
| Contract lookup | `AOT/.../contrato_bloc.dart` | `0x54a0cc-0x54a298` | nine columns; consumes `numsort` | contract state | Alta |
| Payment URL | `NATIVE/libapp.so` | `0x032c6d` | `/api/rest/v3/generatePaymentLink` | ContratoBloc | Alta |
| Payment body/response | `AOT/.../contrato_bloc.dart` | `0x574a1c-0x574ddc`; request `0x574cc4` | seven body keys; `redirect` | WebView | Alta |
| Plan images | `NATIVE/libapp.so` | `0x0a6721` | `/images/` | four screen call sites | Alta |
| Plan image call sites | `AOT/.../listado_planes_screen.dart`; contrato screens | `0x60895c`, `0x609384`, `0x5ee80c`, `0x5ef448` | base + articulo + `.webp` | Plan | Alta |
| Winner images | `NATIVE/libapp.so` | `0x057a70` | `/images/winners/` | HomeScreen `0x5ca558` | Alta |

## Capa de red

| Hallazgo | Archivo | Offset / función | Fragmento | Referencias cruzadas | Confianza |
|---|---|---|---|---|---|
| ApiClient.get | `AOT/csj_cap_app/core/api/api_client.dart` | `0x54a400` | base+path, Options, Dio.get(queryParameters) | seis operaciones | Alta |
| ApiClient.post | mismo | `0x570e80` | base+path, Dio.post(data) | regsubscriber/mkcontract | Alta |
| handleResponse | mismo | `0x54a53c` | 200/201 return; 302/400/401/405/422 branches | Dio default validateStatus | Alta |
| Dio initialization | `AOT/dio/src/dio/dio_for_native.dart` | `0x573fec` | default BaseOptions/IO adapter | all Dio consumers | Alta |
| JSON inference | Dio AOT | `ImplyContentTypeInterceptor` | Map -> application/json | three POST JSON calls | Alta |
| Default status | Dio AOT/defaults | predicate `200 <= status < 300` | non-2xx preempts ApiClient branches | error model | Alta |
| No app interceptors | construction/call-site inventory | full scan | only internal content-type interceptor | no auth/token/retry | Alta |

## Modelos, enums y sesión

| Hallazgo | Archivo | Offset / función | String/fragmento | Referencias cruzadas | Confianza |
|---|---|---|---|---|---|
| User | Auth model AOT | `User.fromJson 0x80a4ac` | eight fields | `/vended` | Alta |
| Localidad | contrato model AOT | fromJson | six nullable fields | `/locmae` | Alta |
| Plan | planes model AOT | fromJson | ten fields/enums | `/listapre` | Alta |
| UltimoSorteo | `AOT/.../ultimo_sorteo.dart` | `0x5c961c-0x5c96dc` | five named JSON keys | `/issue` sorteo | Alta |
| UltAdjudicados | `AOT/.../ult_adjudicados.dart` | `0x5c9a34-0x5c9cc0` | three object fields; names stripped | `/issue` adjudicados | Alta/Media |
| Genero | `AOT/.../gender_select.dart` | `0x5bfd98-0x5bfe54` | Femenino=1, Masculino=2, nodefinido=3 | sexosoc | Alta |
| EstadoCivil | `AOT/.../estado_civil_select.dart` | `0x5b2674-0x5b27f8` | seven labels/ids | estcivil | Alta |
| PEP | `AOT/.../pep_select.dart` | `0x5c5c50-0x5c5e38` | Sí=1, No=0 | regsubscriber.pep | Alta |
| UIF | `AOT/.../uif_selecrt.dart` | `0x5c71a8-0x5c7390` | Sí=1, No=0 | regsubscriber.sujeobli | Alta |
| Session Remote Config | `AOT/csj_cap_app/services/session_service.dart` | `_initRemoteConfig 0x57ae2c`; key `0x57ae90`; default `0x57ae9c` | `session_timeout_minutes:120` | Firebase SDK | Alta |

## Android, Firebase y plugins

| Hallazgo | Archivo | Offset/línea | Fragmento | Referencias cruzadas | Confianza |
|---|---|---|---|---|---|
| Identidad APK | `PREV/work/aapt/base_manifest_xmltree.txt` | lines 2-10 | package, 3.3.6, build 326, min/target 24/36 | base.apk | Alta |
| Permisos | mismo | lines 11-48 | INTERNET, CAMERA, FLASHLIGHT, ACCESS_NETWORK_STATE | features locales/red | Alta |
| Sin network config | mismo y recursos | application attributes/full scan | no `networkSecurityConfig`, no `usesCleartextTraffic` explícito | TLS findings | Alta |
| Plugins | `JADX/io/flutter/plugins/GeneratedPluginRegistrant.java` | full class | Firebase core/RC, archive, WebView, secure storage, ML Kit, picker, update, etc. | manifest/AOT | Alta |
| Remote Config URL | `JADX/com/google/firebase/remoteconfig/internal/ConfigFetchHttpClient.java` | line 92 | Google API fetch URL | SessionService | Alta |
| Installations URL | `JADX/W2/c.java` | line 22 | Firebase Installations URL | Firebase init | Alta |
| ML Kit local | manifest + `NATIVE/libface_detector_v2_jni.so` | plugin/model inventory | face detection | FotosScreen AOT | Alta |

## Assets y artefactos adicionales

| Hallazgo | Archivo | Línea/offset | Fragmento | Referencias cruzadas | Confianza |
|---|---|---|---|---|---|
| Asset manifest sin config API | `PREV/work/extracted/base/assets/flutter_assets/AssetManifest.json` | archivo completo | fuentes, imágenes UI y assets de paquetes | no URLs Artemis | Alta |
| Native assets vacío | `.../NativeAssetsManifest.json` | archivo completo | `native-assets:{}` | libs provienen del split ABI | Alta |
| Sitio issue base | `SITE/assets/js/modules/data/api.js` | 57-60, 167-176 | base/URL constructor | tres consultas web | Alta |
| Sitio sorteo/adjudicados | mismo | 422-453 | q/h y fallback | APK issue calls | Alta |
| Sitio adjudicación período | mismo | 456-491 | issue_summary mensual | ausente APK | Alta |
| Sitio catálogo | `SITE/assets/js/modules/pages/plans/catalog-api.js` | 6-51 | listapre, `descsart`, Accept | contradicción APK | Alta |
| PDF Artemis | `SITE/data/resources.json` | 99-106 | URL PDF | referencia sólo web | Alta en referencia |
| Snapshot con PII | `SITE/data/artemis-backup.json` | esquema completo, valores no reproducidos | adjudicaciones/sorteos | seguridad de datos estáticos | Alta |

## Evidencia negativa

La evidencia negativa proviene de búsquedas cruzadas con `rg`, `strings -a/-e`, inventario de archivos AOT y JADX y revisión de registrants/manifiesto. No se encontraron call sites app-level para PUT, PATCH, DELETE, download, GraphQL, WebSocket, Firebase Functions, Storage, App Check, Dynamic Links, Analytics, Crashlytics, Sentry, AWS, Azure, pinning TLS, `badCertificateCallback` o `HttpOverrides`. Una ausencia estática no prueba imposibilidad absoluta, pero reduce sustancialmente la hipótesis en este corpus.
