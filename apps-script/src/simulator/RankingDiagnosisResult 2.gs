/** Resultado imutável do diagnóstico do ranking. */
class RankingDiagnosisResult {
  constructor(details) {
    this.details = details || [];
  }

  getTotalContests() {
    return this.details.length;
  }

  getTotalDrawnNumbers() {
    return this.details.length * 6;
  }

  getDrawnPositions() {
    const positions = [];
    this.details.forEach(detail => {
      detail.drawnPositions.forEach(dp => {
        if (dp.position) {
          positions.push(dp.position);
        }
      });
    });
    return positions;
  }

  getAveragePosition() {
    const positions = this.getDrawnPositions();
    if (positions.length === 0) return null;
    const sum = positions.reduce((a, b) => a + b, 0);
    return sum / positions.length;
  }

  getMedianPosition() {
    const positions = this.getDrawnPositions().sort((a, b) => a - b);
    if (positions.length === 0) return null;
    if (positions.length % 2 === 1) {
      return positions[Math.floor(positions.length / 2)];
    }
    const mid1 = positions[positions.length / 2 - 1];
    const mid2 = positions[positions.length / 2];
    return (mid1 + mid2) / 2;
  }

  getBestPosition() {
    const positions = this.getDrawnPositions();
    if (positions.length === 0) return null;
    return Math.min.apply(null, positions);
  }

  getWorstPosition() {
    const positions = this.getDrawnPositions();
    if (positions.length === 0) return null;
    return Math.max.apply(null, positions);
  }

  getDistributionByRange() {
    const positions = this.getDrawnPositions();
    return {
      top7: positions.filter(p => p <= 7).length,
      range8_10: positions.filter(p => p > 7 && p <= 10).length,
      range11_15: positions.filter(p => p > 10 && p <= 15).length,
      range16_20: positions.filter(p => p > 15 && p <= 20).length,
      range21_25: positions.filter(p => p > 20 && p <= 25).length,
      outOfTop25: positions.filter(p => p > 25).length
    };
  }

  summary() {
    const avg = this.getAveragePosition();
    const median = this.getMedianPosition();
    const best = this.getBestPosition();
    const worst = this.getWorstPosition();
    const dist = this.getDistributionByRange();
    const total = this.getTotalDrawnNumbers();

    const avgStr = avg ? avg.toFixed(2) : 'N/A';
    const medianStr = median ? median.toFixed(2) : 'N/A';
    const bestStr = best ? best : 'N/A';
    const worstStr = worst ? worst : 'N/A';

    return `Ranking: ${this.getTotalContests()} concursos, média ${avgStr}, mediana ${medianStr}, ` +
           `melhor ${bestStr}, pior ${worstStr}, ` +
           `Top7: ${dist.top7}, 8-10: ${dist.range8_10}, 11-15: ${dist.range11_15}, ` +
           `16-20: ${dist.range16_20}, 21-25: ${dist.range21_25}, fora: ${dist.outOfTop25}`;
  }
}
