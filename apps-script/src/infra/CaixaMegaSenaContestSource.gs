/**
 * Adaptador que busca dados de concursos da API da CAIXA Econômica Federal.
 * Isola completamente o formato JSON em um único lugar.
 */
class CaixaMegaSenaContestSource extends IContestSource {
  constructor(httpClient, baseUrl) {
    super();
    this.httpClient = httpClient || new HttpClient();
    this.baseUrl = baseUrl || 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena';
  }

  /**
   * Busca um concurso específico pelo número.
   */
  getByNumber(number) {
    const url = `${this.baseUrl}/${number}`;
    const responseText = this.httpClient.get(url);
    return this._parseResponse(responseText);
  }

  /**
   * Busca o concurso mais recente.
   */
  getLatest() {
    const responseText = this.httpClient.get(this.baseUrl);
    return this._parseResponse(responseText);
  }

  /**
   * Analisa a resposta JSON e mapeia para ContestDTO.
   * Isola completamente a estrutura da API CAIXA.
   */
  _parseResponse(responseText) {
    let json;
    try {
      json = JSON.parse(responseText);
    } catch (error) {
      throw new Error(`Resposta inválida da CAIXA: ${error.message}`);
    }

    return this._mapToContestDTO(json);
  }

  /**
   * Mapeia o JSON da CAIXA para ContestDTO.
   * Este é o único lugar onde a estrutura da CAIXA é conhecida.
   */
  _mapToContestDTO(json) {
    if (!json.numero || !json.dataApuracao || !json.listaDezenas) {
      throw new Error('Resposta CAIXA não contém os campos necessários: numero, dataApuracao, listaDezenas.');
    }

    const number = Number(json.numero);
    const dateString = String(json.dataApuracao);
    const drawnNumbers = json.listaDezenas.map((str) => Number(str));

    if (!Number.isInteger(number) || number <= 0) {
      throw new Error(`Número de concurso inválido: ${json.numero}`);
    }

    if (drawnNumbers.length !== 6) {
      throw new Error(`Esperado 6 dezenas, recebido ${drawnNumbers.length}`);
    }

    return new ContestDTO(number, dateString, drawnNumbers);
  }
}
