/** Seleciona a menor frequência de cada sequência consecutiva com ao menos três valores. */
class LowestSequenceCriterion extends ICriterion {
  constructor() {
    super();
    this.config = null;
    this.selectedFrequencies = new Set();
  }

  getName() {
    return this.getDefinition().name;
  }

  getDefinition() {
    return new CriterionDefinition(
      'lowest-sequence',
      'Lowest Sequence',
      'Seleciona a menor frequência de sequências consecutivas elegíveis.',
      '1.0.0',
      new CriterionPriority(100)
    );
  }

  isEnabled(config) {
    return Boolean(config && config.enabled);
  }

  configure(config) {
    if (!config || !Number.isFinite(config.weight) || config.weight < 0) {
      throw new Error(`A configuração do critério ${this.getName()} é inválida.`);
    }
    this.config = config;
  }

  prepare(context) {
    const frequencies = [...new Set(context.statistics.map((statistic) => statistic.frequency))]
      .sort((first, second) => second - first);
    this.selectedFrequencies = this._findLowestFrequenciesInSequences(frequencies);
  }

  evaluate(context, statistic) {
    const approved = this.selectedFrequencies.has(statistic.frequency);
    return new CriterionResult(
      this.getDefinition(),
      statistic.number,
      approved,
      approved ? this.getWeight() : 0,
      approved
        ? 'Menor frequência de uma sequência consecutiva.'
        : 'A frequência não é o menor valor de uma sequência consecutiva elegível.'
    );
  }

  getWeight() {
    if (!this.config) {
      throw new Error(`O critério ${this.getName()} deve ser configurado antes da avaliação.`);
    }
    return this.config.weight;
  }

  _findLowestFrequenciesInSequences(frequencies) {
    const selectedFrequencies = new Set();
    let sequence = [];
    frequencies.forEach((frequency, index) => {
      const previousFrequency = frequencies[index - 1];
      const isConsecutive = index > 0 && previousFrequency - frequency === 1;
      sequence = isConsecutive ? sequence.concat(frequency) : [frequency];
      const nextFrequency = frequencies[index + 1];
      const endsSequence = index === frequencies.length - 1 || frequency - nextFrequency !== 1;
      if (endsSequence && sequence.length >= 3) {
        selectedFrequencies.add(sequence[sequence.length - 1]);
      }
    });
    return selectedFrequencies;
  }
}
