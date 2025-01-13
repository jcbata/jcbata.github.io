let score = 0;
let lives = 5;
let squareClicked = false;

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

// Evento de clic para aumentar el puntaje y marcar que se hizo clic
square.addEventListener("click", () => {
    score++;
    scoreDisplay.textContent = score;
    squareClicked = true; // Indica que el cuadrado fue atrapado
    moveSquare(); // Mueve el cuadrado inmediatamente al atraparlo
});

// Función para reiniciar el juego
function resetGame() {
    score = 0;
    lives = 5;
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
}

// Mueve el cuadrado cada segundo
setInterval(moveSquare, 1000);
