/** Resultado consolidado de uma execução de pipeline. */
class PipelineResult {
  constructor(startedAt) {
    this.success = false;
    this.startedAt = startedAt;
    this.finishedAt = null;
    this.duration = 0;
    this.executedSteps = [];
    this.warnings = [];
    this.errors = [];
  }

  finish(success) {
    this.success = success;
    this.finishedAt = new Date();
    this.duration = this.finishedAt.getTime() - this.startedAt.getTime();
    return this;
  }
}
