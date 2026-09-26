/** Resultado consolidado do ablation study (4 configs × 2 janelas). */
class AblationBacktestResult {
  constructor(results) {
    this.results = results || [];
  }

  getTotalConfigurations() {
    const unique = new Set(this.results.map(r => r.configName));
    return unique.size;
  }

  getTotalWindows() {
    const unique = new Set(this.results.map(r => r.window));
    return unique.size;
  }

  getResultForConfig(configName, window) {
    return this.results.find(r => r.configName === configName && r.window === window);
  }

  compareConfigurations(window) {
    const windowResults = this.results.filter(r => r.window === window);
    if (windowResults.length === 0) return 'Sem resultados para esta janela';

    let output = `\n=== Comparação: ${window} ===\n`;

    windowResults.sort((a, b) => a.configName.localeCompare(b.configName));

    windowResults.forEach(r => {
      output += `${r.configName}: média=${r.averageHits.toFixed(2)}, ` +
                `>=3=${r.percent3Plus}%, >=4=${r.percent4Plus}%, ` +
                `>=5=${r.percent5Plus}%, 6=${r.percent6}%\n`;
    });

    return output;
  }

  summary() {
    let output = '=== Ablation Study Consolidado ===\n';
    output += `Configurações: ${this.getTotalConfigurations()}\n`;
    output += `Janelas: ${this.getTotalWindows()}\n\n`;

    const windows = [...new Set(this.results.map(r => r.window))].sort();

    windows.forEach(window => {
      output += this.compareConfigurations(window);
    });

    return output;
  }

  printDetailed() {
    let output = '=== Detalhes Completos ===\n\n';

    this.results.sort((a, b) => {
      if (a.configName !== b.configName) return a.configName.localeCompare(b.configName);
      return a.window.localeCompare(b.window);
    });

    this.results.forEach((r, index) => {
      output += r.fullSummary();
      if (index < this.results.length - 1) output += '\n\n';
    });

    return output;
  }
}
