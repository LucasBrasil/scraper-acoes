/** Representa um concurso válido da Mega-Sena. */
class Contest {
  constructor(number, date, drawnNumbers) {
    this.number = Contest._validateNumber(number);
    this.date = Contest._validateDate(date);
    this.drawnNumbers = Contest._validateDrawnNumbers(drawnNumbers);
  }

  static _validateNumber(number) {
    const parsedNumber = Number(number);
    if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) {
      throw new Error('O número do concurso deve ser um inteiro positivo.');
    }
    return parsedNumber;
  }

  static _validateDate(date) {
    return DateNormalizer.normalize(date, 'A data do concurso é inválida');
  }

  static _validateDrawnNumbers(drawnNumbers) {
    if (!Array.isArray(drawnNumbers) || drawnNumbers.length !== 6) {
      throw new Error('Um concurso deve conter exatamente seis dezenas.');
    }

    const normalizedNumbers = drawnNumbers.map((number) => Number(number));
    const areValidNumbers = normalizedNumbers.every((number) => Number.isInteger(number) && number >= 1 && number <= 60);
    if (!areValidNumbers || new Set(normalizedNumbers).size !== 6) {
      throw new Error('As dezenas devem ser inteiras, únicas e estar entre 1 e 60.');
    }

    return normalizedNumbers.slice().sort((first, second) => first - second);
  }
}
