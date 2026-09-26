const fs = require('fs');
const path = require('path');

// Timezone info
const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
const tzOffset = new Date().getTimezoneOffset();
console.log(`Fuso: ${tzName} (offset ${tzOffset} min)`);

// Load configuration
const loadOrder = require('./loadOrder.js');
console.log(`Arquivos carregados: ${loadOrder.productionFiles.length} de producao, ${loadOrder.testFiles.length} de teste\n`);

// Global test counter
let totalPassed = 0;
let totalFailed = 0;
let passedRunners = 0;
let failedRunners = [];

// Stub the global functions that tests need
global.Logger = {
  log: function(msg) {
    // Silent
  }
};

global.SpreadsheetApp = {};
global.MS_CONFIG = {
  SYNDICATE_GAMES_SHEET_NAME: 'Jogos Bolão',
  SELECTED_COLOR: '#FFFF00',
  HIT_COLOR: '#CCCCCC'
};

// Load and execute test files
loadOrder.runners.forEach(runner => {
  try {
    // Load the test file
    const testPath = path.join(__dirname, runner.file.replace('tests/', ''));
    const testContent = fs.readFileSync(testPath, 'utf8');
    
    // Create a function context and evaluate
    const func = eval('(function() { ' + testContent + '; return ' + runner.name + '; })()');
    
    // Execute the test
    func();
    
    // Count passed
    totalPassed += runner.cases.length;
    passedRunners++;
    console.log(`OK   ${runner.name} (${runner.cases.length} casos)`);
    
  } catch (error) {
    // Count failed
    totalFailed += runner.cases.length;
    failedRunners.push({
      name: runner.name,
      file: runner.file,
      cases: runner.cases,
      error: error.message
    });
    
    console.log(`FALHOU ${runner.name} (${runner.cases.length} casos)`);
    console.log(`       arquivo: ${runner.file}`);
    console.log(`       erro:    ${error.message}`);
    runner.cases.forEach(c => console.log(`       - ${c}`));
  }
});

const totalTests = totalPassed + totalFailed;
console.log(`\n${totalPassed}/${totalTests} testes passaram (${passedRunners}/${loadOrder.runners.length} runners).`);

process.exit(failedRunners.length > 0 ? 1 : 0);
