// ===================================================================
// GOOGLE APPS SCRIPT - API DE MANUTENÇÕES
// ===================================================================
// 
// COMO USAR:
// 1. Abra seu Google Sheets
// 2. Vá em Extensões > Apps Script
// 3. Cole TODO este código
// 4. Clique em "Implantar" > "Nova implantação"
// 5. Tipo: "Aplicativo da Web"
// 6. Executar como: "Eu"
// 7. Quem tem acesso: "Qualquer pessoa"
// 8. Clique em "Implantar"
// 9. Copie a URL gerada
//
// ===================================================================

function doGet(e) {
  // IMPORTANTE: Configurar CORS para permitir requisições de qualquer origem
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    var params = e.parameter;
    var sheetName = params.sheet;
    var action = params.action;
    
    console.log('Parâmetros recebidos:', JSON.stringify(params));
    
    if (!sheetName) {
      throw new Error('Parâmetro "sheet" obrigatório');
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error('Planilha "' + sheetName + '" não encontrada');
    }
    
    // Se tem action, é uma operação de escrita
    if (action === 'add') {
      // Adicionar nova empresa
      return adicionarEmpresa(sheet, params);
    } else if (action === 'update') {
      // Atualizar manutenção
      return atualizarManutencao(sheet, params);
    } else {
      // Leitura normal - retornar todos os dados
      return lerDados(sheet);
    }
    
  } catch (error) {
    console.error('Erro:', error);
    output.setContent(JSON.stringify({
      error: true,
      message: error.toString()
    }));
    return output;
  }
}

// Função para ler dados da planilha
function lerDados(sheet) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  
  var result = [];
  
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var obj = {};
    
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      var value = row[j];
      
      // Converter datas para formato ISO
      if (value instanceof Date) {
        obj[header] = value.toISOString();
      } else {
        obj[header] = value;
      }
    }
    
    result.push(obj);
  }
  
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify(result));
  
  return output;
}

// Função para adicionar nova empresa
function adicionarEmpresa(sheet, params) {
  var cnpj = params.CNPJ;
  var razaoSocial = params.Razao_Social;
  var ativa = params.Ativa || 'SIM';
  
  // Adicionar nova linha
  sheet.appendRow([cnpj, razaoSocial, ativa]);
  
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify({
    success: true,
    message: 'Empresa adicionada com sucesso',
    data: {
      CNPJ: cnpj,
      Razao_Social: razaoSocial,
      Ativa: ativa
    }
  }));
  
  return output;
}

// Função para atualizar manutenção
function atualizarManutencao(sheet, params) {
  var cnpj = params.CNPJ;
  var atendidoPor = params.Atendido_Por || '';
  var dataAtendimento = params.Data_De_Atendimento || '';
  var acompanhadoPor = params.Acompanhado_Por || '';
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var cnpjIndex = headers.indexOf('CNPJ');
  
  if (cnpjIndex === -1) {
    throw new Error('Coluna CNPJ não encontrada');
  }
  
  // Procurar a linha com o CNPJ
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][cnpjIndex] == cnpj) {
      rowIndex = i + 1; // +1 porque sheet.getRange é 1-indexed
      break;
    }
  }
  
  if (rowIndex === -1) {
    throw new Error('CNPJ não encontrado: ' + cnpj);
  }
  
  // Atualizar os campos
  var atendidoPorIndex = headers.indexOf('Atendido_Por');
  var dataAtendimentoIndex = headers.indexOf('Data_De_Atendimento');
  var acompanhadoPorIndex = headers.indexOf('Acompanhado_Por');
  
  if (atendidoPorIndex !== -1 && atendidoPor) {
    sheet.getRange(rowIndex, atendidoPorIndex + 1).setValue(atendidoPor);
  }
  
  if (dataAtendimentoIndex !== -1 && dataAtendimento) {
    // Converter DD/MM/YYYY para Date
    var partes = dataAtendimento.split('/');
    if (partes.length === 3) {
      var dataObj = new Date(partes[2], partes[1] - 1, partes[0]);
      sheet.getRange(rowIndex, dataAtendimentoIndex + 1).setValue(dataObj);
    } else {
      sheet.getRange(rowIndex, dataAtendimentoIndex + 1).setValue(dataAtendimento);
    }
  }
  
  if (acompanhadoPorIndex !== -1 && acompanhadoPor) {
    sheet.getRange(rowIndex, acompanhadoPorIndex + 1).setValue(acompanhadoPor);
  }
  
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify({
    success: true,
    message: 'Manutenção atualizada com sucesso',
    data: {
      CNPJ: cnpj,
      Atendido_Por: atendidoPor,
      Data_De_Atendimento: dataAtendimento,
      Acompanhado_Por: acompanhadoPor
    }
  }));
  
  return output;
}

// Função POST (para compatibilidade futura)
function doPost(e) {
  // Redirecionar para doGet
  return doGet(e);
}
