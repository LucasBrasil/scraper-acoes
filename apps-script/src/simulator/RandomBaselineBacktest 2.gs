/** RandomBaselineBacktest: seleções aleatórias de 7 dezenas para comparação estatística. */
class RandomBaselineBacktest {
  constructor(simulationsPerContest) {
    if (!Number.isInteger(simulationsPerContest) || simulationsPerContest < 1) {
      throw new Error('simulationsPerContest deve ser um inteiro positivo.');
    }
    this.simulationsPerContest = simulationsPerContest;
  }

  /**
   * Executa o backtest aleatório na janela especificada.
   *
   * @param {Contest[]} allContests - histórico completo (não alterado)
   * @param {number} firstToTest - primeiro concurso a testar
   * @param {number} lastToTest - último concurso a testar
   * @returns {RandomBaselineResult}
   */
  run(allContests, firstToTest, lastToTest) {
    if (!Array.isArray(allContests) || allContests.length === 0) {
      throw new Error('histórico vazio');
    }
    if (firstToTest < 1 || lastToTest < firstToTest) {
      throw new Error('janela de teste inválida');
    }

    const allResults = [];
    const contestMap = new Map(allContests.map(c => [c.number, c]));
    const sortedNumbers = Array.from(contestMap.keys()).sort((a, b) => a - b);

    for (let testNumber = firstToTest; testNumber <= lastToTest; testNumber++) {
      const contestToTest = contestMap.get(testNumber);
      if (!contestToTest) {
        continue;
      }

      for (let sim = 0; sim < this.simulationsPerContest; sim++) {
        const randomSelection = this._generateRandomSelection();
        const hits = this._countHits(randomSelection, contestToTest.drawnNumbers);

        allResults.push({
          contestNumber: testNumber,
          simulationNumber: sim + 1,
          selectedNumbers: randomSelection,
          drawnNumbers: contestToTest.drawnNumbers.slice(),
          hits: hits
        });
      }
    }

    return new RandomBaselineResult(allResults);
  }

  _generateRandomSelection() {
    const selection = [];
    const available = new Set();
    for (let i = 1; i <= 60; i++) {
      available.add(i);
    }

    while (selection.length < 7) {
      const array = Array.from(available);
      const index = Math.floor(Math.random() * array.length);
      const number = array[index];
      selection.push(number);
      available.delete(number);
    }

    return selection.sort((a, b) => a - b);
  }

  _countHits(selectedNumbers, drawnNumbers) {
    const selectedSet = new Set(selectedNumbers);
    let hits = 0;
    drawnNumbers.forEach(number => {
      if (selectedSet.has(number)) {
        hits++;
      }
    });
    return hits;
  }
}
