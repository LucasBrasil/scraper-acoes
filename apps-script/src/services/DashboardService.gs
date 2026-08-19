/** Monta a visão MVP do Dashboard a partir de repositórios já existentes. */
class DashboardService {
  constructor(historyRepository, statisticsRepository, criteriaRepository, dashboardRepository) {
    this.historyRepository = historyRepository;
    this.statisticsRepository = statisticsRepository;
    this.criteriaRepository = criteriaRepository;
    this.dashboardRepository = dashboardRepository;
  }

  updateDashboard(context) {
    const contests = this.historyRepository.getAll();
    const rankings = this.statisticsRepository.getRankingResults().sort((first, second) => first.ranking - second.ranking);
    const configurations = this.criteriaRepository.getAll();
    const highestScore = rankings.reduce((current, ranking) => Math.max(current, ranking.score), 0);
    const activeCriteria = Object.keys(configurations).filter((name) => configurations[name].enabled).length;
    const lastContest = contests.length > 0 ? contests[0].number : 'N/A';
    const top25 = rankings.slice(0, 25).map((ranking) => ranking.number).join(', ');
    const duration = new Date().getTime() - context.startedAt.getTime();
    this.dashboardRepository.replace([
      { label: 'Último Concurso', value: lastContest },
      { label: 'Quantidade de Concursos', value: contests.length },
      { label: 'Top 25', value: top25 },
      { label: 'Maior Score', value: highestScore },
      { label: 'Quantidade de Critérios Ativos', value: activeCriteria },
      { label: 'Tempo da Última Execução (ms)', value: duration },
      { label: 'Status', value: 'SUCESSO' }
    ]);
  }
}
