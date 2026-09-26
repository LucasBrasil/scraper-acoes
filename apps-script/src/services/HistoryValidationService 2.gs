/** Valida a integridade do histórico de concursos. */
class HistoryValidationService {
  constructor(historyRepository, historyIntegrity) {
    this.historyRepository = historyRepository;
    this.historyIntegrity = historyIntegrity || HistoryIntegrity;
  }

  validate() {
    const contests = this.historyRepository.getAll();
    const report = this.historyIntegrity.validate(contests);
    return report;
  }

  formatReport(report) {
    const status = report.hasProblems ? 'COM PROBLEMAS' : 'ÍNTEGRO';
    const duplicateDetails = report.duplicates.length > 0
      ? `\nDuplicados: ${report.duplicates.map(d => `#${d.number} (${d.count}x)`).join(', ')}`
      : '';
    const gapDetails = report.gaps.length > 0
      ? `\nLacunas: ${report.gaps.map(g => `${g.from}-${g.to} (${g.missing.length} ausentes)`).join('; ')}`
      : '';
    const outOfOrderDetail = report.outOfOrder ? '\nFora de ordem: sim' : '';

    return `Validação do Histórico

Total de concursos: ${report.total}
Primeiro concurso: ${report.lastNumber || '—'}
Último concurso: ${report.firstNumber || '—'}
Duplicados: ${report.duplicates.length}${duplicateDetails}
Lacunas: ${report.gaps.length}${gapDetails}${outOfOrderDetail}

Status: ${status}`;
  }
}
