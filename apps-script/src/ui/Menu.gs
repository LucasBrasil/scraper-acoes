/** Cria o menu principal ao abrir a planilha. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(MS_CONFIG.MENU_NAME)
    .addItem('▶ Atualizar Tudo', 'updateAll')
    .addItem('Validar Histórico', 'validateHistory')
    .addItem('Atualizar Histórico', 'updateHistorySync')
    .addItem('Atualizar Estatísticas', 'updateStatistics')
    .addItem('Atualizar Score', 'updateScores')
    .addItem('Atualizar Ranking', 'updateRanking')
    .addItem('Atualizar Seleção', 'updateSelection')
    .addItem('Gerar Bolão', 'generateSyndicateLottery')
    .addItem('Atualizar Resultados (Bolão)', 'updateSyndicateLotteryResults')
    .addToUi();
}

/** Atualiza score e ranking a partir das estatísticas e critérios ativos. */
function updateScores() {
  try {
    const service = new ScoreService(
      new StatisticsRepository(),
      new CriteriaRepository(),
      new CriteriaRegistry(),
      new CriteriaEngine(),
      new ScoreEngine()
    );
    const scores = service.updateScores();
    SpreadsheetApp.getUi().alert(`${scores.length} scores atualizados na aba ${MS_CONFIG.STATISTICS_SHEET_NAME}.`);
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Não foi possível atualizar o score: ${error.message}`);
    throw error;
  }
}

/** Atualiza o ranking geral a partir dos scores persistidos. */
function updateRanking() {
  try {
    const rankings = new RankingService(new StatisticsRepository(), new RankingEngine()).updateRanking();
    SpreadsheetApp.getUi().alert(`${rankings.length} dezenas classificadas.`);
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Não foi possível atualizar o ranking: ${error.message}`);
    throw error;
  }
}

/** Marca as dezenas candidatas sem gerar jogos. */
function updateSelection() {
  try {
    const selection = new SelectionService(
      new StatisticsRepository(),
      new ConfigRepository(),
      new SelectionEngine()
    ).updateSelection();
    SpreadsheetApp.getUi().alert(`${selection.selectedNumbers.length} dezenas candidatas selecionadas.`);
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Não foi possível atualizar a seleção: ${error.message}`);
    throw error;
  }
}

/** Atualiza a aba Estatísticas a partir exclusivamente da aba Histórico. */
function updateStatistics() {
  try {
    const service = new StatisticsService(
      new HistoryRepository(),
      new StatisticsEngine(),
      new StatisticsRepository()
    );
    const statistics = service.updateStatistics();
    SpreadsheetApp.getUi().alert(`${statistics.length} dezenas atualizadas na aba ${MS_CONFIG.STATISTICS_SHEET_NAME}.`);
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Não foi possível atualizar as estatísticas: ${error.message}`);
    throw error;
  }
}

