/** Resultado imutável de um backtest baseline. */
class BaselineBacktestResult {
  constructor(results) {
    this.results = results || [];
  }

  getTotalContests() {
    return this.results.length;
  }

  getHitsDistribution() {
    const dist = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    this.results.forEach(r => {
      if (dist.hasOwnProperty(r.hits)) {
        dist[r.hits]++;
      }
    });
    return dist;
  }

  getAverageHits() {
    if (this.results.length === 0) {
      return 0;
    }
    const total = this.results.reduce((sum, r) => sum + r.hits, 0);
    return total / this.results.length;
  }

  getMaxHits() {
    if (this.results.length === 0) {
      return 0;
    }
    return Math.max.apply(null, this.results.map(r => r.hits));
  }

  getCountWithMinHits(minHits) {
    return this.results.filter(r => r.hits >= minHits).length;
  }

  getPercentageWithMinHits(minHits) {
    if (this.results.length === 0) {
      return 0;
    }
    return (this.getCountWithMinHits(minHits) / this.results.length * 100).toFixed(2);
  }

  summary() {
    const dist = this.getHitsDistribution();
    const avg = this.getAverageHits();
    const max = this.getMaxHits();

    return `Baseline: ${this.getTotalContests()} concursos, média ${avg.toFixed(2)} acertos, máximo ${max}, ` +
           `>=3: ${this.getCountWithMinHits(3)} (${this.getPercentageWithMinHits(3)}%), ` +
           `>=4: ${this.getCountWithMinHits(4)} (${this.getPercentageWithMinHits(4)}%), ` +
           `>=5: ${this.getCountWithMinHits(5)} (${this.getPercentageWithMinHits(5)}%), ` +
           `6: ${dist[6]} (${this.getPercentageWithMinHits(6)}%)`;
  }
}
