// === CONFIGURACIÓN ===
const { SHEET_ID, GID_QUESTIONS, USER_KEY_FULL, FORM_RESPONSE_URL, RANKING_CSV_URL, QUESTIONS_CSV_URL, CURRENT_USERNAME, SHEETS_URL } = CONFIG;

const QUESTIONS_URL = CONFIG.QUESTIONS_CSV_URL();
const RANKING_URL = CONFIG.RANKING_CSV_URL();

let questions = [];
let startTime = null;
let timeLeft = 600;
let timerInterval = null;
let quizSubmitted = false;

// === UTILIDADES ===
function getMexicoTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
}

function getTodayStringMexico() {
  return getMexicoTime().toLocaleDateString('en-CA');
}

function isBetweenMidnightAnd1AM() {
  const now = getMexicoTime();
  const hour = now.getHours();
  return hour === 0; // 00:00 a 00:59
}

function getTimeUntil1AM(){
  const now = getMexicoTime();
  const target = new Date(now);
  
  // Establecer a 1:00 AM del mismo día
  target.setHours(1, 0, 0, 0);
  
  // Si ya pasó la 1:00 AM de hoy, usar la de mañana
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  
  return target.getTime() - now.getTime();
}

// === PARSE CSV SIN ENCABEZADOS (5 preguntas) ===
function parseQuestionsCSV(csvText) {
  const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
  const data = [];

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    while (row.length < 5) row.push('');

    const clean = (str) => (str || '').replace(/^"(.*)"$/, '$1').replace(/""/g, '"').trim();

    data.push({
      Pregunta: clean(row[0]),
      OpA: clean(row[1]),
      OpB: clean(row[2]),
      OpC: clean(row[3]),
      OpD: clean(row[4])
    });
  }

  return data;
}

// === PARSE CSV CON ENCABEZADOS (para Ranking) ===
function parseCSVWithHeaders(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 1) return [];

  const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    .map(h => h.replace(/^"(.*)"$/, '$1').trim());

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const rowLine = lines[i].trim();
    if (!rowLine) continue;

    const rowCells = rowLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const obj = {};

    headers.forEach((header, idx) => {
      let val = rowCells[idx] || '';
      val = val.replace(/^"(.*)"$/, '$1').replace(/""/g, '"').trim();
      obj[header] = val;
    });

    data.push(obj);
  }

  return data;
}

// === MANEJO DE FECHAS DE SHEETS ===
function normalizeDateFromSheet(dateStr) {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [dd, mm, yyyy] = dateStr.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  const num = parseFloat(dateStr);
  if (!isNaN(num)) {
    const date = new Date((num - 25569) * 86400 * 1000);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  }
  return null;
}

// === RENDERIZAR PREGUNTAS ===
function renderQuiz(showFeedback = false) {
  const container = document.getElementById('quiz-container');
  container.innerHTML = '';

  questions.forEach((q, idx) => {
    const div = document.createElement('div');
    div.className = 'question';
    let optionsHTML = '';

    q.options.forEach((opt, i) => {
      let classes = 'option';
      if (showFeedback) {
        if (opt.correct) classes += ' correct';
        else if (q.userAnswer === i) classes += ' incorrect';
      } else if (q.userAnswer === i) classes += ' selected';

      optionsHTML += `
        <label class="${classes}" ${!showFeedback ? `onclick="selectOption(${idx}, ${i})"` : ''}>
          ${String.fromCharCode(65 + i)}. ${opt.text}
        </label>
      `;
    });

    div.innerHTML = `<div class="question-text">${idx + 1}. ${q.text}</div>${optionsHTML}`;
    container.appendChild(div);
  });
}

window.selectOption = function (qIndex, optIndex) {
  if (quizSubmitted) return;
  questions[qIndex].userAnswer = optIndex;
  renderQuiz();
};

// === TEMPORIZADOR DE 5 MINUTOS ===
function startTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      autoSubmit();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  document.getElementById('timer-display').textContent = `Tiempo restante: ${mins}:${secs}`;
}

function autoSubmit() {
  submitQuiz(true);
}

