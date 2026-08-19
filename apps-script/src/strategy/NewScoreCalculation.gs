/** Resultado do cálculo de score para uma dezena, com auditoria de componentes. */
class NewScoreCalculation {
  constructor(number, components) {
    if (!Number.isInteger(number) || number < 1 || number > 60) {
      throw new Error('número deve estar entre 1 e 60');
    }
    if (!Array.isArray(components)) {
      throw new Error('componentes deve ser um array');
    }

    this.number = number;
    this.components = components || [];
    this.totalScore = this.components.reduce((sum, c) => sum + c.getWeight(), 0);
  }

  getNumber() {
    return this.number;
  }

  getTotalScore() {
    return this.totalScore;
  }

  getComponents() {
    return this.components.slice();
  }

  getComponentNames() {
    return this.components.map(c => c.getName());
  }

  hasComponent(name) {
    return this.components.some(c => c.getName() === name);
  }

  getComponentWeight(name) {
    const component = this.components.find(c => c.getName() === name);
    return component ? component.getWeight() : 0;
  }

  summary() {
    const componentSummary = this.components.map(c => c.summary()).join(', ');
    return `Dezena ${this.number}: ${this.totalScore}pts (${componentSummary || 'nenhum'})`;
  }
}
