/** Resumo imutável dos resultados de um backtest. */
class BacktestSummary {
  constructor(results) {
    this.results = results || [];
  }

  getTotalContests() {
    return this.results.length;
  }

  getContestsByHits(hits) {
    return this.results.filter(r => r.hits === hits).map(r => r.contestNumber);
  }

  getAverageHits() {
    if (this.results.length === 0) {
      return 0;
    }
    const total = this.results.reduce((sum, r) => sum + r.hits, 0);
    return total / this.results.length;
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

  summary() {
    const dist = this.getHitsDistribution();
    return `Backtest: ${this.getTotalContests()} concursos, média ${this.getAverageHits().toFixed(2)} acertos (0: ${dist[0]}, 1: ${dist[1]}, 2: ${dist[2]}, 3: ${dist[3]}, 4: ${dist[4]}, 5: ${dist[5]}, 6: ${dist[6]})`;
  }
}
