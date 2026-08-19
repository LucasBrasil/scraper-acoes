/** Coordena critérios ativos sem conhecer planilhas ou regras específicas. */
class CriteriaEngine {
  evaluate(context, criteria) {
    if (!(context instanceof CriteriaContext) || !Array.isArray(criteria)) {
      throw new Error('CriteriaEngine espera um CriteriaContext e critérios válidos.');
    }
    if (!context.statistics.every((statistic) => statistic instanceof Statistic)) {
      throw new Error('CriteriaEngine aceita somente objetos Statistic.');
    }

    return criteria.slice()
      .sort((first, second) => first.getDefinition().priority.value - second.getDefinition().priority.value)
      .reduce((results, criterion) => {
      const config = context.getConfiguration(criterion.getDefinition());
      if (!criterion.isEnabled(config)) {
        return results;
      }

      criterion.configure(config);
      criterion.prepare(context);
      return results.concat(context.statistics.map((statistic) => criterion.evaluate(context, statistic)));
    }, []);
  }
}
