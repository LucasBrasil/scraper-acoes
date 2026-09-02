/** Analisa frequência de pares de números no histórico. */
class PairFrequencyAnalyzer {
  constructor(historyRepository) {
    this.historyRepository = historyRepository;
  }

  /**
   * Analisa todos os concursos e retorna frequência de pares.
   * @returns {Array} Array de {num1, num2, frequency}
   */
  analyze() {
    const contests = this.historyRepository.getAll();
    const pairMap = new Map();

    Logger.log(`[PairFrequencyAnalyzer] Analyzing ${contests.length} contests`);

    contests.forEach((contest, index) => {
      if (!contest.drawnNumbers || contest.drawnNumbers.length !== 6) {
        return;
      }

      const pairs = this._generatePairs(contest.drawnNumbers);
      pairs.forEach((pair) => {
        const key = `${pair[0]}-${pair[1]}`;
        pairMap.set(key, (pairMap.get(key) || 0) + 1);
      });

      if ((index + 1) % 500 === 0) {
        Logger.log(`  Processed ${index + 1} contests...`);
      }
    });

    Logger.log(`[PairFrequencyAnalyzer] Found ${pairMap.size} unique pairs`);

    return Array.from(pairMap.entries())
      .map(([key, frequency]) => {
        const [num1, num2] = key.split('-').map(Number);
        return { num1, num2, frequency };
      })
      .sort((a, b) => b.frequency - a.frequency);
  }

  _generatePairs(numbers) {
    const pairs = [];
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        const num1 = Math.min(numbers[i], numbers[j]);
        const num2 = Math.max(numbers[i], numbers[j]);
        pairs.push([num1, num2]);
      }
    }
    return pairs;
  }
}
