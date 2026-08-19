/** Repositório que persiste o resultado pronto para exibição na aba Estatísticas. */
class StatisticsRepository extends IStatisticsRepository {
  constructor(spreadsheet, sheetName) {
    super();
    this.spreadsheet = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
    this.sheetName = sheetName || MS_CONFIG.STATISTICS_SHEET_NAME;
  }

  getAll() {
    const sheet = this._getSheet();
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return [];
    }
    const indexes = this._getHeaderIndexes(values[0]);
    return values.slice(1)
      .filter((row) => row.some((cell) => cell !== ''))
      .map((row, rowOffset) => this._toStatistic(row, indexes, rowOffset + 2));
  }

  replaceAll(statisticDTOs) {
    const sheet = this._getOrCreateSheet();
    sheet.clearContents();
    const rows = statisticDTOs.map((statisticDTO) => statisticDTO.toRow());
    sheet.getRange(1, 1, 1, MS_CONFIG.STATISTICS_HEADERS.length).setValues([MS_CONFIG.STATISTICS_HEADERS]);
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, MS_CONFIG.STATISTICS_HEADERS.length).setValues(rows);
    }
    sheet.setFrozenRows(1);
  }

  updateScores(scoreResults) {
    const sheet = this._getSheet();
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return;
    }
    const indexes = this._getHeaderIndexes(values[0]);
    const scoresByNumber = scoreResults.reduce((scores, result) => {
      scores[result.number] = result;
      return scores;
    }, {});
    const scoreValues = values.slice(1).map((row) => {
      const result = scoresByNumber[Number(row[indexes[0]])];
      return [result ? result.score : 0, result ? result.ranking : 0];
    });
    sheet.getRange(2, indexes[7] + 1, scoreValues.length, 2).setValues(scoreValues);
  }

  getScoreResults() {
    const values = this._getSheet().getDataRange().getValues();
    if (values.length <= 1) {
      return [];
    }
    const indexes = this._getHeaderIndexes(values[0]);
    return values.slice(1)
      .filter((row) => row.some((cell) => cell !== ''))
      .map((row, rowOffset) => this._toScoreResult(row, indexes, rowOffset + 2));
  }

  getRankingResults() {
    const values = this._getSheet().getDataRange().getValues();
    if (values.length <= 1) {
      return [];
    }
    const indexes = this._getHeaderIndexes(values[0]);
    return values.slice(1)
      .filter((row) => row.some((cell) => cell !== ''))
      .map((row, rowOffset) => this._toRankingResult(row, indexes, rowOffset + 2));
  }

  updateRanking(rankingResults) {
    const sheet = this._getSheet();
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return;
    }
    const indexes = this._getHeaderIndexes(values[0]);
    const rankingsByNumber = rankingResults.reduce((rankings, result) => {
      rankings[result.number] = result.ranking;
      return rankings;
    }, {});
    const rankingValues = values.slice(1).map((row) => [rankingsByNumber[Number(row[indexes[0]])] || 0]);
    sheet.getRange(2, indexes[9] + 1, rankingValues.length, 1).setValues(rankingValues);
  }

  updateSelection(selectionResult) {
    const sheet = this._getSheet();
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return;
    }
    const indexes = this._getHeaderIndexes(values[0]);
    const selectedNumbers = new Set(selectionResult.selectedNumbers);
    const selectionValues = values.slice(1).map((row) => [selectedNumbers.has(Number(row[indexes[0]]))]);
    sheet.getRange(2, indexes[10] + 1, selectionValues.length, 1).setValues(selectionValues);
  }

  _getOrCreateSheet() {
    return this.spreadsheet.getSheetByName(this.sheetName) || this.spreadsheet.insertSheet(this.sheetName);
  }

  _getSheet() {
    const sheet = this.spreadsheet.getSheetByName(this.sheetName);
    if (!sheet) {
      throw new Error(`A aba obrigatória "${this.sheetName}" não foi encontrada.`);
    }
    return sheet;
  }

  _getHeaderIndexes(headers) {
    const indexes = MS_CONFIG.STATISTICS_HEADERS.map((header) => headers.indexOf(header));
    if (indexes.some((index) => index === -1)) {
      throw new Error(`A aba "${this.sheetName}" deve conter os cabeçalhos: ${MS_CONFIG.STATISTICS_HEADERS.join(', ')}.`);
    }
    return indexes;
  }

  _toStatistic(row, indexes, sheetRowNumber) {
    const values = indexes.map((index) => Number(row[index]));
    if (values.some((value) => !Number.isFinite(value))) {
      throw new Error(`Linha ${sheetRowNumber} da aba ${this.sheetName} é inválida.`);
    }
    return new Statistic(values[0], values[1], { frequency: values[2] }, values[3], {
      20: values[4], 50: values[5], 100: values[6]
    }, 0, values[7]);
  }

  _toScoreResult(row, indexes, sheetRowNumber) {
    const values = [row[indexes[0]], row[indexes[7]], row[indexes[8]], row[indexes[1]]].map(Number);
    if (values.some((value) => !Number.isFinite(value))) {
      throw new Error(`Linha ${sheetRowNumber} da aba ${this.sheetName} é inválida.`);
    }
    return new ScoreResult(values[0], values[1], values[2], [], values[3]);
  }

  _toRankingResult(row, indexes, sheetRowNumber) {
    const values = [row[indexes[0]], row[indexes[9]], row[indexes[7]], row[indexes[1]]].map(Number);
    if (values.some((value) => !Number.isFinite(value))) {
      throw new Error(`Linha ${sheetRowNumber} da aba ${this.sheetName} é inválida.`);
    }
    return new RankingResult(values[0], values[1], values[2], values[3]);
  }
}
