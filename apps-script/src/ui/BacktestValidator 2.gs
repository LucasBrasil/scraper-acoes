/**
 * Função temporária de validação do BacktestEngine com histórico real.
 * Execute manualmente no Google Apps Script ou via menu para ver resultados no Logger.
 */
function validateBacktestWithRealHistory() {
  const startTime = new Date().getTime();

  try {
    Logger.log('=== Iniciando validação do BacktestEngine ===');

    const historyRepository = new HistoryRepository();
    const contests = historyRepository.getAll();

    Logger.log(`Histórico total: ${contests.length} concursos`);

    if (contests.length < 100) {
      Logger.log('ERRO: Histórico insuficiente para testar concursos 100-199');
      return;
    }

    const configRepository = new ConfigRepository();
    const candidateCount = configRepository.getCandidateCount();

    Logger.log(`Configuração: ${candidateCount} dezenas candidatas`);

    const engine = new BacktestEngine(
      new StatisticsEngine(),
      new CriteriaRegistry(),
      new CriteriaEngine(),
      new ScoreEngine(),
      new RankingEngine(),
      new SelectionEngine()
    );

    const criteria = new CriteriaRegistry().getAll();

    Logger.log('Executando BacktestEngine...');
    const summary = engine.run(contests, 2945, 3044, candidateCount, configRepository, criteria);

    const endTime = new Date().getTime();
    const duration = endTime - startTime;

    Logger.log(`\n=== Resultados do Backtest ===`);
    Logger.log(`Janela testada: concursos 2945-3044`);
    Logger.log(`Concursos testados: ${summary.getTotalContests()}`);

    const dist = summary.getHitsDistribution();
    Logger.log(`\nDistribuição de acertos:`);
    Logger.log(`  0 acertos: ${dist[0]}`);
    Logger.log(`  1 acerto:  ${dist[1]}`);
    Logger.log(`  2 acertos: ${dist[2]}`);
    Logger.log(`  3 acertos: ${dist[3]}`);
    Logger.log(`  4 acertos: ${dist[4]}`);
    Logger.log(`  5 acertos: ${dist[5]}`);
    Logger.log(`  6 acertos: ${dist[6]}`);

    const average = summary.getAverageHits();
    const maxHits = _getMaxHits(summary);

    Logger.log(`\nMédia de acertos: ${average.toFixed(2)}`);
    Logger.log(`Máximo de acertos: ${maxHits}`);
    Logger.log(`Tempo de execução: ${duration}ms`);

    Logger.log(`\n${summary.summary()}`);
    Logger.log('=== Validação concluída ===');

  } catch (error) {
    Logger.log(`ERRO: ${error.message}`);
    Logger.log(error.stack);
  }
}

function _getMaxHits(summary) {
  let max = 0;
  summary.results.forEach(r => {
    if (r.hits > max) {
      max = r.hits;
    }
  });
  return max;
}

/**
 * Função temporária de validação do BaselineBacktest com histórico real.
 * Execute manualmente no Google Apps Script para ver resultados no Logger.
 */
