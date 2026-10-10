/** Serviço de geração de bolão com base no histórico local e nova estratégia de score. */
class SyndicateLotteryService {
  constructor(historyRepository, statisticsService, syndicateConfig) {
    this.historyRepository = historyRepository;
    this.statisticsService = statisticsService;
    this.syndicateConfig = syndicateConfig;
  }

  /**
   * Executa a geração completa do bolão:
   * 1. Valida integridade do histórico local
   * 2. Calcula estatísticas
   * 3. Seleciona 7 dezenas
   * 4. Distribui jogos
   *
   * @returns {SyndicateLotteryResult}
   */
  generate() {
    const result = new SyndicateLotteryResult();

    try {
      result.lastLocalContest = this.historyRepository.getLatestContestNumber();
      result.lastRemoteContest = result.lastLocalContest;

      const integrityResult = this._validateHistory();
      result.integrityStatus = integrityResult.status;
      result.integrityDetails = integrityResult.details;

      if (!integrityResult.isValid) {
        result.error = 'Integridade do histórico comprometida: ' + integrityResult.details;
        return result;
      }

      const contests = this.historyRepository.getAll();
      const selectedNumbers = this._selectNumbers(contests);
      result.selectedNumbers = selectedNumbers.slice();

      const games = this._distributeGames(selectedNumbers);
      result.games = games.map(g => g.slice());
      result.totalGames = games.length;
      result.dezenaPerGame = 7;
      result.participants = this.syndicateConfig.participants;
      result.valuePerParticipant = this.syndicateConfig.valuePerParticipant;
      result.totalBudget = this.syndicateConfig.getBudget();

      if (result.lastLocalContest > 0) {
        const gamesRepository = new SyndicateGamesSheetRepository();
        const games = gamesRepository.getGamesByContest(result.lastLocalContest);

        if (games.length > 0) {
          const lastGame = games[0];
          result.lastDrawnNumbers = lastGame.drawnNumbers ? lastGame.drawnNumbers.slice() : [];
          result.hits = this._calculateHits(lastGame.selectedNumbers, result.lastDrawnNumbers);
          Logger.log(`[generate] Last contest from games sheet: ${result.lastLocalContest}, Drawn: [${result.lastDrawnNumbers}], Selected: [${selectedNumbers}], Hits: ${result.hits}`);
        }
      }

      return result;
    } catch (error) {
      result.error = error.message;
      return result;
    }
  }

  _validateHistory() {
    const contests = this.historyRepository.getAll();
    const report = HistoryIntegrity.validate(contests);

    const isValid = !report.hasDuplicates && !report.hasGaps && !report.hasOutOfOrder;
    const details = [];

    if (report.hasDuplicates) details.push('Duplicados encontrados');
    if (report.hasGaps) details.push('Lacunas encontradas');
    if (report.hasOutOfOrder) details.push('Concursos fora de ordem');

    return {
      isValid: isValid,
      status: isValid ? 'OK' : 'ERRO',
      details: details.length > 0 ? details.join('; ') : 'Nenhum problema encontrado'
    };
  }

