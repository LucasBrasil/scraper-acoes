/** Serviço de persistência e atualização de jogos do bolão. */
class SyndicateGamesSheetService {
  constructor(gamesRepository, historyRepository) {
    this.gamesRepository = gamesRepository;
    this.historyRepository = historyRepository;
  }

  persistGames(syndicateLotteryResult) {
    if (!syndicateLotteryResult.isSuccess()) {
      throw new Error('Não é possível persistir um resultado com erro.');
    }

    if (!syndicateLotteryResult.games || syndicateLotteryResult.games.length === 0) {
      return { persistedGames: 0 };
    }

    const targetContest = syndicateLotteryResult.lastRemoteContest + 1;

    if (this.gamesRepository.hasGamesForContest(targetContest)) {
      return {
        persistedGames: 0,
        contestNumber: targetContest,
        skipped: true,
        reason: `Bolão não gerado: concurso ${targetContest} já possui jogos registrados.`
      };
    }

    const games = syndicateLotteryResult.games.map((selectedNumbers) =>
      new SyndicateLotteryGame(
        selectedNumbers,
        targetContest,
        syndicateLotteryResult.getDate ? syndicateLotteryResult.getDate() : new Date()
      )
    );

    this.gamesRepository.insertGames(games);

    return {
      persistedGames: games.length,
      contestNumber: targetContest
    };
  }

  updateResults() {
    const contests = this.historyRepository.getAll();

    if (!contests || contests.length === 0) {
      return { updatedLines: 0 };
    }

    const contestsByNumber = new Map();
    contests.forEach((contest) => {
      contestsByNumber.set(contest.number, contest);
    });

    const sheet = this.gamesRepository._getSheet();
    const values = sheet.getDataRange().getValues();

    if (values.length === 0) {
      return { updatedLines: 0 };
    }

    let updatedLines = 0;
    const frozenRows = sheet.getFrozenRows();
    const startIndex = frozenRows > 0 ? 1 : 0;
    const contestColIndex = 66;

    for (let i = startIndex; i < values.length; i++) {
      const row = values[i];
      const contestNumber = row[contestColIndex];
      const contest = contestsByNumber.get(contestNumber);

      if (!contest) {
        continue;
      }

      const drawnNumbers = this.gamesRepository._extractDrawnNumbers(row);
      const rowIndex = i + 1;

      if (drawnNumbers.length === 0) {
        this.gamesRepository.updateGameResult(rowIndex, contest.drawnNumbers);
        const selectedNumbers = this._extractSelectedNumbers(rowIndex);
        this._formatResultRow(rowIndex, selectedNumbers, contest.drawnNumbers);
        updatedLines++;
      }
    }

    return { updatedLines };
  }

  _formatResultRow(rowIndex, selectedNumbers, drawnNumbers) {
    this.gamesRepository.formatGameResultRow(rowIndex, selectedNumbers, drawnNumbers);
  }

  _extractSelectedNumbers(rowIndex) {
    const sheet = this.gamesRepository._getSheet();
    const range = sheet.getRange(rowIndex, 1, 1, 60);
    const backgroundColors = range.getBackgrounds()[0];
    const values = range.getValues()[0];
    const selectedNumbers = [];
    const expectedColor = MS_CONFIG.SELECTED_COLOR.toLowerCase();

    Logger.log(`[_extractSelectedNumbers] Row ${rowIndex}: expected color=${expectedColor}`);

    for (let col = 0; col < 60; col++) {
      const color = backgroundColors[col].toLowerCase();
      const value = values[col];
      const number = Number(value);

      if (number === 33 || number === 52) {
        Logger.log(`  Col ${col + 1} (value=${number}): color=${backgroundColors[col]} (lowercased=${color}) - ${color === expectedColor ? 'MATCH' : 'NO MATCH'}`);
      }

      if (color === expectedColor) {
        selectedNumbers.push(number);
      }
    }

    Logger.log(`[_extractSelectedNumbers] Result: ${JSON.stringify(selectedNumbers)}`);
    return selectedNumbers.sort((a, b) => a - b);
  }
}