function validateBaselineBacktestWithRealHistory() {
  const startTime = new Date().getTime();

  try {
    Logger.log('=== Iniciando validação do BaselineBacktest ===');

    const historyRepository = new HistoryRepository();
    const contests = historyRepository.getAll();

    Logger.log(`Histórico total: ${contests.length} concursos`);

    if (contests.length < 2945) {
      Logger.log('ERRO: Histórico insuficiente para testar concursos 2945-3044');
      return;
    }

    Logger.log('Executando BaselineBacktest...');
    const engine = new BaselineBacktest(
      new StatisticsEngine(),
      new CriteriaRegistry(),
      new CriteriaEngine(),
      new ScoreEngine(),
      new RankingEngine()
    );

    const summary = engine.run(contests, 2945, 3044);

    const endTime = new Date().getTime();
    const duration = endTime - startTime;

    Logger.log(`\n=== Resultados do BaselineBacktest ===`);
    Logger.log(`Janela testada: concursos 2945-3044`);
    Logger.log(`Concursos testados: ${summary.getTotalContests()}`);

    const dist = summary.getHitsDistribution();
    Logger.log(`\nDistribuição de acertos:`);
    Logger.log(`  0 acertos: ${dist[0]}`);
    Logger.log(`  1 acerto:  ${dist[1]}`);
    Logger.log(`  2 acertos: ${dist[2]}`);
    Logger.log(`  3 acertos: ${dist[3]}`);
    Logger.log(`  4 acertos: ${dist[4]}`);
    Logger.log(`  5 acertos: ${dist[5]}`);
    Logger.log(`  6 acertos: ${dist[6]}`);

    const average = summary.getAverageHits();
    const max = summary.getMaxHits();
    const count3plus = summary.getCountWithMinHits(3);
    const percent3plus = summary.getPercentageWithMinHits(3);
    const count4plus = summary.getCountWithMinHits(4);
    const percent4plus = summary.getPercentageWithMinHits(4);
    const count5plus = summary.getCountWithMinHits(5);
    const percent5plus = summary.getPercentageWithMinHits(5);
    const count6 = dist[6];
    const percent6 = summary.getPercentageWithMinHits(6);

    Logger.log(`\nMédia de acertos: ${average.toFixed(2)}`);
    Logger.log(`Máximo de acertos: ${max}`);
    Logger.log(`>=3 acertos: ${count3plus} (${percent3plus}%)`);
    Logger.log(`>=4 acertos: ${count4plus} (${percent4plus}%)`);
    Logger.log(`>=5 acertos: ${count5plus} (${percent5plus}%)`);
    Logger.log(`6 acertos: ${count6} (${percent6}%)`);
    Logger.log(`Tempo de execução: ${duration}ms`);

    Logger.log(`\n${summary.summary()}`);
    Logger.log('=== Validação concluída ===');

  } catch (error) {
    Logger.log(`ERRO: ${error.message}`);
    Logger.log(error.stack);
  }
}

/**
 * Função temporária de validação do diagnóstico do BaselineBacktest com histórico real.
 * Execute manualmente no Google Apps Script para ver resultados no Logger.
 */
function validateBaselineTopDiagnosisWithRealHistory() {
  const startTime = new Date().getTime();

  try {
    Logger.log('=== Iniciando diagnóstico do Baseline Top 7 ===');

    const historyRepository = new HistoryRepository();
    const contests = historyRepository.getAll();

    Logger.log(`Histórico total: ${contests.length} concursos`);

    if (contests.length < 2945) {
      Logger.log('ERRO: Histórico insuficiente para testar concursos 2945-3044');
      return;
    }

    Logger.log('Executando diagnóstico...');
    const diagnosis = new BaselineTopDiagnosis(
      new StatisticsEngine(),
      new CriteriaRegistry(),
      new CriteriaEngine(),
      new ScoreEngine(),
      new RankingEngine()
    );

    const result = diagnosis.run(contests, 2945, 3044);

    const endTime = new Date().getTime();
    const duration = endTime - startTime;

    Logger.log(`\n=== Resultados do Diagnóstico ===`);
    Logger.log(`Janela testada: concursos 2945-3044`);
    Logger.log(`Concursos analisados: ${result.getTotalContests()}`);

    const summary = result.getSummary();
    Logger.log(`\nDistribuição de dezenas sorteadas no ranking:`);
    Logger.log(`Total de dezenas: ${summary.total}`);
    Logger.log(`Top 7: ${summary.top7.count} (${summary.top7.percentage}%)`);
    Logger.log(`Top 10: ${summary.top10.count} (${summary.top10.percentage}%)`);
    Logger.log(`Top 15: ${summary.top15.count} (${summary.top15.percentage}%)`);
    Logger.log(`Top 20: ${summary.top20.count} (${summary.top20.percentage}%)`);
    Logger.log(`Top 25: ${summary.top25.count} (${summary.top25.percentage}%)`);

    Logger.log(`\nTempo de execução: ${duration}ms`);
    Logger.log(`\n${result.summary()}`);
    Logger.log('=== Diagnóstico concluído ===');

  } catch (error) {
    Logger.log(`ERRO: ${error.message}`);
    Logger.log(error.stack);
  }
}

