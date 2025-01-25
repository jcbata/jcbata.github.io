// gameLogic.js

// Función para manejar el "atrapar" una mosca
function catchFly(event) {
    const fly = event.target;

    if (!fly.clicked) { // Solo procesa el clic si no se ha marcado como atrapada
        fly.clicked = true; // Marca la mosca como atrapada
        score++;
        scoreDisplay.textContent = score;

        // Ajusta el intervalo de movimiento cada 10 puntos
        if (score % 10 === 0 && moveInterval > 500) {
            moveInterval -= 100;
            updateInterval(); // Reinicia el temporizador con el nuevo intervalo
        }

        // Sube de nivel cada 50 puntos
        if (score % 50 === 0) {
            levelUp();
        }
    }
}
