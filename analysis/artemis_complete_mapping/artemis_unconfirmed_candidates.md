# Candidatos y referencias no confirmadas

## Criterio

Esta lista evita convertir nombres de clases, tablas aparentes o strings de dependencias en endpoints. Un candidato sólo se marca `CONFIRMED_USED` en otros archivos cuando existe un call site que construye una operación. Aquí se registran referencias indirectas, inferencias y descartes, junto con la evidencia que falta. No se probó ninguno.

## Candidatos retenidos

### Bucket Firebase Storage

- Estado: `INDIRECT_REFERENCE`
- String: `club-cya.firebasestorage.app`
- Aparición: configuración Firebase compilada en recursos.
- Motivo: podría almacenar artefactos del proyecto Firebase.
- Evidencia en contra: `GeneratedPluginRegistrant` no registra `firebase_storage`; no hay imports/call sites AOT de upload/download a Storage.
- Evidencia faltante: código fuente de otra versión o configuración de backend que demuestre su uso por esta app.
- Confianza: alta en la existencia de la configuración; baja en cualquier uso funcional.
- Validación autorizada futura: revisar el proyecto fuente/dependencias o una build con símbolos. No enumerar el bucket.

### Remote Config realtime

- Estado: `INDIRECT_REFERENCE`
- String: `https://firebaseremoteconfigrealtime.googleapis.com/v1/projects/{project}/namespaces/{namespace}:streamFetchInvalidations`
- Aparición: SDK Java descompilado, `B3/n.java:118`.
- Motivo: el SDK incluye soporte de invalidaciones en tiempo real.
- Evidencia faltante: llamada app-level a `onConfigUpdated`/listener. El flujo confirmado sólo hace `fetchAndActivate`.
- Confianza: alta en la plantilla SDK; baja en uso por la app.
- Validación autorizada futura: inspeccionar fuente Dart/pubs lock original o instrumentar una build sólo contra un emulador y backend de prueba propiedad del auditor.

### Ruta `/debug` y URI de pago artificial

- Estado: `INDIRECT_REFERENCE`
- String: `/debug`; `csjcapapp://test-san-jorge.pantheonsite.io/capitalizacion-y-ahorro/productores/pago/exito`
- Aparición: GoRouter AOT `main.dart 0x60a240`; `DebugScreen 0x606474-0x6064a8`.
- Motivo: pantalla de prueba incluida en la build productiva.
- Evidencia faltante: navegación normal desde UI o intent-filter que acepte la URI externamente.
- Confianza: alta en que la pantalla/ruta están compiladas; media-baja en accesibilidad por un usuario normal.
- Validación autorizada futura: revisión de source routing y pruebas de navegación en una build desconectada, sin abrir WebView externa.

### Host de pago final

- Estado: `INFERRED_ONLY`
- String original: no hay host constante; sólo la clave de respuesta `redirect`.
- Aparición: `ContratoBloc GeneratePaymentLink` y WebView.
- Motivo: el backend devuelve una URL que necesariamente tendrá un destino en runtime.
- Evidencia faltante: valor real de `redirect` o lista de hosts permitidos. No se puede afirmar que sea Mercado Pago u otro dominio sólo por nombres de pantallas.
- Confianza: alta en que existe un redirect dinámico; nula sobre su host.
- Validación autorizada futura: contrato OpenAPI/backend o respuesta fixture redactada entregada por el propietario. No solicitar un link real.

### Campos completos de `UltAdjudicados`

- Estado: `INFERRED_ONLY`
- String: `issue_descr` y accesos posicionales.
- Aparición: `ult_adjudicados.dart 0x5c9a34-0x5c9cc0`.
- Motivo: los nombres privados de tres campos se perdieron, aunque se recuperaron sus posiciones y que uno forma la URL de imagen.
- Evidencia faltante: source Dart o metadata de símbolos que dé los nombres originales.
- Confianza: alta en posiciones, media/baja en etiquetas funcionales.
- Validación autorizada futura: cotejar con source control, mapa de símbolos o fixtures sintéticos oficiales. El parser del sitio puede corroborar semántica pero no sustituye el source APK.

### `codigo_actividad`

- Estado: `INDIRECT_REFERENCE`
- String: `codigo_actividad` / concepto de actividad.
- Aparición: modelo/formulario local.
- Motivo: un primer análisis lo relacionó con `acid`.
- Evidencia faltante: en esta build no hay propagación; AOT confirma `acid: 0` constante.
- Confianza: alta en que no alimenta el request de esta versión.
- Validación autorizada futura: revisar versiones anteriores/posteriores del APK o source Dart.

### `mock_plan.dart`

- Estado: `INDIRECT_REFERENCE`
- String: `package:csj_cap_app/features/planes/data/data_sources/mock_plan.dart`.
- Aparición: AOT y `ListadoPlanesScreen 0x608408`.
- Motivo: es un datasource local, pero se usa para datos falsos/skeleton de UI, no como endpoint.
- Evidencia faltante para elevarlo a backend: URL, cliente HTTP y call site de red; no existen.
- Confianza: alta.
- Validación autorizada futura: ninguna de red; revisar source si se necesita conocer el fixture.