/**
 * Função temporária de validação do diagnóstico do ranking com histórico real.
 * Execute manualmente no Google Apps Script para ver resultados no Logger.
 */
function validateRankingDiagnosisWithRealHistory() {
  const startTime = new Date().getTime();

  try {
    Logger.log('=== Iniciando diagnóstico do ranking ===');

    const historyRepository = new HistoryRepository();
    const contests = historyRepository.getAll();

    Logger.log(`Histórico total: ${contests.length} concursos`);

    if (contests.length < 2945) {
      Logger.log('ERRO: Histórico insuficiente para testar concursos 2945-3044');
      return;
    }

    Logger.log('Executando diagnóstico...');
    const diagnosis = new RankingDiagnosis(
      new StatisticsEngine(),
      new CriteriaRegistry(),
      new CriteriaEngine(),
      new ScoreEngine(),
      new RankingEngine()
    );

    const result = diagnosis.run(contests, 2945, 3044);

    const endTime = new Date().getTime();
    const duration = endTime - startTime;

    Logger.log(`\n=== Resultados do Diagnóstico de Ranking ===`);
    Logger.log(`Janela testada: concursos 2945-3044`);
    Logger.log(`Concursos analisados: ${result.getTotalContests()}`);

    const avg = result.getAveragePosition();
    const median = result.getMedianPosition();
    const best = result.getBestPosition();
    const worst = result.getWorstPosition();
    const dist = result.getDistributionByRange();
    const total = result.getTotalDrawnNumbers();

    Logger.log(`\nPosições das dezenas sorteadas:`);
    Logger.log(`Posição média: ${avg ? avg.toFixed(2) : 'N/A'}`);
    Logger.log(`Posição mediana: ${median ? median.toFixed(2) : 'N/A'}`);
    Logger.log(`Melhor posição: ${best}`);
    Logger.log(`Pior posição: ${worst}`);

    Logger.log(`\nDistribuição por faixa (${total} dezenas):`);
    Logger.log(`Top 7: ${dist.top7}`);
    Logger.log(`8-10: ${dist.range8_10}`);
    Logger.log(`11-15: ${dist.range11_15}`);
    Logger.log(`16-20: ${dist.range16_20}`);
    Logger.log(`21-25: ${dist.range21_25}`);
    Logger.log(`Fora do Top 25: ${dist.outOfTop25}`);

    Logger.log(`\nTempo de execução: ${duration}ms`);
    Logger.log(`\n${result.summary()}`);
    Logger.log('=== Diagnóstico concluído ===');

  } catch (error) {
    Logger.log(`ERRO: ${error.message}`);
    Logger.log(error.stack);
  }
}

/**
 * Função temporária de validação do RandomBaselineBacktest com histórico real.
 * Execute manualmente no Google Apps Script para ver resultados no Logger.
 */
