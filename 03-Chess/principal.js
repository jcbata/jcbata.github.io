import { Juego, pensamientoMoverMejorValor, pensamientoMoverRandom, pensamientoMoverConMinimax } from './tablero.js';
import { BIBLIOTECA_EVALUACION } from './evaluacion.js';

let tablero, img, x, y;
let p5Canvas;
let lastMinimaxTime = 0;

// --- Bibliotecas de IA ---
const BIBLIOTECA_PENSAMIENTO = {
    'Minimax Paralelo': pensamientoMoverConMinimax,
    'Mejor Valor Inmediato': pensamientoMoverMejorValor,
    'Aleatorio': pensamientoMoverRandom
};

// --- Variables de estado de la UI ---
let gameMode = 'manual';
let isAutoPlaying = false;
let isPaused = false;
const NUM_PARTIDAS_TEST = 100;

// --- Variables de reporte ---
let contadorPartidas = 0, victoriasBlancas = 0, victoriasNegras = 0, partidasTablas = 0;
let logErrores = [];
let estadoTest = "Esperando para iniciar...";

// --- Capturador de Errores Global ---
window.onerror = function(message, source, lineno, colno, error) {
    if (gameMode !== 'auto') return;
    const errorInfo = { mensaje: message, fuente: source, linea: lineno, partidaNro: contadorPartidas + 1, movimientoNro: tablero ? tablero.movimientos.length : 0, turno: tablero ? tablero.turno : 'N/A' };
    logErrores.push(errorInfo);
    estadoTest = "¡ERROR DETECTADO! Revisar reporte y consola.";
    isAutoPlaying = false;
    console.error("ERROR CAPTURADO POR EL TEST RUNNER:", errorInfo);
    return true;
};

function preload(){
	img = loadImage('img/chess.png');
}

function setup() {
    noCanvas(); // No crear un canvas por defecto, lo manejaremos nosotros
	img.loadPixels();
	
	const uiElements = {
        modeManual: document.getElementById('mode-manual'),
        modeAuto: document.getElementById('mode-auto'),
        autoControls: document.getElementById('auto-controls'),
        manualControls: document.getElementById('manual-controls'),
        startBtn: document.getElementById('start-btn'),
        pauseBtn: document.getElementById('pause-btn'),
        stopBtn: document.getElementById('stop-btn'),
        whiteThoughtSelect: document.getElementById('white-thought'),
        whiteEvalSelect: document.getElementById('white-eval'),
        blackThoughtSelect: document.getElementById('black-thought'),
        blackEvalSelect: document.getElementById('black-eval'),
        blackThoughtManualSelect: document.getElementById('black-thought-manual'),
        blackEvalManualSelect: document.getElementById('black-eval-manual'),
        whiteDepthInput: document.getElementById('white-depth'),
        blackDepthInput: document.getElementById('black-depth'),
        blackDepthManualInput: document.getElementById('black-depth-manual')
    };

    function populateSelect(selectElement, library) {
        for (const key in library) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            selectElement.appendChild(option);
        }
    }
    populateSelect(uiElements.whiteThoughtSelect, BIBLIOTECA_PENSAMIENTO);
    populateSelect(uiElements.whiteEvalSelect, BIBLIOTECA_EVALUACION);
    populateSelect(uiElements.blackThoughtSelect, BIBLIOTECA_PENSAMIENTO);
    populateSelect(uiElements.blackEvalSelect, BIBLIOTECA_EVALUACION);
    populateSelect(uiElements.blackThoughtManualSelect, BIBLIOTECA_PENSAMIENTO);
    populateSelect(uiElements.blackEvalManualSelect, BIBLIOTECA_EVALUACION);

    uiElements.whiteThoughtSelect.value = 'Minimax Paralelo';
    uiElements.whiteEvalSelect.value = 'mejorada_con_centro';
    uiElements.blackThoughtSelect.value = 'Minimax Paralelo';
    uiElements.blackEvalSelect.value = 'con_estado_buggy';
    uiElements.blackThoughtManualSelect.value = 'Minimax Paralelo';
    uiElements.blackEvalManualSelect.value = 'con_estado_buggy';

    function toggleDepthInput(thoughtSelect, depthInput) {
        if (thoughtSelect.value === 'Minimax Paralelo') {
            depthInput.style.display = 'block';
            depthInput.previousElementSibling.style.display = 'block';
        } else {
            depthInput.style.display = 'none';
            depthInput.previousElementSibling.style.display = 'none';
        }
    }

    uiElements.whiteThoughtSelect.addEventListener('change', () => toggleDepthInput(uiElements.whiteThoughtSelect, uiElements.whiteDepthInput));
    uiElements.blackThoughtSelect.addEventListener('change', () => toggleDepthInput(uiElements.blackThoughtSelect, uiElements.blackDepthInput));
    uiElements.blackThoughtManualSelect.addEventListener('change', () => toggleDepthInput(uiElements.blackThoughtManualSelect, uiElements.blackDepthManualInput));

    toggleDepthInput(uiElements.whiteThoughtSelect, uiElements.whiteDepthInput);
    toggleDepthInput(uiElements.blackThoughtSelect, uiElements.blackDepthInput);
    toggleDepthInput(uiElements.blackThoughtManualSelect, uiElements.blackDepthManualInput);

	function updateGameMode() {
		gameMode = document.querySelector('input[name="game-mode"]:checked').value;
		if (gameMode === 'manual') {
			uiElements.autoControls.style.display = 'none';
            uiElements.manualControls.style.display = 'block';
			isAutoPlaying = false;
			isPaused = false;
			estadoTest = "Modo Manual";
		} else {
			uiElements.autoControls.style.display = 'block';
            uiElements.manualControls.style.display = 'none';
			estadoTest = "Listo para iniciar simulación.";
		}
		reiniciarPartida();
	}

	uiElements.modeManual.addEventListener('change', updateGameMode);
	uiElements.modeAuto.addEventListener('change', updateGameMode);

	uiElements.startBtn.addEventListener('click', () => {
		if (isAutoPlaying) return;
		isAutoPlaying = true;
		isPaused = false;
		contadorPartidas = 0;
		victoriasBlancas = 0;
		victoriasNegras = 0;
		partidasTablas = 0;
		logErrores = [];
		estadoTest = `Iniciando simulación...`;
		reiniciarPartida();
		moveAuto();
	});

	uiElements.pauseBtn.addEventListener('click', () => {
		if (!isAutoPlaying) return;
		isPaused = !isPaused;
		if (isPaused) {
			uiElements.pauseBtn.textContent = 'Reanudar';
			estadoTest = 'Simulación pausada.';
		} else {
			uiElements.pauseBtn.textContent = 'Pausar';
			estadoTest = 'Reanudando simulación...';
			moveAuto();
		}
	});

	uiElements.stopBtn.addEventListener('click', () => {
		isAutoPlaying = false;
		isPaused = false;
		estadoTest = 'Simulación detenida por el usuario.';
		uiElements.pauseBtn.textContent = 'Pausar';
	});

    updateGameMode();
}

