/** Calculador do novo score baseado em NewScoreStrategyConfig. */
class NewScoreCalculator {
  constructor(config, statistics, lastContestDrawnNumbers) {
    if (!config) {
      throw new Error('configuração é obrigatória');
    }
    if (!Array.isArray(statistics)) {
      throw new Error('statistics deve ser um array');
    }
    if (!Array.isArray(lastContestDrawnNumbers)) {
      throw new Error('lastContestDrawnNumbers deve ser um array');
    }

    this.config = config;
    this.statistics = statistics;
    this.lastContestDrawnNumbers = new Set(lastContestDrawnNumbers);
  }

  /**
   * Calcula o score para todas as 60 dezenas.
   *
   * @returns {NewScoreCalculation[]} array com resultado para cada número
   */
  calculate() {
    const results = [];

    for (let number = 1; number <= 60; number++) {
      results.push(this._calculateForNumber(number));
    }

    return results;
  }

  _calculateForNumber(number) {
    const components = [];

    const topFrequent = this._isTopFrequent(number);
    if (topFrequent) {
      components.push(new NewScoreComponent('top_frequent', this.config.topFrequent.weight));
    }

    const bottomFrequent = this._isBottomFrequent(number);
    if (bottomFrequent) {
      components.push(new NewScoreComponent('bottom_frequent', this.config.bottomFrequent.weight));
    }

    const minRecurrence = this._isMinRecurrence(number);
    if (minRecurrence) {
      components.push(new NewScoreComponent('min_recurrence', this.config.minRecurrence.weight));
    }

    const lastDrawn = this._isLastDrawn(number);
    if (lastDrawn) {
      components.push(new NewScoreComponent('last_drawn', this.config.lastDrawn.weight));
    }

    return new NewScoreCalculation(number, components);
  }

  _isTopFrequent(number) {
    const stat = this.statistics.find(s => s.number === number);
    if (!stat) return false;

    const frequencyByNumber = this.statistics
      .map(s => ({ number: s.number, frequency: s.frequency }))
      .sort((a, b) => b.frequency - a.frequency);

    const topCount = Math.min(this.config.topFrequent.count, frequencyByNumber.length);
    const topFrequents = frequencyByNumber.slice(0, topCount);

    return topFrequents.some(t => t.number === number);
  }

  _isBottomFrequent(number) {
    const stat = this.statistics.find(s => s.number === number);
    if (!stat) return false;

    const frequencyByNumber = this.statistics
      .map(s => ({ number: s.number, frequency: s.frequency }))
      .sort((a, b) => a.frequency - b.frequency);

    const bottomCount = Math.min(this.config.bottomFrequent.count, frequencyByNumber.length);
    const bottomFrequents = frequencyByNumber.slice(0, bottomCount);

    return bottomFrequents.some(b => b.number === number);
  }

  _isMinRecurrence(number) {
    const stat = this.statistics.find(s => s.number === number);
    if (!stat) return false;

    const minDelay = Math.min.apply(null, this.statistics.map(s => s.delay));
    return stat.delay === minDelay && minDelay >= 0;
  }

  _isLastDrawn(number) {
    return this.lastContestDrawnNumbers.has(number);
  }
}
