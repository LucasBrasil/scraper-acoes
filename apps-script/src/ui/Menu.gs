/** Cria o menu principal ao abrir a planilha. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(MS_CONFIG.MENU_NAME)
    .addItem('▶ Atualizar Tudo', 'updateAll')
    .addItem('Validar Histórico', 'validateHistory')
    .addItem('Atualizar Histórico', 'updateHistorySync')
    .addItem('Inserir Resultado Manualmente', 'insertContestResultManually')
    .addItem('Atualizar Estatísticas', 'updateStatistics')
    .addItem('Atualizar Score', 'updateScores')
    .addItem('Atualizar Ranking', 'updateRanking')
    .addItem('Atualizar Seleção', 'updateSelection')
    .addItem('Gerar Bolão', 'generateSyndicateLottery')
    .addItem('Atualizar Resultados (Bolão)', 'updateSyndicateLotteryResults')
    .addItem('Analisar Pares de Números', 'analyzePairFrequency')
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

  const contestSource = new FallbackContestSource(
    new CaixaMegaSenaContestSource(httpClient),
    new IntersenaContestSource(httpClient),
    new SomatematicaMegaSenaContestSource(httpClient)
  );

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

/** Gera o bolão com validação do histórico local e distribuição de jogos. */
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
  const statisticsRepository = new StatisticsRepository();
  const statisticsService = new StatisticsService(historyRepository, new StatisticsEngine(), statisticsRepository);

  statisticsService.updateStatistics();
  Logger.log('Estatísticas atualizadas para geração do bolão.');

  const syndicateConfig = new SyndicateConfig(7, 6.00, new MaxDezenasDistributionStrategy());

  const service = new SyndicateLotteryService(
    historyRepository,
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
  const lastDrawnText = result.lastDrawnNumbers && result.lastDrawnNumbers.length > 0
    ? `  Números: ${result.lastDrawnNumbers.join(', ')}`
    : '  (Nenhum resultado disponível)';

  return `Bolão gerado com sucesso!

Histórico:
  Último concurso local: ${result.lastLocalContest}
  Status da integridade: ${result.integrityStatus}
  Detalhes: ${result.integrityDetails}

Resultado do Último Concurso (Concurso ${result.lastLocalContest}):
${lastDrawnText}
  Acertos: ${result.hits} número(s)

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

/** Analisa pares de números frequentes no histórico e popula a aba "Pares". */
function analyzePairFrequency() {
  try {
    const historyRepository = new HistoryRepository();
    const analyzer = new PairFrequencyAnalyzer(historyRepository);

    const pairs = analyzer.analyze();

    _populatePairsSheet(pairs);

    const message = `Análise concluída!\n\nPares únicos encontrados: ${pairs.length}\nMaior frequência: ${pairs.length > 0 ? pairs[0].frequency : 0}\n\nDados gravados na aba "Pares".`;
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Erro na análise de pares: ${error.message}`);
    Logger.log(`ERRO: ${error.message}`);
    throw error;
  }
}

/** Popula a aba "Pares" com os dados de frequência. */
function _populatePairsSheet(pairs) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('Pares');

  if (!sheet) {
    sheet = spreadsheet.insertSheet('Pares');
  }

  sheet.clear();

  const headers = ['Número 1', 'Número 2', 'Frequência'];
  sheet.appendRow(headers);

  const data = pairs.map(p => [p.num1, p.num2, p.frequency]);
  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, 3).setValues(data);
  }

  const headerRange = sheet.getRange(1, 1, 1, 3);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285F4');
  headerRange.setFontColor('#FFFFFF');

  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 120);
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

    const contestSource = new FallbackContestSource(
      new CaixaMegaSenaContestSource(httpClient),
      new SomatematicaMegaSenaContestSource(httpClient)
    );

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