function validateRandomBaselineWithRealHistory() {
  const startTime = new Date().getTime();

  try {
    Logger.log('=== Iniciando RandomBaselineBacktest ===');

    const historyRepository = new HistoryRepository();
    const contests = historyRepository.getAll();

    Logger.log(`Histórico total: ${contests.length} concursos`);

    if (contests.length < 2945) {
      Logger.log('ERRO: Histórico insuficiente para testar concursos 2945-3044');
      return;
    }

    Logger.log('Executando RandomBaselineBacktest com 100 simulações por concurso...');
    const backtest = new RandomBaselineBacktest(100);
    const summary = backtest.run(contests, 2945, 3044);

    const endTime = new Date().getTime();
    const duration = endTime - startTime;

    Logger.log(`\n=== Resultados do RandomBaselineBacktest ===`);
    Logger.log(`Janela testada: concursos 2945-3044`);
    Logger.log(`Total de simulações: ${summary.getTotalSimulations()}`);
    Logger.log(`Concursos: ${summary.getTotalContests()}`);

    const dist = summary.getHitsDistribution();
    Logger.log(`\nDistribuição de acertos:`);
    Logger.log(`  0 acertos: ${dist[0]}`);
    Logger.log(`  1 acerto:  ${dist[1]}`);
    Logger.log(`  2 acertos: ${dist[2]}`);
    Logger.log(`  3 acertos: ${dist[3]}`);
    Logger.log(`  4 acertos: ${dist[4]}`);
    Logger.log(`  5 acertos: ${dist[5]}`);
    Logger.log(`  6 acertos: ${dist[6]}`);

    const average = summary.getAverageHits();
    const max = summary.getMaxHits();

    Logger.log(`\nMédia de acertos: ${average.toFixed(2)}`);
    Logger.log(`Máximo de acertos: ${max}`);
    Logger.log(`>=3 acertos: ${summary.getPercentageWithMinHits(3)}%`);
    Logger.log(`>=4 acertos: ${summary.getPercentageWithMinHits(4)}%`);
    Logger.log(`>=5 acertos: ${summary.getPercentageWithMinHits(5)}%`);
    Logger.log(`6 acertos: ${summary.getPercentageWithMinHits(6)}%`);
    Logger.log(`Tempo de execução: ${duration}ms`);

    Logger.log(`\n${summary.summary()}`);
    Logger.log('=== RandomBaselineBacktest concluído ===');

  } catch (error) {
    Logger.log(`ERRO: ${error.message}`);
    Logger.log(error.stack);
  }
}

/**
 * Função temporária de validação do Baseline Top 7 para a janela 2845-2944.
 * Execute manualmente no Google Apps Script para comparação com 2945-3044.
 */
function validateBaselineTopDiagnosis2845_2944() {
  const startTime = new Date().getTime();

  try {
    Logger.log('=== Iniciando diagnóstico do Baseline Top 7 (2845-2944) ===');

    const historyRepository = new HistoryRepository();
    const contests = historyRepository.getAll();

    Logger.log(`Histórico total: ${contests.length} concursos`);

    if (contests.length < 2845) {
      Logger.log('ERRO: Histórico insuficiente para testar concursos 2845-2944');
      return;
    }

    Logger.log('Executando diagnóstico...');
    const diagnosis = new BaselineTopDiagnosis(
      new StatisticsEngine(),
      new CriteriaRegistry(),
      new CriteriaEngine(),
      new ScoreEngine(),
      new RankingEngine()
    );

    const result = diagnosis.run(contests, 2845, 2944);

    const endTime = new Date().getTime();
    const duration = endTime - startTime;

    Logger.log(`\n=== Resultados do Diagnóstico (2845-2944) ===`);
    Logger.log(`Janela testada: concursos 2845-2944`);
    Logger.log(`Concursos analisados: ${result.getTotalContests()}`);

    const summary = result.getSummary();
    Logger.log(`\nDistribuição de dezenas sorteadas no ranking:`);
    Logger.log(`Total de dezenas: ${summary.total}`);
    Logger.log(`Top 7: ${summary.top7.count} (${summary.top7.percentage}%)`);
    Logger.log(`Top 10: ${summary.top10.count} (${summary.top10.percentage}%)`);
    Logger.log(`Top 15: ${summary.top15.count} (${summary.top15.percentage}%)`);
    Logger.log(`Top 20: ${summary.top20.count} (${summary.top20.percentage}%)`);
    Logger.log(`Top 25: ${summary.top25.count} (${summary.top25.percentage}%)`);

    Logger.log(`\nTempo de execução: ${duration}ms`);
    Logger.log(`\n${result.summary()}`);
    Logger.log('=== Diagnóstico concluído ===');

  } catch (error) {
    Logger.log(`ERRO: ${error.message}`);
    Logger.log(error.stack);
  }
}

