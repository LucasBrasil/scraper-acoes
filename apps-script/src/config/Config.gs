/** Configurações não sensíveis da aplicação. */
const MS_CONFIG = Object.freeze({
  MENU_NAME: 'MS Analytics',
  HISTORY_SHEET_NAME: 'Histórico',
  STATISTICS_SHEET_NAME: 'Estatísticas',
  CRITERIA_SHEET_NAME: 'Critérios',
  CONFIG_SHEET_NAME: 'Config',
  LOG_SHEET_NAME: 'Log',
  DASHBOARD_SHEET_NAME: 'Dashboard',
  SYNDICATE_GAMES_SHEET_NAME: 'Jogos Bolão',
  CANDIDATE_COUNT_PARAMETER: 'Quantidade de dezenas candidatas',
  AUTO_SYNC_ENABLED_PARAMETER: 'Sincronizar Histórico Automaticamente',
  INITIAL_HISTORY_SIZE_PARAMETER: 'Quantidade Inicial do Histórico',
  SYNC_BATCH_SIZE_PARAMETER: 'Limite de Concursos por Sincronização',
  HISTORY_HEADERS: ['Concurso', 'Data', 'Dezena 1', 'Dezena 2', 'Dezena 3', 'Dezena 4', 'Dezena 5', 'Dezena 6'],
  STATISTICS_HEADERS: ['Dezena', 'Frequência', 'Ranking', 'Atraso', 'Últimos20', 'Últimos50', 'Últimos100', 'Score', 'Ranking Score', 'Ranking Geral', 'Selecionada'],
  CRITERIA_HEADERS: ['Critério', 'Ativo', 'Peso'],
  CONFIG_HEADERS: ['Parâmetro', 'Valor'],
  LOG_HEADERS: ['Execution Id', 'Step', 'Start', 'Finish', 'Duration (ms)', 'Result', 'Message'],
  SELECTED_COLOR: '#FFFF00',
  HIT_COLOR: '#CCCCCC'
});
