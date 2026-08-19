/** Catálogo dos critérios disponíveis para execução. */
class CriteriaRegistry {
  getAll() {
    return [new LowestSequenceCriterion()]
      .sort((first, second) => first.getDefinition().priority.value - second.getDefinition().priority.value);
  }
}
