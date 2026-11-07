/** Pesos e quantidades do bolão, lidos da aba Critérios. */
class SyndicateScoringConfig {
  static fromCriteria(criteria) {
    const names = MS_CONFIG.SYNDICATE_CRITERIA;
    const top = SyndicateScoringConfig._criterion(criteria, names.TOP_FREQUENT);
    const bottom = SyndicateScoringConfig._criterion(criteria, names.BOTTOM_FREQUENT);

    return {
      topFrequent: { count: SyndicateScoringConfig._count(top, names.TOP_FREQUENT), weight: SyndicateScoringConfig._weight(top) },
      bottomFrequent: { count: SyndicateScoringConfig._count(bottom, names.BOTTOM_FREQUENT), weight: SyndicateScoringConfig._weight(bottom) },
      minRecurrence: { weight: SyndicateScoringConfig._weight(SyndicateScoringConfig._criterion(criteria, names.MIN_DELAY)) },
      lastDrawn: { weight: SyndicateScoringConfig._weight(SyndicateScoringConfig._criterion(criteria, names.LAST_DRAWN)) },
      pairMostFrequent: { weight: SyndicateScoringConfig._weight(SyndicateScoringConfig._criterion(criteria, names.PAIR_MOST_FREQUENT)) },
      pairLeastFrequent: { weight: SyndicateScoringConfig._weight(SyndicateScoringConfig._criterion(criteria, names.PAIR_LEAST_FREQUENT)) }
    };
  }

  static _criterion(criteria, name) {
    const criterion = criteria[name];
    if (!criterion || !Number.isFinite(criterion.weight)) {
      throw new Error(`Critério "${name}" não encontrado ou sem peso válido na aba ${MS_CONFIG.CRITERIA_SHEET_NAME}.`);
    }
    return { name, ...criterion };
  }

  static _count(criterion, name) {
    if (!Number.isInteger(criterion.quantity) || criterion.quantity < 1) {
      throw new Error(`Critério "${name}" precisa de uma quantidade inteira positiva na coluna ${MS_CONFIG.CRITERIA_QUANTITY_HEADER} da aba ${MS_CONFIG.CRITERIA_SHEET_NAME}.`);
    }
    return criterion.quantity;
  }

  static _weight(criterion) {
    return criterion.enabled ? criterion.weight : 0;
  }
}
