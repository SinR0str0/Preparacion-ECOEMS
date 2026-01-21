// === CONFIGURACIÓN ===
const SHEET_ID = '1Vg24glEQ1EklNoAxz1T6-JtyX8CY1Sbdt6IrmbWCFz4'; // Reemplaza si es necesario
const GID_POKEDEX = '1980826842'; // ⬅️ ¡Asegúrate de usar el gid correcto de tu pestaña "Insignias"!
const USER_KEY_FULL = 'quiz_user_full';

// URL para exportar CSV usando gid (más confiable que nombre de pestaña)
const POKEDEX_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID_POKEDEX}`;
const STREAK_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;


let pokedexData = []; // Variable global que almacenará los datos
// === FUNCIÓN PRINCIPAL ===
async function loadPokedexData() {
  try {
    const response = await fetch(POKEDEX_CSV_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      console.warn('No hay datos suficientes en el Sheet.');
      pokedexData = [];
      return;
    }

    // Parsear cabeceras (primera línea)
    const headers = parseCSVRow(lines[0]);
    const userName = localStorage.getItem(USER_KEY_FULL) || 'Amiguito';

    // Encontrar índice de la columna del usuario
    const userColIndex = headers.findIndex(header => header.trim() === userName.trim());

    // Procesar filas de datos (a partir de la segunda línea)
    pokedexData = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      
      // Saltar filas vacías o incompletas
      if (row.length < 3) continue;

      const idRaw = row[0]?.trim();
      const title = row[1]?.trim() || '';
      const description = row[2]?.trim() || '';

      // Convertir ID a número
      const id = idRaw ? parseInt(idRaw, 10) : i; // fallback al índice si no hay ID

      // Determinar si está completado
      let completed = false;
      if (userColIndex !== -1 && userColIndex < row.length) {
        const cellValue = row[userColIndex]?.trim();
        completed = cellValue === '1';
      }

      pokedexData.push({
        ID: id,
        Título: title,
        Descripción: description,
        Completed: completed
      });
    }
    
  } catch (error) {
    console.error('❌ Error al cargar pokedexData:', error);
    pokedexData = [];
  }
}

// === CARGAR RACHA ACTUAL DEL USUARIO ===
async function loadCurrentStreak() {
  const userName = localStorage.getItem(USER_KEY_FULL) || 'Amiguito';
  if (!userName) {
    console.warn('No se encontró el nombre del usuario en localStorage.');
    return 0;
  }

  try {
    const response = await fetch(STREAK_CSV_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      console.warn('Hoja de racha vacía o sin encabezados.');
      return 0;
    }

    // Parsear encabezados
    const headers = parseCSVRow(lines[0]);
    
    // Encontrar índices clave
    const nameIndex = headers.findIndex(h => h.trim() === 'Nombre');
    const streakIndex = headers.findIndex(h => h.trim() === 'RachaActual');

    if (nameIndex === -1 || streakIndex === -1) {
      console.error('No se encontraron las columnas "Nombre" o "RachaActual" en la hoja de racha.');
      return 0;
    }

    // Buscar la fila del usuario
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      const rowName = row[nameIndex]?.trim();

      if (rowName === userName) {
        const streakValue = row[streakIndex]?.trim();
        const streak = parseInt(streakValue, 10);
        return isNaN(streak) ? 0 : streak;
      }
    }

    console.warn(`Usuario "${userName}" no encontrado en la hoja de racha.`);
    return 0;

  } catch (error) {
    console.error('❌ Error al cargar la racha del usuario:', error);
    return 0;
  }
}

// === FUNCIÓN AUXILIAR: Parsear una fila CSV respetando comillas ===
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
      i++; // saltar siguiente comilla
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