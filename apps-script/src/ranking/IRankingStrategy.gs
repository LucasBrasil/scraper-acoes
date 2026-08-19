/** Contrato de ordenação dos resultados de score. */
class IRankingStrategy {
  rank(scoreResults) {
    throw new Error('IRankingStrategy.rank deve ser implementado.');
  }
}
