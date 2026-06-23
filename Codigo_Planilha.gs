function doGet(e) {
  var action = e.parameter.action;
  if (action === 'getKms') {
    return handleGetKms();
  } else if (action === 'getDrivers') {
    return handleGetDrivers();
  } else if (action === 'getVehicles') {
    return handleGetVehicles();
  } else if (action === 'getOilRefs') {
    return handleGetOilRefs();
  }
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Ação não especificada." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleGetKms() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Viagens");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Aba 'Viagens' não encontrada." }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var data = sheet.getDataRange().getValues();
  // Assume header is in row 1
  var headers = data[0];
  var colVeiculo = -1, colKmSaida = -1, colKmChegada = -1, colDataChegada = -1;
  
  for (var h = 0; h < headers.length; h++) {
    if (!headers[h]) continue;
    var text = headers[h].toString().trim().toUpperCase();
    if (text === "VEÍCULO" || text === "VEICULO") colVeiculo = h;
    else if (text === "KM SAÍDA" || text === "KM SAIDA") colKmSaida = h;
    else if (text === "KM CHEGADA") colKmChegada = h;
    else if (text === "DATA CHEGADA") colDataChegada = h;
  }
  
  if (colVeiculo === -1) colVeiculo = 3;
  if (colKmSaida === -1) colKmSaida = 4;
  if (colDataChegada === -1) colDataChegada = 8;
  if (colKmChegada === -1) colKmChegada = 10;
  
  var lastKms = {};
  var vehicleStatus = {};
  var maxKmS = {}; // Guarda o maior KM de saída para identificar o registro mais recente
  
  // Lista inicial de todos os veículos como disponíveis
  var allVehicles = [
    "Uno Branco AID8C51",
    "Strada Simples QPS9I59",
    "Strada CD AZL5B65",
    "Strada Endurance SDP4I02"
  ];
  
  allVehicles.forEach(function(v) {
    vehicleStatus[v] = "disponivel";
    lastKms[v] = 0;
    maxKmS[v] = 0;
  });

  // Percorre todas as linhas da planilha
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var vName = row[colVeiculo];
    if (!vName) continue;
    
    // Normaliza o nome do veículo
    vName = vName.toString().trim();
    
    // Atualiza o último KM
    var kmS = parseFloat(row[colKmSaida]) || 0;
    var kmC = parseFloat(row[colKmChegada]) || 0;
    
    // Inicializa as propriedades dinâmicas se o veículo for novo
    if (lastKms[vName] === undefined) {
      lastKms[vName] = 0;
      maxKmS[vName] = 0;
      vehicleStatus[vName] = "disponivel";
    }
    
    if (kmC > lastKms[vName]) lastKms[vName] = kmC;
    if (kmS > lastKms[vName]) lastKms[vName] = kmS;
    
    // Como a planilha é preenchida cronologicamente (novos registros no final),
    // a última linha lida para o veículo ditará o seu status atual.
    var dataChegada = row[colDataChegada];
    if (!dataChegada || dataChegada.toString().trim() === "") {
      vehicleStatus[vName] = "em_viagem";
    } else {
      vehicleStatus[vName] = "disponivel";
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ 
    success: true, 
    data: lastKms, 
    status: vehicleStatus 
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetDrivers() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Motoristas");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Aba 'Motoristas' não encontrada." }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var data = sheet.getDataRange().getValues();
  var expirations = {};
  
  // Pula o cabeçalho (i=1) e assume Coluna A = Nome, Coluna B = Validade da CNH
  for (var i = 1; i < data.length; i++) {
    var nome = data[i][0];
    var validade = data[i][1];
    
    if (nome) {
       // Formatar data se for objeto Date
       if (validade instanceof Date) {
         var year = validade.getFullYear();
         var month = ("0" + (validade.getMonth() + 1)).slice(-2);
         var day = ("0" + validade.getDate()).slice(-2);
         validade = year + "-" + month + "-" + day;
       }
       expirations[nome.toString().trim()] = validade ? validade.toString().trim() : "2099-12-31";
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, data: expirations }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleGetVehicles() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Veículos");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Aba 'Veículos' não encontrada." }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var data = sheet.getDataRange().getValues();
  var vehicles = [];
  
  // Pula o cabeçalho (i=1) e assume Coluna A = Nome do Veículo
  for (var i = 1; i < data.length; i++) {
    var vName = data[i][0];
    if (vName) {
      vehicles.push(vName.toString().trim());
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, data: vehicles }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleGetOilRefs() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Próxima Troca");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Aba 'Próxima Troca' não encontrada." }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var data = sheet.getDataRange().getValues();
  var refs = [];
  
  // Pula o cabeçalho (i=1) e assume:
  // Coluna A (0) = Nome do Veículo
  // Coluna B (1) = Placa
  // Coluna C (2) = KM para a próxima troca
  for (var i = 1; i < data.length; i++) {
    var vName = data[i][0];
    var placa = data[i][1];
    var km = data[i][2]; // COLUNA C
    
    if (vName || placa) {
      var fullName = ((vName || "") + " " + (placa || "")).trim();
      refs.push({ vehicle: fullName, km: km ? km.toString().trim() : "" });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, data: refs }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var rawData = e.postData.contents;
  try {
    var body = JSON.parse(rawData);
    var type = body.type;
    
    if (type === "saida") {
      return handleSaida(body);
    } else if (type === "chegada") {
      return handleChegada(body);
    } else if (type === "abastecimento") {
      return handleAbastecimento(body);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Tipo de requisição desconhecido" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleSaida(body) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Viagens");
  var checklistStr = (body.checklist && body.checklist.length > 0) ? body.checklist.join(", ") : "";
  
  sheet.appendRow([
    body.data_saida,
    body.hora_saida,
    body.motorista,
    body.veiculo,
    body.km_saida,
    body.local_saida,
    body.local_destino,
    checklistStr,
    "", // DATA CHEGADA
    "", // HORA CHEGADA
    "", // KM CHEGADA
    "", // KMS RODADOS
    "", // AVARIAS
    ""  // FOTO AVARIAS
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
}

function handleChegada(body) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Viagens");
  var data = sheet.getDataRange().getValues();
  
  var headers = data[0];
  var colVeiculo = headers.indexOf("VEÍCULO");
  var colDataChegada = headers.indexOf("DATA CHEGADA");
  
  if (colVeiculo === -1) {
    colVeiculo = 3;
    colDataChegada = 8;
  }
  
  var targetRow = -1;
  
  // Procura de baixo para cima a última linha deste veículo que está sem DATA CHEGADA
  for (var i = data.length - 1; i >= 1; i--) {
    var row = data[i];
    var vName = row[colVeiculo];
    var dChegada = row[colDataChegada];
    
    if (vName && vName.toString().trim() === body.veiculo.toString().trim() && (!dChegada || dChegada.toString().trim() === "")) {
      targetRow = i + 1; // +1 porque arrays começam em 0 e as linhas da planilha em 1
      break;
    }
  }
  
  if (targetRow !== -1) {
    // Atualiza apenas as colunas de chegada (assumindo a ordem padrão)
    // A partir da coluna I (índice 9) -> Data Chegada
    sheet.getRange(targetRow, 9).setValue(body.data_chegada);
    sheet.getRange(targetRow, 10).setValue(body.hora_chegada);
    sheet.getRange(targetRow, 11).setValue(body.km_chegada);
    // Para KMS RODADOS, podemos inserir a fórmula fornecida pelo frontend ou calcular aqui
    sheet.getRange(targetRow, 12).setFormula(body.kms_rodados || '=INDIRECT("K"&ROW())-INDIRECT("E"&ROW())');
    sheet.getRange(targetRow, 13).setValue(body.avarias);
    sheet.getRange(targetRow, 14).setValue(body.fotos);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } else {
    // Fallback: se não encontrou linha de saída em aberto, insere uma nova linha de chegada direto?
    // Ou retorna erro? Vamos retornar um aviso ou criar a linha
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Nenhuma viagem em aberto encontrada para este veículo." }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleAbastecimento(body) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Abastecimento");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Aba 'Abastecimento' não encontrada." }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  sheet.appendRow([
    body.data,
    body.hora,
    body.motorista,
    body.veiculo,
    body.km,
    body.litros,
    body.tanque_cheio,
    body.usuario_logado,
    body.email_logado
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
}

// Configuração de CORS para opções prévias (Preflight)
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
