/** Contrato de estratégia de distribuição de jogos no bolão. */
class ISyndicateDistributionStrategy {
  /**
   * Calcula a distribuição de jogos e dezenas para um orçamento.
   * @param {number} budget - orçamento total em reais
   * @returns {SyndicateDistributionResult} resultado da distribuição
   */
  calculate(budget) {
    throw new Error('ISyndicateDistributionStrategy.calculate deve ser implementado.');
  }
}
