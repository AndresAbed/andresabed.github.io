# Club San Jorge / Agencias Abed — Data Pack V2

Incluye JSON base para construir la web estática:
- site.json
- plans.json
- plan_catalog.json
- faq.json
- resources.json
- adjudications.json
- videos.json
- home-sections.json

Convención:
- verified: dato validado
- pending_validation: revisar antes de publicar
- mock: placeholder para avanzar

Catalogo V2:
- `plan_catalog.json` es el modelo principal para Home V2, `/planes/` y contacto.
- `plans.json` queda como compatibilidad para paginas detalle heredadas.
- No completar `valorNominal`, `cuota`, `brand` o `model` sin fuente validada.
- Usar `pending_validation` o `sourceStatus` prudente cuando falten datos especificos.

Datos via API:
- Sorteos y adjudicados destacados de la Home se consumen desde Artemis.
- No mantener copias locales de `draws.json`, `home-adjudications.json` ni fotos locales de adjudicados salvo que vuelvan a ser necesarias como fallback editorial.
