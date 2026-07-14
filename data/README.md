# Club San Jorge / Agencias Abed — Data

Incluye JSON editables para construir la web estática:
- site.json
- artemis-backup.json
- plan_catalog.json
- faq.json
- resources.json
- videos.json
- social-reviews.json
- recruitment.json
- referral-program.json
- agency-contact.json

Uso principal:
- `site.json`: marca, SEO, navegacion, CTAs globales y textos legales.
- `agency-contact.json`: canales comerciales y formularios vinculados a planes. No existe una vista general de contacto.
- `referral-program.json`: contenido editable de la página y del CTA de Home para Recomendá y Ganá.
- `plan_catalog.json`: catalogo curado de planes usado por `/planes/`, Home y modales de detalle.
- `artemis-backup.json`: fallback local para sorteos y adjudicados cuando Artemis no responde.

Convención:
- verified: dato validado
- pending_validation: revisar antes de publicar
- mock: placeholder para avanzar

Catalogo V2:
- `plan_catalog.json` es el modelo principal para Home V2 y `/planes/`.
- No completar `valorNominal`, `cuota`, `brand` o `model` sin fuente validada.
- Usar `pending_validation` o `sourceStatus` prudente cuando falten datos especificos.

Datos operativos:
- El sitio publico consume primero los respaldos locales versionados.
- `artemis-backup.json` respalda sorteos, adjudicados destacados y la tabla de adjudicados.
- `plan_catalog.json` queda como snapshot curado del catalogo principal.
- Artemis se usa para actualizar respaldos por script/cron y como segunda opcion si falta un respaldo local usable.
- Las fotos locales de adjudicados destacados viven en `assets/img/adjudicados/` y se actualizan/limpian desde el script de backup.
