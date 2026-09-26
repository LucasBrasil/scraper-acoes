/** Contrato de leitura de parâmetros operacionais da planilha Config. */
class IConfigRepository {
  getAll() {
    throw new Error('IConfigRepository.getAll deve ser implementado.');
  }

  getCandidateCount() {
    throw new Error('IConfigRepository.getCandidateCount deve ser implementado.');
  }
}
