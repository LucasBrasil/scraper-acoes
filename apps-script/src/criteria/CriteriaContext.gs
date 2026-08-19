/** Contexto imutável compartilhado durante uma execução da Criteria Engine. */
class CriteriaContext {
  constructor(statistics, configurations, history, metadata) {
    if (!Array.isArray(statistics)) {
      throw new Error('CriteriaContext exige uma lista de estatísticas.');
    }
    this.statistics = statistics;
    this.configurations = configurations || {};
    this.history = history || null;
    this.metadata = metadata || {};
  }

  getConfiguration(definition) {
    return this.configurations[definition.id] || this.configurations[definition.name] || null;
  }
}
