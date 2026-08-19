/** Lê configurações operacionais sem conter regras de seleção. */
class ConfigRepository extends IConfigRepository {
  constructor(spreadsheet, sheetName) {
    super();
    this.spreadsheet = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
    this.sheetName = sheetName || MS_CONFIG.CONFIG_SHEET_NAME;
  }

  getCandidateCount() {
    const candidateCount = Number(this.getAll()[MS_CONFIG.CANDIDATE_COUNT_PARAMETER]);
    if (!Number.isInteger(candidateCount) || candidateCount <= 0 || candidateCount > 60) {
      throw new Error('A quantidade de dezenas candidatas deve ser um inteiro entre 1 e 60.');
    }
    return candidateCount;
  }

  isAutoSyncEnabled() {
    try {
      const all = this.getAll();
      const value = all[MS_CONFIG.AUTO_SYNC_ENABLED_PARAMETER];
      return value === true || value === 'TRUE' || value === 'true' || value === 1;
    } catch (error) {
      return false;
    }
  }

  getInitialHistorySize() {
    try {
      const all = this.getAll();
      const value = all[MS_CONFIG.INITIAL_HISTORY_SIZE_PARAMETER];
      if (value === undefined || value === '') {
        return 100;
      }
      const size = Number(value);
      if (!Number.isInteger(size) || size <= 0) {
        return 100;
      }
      return size;
    } catch (error) {
      return 100;
    }
  }

  getSyncBatchSize() {
    try {
      const all = this.getAll();
      const value = all[MS_CONFIG.SYNC_BATCH_SIZE_PARAMETER];
      if (value === undefined || value === '') {
        return 100;
      }
      const size = Number(value);
      if (!Number.isInteger(size) || size <= 0) {
        return 100;
      }
      return size;
    } catch (error) {
      return 100;
    }
  }

  getAll() {
    const values = this._getSheet().getDataRange().getValues();
    if (values.length <= 1) {
      throw new Error(`A aba ${this.sheetName} não contém parâmetros.`);
    }
    const headerIndexes = this._getHeaderIndexes(values[0]);
    return values.slice(1)
      .filter((row) => row.some((cell) => cell !== ''))
      .reduce((configuration, row) => {
        const parameter = String(row[headerIndexes.parameter] || '').trim();
        if (parameter) {
          configuration[parameter] = row[headerIndexes.value];
        }
        return configuration;
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
    const parameter = headers.indexOf(MS_CONFIG.CONFIG_HEADERS[0]);
    const value = headers.indexOf(MS_CONFIG.CONFIG_HEADERS[1]);
    if (parameter === -1 || value === -1) {
      throw new Error(`A aba "${this.sheetName}" deve conter os cabeçalhos: ${MS_CONFIG.CONFIG_HEADERS.join(', ')}.`);
    }
    return { parameter, value };
  }
}
