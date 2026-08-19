/** Value object que define a ordem de execução de um critério. */
class CriterionPriority {
  constructor(value) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error('A prioridade do critério deve ser um inteiro não negativo.');
    }
    this.value = value;
  }
}