### Paquete `http`

- Estado: `INDIRECT_REFERENCE`
- String: símbolos de `package:http` presentes entre dependencias AOT.
- Aparición: snapshot/runtime.
- Motivo: podría ser un cliente alternativo.
- Evidencia faltante: call site de negocio desde `csj_cap_app`; no se encontró.
- Confianza: media-alta en que no participa de los requests confirmados.
- Validación autorizada futura: árbol de dependencias original y análisis de reachability con símbolos.

### SQLite / `sqflite`

- Estado: `INDIRECT_REFERENCE`
- String: plugin `sqflite_android` en `GeneratedPluginRegistrant`.
- Aparición: classes.dex/JADX.
- Motivo: podría existir persistencia local no visible en los flujos inspeccionados.
- Evidencia faltante: SQL/schema/call sites app-level relacionados con Artemis.
- Confianza: alta en dependencia; baja en uso de negocio.
- Validación autorizada futura: source del proyecto o inspección estática de otra arquitectura/build; no implica consultar servidores.

### Google Data Transport CCT

- Estado: `INDIRECT_REFERENCE`
- String: `backend:com.google.android.datatransport.cct.CctBackendFactory`.
- Aparición: AndroidManifest `TransportBackendDiscovery`.
- Motivo: dependencia transitiva de componentes Google/Firebase.
- Evidencia faltante: Analytics/Crashlytics o evento app-level que lo use. No hay plugin Flutter correspondiente.
- Confianza: alta en inclusión, baja en función de negocio.
- Validación autorizada futura: dependency graph/ProGuard mapping del proyecto.

### PDF de términos Artemis

- Estado: `INDIRECT_REFERENCE`
- String: `https://artemis.clubsanjorge.com.ar/6/assets/Terminos_y_Condiciones.pdf`
- Aparición: `data/resources.json:104`, no APK.
- Motivo: recurso estático del mismo host Artemis.
- Evidencia faltante: contenido, disponibilidad y relación con esta versión de la app.
- Confianza: alta en la referencia, no en el recurso remoto actual.
- Validación autorizada futura: revisar una copia entregada por el propietario o el CMS fuente; no descargarlo en esta auditoría.

## Strings descartadas como endpoints o recursos Artemis

| Hallazgo | Estado | Razón del descarte |
|---|---|---|
| `authorization`, `token`, `refresh` | `DISCARDED` | Apariciones genéricas de SDK/runtime; no header, modelo ni call site de negocio. |
| `graphql`, `GraphQL` | `DISCARDED` | Sin host, cliente, operación ni documento de consulta. |
| `ws://`, `wss://`, `WebSocket` | `DISCARDED` | Sin URL de negocio ni conexión app-level. |
| `put`, `patch`, `delete`, `download` | `DISCARDED` | Métodos/símbolos genéricos de Dio/HTTP; ningún call site CSJ confirmado. |
| `select`, `insert`, `update`, `delete`, `where` | `DISCARDED` | Palabras de runtimes/SQLite; no son nombres de endpoints ni prueba de tablas remotas. |
| `CertificatePinner`, `TrustManager`, `badCertificateCallback`, `HttpOverrides` | `DISCARDED` | Búsqueda sin implementación app-level; las apariciones de plataforma no configuran TLS de negocio. |
| `Firebase Functions` | `DISCARDED` | Sin plugin, dominio o callable function app-level. |
| `Dynamic Links` | `DISCARDED` | Sin plugin/intent-filter/configuración; la URI `csjcapapp://` sólo es una constante de DebugScreen. |
| `App Check`, `Play Integrity`, `SafetyNet` | `DISCARDED` | Sin SDK/call site de seguridad. Play Core para updates no equivale a Integrity. |
| AWS, Azure, Sentry, OpenCV | `DISCARDED` | Sin SDK, host o configuración. |
| OCR remoto | `DISCARDED` | El DNI usa barcode scanner local; ML Kit detecta caras localmente. |
| Firebase Storage como upload de contrato | `DISCARDED` | Upload confirmado va a REST v2 con Dio; bucket Firebase no tiene call site. |

## Resultados de ofuscación/codificación

- Strings ASCII/UTF-8 con offsets aportaron todas las rutas de negocio confirmadas.
- Los barridos UTF-16 LE/BE no añadieron hosts ni rutas Artemis.
- La búsqueda de candidatos Base64/ofuscados no produjo nuevas URLs de negocio verificables.
- Strings fragmentadas se recompusieron sólo cuando había concatenación AOT comprobable, como las imágenes y `base + path` de `ApiClient`.
- El segmento opaco del stream es un literal, no un valor decodificado dinámicamente.

