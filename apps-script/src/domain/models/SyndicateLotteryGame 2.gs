/** Representa um jogo do bolão com 7 dezenas selecionadas. */
class SyndicateLotteryGame {
  constructor(selectedNumbers, contestNumber, date) {
    this.selectedNumbers = SyndicateLotteryGame._validateSelectedNumbers(selectedNumbers);
    this.contestNumber = SyndicateLotteryGame._validateContestNumber(contestNumber);
    this.date = SyndicateLotteryGame._validateDate(date);
  }

  static _validateSelectedNumbers(numbers) {
    if (!Array.isArray(numbers) || numbers.length !== 7) {
      throw new Error('Um jogo deve conter exatamente sete dezenas selecionadas.');
    }

    const normalizedNumbers = numbers.map((number) => Number(number));
    const areValidNumbers = normalizedNumbers.every((number) => Number.isInteger(number) && number >= 1 && number <= 60);
    if (!areValidNumbers || new Set(normalizedNumbers).size !== 7) {
      throw new Error('As dezenas devem ser inteiras, únicas e estar entre 1 e 60.');
    }

    return normalizedNumbers.slice().sort((first, second) => first - second);
  }

  static _validateContestNumber(number) {
    const parsedNumber = Number(number);
    if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) {
      throw new Error('O número do concurso deve ser um inteiro positivo.');
    }
    return parsedNumber;
  }

  static _validateDate(date) {
    return DateNormalizer.normalize(date, 'A data do jogo é inválida');
  }
}
