// render.js

// Función para mover una mosca a una posición aleatoria
function moveFly(fly) {
    const maxX = gameArea.clientWidth - fly.clientWidth;
    const maxY = gameArea.clientHeight - fly.clientHeight;
    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);

    fly.style.left = `${randomX}px`;
    fly.style.top = `${randomY}px`;
}

// Función para mover todas las moscas
function moveFlies() {
    flies.forEach(fly => {
        if (!fly.clicked) {
            // Si la mosca no fue atrapada, resta una vida
            lives--;
            livesDisplay.textContent = lives;

            // Verifica si el juego ha terminado
            if (lives <= 0) {
                alert("¡Juego terminado! Puntuación final: " + score);
                resetGame();
                return;
            }
        }

        // Reinicia el estado de clic de la mosca
        fly.clicked = false;

        // Mueve la mosca a una nueva posición
        moveFly(fly);
    });
}

// Función para añadir una nueva mosca
function addFly() {
    const fly = document.createElement("div");
    fly.classList.add("fly");
    fly.clicked = false; // Asegúrate de inicializar el estado de clic correctamente
    fly.addEventListener("click", catchFly);
    fly.addEventListener("touchstart", catchFly);
    gameArea.appendChild(fly);
    flies.push(fly);
    moveFly(fly); // Coloca la mosca en una posición inicial aleatoria
}

// Función para subir de nivel
function levelUp() {
    level++;
    addFly(); // Añade una nueva mosca
}

// Función para actualizar el temporizador
function updateInterval() {
    clearInterval(moveTimer); // Detiene el temporizador anterior
    moveTimer = setInterval(moveFlies, moveInterval); // Configura un nuevo temporizador
}

// Función para reiniciar el juego
function resetGame() {
    score = 0;
    lives = 5;
    level = 1;
    moveInterval = 2000; // Reinicia el intervalo a 2000 ms
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;

    // Elimina todas las moscas actuales
    flies.forEach(fly => {
        if (fly.parentElement === gameArea) {
            gameArea.removeChild(fly);
        }
    });
    flies.length = 0;

    // Añade la primera mosca
    addFly();
    updateInterval(); // Reinicia el temporizador
}
