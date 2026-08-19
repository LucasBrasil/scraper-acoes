/** Coordena o cálculo de score e atribui ranking sem acessar estatísticas diretamente. */
class ScoreEngine {
  constructor(scoreCalculator) {
    this.scoreCalculator = scoreCalculator || new WeightedScoreCalculator();
  }

  calculate(numberAnalyses) {
    if (!Array.isArray(numberAnalyses) || !numberAnalyses.every((analysis) => analysis instanceof NumberAnalysis)) {
      throw new Error('ScoreEngine espera uma lista de objetos NumberAnalysis.');
    }
    return numberAnalyses
      .map((analysis) => ({ analysis, result: this.scoreCalculator.calculate(analysis) }))
      .sort((first, second) => second.result.score - first.result.score || second.analysis.frequency - first.analysis.frequency || first.result.number - second.result.number)
      .map((item, index) => new ScoreResult(item.result.number, item.result.score, index + 1, item.result.breakdown, item.analysis.frequency));
  }
}
