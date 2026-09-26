/** Diagnóstico puro do Baseline Top 7: posição das dezenas sorteadas no ranking. */
class BaselineTopDiagnosis {
  constructor(statisticsEngine, criteriaRegistry, criteriaEngine, scoreEngine, rankingEngine) {
    this.statisticsEngine = statisticsEngine;
    this.criteriaRegistry = criteriaRegistry;
    this.criteriaEngine = criteriaEngine;
    this.scoreEngine = scoreEngine;
    this.rankingEngine = rankingEngine;
  }

  /**
   * Executa o diagnóstico na janela especificada.
   *
   * @param {Contest[]} allContests - histórico completo
   * @param {number} firstToTest - primeiro concurso a testar
   * @param {number} lastToTest - último concurso a testar
   * @returns {BaselineTopDiagnosisResult}
   */
  run(allContests, firstToTest, lastToTest) {
    if (!Array.isArray(allContests) || allContests.length === 0) {
      throw new Error('histórico vazio');
    }
    if (firstToTest < 1 || lastToTest < firstToTest) {
      throw new Error('janela de teste inválida');
    }

    const details = [];
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
      const detail = this._analyzeContest(testNumber, historicalContests, contestToTest);

      if (detail) {
        details.push(detail);
      }
    }

    return new BaselineTopDiagnosisResult(details);
  }

  _analyzeContest(testNumber, historicalContests, contestToTest) {
    try {
      const statistics = this.statisticsEngine.calculate(historicalContests);
      const statisticsRepo = new InMemoryStatisticsRepository();
      const statisticDTOs = statistics.map(stat => new StatisticDTO(stat));
      statisticsRepo.replaceAll(statisticDTOs);

      const criteriaContext = new CriteriaContext(
        statisticsRepo.getAll(),
        this._getCriteriasAsMap(),
        null,
        { source: 'baseline-diagnosis' }
      );

      const criterionResults = this.criteriaEngine.evaluate(criteriaContext, this.criteriaRegistry.getAll());
      const numberAnalyses = NumberAnalysis.fromStatisticsAndCriterionResults(
        statisticsRepo.getAll(),
        criterionResults
      );

      const scoreResults = this.scoreEngine.calculate(numberAnalyses);
      statisticsRepo.updateScores(scoreResults);

      const rankingResults = this.rankingEngine.rank(statisticsRepo.getScoreResults());
      const fullRanking = rankingResults.sort((a, b) => a.ranking - b.ranking);

      const top7 = fullRanking.slice(0, 7).map(r => r.number);

      const drawnNumbers = contestToTest.drawnNumbers;
      const hits = this._countHits(top7, drawnNumbers);

      const positionsInRanking = drawnNumbers.map(num => {
        const rankPos = fullRanking.findIndex(r => r.number === num);
        return rankPos >= 0 ? rankPos + 1 : null;
      });

      return {
        contestNumber: testNumber,
        selectedNumbers: top7.slice(),
        drawnNumbers: drawnNumbers.slice(),
        hits: hits,
        positionsInRanking: positionsInRanking
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
