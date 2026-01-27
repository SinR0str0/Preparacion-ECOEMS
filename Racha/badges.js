let pokedexData = [];
let previousPokedexData = [];

// === UTILIDADES ===
function getMexicoTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
}

function getTodayStringMexico() {
  return getMexicoTime().toLocaleDateString('en-CA');
}

// === PARSE CSV ===
function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = row[i + 1] || '';

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"' && inQuotes) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(cell => cell.replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));
}

// === CARGAR INSIGNIAS ===
async function loadPokedexData() {
  try {
    const response = await fetch(CONFIG.BADGES_CSV_URL());
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      console.warn('No hay datos suficientes en el Sheet de insignias.');
      pokedexData = [];
      return;
    }

    const headers = parseCSVRow(lines[0]);
    const userName = CONFIG.CURRENT_USERNAME();
    const userColIndex = headers.findIndex(header => header.trim() === userName.trim());

    pokedexData = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      if (row.length < 3) continue;

      const idRaw = row[0]?.trim();
      const title = row[1]?.trim() || '';
      const description = row[2]?.trim() || '';
      const id = idRaw ? parseInt(idRaw, 10) : i;

      let completed = false;
      if (userColIndex !== -1 && userColIndex < row.length) {
        const cellValue = row[userColIndex]?.trim();
        completed = cellValue === '1';
      }

      pokedexData.push({ ID: id, Título: title, Descripción: description, Completed: completed });
    }
  } catch (error) {
    console.error('❌ Error al cargar pokedexData:', error);
    pokedexData = [];
  }
}

// === CARGAR RACHA ACTUAL ===
async function loadCurrentStreak() {
  const userName = CONFIG.CURRENT_USERNAME();
  if (!userName) return 0;

  try {
    const response = await fetch(CONFIG.RANKING_CSV_URL());
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return 0;

    const headers = parseCSVRow(lines[0]);
    const nameIndex = headers.findIndex(h => h.trim() === 'Nombre');
    const streakIndex = headers.findIndex(h => h.trim() === 'RachaActual');

    if (nameIndex === -1 || streakIndex === -1) {
      console.error('Columnas "Nombre" o "RachaActual" no encontradas.');
      return 0;
    }

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      const rowName = row[nameIndex]?.trim();
      if (rowName === userName) {
        const streakValue = row[streakIndex]?.trim();
        const streak = parseInt(streakValue, 10);
        return isNaN(streak) ? 0 : streak;
      }
    }
    return 0;
  } catch (error) {
    console.error('❌ Error al cargar la racha:', error);
    return 0;
  }
}

// === NOTIFICACIONES ===
function playUnlockSound() {
  const audio = new Audio(CONFIG.NOTIFICATION_SOUND_URL);
  audio.volume = 0.7;
  audio.play().catch(e => console.warn('🔇 No se pudo reproducir el sonido:', e));
}

function showBadgeNotification(badgeName) {
  // Contar notificaciones existentes
  playUnlockSound();
  const existing = document.querySelectorAll('.badge-notification');
  const offset = 20 + existing.length * 80; // 60px alto + 10px margen

  const notification = document.createElement('div');
  notification.className = 'badge-notification'; // para selección fácil
  notification.style.cssText = `
    position: fixed;
    top: ${offset}px;
    right: 20px;
    background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
    color: white;
    padding: 14px 20px;
    border-radius: 12px;
    box-shadow: 0 6px 16px rgba(0,0,0,0.25);
    z-index: 10000;
    font-family: 'Comic Sans MS', sans-serif;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideInRight 0.4s, fadeOut 0.5s 3.5s forwards;
  `;
  notification.innerHTML = `<span style="font-size:24px">🏅</span><span>¡Nueva insignia!<br>${badgeName}</span>`;
  document.body.appendChild(notification);

  // Eliminar tras 4 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Inyectar animaciones CSS
(function injectAnimations() {
  const style = document.createElement('style');
  document.head.appendChild(style);
})();

// === DETECTAR NUEVAS INSIGNIAS ===
async function checkAndAssignBadges() {
  const oldData = [...pokedexData];
  await loadPokedexData();

  const newlyUnlocked = [];
  const newData = pokedexData;

  for (let i = 0; i < Math.min(oldData.length, newData.length); i++) {
    if (!oldData[i]?.Completed && newData[i]?.Completed) {
      newlyUnlocked.push(newData[i]);
    }
  }

  if (newlyUnlocked.length > 0) {
    for (const badge of newlyUnlocked) {
      showBadgeNotification(badge.Título);
      await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 segundos
    }
  }

  previousPokedexData = [...newData];
}

async function validateAndUnlockBadges(userName,score,totalTime,now, A) {
  const day = now.getDay();
  const month = now.getMonth();
  
  const hour = now.getHours();
  const minute = now.getMinutes();

  await loadPokedexData();
  previousPokedexData = [...pokedexData]; 
  const data = {
    userName: userName,
    respuestasPorId: {
      "1": true,
      "2": score==5,
      "31": totalTime<=30,
      "32": totalTime>=300,
      "33": day === 0 || day === 6,
      "34": hour<8,
      "35": (hour>22||(hour==22 && minute>0)),
      "36": totalTime>=595,
      "37": totalTime<=120,
      "41": day==13 && month==6,
      "45": false
    },
    acceptedIndices: A
  };
  // 1. Llamar al Web App para que evalúe todas las reglas y marque insignias en Sheets
  try {
    const webAppUrl = CONFIG.SHEETS_URL();

    const response = await fetch(webAppUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        userName: userName,
        acceptedIndices: JSON.stringify(data["acceptedIndices"]),
        respuestasPorId: JSON.stringify(data["respuestasPorId"])
      })
    })
    console.log(response);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const result = await response.json();
    console.log(result);
    if (!result.success) {
      console.warn('Web App no actualizó insignias:', result);
    }
  } catch (err) {
    console.error('Error al validar insignias en servidor:', err);
  }

  // 3. Recargar datos de insignias y detectar nuevas
  await checkAndAssignBadges();
}
