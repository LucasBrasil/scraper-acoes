/** Calcula quantos concursos se passaram desde a última ocorrência de cada dezena. */
class DelayAnalyzer {
  analyze(contests) {
    const delays = this._createNumberMap(null);
    contests.forEach((contest, contestIndex) => {
      contest.drawnNumbers.forEach((number) => {
        if (delays[number] === null) {
          delays[number] = contestIndex;
        }
      });
    });
    return delays.map((delay, number) => (number === 0 ? null : delay === null ? contests.length : delay));
  }

  _createNumberMap(initialValue) {
    return Array.from({ length: 61 }, (_, number) => (number === 0 ? null : initialValue));
  }
}
