/** Configuração dos componentes de score da estratégia. */
class NewScoreStrategyConfig {
  constructor(topFrequent, bottomFrequent, minRecurrence, lastDrawn, selectionCount) {
    this.topFrequent = topFrequent !== undefined ? topFrequent : { count: 10, weight: 2 };
    this.bottomFrequent = bottomFrequent !== undefined ? bottomFrequent : { count: 10, weight: 1 };
    this.minRecurrence = minRecurrence !== undefined ? minRecurrence : { weight: 2 };
    this.lastDrawn = lastDrawn !== undefined ? lastDrawn : { weight: 1 };
    this.selectionCount = selectionCount !== undefined ? selectionCount : 7;
  }

  validate() {
    if (!this.topFrequent || typeof this.topFrequent.count !== 'number' || this.topFrequent.count < 1) {
      throw new Error('topFrequent.count deve ser um número positivo');
    }
    if (typeof this.topFrequent.weight !== 'number' || this.topFrequent.weight < 0) {
      throw new Error('topFrequent.weight deve ser um número não-negativo');
    }

    if (!this.bottomFrequent || typeof this.bottomFrequent.count !== 'number' || this.bottomFrequent.count < 1) {
      throw new Error('bottomFrequent.count deve ser um número positivo');
    }
    if (typeof this.bottomFrequent.weight !== 'number' || this.bottomFrequent.weight < 0) {
      throw new Error('bottomFrequent.weight deve ser um número não-negativo');
    }

    if (!this.minRecurrence || typeof this.minRecurrence.weight !== 'number' || this.minRecurrence.weight < 0) {
      throw new Error('minRecurrence.weight deve ser um número não-negativo');
    }

    if (!this.lastDrawn || typeof this.lastDrawn.weight !== 'number' || this.lastDrawn.weight < 0) {
      throw new Error('lastDrawn.weight deve ser um número não-negativo');
    }

    if (!Number.isInteger(this.selectionCount) || this.selectionCount < 1) {
      throw new Error('selectionCount deve ser um inteiro positivo');
    }

    return this;
  }

  summary() {
    return `NewScoreStrategy: ` +
           `Top ${this.topFrequent.count} +${this.topFrequent.weight}pts, ` +
           `Bottom ${this.bottomFrequent.count} +${this.bottomFrequent.weight}pts, ` +
           `MinRecurrence +${this.minRecurrence.weight}pts, ` +
           `LastDrawn +${this.lastDrawn.weight}pts, ` +
           `Seleciona ${this.selectionCount}`;
  }
}
