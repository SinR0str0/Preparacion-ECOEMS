//macro.js
// Este archivo presenta la estructura base del APP Script usado como API para guardar las insignias y procesar los valores de cada estudiante.
function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

// Responder a preflight OPTIONS
function doOptions() {
  return ContentService
    .createTextOutput()
    .setMimeType(ContentService.MimeType.TEXT);
}

const SHEET_ID = '';

function handleRequest(e) {

  const output = ContentService.createTextOutput();

  try {
    let data = e.parameter;

    if (data.acceptedIndices) {
      data.acceptedIndices = JSON.parse(data.acceptedIndices);
    }
    if (data.respuestasPorId) {
      data.respuestasPorId = JSON.parse(data.respuestasPorId);
    }

    const userName = data.userName;

    if (!userName) throw new Error("Falta 'userName'");

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const respuestasSheet = ss.getSheets()[0]; // "Respuestas de formulario 2"
    const badgesSheet = ss.getSheetByName('Insignias') || ss.getSheetByName('Badges');
    const rankingSheet = ss.getSheetByName('Ranking');

    // --- Leer todas las respuestas ---
    const respRows = respuestasSheet.getDataRange().getValues();
    const headersResp = respRows[0].map(h => h.toString().trim());
    const nameCol = headersResp.indexOf('Nickname') !== -1 ? headersResp.indexOf('Nickname') : 1; // B = índice 1
    const scoreCol = headersResp.indexOf('PuntajeObtenido') !== -1 ? headersResp.indexOf('PuntajeObtenido') : 2; // C = índice 2
    const dateCol = headersResp.indexOf('Fecha') !== -1 ? headersResp.indexOf('Fecha') : 4; // E = índice 4

    const today = new Date();
    const hoy = Utilities.formatDate(today, 'America/Mexico_City', 'yyyy-MM-dd');
    const ayer = Utilities.formatDate(new Date(today.getTime() - 86400000), 'America/Mexico_City', 'yyyy-MM-dd');
    const antier = Utilities.formatDate(new Date(today.getTime() - 2 * 86400000), 'America/Mexico_City', 'yyyy-MM-dd');

    // Filtrar respuestas (excluyendo usuarios no deseados o de testing)
    const excludedUsers = [];
    const allValidResponses = respRows.slice(1).filter(row => {
      const name = (row[nameCol] || '').toString().trim();
      return !excludedUsers.includes(name) && row[dateCol];
    });

    // Respuestas del usuario actual
    const userResponses = respRows.slice(1).filter(row => {
      return (row[nameCol] || '').toString().trim() === userName && row[dateCol];
    });

    // --- 2. ¿Hoy y ayer puntaje = 5? ---
    const userTodayScore5 = userResponses.some(row => 
      (row[dateCol] || '').toString().trim() === hoy && Number(row[scoreCol]) === 5
    );
    const userYesterdayScore5 = userResponses.some(row => 
      (row[dateCol] || '').toString().trim() === ayer && Number(row[scoreCol]) === 5
    );
    const rule27 = userTodayScore5 && userYesterdayScore5;

    // --- 3. ¿Hoy, ayer y antier puntaje = 5? ---
    const userAntierScore5 = userResponses.some(row => 
      (row[dateCol] || '').toString().trim() === antier && Number(row[scoreCol]) === 5
    );
    const rule28 = userTodayScore5 && userYesterdayScore5 && userAntierScore5;

    // --- Leer "PreguntasHoy" para mapear índices → valor en columna G ---
    const preguntasSheet = ss.getSheetByName('PreguntasHoy');
    if (!preguntasSheet) throw new Error("Hoja 'PreguntasHoy' no encontrada");

    const preguntasData = preguntasSheet.getDataRange().getValues(); // fila 1 = índice 0
    const colGIndex = 6; // columna G → índice 6 (A=0, B=1, ..., G=6)

    // Crear mapa: índice (fila-1) → valor en columna G
    const indiceToValor = {};
    for (let i = 0; i < preguntasData.length; i++) {
      const valor = preguntasData[i][colGIndex];
      if (valor !== '') {
        indiceToValor[i] = valor; // fila 0 → índice 0, etc.
      }
    }

    // --- Obtener los valores correspondientes a acceptedIndices ---
    const valoresSeleccionados = [];
    (data.acceptedIndices || []).forEach(idx => {
      if (indiceToValor.hasOwnProperty(idx)) {
        valoresSeleccionados.push(indiceToValor[idx]);
      }
    });

    // --- Guardar en hoja "Ranking", columna G, fila del usuario ---
    const rankingData = rankingSheet.getDataRange().getValues();
    const nombreCol = 0; // columna A
    const colG_Ranking = 6; // columna G

    let userRowInRanking = -1;
    let unionArray = [];
    for (let i = 0; i < rankingData.length; i++) {
      if ((rankingData[i][nombreCol] || '').toString().trim() === userName) {
        userRowInRanking = i;
        break;
      }
    }

    if (userRowInRanking != -1) {
      // Leer valor actual (para hacer unión si es necesario, o sobrescribir)
      const currentValue = rankingData[userRowInRanking][colG_Ranking];
      let existingSet = new Set();

      // Opción 2: UNIÓN (evitar duplicados con lo que ya tenía)
      if (currentValue) {
        try {
          const existingArray = JSON.parse(currentValue);
          if (Array.isArray(existingArray)) {
            existingArray.forEach(item => existingSet.add(item));
          }
        } catch (e) {
          // Si no es JSON, tratar como string simple
          existingSet.add(currentValue.toString());
        }
      }
      valoresSeleccionados.forEach(v => existingSet.add(v));
      unionArray = Array.from(existingSet);

      // Guardar como JSON
      rankingSheet.getRange(userRowInRanking + 1, colG_Ranking + 1).setValue(JSON.stringify(unionArray));
    }

    // --- Ahora, para las reglas, usamos `valoresSeleccionados` o `unionArray` ---
    // Pero si necesitas el valor completo de la columna G del usuario para reglas posteriores:
    let id42Array = [];
    if (userRowInRanking !== -1 || true) {
      // Recargar o usar unionArray
      id42Array = unionArray;
    }
    // --- 6. ¿ID 42 tiene 128 elementos? ---
    const rule42 = id42Array.length === 128;

    // --- 7. ¿Hoy puntaje > ayer? ---
    let yesterdayScore = null;
    let todayScore = null;
    userResponses.forEach(row => {
      const date = (row[dateCol] || '').toString().trim();
      const score = Number(row[scoreCol]);
      if (date === hoy) todayScore = Math.max(todayScore || -1, score);
      if (date === ayer) yesterdayScore = Math.max(yesterdayScore || -1, score);
    });
    const rule39 = yesterdayScore !== null && todayScore !== null && todayScore > yesterdayScore;

    // --- 8. ¿Es el #1 en Ranking? ---
    let rule40 = false;
    if (rankingSheet) {
      const rankData = rankingSheet.getDataRange().getValues();
      const rankHeaders = rankData[0];
      const rankNameCol = rankHeaders.indexOf('Nombre');
      const rankScoreCol = rankHeaders.indexOf('Puntaje'); // o como se llame

      if (rankNameCol !== -1 && rankScoreCol !== -1) {
        let maxScore = -1;
        let topUser = '';
        for (let i = 1; i < rankData.length; i++) {
          const score = Number(rankData[i][rankScoreCol]);
          if (score > maxScore) {
            maxScore = score;
            topUser = rankData[i][rankNameCol];
          }
        }
        rule40 = topUser === userName;
      }
    }

    // --- 9. ¿ID 42 tiene 470 elementos? ---
    const rule38 = id42Array.length >= 470;

    // --- 11. ¿Rompió racha? (racha hasta hoy vs ayer) ---
    // Calculamos racha actual del usuario
    const userDates = userResponses
      .map(row => (row[dateCol] || '').toString().trim())
      .filter(d => d)
      .sort()
      .reverse(); // más reciente primero

    let currentStreak = 0;
    if (userDates.length > 0) {
      let expected = hoy;
      for (let i = 0; i < userDates.length; i++) {
        if (userDates[i] === expected) {
          currentStreak++;
          // restar un día
          const expDate = new Date(expected);
          expDate.setDate(expDate.getDate() - 1);
          expected = Utilities.formatDate(expDate, 'America/Mexico_City', 'yyyy-MM-dd');
        } else {
          break;
        }
      }
    }

    // Racha ayer: si ayer tenía racha N, hoy debería ser N+1 (si respondió hoy)
    // Pero si hoy no respondió, y ayer sí, entonces rompió
    const respondedYesterday = userDates.includes(ayer);
    const respondedToday = userDates.includes(hoy);
    const rule30 = !respondedYesterday && respondedToday;
    // --- 4. ¿Ayer puntaje = 0? ---
    const rule29 = userResponses.some(row => 
      (row[dateCol] || '').toString().trim() === ayer && Number(row[scoreCol]) === 0
    ) && respondedYesterday;

    // --- Aplicar reglas a Insignias ---
    const updates = {
      "1" : data.respuestasPorId?.["1"] === true,
      "2" : data.respuestasPorId?.["2"] === true,
      "25" : false,
      "27" : rule27,
      "28" : rule28,
      "29" : rule29,
      "30" : rule30,
      "31" : data.respuestasPorId?.["31"] === true,
      "32" : data.respuestasPorId?.["32"] === true,
      "33" : data.respuestasPorId?.["33"] === true,
      "34" : data.respuestasPorId?.["34"] === true,
      "35" : data.respuestasPorId?.["35"] === true,
      "36" : data.respuestasPorId?.["36"] === true,
      "37" : data.respuestasPorId?.["37"] === true,
      "38" : rule38,
      "39" : rule39,
      "40" : rule40,
      "41" : data.respuestasPorId?.["41"] === true,
      "42" : rule42,
      "43" : false,
      "44" : false,
      "45" : data.respuestasPorId?.["45"] === true
    };

    // Escribir en hoja de Insignias
    const badgesData = badgesSheet.getDataRange().getValues();
    const badgeHeaders = badgesData[0];
    let userBadgeCol = -1;
    for (let j = 1; j < badgeHeaders.length; j++) {
      if (badgeHeaders[j] === userName) {
        userBadgeCol = j;
        break;
      }
    }

    if (userBadgeCol !== -1) {
      for (let i = 1; i < badgesData.length; i++) {
        const id = (badgesData[i][0] || '').toString().trim();
        if (updates[id] === true) {
          const currentValue = badgesData[i][userBadgeCol];
          if (currentValue !== '1' && currentValue !== 1) {
            badgesSheet.getRange(i + 1, userBadgeCol + 1).setValue(1);
          }
        }
      }
    }

    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify({ success: true }));

  } catch (err) {
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify({ error: err.message }));
  }
  return output;
}
