/** Metadados estáveis de um critério, independentes de sua configuração na planilha. */
class CriterionDefinition {
  constructor(id, name, description, version, priority) {
    if (!id || !name || !description || !version || !(priority instanceof CriterionPriority)) {
      throw new Error('A definição do critério é inválida.');
    }
    this.id = id;
    this.name = name;
    this.description = description;
    this.version = version;
    this.priority = priority;
  }
}
