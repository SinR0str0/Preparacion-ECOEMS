// config.js
const CONFIG = {
    SHEET_ID: '1Vg24glEQ1EklNoAxz1T6-JtyX8CY1Sbdt6IrmbWCFz4',
    USER_KEY_FULL: 'quiz_user_full',
  
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
  
    // Formulario de respuestas
    FORM_RESPONSE_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSfpwl7CuOfWvCyg6DNYUSQEURIvK9hkdULYLPNuqmqjEDv1BA/formResponse',
  
    // Sonido
    NOTIFICATION_SOUND_URL: 'coin.mp3'
  };