function clonePrizes(prizes) {
  return Array.isArray(prizes) ? prizes.map((prize) => ({ ...prize })) : [];
}

function prizesByArticle(data) {
  const templates = data?.templates || {};
  const entries = new Map();

  (data?.assignments || []).forEach(({ template, articles }) => {
    const prizes = templates[template];
    if (!Array.isArray(prizes)) return;

    (articles || []).forEach((article) => entries.set(String(article), prizes));
  });

  Object.entries(data?.overrides || {}).forEach(([article, entry]) => {
    if (Array.isArray(entry?.prizes)) entries.set(String(article), entry.prizes);
  });

  return entries;
}

export function withPlanPrizes(plans, data) {
  const entries = prizesByArticle(data);

  return plans.map((plan) => ({
    ...plan,
    prizes: clonePrizes(entries.get(String(plan.article))),
  }));
}
