/** Representa o resultado de um jogo após o concurso ocorrer. */
class SyndicateLotteryGameResult {
  constructor(selectedNumbers, drawnNumbers) {
    this.selectedNumbers = selectedNumbers.slice().sort((a, b) => a - b);
    this.drawnNumbers = drawnNumbers.slice().sort((a, b) => a - b);
    this.hitNumbers = this._calculateHitNumbers();
  }

  _calculateHitNumbers() {
    const selectedSet = new Set(this.selectedNumbers);
    return this.drawnNumbers.filter((number) => selectedSet.has(number));
  }

  getHitCount() {
    return this.hitNumbers.length;
  }

  isNumberSelected(number) {
    return this.selectedNumbers.includes(number);
  }

  isNumberDrawn(number) {
    return this.drawnNumbers.includes(number);
  }

  isNumberHit(number) {
    return this.hitNumbers.includes(number);
  }
}
