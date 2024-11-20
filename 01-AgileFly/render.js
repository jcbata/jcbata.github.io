// render.js

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

// Función para reiniciar el juego
function resetGame() {
    score = 0;
    lives = 5;
    moveInterval = 2000; // Reinicia el intervalo a 2000 ms
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    updateInterval(); // Reinicia el temporizador al valor inicial
}
