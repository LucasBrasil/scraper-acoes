/** Serviço de geração de bolão com sincronização automática e nova estratégia de score. */
class SyndicateLotteryService {
  constructor(historyRepository, contestSource, statisticsService, syndicateConfig) {
    this.historyRepository = historyRepository;
    this.contestSource = contestSource;
    this.statisticsService = statisticsService;
    this.syndicateConfig = syndicateConfig;
  }

  /**
   * Executa a geração completa do bolão:
   * 1. Sincroniza histórico com CAIXA
   * 2. Valida integridade
   * 3. Calcula estatísticas
   * 4. Seleciona 7 dezenas
   * 5. Distribui jogos
   *
   * @returns {SyndicateLotteryResult}
   */
  generate() {
    const result = new SyndicateLotteryResult();

    try {
      result.lastLocalContest = this.historyRepository.getLatestContestNumber();

      const syncResult = this._syncHistory();
      result.lastRemoteContest = syncResult.lastRemote;
      result.contestsInserted = syncResult.inserted;
      result.contestsAlreadyPresent = syncResult.alreadyPresent;
      result.syncConflicts = syncResult.conflicts;

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

      return result;
    } catch (error) {
      result.error = error.message;
      return result;
    }
  }

  _syncHistory() {
    const currentLatest = this.historyRepository.getLatestContestNumber();

    try {
      const syncService = new HistorySyncService(
        this.contestSource,
        this.historyRepository,
        currentLatest
      );
      const syncResult = syncService.sync();

      let lastRemote = currentLatest;
      if (syncResult.toInsert && syncResult.toInsert.length > 0) {
        lastRemote = Math.max.apply(null, syncResult.toInsert.map(d => d.number));
        if (currentLatest > lastRemote) {
          lastRemote = currentLatest;
        }
      }

      return {
        inserted: syncResult.toInsert ? syncResult.toInsert.length : 0,
        alreadyPresent: syncResult.alreadyPresent ? syncResult.alreadyPresent.length : 0,
        conflicts: syncResult.conflicts ? syncResult.conflicts.length : 0,
        lastRemote: lastRemote
      };
    } catch (e) {
      return {
        inserted: 0,
        alreadyPresent: 0,
        conflicts: 0,
        lastRemote: currentLatest
      };
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

    const criteriaContext = new CriteriaContext(
      strategiesRepo.getAll(),
      this._getCriteriasAsMap(),
      null,
      { source: 'syndicate-lottery' }
    );

    const criteriaEngine = new CriteriaEngine();
    const criteriaRegistry = new CriteriaRegistry();
    const criterionResults = criteriaEngine.evaluate(criteriaContext, criteriaRegistry.getAll());
    const numberAnalyses = NumberAnalysis.fromStatisticsAndCriterionResults(
      strategiesRepo.getAll(),
      criterionResults
    );

    const scoreEngine = new ScoreEngine();
    const scoreResults = scoreEngine.calculate(numberAnalyses);
    strategiesRepo.updateScores(scoreResults);

    const rankingEngine = new RankingEngine();
    const rankingResults = rankingEngine.rank(strategiesRepo.getScoreResults());

    const config = new NewScoreStrategyConfig(
      { count: 10, weight: 2 },
      { count: 10, weight: 1 },
      { weight: 1 },
      { weight: 1 }
    );

    const lastDrawn = contests.length > 0 ? contests[contests.length - 1].drawnNumbers : [];
    const calculator = new NewScoreCalculator(config, statistics, lastDrawn);
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
}
