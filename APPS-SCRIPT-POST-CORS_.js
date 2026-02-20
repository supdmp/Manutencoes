// ===================================================================
// GOOGLE APPS SCRIPT - API COM CORS E POST HABILITADOS
// ===================================================================
// 
// PASSO A PASSO COMPLETO:
// 
// 1. ABRIR APPS SCRIPT:
//    - Abra seu Google Sheets
//    - Vá em: Extensões > Apps Script
//    - Apague todo código existente
//    - Cole TODO este código
//    - Salve (Ctrl + S)
//
// 2. IMPLANTAR:
//    - Clique em "Implantar" (canto superior direito)
//    - Selecione "Nova implantação"
//    - Clique no ícone de engrenagem ⚙️ ao lado de "Selecionar tipo"
//    - Escolha "Aplicativo da Web"
//    
// 3. CONFIGURAÇÕES DA IMPLANTAÇÃO:
//    ✅ Descrição: "API de Manutenções"
//    ✅ Executar como: "Eu" (sua conta do Google)
//    ✅ Quem tem acesso: "Qualquer pessoa"
//    
// 4. IMPLANTAR:
//    - Clique em "Implantar"
//    - Autorize as permissões solicitadas
//    - Copie a URL que aparece (exemplo: https://script.google.com/.../exec)
//    
// 5. IMPORTANTE:
//    - Use a URL que termina com /exec (NÃO use /dev)
//    - Cole esta URL no arquivo config.js do seu sistema
//
// ===================================================================

// FUNÇÃO PRINCIPAL - GET
function doGet(e) {
  try {
    var params = e.parameter;
    var sheetName = params.sheet;
    
    if (!sheetName) {
      return createResponse({
        error: true,
        message: 'Parâmetro "sheet" obrigatório'
      });
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return createResponse({
        error: true,
        message: 'Planilha "' + sheetName + '" não encontrada'
      });
    }
    
    // Retornar todos os dados da planilha
    return lerDados(sheet);
    
  } catch (error) {
    return createResponse({
      error: true,
      message: error.toString()
    });
  }
}

// FUNÇÃO PRINCIPAL - POST (COM CORS HABILITADO)
function doPost(e) {
  try {
    // Parse do JSON enviado
    var requestData = JSON.parse(e.postData.contents);
    
    Logger.log('POST recebido: ' + JSON.stringify(requestData));
    
    var sheetName = requestData.sheet || e.parameter.sheet;
    var action = requestData.action;
    
    if (!sheetName) {
      return createResponse({
        error: true,
        message: 'Parâmetro "sheet" obrigatório'
      });
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return createResponse({
        error: true,
        message: 'Planilha "' + sheetName + '" não encontrada'
      });
    }
    
    // Executar ação
    if (action === 'add') {
      return adicionarEmpresa(sheet, requestData);
    } else if (action === 'update') {
      return atualizarManutencao(sheet, requestData);
    } else {
      return createResponse({
        error: true,
        message: 'Action inválida: ' + action
      });
    }
    
  } catch (error) {
    Logger.log('Erro no POST: ' + error);
    return createResponse({
      error: true,
      message: error.toString()
    });
  }
}

// CRIAR RESPOSTA COM CORS HABILITADO
function createResponse(data) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify(data));
  
  // NÃO adicione headers aqui - Google Apps Script não suporta
  // CORS é habilitado automaticamente quando você implanta como "Qualquer pessoa"
  
  return output;
}

// LER DADOS DA PLANILHA
function lerDados(sheet) {
  var data = sheet.getDataRange().getValues();
  
  if (data.length === 0) {
    return createResponse([]);
  }
  
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
  
  return createResponse(result);
}

// ADICIONAR NOVA EMPRESA
function adicionarEmpresa(sheet, data) {
  try {
    var cnpj = data.CNPJ;
    var razaoSocial = data.Razao_Social;
    var ativa = data.Ativa || 'SIM';
    
    Logger.log('Adicionando empresa: ' + razaoSocial);
    
    // Verificar se já existe
    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    var cnpjIndex = headers.indexOf('CNPJ');
    
    if (cnpjIndex !== -1) {
      for (var i = 1; i < allData.length; i++) {
        if (allData[i][cnpjIndex] == cnpj) {
          return createResponse({
            error: true,
            message: 'CNPJ já cadastrado'
          });
        }
      }
    }
    
    // Adicionar nova linha
    sheet.appendRow([cnpj, razaoSocial, ativa]);
    
    return createResponse({
      success: true,
      message: 'Empresa adicionada com sucesso',
      data: {
        CNPJ: cnpj,
        Razao_Social: razaoSocial,
        Ativa: ativa
      }
    });
    
  } catch (error) {
    Logger.log('Erro ao adicionar empresa: ' + error);
    return createResponse({
      error: true,
      message: error.toString()
    });
  }
}

// ATUALIZAR MANUTENÇÃO
function atualizarManutencao(sheet, data) {
  try {
    var cnpj = data.CNPJ;
    var atendidoPor = data.Atendido_Por || '';
    var dataAtendimento = data.Data_De_Atendimento || '';
    var acompanhadoPor = data.Acompanhado_Por || '';
    
    Logger.log('Atualizando manutenção - CNPJ: ' + cnpj);
    
    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    var cnpjIndex = headers.indexOf('CNPJ');
    
    if (cnpjIndex === -1) {
      return createResponse({
        error: true,
        message: 'Coluna CNPJ não encontrada'
      });
    }
    
    // Procurar a linha com o CNPJ
    var rowIndex = -1;
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][cnpjIndex] == cnpj) {
        rowIndex = i + 1; // +1 porque getRange é 1-indexed
        break;
      }
    }
    
    if (rowIndex === -1) {
      return createResponse({
        error: true,
        message: 'CNPJ não encontrado: ' + cnpj
      });
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
    
    return createResponse({
      success: true,
      message: 'Manutenção atualizada com sucesso',
      data: {
        CNPJ: cnpj,
        Atendido_Por: atendidoPor,
        Data_De_Atendimento: dataAtendimento,
        Acompanhado_Por: acompanhadoPor
      }
    });
    
  } catch (error) {
    Logger.log('Erro ao atualizar: ' + error);
    return createResponse({
      error: true,
      message: error.toString()
    });
  }
}

// ===================================================================
// NOTAS IMPORTANTES:
// ===================================================================
// 
// 1. CORS É HABILITADO AUTOMATICAMENTE:
//    - Quando você implanta como "Qualquer pessoa"
//    - Google Apps Script adiciona os headers CORS automaticamente
//    - Você NÃO precisa adicionar headers manualmente
//
// 2. TESTE A API:
//    GET:  https://script.google.com/.../exec?sheet=fevereiro-2026
//    POST: Use Postman ou seu frontend
//
// 3. LOGS:
//    - Vá em: Execuções > Ver logs
//    - Veja todos os Logger.log() aqui
//
// 4. PERMISSÕES:
//    - Na primeira execução, autorize as permissões
//    - Isso permite o script acessar suas planilhas
//
// 5. URL:
//    - Use a URL que termina com /exec
//    - NÃO use /dev (apenas para desenvolvimento)
//
// ===================================================================
