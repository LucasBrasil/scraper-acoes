/** Resultado de uma configuração individual do ablation study. */
class AblationBacktestConfigResult {
  constructor(configName, configDescription, window, backTestResult) {
    this.configName = configName;
    this.configDescription = configDescription;
    this.window = window;
    this.totalContests = backTestResult.getTotalContests();
    this.distribution = backTestResult.getHitsDistribution();
    this.averageHits = backTestResult.getAverageHits();
    this.maxHits = backTestResult.getMaxHits();
    this.count3Plus = backTestResult.getCountWithMinHits(3);
    this.percent3Plus = backTestResult.getPercentageWithMinHits(3);
    this.count4Plus = backTestResult.getCountWithMinHits(4);
    this.percent4Plus = backTestResult.getPercentageWithMinHits(4);
    this.count5Plus = backTestResult.getCountWithMinHits(5);
    this.percent5Plus = backTestResult.getPercentageWithMinHits(5);
    this.count6 = this.distribution[6];
    this.percent6 = backTestResult.getPercentageWithMinHits(6);
  }

  summary() {
    return `${this.configName} (${this.window}): média=${this.averageHits.toFixed(2)}, ` +
           `>=3=${this.count3Plus}(${this.percent3Plus}%), ` +
           `>=4=${this.count4Plus}(${this.percent4Plus}%), ` +
           `>=5=${this.count5Plus}(${this.percent5Plus}%), ` +
           `6=${this.count6}(${this.percent6}%)`;
  }

  fullSummary() {
    return `${this.configDescription}\n` +
           `  Janela: ${this.window}\n` +
           `  Concursos: ${this.totalContests}\n` +
           `  Distribuição: 0=${this.distribution[0]}, 1=${this.distribution[1]}, 2=${this.distribution[2]}, ` +
           `3=${this.distribution[3]}, 4=${this.distribution[4]}, 5=${this.distribution[5]}, 6=${this.distribution[6]}\n` +
           `  Média: ${this.averageHits.toFixed(2)}\n` +
           `  Máximo: ${this.maxHits}\n` +
           `  >=3: ${this.count3Plus} (${this.percent3Plus}%)\n` +
           `  >=4: ${this.count4Plus} (${this.percent4Plus}%)\n` +
           `  >=5: ${this.count5Plus} (${this.percent5Plus}%)\n` +
           `  6: ${this.count6} (${this.percent6}%)`;
  }
}
