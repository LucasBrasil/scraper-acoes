/** Motor puro de cálculo das estatísticas das dezenas. */
class StatisticsEngine extends IStatisticsEngine {
  constructor(frequencyAnalyzer, delayAnalyzer, windowAnalyzer, rankingAnalyzer) {
    super();
    this.frequencyAnalyzer = frequencyAnalyzer || new FrequencyAnalyzer();
    this.delayAnalyzer = delayAnalyzer || new DelayAnalyzer();
    this.windowAnalyzer = windowAnalyzer || new WindowAnalyzer();
    this.rankingAnalyzer = rankingAnalyzer || new RankingAnalyzer();
  }

  calculate(contests) {
    if (!Array.isArray(contests)) {
      throw new Error('StatisticsEngine espera uma lista de concursos.');
    }

    const orderedContests = contests.slice().sort((first, second) => second.number - first.number);
    this._validateContests(orderedContests);
    const frequencies = this.calculateFrequency(orderedContests);
    const delays = this.calculateDelay(orderedContests);
    const windows = this.calculateWindows(orderedContests);
    const statistics = this._createStatistics(frequencies, delays, windows);
    const rankings = this.calculateRanking(statistics);
    return this._applyRankingsAndOrder(statistics, rankings);
  }

  calculateFrequency(contests) {
    return this.frequencyAnalyzer.analyze(contests);
  }

  calculateDelay(contests) {
    return this.delayAnalyzer.analyze(contests);
  }

  calculateWindows(contests) {
    return this.windowAnalyzer.analyze(contests);
  }

  calculateRanking(statistics) {
    return this.rankingAnalyzer.rankByFrequency(statistics);
  }

  _createStatistics(frequencies, delays, windows) {
    return Array.from({ length: 60 }, (_, index) => {
      const number = index + 1;
      return new Statistic(number, frequencies[number], {}, delays[number], windows[number], 0, 0);
    });
  }

  _applyRankingsAndOrder(statistics, frequencyRankings) {
    return statistics
      .map((statistic) => new Statistic(
        statistic.number,
        statistic.frequency,
        { frequency: frequencyRankings[statistic.number] },
        statistic.delay,
        statistic.windows,
        statistic.trend,
        statistic.score
      ))
      .sort((first, second) => first.rankings.frequency - second.rankings.frequency);
  }

  _validateContests(contests) {
    if (!contests.every((contest) => contest instanceof Contest)) {
      throw new Error('StatisticsEngine aceita somente objetos Contest.');
    }
  }
}
