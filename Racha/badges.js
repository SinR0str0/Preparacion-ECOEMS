// badges.js
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
    const userName = localStorage.getItem(CONFIG.USER_KEY_FULL) || 'Amiguito';
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
  const userName = localStorage.getItem(CONFIG.USER_KEY_FULL)?.trim();
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
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
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

  setTimeout(() => {
    if (notification.parentNode) notification.remove();
  }, 4000);
}

// Inyectar animaciones CSS
(function injectAnimations() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; transform: translateY(-20px); } }
  `;
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
    playUnlockSound();
    newlyUnlocked.forEach(badge => showBadgeNotification(badge.Título));
  }

  previousPokedexData = [...newData];
}

// === INICIALIZAR BADGES ===
async function initializeBadges() {
  await loadPokedexData();
  
  // Actualizar progreso
  const total = pokedexData.length;
  const completed = pokedexData.filter(e => e.Completed).length;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  const elCount = document.getElementById('progressCount');
  const elTotal = document.getElementById('totalBadges');
  const elFill = document.getElementById('progressFill');
  if (elCount) elCount.textContent = completed;
  if (elTotal) elTotal.textContent = total;
  if (elFill) elFill.style.width = `${pct}%`;

  // Cargar y mostrar racha
  const streak = await loadCurrentStreak();
  const elStreak = document.getElementById('currentStreak');
  if (elStreak) elStreak.textContent = streak;

  // Guardar estado inicial
  previousPokedexData = [...pokedexData];
}

// Ejecutar al cargar
document.addEventListener('DOMContentLoaded', initializeBadges);