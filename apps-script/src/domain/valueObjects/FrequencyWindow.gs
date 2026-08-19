/** Define uma janela histórica válida para contagem de frequência. */
class FrequencyWindow {
  constructor(size) {
    if (!Number.isInteger(size) || size <= 0) {
      throw new Error('O tamanho da janela de frequência deve ser um inteiro positivo.');
    }
    this.size = size;
  }

  static defaults() {
    return [20, 50, 100].map((size) => new FrequencyWindow(size));
  }
}
