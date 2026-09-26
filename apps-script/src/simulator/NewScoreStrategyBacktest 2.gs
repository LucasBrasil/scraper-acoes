/** Backtest puro em memória da nova estratégia de score. */
class NewScoreStrategyBacktest {
  constructor(statisticsEngine, criteriaRegistry, criteriaEngine, scoreEngine, rankingEngine, config) {
    this.statisticsEngine = statisticsEngine;
    this.criteriaRegistry = criteriaRegistry;
    this.criteriaEngine = criteriaEngine;
    this.scoreEngine = scoreEngine;
    this.rankingEngine = rankingEngine;
    this.customConfig = config;
  }

  /**
   * Executa o backtest da estratégia de score na janela especificada.
   *
   * @param {Contest[]} allContests - histórico completo (não alterado)
   * @param {number} firstToTest - primeiro concurso a testar
   * @param {number} lastToTest - último concurso a testar
   * @returns {NewScoreStrategyBacktestResult}
   */
  run(allContests, firstToTest, lastToTest) {
    if (!Array.isArray(allContests) || allContests.length === 0) {
      throw new Error('histórico vazio');
    }
    if (firstToTest < 1 || lastToTest < firstToTest) {
      throw new Error('janela de teste inválida');
    }

    const results = [];
    const contestMap = new Map(allContests.map(c => [c.number, c]));
    const sortedNumbers = Array.from(contestMap.keys()).sort((a, b) => a - b);

    for (let testNumber = firstToTest; testNumber <= lastToTest; testNumber++) {
      const contestToTest = contestMap.get(testNumber);
      if (!contestToTest) {
        continue;
      }

      const historicalNumbers = sortedNumbers.filter(n => n < testNumber);
      if (historicalNumbers.length === 0) {
        continue;
      }

      const historicalContests = historicalNumbers.map(n => contestMap.get(n));
      const result = this._evaluateContest(testNumber, historicalContests, contestToTest);

      if (result) {
        results.push(result);
      }
    }

    return new NewScoreStrategyBacktestResult(results);
  }

  _evaluateContest(testNumber, historicalContests, contestToTest) {
    try {
      const statistics = this.statisticsEngine.calculate(historicalContests);
      const statisticsRepo = new InMemoryStatisticsRepository();
      const statisticDTOs = statistics.map(stat => new StatisticDTO(stat));
      statisticsRepo.replaceAll(statisticDTOs);

      const criteriaContext = new CriteriaContext(
        statisticsRepo.getAll(),
        this._getCriteriasAsMap(),
        null,
        { source: 'new-score-strategy-backtest' }
      );

      const criterionResults = this.criteriaEngine.evaluate(criteriaContext, this.criteriaRegistry.getAll());
      const numberAnalyses = NumberAnalysis.fromStatisticsAndCriterionResults(
        statisticsRepo.getAll(),
        criterionResults
      );

      const scoreResults = this.scoreEngine.calculate(numberAnalyses);
      statisticsRepo.updateScores(scoreResults);

      const rankingResults = this.rankingEngine.rank(statisticsRepo.getScoreResults());

      const selectedNumbers = this._selectTop7ByNewStrategy(
        statisticsRepo.getAll(),
        rankingResults,
        historicalContests,
        contestToTest
      );

      const hits = this._countHits(selectedNumbers, contestToTest.drawnNumbers);

      return {
        contestNumber: testNumber,
        selectedNumbers: selectedNumbers,
        drawnNumbers: contestToTest.drawnNumbers.slice(),
        hits: hits
      };
    } catch (error) {
      return null;
    }
  }

  _selectTop7ByNewStrategy(statistics, rankingResults, historicalContests, contestToTest) {
    const config = this.customConfig
      ? this.customConfig.toNewScoreStrategyConfig()
      : new NewScoreStrategyConfig(
          { count: 10, weight: 2 },
          { count: 10, weight: 1 },
          { weight: 2 },
          { weight: 1 }
        );

    const lastDrawnNumbers = historicalContests.length > 0
      ? historicalContests[historicalContests.length - 1].drawnNumbers
      : [];

    const calculator = new NewScoreCalculator(config, statistics, lastDrawnNumbers);
    const calculations = calculator.calculate();

    const tiebreaker = new NewScoreTiebreakerPolicy();
    const ranking = rankingResults.map(r => r.number);

    const sorted = calculations.sort((a, b) => {
      const aPosition = ranking.indexOf(a.getNumber()) + 1 || 61;
      const bPosition = ranking.indexOf(b.getNumber()) + 1 || 61;

      return tiebreaker.compare(
        { number: a.getNumber(), score: a.getTotalScore(), position: aPosition },
        { number: b.getNumber(), score: b.getTotalScore(), position: bPosition }
      );
    });

    return sorted.slice(0, 7).map(c => c.getNumber()).sort((a, b) => a - b);
  }

  _countHits(selectedNumbers, drawnNumbers) {
    const selectedSet = new Set(selectedNumbers);
    let hits = 0;
    drawnNumbers.forEach(number => {
      if (selectedSet.has(number)) {
        hits++;
      }
    });
    return hits;
  }

  _getCriteriasAsMap() {
    const map = {};
    this.criteriaRegistry.getAll().forEach(c => {
      map[c.getDefinition().id] = null;
      map[c.getDefinition().name] = null;
    });
    return map;
  }
}
