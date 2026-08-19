/** Orquestra etapas, tempo, logs e interrupção segura em caso de falha. */
class PipelineEngine {
  constructor(steps, logger) {
    this.steps = steps || [];
    this.logger = logger;
  }

  execute(context) {
    if (!(context instanceof PipelineContext)) {
      throw new Error('PipelineEngine exige um PipelineContext.');
    }
    const result = new PipelineResult(context.startedAt);
    for (const step of this.steps) {
      const startedAt = new Date();
      try {
        step.execute(context);
        const finishedAt = new Date();
        const entry = this._createLogEntry(context, step.name, startedAt, finishedAt, 'SUCCESS', 'Etapa concluída.');
        this.logger.log(entry);
        result.executedSteps.push(step.name);
      } catch (error) {
        const finishedAt = new Date();
        const message = error && error.message ? error.message : String(error);
        this.logger.log(this._createLogEntry(context, step.name, startedAt, finishedAt, 'ERROR', message));
        result.errors.push({ step: step.name, message });
        return result.finish(false);
      }
    }
    return result.finish(true);
  }

  _createLogEntry(context, step, startedAt, finishedAt, result, message) {
    return {
      executionId: context.executionId,
      step,
      startedAt,
      finishedAt,
      duration: finishedAt.getTime() - startedAt.getTime(),
      result,
      message
    };
  }
}
