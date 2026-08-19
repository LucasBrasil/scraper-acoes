/** Contexto compartilhado por todas as etapas de uma execução completa. */
class PipelineContext {
  constructor(configuration, metadata, executionId, startedAt) {
    this.startedAt = startedAt || new Date();
    this.executionDate = new Date(this.startedAt.getTime());
    this.executionTime = this.startedAt.getTime();
    this.configuration = configuration || {};
    this.metadata = metadata || {};
    this.executionId = executionId || `pipeline-${this.executionTime}-${Math.floor(Math.random() * 100000)}`;
  }
}
