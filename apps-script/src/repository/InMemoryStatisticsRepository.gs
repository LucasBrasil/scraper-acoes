/** Repositório de estatísticas em memória para testes e backtesting. */
class InMemoryStatisticsRepository extends IStatisticsRepository {
  constructor() {
    super();
    this.statistics = [];
  }

  getAll() {
    return this.statistics.map(dto =>
      new Statistic(
        dto.number,
        dto.frequency,
        { frequency: dto.ranking },
        dto.delay,
        dto.windows,
        dto.trend,
        dto.score
      )
    );
  }

  replaceAll(statisticDTOs) {
    this.statistics = statisticDTOs.map(dto => ({
      number: dto.number,
      frequency: dto.frequency,
      ranking: dto.ranking,
      delay: dto.delay,
      windows: { ...dto.windows },
      trend: dto.trend,
      score: dto.score,
      scoreRanking: dto.scoreRanking,
      generalRanking: dto.generalRanking,
      selected: dto.selected
    }));
  }

  updateScores(scoreResults) {
    const scoresByNumber = scoreResults.reduce((map, result) => {
      map[result.number] = result;
      return map;
    }, {});

    this.statistics.forEach(stat => {
      const result = scoresByNumber[stat.number];
      if (result) {
        stat.score = result.score;
        stat.scoreRanking = result.ranking;
      }
    });
  }

  getScoreResults() {
    return this.statistics.map(stat =>
      new ScoreResult(stat.number, stat.score, stat.scoreRanking, [], stat.frequency)
    );
  }

  getRankingResults() {
    return this.statistics.map(stat =>
      new RankingResult(stat.number, stat.generalRanking, stat.score, stat.frequency)
    );
  }

  updateRanking(rankingResults) {
    const rankingsByNumber = rankingResults.reduce((map, result) => {
      map[result.number] = result.ranking;
      return map;
    }, {});

    this.statistics.forEach(stat => {
      stat.generalRanking = rankingsByNumber[stat.number] || 0;
    });
  }

  updateSelection(selectionResult) {
    const selectedNumbers = new Set(selectionResult.selectedNumbers);

    this.statistics.forEach(stat => {
      stat.selected = selectedNumbers.has(stat.number);
    });
  }

  _getSelectionState() {
    return this.statistics.reduce((map, stat) => {
      map[stat.number] = stat.selected;
      return map;
    }, {});
  }
}
