/** Registra o resultado de cada etapa sem conhecer detalhes de planilha. */
class PipelineLogger {
  constructor(logRepository) {
    this.logRepository = logRepository;
  }

  log(entry) {
    this.logRepository.append(entry);
  }
}
