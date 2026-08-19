/**
 * Plano de sincronização do histórico: resultado da comparação entre local e remoto.
 * Imutável e determinístico.
 */
class HistorySyncPlan {
  constructor(toInsert, alreadyPresent, conflicts) {
    this.toInsert = toInsert || [];
    this.alreadyPresent = alreadyPresent || [];
    this.conflicts = conflicts || [];
  }

  /**
   * Verdadeiro quando não há conflitos e há dados a inserir.
   */
  get isReady() {
    return this.conflicts.length === 0 && this.toInsert.length > 0;
  }

  /**
   * Verdadeiro quando não há trabalho a fazer (local está atualizado).
   */
  get isUpToDate() {
    return this.toInsert.length === 0 && this.conflicts.length === 0;
  }

  /**
   * Verdadeiro quando há problemas que impedem a sincronização.
   */
  get hasConflicts() {
    return this.conflicts.length > 0;
  }

  /**
   * Resumo em texto para logging.
   */
  summary() {
    const parts = [];
    if (this.toInsert.length > 0) {
      parts.push(`${this.toInsert.length} para inserir`);
    }
    if (this.alreadyPresent.length > 0) {
      parts.push(`${this.alreadyPresent.length} já presentes`);
    }
    if (this.conflicts.length > 0) {
      parts.push(`${this.conflicts.length} conflitos`);
    }
    return parts.length > 0 ? parts.join('; ') : 'nada a sincronizar';
  }
}
