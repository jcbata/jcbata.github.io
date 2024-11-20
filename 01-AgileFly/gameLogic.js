// gameLogic.js

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

// Inicia el juego por primera vez
updateInterval();
