// config.js
const CONFIG = {
    SHEET_ID: '',
    USER_KEY_FULL: 'quiz_user_full',
    SHEET_MACRO: '',
    FORM_ID: '',
    
    // GIDs de las pestañas
    GID_BADGES: '1980826842',   // Pestaña "Insignias"
    GID_QUESTIONS: '2065748319', // Pestaña con preguntas
    GID_RANKING: '0',            // Pestaña "Top" (racha)
  
    // URLs públicas (CSV)
    BADGES_CSV_URL: function() {
      return `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/export?format=csv&gid=${this.GID_BADGES}`;
    },
    QUESTIONS_CSV_URL: function() {
      return `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/export?format=csv&gid=${this.GID_QUESTIONS}`;
    },
    RANKING_CSV_URL: function() {
      return `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/export?format=csv&gid=${this.GID_RANKING}`;
    },
    CURRENT_USERNAME: function() {
      return localStorage.getItem(this.USER_KEY_FULL) || 'Amiguito';
    },
    SHEETS_URL: function() {
      return `https://script.google.com/macros/s/${this.SHEET_MACRO}/exec`;
    },

    // Formulario de respuestas
    FORM_RESPONSE_URL: `https://docs.google.com/forms/d/e/${this.FORM_ID}/formResponse`,
  
    // Sonido
    NOTIFICATION_SOUND_URL: 'coin.mp3'
  };