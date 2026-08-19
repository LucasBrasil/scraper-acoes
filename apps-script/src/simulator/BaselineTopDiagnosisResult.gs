/** Resultado imutável do diagnóstico do Baseline Top 7. */
class BaselineTopDiagnosisResult {
  constructor(details) {
    this.details = details || [];
  }

  getTotalContests() {
    return this.details.length;
  }

  getDrawnNumbersInTopN(topN) {
    let count = 0;
    this.details.forEach(detail => {
      detail.drawnNumbers.forEach(num => {
        const pos = detail.positionsInRanking[detail.drawnNumbers.indexOf(num)];
        if (pos && pos <= topN) {
          count++;
        }
      });
    });
    return count;
  }

  getTotalDrawnNumbers() {
    return this.details.length * 6;
  }

  getPercentageInTopN(topN) {
    const total = this.getTotalDrawnNumbers();
    if (total === 0) return 0;
    return ((this.getDrawnNumbersInTopN(topN) / total) * 100).toFixed(2);
  }

  getSummary() {
    const top7 = this.getDrawnNumbersInTopN(7);
    const top10 = this.getDrawnNumbersInTopN(10);
    const top15 = this.getDrawnNumbersInTopN(15);
    const top20 = this.getDrawnNumbersInTopN(20);
    const top25 = this.getDrawnNumbersInTopN(25);
    const total = this.getTotalDrawnNumbers();

    return {
      total: total,
      top7: { count: top7, percentage: this.getPercentageInTopN(7) },
      top10: { count: top10, percentage: this.getPercentageInTopN(10) },
      top15: { count: top15, percentage: this.getPercentageInTopN(15) },
      top20: { count: top20, percentage: this.getPercentageInTopN(20) },
      top25: { count: top25, percentage: this.getPercentageInTopN(25) }
    };
  }

  summary() {
    const s = this.getSummary();
    return `Diagnóstico: ${s.total} dezenas sorteadas, Top 7: ${s.top7.count} (${s.top7.percentage}%), ` +
           `Top 10: ${s.top10.count} (${s.top10.percentage}%), Top 15: ${s.top15.count} (${s.top15.percentage}%), ` +
           `Top 20: ${s.top20.count} (${s.top20.percentage}%), Top 25: ${s.top25.count} (${s.top25.percentage}%)`;
  }
}
