/** Backtest baseline: seleciona as Top 7 dezenas do ranking para cada concurso. */
class BaselineBacktest {
  constructor(statisticsEngine, criteriaRegistry, criteriaEngine, scoreEngine, rankingEngine) {
    this.statisticsEngine = statisticsEngine;
    this.criteriaRegistry = criteriaRegistry;
    this.criteriaEngine = criteriaEngine;
    this.scoreEngine = scoreEngine;
    this.rankingEngine = rankingEngine;
  }

  /**
   * Executa o backtest baseline na janela especificada.
   * Para cada concurso, seleciona as 7 primeiras dezenas do ranking.
   *
   * @param {Contest[]} allContests - histórico completo, ordenado decrescente
   * @param {number} firstToTest - primeiro concurso a testar (inclusive)
   * @param {number} lastToTest - último concurso a testar (inclusive)
   * @returns {BaselineBacktestResult}
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

    return new BaselineBacktestResult(results);
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
        { source: 'baseline-backtest' }
      );

      const criterionResults = this.criteriaEngine.evaluate(criteriaContext, this.criteriaRegistry.getAll());
      const numberAnalyses = NumberAnalysis.fromStatisticsAndCriterionResults(
        statisticsRepo.getAll(),
        criterionResults
      );

      const scoreResults = this.scoreEngine.calculate(numberAnalyses);
      statisticsRepo.updateScores(scoreResults);

      const rankingResults = this.rankingEngine.rank(statisticsRepo.getScoreResults());

      const top7 = rankingResults
        .sort((a, b) => a.ranking - b.ranking)
        .slice(0, 7)
        .map(r => r.number);

      const hits = this._countHits(top7, contestToTest.drawnNumbers);

      return {
        contestNumber: testNumber,
        selectedNumbers: top7,
        drawnNumbers: contestToTest.drawnNumbers.slice(),
        hits: hits
      };
    } catch (error) {
      return null;
    }
  }

  _getCriteriasAsMap() {
    const map = {};
    this.criteriaRegistry.getAll().forEach(c => {
      map[c.getDefinition().id] = null;
      map[c.getDefinition().name] = null;
    });
    return map;
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
}
