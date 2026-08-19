/**
 * Relatório imutável da validação de integridade de uma coleção de concursos.
 *
 * Nunca lança. Fornece um quadro completo dos problemas encontrados, permitindo
 * que o chamador decida como reagir: abortar, alertar, reportar ou simplesmente
 * informar ao usuário sem bloquear o pipeline.
 */
class HistoryIntegrityReport {
  constructor(total, firstNumber, lastNumber, duplicates, gaps, outOfOrder) {
    this.total = total;
    this.firstNumber = firstNumber;
    this.lastNumber = lastNumber;
    this.duplicates = duplicates || [];
    this.gaps = gaps || [];
    this.outOfOrder = outOfOrder;
  }

  /**
   * Verdadeiro quando não há duplicados nem lacunas.
   * Fora de ordem é tratado separadamente, pois pode ser resolvido por ordenação.
   */
  get isValid() {
    return this.duplicates.length === 0 && this.gaps.length === 0;
  }

  /** Verdadeiro quando existem problemas relatados. */
  get hasProblems() {
    return !this.isValid || this.outOfOrder;
  }

  /**
   * Resumo em texto para logging e exibição.
   * Formato: "N concursos (X-Y), X duplicados, X lacunas, [fora de ordem]"
   */
  summary() {
    const parts = [];

    parts.push(`${this.total} concurso${this.total === 1 ? '' : 's'}`);

    if (this.firstNumber !== null && this.lastNumber !== null) {
      parts.push(`(${this.firstNumber}–${this.lastNumber})`);
    }

    if (this.duplicates.length > 0) {
      const duplicateCount = this.duplicates.reduce((sum, d) => sum + d.count, 0);
      parts.push(`${duplicateCount} duplicado${duplicateCount === 1 ? '' : 's'}`);
    }

    if (this.gaps.length > 0) {
      const gapCount = this.gaps.reduce((sum, g) => sum + g.missing.length, 0);
      parts.push(`${gapCount} ausente${gapCount === 1 ? '' : 's'}`);
    }

    if (this.outOfOrder) {
      parts.push('fora de ordem');
    }

    return parts.join('; ');
  }
}
