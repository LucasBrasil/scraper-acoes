/** Agrupa as avaliações de critérios de uma mesma dezena. */
class NumberAnalysis {
  constructor(number, frequency, criterionResults, score) {
    this.number = number;
    this.frequency = frequency;
    this.criterionResults = criterionResults || [];
    this.score = score === undefined ? null : score;
  }

  static fromCriterionResults(criterionResults) {
    return criterionResults.reduce((analysesByNumber, result) => {
      if (!analysesByNumber[result.statisticNumber]) {
        analysesByNumber[result.statisticNumber] = new NumberAnalysis(result.statisticNumber, null, []);
      }
      analysesByNumber[result.statisticNumber].criterionResults.push(result);
      return analysesByNumber;
    }, {});
  }

  static fromStatisticsAndCriterionResults(statistics, criterionResults) {
    const analysesByNumber = statistics.reduce((analyses, statistic) => {
      analyses[statistic.number] = new NumberAnalysis(statistic.number, statistic.frequency, []);
      return analyses;
    }, {});
    criterionResults.forEach((result) => {
      if (!analysesByNumber[result.statisticNumber]) {
        throw new Error(
          `Critério retornou uma dezena inexistente nas estatísticas: ${result.statisticNumber}`
        );
      }
      analysesByNumber[result.statisticNumber].criterionResults.push(result);
    });
    return Object.values(analysesByNumber);
  }
}
