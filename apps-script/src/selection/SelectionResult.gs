/** Resultado da seleção, sem gerar jogos. */
class SelectionResult {
  constructor(selectedNumbers, discardedNumbers, generatedAt, strategyName) {
    this.selectedNumbers = selectedNumbers;
    this.discardedNumbers = discardedNumbers;
    this.generatedAt = generatedAt;
    this.strategyName = strategyName;
  }
}
