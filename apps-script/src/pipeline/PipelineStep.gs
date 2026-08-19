/** Uma etapa executável do pipeline. */
class PipelineStep {
  constructor(name, action) {
    if (!name || typeof action !== 'function') {
      throw new Error('Uma etapa de pipeline exige nome e ação.');
    }
    this.name = name;
    this.action = action;
  }

  execute(context) {
    return this.action(context);
  }
}
