function doOptions(e) {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "3600"
    });
}

// ===================================================================
// FUNÇÃO AUXILIAR - CRIAR RESPOSTA COM CORS
// ===================================================================
function json(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  
  // Adiciona headers CORS
  // (pode não funcionar sempre, mas não faz mal tentar)
  try {
    output.setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
  } catch (e) {
    Logger.log("Aviso: não foi possível adicionar headers: " + e);
  }
  
  return output;
}

// ===================================================================
// FUNÇÃO GET - LEITURA DE DADOS
// ===================================================================
function doGet(e) {
  try {
    var params = e.parameter;
    var sheetName = params.sheet;
    
    Logger.log('GET - Sheet: ' + sheetName);
    
    if (!sheetName) {
      return json({
        error: true,
        message: 'Parâmetro "sheet" obrigatório'
      });
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return json({
        error: true,
        message: 'Planilha "' + sheetName + '" não encontrada'
      });
    }
    
    // Retornar dados
    return lerDados(sheet);
    
  } catch (error) {
    Logger.log('Erro no GET: ' + error);
    return json({
      error: true,
      message: error.toString()
    });
  }
}

// ===================================================================
// FUNÇÃO POST - ESCRITA DE DADOS
// ===================================================================
function doPost(e) {
  try {
    Logger.log('POST recebido');
    Logger.log('postData: ' + JSON.stringify(e.postData));
    
    // Parse do JSON enviado
    var requestData;
    
    if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    } else {
      return json({
        error: true,
        message: 'Nenhum dado recebido no POST'
      });
    }
    
    Logger.log('Dados parseados: ' + JSON.stringify(requestData));
    
    var sheetName = requestData.sheet || e.parameter.sheet;
    var action = requestData.action;
    
    if (!sheetName) {
      return json({
        error: true,
        message: 'Parâmetro "sheet" obrigatório'
      });
    }
    
    if (!action) {
      return json({
        error: true,
        message: 'Parâmetro "action" obrigatório'
      });
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return json({
        error: true,
        message: 'Planilha "' + sheetName + '" não encontrada'
      });
    }
    
    // Executar ação
    if (action === 'add') {
      return adicionarRegistro(sheet, requestData);
    } else if (action === 'update') {
      return atualizarRegistro(sheet, requestData);
    } else if (action === 'updatePassword') {
      return atualizarSenhaUsuario(sheet, requestData);
    } else {
      return json({
        error: true,
        message: 'Action inválida: ' + action + '. Use "add", "update" ou "updatePassword"'
      });
    }
    
  } catch (error) {
    Logger.log('Erro no POST: ' + error);
    return json({
      error: true,
      message: error.toString()
    });
  }
}

