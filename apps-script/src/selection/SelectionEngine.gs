/** Executa estratégias de seleção sobre resultados de ranking. */
class SelectionEngine {
  constructor(selectionStrategy) {
    this.selectionStrategy = selectionStrategy || new TopSelectionStrategy();
  }

  select(rankingResults, candidateCount) {
    if (!Array.isArray(rankingResults) || !rankingResults.every((result) => result instanceof RankingResult)) {
      throw new Error('SelectionEngine espera uma lista de objetos RankingResult.');
    }
    return this.selectionStrategy.select(rankingResults, candidateCount);
  }
}
