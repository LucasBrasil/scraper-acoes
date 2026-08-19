/**
 * Contrato para fontes de dados de concursos.
 * Permite múltiplas implementações sem acoplamento à origem (API, arquivo, etc).
 */
class IContestSource {
  /**
   * Busca um concurso específico pelo número.
   * Retorna ContestDTO ou lança se não encontrado.
   */
  getByNumber(number) {
    throw new Error('IContestSource.getByNumber deve ser implementado.');
  }

  /**
   * Busca o concurso mais recente.
   * Retorna ContestDTO ou lança se nenhum encontrado.
   */
  getLatest() {
    throw new Error('IContestSource.getLatest deve ser implementado.');
  }
}
