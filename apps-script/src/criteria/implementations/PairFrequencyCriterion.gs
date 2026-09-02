/** Pontua números baseado na frequência de pares com um número de referência. */
class PairFrequencyCriterion extends ICriterion {
  constructor() {
    super();
    this.config = null;
    this.pairsData = null;
    this.referenceNumber = null;
  }

  getName() {
    return this.getDefinition().name;
  }

  getDefinition() {
    return new CriterionDefinition(
      'pair-frequency',
      'Pair Frequency',
      'Pontua números baseado na frequência de pares com número de referência.',
      '1.0.0',
      new CriterionPriority(110)
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
    this.pairsData = context.statistics;
    this.referenceNumber = context.metadata?.referenceNumber || null;
  }

  evaluate(context, statistic) {
    if (!this.referenceNumber || this.referenceNumber === statistic.number) {
      return new CriterionResult(
        this.getDefinition(),
        statistic.number,
        false,
        0,
        'Sem número de referência ou é o próprio número.'
      );
    }

    const { mostFrequent, leastFrequent } = this._findPairFrequencies();

    let score = 0;
    let reason = '';

    if (statistic.number === mostFrequent) {
      score = 2;
      reason = `Par mais frequente com ${this.referenceNumber} (+2)`;
    } else if (statistic.number === leastFrequent) {
      score = -1;
      reason = `Par menos frequente com ${this.referenceNumber} (-1)`;
    } else {
      score = 0;
      reason = `Sem relação de par com ${this.referenceNumber}`;
    }

    return new CriterionResult(
      this.getDefinition(),
      statistic.number,
      score !== 0,
      score > 0 ? this.getWeight() : 0,
      reason
    );
  }

  getWeight() {
    if (!this.config) {
      throw new Error(`O critério ${this.getName()} deve ser configurado antes da avaliação.`);
    }
    return this.config.weight;
  }

  _findPairFrequencies() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName('Pares');

    if (!sheet) {
      return { mostFrequent: null, leastFrequent: null };
    }

    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return { mostFrequent: null, leastFrequent: null };
    }

    const pairsWithRef = [];
    for (let i = 1; i < values.length; i++) {
      const num1 = values[i][0];
      const num2 = values[i][1];
      const frequency = values[i][2];

      if ((num1 === this.referenceNumber && num2 !== this.referenceNumber) ||
          (num2 === this.referenceNumber && num1 !== this.referenceNumber)) {
        const otherNumber = num1 === this.referenceNumber ? num2 : num1;
        pairsWithRef.push({ number: otherNumber, frequency: frequency });
      }
    }

    if (pairsWithRef.length === 0) {
      return { mostFrequent: null, leastFrequent: null };
    }

    pairsWithRef.sort((a, b) => {
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency;
      }
      return a.number - b.number;
    });

    const mostFrequent = pairsWithRef[0].number;
    const leastFrequent = pairsWithRef[pairsWithRef.length - 1].number;

    Logger.log(`[PairFrequencyCriterion] Reference: ${this.referenceNumber}, Most: ${mostFrequent} (${pairsWithRef[0].frequency}), Least: ${leastFrequent} (${pairsWithRef[pairsWithRef.length - 1].frequency})`);

    return { mostFrequent, leastFrequent };
  }
}
