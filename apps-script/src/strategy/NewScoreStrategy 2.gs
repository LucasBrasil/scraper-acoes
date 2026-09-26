/** Estratégia de score para seleção de 7 dezenas. */
class NewScoreStrategy {
  constructor(config, tiebreakerPolicy) {
    if (!config) {
      throw new Error('configuração é obrigatória');
    }
    config.validate();

    this.config = config;
    this.tiebreakerPolicy = tiebreakerPolicy || new NewScoreTiebreakerPolicy();
  }

  getConfig() {
    return this.config;
  }

  getTiebreakerPolicy() {
    return this.tiebreakerPolicy;
  }

  getSelectionCount() {
    return this.config.selectionCount;
  }

  summary() {
    return `${this.config.summary()}. Desempate: ${this.tiebreakerPolicy.summary()}`;
  }
}
