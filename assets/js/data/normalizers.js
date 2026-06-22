export function getOfficialContent(data) {
  return {
    brand: data.site?.brand,
    club: data.site?.club,
    legal: data.site?.legal,
    plans: data.plans,
    faq: data.faq,
    resources: data.resources,
    draws: data.draws,
    adjudications: data.adjudications,
  };
}

export function getAgencyContent(data) {
  return {
    agency: data.site?.agency,
    cta: data.site?.cta,
    forms: data.site?.forms,
    processFaqs: data.faq?.categories?.find((category) => category.slug === "agencia-y-proceso")?.items || [],
  };
}
