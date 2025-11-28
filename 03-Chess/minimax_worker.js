/**
 * @file minimax_worker.js
 * @description Web Worker para calcular el mejor movimiento de ajedrez usando Minimax en un hilo separado.
 * Este archivo está diseñado para ser ligero y autocontenido.
 */

import { EstadoJuego } from './estado.js';
import { BIBLIOTECA_EVALUACION } from './evaluacion.js';

/**
 * La función principal de Minimax con poda Alfa-Beta.
 * @param {EstadoJuego} estado - El estado actual del juego.
 * @param {number} profundidad - La profundidad de búsqueda restante.
 * @param {number} alpha - El mejor valor encontrado hasta ahora para el maximizador.
 * @param {number} beta - El mejor valor encontrado hasta ahora para el minimizador.
 * @param {boolean} isMaximizingPlayer - ¿Es el turno del jugador maximizador?
 * @param {function} fEval - La función de evaluación a utilizar.
 * @returns {number} La puntuación del estado.
 */
function minimax(estado, profundidad, alpha, beta, isMaximizingPlayer, fEval) {
    // --- Comprobación de Nodos Terminales ---

    // 1. Reglas de Tablas
    if (estado.halfmoveClock >= 100) return 0; // Tablas por regla de 50 movimientos
    const currentFenPos = estado.getFenPosition();
    const repetitions = estado.history.filter(h => h.split(' ')[0] === currentFenPos.split(' ')[0]).length;
    if (repetitions >= 3) return 0; // Tablas por triple repetición

    // 2. Profundidad máxima alcanzada
    if (profundidad === 0) {
        return fEval(estado);
    }

    const movimientos = estado.generarMovimientos();

    // 3. Jaque Mate o Ahogado
    if (movimientos.length === 0) {
        const jaque = estado.validaJaque();
        if (jaque.jaqueKb !== 0 || jaque.jaqueKn !== 0) {
            return -Infinity; // Jaque mate, la peor puntuación para el jugador actual
        } else {
            return 0; // Ahogado (Tablas)
        }
    }

    // --- Búsqueda Recursiva ---
        let maxEval = -Infinity;
        for (const mov of movimientos) {
            const nuevoEstado = estado.clonar();
            const piezaEnNuevoEstado = nuevoEstado.piezas.find(p => p.pos[0] === mov.pieza.pos[0] && p.pos[1] === mov.pieza.pos[1]);
            nuevoEstado._mover(piezaEnNuevoEstado, mov.destino);
            
            const evaluation = minimax(nuevoEstado, profundidad - 1, alpha, beta, false, fEval);
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) {
                break; // Poda Beta
            }
        }
        return maxEval;
    } else { // Minimizing Player
        let minEval = Infinity;
        for (const mov of movimientos) {
            const nuevoEstado = estado.clonar();
            const piezaEnNuevoEstado = nuevoEstado.piezas.find(p => p.pos[0] === mov.pieza.pos[0] && p.pos[1] === mov.pieza.pos[1]);
            nuevoEstado._mover(piezaEnNuevoEstado, mov.destino);

            const evaluation = minimax(nuevoEstado, profundidad - 1, alpha, beta, true, fEval);
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) {
                break; // Poda Alpha
            }
        }
        return minEval;
    }
}

self.onmessage = function(e) {
    const { estadoData, profundidad, evalFunctionName } = e.data;

    // 1. Reconstituir la instancia de EstadoJuego a partir de los datos simples.
    const estado = new EstadoJuego(estadoData);
    
    // 2. Obtener la función de evaluación desde la biblioteca.
    const fEval = BIBLIOTECA_EVALUACION[evalFunctionName];

    if (!fEval) {
        console.error(`Worker: La función de evaluación "${evalFunctionName}" no fue encontrada.`);
        self.postMessage({ score: -Infinity }); // Devolver un mal resultado para no romper la promesa.
        return;
    }

    // 3. El estado que recibimos es para que el oponente (maximizador) lo evalúe.
    // El hilo principal ya hizo el primer movimiento.
    const score = minimax(estado, profundidad, -Infinity, Infinity, true, fEval);

    // 4. Devolver la puntuación al hilo principal.
    self.postMessage({ score: score });
};