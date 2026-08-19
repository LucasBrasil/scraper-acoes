/** Orquestra a avaliação dos critérios sem conter regras de decisão. */
class CriteriaService {
  constructor(statisticsRepository, criteriaRepository, criteriaRegistry, criteriaEngine) {
    this.statisticsRepository = statisticsRepository;
    this.criteriaRepository = criteriaRepository;
    this.criteriaRegistry = criteriaRegistry;
    this.criteriaEngine = criteriaEngine;
  }

  evaluateCriteria() {
    return this._evaluateContext().results;
  }

  evaluateNumberAnalyses() {
    const evaluation = this._evaluateContext();
    return NumberAnalysis.fromStatisticsAndCriterionResults(evaluation.context.statistics, evaluation.results);
  }

  _evaluateContext() {
    const context = new CriteriaContext(
      this.statisticsRepository.getAll(),
      this.criteriaRepository.getAll(),
      null,
      { source: 'statistics-sheet' }
    );
    return { context, results: this.criteriaEngine.evaluate(context, this.criteriaRegistry.getAll()) };
  }
}
