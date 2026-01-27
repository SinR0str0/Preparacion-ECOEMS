// === KONAMI CODE - Desktop + Móvil ===
class KonamiDetector {
    constructor() {
      // Secuencia original: ↑ ↑ ↓ ↓ ← → ← → B A
      this.sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
      this.sequence2 = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'B', 'A'];
      this.inputBuffer = [];
      
      // Variables táctiles
      this.touchStart = { x: 0, y: 0 };
      this.touchEnd = { x: 0, y: 0 };
      this.touchPath = []; // Acumula múltiples swipes
      this.isTouching = false;
      
      this.init();
    }
  
    init() {
      // 🖥️ Teclado (Desktop)
      document.addEventListener('keydown', (e) => this.handleKeyPress(e));
      
      // 📱 Táctil (Móvil)
      document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    }
  
    // 🖥️ Detectar teclas
    handleKeyPress(e) {
      // Evitar si está escribiendo en un input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      this.inputBuffer = [...this.inputBuffer.slice(-9), e.key];
      if (this.inputBuffer.join(',') === this.sequence.join(',') || this.inputBuffer.join(',') === this.sequence2.join(',')) {
        this.unlockBadge();
        this.inputBuffer = []; // Reset buffer
      }
    }
  
    // 📱 Gestos táctiles - Swipe
    handleTouchStart(e) {
      const touch = e.touches[0];
      this.touchStart = { x: touch.clientX, y: touch.clientY };
      this.isTouching = true;
    }
  
    handleTouchEnd(e) {
      if (!this.isTouching) return;
      
      const touch = e.changedTouches[0];
      this.touchEnd = { x: touch.clientX, y: touch.clientY };
      
      // Calcular desplazamiento total
      const dx = this.touchEnd.x - this.touchStart.x;
      const dy = this.touchEnd.y - this.touchStart.y;
      
      // Verificar si el movimiento fue significativo (>30px)
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 30) {
        let direction;
        
        // Determinar dirección principal (eje con mayor desplazamiento)
        if (Math.abs(dy) > Math.abs(dx)) {
          direction = dy > 0 ? 'down' : 'up';
        } else {
          direction = dx > 0 ? 'right' : 'left';
        }
        
        // Acumular dirección en el path
        this.touchPath = [...this.touchPath.slice(-7), direction];
        
        // Verificar si completó la secuencia
        this.checkTouchSequence();
      }
      
      this.isTouching = false;
      
      // Reset automático después de 3 segundos de inactividad
      clearTimeout(this.resetTimeout);
      this.resetTimeout = setTimeout(() => {
        this.touchPath = [];
      }, 3000);
    }
  
    // ✅ Verificar secuencia táctil
    checkTouchSequence() {
      // Secuencia táctil: ↑ ↑ ↓ ↓ ← → ← → (8 swipes)
      const targetSequence = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];
      
      if (this.touchPath.join(',') === targetSequence.join(',')) {
        this.unlockBadge();
        this.touchPath = []; // Reset después de desbloquear
      }
    }
  
    // 🔓 Desbloquear insignia
    async unlockBadge() {
      const badgeId = '45';
      const badgeName = '???';
      await loadPokedexData();
      
      // Verificar si ya la tiene (evitar duplicados)
      if (!pokedexData[pokedexData.length-1].Completed) {
        // Mostrar notificación con tus funciones existentes
        if (typeof showBadgeNotification === 'function') {
          showBadgeNotification(badgeName);
        } else {
          console.log(`🎉 ¡Insignia desbloqueada: ${badgeName}!`);
        }
        
        // Guardar en Google Sheets (si tienes la función)
        const data = {
          respuestasPorId: {
            "1": false,
            "2": false,
            "31": false,
            "32": false,
            "33": false,
            "34": false,
            "35": false,
            "36": false,
            "37": false,
            "41": false,
            "45": true
          },
          acceptedIndices: []
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
              userName: CONFIG.CURRENT_USERNAME(),
              acceptedIndices: JSON.stringify(data["acceptedIndices"]),
              respuestasPorId: JSON.stringify(data["respuestasPorId"])
            })
          })
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          
          const result = await response.json();
          if (!result.success) {
            console.warn('Web App no actualizó insignias:', result);
          }
        } catch (err) {
          console.error('Error al validar insignias en servidor:', err);
        }
      }
    }
  }
  
  // Inicializar detector Konami cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.konamiDetector = new KonamiDetector();
    });
  } else {
    window.konamiDetector = new KonamiDetector();
  }