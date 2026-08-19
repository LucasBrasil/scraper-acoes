/** Contrato de persistência da visão de estatísticas. */
class IStatisticsRepository {
  getAll() {
    throw new Error('IStatisticsRepository.getAll deve ser implementado.');
  }

  replaceAll(statisticDTOs) {
    throw new Error('IStatisticsRepository.replaceAll deve ser implementado.');
  }

  updateScores(scoreResults) {
    throw new Error('IStatisticsRepository.updateScores deve ser implementado.');
  }

  getScoreResults() {
    throw new Error('IStatisticsRepository.getScoreResults deve ser implementado.');
  }

  getRankingResults() {
    throw new Error('IStatisticsRepository.getRankingResults deve ser implementado.');
  }

  updateRanking(rankingResults) {
    throw new Error('IStatisticsRepository.updateRanking deve ser implementado.');
  }

  updateSelection(selectionResult) {
    throw new Error('IStatisticsRepository.updateSelection deve ser implementado.');
  }
}
