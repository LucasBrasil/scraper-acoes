/** Persiste registros de etapas na aba Log. */
class LogRepository extends ILogRepository {
  constructor(spreadsheet, sheetName) {
    super();
    this.spreadsheet = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
    this.sheetName = sheetName || MS_CONFIG.LOG_SHEET_NAME;
  }

  append(entry) {
    const sheet = this._getOrCreateSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(MS_CONFIG.LOG_HEADERS);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([entry.executionId, entry.step, entry.startedAt, entry.finishedAt, entry.duration, entry.result, entry.message]);
  }

  _getOrCreateSheet() {
    return this.spreadsheet.getSheetByName(this.sheetName) || this.spreadsheet.insertSheet(this.sheetName);
  }
}
