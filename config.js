// Calcular mês/ano atual
const dataAtual = new Date();
const meses = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];
const mes = meses[dataAtual.getMonth()];
const ano = dataAtual.getFullYear();
const mesAno = `${mes}-${ano}`;

// Configuração da API do Google Sheets
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbz7Szd7Ry3GDIFo8szPqr9A65EfpS2pAxOFXmmMsuy0wTXntC6W9xDLDR2RYiYl0Okp/exec',
  SHEETS: {
    EMPRESAS: mesAno,  // Planilha do mês atual (ex: "fevereiro-2026")
    USUARIOS: 'Usuarios'
  }
};

console.log('Mês/Ano atual:', mesAno);
console.log('Planilha de empresas:', CONFIG.SHEETS.EMPRESAS);
console.log('✓ config.js carregado');

// =====================================================
// INSTRUÇÕES DE USO
// =====================================================
// 
// CONFIGURAÇÃO DO GOOGLE APPS SCRIPT:
// 
// 1. Abra seu Google Sheets
// 2. Vá em: Extensões > Apps Script
// 3. Cole o código do arquivo: APPS-SCRIPT-COMPLETO.js
// 4. Salve (Ctrl + S)
// 5. Clique em "Implantar" > "Nova implantação"
// 6. Tipo: "Aplicativo da Web"
// 7. Executar como: "Eu"
// 8. Quem tem acesso: "Qualquer pessoa"
// 9. Clique em "Implantar"
// 10. Copie a URL gerada
// 11. Cole aqui na linha API_URL acima
//
// IMPORTANTE:
// - Use a URL que termina com /exec
//
// ESTRUTURA DAS PLANILHAS:
//    
// Planilha do mês atual (ex: "fevereiro-2026"):
// - CNPJ
// - Razao_Social
// - Atendido_Por
// - Data_De_Atendimento
// - Acompanhado_Por
//
// Planilha "empresas":
// - CNPJ
// - Razao_Social
// - Ativa
//
// Planilha "Usuarios":
// - Id
// - Nome
// - Email
// - Senha
//
// =====================================================
