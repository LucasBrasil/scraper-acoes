/** Estratégia de distribuição MAX_DEZENAS: maximizar jogos de 7 dezenas, usar saldo em 6 dezenas. */
class MaxDezenasDistributionStrategy extends ISyndicateDistributionStrategy {
  /**
   * Calcula a distribuição maximizando jogos de 7 dezenas.
   * Regra: Jogo de 7 dezenas custa R$42, jogo de 6 dezenas custa R$6.
   * - Maximizar quantidade de jogos de 7 dezenas dentro do orçamento.
   * - Usar integralmente o saldo em jogos de 6 dezenas.
   * - Orçamento deve ser integralmente utilizado.
   *
   * @param {number} budget - orçamento total em reais
   * @returns {SyndicateDistributionResult}
   */
  calculate(budget) {
    if (typeof budget !== 'number' || budget <= 0) {
      throw new Error('Orçamento deve ser um número positivo.');
    }

    const PRICE_7_DEZENAS = 42;
    const PRICE_6_DEZENAS = 6;

    const games7 = Math.floor(budget / PRICE_7_DEZENAS);
    const remainingBudget = budget - (games7 * PRICE_7_DEZENAS);

    if (remainingBudget % PRICE_6_DEZENAS !== 0) {
      throw new Error(`Orçamento de R$${budget} não pode ser integralmente utilizado com as regras de preço (7d=R$42, 6d=R$6).`);
    }

    const games6 = remainingBudget / PRICE_6_DEZENAS;

    if (games7 === 0 && games6 === 0) {
      throw new Error(`Orçamento de R$${budget} insuficiente para ao menos 1 jogo.`);
    }

    return new SyndicateDistributionResult(games7, games6);
  }
}
