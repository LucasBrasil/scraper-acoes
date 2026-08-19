/** DTO sem regra de negócio, pronto para persistência na planilha. */
class StatisticDTO {
  constructor(statistic) {
    this.number = statistic.number;
    this.frequency = statistic.frequency;
    this.ranking = statistic.rankings.frequency;
    this.delay = statistic.delay;
    this.windows = statistic.windows;
    this.trend = statistic.trend;
    this.score = statistic.score;
    this.scoreRanking = 0;
    this.generalRanking = 0;
    this.selected = false;
  }

  toRow() {
    return [this.number, this.frequency, this.ranking, this.delay, this.windows[20], this.windows[50], this.windows[100], this.score, this.scoreRanking, this.generalRanking, this.selected];
  }
}
