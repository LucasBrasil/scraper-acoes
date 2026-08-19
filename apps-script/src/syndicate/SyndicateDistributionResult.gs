/** Resultado imutável de uma distribuição de bolão. */
class SyndicateDistributionResult {
  constructor(games7, games6) {
    if (!Number.isInteger(games7) || games7 < 0) {
      throw new Error('Quantidade de jogos de 7 dezenas deve ser um inteiro não-negativo.');
    }
    if (!Number.isInteger(games6) || games6 < 0) {
      throw new Error('Quantidade de jogos de 6 dezenas deve ser um inteiro não-negativo.');
    }
    if (games7 === 0 && games6 === 0) {
      throw new Error('Deve haver pelo menos 1 jogo (7 ou 6 dezenas).');
    }

    this.games7 = games7;
    this.games6 = games6;
  }

  getTotalGames() {
    return this.games7 + this.games6;
  }

  getTotalDezenas() {
    return this.games7 * 7 + this.games6 * 6;
  }

  getTotalValue(pricePerDezena6) {
    return this.games7 * 42 + this.games6 * (6 * pricePerDezena6);
  }

  summary() {
    const parts = [];
    if (this.games7 > 0) {
      parts.push(`${this.games7}x7`);
    }
    if (this.games6 > 0) {
      parts.push(`${this.games6}x6`);
    }
    return `${parts.join(' + ')} = ${this.getTotalDezenas()} dezenas`;
  }
}
