/**
 * Orquestra sincronização do histórico com a fonte externa.
 *
 * Responsabilidades:
 * - Obter números locais e remotos;
 * - Determinar quais concursos buscar (carga inicial ou incremental);
 * - Executar HistorySyncEngine;
 * - Persistir novos concursos se não houver conflitos.
 */
class HistorySyncService {
  constructor(contestSource, historyRepository, initialHistorySize) {
    this.contestSource = contestSource;
    this.historyRepository = historyRepository;
    this.initialHistorySize = initialHistorySize || 100;
  }

  /**
   * Sincroniza o histórico com a fonte.
   * Retorna um resultado estruturado.
   */
  sync() {
    const latestLocal = this.historyRepository.getLatestContestNumber();
    const latestRemoteDTO = this.contestSource.getLatest();
    const latestRemote = latestRemoteDTO.number;

    const isInitialLoad = latestLocal === null;
    const numbersToBeFetched = isInitialLoad
      ? this._getNumbersForInitialLoad(latestRemote)
      : this._getNumbersForIncrementalSync(latestLocal, latestRemote);

    const fetchedDTOs = this._fetchContestsByNumbers(numbersToBeFetched);
    const localNumbers = this.historyRepository.getContestNumbers();

    const plan = HistorySyncEngine.compare(localNumbers, fetchedDTOs);

    const inserted = [];
    if (plan.toInsert.length > 0 && !plan.hasConflicts) {
      const contests = plan.toInsert.map((dto) => dto.toContest());
      this.historyRepository.saveAll(contests);
      inserted.push(...plan.toInsert.map((dto) => dto.number));
    }

    return {
      latestLocal: latestLocal,
      latestRemote: latestRemote,
      fetched: fetchedDTOs.map((dto) => dto.number),
      inserted: inserted,
      alreadyPresent: plan.alreadyPresent,
      conflicts: plan.conflicts,
      plan: plan,
      isInitialLoad: isInitialLoad
    };
  }

  /**
   * Quando o histórico está vazio, busca os últimos N concursos.
   * Exemplo: latestRemote=3044, N=100 → busca 2945..3044.
   */
  _getNumbersForInitialLoad(latestRemote) {
    const startNumber = Math.max(1, latestRemote - this.initialHistorySize + 1);
    const numbers = [];
    for (let num = startNumber; num <= latestRemote; num++) {
      numbers.push(num);
    }
    return numbers;
  }

  /**
   * Quando o histórico existe, busca apenas os concursos entre local e remoto.
   * Exemplo: local=3041, remoto=3044 → busca 3042, 3043, 3044.
   */
  _getNumbersForIncrementalSync(latestLocal, latestRemote) {
    if (latestLocal >= latestRemote) {
      return [];
    }
    const numbers = [];
    for (let num = latestLocal + 1; num <= latestRemote; num++) {
      numbers.push(num);
    }
    return numbers;
  }

  /**
   * Busca concursos remotos pelos números.
   * Pode lançar se a fonte falhar.
   */
  _fetchContestsByNumbers(numbers) {
    return numbers.map((num) => this.contestSource.getByNumber(num));
  }
}
