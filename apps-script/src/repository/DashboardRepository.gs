/** Persiste a visão MVP do Dashboard. */
class DashboardRepository extends IDashboardRepository {
  constructor(spreadsheet, sheetName) {
    super();
    this.spreadsheet = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
    this.sheetName = sheetName || MS_CONFIG.DASHBOARD_SHEET_NAME;
  }

  replace(items) {
    const sheet = this._getOrCreateSheet();
    sheet.clearContents();
    sheet.getRange(1, 1, 1, 2).setValues([['Indicador', 'Valor']]);
    sheet.getRange(2, 1, items.length, 2).setValues(items.map((item) => [item.label, item.value]));
    sheet.setFrozenRows(1);
  }

  _getOrCreateSheet() {
    return this.spreadsheet.getSheetByName(this.sheetName) || this.spreadsheet.insertSheet(this.sheetName);
  }
}
