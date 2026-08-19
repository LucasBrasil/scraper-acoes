/** Motor de simulação histórica do pipeline analítico sem utilizar dados futuros. */
class BacktestEngine {
  constructor(statisticsEngine, criteriaRegistry, criteriaEngine, scoreEngine, rankingEngine, selectionEngine) {
    this.statisticsEngine = statisticsEngine;
    this.criteriaRegistry = criteriaRegistry;
    this.criteriaEngine = criteriaEngine;
    this.scoreEngine = scoreEngine;
    this.rankingEngine = rankingEngine;
    this.selectionEngine = selectionEngine;
  }

  /**
   * Executa o backtest na janela especificada.
   * Para cada concurso na janela, calcula o que teria sido selecionado
   * usando somente histórico anterior a esse concurso.
   *
   * @param {Contest[]} allContests - histórico completo, ordenado decrescente
   * @param {number} firstToTest - primeiro concurso a testar (inclusive)
   * @param {number} lastToTest - último concurso a testar (inclusive)
   * @param {number} candidateCount - quantidade de dezenas a selecionar
   * @param {IConfigRepository} configRepository - para ler configurações
   * @param {Array} criteria - critérios ativos
   * @returns {BacktestSummary}
   */
  run(allContests, firstToTest, lastToTest, candidateCount, configRepository, criteria) {
    if (!Array.isArray(allContests) || allContests.length === 0) {
      throw new Error('histórico vazio');
    }
    if (firstToTest < 1 || lastToTest < firstToTest) {
      throw new Error('janela de teste inválida');
    }
    if (candidateCount < 1 || candidateCount > 60) {
      throw new Error('quantidade de dezenas inválida');
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
      const result = this._evaluateContest(
        testNumber,
        historicalContests,
        contestToTest,
        candidateCount,
        configRepository,
        criteria
      );

      if (result) {
        results.push(result);
      }
    }

    return new BacktestSummary(results);
  }

  _evaluateContest(testNumber, historicalContests, contestToTest, candidateCount, configRepository, criteria) {
    try {
      const statistics = this.statisticsEngine.calculate(historicalContests);
      const statisticsRepo = new InMemoryStatisticsRepository();
      const statisticDTOs = statistics.map(stat => new StatisticDTO(stat));
      statisticsRepo.replaceAll(statisticDTOs);

      const criteriaContext = new CriteriaContext(
        statisticsRepo.getAll(),
        this._getCriteriasAsMap(criteria),
        null,
        { source: 'backtest' }
      );

      const criterionResults = this.criteriaEngine.evaluate(criteriaContext, criteria);
      const numberAnalyses = NumberAnalysis.fromStatisticsAndCriterionResults(
        statisticsRepo.getAll(),
        criterionResults
      );

      const scoreResults = this.scoreEngine.calculate(numberAnalyses);
      statisticsRepo.updateScores(scoreResults);

      const rankingResults = this.rankingEngine.rank(statisticsRepo.getScoreResults());
      statisticsRepo.updateRanking(rankingResults);

      const selectionResult = this.selectionEngine.select(statisticsRepo.getRankingResults(), candidateCount);
      statisticsRepo.updateSelection(selectionResult);

      const hits = this._countHits(selectionResult.selectedNumbers, contestToTest.drawnNumbers);

      return {
        contestNumber: testNumber,
        selectedNumbers: selectionResult.selectedNumbers.slice(),
        drawnNumbers: contestToTest.drawnNumbers.slice(),
        hits: hits
      };
    } catch (error) {
      return null;
    }
  }

  _getCriteriasAsMap(criteria) {
    const map = {};
    if (Array.isArray(criteria)) {
      criteria.forEach(c => {
        map[c.getDefinition().id] = null;
        map[c.getDefinition().name] = null;
      });
    }
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
