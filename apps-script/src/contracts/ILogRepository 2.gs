/** Contrato de persistência dos logs de execução. */
class ILogRepository {
  append(entry) {
    throw new Error('ILogRepository.append deve ser implementado.');
  }
}
