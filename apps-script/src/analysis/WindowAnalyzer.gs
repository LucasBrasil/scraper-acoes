/** Conta ocorrências em janelas históricas configuráveis. */
class WindowAnalyzer {
  constructor(windows) {
    this.windows = windows || FrequencyWindow.defaults();
  }

  analyze(contests) {
    const occurrences = this._createNumberMap();
    this.windows.forEach((window) => {
      contests.slice(0, window.size).forEach((contest) => {
        contest.drawnNumbers.forEach((number) => {
          occurrences[number][window.size] += 1;
        });
      });
    });
    return occurrences;
  }

  _createNumberMap() {
    return Array.from({ length: 61 }, (_, number) => {
      if (number === 0) {
        return null;
      }
      return this.windows.reduce((values, window) => {
        values[window.size] = 0;
        return values;
      }, {});
    });
  }
}