  _selectNumbers(contests) {
    const statisticsEngine = new StatisticsEngine();
    const statistics = statisticsEngine.calculate(contests);
    const strategiesRepo = new InMemoryStatisticsRepository();
    const statisticDTOs = statistics.map(stat => new StatisticDTO(stat));
    strategiesRepo.replaceAll(statisticDTOs);

    const config = new NewScoreStrategyConfig(
      { count: 10, weight: 2 },
      { count: 10, weight: 1 },
      { weight: 1 },
      { weight: 1 }
    );

    const lastDrawn = contests.length > 0 ? contests[contests.length - 1].drawnNumbers : [];
    const calculator = new NewScoreCalculator(config, statistics, lastDrawn);
    const baseCalculations = calculator.calculate();

    const selectedNumbers = [];
    const remainingCandidates = new Set(baseCalculations.map(c => c.getNumber()));

    Logger.log('[_selectNumbers] Starting sequential selection with pair frequency');

    for (let position = 0; position < 7; position++) {
      let bestNumber = null;
      let bestScore = -Infinity;

      const referenceNumber = position > 0 ? selectedNumbers[selectedNumbers.length - 1] : null;
      Logger.log(`[_selectNumbers] Position ${position + 1}, Reference: ${referenceNumber}`);

      for (const candidate of remainingCandidates) {
        const baseScore = baseCalculations.find(c => c.getNumber() === candidate)?.getTotalScore() || 0;
        let pairBonus = 0;

        if (referenceNumber !== null) {
          pairBonus = this._calculatePairBonus(candidate, referenceNumber);
        }

        const totalScore = baseScore + pairBonus;
        Logger.log(`  Candidate ${candidate}: base=${baseScore}, pair=${pairBonus}, total=${totalScore}`);

        if (totalScore > bestScore || (totalScore === bestScore && candidate < bestNumber)) {
          bestScore = totalScore;
          bestNumber = candidate;
        }
      }

      if (bestNumber !== null) {
        selectedNumbers.push(bestNumber);
        remainingCandidates.delete(bestNumber);
        Logger.log(`[_selectNumbers] Selected: ${bestNumber} (score=${bestScore})`);
      }
    }

    return selectedNumbers.sort((a, b) => a - b);
  }

  _calculatePairBonus(candidate, referenceNumber) {
    const { mostFrequent, leastFrequent } = this._findPairFrequencies(candidate, referenceNumber);

    if (candidate === mostFrequent) {
      Logger.log(`    -> Pair bonus for ${candidate}: +2 (most frequent with ${referenceNumber})`);
      return 2;
    } else if (candidate === leastFrequent) {
      Logger.log(`    -> Pair bonus for ${candidate}: -1 (least frequent with ${referenceNumber})`);
      return -1;
    }

    return 0;
  }

  _findPairFrequencies(candidate, referenceNumber) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName('Pares');

    if (!sheet) {
      return { mostFrequent: null, leastFrequent: null };
    }

    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return { mostFrequent: null, leastFrequent: null };
    }

    const pairsWithRef = [];
    for (let i = 1; i < values.length; i++) {
      const num1 = values[i][0];
      const num2 = values[i][1];
      const frequency = values[i][2];

      if ((num1 === referenceNumber && num2 !== referenceNumber) ||
          (num2 === referenceNumber && num1 !== referenceNumber)) {
        const otherNumber = num1 === referenceNumber ? num2 : num1;
        pairsWithRef.push({ number: otherNumber, frequency: frequency });
      }
    }

    if (pairsWithRef.length === 0) {
      return { mostFrequent: null, leastFrequent: null };
    }

    pairsWithRef.sort((a, b) => {
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency;
      }
      return a.number - b.number;
    });

    return { mostFrequent: pairsWithRef[0].number, leastFrequent: pairsWithRef[pairsWithRef.length - 1].number };
  }

  _distributeGames(selectedNumbers) {
    const syndicateDistribution = this.syndicateConfig.getDistribution();
    return syndicateDistribution.games7 > 0
      ? [selectedNumbers]
      : [];
  }

  _getCriteriasAsMap() {
    const map = {};
    const criteriaRegistry = new CriteriaRegistry();
    criteriaRegistry.getAll().forEach(c => {
      map[c.getDefinition().id] = null;
      map[c.getDefinition().name] = null;
    });
    return map;
  }

  _calculateHits(selectedNumbers, drawnNumbers) {
    if (!drawnNumbers || drawnNumbers.length === 0) {
      return 0;
    }
    const drawnSet = new Set(drawnNumbers.map(num => Number(num)));
    return selectedNumbers.filter(num => drawnSet.has(Number(num))).length;
  }
}