function reiniciarPartida() {
    const canvasContainer = document.getElementById('canvas-container');
    let size = Math.min(canvasContainer.clientWidth, canvasContainer.clientHeight);
    if (!p5Canvas) {
        p5Canvas = createCanvas(size, size);
        p5Canvas.parent('canvas-container');
    } else {
        resizeCanvas(size, size);
    }

    tablero = new Juego([
        [-4,-2,-3,-5,-6,-3,-2,-4], [-1,-1,-1,-1,-1,-1,-1,-1], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [1,1,1,1,1,1,1,1], [4,2,3,5,6,3,2,4]
    ]);
    tablero.tam = size / 10;
    
    const uiElements = {
        whiteThoughtSelect: document.getElementById('white-thought'),
        whiteEvalSelect: document.getElementById('white-eval'),
        blackThoughtSelect: document.getElementById('black-thought'),
        blackEvalSelect: document.getElementById('black-eval'),
        blackThoughtManualSelect: document.getElementById('black-thought-manual'),
        blackEvalManualSelect: document.getElementById('black-eval-manual'),
        whiteDepthInput: document.getElementById('white-depth'),
        blackDepthInput: document.getElementById('black-depth'),
        blackDepthManualInput: document.getElementById('black-depth-manual')
    };

    if (gameMode === 'manual') {
        tablero.auto_b = false;
        tablero.auto_n = true;
        tablero.fPensamientoBlancas = null;
        tablero.fdeBlancas = null; // No es necesario para humanos
        tablero.fPensamientoNegras = BIBLIOTECA_PENSAMIENTO[uiElements.blackThoughtManualSelect.value];
        tablero.fdeNegras = BIBLIOTECA_EVALUACION[uiElements.blackEvalManualSelect.value];
    } else { // modo 'auto'
        tablero.auto_b = true;
        tablero.auto_n = true;
        tablero.fPensamientoBlancas = BIBLIOTECA_PENSAMIENTO[uiElements.whiteThoughtSelect.value];
        tablero.fdeBlancas = BIBLIOTECA_EVALUACION[uiElements.whiteEvalSelect.value];
        tablero.fPensamientoNegras = BIBLIOTECA_PENSAMIENTO[uiElements.blackThoughtSelect.value];
        tablero.fdeNegras = BIBLIOTECA_EVALUACION[uiElements.blackEvalSelect.value];
    }

    tablero.cargaPiezas(img);
}

