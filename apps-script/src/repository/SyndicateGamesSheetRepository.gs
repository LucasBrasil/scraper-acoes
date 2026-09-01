/** Repositório de jogos do bolão na aba "Jogos Bolão". */
class SyndicateGamesSheetRepository {
  constructor(spreadsheet, sheetName) {
    this.spreadsheet = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
    this.sheetName = sheetName || MS_CONFIG.SYNDICATE_GAMES_SHEET_NAME;
  }

  insertGame(game) {
    this.insertGames([game]);
  }

  insertGames(games) {
    if (!Array.isArray(games) || games.length === 0) {
      return;
    }

    if (!games.every((item) => item instanceof SyndicateLotteryGame)) {
      throw new Error('insertGames aceita somente objetos SyndicateLotteryGame.');
    }

    const sheet = this._getSheet();
    const rows = games.map(game => this._gameToRow(game));
    const lastRow = sheet.getLastRow();
    const startRow = lastRow + 1;

    Logger.log(`[insertGames] Adding ${games.length} games starting at row ${startRow}`);
    Logger.log(`[insertGames] First row: ${rows[0].length} elements, last 2: [${rows[0][66]}, ${rows[0][67]}]`);
    Logger.log(`[insertGames] Contest: ${games[0].contestNumber}, Date: ${games[0].date}`);

    for (let i = 0; i < games.length; i++) {
      const rowNum = startRow + i;
      this._clearFormattingForNewGame(sheet, rowNum);

      const row = rows[i];
      sheet.getRange(rowNum, 1, 1, 60).setValues([row.slice(0, 60)]);
      sheet.getRange(rowNum, 61, 1, 6).setValues([row.slice(60, 66)]);
      sheet.getRange(rowNum, 67, 1, 1).setValue(row[66]);
      sheet.getRange(rowNum, 68, 1, 1).setValue(row[67]);

      sheet.getRange(rowNum, 67, 1, 2).setBackground('#000000');
      sheet.getRange(rowNum, 67, 1, 2).setFontColor('#FFFFFF');

      this._formatGameRow(sheet, rowNum, games[i].selectedNumbers);
    }
  }

  getGamesByContest(contestNumber) {
    const sheet = this._getSheet();
    const values = sheet.getDataRange().getValues();

    if (values.length === 0) {
      return [];
    }

    const games = [];
    const contestColIndex = 67;
    const dateColIndex = 68;
    const frozenRows = sheet.getFrozenRows();

    const startIndex = frozenRows > 0 ? 1 : 0;

    for (let i = startIndex; i < values.length; i++) {
      const row = values[i];
      if (row[contestColIndex - 1] === contestNumber) {
        games.push({
          rowIndex: i + 1,
          contestNumber: row[contestColIndex - 1],
          date: row[dateColIndex - 1],
          drawnNumbers: this._extractDrawnNumbers(row)
        });
      }
    }

    return games;
  }

  hasGamesForContest(contestNumber) {
    return this.getGamesByContest(contestNumber).length > 0;
  }

  updateGameResult(rowNumber, drawnNumbers) {
    if (!Array.isArray(drawnNumbers) || drawnNumbers.length !== 6) {
      throw new Error('Resultado deve conter exatamente 6 dezenas.');
    }

    const sheet = this._getSheet();
    const range = sheet.getRange(rowNumber, 1, 1, 68);
    const row = range.getValues()[0];

    Logger.log(`[updateGameResult] Row ${rowNumber}: drawnNumbers=[${drawnNumbers.join(',')}]`);

    if (this._hasResult(row)) {
      Logger.log(`[updateGameResult] Row ${rowNumber}: already has result, skipping`);
      return;
    }

    Logger.log(`[updateGameResult] Row ${rowNumber}: setting drawn numbers in columns 61-66`);
    const drawnColStart = 61;
    for (let i = 0; i < drawnNumbers.length; i++) {
      const colNumber = drawnColStart + i;
      Logger.log(`  -> Column ${colNumber}: ${drawnNumbers[i]}`);
      sheet.getRange(rowNumber, colNumber).setValue(drawnNumbers[i]);
    }
    Logger.log(`[updateGameResult] Row ${rowNumber}: DONE`);
  }

  formatGameResultRow(rowNumber, selectedNumbers, drawnNumbers) {
    const sheet = this._getSheet();
    const selectedSet = new Set(selectedNumbers);
    const drawnSet = new Set(drawnNumbers);

    for (let col = 1; col <= 60; col++) {
      const cell = sheet.getRange(rowNumber, col);
      const number = Number(cell.getValue());
      const isSelected = selectedSet.has(number);
      const isDrawn = drawnSet.has(number);

      if (isSelected && isDrawn) {
        cell.setBackground(MS_CONFIG.HIT_COLOR);
        cell.setFontWeight('bold');
        cell.setFontStyle('italic');
      } else if (isSelected && !isDrawn) {
        cell.setBackground(MS_CONFIG.SELECTED_COLOR);
        cell.setFontWeight('normal');
        cell.setFontStyle('normal');
      } else if (!isSelected && isDrawn) {
        cell.setBackground(MS_CONFIG.HIT_COLOR);
        cell.setFontWeight('normal');
        cell.setFontStyle('normal');
      } else {
        cell.setBackground('#FFFFFF');
        cell.setFontWeight('normal');
        cell.setFontStyle('normal');
      }
    }
  }

  _gameToRow(game) {
    const row = [];
    for (let i = 1; i <= 60; i++) {
      row.push(i);
    }
    for (let i = 0; i < 6; i++) {
      row.push('');
    }
    row.push(game.contestNumber);
    row.push(game.date);
    return row;
  }

  _formatGameRow(sheet, rowNumber, selectedNumbers) {
    const selectedSet = new Set(selectedNumbers);
    const backgrounds = [];

    for (let col = 1; col <= 60; col++) {
      const cell = sheet.getRange(rowNumber, col);
      const number = Number(cell.getValue());
      backgrounds.push(selectedSet.has(number) ? MS_CONFIG.SELECTED_COLOR : '#FFFFFF');
    }

    sheet.getRange(rowNumber, 1, 1, 60).setBackgrounds([backgrounds]);
  }

  _extractDrawnNumbers(row) {
    const drawnStart = 60;
    const drawnNumbers = [];

    for (let i = drawnStart; i < drawnStart + 6; i++) {
      const value = row[i];
      if (value !== '' && value !== null && value !== undefined) {
        drawnNumbers.push(Number(value));
      }
    }

    return drawnNumbers;
  }

  _hasResult(row) {
    const drawnStart = 60;

    for (let i = drawnStart; i < drawnStart + 6; i++) {
      if (row[i] === '' || row[i] === null || row[i] === undefined) {
        return false;
      }
    }

    return true;
  }

  _clearFormattingForNewGame(sheet, rowNumber) {
    const range = sheet.getRange(rowNumber, 1, 1, 68);
    range.setBackground('#FFFFFF');
    range.setFontWeight('normal');
    range.setFontStyle('normal');

    if (rowNumber > 1) {
      const prevRange = sheet.getRange(rowNumber - 1, 1, 1, 68);
      const prevFontColors = prevRange.getFontColors()[0];
      range.setFontColors([prevFontColors]);
    } else {
      range.setFontColor('#000000');
    }
  }

  _getSheet() {
    const sheet = this.spreadsheet.getSheetByName(this.sheetName);

    if (!sheet) {
      throw new Error(
        `A aba obrigatória "${this.sheetName}" não foi encontrada. Crie a aba antes de usar este recurso.`
      );
    }

    return sheet;
  }

}
