/** Monta e executa o pipeline operacional, sem conter regras das engines. */
class PipelineService {
  constructor(statisticsService, criteriaService, scoreService, rankingService, selectionService, dashboardService, configRepository, pipelineLogger) {
    this.statisticsService = statisticsService;
    this.criteriaService = criteriaService;
    this.scoreService = scoreService;
    this.rankingService = rankingService;
    this.selectionService = selectionService;
    this.dashboardService = dashboardService;
    this.configRepository = configRepository;
    this.pipelineLogger = pipelineLogger;
  }

  execute() {
    const context = new PipelineContext(this.configRepository.getAll(), {});
    const steps = [
      new PipelineStep('Statistics', (sharedContext) => {
        sharedContext.metadata.statistics = this.statisticsService.updateStatistics();
      }),
      new PipelineStep('Criteria', (sharedContext) => {
        sharedContext.metadata.numberAnalyses = this.criteriaService.evaluateNumberAnalyses();
      }),
      new PipelineStep('Score', (sharedContext) => {
        sharedContext.metadata.scores = this.scoreService.updateScores(sharedContext.metadata.numberAnalyses);
      }),
      new PipelineStep('Ranking', (sharedContext) => {
        sharedContext.metadata.rankings = this.rankingService.updateRanking();
      }),
      new PipelineStep('Selection', (sharedContext) => {
        sharedContext.metadata.selection = this.selectionService.updateSelection();
      }),
      new PipelineStep('Dashboard', (sharedContext) => {
        this.dashboardService.updateDashboard(sharedContext);
      })
    ];
    return new PipelineEngine(steps, this.pipelineLogger).execute(context);
  }
}
