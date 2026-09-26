/**
 * Regra única de interpretação de datas do MS Analytics.
 *
 * Toda data válida é reduzida à meia-noite local do fuso do projeto
 * (`America/Sao_Paulo`, declarado em `appsscript.json`). Esse é o mesmo valor que o
 * Google Sheets devolve para uma célula de data, portanto a leitura da planilha não
 * sofre nenhuma conversão.
 *
 * Duas garantias sustentam o restante do sistema:
 *
 * 1. Nenhuma string é entregue ao parser automático do JavaScript. `new Date(texto)`
 *    depende de implementação e de regionalização, e trata `'1996-03-11'` como UTC e
 *    `'11/03/1996'` como mês/dia. Aqui todo formato é reconhecido por expressão
 *    regular e reconstruído componente a componente.
 * 2. Entradas equivalentes produzem exatamente o mesmo instante. `'11/03/1996'`,
 *    `'1996-03-11'`, `'1996-03-11T00:00:00.000Z'` e `new Date(1996, 2, 11)` resultam
 *    no mesmo `getTime()`.
 *
 * A data de um concurso é uma data de calendário, não um instante. Por isso, em
 * ISO 8601 apenas os componentes de data são lidos: hora e fuso da string são
 * ignorados, evitando que um sorteio seja deslocado para o dia anterior por causa da
 * conversão de fuso da origem.
 *
 * Plausibilidade (data anterior ao primeiro sorteio ou no futuro) não é tratada aqui:
 * é responsabilidade da validação de integridade do Histórico, que relata em vez de
 * interromper.
 */
class DateNormalizer {
  /**
   * Devolve a data normalizada à meia-noite local ou lança quando a entrada é inválida.
   * `errorPrefix` permite que o chamador preserve sua própria mensagem de erro.
   */
  static normalize(value, errorPrefix) {
    const parts = DateNormalizer._extractParts(value);
    const normalizedDate = parts === null ? null : DateNormalizer._toLocalMidnight(parts);

    if (normalizedDate === null) {
      throw new Error(`${errorPrefix || 'A data é inválida'}: ${value}`);
    }

    return normalizedDate;
  }

  /** Reduz qualquer entrada aceita a componentes de calendário, ou `null`. */
  static _extractParts(value) {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        return null;
      }
      return { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() };
    }

    if (typeof value === 'string') {
      return DateNormalizer._extractPartsFromText(value.trim());
    }

    return null;
  }

  /** Reconhece os formatos textuais aceitos sem recorrer ao parser do JavaScript. */
  static _extractPartsFromText(text) {
    // dd/MM/yyyy
    const dayFirst = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dayFirst) {
      return { year: Number(dayFirst[3]), month: Number(dayFirst[2]), day: Number(dayFirst[1]) };
    }

    // yyyy-MM-dd
    const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDate) {
      return { year: Number(isoDate[1]), month: Number(isoDate[2]), day: Number(isoDate[3]) };
    }

    // ISO 8601 com hora; a parte de hora e o fuso são intencionalmente descartados.
    const isoDateTime = text.match(/^(\d{4})-(\d{2})-(\d{2})T/);
    if (isoDateTime) {
      return { year: Number(isoDateTime[1]), month: Number(isoDateTime[2]), day: Number(isoDateTime[3]) };
    }

    return null;
  }

  /**
   * Constrói a data local e confirma que ela representa exatamente os componentes
   * recebidos. O JavaScript transborda meses e dias inexistentes — `31/11` viraria
   * `01/12` —, então a comparação de volta é o que rejeita datas impossíveis.
   * Ela também descarta anos de dois dígitos, que o construtor mapearia para 19xx.
   */
  static _toLocalMidnight(parts) {
    if (!DateNormalizer._areValidParts(parts)) {
      return null;
    }

    const date = new Date(parts.year, parts.month - 1, parts.day);
    const matchesParts = date.getFullYear() === parts.year
      && date.getMonth() === parts.month - 1
      && date.getDate() === parts.day;

    return matchesParts ? date : null;
  }

  /** Valida os limites de ano, mês e dia antes de qualquer construção de data. */
  static _areValidParts(parts) {
    return [parts.year, parts.month, parts.day].every((part) => Number.isInteger(part))
      && parts.year >= 1
      && parts.month >= 1
      && parts.month <= 12
      && parts.day >= 1
      && parts.day <= 31;
  }
}