// ===================================================================
// LER DADOS DA PLANILHA
// ===================================================================
function lerDados(sheet) {
  var data = sheet.getDataRange().getValues();
  
  if (data.length === 0) {
    return json([]);
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
  
  return json(result);
}

// ===================================================================
// ADICIONAR NOVO REGISTRO
// ===================================================================
function adicionarRegistro(sheet, data) {
  try {
    Logger.log('Adicionando registro: ' + JSON.stringify(data));
    
    var cnpj = data.CNPJ;
    var razaoSocial = data.Razao_Social;
    var ativa = data.Ativa || 'SIM';
    
    if (!cnpj) {
      return json({
        error: true,
        message: 'Campo CNPJ obrigatório'
      });
    }
    
    if (!razaoSocial) {
      return json({
        error: true,
        message: 'Campo Razao_Social obrigatório'
      });
    }
    
    // Verificar se já existe
    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    var cnpjIndex = headers.indexOf('CNPJ');
    
    if (cnpjIndex !== -1) {
      for (var i = 1; i < allData.length; i++) {
        if (allData[i][cnpjIndex] == cnpj) {
          return json({
            error: true,
            message: 'CNPJ já cadastrado: ' + cnpj
          });
        }
      }
    }
    
    // Adicionar nova linha
    sheet.appendRow([cnpj, razaoSocial, ativa]);
    
    Logger.log('Registro adicionado com sucesso');
    
    return json({
      success: true,
      message: 'Registro adicionado com sucesso',
      data: {
        CNPJ: cnpj,
        Razao_Social: razaoSocial,
        Ativa: ativa
      }
    });
    
  } catch (error) {
    Logger.log('Erro ao adicionar: ' + error);
    return json({
      error: true,
      message: error.toString()
    });
  }
}

// ===================================================================
// ATUALIZAR REGISTRO EXISTENTE
// ===================================================================
function atualizarRegistro(sheet, data) {
  try {
    Logger.log('Atualizando registro: ' + JSON.stringify(data));
    
    var cnpj = data.CNPJ;
    
    if (!cnpj) {
      return json({
        error: true,
        message: 'Campo CNPJ obrigatório para atualização'
      });
    }
    
    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    var cnpjIndex = headers.indexOf('CNPJ');
    
    if (cnpjIndex === -1) {
      return json({
        error: true,
        message: 'Coluna CNPJ não encontrada na planilha'
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
      return json({
        error: true,
        message: 'CNPJ não encontrado: ' + cnpj
      });
    }
    
    // Atualizar campos fornecidos
    var updated = {};
    
    for (var key in data) {
      if (key !== 'sheet' && key !== 'action' && key !== 'CNPJ') {
        var colIndex = headers.indexOf(key);
        
        if (colIndex !== -1) {
          var value = data[key];
          
          // Converter data DD/MM/YYYY para Date se necessário
          if (key.indexOf('Data') !== -1 && typeof value === 'string' && value.indexOf('/') !== -1) {
            var partes = value.split('/');
            if (partes.length === 3) {
              value = new Date(partes[2], partes[1] - 1, partes[0]);
            }
          }
          
          sheet.getRange(rowIndex, colIndex + 1).setValue(value);
          updated[key] = value;
          Logger.log('Campo atualizado: ' + key + ' = ' + value);
        }
      }
    }
    
    return json({
      success: true,
      message: 'Registro atualizado com sucesso',
      data: {
        CNPJ: cnpj,
        updated: updated
      }
    });
    
  } catch (error) {
    Logger.log('Erro ao atualizar: ' + error);
    return json({
      error: true,
      message: error.toString()
    });
  }
}

// ===================================================================
// ATUALIZAR SENHA DO USUÁRIO
// ===================================================================
function atualizarSenhaUsuario(sheet, data) {
  try {
    Logger.log('Atualizando senha do usuário: ' + JSON.stringify(data));
    
    var email = data.Email;
    var novaSenha = data.Senha;
    
    if (!email) {
      return json({
        error: true,
        message: 'Campo Email obrigatório'
      });
    }
    
    if (!novaSenha) {
      return json({
        error: true,
        message: 'Campo Senha obrigatório'
      });
    }
    
    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    var emailIndex = headers.indexOf('Email');
    var senhaIndex = headers.indexOf('Senha');
    
    if (emailIndex === -1) {
      return json({
        error: true,
        message: 'Coluna Email não encontrada na planilha'
      });
    }
    
    if (senhaIndex === -1) {
      return json({
        error: true,
        message: 'Coluna Senha não encontrada na planilha'
      });
    }
    
    // Procurar a linha com o Email
    var rowIndex = -1;
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][emailIndex].toLowerCase() === email.toLowerCase()) {
        rowIndex = i + 1; // +1 porque getRange é 1-indexed
        break;
      }
    }
    
    if (rowIndex === -1) {
      return json({
        error: true,
        message: 'Email não encontrado: ' + email
      });
    }
    
    // Atualizar senha
    sheet.getRange(rowIndex, senhaIndex + 1).setValue(novaSenha);
    
    Logger.log('Senha atualizada com sucesso para: ' + email);
    
    return json({
      success: true,
      message: 'Senha atualizada com sucesso',
      data: {
        Email: email
      }
    });
    
  } catch (error) {
    Logger.log('Erro ao atualizar senha: ' + error);
    return json({
      error: true,
      message: error.toString()
    });
  }
}

