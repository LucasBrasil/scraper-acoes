/**
 * Cliente HTTP que encapsula UrlFetchApp.
 * Puro: não contém regra de negócio, apenas comunicação de rede.
 */
class HttpClient {
  constructor(urlFetchApp) {
    this.urlFetchApp = urlFetchApp || UrlFetchApp;
  }

  /**
   * Faz GET request e retorna o corpo da resposta como string.
   * Lança se HTTP status for ≥ 400.
   */
  get(url) {
    let response;
    try {
      response = this.urlFetchApp.fetch(url, { muteHttpExceptions: true });
    } catch (error) {
      throw new Error(`HttpClient falhou ao fazer GET ${url}: ${error.message}`);
    }

    const statusCode = response.getResponseCode();
    if (statusCode >= 400) {
      throw new Error(`HTTP ${statusCode} em GET ${url}`);
    }

    return response.getContentText();
  }
}
