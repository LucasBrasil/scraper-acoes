/**
 * Adaptador que busca dados de concursos da Mega-Sena do site Intersena.
 * Alternativa quando outras fontes estão bloqueadas.
 */
class IntersenaContestSource extends IContestSource {
  constructor(httpClient) {
    super();
    this.httpClient = httpClient || new HttpClient();
    this.baseUrl = 'https://www.intersena.com.br/megasena/resultados';
  }

  /**
   * Busca um concurso específico pelo número.
   */
  getByNumber(number) {
    Logger.log(`[IntersenaContestSource] Buscando concurso ${number}...`);
    const html = this.httpClient.get(this.baseUrl);
    return this._parseContestFromHtml(html, number);
  }

  /**
   * Busca o concurso mais recente.
   */
  getLatest() {
    Logger.log('[IntersenaContestSource] Buscando concurso mais recente...');
    const html = this.httpClient.get(this.baseUrl);
    return this._parseLatestFromHtml(html);
  }

  /**
   * Parse HTML para extrair o concurso mais recente.
   * Procura por QUALQUER sequência de 6 números válidos (1-60, únicos).
   */
  _parseLatestFromHtml(html) {
    Logger.log('[IntersenaContestSource] Analisando HTML para concurso mais recente...');

    const lines = html.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const numbers = line.match(/\b([1-9]|[1-5][0-9]|60)\b/g);
      if (numbers && numbers.length >= 7) {
        const contestNumber = Number(numbers[0]);
        const dezenas = numbers.slice(1, 7).map(Number);

        if (this._isValidDezenas(dezenas) && contestNumber > 1000 && contestNumber < 9999) {
          Logger.log(`[IntersenaContestSource] Concurso ${contestNumber} encontrado: ${dezenas}`);
          return new ContestDTO(contestNumber, new Date().toISOString().split('T')[0], dezenas);
        }
      }
    }

    throw new Error('Não foi possível extrair dados válidos do site Intersena');
  }

  /**
   * Parse HTML para extrair concurso específico.
   */
  _parseContestFromHtml(html, number) {
    Logger.log(`[IntersenaContestSource] Procurando concurso ${number}...`);

    const numberStr = String(number);
    const lines = html.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes(numberStr)) {
        const numbers = line.match(/\b([1-9]|[1-5][0-9]|60)\b/g);
        if (numbers && numbers.length >= 7) {
          const foundNumber = Number(numbers[0]);

          if (foundNumber === number) {
            const dezenas = numbers.slice(1, 7).map(Number);

            if (this._isValidDezenas(dezenas)) {
              Logger.log(`[IntersenaContestSource] Concurso ${number} encontrado: ${dezenas}`);
              return new ContestDTO(number, new Date().toISOString().split('T')[0], dezenas);
            }
          }
        }
      }
    }

    throw new Error(`Concurso ${number} não encontrado no site Intersena`);
  }

  /**
   * Valida se as dezenas estão corretas.
   */
  _isValidDezenas(dezenas) {
    if (!Array.isArray(dezenas) || dezenas.length !== 6) {
      return false;
    }

    const seen = new Set();
    for (const num of dezenas) {
      if (!Number.isInteger(num) || num < 1 || num > 60 || seen.has(num)) {
        return false;
      }
      seen.add(num);
    }

    Logger.log(`[IntersenaContestSource] Dezenas válidas: ${dezenas}`);
    return true;
  }
}
