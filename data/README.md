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

Convención:
- verified: dato validado
- pending_validation: revisar antes de publicar
- mock: placeholder para avanzar

Catalogo V2:
- `plan_catalog.json` es el modelo principal para Home V2, `/planes/` y contacto.
- No completar `valorNominal`, `cuota`, `brand` o `model` sin fuente validada.
- Usar `pending_validation` o `sourceStatus` prudente cuando falten datos especificos.

Datos via API:
- Sorteos, adjudicados destacados de la Home y la tabla de adjudicados se consumen desde Artemis.
- Si Artemis falla, `artemis-backup.json` funciona como respaldo local de esos datos.
- `plan_catalog.json` queda como snapshot curado del catalogo y fallback de planes cuando Artemis no responde.
- No mantener copias locales de `draws.json`, `adjudications.json`, `home-adjudications.json` ni fotos locales de adjudicados salvo que vuelvan a ser necesarias como fallback editorial.
