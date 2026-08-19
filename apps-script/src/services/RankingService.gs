/** Orquestra leitura de scores, ranking e persistência. */
class RankingService {
  constructor(statisticsRepository, rankingEngine) {
    this.statisticsRepository = statisticsRepository;
    this.rankingEngine = rankingEngine;
  }

  updateRanking() {
    const rankingResults = this.rankingEngine.rank(this.statisticsRepository.getScoreResults());
    this.statisticsRepository.updateRanking(rankingResults);
    return rankingResults;
  }
}
