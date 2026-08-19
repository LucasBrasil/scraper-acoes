/** Soma os pontos aprovados, preservando a origem de cada contribuição. */
class WeightedScoreCalculator extends IScoreCalculator {
  calculate(numberAnalysis) {
    if (!(numberAnalysis instanceof NumberAnalysis)) {
      throw new Error('WeightedScoreCalculator aceita somente objetos NumberAnalysis.');
    }
    const breakdown = numberAnalysis.criterionResults
      .filter((result) => result.approved)
      .map((result) => new ScoreBreakdown(
        result.criterionId,
        result.criterionName,
        result.points,
        result.reason
      ));
    const score = breakdown.reduce((total, item) => total + item.points, 0);
    return new ScoreResult(numberAnalysis.number, score, 0, breakdown, numberAnalysis.frequency);
  }
}
