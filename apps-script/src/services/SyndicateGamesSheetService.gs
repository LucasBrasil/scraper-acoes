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

    let updatedLines = 0;
    const contestsByNumber = new Map();

    contests.forEach((contest) => {
      contestsByNumber.set(contest.number, contest);
    });

    const contestNumbers = Array.from(contestsByNumber.keys());

    for (const contestNumber of contestNumbers) {
      const games = this.gamesRepository.getGamesByContest(contestNumber);

      if (games.length === 0) {
        continue;
      }

      const contest = contestsByNumber.get(contestNumber);

      for (const game of games) {
        if (game.drawnNumbers.length === 0) {
          const selectedNumbers = this._extractSelectedNumbers(game.rowIndex);
          this.gamesRepository.updateGameResult(game.rowIndex, contest.drawnNumbers);
          this._formatResultRow(game.rowIndex, selectedNumbers, contest.drawnNumbers);
          updatedLines++;
        }
      }
    }

    return { updatedLines };
  }

  _formatResultRow(rowIndex, selectedNumbers, drawnNumbers) {
    this.gamesRepository.formatGameResultRow(rowIndex, selectedNumbers, drawnNumbers);
  }

  _extractSelectedNumbers(rowIndex) {
    const sheet = this.gamesRepository._getSheet();
    const selectedNumbers = [];

    for (let col = 1; col <= 60; col++) {
      const cell = sheet.getRange(rowIndex, col);
      const number = Number(cell.getValue());
      const background = cell.getBackground ? cell.getBackground() : '#FFFFFF';

      if (background === MS_CONFIG.SELECTED_COLOR) {
        selectedNumbers.push(number);
      }
    }

    return selectedNumbers.sort((a, b) => a - b);
  }
}
