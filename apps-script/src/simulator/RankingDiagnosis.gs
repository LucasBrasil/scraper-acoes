/** Diagnóstico puro do ranking: posições e scores das dezenas candidatas. */
class RankingDiagnosis {
  constructor(statisticsEngine, criteriaRegistry, criteriaEngine, scoreEngine, rankingEngine) {
    this.statisticsEngine = statisticsEngine;
    this.criteriaRegistry = criteriaRegistry;
    this.criteriaEngine = criteriaEngine;
    this.scoreEngine = scoreEngine;
    this.rankingEngine = rankingEngine;
  }

  /**
   * Executa o diagnóstico do ranking na janela especificada.
   *
   * @param {Contest[]} allContests - histórico completo
   * @param {number} firstToTest - primeiro concurso a testar
   * @param {number} lastToTest - último concurso a testar
   * @returns {RankingDiagnosisResult}
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
      const detail = this._analyzeRanking(testNumber, historicalContests, contestToTest);

      if (detail) {
        details.push(detail);
      }
    }

    return new RankingDiagnosisResult(details);
  }

  _analyzeRanking(testNumber, historicalContests, contestToTest) {
    try {
      const statistics = this.statisticsEngine.calculate(historicalContests);
      const statisticsRepo = new InMemoryStatisticsRepository();
      const statisticDTOs = statistics.map(stat => new StatisticDTO(stat));
      statisticsRepo.replaceAll(statisticDTOs);

      const criteriaContext = new CriteriaContext(
        statisticsRepo.getAll(),
        this._getCriteriasAsMap(),
        null,
        { source: 'ranking-diagnosis' }
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

      const top25 = fullRanking.slice(0, 25).map((r, index) => ({
        number: r.number,
        score: r.score,
        position: index + 1
      }));

      const drawnNumbers = contestToTest.drawnNumbers;
      const drawnPositions = drawnNumbers.map(num => {
        const entry = top25.find(t => t.number === num);
        if (entry) {
          return { number: num, position: entry.position, score: entry.score };
        }
        const posInFull = fullRanking.findIndex(r => r.number === num);
        return { number: num, position: posInFull >= 0 ? posInFull + 1 : null, score: null };
      });

      return {
        contestNumber: testNumber,
        top25: top25,
        drawnNumbers: drawnNumbers.slice(),
        drawnPositions: drawnPositions
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
}