function windowResized() {
    const canvasContainer = document.getElementById('canvas-container');
    let size = Math.min(canvasContainer.clientWidth, canvasContainer.clientHeight);
    resizeCanvas(size, size);
    if (tablero) {
        tablero.tam = size / 10;
    }
}

function draw() {
    if (!tablero) return;
    window.tablero = tablero;
	
	if (gameMode === 'auto') {
		const reportDiv = document.getElementById('test-report');
		if (reportDiv) {
			let errorDetails = logErrores.map(e => `  - ${e.mensaje} (Partida ${e.partidaNro}, Movimiento ${e.movimientoNro})`).join('\n');
			reportDiv.textContent = 
`=========================
TEST RUNNER DE AJEDREZ
=========================
Estado: ${estadoTest}
Partidas Jugadas: ${contadorPartidas} / ${NUM_PARTIDAS_TEST}
Movimientos (partida actual): ${tablero ? tablero.movimientos.length : 0}
Tiempo IA (último mov): ${lastMinimaxTime} ms
---
Marcador ---
Blancas: ${victoriasBlancas} | Negras:  ${victoriasNegras} | Tablas:  ${partidasTablas}
---
Errores Capturados: ${logErrores.length} ---
${logErrores.length > 0 ? errorDetails : ''}
`;
		}
	} else {
        const reportDiv = document.getElementById('test-report');
        if(reportDiv) reportDiv.textContent = "Modo de juego: Manual (Humano vs. IA)";
    }

	clear();
	tablero.dibujar([255,200,12,255]);
	for(let z=0;z<tablero.piezas.length;z++){
		tablero.piezas[z].dibujar(0);
	}
	tablero.dibujaBarrasDeValor(tablero);
	tablero.dibujaMensaje(tablero);
}

function cargaFen(){
	let valorFEN = document.getElementById("factor");
	if(valorFEN.value==''){
		valorFEN.value="rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";
	}
	tablero.updateFEN(valorFEN.value);
	tablero.cargaPiezas(img);
}

function mouseMoved() { x = mouseX; y = mouseY; }

function mousePressed() {
    if (gameMode === 'auto' && isAutoPlaying) return;
	x = mouseX;
	y = mouseY;
	if(tablero.posSel[0]===-1){
		tablero.posSel = tablero.fCoordMouse(x,y);
		tablero.piezaSel = tablero.posSel;
	}else{
		tablero.posSel = [-1,-1];
		tablero.piezaSel = [-1,-1];
	}
}

function mouseDragged() {
    if (gameMode === 'auto' && isAutoPlaying) return;
	x = mouseX;
	y = mouseY;
	for(let i=0;i<tablero.piezas.length;i++){
		tablero.piezas[i].coord = [tablero.piezas[i].pos[0]*tablero.tam,tablero.piezas[i].pos[1]*tablero.tam];
		if(mouseIsPressed){
			if(tablero.piezas[i].pos[0] == tablero.posSel[0] && tablero.piezas[i].pos[1] == tablero.posSel[1]){
				if(mouseX > tablero.tablero[0].length*tablero.tam -tablero.tam/2) x=tablero.tablero[0].length*tablero.tam-tablero.tam/2;
				if(mouseX < tablero.tam/2) x=tablero.tam/2;
				if(mouseY > tablero.tablero.length*tablero.tam -tablero.tam/2) y=tablero.tablero.length*tablero.tam-tablero.tam/2;
				if(mouseY < tablero.tam/2) y=tablero.tam/2;
				tablero.piezas[i].coord = [y-tablero.tam/2,x-tablero.tam/2];
			}
		}
	}
}

