/** Aplica uma estratégia de ranking sem conhecer planilhas ou repositórios. */
class RankingEngine {
  constructor(rankingStrategy) {
    this.rankingStrategy = rankingStrategy || new ScoreRankingStrategy();
  }

  rank(scoreResults) {
    if (!Array.isArray(scoreResults) || !scoreResults.every((result) => result instanceof ScoreResult)) {
      throw new Error('RankingEngine espera uma lista de objetos ScoreResult.');
    }
    return this.rankingStrategy.rank(scoreResults);
  }
}
