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
- agency-contact.json

Uso principal:
- `site.json`: marca, SEO, navegacion, CTAs globales y textos legales.
- `agency-contact.json`: canales comerciales y formularios vinculados a planes. No existe una vista general de contacto.
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

Datos via API:
- Sorteos, adjudicados destacados de la Home y la tabla de adjudicados se consumen desde Artemis.
- Si Artemis falla, `artemis-backup.json` funciona como respaldo local de esos datos.
- `plan_catalog.json` queda como snapshot curado del catalogo y fallback de planes cuando Artemis no responde.
- No mantener copias locales de `draws.json`, `adjudications.json`, `home-adjudications.json` ni fotos locales de adjudicados salvo que vuelvan a ser necesarias como fallback editorial.
