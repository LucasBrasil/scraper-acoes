/** Serviço de geração de bolão com base no histórico local e nova estratégia de score. */
class SyndicateLotteryService {
  constructor(historyRepository, statisticsService, syndicateConfig, scoringConfig) {
    this.historyRepository = historyRepository;
    this.statisticsService = statisticsService;
    this.syndicateConfig = syndicateConfig;
    this.scoringConfig = scoringConfig;
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
      const pickOrder = this._selectNumbers(contests);
      result.selectedNumbers = pickOrder.slice(0, 7).sort((a, b) => a - b);
      result.scoreBreakdown = this.scoreBreakdown;

      const games = this._distributeGames(pickOrder);
      result.games = games;
      result.totalGames = games.length;
      result.participants = this.syndicateConfig.participants;
      result.valuePerParticipant = this.syndicateConfig.valuePerParticipant;
      result.totalBudget = this.syndicateConfig.getBudget();

      if (result.lastLocalContest > 0) {
        const gamesRepository = new SyndicateGamesSheetRepository();
        const contestGames = gamesRepository.getGamesByContest(result.lastLocalContest);

        if (contestGames.length > 0) {
          result.lastDrawnNumbers = contestGames[0].drawnNumbers ? contestGames[0].drawnNumbers.slice() : [];
          result.lastContestResults = contestGames.map(game => ({
            size: game.selectedNumbers.length,
            hits: this._calculateHits(game.selectedNumbers, result.lastDrawnNumbers)
          }));
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
      this.scoringConfig.topFrequent,
      this.scoringConfig.bottomFrequent,
      this.scoringConfig.minRecurrence,
      this.scoringConfig.lastDrawn
    );

    const lastDrawn = contests.length > 0 ? contests[contests.length - 1].drawnNumbers : [];
    const calculator = new NewScoreCalculator(config, statistics, lastDrawn);
    const baseCalculations = calculator.calculate();

    const selectedNumbers = [];
    this.scoreBreakdown = [];
    const remainingCandidates = new Set(baseCalculations.map(c => c.getNumber()));

    Logger.log('[_selectNumbers] Starting sequential selection with pair frequency');

    const pickCount = this._countNumbersToPick();
    const pairs = this._loadPairs();

    for (let position = 0; position < pickCount; position++) {
      let bestNumber = null;
      let bestScore = -Infinity;

      const referenceNumber = position > 0 ? selectedNumbers[selectedNumbers.length - 1] : null;
      const pairExtremes = referenceNumber !== null ? this._findPairExtremes(pairs, referenceNumber) : null;
      Logger.log(`[_selectNumbers] Position ${position + 1}, Reference: ${referenceNumber}`);

      for (const candidate of remainingCandidates) {
        const baseScore = baseCalculations.find(c => c.getNumber() === candidate)?.getTotalScore() || 0;
        let pairBonus = 0;

        if (referenceNumber !== null) {
          pairBonus = this._calculatePairBonus(candidate, pairExtremes, referenceNumber);
        }

        const totalScore = baseScore + pairBonus;
        Logger.log(`  Candidate ${candidate}: base=${baseScore}, pair=${pairBonus}, total=${totalScore}`);

        if (totalScore > bestScore || (totalScore === bestScore && candidate < bestNumber)) {
          bestScore = totalScore;
          bestNumber = candidate;
        }
      }

      if (bestNumber !== null) {
        const baseCalculation = baseCalculations.find(c => c.getNumber() === bestNumber);
        this.scoreBreakdown.push({
          position: position + 1,
          number: bestNumber,
          reference: referenceNumber,
          components: baseCalculation.getComponents().map(c => `${c.getName()} ${c.getWeight() >= 0 ? '+' : ''}${c.getWeight()}`),
          base: baseCalculation.getTotalScore(),
          pair: bestScore - baseCalculation.getTotalScore(),
          total: bestScore
        });
        selectedNumbers.push(bestNumber);
        remainingCandidates.delete(bestNumber);
        Logger.log(`[_selectNumbers] Selected: ${bestNumber} (score=${bestScore})`);
      }
    }

    return selectedNumbers;
  }

  _calculatePairBonus(candidate, pairExtremes, referenceNumber) {
    const { mostFrequent, leastFrequent } = pairExtremes;

    if (candidate === mostFrequent) {
      const weight = this.scoringConfig.pairMostFrequent.weight;
      Logger.log(`    -> Pair bonus for ${candidate}: ${weight} (most frequent with ${referenceNumber})`);
      return weight;
    } else if (candidate === leastFrequent) {
      const weight = this.scoringConfig.pairLeastFrequent.weight;
      Logger.log(`    -> Pair bonus for ${candidate}: ${weight} (least frequent with ${referenceNumber})`);
      return weight;
    }

    return 0;
  }

  _loadPairs() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pares');
    if (!sheet) {
      return [];
    }

    return sheet.getDataRange().getValues().slice(1).map(row => ({
      num1: row[0],
      num2: row[1],
      frequency: row[2]
    }));
  }

  _findPairExtremes(pairs, referenceNumber) {
    const pairsWithRef = [];
    for (const { num1, num2, frequency } of pairs) {
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

  _countNumbersToPick() {
    const distribution = this.syndicateConfig.getDistribution();
    return (distribution.games7 > 0 ? 7 : 0) + (distribution.games6 > 0 ? 6 : 0);
  }

  _distributeGames(pickOrder) {
    const distribution = this.syndicateConfig.getDistribution();
    const games = [];
    let offset = 0;

    if (distribution.games7 > 0) {
      games.push(pickOrder.slice(offset, offset + 7).sort((a, b) => a - b));
      offset += 7;
    }
    if (distribution.games6 > 0) {
      games.push(pickOrder.slice(offset, offset + 6).sort((a, b) => a - b));
    }

    return games;
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
