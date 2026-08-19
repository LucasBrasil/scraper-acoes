/** Lê configurações de critérios sem executar regras de decisão. */
class CriteriaRepository extends ICriteriaRepository {
  constructor(spreadsheet, sheetName) {
    super();
    this.spreadsheet = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
    this.sheetName = sheetName || MS_CONFIG.CRITERIA_SHEET_NAME;
  }

  getAll() {
    const sheet = this._getSheet();
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return {};
    }
    const indexes = this._getHeaderIndexes(values[0]);
    return values.slice(1)
      .filter((row) => row.some((cell) => cell !== ''))
      .reduce((configurations, row, rowOffset) => {
        const name = String(row[indexes.name] || '').trim();
        const weight = Number(row[indexes.weight]);
        if (!name || !Number.isFinite(weight)) {
          throw new Error(`Linha ${rowOffset + 2} da aba ${this.sheetName} é inválida.`);
        }
        configurations[name] = { enabled: row[indexes.enabled] === true, weight };
        return configurations;
      }, {});
  }

  _getSheet() {
    const sheet = this.spreadsheet.getSheetByName(this.sheetName);
    if (!sheet) {
      throw new Error(`A aba obrigatória "${this.sheetName}" não foi encontrada.`);
    }
    return sheet;
  }

  _getHeaderIndexes(headers) {
    const expectedHeaders = MS_CONFIG.CRITERIA_HEADERS;
    const indexes = expectedHeaders.reduce((result, header) => {
      result[header] = headers.indexOf(header);
      return result;
    }, {});
    if (Object.keys(indexes).some((header) => indexes[header] === -1)) {
      throw new Error(`A aba "${this.sheetName}" deve conter os cabeçalhos: ${expectedHeaders.join(', ')}.`);
    }
    return { name: indexes.Critério, enabled: indexes.Ativo, weight: indexes.Peso };
  }
}
