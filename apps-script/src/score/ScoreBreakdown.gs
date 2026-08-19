/** Item rastreável que explica uma contribuição para a pontuação. */
class ScoreBreakdown {
  constructor(criterionId, criterionName, points, reason) {
    this.criterionId = criterionId;
    this.criterionName = criterionName;
    this.points = points;
    this.reason = reason;
  }
}
