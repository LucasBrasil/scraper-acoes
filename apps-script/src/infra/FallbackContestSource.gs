/**
 * Adaptador que tenta múltiplas fontes de dados em sequência.
 * Útil quando uma fonte está bloqueada ou indisponível.
 */
class FallbackContestSource extends IContestSource {
  constructor(...sources) {
    super();
    this.sources = sources || [
      new CaixaMegaSenaContestSource(),
      new SomatematicaMegaSenaContestSource()
    ];
  }

  /**
   * Tenta buscar o concurso de cada fonte até conseguir.
   */
  getByNumber(number) {
    const errors = [];

    for (const source of this.sources) {
      try {
        Logger.log(`[FallbackContestSource] Tentando ${source.constructor.name} para concurso ${number}`);
        return source.getByNumber(number);
      } catch (error) {
        errors.push(`${source.constructor.name}: ${error.message}`);
        Logger.log(`[FallbackContestSource] Falhou ${source.constructor.name}: ${error.message}`);
      }
    }

    throw new Error(`Todas as fontes falharam:\n${errors.join('\n')}`);
  }

  /**
   * Tenta buscar o concurso mais recente de cada fonte até conseguir.
   */
  getLatest() {
    const errors = [];

    for (const source of this.sources) {
      try {
        Logger.log(`[FallbackContestSource] Tentando ${source.constructor.name} para concurso mais recente`);
        return source.getLatest();
      } catch (error) {
        errors.push(`${source.constructor.name}: ${error.message}`);
        Logger.log(`[FallbackContestSource] Falhou ${source.constructor.name}: ${error.message}`);
      }
    }

    throw new Error(`Todas as fontes falharam:\n${errors.join('\n')}`);
  }
}