/**
 * Função temporária de validação do RandomBaselineBacktest para a janela 2845-2944.
 * Execute manualmente no Google Apps Script para comparação com 2945-3044.
 */
function validateRandomBaseline2845_2944() {
  const startTime = new Date().getTime();

  try {
    Logger.log('=== Iniciando RandomBaselineBacktest (2845-2944) ===');

    const historyRepository = new HistoryRepository();
    const contests = historyRepository.getAll();

    Logger.log(`Histórico total: ${contests.length} concursos`);

    if (contests.length < 2845) {
      Logger.log('ERRO: Histórico insuficiente para testar concursos 2845-2944');
      return;
    }

    Logger.log('Executando RandomBaselineBacktest com 100 simulações por concurso...');
    const backtest = new RandomBaselineBacktest(100);
    const summary = backtest.run(contests, 2845, 2944);

    const endTime = new Date().getTime();
    const duration = endTime - startTime;

    Logger.log(`\n=== Resultados do RandomBaselineBacktest (2845-2944) ===`);
    Logger.log(`Janela testada: concursos 2845-2944`);
    Logger.log(`Total de simulações: ${summary.getTotalSimulations()}`);
    Logger.log(`Concursos: ${summary.getTotalContests()}`);

    const dist = summary.getHitsDistribution();
    Logger.log(`\nDistribuição de acertos:`);
    Logger.log(`  0 acertos: ${dist[0]}`);
    Logger.log(`  1 acerto:  ${dist[1]}`);
    Logger.log(`  2 acertos: ${dist[2]}`);
    Logger.log(`  3 acertos: ${dist[3]}`);
    Logger.log(`  4 acertos: ${dist[4]}`);
    Logger.log(`  5 acertos: ${dist[5]}`);
    Logger.log(`  6 acertos: ${dist[6]}`);

    const average = summary.getAverageHits();
    const max = summary.getMaxHits();

    Logger.log(`\nMédia de acertos: ${average.toFixed(2)}`);
    Logger.log(`Máximo de acertos: ${max}`);
    Logger.log(`>=3 acertos: ${summary.getPercentageWithMinHits(3)}%`);
    Logger.log(`>=4 acertos: ${summary.getPercentageWithMinHits(4)}%`);
    Logger.log(`>=5 acertos: ${summary.getPercentageWithMinHits(5)}%`);
    Logger.log(`6 acertos: ${summary.getPercentageWithMinHits(6)}%`);
    Logger.log(`Tempo de execução: ${duration}ms`);

    Logger.log(`\n${summary.summary()}`);
    Logger.log('=== RandomBaselineBacktest concluído ===');

  } catch (error) {
    Logger.log(`ERRO: ${error.message}`);
    Logger.log(error.stack);
  }
}

/**
 * Função temporária de validação do BaselineBacktest para a janela 2845-2944.
 * Execute manualmente no Google Apps Script para comparação com 2945-3044.
 */
