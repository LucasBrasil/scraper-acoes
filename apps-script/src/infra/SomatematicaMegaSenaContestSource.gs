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
    Logger.log(`[SomatematicaMegaSenaContestSource] Buscando concurso ${number}...`);
    const html = this.httpClient.get(this.baseUrl);
    return this._parseContestFromHtml(html, number);
  }

  /**
   * Busca o concurso mais recente.
   */
  getLatest() {
    Logger.log('[SomatematicaMegaSenaContestSource] Buscando concurso mais recente...');
    const html = this.httpClient.get(this.baseUrl);
    return this._parseLatestFromHtml(html);
  }

  /**
   * Parse HTML para extrair o concurso mais recente.
   * Tenta múltiplos padrões para ser robusto.
   */
  _parseLatestFromHtml(html) {
    Logger.log('[SomatematicaMegaSenaContestSource] Analisando HTML...');

    const patterns = [
      /Concurso[:\s]+(\d+)[^0-9]*(\d+)[^0-9]+(\d+)[^0-9]+(\d+)[^0-9]+(\d+)[^0-9]+(\d+)[^0-9]+(\d+)/i,
      /concurso\s+(\d{4})[^0-9]*(\d{1,2})[^0-9]+(\d{1,2})[^0-9]+(\d{1,2})[^0-9]+(\d{1,2})[^0-9]+(\d{1,2})[^0-9]+(\d{1,2})/i,
      /(\d{4})[^0-9]*(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        Logger.log(`[SomatematicaMegaSenaContestSource] Padrão encontrado: ${match[0].substring(0, 50)}`);
        const number = Number(match[1]);
        const dezenas = [
          Number(match[2]),
          Number(match[3]),
          Number(match[4]),
          Number(match[5]),
          Number(match[6]),
          Number(match[7])
        ];

        Logger.log(`[SomatematicaMegaSenaContestSource] Concurso ${number}: ${dezenas}`);
        return new ContestDTO(number, new Date().toISOString().split('T')[0], dezenas);
      }
    }

    throw new Error('Não foi possível extrair dados do concurso mais recente do site Só Matemática');
  }

  /**
   * Parse HTML para extrair concurso específico.
   */
  _parseContestFromHtml(html, number) {
    Logger.log(`[SomatematicaMegaSenaContestSource] Procurando concurso ${number}...`);

    const patterns = [
      new RegExp(`Concurso[:\\s]+${number}[^0-9]*(\\d+)[^0-9]+(\\d+)[^0-9]+(\\d+)[^0-9]+(\\d+)[^0-9]+(\\d+)[^0-9]+(\\d+)`, 'i'),
      new RegExp(`${number}[^0-9]*(\\d{1,2})[^0-9]+(\\d{1,2})[^0-9]+(\\d{1,2})[^0-9]+(\\d{1,2})[^0-9]+(\\d{1,2})[^0-9]+(\\d{1,2})`)
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        Logger.log(`[SomatematicaMegaSenaContestSource] Concurso ${number} encontrado`);
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

    throw new Error(`Concurso ${number} não encontrado no site Só Matemática`);
  }
}
