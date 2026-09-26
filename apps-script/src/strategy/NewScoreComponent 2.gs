/** Componente individual de score que contribui para a pontuação total. */
class NewScoreComponent {
  constructor(name, weight) {
    if (!name || typeof name !== 'string') {
      throw new Error('nome do componente é obrigatório');
    }
    if (typeof weight !== 'number' || weight < 0) {
      throw new Error('peso do componente deve ser um número não-negativo');
    }
    this.name = name;
    this.weight = weight;
  }

  getName() {
    return this.name;
  }

  getWeight() {
    return this.weight;
  }

  summary() {
    return `${this.name}: +${this.weight}pt`;
  }
}