function validateBaselineBacktest2845_2944() {
  const startTime = new Date().getTime();

  try {
    Logger.log('=== Iniciando validação do BaselineBacktest (2845-2944) ===');

    const historyRepository = new HistoryRepository();
    const contests = historyRepository.getAll();

    Logger.log(`Histórico total: ${contests.length} concursos`);

    if (contests.length < 2845) {
      Logger.log('ERRO: Histórico insuficiente para testar concursos 2845-2944');
      return;
    }

    Logger.log('Executando BaselineBacktest...');
    const engine = new BaselineBacktest(
      new StatisticsEngine(),
      new CriteriaRegistry(),
      new CriteriaEngine(),
      new ScoreEngine(),
      new RankingEngine()
    );

    const summary = engine.run(contests, 2845, 2944);

    const endTime = new Date().getTime();
    const duration = endTime - startTime;

    Logger.log(`\n=== Resultados do BaselineBacktest (2845-2944) ===`);
    Logger.log(`Janela testada: concursos 2845-2944`);
    Logger.log(`Concursos testados: ${summary.getTotalContests()}`);

    const dist = summary.getHitsDistribution();
    Logger.log(`\nDistribuição de acertos:`);
    Logger.log(`  0 acertos: ${dist[0]}`);
    Logger.log(`  1 acerto:  ${dist[1]}`);
    Logger.log(`  2 acertos: ${dist[2]}`);
    Logger.log(`  3 acertos: ${dist[3]}`);
    Logger.log(`  4 acertos: ${dist[4]}`);
    Logger.log(`  5 acertos: ${dist[5]}`);
    Logger.log(`  6 acertos: ${dist[6]}`);

    const average = summary.getAverageHits();
    const max = summary.getMaxHits();
    const count3plus = summary.getCountWithMinHits(3);
    const percent3plus = summary.getPercentageWithMinHits(3);
    const count4plus = summary.getCountWithMinHits(4);
    const percent4plus = summary.getPercentageWithMinHits(4);
    const count5plus = summary.getCountWithMinHits(5);
    const percent5plus = summary.getPercentageWithMinHits(5);
    const count6 = dist[6];
    const percent6 = summary.getPercentageWithMinHits(6);

    Logger.log(`\nMédia de acertos: ${average.toFixed(2)}`);
    Logger.log(`Máximo de acertos: ${max}`);
    Logger.log(`>=3 acertos: ${count3plus} (${percent3plus}%)`);
    Logger.log(`>=4 acertos: ${count4plus} (${percent4plus}%)`);
    Logger.log(`>=5 acertos: ${count5plus} (${percent5plus}%)`);
    Logger.log(`6 acertos: ${count6} (${percent6}%)`);
    Logger.log(`Tempo de execução: ${duration}ms`);

    Logger.log(`\n${summary.summary()}`);
    Logger.log('=== Validação concluída ===');

  } catch (error) {
    Logger.log(`ERRO: ${error.message}`);
    Logger.log(error.stack);
  }
}

/**
 * Função temporária de validação do NewScoreStrategyBacktest com histórico real.
 * Execute manualmente no Google Apps Script para comparar estratégias.
 * Testa as janelas 2845-2944 e 2945-3044.
 */
