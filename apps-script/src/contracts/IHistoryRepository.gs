/** Contrato de acesso ao histórico de concursos. */
class IHistoryRepository {
  getAll() {
    throw new Error('IHistoryRepository.getAll deve ser implementado.');
  }

  save(contest) {
    throw new Error('IHistoryRepository.save deve ser implementado.');
  }

  getLatestContestNumber() {
    throw new Error('IHistoryRepository.getLatestContestNumber deve ser implementado.');
  }

  getContestNumbers() {
    throw new Error('IHistoryRepository.getContestNumbers deve ser implementado.');
  }

  saveAll(contests) {
    throw new Error('IHistoryRepository.saveAll deve ser implementado.');
  }
}
