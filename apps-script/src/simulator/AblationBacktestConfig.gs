/** Configuração individual para ablation study. */
class AblationBacktestConfig {
  constructor(name, topFrequent, bottomFrequent, minRecurrence, lastDrawn) {
    this.name = name;
    this.topFrequent = topFrequent || { count: 10, weight: 2 };
    this.bottomFrequent = bottomFrequent || { count: 10, weight: 1 };
    this.minRecurrence = minRecurrence || { weight: 2 };
    this.lastDrawn = lastDrawn || { weight: 1 };
  }

  toNewScoreStrategyConfig() {
    return new NewScoreStrategyConfig(
      this.topFrequent,
      this.bottomFrequent,
      this.minRecurrence,
      this.lastDrawn
    );
  }

  getDescription() {
    return `${this.name}: Top=${this.topFrequent.weight}, Bottom=${this.bottomFrequent.weight}, MinRec=${this.minRecurrence.weight}, LastD=${this.lastDrawn.weight}`;
  }

  summary() {
    return this.getDescription();
  }

  static createBaseline() {
    return new AblationBacktestConfig(
      'A-Baseline',
      { count: 10, weight: 2 },
      { count: 10, weight: 1 },
      { weight: 2 },
      { weight: 1 }
    );
  }

  static createWithoutBottomFrequent() {
    return new AblationBacktestConfig(
      'B-SemBottom',
      { count: 10, weight: 2 },
      { count: 10, weight: 0 },
      { weight: 2 },
      { weight: 1 }
    );
  }

  static createWithoutMinRecurrence() {
    return new AblationBacktestConfig(
      'C-SemMinRec',
      { count: 10, weight: 2 },
      { count: 10, weight: 1 },
      { weight: 0 },
      { weight: 1 }
    );
  }

  static createWithoutLastDrawn() {
    return new AblationBacktestConfig(
      'D-SemLastD',
      { count: 10, weight: 2 },
      { count: 10, weight: 1 },
      { weight: 2 },
      { weight: 0 }
    );
  }
}
