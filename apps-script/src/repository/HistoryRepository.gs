/** Repositório que converte linhas da aba Histórico em concursos. */
class HistoryRepository extends IHistoryRepository {
  constructor(spreadsheet, sheetName) {
    super();
    this.spreadsheet = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
    this.sheetName = sheetName || MS_CONFIG.HISTORY_SHEET_NAME;
  }

  getAll() {
    const sheet = this._getSheet();
    const values = sheet.getDataRange().getValues();

    if (values.length <= 1) {
      return [];
    }

    const headerIndexes = this._getHeaderIndexes(values[0]);

    return values.slice(1)
      .filter((row) => row.some((cell) => cell !== ''))
      .map((row, rowOffset) =>
        this._toContest(row, headerIndexes, rowOffset + 2)
      )
      .sort((first, second) => second.number - first.number);
  }

  save(contest) {
    this.saveAll([contest]);
  }

  getLatestContestNumber() {
    const sheet = this._getSheet();
    const values = sheet.getDataRange().getValues();

    if (values.length <= 1) {
      return null;
    }

    const headerIndexes = this._getHeaderIndexes(values[0]);
    const contestNumberIndex = headerIndexes[0];
    let maxNumber = null;

    for (let i = 1; i < values.length; i++) {
      const cellValue = values[i][contestNumberIndex];
      if (cellValue === '') {
        continue;
      }
      const number = Number(cellValue);
      if (!Number.isFinite(number)) {
        throw new Error(
          `Linha ${i + 1} da aba ${this.sheetName} contém um número de concurso inválido: ${cellValue}.`
        );
      }
      if (maxNumber === null || number > maxNumber) {
        maxNumber = number;
      }
    }

    return maxNumber;
  }

  getContestNumbers() {
    const sheet = this._getSheet();
    const values = sheet.getDataRange().getValues();

    if (values.length <= 1) {
      return [];
    }

    const headerIndexes = this._getHeaderIndexes(values[0]);
    const contestNumberIndex = headerIndexes[0];
    const numbers = [];

    for (let i = 1; i < values.length; i++) {
      const cellValue = values[i][contestNumberIndex];
      if (cellValue === '') {
        continue;
      }
      const number = Number(cellValue);
      if (!Number.isFinite(number)) {
        throw new Error(
          `Linha ${i + 1} da aba ${this.sheetName} contém um número de concurso inválido: ${cellValue}.`
        );
      }
      numbers.push(number);
    }

    return numbers;
  }

  saveAll(contests) {
    if (!Array.isArray(contests)) {
      throw new Error('saveAll exige uma lista de contests.');
    }

    if (contests.length === 0) {
      return;
    }

    if (!contests.every((item) => item instanceof Contest)) {
      throw new Error('saveAll aceita somente objetos Contest.');
    }

    const sheet = this._getSheet();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(MS_CONFIG.HISTORY_HEADERS);
    } else {
      this._getHeaderIndexes(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]);
    }

    const rows = contests.map((contest) => [contest.number, contest.date].concat(contest.drawnNumbers));
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, MS_CONFIG.HISTORY_HEADERS.length).setValues(rows);
  }

  _getSheet() {
    const sheet = this.spreadsheet.getSheetByName(this.sheetName);

    if (!sheet) {
      throw new Error(
        `A aba obrigatória "${this.sheetName}" não foi encontrada.`
      );
    }

    return sheet;
  }

  _getHeaderIndexes(headers) {
    const expectedHeaders = MS_CONFIG.HISTORY_HEADERS;

    const indexes = expectedHeaders.map(
      (expectedHeader) => headers.indexOf(expectedHeader)
    );

    if (indexes.some((index) => index === -1)) {
      throw new Error(
        `A aba "${this.sheetName}" deve conter os cabeçalhos: ${expectedHeaders.join(', ')}.`
      );
    }

    return indexes;
  }

  _toContest(row, indexes, sheetRowNumber) {
    try {
      return new Contest(
        row[indexes[0]],
        row[indexes[1]],
        indexes.slice(2).map((index) => row[index])
      );
    } catch (error) {
      throw new Error(
        `Linha ${sheetRowNumber} do Histórico é inválida: ${error.message}`
      );
    }
  }
}