/** Configuração imutável de um bolão de loteria. */
class SyndicateConfig {
  constructor(participants, valuePerParticipant, strategy) {
    if (!Number.isInteger(participants) || participants < 1) {
      throw new Error('Quantidade de participantes deve ser um inteiro positivo.');
    }
    if (typeof valuePerParticipant !== 'number' || valuePerParticipant <= 0) {
      throw new Error('Valor por participante deve ser um número positivo.');
    }
    if (!strategy || typeof strategy.calculate !== 'function') {
      throw new Error('Estratégia deve implementar o método calculate().');
    }

    this.participants = participants;
    this.valuePerParticipant = valuePerParticipant;
    this.strategy = strategy;
  }

  getBudget() {
    return this.participants * this.valuePerParticipant;
  }

  getDistribution() {
    return this.strategy.calculate(this.getBudget());
  }

  summary() {
    const dist = this.getDistribution();
    return `Bolão: ${this.participants} participantes × R$${this.valuePerParticipant} = R$${this.getBudget()}, ${dist.games} jogo(s) de ${dist.dezenasPorJogo} dezena(s)`;
  }
}
