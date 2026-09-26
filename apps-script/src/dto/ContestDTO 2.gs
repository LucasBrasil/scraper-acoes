/**
 * DTO com apenas os dados necessários para nosso domínio.
 * Transporte entre o adaptador de origem e o repositório.
 */
class ContestDTO {
  constructor(number, dateString, drawnNumbers) {
    this.number = number;
    this.dateString = dateString;
    this.drawnNumbers = drawnNumbers;
  }

  /**
   * Converte para Contest válido, aplicando normalização de data.
   * Lança se qualquer componente for inválido.
   */
  toContest() {
    return new Contest(this.number, this.dateString, this.drawnNumbers);
  }
}