function validateNewScoreStrategyBacktest() {
  const startTimeGlobal = new Date().getTime();

  try {
    Logger.log('=== Iniciando NewScoreStrategyBacktest ===');

    const historyRepository = new HistoryRepository();
    const contests = historyRepository.getAll();

    Logger.log(`Histórico total: ${contests.length} concursos`);

    if (contests.length < 2945) {
      Logger.log('ERRO: Histórico insuficiente para testar ambas as janelas');
      return;
    }

    const engine = new NewScoreStrategyBacktest(
      new StatisticsEngine(),
      new CriteriaRegistry(),
      new CriteriaEngine(),
      new ScoreEngine(),
      new RankingEngine()
    );

    // Testar janela 2845-2944
    Logger.log('\n--- Janela 2845-2944 ---');
    const startTime1 = new Date().getTime();
    const result1 = engine.run(contests, 2845, 2944);
    const duration1 = new Date().getTime() - startTime1;

    Logger.log(`Concursos testados: ${result1.getTotalContests()}`);
    const dist1 = result1.getHitsDistribution();
    Logger.log(`Distribuição: 0=${dist1[0]}, 1=${dist1[1]}, 2=${dist1[2]}, 3=${dist1[3]}, 4=${dist1[4]}, 5=${dist1[5]}, 6=${dist1[6]}`);
    Logger.log(`Média: ${result1.getAverageHits().toFixed(2)}`);
    Logger.log(`Máximo: ${result1.getMaxHits()}`);
    Logger.log(`>=3: ${result1.getPercentageWithMinHits(3)}%`);
    Logger.log(`>=4: ${result1.getPercentageWithMinHits(4)}%`);
    Logger.log(`>=5: ${result1.getPercentageWithMinHits(5)}%`);
    Logger.log(`6: ${result1.getPercentageWithMinHits(6)}%`);
    Logger.log(`Tempo: ${duration1}ms`);

    // Testar janela 2945-3044
    Logger.log('\n--- Janela 2945-3044 ---');
    const startTime2 = new Date().getTime();
    const result2 = engine.run(contests, 2945, 3044);
    const duration2 = new Date().getTime() - startTime2;

    Logger.log(`Concursos testados: ${result2.getTotalContests()}`);
    const dist2 = result2.getHitsDistribution();
    Logger.log(`Distribuição: 0=${dist2[0]}, 1=${dist2[1]}, 2=${dist2[2]}, 3=${dist2[3]}, 4=${dist2[4]}, 5=${dist2[5]}, 6=${dist2[6]}`);
    Logger.log(`Média: ${result2.getAverageHits().toFixed(2)}`);
    Logger.log(`Máximo: ${result2.getMaxHits()}`);
    Logger.log(`>=3: ${result2.getPercentageWithMinHits(3)}%`);
    Logger.log(`>=4: ${result2.getPercentageWithMinHits(4)}%`);
    Logger.log(`>=5: ${result2.getPercentageWithMinHits(5)}%`);
    Logger.log(`6: ${result2.getPercentageWithMinHits(6)}%`);
    Logger.log(`Tempo: ${duration2}ms`);

    const durationGlobal = new Date().getTime() - startTimeGlobal;
    Logger.log(`\nTempo total: ${durationGlobal}ms`);
    Logger.log('\n--- Resumo ---');
    Logger.log(result1.summary());
    Logger.log(result2.summary());
    Logger.log('=== NewScoreStrategyBacktest concluído ===');

  } catch (error) {
    Logger.log(`ERRO: ${error.message}`);
    Logger.log(error.stack);
  }
}

/**
 * Função temporária para executar ablation study com histórico real.
 * Compara 4 configurações da NewScoreStrategy nas janelas 2845-2944 e 2945-3044.
 * Execute manualmente no Google Apps Script.
 */
function validateAblationStudy() {
  const startTimeGlobal = new Date().getTime();

  try {
    Logger.log('=== Iniciando Ablation Study ===');

    const historyRepository = new HistoryRepository();
    const contests = historyRepository.getAll();

    Logger.log(`Histórico total: ${contests.length} concursos`);

    if (contests.length < 2945) {
      Logger.log('ERRO: Histórico insuficiente para ambas janelas');
      return;
    }

    const ablation = new AblationBacktest(
      new StatisticsEngine(),
      new CriteriaRegistry(),
      new CriteriaEngine(),
      new ScoreEngine(),
      new RankingEngine()
    );

    const windows = [
      { name: '2845-2944', first: 2845, last: 2944 },
      { name: '2945-3044', first: 2945, last: 3044 }
    ];

    Logger.log('Executando ablation study...');
    const result = ablation.run(contests, windows);

    const durationGlobal = new Date().getTime() - startTimeGlobal;

    Logger.log(`\n${result.summary()}`);
    Logger.log(`\n${result.printDetailed()}`);
    Logger.log(`\nTempo total: ${durationGlobal}ms`);
    Logger.log('=== Ablation Study Concluído ===');

  } catch (error) {
    Logger.log(`ERRO: ${error.message}`);
    Logger.log(error.stack);
  }
}
