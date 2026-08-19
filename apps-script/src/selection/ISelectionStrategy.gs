/** Contrato de seleção de dezenas candidatas a partir de um ranking. */
class ISelectionStrategy {
  select(rankingResults, candidateCount) {
    throw new Error('ISelectionStrategy.select deve ser implementado.');
  }

  getName() {
    throw new Error('ISelectionStrategy.getName deve ser implementado.');
  }
}