/** Permite inserir resultado de concurso manualmente. */
function insertContestResultManually() {
  const ui = SpreadsheetApp.getUi();
  const prompt = ui.prompt(
    'Inserir Resultado do Concurso',
    'Digite o número do concurso e os 6 números sorteados.\n\nExemplo: 3065 5 10 15 20 30 45',
    ui.ButtonSet.OK_CANCEL
  );

  if (prompt.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const input = prompt.getResponseText().trim();
  const parts = input.split(/\s+/).map(s => s.trim()).filter(s => s);

  if (parts.length !== 7 && parts.length !== 8) {
    ui.alert('Erro: Digite o número do concurso + 6 números.\n\nExemplos:\n3065 5 10 15 20 30 45\nOU\n3065 03/10/2026 5 10 15 20 30 45');
    return;
  }

  try {
    const contestNumber = Number(parts[0]);
    // Se tem 8 partes, segunda é a data, números começam na terceira
    // Se tem 7 partes, números começam na segunda
    const numberStartIndex = parts.length === 8 ? 2 : 1;
    const drawnNumbers = parts.slice(numberStartIndex).map(n => Number(n));

    if (!Number.isInteger(contestNumber) || contestNumber < 1000 || contestNumber > 9999) {
      throw new Error('Número do concurso deve ser entre 1000 e 9999');
    }

    const seen = new Set();
    for (const num of drawnNumbers) {
      if (!Number.isInteger(num) || num < 1 || num > 60 || seen.has(num)) {
        throw new Error('Números devem ser inteiros, únicos e entre 1 e 60');
      }
      seen.add(num);
    }

    Logger.log(`[insertContestResultManually] Inserindo resultado: concurso ${contestNumber}, números ${drawnNumbers}`);

    const historyRepository = new HistoryRepository();
    const contests = historyRepository.getAll();

    const existing = contests.find(c => c.number === contestNumber);
    if (existing) {
      ui.alert(`Concurso ${contestNumber} já existe no histórico.`);
      return;
    }

    const newContest = new Contest(
      contestNumber,
      new Date().toISOString().split('T')[0],
      drawnNumbers
    );

    historyRepository.save(newContest);
    Logger.log(`[insertContestResultManually] Resultado do concurso ${contestNumber} inserido no histórico`);

    // Atualizar os resultados nos jogos do bolão
    try {
      const gamesRepository = new SyndicateGamesSheetRepository();
      const gamesService = new SyndicateGamesSheetService(gamesRepository, historyRepository);
      const updateResult = gamesService.updateResults();

      Logger.log(`[insertContestResultManually] Jogos atualizados: ${updateResult.updatedLines} linhas`);

      let hitsMessage = '';
      const lastGame = gamesRepository.getGamesByContest(contestNumber).pop();
      if (lastGame) {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jogos Bolão');
        const row = sheet.getRange(lastGame.rowIndex, 1, 1, 60).getValues()[0];
        const selectedNumbers = row
          .map((value, index) => (value !== '' ? index + 1 : null))
          .filter(num => num !== null);
        const drawnSet = new Set(drawnNumbers);
        const hits = selectedNumbers.filter(num => drawnSet.has(num)).length;
        hitsMessage = `\nAcertos: ${hits} número(s)`;
        Logger.log(`[insertContestResultManually] Último jogo: ${selectedNumbers}, Acertos: ${hits}`);
      }

      const message = `Resultado inserido e jogos atualizados!\n\nConcurso: ${contestNumber}\nNúmeros: ${drawnNumbers.join(', ')}${hitsMessage}`;
      ui.alert(message);
      Logger.log(`[insertContestResultManually] Resultado do concurso ${contestNumber} processado.${hitsMessage}`);

    } catch (updateError) {
      Logger.log(`[insertContestResultManually] Aviso: Resultado inserido mas não foi possível atualizar jogos: ${updateError.message}`);
      const message = `Resultado inserido com sucesso!\n\nConcurso: ${contestNumber}\nNúmeros: ${drawnNumbers.join(', ')}\n\nAviso: Não foi possível atualizar os jogos automaticamente.`;
      ui.alert(message);
    }

  } catch (error) {
    ui.alert(`Erro ao inserir resultado: ${error.message}`);
    Logger.log(`[insertContestResultManually] ERRO: ${error.message}`);
    throw error;
  }
}
