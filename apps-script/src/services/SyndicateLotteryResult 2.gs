/** Resultado auditável da geração do bolão. */
class SyndicateLotteryResult {
  constructor() {
    this.lastLocalContest = 0;
    this.lastRemoteContest = 0;
    this.contestsInserted = 0;
    this.contestsAlreadyPresent = 0;
    this.syncConflicts = 0;
    this.integrityStatus = '';
    this.integrityDetails = '';
    this.selectedNumbers = [];
    this.games = [];
    this.totalGames = 0;
    this.dezenaPerGame = 0;
    this.participants = 0;
    this.valuePerParticipant = 0;
    this.totalBudget = 0;
    this.alreadyGenerated = false;
    this.error = null;
  }

  isSuccess() {
    return !this.error;
  }

  getDate() {
    return new Date();
  }

  summary() {
    if (this.error) {
      return `ERRO: ${this.error}`;
    }

    if (this.alreadyGenerated) {
      return `Bolão não gerado: concurso ${this.lastRemoteContest} já possui jogos registrados.`;
    }

    return `Bolão gerado com sucesso:\n` +
           `  Sincronização: ${this.contestsInserted} novos, ${this.contestsAlreadyPresent} existentes\n` +
           `  Histórico: ${this.lastLocalContest} (local) -> ${this.lastRemoteContest} (remoto)\n` +
           `  Integridade: ${this.integrityStatus} (${this.integrityDetails})\n` +
           `  Participantes: ${this.participants} × R$ ${this.valuePerParticipant.toFixed(2)}\n` +
           `  Orçamento: R$ ${this.totalBudget.toFixed(2)}\n` +
           `  Dezenas selecionadas: ${this.selectedNumbers.join(', ')}\n` +
           `  Distribuição: ${this.totalGames} jogo(s) de ${this.dezenaPerGame} dezenas`;
  }

  auditLog() {
    const log = [];
    log.push('=== AUDITORIA DE GERAÇÃO DO BOLÃO ===');
    log.push(`Último concurso local: ${this.lastLocalContest}`);
    log.push(`Último concurso remoto: ${this.lastRemoteContest}`);
    log.push(`Concursos inseridos: ${this.contestsInserted}`);
    log.push(`Concursos já presentes: ${this.contestsAlreadyPresent}`);
    if (this.syncConflicts > 0) {
      log.push(`⚠️  Conflitos detectados: ${this.syncConflicts}`);
    }
    log.push(`Status da integridade: ${this.integrityStatus}`);
    log.push(`Detalhes: ${this.integrityDetails}`);
    if (this.error) {
      log.push(`❌ ERRO: ${this.error}`);
      return log.join('\n');
    }
    if (this.alreadyGenerated) {
      log.push('');
      log.push('⏭️  GERAÇÃO IGNORADA');
      log.push(`Concurso ${this.lastRemoteContest} já possui jogos registrados.`);
      log.push('Nenhum novo jogo foi inserido.');
      return log.join('\n');
    }
    log.push('');
    log.push('=== SELEÇÃO E DISTRIBUIÇÃO ===');
    log.push(`Dezenas selecionadas (7): ${this.selectedNumbers.join(', ')}`);
    log.push(`Participantes: ${this.participants}`);
    log.push(`Valor por participante: R$ ${this.valuePerParticipant.toFixed(2)}`);
    log.push(`Total de jogos: ${this.totalGames}`);
    log.push(`Dezenas por jogo: ${this.dezenaPerGame}`);
    log.push(`Orçamento total: R$ ${this.totalBudget.toFixed(2)}`);
    if (this.games.length > 0) {
      log.push('');
      log.push('Jogos:');
      this.games.forEach((game, index) => {
        log.push(`  Jogo ${index + 1}: ${game.join(', ')}`);
      });
    }
    log.push('');
    log.push('✅ Bolão pronto para execução');
    return log.join('\n');
  }
}
