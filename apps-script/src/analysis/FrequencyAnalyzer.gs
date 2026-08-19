/** Calcula a frequência total de cada dezena. */
class FrequencyAnalyzer {
  analyze(contests) {
    const frequencies = this._createNumberMap(0);
    contests.forEach((contest) => {
      contest.drawnNumbers.forEach((number) => {
        frequencies[number] += 1;
      });
    });
    return frequencies;
  }

  _createNumberMap(initialValue) {
    return Array.from({ length: 61 }, (_, number) => (number === 0 ? null : initialValue));
  }
}