async function touchEnded() {
    if (gameMode === 'auto' && isAutoPlaying) return;
	if (tablero.posSel[0] === -1) return;

	const piezaSeleccionada = tablero.piezas.find(p => p.pos[0] === tablero.posSel[0] && p.pos[1] === tablero.posSel[1]);

	if (piezaSeleccionada) {
		const posDestino = tablero.fCoordMouse(mouseX, mouseY);
		if (tablero.tablero[0].length * tablero.tam >= mouseX && tablero.tablero.length * tablero.tam >= mouseY) {
			if (tablero.mover(piezaSeleccionada, posDestino) > 0) {
				tablero.actualizarEstadoJuego();
			}
		}
	}

	tablero.posSel = [-1,-1];
	tablero.piezaSel = [-1,-1];
	for (const p of tablero.piezas) { p.coord = [p.pos[0] * tablero.tam, p.pos[1] * tablero.tam]; }

	if (gameMode === 'manual' && tablero.jaqueMate === 0 && tablero.tablas === 0 && tablero.turno < 0 && tablero.auto_n) {
		const startTime = performance.now();
        let mov = null;
        if(typeof tablero.fPensamientoNegras === 'function') {
            const depth = parseInt(document.getElementById('black-depth-manual').value, 10);
		    mov = await tablero.fPensamientoNegras(tablero, depth);
        }
        const endTime = performance.now();
        lastMinimaxTime = (endTime - startTime).toFixed(2);
		
		if (mov && mov[0]) {
			const piezaReal = tablero.piezas.find(p => p.pos[0] === mov[0].pos[0] && p.pos[1] === mov[0].pos[1]);
			if (piezaReal && tablero.mover(piezaReal, mov[1]) > 0) {
				tablero.actualizarEstadoJuego();
			} else {
				console.error("La IA (Negras) eligió un movimiento ilegal o no se encontró la pieza:", mov);
			}
		}
		document.getElementById("factor").value = tablero.readFEN();
	}
}

function mouseWheel(event) { return false; }
function keyTyped() { }

function sleep(millisecondsDuration) {
  return new Promise((resolve) => {
    setTimeout(resolve, millisecondsDuration);
  });
}

function moveAuto() {
	sleep(50).then(async function() {
		if (!isAutoPlaying || isPaused || logErrores.length > 0) {
			return;
		}

		if (tablero.jaqueMate + tablero.tablas > 0) {
			if (tablero.jaqueMate > 0) {
				if (tablero.turno > 0) { victoriasNegras++; } else { victoriasBlancas++; }
			} else {
				partidasTablas++;
			}
			contadorPartidas++;
			
			if (contadorPartidas >= NUM_PARTIDAS_TEST) {
				estadoTest = `¡SIMULACIÓN COMPLETA! ${NUM_PARTIDAS_TEST} partidas finalizadas.`;
				isAutoPlaying = false;
				return;
			}
			estadoTest = `Partida ${contadorPartidas} finalizada. Jugando partida ${contadorPartidas + 1}...`;
			reiniciarPartida();
			moveAuto();
			return; 
		}

		let moveResult = 0;
		let mov = null;
        const startTime = performance.now();

		if (tablero.movimientos.length < 4) { 
			moveResult = pensamientoMoverRandom(tablero);
			if (moveResult > 0) tablero.actualizarEstadoJuego();
		} else {
            if (tablero.turno > 0) {
                if(typeof tablero.fPensamientoBlancas === 'function') {
                    const depth = parseInt(document.getElementById('white-depth').value, 10);
                    mov = await tablero.fPensamientoBlancas(tablero, depth); 
                }
            } else {
                if(typeof tablero.fPensamientoNegras === 'function') {
                    const depth = parseInt(document.getElementById('black-depth').value, 10);
                    mov = await tablero.fPensamientoNegras(tablero, depth); 
                }
            }
            
            if (mov && mov[0]) {
                const piezaReal = tablero.piezas.find(p => p.pos[0] === mov[0].pos[0] && p.pos[1] === mov[0].pos[1]);
                if (piezaReal) {
                    moveResult = tablero.mover(piezaReal, mov[1]);
                    if (moveResult > 0) tablero.actualizarEstadoJuego();
                } else { moveResult = -1; } // Pieza no encontrada
            } else {
                if (tablero.jaqueMate > 0 || tablero.tablas > 0) { moveResult = 1; } 
                else { moveResult = -1; } // Movimiento inválido o juego no terminado
            }
		}
        const endTime = performance.now();
        lastMinimaxTime = (endTime - startTime).toFixed(2);

		if (moveResult < 0) {
			const errorInfo = {
				mensaje: "La IA no pudo realizar un movimiento legal y el juego no ha terminado.",
				fuente: "moveAuto()",
				partidaNro: contadorPartidas + 1,
				movimientoNro: tablero.movimientos.length,
				urno: tablero.turno > 0 ? 'Blancas' : 'Negras'
			};
			logErrores.push(errorInfo);
			estadoTest = "¡ERROR DETECTADO! La IA no pudo mover.";
			isAutoPlaying = false;
			console.error("ERROR DETECTADO:", errorInfo);
			return; 
		}

		moveAuto();
	});
}

// --- Exponer funciones a p5.js en el ámbito global ---
window.preload = preload;
window.setup = setup;
window.draw = draw;
window.mouseMoved = mouseMoved;
window.mousePressed = mousePressed;
window.mouseDragged = mouseDragged;
window.touchEnded = touchEnded;
window.mouseWheel = mouseWheel;
window.keyTyped = keyTyped;
window.cargaFen = cargaFen;
window.windowResized = windowResized;