// === ENVIAR ===
async function submitQuiz(isAuto = false) {
  if (quizSubmitted) return;
  quizSubmitted = true;
  clearInterval(timerInterval);
  document.getElementById('analysis-overlay')?.classList.remove('hidden');
  let accepteds = []
  let score = 0, answered = 0;
  questions.forEach((q, index) => {
    if (q.userAnswer !== undefined) {
      answered++;
      if (q.options[q.userAnswer]?.correct) {score++; accepteds.push(index);}
    }
  });

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  const userName = CONFIG.CURRENT_USERNAME();
  const date = getTodayStringMexico();

  const formData = new URLSearchParams();
  formData.append('entry.7479757', userName);
  formData.append('entry.480570605', score);
  formData.append('entry.790339546', totalTime);
  formData.append('entry.820356876', date);


  try {
    await fetch(CONFIG.FORM_RESPONSE_URL, {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });    
    await validateAndUnlockBadges(userName,score,totalTime,getMexicoTime(),accepteds);
  } catch (e) {
    console.warn('Error durante el envío o validación:', e);
  } finally {
    document.getElementById('analysis-overlay')?.classList.add('hidden');
  }

  document.getElementById('result').textContent = `🎊 ¡Puntaje: ${score} de 5! (${answered} respondidas)`;
  document.getElementById('result').classList.remove('hidden');
  document.getElementById('submit-btn').classList.add('hidden');
  if (!isAuto) {
    renderQuiz(true);
  }
  showCountdownTo1AM();
}

// === CONTADOR HASTA LA 1:00 AM ===
function showCountdownTo1AM() {
  const timerTop = document.getElementById('timer-display');
  timerTop.style.color = '#e91e63';
  timerTop.style.background = '#fce4ec';

  const update = () => {
    const diff = getTimeUntil1AM(); // ← Usar la nueva función
    if (diff <= 0) {
      timerTop.textContent = '🎉 ¡Nuevo ciclo!';
      return;
    }
    const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    timerTop.textContent = `⏳ Siguiente racha: ${h}h ${m}m`;
  };

  update();
  setInterval(update, 60000);
}

// === CARGAR PREGUNTAS ===
async function loadQuestions() {
  const response = await fetch(QUESTIONS_URL);
  const csvText = await response.text();
  const all = parseQuestionsCSV(csvText);
  if (all.length !== 5) throw new Error(`Se esperaban 5 preguntas, hay ${all.length}`);

  questions = all.map(q => ({
    text: q.Pregunta,
    options: [
      { text: q.OpA, correct: true },
      { text: q.OpB, correct: false },
      { text: q.OpC, correct: false },
      { text: q.OpD, correct: false }
    ].filter(opt => opt.text.trim() !== '').sort(() => Math.random() - 0.5),
    userAnswer: undefined
  }));
}

// === VERIFICAR EN SHEETS ===
async function hasUserAttemptedTodayInSheets(userName) {
  if (!userName || userName === 'Amiguito') return false;

  try {
    const response = await fetch(RANKING_URL);
    const csvText = await response.text();
    const ranking = parseCSVWithHeaders(csvText);
    const todayISO = getTodayStringMexico();

    for (const row of ranking) {
      const nameMatch = (row.Nombre || '').trim() === userName.trim();
      if (!nameMatch) continue;

      const normalizedDate = normalizeDateFromSheet(row.ISO);
      if (normalizedDate === todayISO) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('Error al verificar Ranking:', err);
    return false;
  }
}

// === INICIAR QUIZ ===
window.startQuiz = async function () {
  await loadQuestions();
  questions.forEach(q => q.userAnswer = undefined);
  startTime = Date.now();

  document.getElementById('instructions-screen').classList.add('hidden');
  document.getElementById('quiz-content').classList.remove('hidden');
  renderQuiz();
  startTimer();
};

// === INICIALIZAR ===
document.addEventListener('DOMContentLoaded', async () => {
  const userName = CONFIG.CURRENT_USERNAME();
  document.getElementById('user-info').textContent = `😊 ¡Hola, ${userName}!`;

  // Verificar si es entre 12:00 AM y 1:00 AM
  if (isBetweenMidnightAnd1AM()) {
    document.getElementById('instructions-screen').remove();
    document.getElementById('quiz-content').remove();
    
    const container = document.querySelector('.container');
    container.innerHTML = `
      <h1>🎯 Racha Diaria</h1>
      <div style="text-align:center; margin:40px 0; font-size:1.4em; color:#1a535c;">
        Estamos evaluando las mejores opciones para ti
      </div>
      <div class="timer" id="timer-display">Cargando...</div>
      <div style="font-size: x-small; color: #1a535c; text-align: right; margin-top:40px;">
        Elaborado por: <a href="https://discord.gg/n4aPG2PKYY" target="_blank">Sin_R0str0</a>
      </div>
    `;
    
    showCountdownTo1AM();
    return;
  }

  // Fuera del periodo de mantenimiento
  const alreadyAttempted = await hasUserAttemptedTodayInSheets(userName);

  if (alreadyAttempted) {
    document.getElementById('instructions-screen').remove();
    document.getElementById('quiz-content').classList.remove('hidden');
    document.getElementById('submit-btn').remove();

    try {
      await loadQuestions();
      renderQuiz(true);
    } catch (err) {
      document.getElementById('quiz-container').innerHTML = 
        `<p style="color:red;text-align:center;">❌ Error al cargar preguntas.</p>`;
    }

    showCountdownTo1AM();
  }
});