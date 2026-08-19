/** Seleciona as N dezenas melhor posicionadas no ranking recebido. */
class TopSelectionStrategy extends ISelectionStrategy {
  getName() {
    return 'Top Selection';
  }

  select(rankingResults, candidateCount) {
    if (!Number.isInteger(candidateCount) || candidateCount <= 0) {
      throw new Error('A quantidade de dezenas candidatas deve ser um inteiro positivo.');
    }
    const orderedResults = rankingResults.slice().sort((first, second) => first.ranking - second.ranking);
    return new SelectionResult(
      orderedResults.slice(0, candidateCount).map((result) => result.number),
      orderedResults.slice(candidateCount).map((result) => result.number),
      new Date(),
      this.getName()
    );
  }
}
