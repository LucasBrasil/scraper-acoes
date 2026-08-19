/**
 * Validação pura da integridade de um histórico de concursos.
 *
 * Não lança. Analisa uma coleção de Contest e retorna um relatório estruturado,
 * permitindo que serviços, logs e dashboard decidam como comunicar os problemas
 * ao usuário.
 *
 * Invariantes auditadas:
 * - Unicidade: cada número de concurso aparece no máximo uma vez.
 * - Contiguidade: entre o menor e o maior número, nenhum está faltando.
 * - Ordem: a coleção é fornecida em ordem decrescente de número.
 */
class HistoryIntegrity {
  /**
   * Analisa a coleção e devolve um relatório.
   * `contests` não é modificado.
   * Nunca lança, mesmo se a entrada estiver vazia ou totalmente corrupta.
   */
  static validate(contests) {
    if (!Array.isArray(contests)) {
      return new HistoryIntegrityReport(0, null, null, [], [], false);
    }

    if (contests.length === 0) {
      return new HistoryIntegrityReport(0, null, null, [], [], false);
    }

    const duplicates = HistoryIntegrity._findDuplicates(contests);
    const { firstNumber, lastNumber } = HistoryIntegrity._findExtremes(contests);
    const gaps = HistoryIntegrity._findGaps(contests, firstNumber, lastNumber);
    const outOfOrder = HistoryIntegrity._isOutOfOrder(contests);

    return new HistoryIntegrityReport(contests.length, firstNumber, lastNumber, duplicates, gaps, outOfOrder);
  }

  /**
   * Identifica números de concurso que aparecem mais de uma vez.
   * Retorna `[{ number, count }, ...]` ordenado por número.
   */
  static _findDuplicates(contests) {
    const counts = {};

    contests.forEach((contest) => {
      const num = contest.number;
      counts[num] = (counts[num] || 0) + 1;
    });

    return Object.keys(counts)
      .filter((num) => counts[num] > 1)
      .map((num) => ({ number: Number(num), count: counts[num] }))
      .sort((a, b) => a.number - b.number);
  }

  /**
   * Encontra o primeiro (maior) e o último (menor) número da coleção.
   * Funciona mesmo que a ordem seja caótica.
   */
  static _findExtremes(contests) {
    const numbers = contests.map((c) => c.number);
    return {
      firstNumber: Math.max(...numbers),
      lastNumber: Math.min(...numbers)
    };
  }

  /**
   * Identifica lacunas: números ausentes entre o mínimo e o máximo.
   * Retorna `[{ from, to, missing: [...] }, ...]`.
   * Uma lacuna é um intervalo contíguo de números ausentes.
   */
  static _findGaps(contests, firstNumber, lastNumber) {
    const presentNumbers = new Set(contests.map((c) => c.number));
    const gaps = [];
    let currentGapStart = null;
    let currentGapNumbers = [];

    for (let num = lastNumber + 1; num < firstNumber; num += 1) {
      if (!presentNumbers.has(num)) {
        if (currentGapStart === null) {
          currentGapStart = num;
        }
        currentGapNumbers.push(num);
      } else {
        if (currentGapStart !== null) {
          gaps.push({
            from: currentGapStart,
            to: num - 1,
            missing: currentGapNumbers.slice()
          });
          currentGapStart = null;
          currentGapNumbers = [];
        }
      }
    }

    if (currentGapStart !== null) {
      gaps.push({
        from: currentGapStart,
        to: firstNumber - 1,
        missing: currentGapNumbers
      });
    }

    return gaps;
  }

  /**
   * Verifica se a coleção está em ordem decrescente de número.
   * A ordem dentro do array importa — este método não reordena.
   */
  static _isOutOfOrder(contests) {
    for (let i = 0; i < contests.length - 1; i += 1) {
      if (contests[i].number < contests[i + 1].number) {
        return true;
      }
    }
    return false;
  }
}
