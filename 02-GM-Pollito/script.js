let score = 0;
let lives = 5;
let squareClicked = false;
let moveInterval = 2000; // Tiempo inicial de 2000 ms
let moveTimer; // Variable para el temporizador de movimiento

// Selecciona los elementos necesarios
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const square = document.getElementById("square");
const gameArea = document.getElementById("game-area");

// Función para mover el cuadrado a una posición aleatoria
function moveSquare() {
    // Verifica si el cuadrado fue atrapado; si no, resta una vida
    if (!squareClicked) {
        lives--; // Resta una vida si no se hizo clic
        livesDisplay.textContent = lives;

        // Verifica si el juego ha terminado
        if (lives <= 0) {
            alert("¡Juego terminado! Puntuación final: " + score);
            resetGame();
            return;
        }
    }

    // Resetea el indicador de clic para la próxima vez
    squareClicked = false;

    // Mueve el cuadrado a una posición aleatoria
    const maxX = gameArea.clientWidth - square.clientWidth;
    const maxY = gameArea.clientHeight - square.clientHeight;
    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);

    square.style.left = `${randomX}px`;
    square.style.top = `${randomY}px`;
}

// Función para actualizar el intervalo de movimiento y reiniciar el temporizador
function updateInterval() {
    clearInterval(moveTimer); // Detiene el temporizador anterior
    moveTimer = setInterval(moveSquare, moveInterval); // Inicia un nuevo temporizador con el intervalo actualizado
}

// Función para manejar el "atrapar" el cuadrado (clic o toque)
function catchSquare() {
    score++;
    scoreDisplay.textContent = score;
    squareClicked = true; // Indica que el cuadrado fue atrapado
    moveSquare(); // Mueve el cuadrado inmediatamente al atraparlo
    updateInterval(); // Reinicia el temporizador de movimiento

    // Ajusta el intervalo de movimiento cada 10 puntos
    if (score % 10 === 0 && moveInterval > 500) { // Límite mínimo de 500 ms
        moveInterval -= 100;
    }
}

// Agrega los eventos de clic y toque al cuadrado
square.addEventListener("click", catchSquare);
square.addEventListener("touchstart", catchSquare); // Detecta toques en dispositivos móviles

// Función para reiniciar el juego
function resetGame() {
    score = 0;
    lives = 5;
    moveInterval = 2000; // Reinicia el intervalo a 2000 ms
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    updateInterval(); // Reinicia el temporizador al valor inicial
}

// Inicia el juego por primera vez
updateInterval();
