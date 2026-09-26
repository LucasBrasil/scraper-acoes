/** Ablation study para avaliar contribuição individual dos critérios. */
class AblationBacktest {
  constructor(statisticsEngine, criteriaRegistry, criteriaEngine, scoreEngine, rankingEngine) {
    this.statisticsEngine = statisticsEngine;
    this.criteriaRegistry = criteriaRegistry;
    this.criteriaEngine = criteriaEngine;
    this.scoreEngine = scoreEngine;
    this.rankingEngine = rankingEngine;
  }

  /**
   * Executa o ablation study com as 4 configurações.
   *
   * @param {Contest[]} allContests - histórico completo
   * @param {Array} windows - array de objetos {name, first, last}
   * @returns {AblationBacktestResult}
   */
  run(allContests, windows) {
    if (!Array.isArray(allContests) || allContests.length === 0) {
      throw new Error('histórico vazio');
    }
    if (!Array.isArray(windows) || windows.length === 0) {
      throw new Error('janelas vazias');
    }

    const configs = [
      AblationBacktestConfig.createBaseline(),
      AblationBacktestConfig.createWithoutBottomFrequent(),
      AblationBacktestConfig.createWithoutMinRecurrence(),
      AblationBacktestConfig.createWithoutLastDrawn()
    ];

    const results = [];

    configs.forEach(config => {
      const strategyBacktest = new NewScoreStrategyBacktest(
        this.statisticsEngine,
        this.criteriaRegistry,
        this.criteriaEngine,
        this.scoreEngine,
        this.rankingEngine,
        config
      );

      windows.forEach(window => {
        const backTestResult = strategyBacktest.run(allContests, window.first, window.last);
        const configResult = new AblationBacktestConfigResult(
          config.name,
          config.getDescription(),
          window.name,
          backTestResult
        );
        results.push(configResult);
      });
    });

    return new AblationBacktestResult(results);
  }
}