/** Valida a integridade do histórico de concursos. */
function validateHistory() {
  try {
    const service = new HistoryValidationService(new HistoryRepository());
    const report = service.validate();
    const message = service.formatReport(report);
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Não foi possível validar o histórico: ${error.message}`);
    throw error;
  }
}

/** Sincroniza o histórico de concursos com a base de dados remota da CAIXA. */
function updateHistorySync() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    SpreadsheetApp.getUi().alert('Sincronização já em andamento. Tente novamente em alguns momentos.');
    return;
  }

  try {
    const result = _executeHistorySync();
    const message = _formatHistorySyncMessage(result);
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Não foi possível sincronizar o histórico: ${error.message}`);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

/** Executa a sincronização do histórico usando as dependências configuradas. */
function _executeHistorySync() {
  const configRepository = new ConfigRepository();
  const historyRepository = new HistoryRepository();
  const httpClient = new HttpClient();
  const contestSource = new CaixaMegaSenaContestSource(httpClient);

  const syncService = new HistorySyncService(
    contestSource,
    historyRepository,
    configRepository.getInitialHistorySize()
  );

  return syncService.sync();
}

/** Formata o resultado da sincronização em mensagem legível. */
function _formatHistorySyncMessage(result) {
  const conflictLine = result.conflicts.length > 0
    ? `Conflitos detectados: ${result.conflicts.length}\n`
    : '';

  return `Histórico sincronizado com sucesso!

Último local: ${result.latestLocal || 'nenhum'}
Último remoto: ${result.latestRemote}
Concursos consultados: ${result.fetched}
Concursos inseridos: ${result.inserted}
Já presentes: ${result.alreadyPresent.length}
${conflictLine}Tipo: ${result.isInitialLoad ? 'carga inicial' : 'incremental'}`;
}

/** Executa a atualização operacional completa do MS Analytics. */
function updateAll() {
  try {
    const statisticsRepository = new StatisticsRepository();
    const criteriaRepository = new CriteriaRepository();
    const configRepository = new ConfigRepository();
    const result = new PipelineService(
      new StatisticsService(new HistoryRepository(), new StatisticsEngine(), statisticsRepository),
      new CriteriaService(statisticsRepository, criteriaRepository, new CriteriaRegistry(), new CriteriaEngine()),
      new ScoreService(statisticsRepository, criteriaRepository, new CriteriaRegistry(), new CriteriaEngine(), new ScoreEngine()),
      new RankingService(statisticsRepository, new RankingEngine()),
      new SelectionService(statisticsRepository, configRepository, new SelectionEngine()),
      new DashboardService(new HistoryRepository(), statisticsRepository, criteriaRepository, new DashboardRepository()),
      configRepository,
      new PipelineLogger(new LogRepository())
    ).execute();
    const message = result.success
      ? `Pipeline concluído em ${result.duration} ms.`
      : `Pipeline interrompido em ${result.errors[0].step}: ${result.errors[0].message}`;
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Não foi possível executar o pipeline: ${error.message}`);
    throw error;
  }
}

/** Gera o bolão com sincronização automática, validação e distribuição de jogos. */
function generateSyndicateLottery() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    SpreadsheetApp.getUi().alert('Geração de bolão já em andamento. Tente novamente em alguns momentos.');
    return;
  }

  try {
    const result = _executeSyndicateLotteryGeneration();
    const message = _formatSyndicateLotteryMessage(result);
    SpreadsheetApp.getUi().alert(message);
    _logSyndicateLotteryAudit(result);

    if (result.isSuccess()) {
      _persistSyndicateLotteryGames(result);
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Não foi possível gerar o bolão: ${error.message}`);
    Logger.log(`ERRO na geração do bolão: ${error.message}`);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

/** Executa a geração do bolão usando as dependências configuradas. */
function _executeSyndicateLotteryGeneration() {
  const historyRepository = new HistoryRepository();
  const httpClient = new HttpClient();
  const contestSource = new CaixaMegaSenaContestSource(httpClient);
  const statisticsRepository = new StatisticsRepository();
  const statisticsService = new StatisticsService(historyRepository, new StatisticsEngine(), statisticsRepository);

  statisticsService.updateStatistics();
  Logger.log('Estatísticas atualizadas para geração do bolão.');

  const syndicateConfig = new SyndicateConfig(7, 6.00, new MaxDezenasDistributionStrategy());

  const service = new SyndicateLotteryService(
    historyRepository,
    contestSource,
    statisticsService,
    syndicateConfig
  );

  return service.generate();
}

/** Formata o resultado da geração do bolão em mensagem legível. */
function _formatSyndicateLotteryMessage(result) {
  if (!result.isSuccess()) {
    return `Erro na geração do bolão:\n${result.error}`;
  }

  const jogosTexto = result.games.map((game, idx) => `  Jogo ${idx + 1}: ${game.join(', ')}`).join('\n');

  return `Bolão gerado com sucesso!

Sincronização:
  Último concurso local: ${result.lastLocalContest}
  Último concurso remoto: ${result.lastRemoteContest}
  Concursos inseridos: ${result.contestsInserted}
  Concursos já presentes: ${result.contestsAlreadyPresent}
  Conflitos: ${result.syncConflicts}

Histórico:
  Status da integridade: ${result.integrityStatus}
  Detalhes: ${result.integrityDetails}

Seleção e Distribuição:
  Dezenas selecionadas: ${result.selectedNumbers.join(', ')}
  Participantes: ${result.participants}
  Valor por participante: R$ ${result.valuePerParticipant.toFixed(2)}
  Orçamento: R$ ${result.totalBudget.toFixed(2)}
  Quantidade de jogos: ${result.totalGames}
  Dezenas por jogo: ${result.dezenaPerGame}

Jogos:
${jogosTexto}`;
}

/** Registra o resultado no Logger para auditoria. */
function _logSyndicateLotteryAudit(result) {
  Logger.log(result.auditLog());
}

/** Persiste os jogos gerados na aba "Jogos Bolão". */
function _persistSyndicateLotteryGames(result) {
  try {
    const historyRepository = new HistoryRepository();
    const gamesRepository = new SyndicateGamesSheetRepository();
    const gamesService = new SyndicateGamesSheetService(gamesRepository, historyRepository);

    gamesService.updateResults();
    Logger.log('Resultados de concursos anteriores atualizados.');

    const persistResult = gamesService.persistGames(result);

    if (persistResult.skipped) {
      result.alreadyGenerated = true;
      Logger.log(`Geração ignorada: ${persistResult.reason}`);
    } else if (persistResult.persistedGames > 0) {
      Logger.log(`Jogos persistidos: ${persistResult.persistedGames} (concurso ${persistResult.contestNumber})`);
    }
  } catch (error) {
    Logger.log(`Aviso: Não foi possível persistir os jogos: ${error.message}`);
  }
}

/** Atualiza os resultados dos jogos já gerados na aba "Jogos Bolão". */
function updateSyndicateLotteryResults() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    SpreadsheetApp.getUi().alert('Atualização de resultados já em andamento. Tente novamente em alguns momentos.');
    return;
  }

  try {
    const historyRepository = new HistoryRepository();
    const httpClient = new HttpClient();
    const contestSource = new CaixaMegaSenaContestSource(httpClient);

    const syncService = new HistorySyncService(
      contestSource,
      historyRepository,
      historyRepository.getLatestContestNumber()
    );
    syncService.sync();

    const gamesRepository = new SyndicateGamesSheetRepository();
    const gamesService = new SyndicateGamesSheetService(gamesRepository, historyRepository);
    const updateResult = gamesService.updateResults();

    const message = `Resultados atualizados com sucesso!\n\nLinhas atualizadas: ${updateResult.updatedLines}`;
    SpreadsheetApp.getUi().alert(message);
    Logger.log(`Atualização de resultados: ${updateResult.updatedLines} linhas atualizadas.`);
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Não foi possível atualizar os resultados: ${error.message}`);
    Logger.log(`ERRO na atualização de resultados: ${error.message}`);
    throw error;
  } finally {
    lock.releaseLock();
  }
}
