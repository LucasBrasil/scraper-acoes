/** Produz rankings por métrica sem acoplar o modelo a uma única classificação. */
class RankingAnalyzer {
  rankByFrequency(statistics) {
    const orderedStatistics = statistics.slice()
      .sort((first, second) => second.frequency - first.frequency || first.number - second.number);
    return orderedStatistics.reduce((rankings, statistic, index) => {
      rankings[statistic.number] = index + 1;
      return rankings;
    }, {});
  }
}
