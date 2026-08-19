/** Contrato mínimo para regras plugáveis de avaliação de dezenas. */
class ICriterion {
  getName() {
    throw new Error('ICriterion.getName deve ser implementado.');
  }

  getDefinition() {
    throw new Error('ICriterion.getDefinition deve ser implementado.');
  }

  isEnabled(config) {
    throw new Error('ICriterion.isEnabled deve ser implementado.');
  }

  prepare(context) {
    throw new Error('ICriterion.prepare deve ser implementado.');
  }

  evaluate(context, statistic) {
    throw new Error('ICriterion.evaluate deve ser implementado.');
  }

  getWeight() {
    throw new Error('ICriterion.getWeight deve ser implementado.');
  }
}
