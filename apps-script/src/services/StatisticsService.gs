/** Orquestra a atualização das estatísticas sem conter cálculos matemáticos. */
class StatisticsService {
  constructor(historyRepository, statisticsEngine, statisticsRepository) {
    this.historyRepository = historyRepository;
    this.statisticsEngine = statisticsEngine;
    this.statisticsRepository = statisticsRepository;
  }

  updateStatistics() {
    const contests = this.historyRepository.getAll();
    const statistics = this.statisticsEngine.calculate(contests);
    const statisticDTOs = statistics.map((statistic) => new StatisticDTO(statistic));
    this.statisticsRepository.replaceAll(statisticDTOs);
    return statisticDTOs;
  }
}
