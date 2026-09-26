/** Orquestra leitura de ranking, configuração, seleção e persistência. */
class SelectionService {
  constructor(statisticsRepository, configRepository, selectionEngine) {
    this.statisticsRepository = statisticsRepository;
    this.configRepository = configRepository;
    this.selectionEngine = selectionEngine;
  }

  updateSelection() {
    const selectionResult = this.selectionEngine.select(
      this.statisticsRepository.getRankingResults(),
      this.configRepository.getCandidateCount()
    );
    this.statisticsRepository.updateSelection(selectionResult);
    return selectionResult;
  }
}
