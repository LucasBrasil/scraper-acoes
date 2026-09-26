/** Política de desempate para a estratégia de score. */
class NewScoreTiebreakerPolicy {
  /**
   * Compara dois numbers de dezenas para desempate.
   * Retorna -1 se a vence, 1 se b vence, 0 se empate persiste.
   *
   * Ordem de prioridade:
   * 1. Maior score (a.score > b.score => -1)
   * 2. Melhor posição no ranking (a.position < b.position => -1)
   * 3. Menor número da dezena (a.number < b.number => -1)
   *
   * @param {object} a - { number, score, position }
   * @param {object} b - { number, score, position }
   * @returns {number} -1, 0 ou 1
   */
  compare(a, b) {
    if (!a || !b) {
      throw new Error('argumentos de comparação não podem ser nulos');
    }

    if (typeof a.score !== 'number' || typeof b.score !== 'number') {
      throw new Error('score deve ser um número');
    }
    if (typeof a.position !== 'number' || typeof b.position !== 'number') {
      throw new Error('position deve ser um número');
    }
    if (typeof a.number !== 'number' || typeof b.number !== 'number') {
      throw new Error('number deve ser um número');
    }

    // Prioridade 1: maior score primeiro
    if (a.score > b.score) {
      return -1;
    }
    if (a.score < b.score) {
      return 1;
    }

    // Prioridade 2: melhor posição no ranking (menor número)
    if (a.position < b.position) {
      return -1;
    }
    if (a.position > b.position) {
      return 1;
    }

    // Prioridade 3: menor número da dezena
    if (a.number < b.number) {
      return -1;
    }
    if (a.number > b.number) {
      return 1;
    }

    return 0;
  }

  summary() {
    return 'NewScoreTiebreakerPolicy: score > posição no ranking > número';
  }
}
