/**
 * Engine pura de sincronização do histórico.
 * Compara concursos locais com remotos e gera um plano determinístico.
 *
 * Não acessa planilhas, repositórios ou redes. Apenas compara dados.
 */
class HistorySyncEngine {
  /**
   * Compara concursos locais com remotos e gera um plano.
   *
   * @param localNumbers array de números de concurso (inteiros) ou array de Contest
   * @param remoteContests array de ContestDTO
   * @returns HistorySyncPlan
   *
   * A entrada não é modificada. O plano é determinístico.
   */
  static compare(localNumbers, remoteContests) {
    if (!Array.isArray(localNumbers)) {
      throw new Error('localNumbers deve ser um array.');
    }
    if (!Array.isArray(remoteContests)) {
      throw new Error('remoteContests deve ser um array.');
    }

    const localSet = HistorySyncEngine._extractLocalNumbers(localNumbers);
    const remoteByNumber = HistorySyncEngine._indexRemoteByNumber(remoteContests);

    const toInsert = [];
    const alreadyPresent = [];
    const conflicts = [];

    remoteContests.forEach((remote) => {
      if (!localSet.has(remote.number)) {
        toInsert.push(remote);
      } else {
        alreadyPresent.push(remote.number);
      }
    });

    return new HistorySyncPlan(toInsert, alreadyPresent, conflicts);
  }

  /**
   * Compara concursos locais com remotos, detectando conflitos de conteúdo.
   *
   * @param localContests array de Contest
   * @param remoteContests array de ContestDTO
   * @returns HistorySyncPlan
   *
   * Conflito: mesmo número mas dados diferentes (data ou dezenas).
   */
  static compareWithConflictDetection(localContests, remoteContests) {
    if (!Array.isArray(localContests)) {
      throw new Error('localContests deve ser um array.');
    }
    if (!Array.isArray(remoteContests)) {
      throw new Error('remoteContests deve ser um array.');
    }

    const localByNumber = HistorySyncEngine._indexLocalByNumber(localContests);
    const seenRemoteNumbers = new Set();
    const toInsert = [];
    const alreadyPresent = [];
    const conflicts = [];

    remoteContests.forEach((remote) => {
      seenRemoteNumbers.add(remote.number);

      if (!localByNumber.has(remote.number)) {
        toInsert.push(remote);
      } else {
        const local = localByNumber.get(remote.number);
        if (HistorySyncEngine._hasDifference(local, remote)) {
          conflicts.push({
            number: remote.number,
            local: local,
            remote: remote,
            reason: 'conteúdo diferente'
          });
        } else {
          alreadyPresent.push(remote.number);
        }
      }
    });

    return new HistorySyncPlan(toInsert, alreadyPresent, conflicts);
  }

  /**
   * Extrai números de concurso da entrada, que pode ser um array de números ou Contest.
   */
  static _extractLocalNumbers(input) {
    const numbers = new Set();

    input.forEach((item) => {
      if (typeof item === 'number') {
        numbers.add(item);
      } else if (item instanceof Contest) {
        numbers.add(item.number);
      } else {
        throw new Error(`Elemento inválido em localNumbers: ${JSON.stringify(item)}`);
      }
    });

    return numbers;
  }

  /**
   * Cria um mapa de números para Contest, detectando duplicados.
   */
  static _indexLocalByNumber(contests) {
    const map = new Map();

    contests.forEach((contest) => {
      if (map.has(contest.number)) {
        throw new Error(`Concurso duplicado no histórico local: ${contest.number}`);
      }
      map.set(contest.number, contest);
    });

    return map;
  }

  /**
   * Cria um mapa de números para ContestDTO, detectando duplicados.
   */
  static _indexRemoteByNumber(dtos) {
    const map = new Map();

    dtos.forEach((dto) => {
      if (map.has(dto.number)) {
        throw new Error(`Concurso duplicado na origem remota: ${dto.number}`);
      }
      map.set(dto.number, dto);
    });

    return map;
  }

  /**
   * Compara um Contest local com um ContestDTO remoto.
   * Conflito: data ou dezenas diferentes.
   */
  static _hasDifference(local, remote) {
    if (!local.date || !remote.dateString) {
      return false;
    }

    const localDateString = HistorySyncEngine._dateToComparisonString(local.date);
    const remoteDateString = remote.dateString;

    if (localDateString !== remoteDateString) {
      return true;
    }

    if (local.drawnNumbers.length !== remote.drawnNumbers.length) {
      return true;
    }

    for (let i = 0; i < local.drawnNumbers.length; i++) {
      if (local.drawnNumbers[i] !== remote.drawnNumbers[i]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Converte uma Date para string no formato dd/MM/yyyy para comparação.
   * Usa o componente de data normalizado, não hora.
   */
  static _dateToComparisonString(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
