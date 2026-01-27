// Estado de la aplicación
let currentPage = 0;
let selectedEntry = null;
let totalPages = 0; // ← ahora es variable, no constante

// Elementos del DOM
const imageGrid = document.getElementById('imageGrid');
const pageInfo = document.getElementById('pageInfo');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const detailPanel = document.getElementById('detailPanel');
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('closeBtn');

// === Funciones (igual que antes, pero usan pokedexData global) ===

function renderImageGrid() {
    const startIndex = currentPage * 10;
    const endIndex = startIndex + 10;
    const currentEntries = pokedexData.slice(startIndex, endIndex); // ← usa pokedexData
    
    const slots = [...currentEntries];
    while (slots.length < 10) {
        slots.push(null);
    }
    
    imageGrid.innerHTML = '';
    
    slots.forEach((entry) => {
        const gridItem = document.createElement('div');
        gridItem.className = entry ? 'grid-item' : 'grid-item empty';
        
        if (entry) {
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'img-wrapper';

            const img = document.createElement('img');
            img.src = `Insignias/${entry.ID}.png`;
            img.alt = entry.Título;
            img.className = entry.Completed ? 'visual' : 'gris';
            img.onerror = () => { img.src = 'Errores/error.png'; };

            imgWrapper.appendChild(img);

            // Si no está completado, añadimos un overlay oscuro
            if (!entry.Completed) {
                const overlay = document.createElement('div');
                overlay.className = 'badge-overlay';
                imgWrapper.appendChild(overlay);
            }

            gridItem.appendChild(imgWrapper);
            gridItem.addEventListener('click', () => openDetailPanel(entry));
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'placeholder';
            const img = document.createElement('img');
            img.src = 'Errores/error.png';
            placeholder.appendChild(img);
            gridItem.appendChild(placeholder);
        }
        
        imageGrid.appendChild(gridItem);
    });
    
    updatePageInfo();
}

function updatePageInfo() {
    pageInfo.textContent = `${currentPage + 1} / ${totalPages}`;
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
}

function openDetailPanel(entry) {
    selectedEntry = entry;
    const panelImg = document.getElementById('panelImage');
    panelImg.src = entry.Completed ? `Insignias/${entry.ID}.png` : 'Errores/error.png';
    panelImg.alt = entry.Título;
    panelImg.onerror = function() { this.src = "Errores/error.png"; };
    
    document.getElementById('panelId').textContent = `#${entry.ID.toString().padStart(3, '0')}`;
    document.getElementById('panelTitle').textContent = entry.Título;
    document.getElementById('panelDescription').textContent = entry.Descripción;
    
    const statusBadge = document.getElementById('panelStatus');
    statusBadge.className = entry.Completed ? 'status-badge completed' : 'status-badge not-completed';
    statusBadge.querySelector('span').textContent = entry.Completed ? 'Capturado' : 'No capturado';
    
    detailPanel.classList.add('open');
    overlay.classList.add('active');
}

function closeDetailPanel() {
    detailPanel.classList.remove('open');
    overlay.classList.remove('active');
}

// Event listeners
prevBtn.addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        renderImageGrid();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages - 1) {
        currentPage++;
        renderImageGrid();
    }
});

closeBtn.addEventListener('click', closeDetailPanel);
overlay.addEventListener('click', closeDetailPanel);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetailPanel();
});

// === Inicialización CORRECTA ===
async function initializeApp() {
    await loadPokedexData();
    const totalBadges = pokedexData.length; 
    totalPages = Math.ceil(totalBadges / 10); // ← ahora sí tiene datos
    const suma = pokedexData.filter(entry => entry.Completed).length;
    const percentage = totalBadges > 0 ? (suma / totalBadges) * 100 : 0;

    document.getElementById('progressCount').textContent = suma;
    document.getElementById('totalBadges').textContent = totalBadges;
    document.getElementById('progressFill').style.width = percentage + '%'; 

    renderImageGrid();
    const currentStreak = await loadCurrentStreak();
    const streakElement = document.getElementById('currentStreak');
    if (streakElement) {
    streakElement.textContent = currentStreak;
    }
}

// Cargar datos y luego inicializar
document.addEventListener('DOMContentLoaded', initializeApp);