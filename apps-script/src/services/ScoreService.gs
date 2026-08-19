/** Orquestra estatísticas, critérios, score e persistência sem executar cálculos. */
class ScoreService {
  constructor(statisticsRepository, criteriaRepository, criteriaRegistry, criteriaEngine, scoreEngine) {
    this.statisticsRepository = statisticsRepository;
    this.criteriaRepository = criteriaRepository;
    this.criteriaRegistry = criteriaRegistry;
    this.criteriaEngine = criteriaEngine;
    this.scoreEngine = scoreEngine;
  }

  updateScores(numberAnalyses) {
    const analyses = numberAnalyses || new CriteriaService(
      this.statisticsRepository,
      this.criteriaRepository,
      this.criteriaRegistry,
      this.criteriaEngine
    ).evaluateNumberAnalyses();
    const scoreResults = this.scoreEngine.calculate(analyses);
    this.statisticsRepository.updateScores(scoreResults);
    return scoreResults;
  }
}
