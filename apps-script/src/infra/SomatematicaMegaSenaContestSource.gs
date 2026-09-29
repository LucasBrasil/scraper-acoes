/**
 * Adaptador que busca dados de concursos da Mega-Sena do site Só Matemática.
 * Alternativa quando a API oficial da Caixa está bloqueada.
 */
class SomatematicaMegaSenaContestSource extends IContestSource {
  constructor(httpClient) {
    super();
    this.httpClient = httpClient || new HttpClient();
    this.baseUrl = 'https://www.somatematica.com.br/megasenaResultados.php';
  }

  /**
   * Busca um concurso específico pelo número.
   */
  getByNumber(number) {
    const html = this.httpClient.get(this.baseUrl);
    return this._parseContestFromHtml(html, number);
  }

  /**
   * Busca o concurso mais recente.
   */
  getLatest() {
    const html = this.httpClient.get(this.baseUrl);
    return this._parseLatestFromHtml(html);
  }

  /**
   * Parse HTML para extrair o concurso mais recente.
   */
  _parseLatestFromHtml(html) {
    const contestRegex = /Concurso (\d+)[\s\S]*?Dezenas[:\s]*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/i;
    const match = html.match(contestRegex);

    if (!match) {
      throw new Error('Não foi possível extrair dados do concurso mais recente do site Só Matemática');
    }

    const number = Number(match[1]);
    const dezenas = [
      Number(match[2]),
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6]),
      Number(match[7])
    ];

    return new ContestDTO(number, new Date().toISOString().split('T')[0], dezenas);
  }

  /**
   * Parse HTML para extrair concurso específico.
   */
  _parseContestFromHtml(html, number) {
    const escapedNumber = String(number).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const contestRegex = new RegExp(
      `Concurso ${escapedNumber}[\\s\\S]*?Dezenas[:\\s]*(\\d+)\\s+(\\d+)\\s+(\\d+)\\s+(\\d+)\\s+(\\d+)\\s+(\\d+)`,
      'i'
    );

    const match = html.match(contestRegex);

    if (!match) {
      throw new Error(`Concurso ${number} não encontrado no site Só Matemática`);
    }

    const dezenas = [
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6])
    ];

    return new ContestDTO(number, new Date().toISOString().split('T')[0], dezenas);
  }
}
