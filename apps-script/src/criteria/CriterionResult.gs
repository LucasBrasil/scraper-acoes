/** Resultado imutável da avaliação de um critério sobre uma dezena. */
class CriterionResult {
  constructor(definition, statisticNumber, approved, points, reason) {
    this.criterionId = definition.id;
    this.criterionName = definition.name;
    this.criterionVersion = definition.version;
    this.statisticNumber = statisticNumber;
    this.approved = approved;
    this.points = points;
    this.reason = reason;
  }
}
