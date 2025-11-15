import { Juego, pensamientoMoverMejorValor, pensamientoMoverRandom, pensamientoMoverConMinimax } from './tablero.js';
import { BIBLIOTECA_EVALUACION } from './evaluacion.js';

let width = screen.width, height = screen.height;
let tablero, img, x, y;
let lastMinimaxTime = 0;

// --- Variables para el Test Runner Automático ---
const MODO_TEST = true; // Poner en true para activar las pruebas automáticas
const NUM_PARTIDAS_TEST = 100; // Número de partidas a simular
let contadorPartidas = 0;
let victoriasBlancas = 0;
let victoriasNegras = 0;
let partidasTablas = 0;
let logErrores = [];
let estadoTest = "Iniciando...";

// --- Capturador de Errores Global ---
window.onerror = function(message, source, lineno, colno, error) {
    const errorInfo = {
        mensaje: message,
        fuente: source,
        linea: lineno,
        partidaNro: contadorPartidas + 1,
        movimientoNro: tablero ? tablero.movimientos.length : 0,
        turno: tablero ? tablero.turno : 'N/A'
    };
    logErrores.push(errorInfo);
    // El error detendrá el bucle de moveAuto, pero dejamos que draw() siga corriendo para mostrar el reporte.
    estadoTest = "¡ERROR DETECTADO! Revisar reporte y consola.";
    console.error("ERROR CAPTURADO POR EL TEST RUNNER:", errorInfo);
    return true; // Previene que el error se muestre en la consola por defecto.
};


function preload(){
	img = loadImage('img/chess.png');
	
}

function setup() {
	createCanvas(width, height);

	// Carga imágen
	img.loadPixels();
	
		//carga tablero
	tablero = new Juego([
			[-4,-2,-3,-5,-6,-3,-2,-4],
			[-1,-1,-1,-1,-1,-1,-1,-1],
			[0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0],
			[1,1,1,1,1,1,1,1],
			[4,2,3,5,6,3,2,4]
		]);
	
	//tablero.updateFEN("rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3");
	/** 
		Mmm la idea de tener diferente función de evaluación para blancas y negras es mejorar el algoritmo 
		al enfrentarlos *Se debería incluir 2 barra de evaluación una por cada función!

	*/
	tablero.tam = Math.min(width, height) / 8 / 2;
	tablero.auto_n=true;
	// Prueba: Blancas (Mejorada con Centro) vs Negras (Campeona Actual)
	tablero.fdeNegras = BIBLIOTECA_EVALUACION.con_estado_buggy;
	tablero.fdeBlancas = BIBLIOTECA_EVALUACION.mejorada_con_centro;
	//tablero.fdeBlancas = BIBLIOTECA_EVALUACION.con_rey_buggy;

    // Asigna las funciones de pensamiento (IA)
    tablero.fPensamientoNegras = pensamientoMoverConMinimax; // Negras usan el pensamiento de 1 movimiento
    tablero.fPensamientoBlancas = pensamientoMoverMejorValor; // Blancas usan el pensamiento de 1 movimiento
	tablero.cargaPiezas(img);
	
	
	if (MODO_TEST) {
		estadoTest = `Jugando partida ${contadorPartidas + 1} de ${NUM_PARTIDAS_TEST}...`;
		moveAuto();
	}
	//mueveRandom(); //juega solo en random
	
}
function cargaFen(){
	let valorFEN = document.getElementById("factor");
	if(valorFEN.value==''){
		valorFEN.value="rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";
	}
	tablero.updateFEN(valorFEN.value);
	tablero.cargaPiezas(img);
}


function draw() {
    window.tablero = tablero; // Expose for debugging
	// --- Lógica de Reporte del Test Runner ---
	if (MODO_TEST) {
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
    Tiempo Minimax (último mov): ${lastMinimaxTime} ms

--- Marcador ---
Blancas: ${victoriasBlancas}
Negras:  ${victoriasNegras}
Tablas:  ${partidasTablas}

Errores Capturados: ${logErrores.length}
${logErrores.length > 0 ? 'Detalles de Errores:\n' + errorDetails : ''}
`;
		}
	}

	//background(0);
	clear();
	tablero.dibujar([255,200,12,255]);

	for(let z=0;z<tablero.piezas.length;z++){
		tablero.piezas[z].dibujar(0);
		
	}

	tablero.dibujaBarrasDeValor(tablero);
	tablero.dibujaMensaje(tablero);
    
    // Display Minimax time outside of test mode
    if (!MODO_TEST && lastMinimaxTime > 0) {
        fill(255);
        text(`Tiempo Minimax: ${lastMinimaxTime} ms`, 10, height - 20);
    }

	//tablero.dibujaMovimientoPosible();


	
	

}

function mouseMoved() {
	x = mouseX;
	y = mouseY;
	
}

function mousePressed() {
	x = mouseX;
	y = mouseY;
	
	if(tablero.posSel[0]===-1){

	//fullscreen(true);
		console.log(tablero.fCoordMouse(x,y));
		tablero.posSel = tablero.fCoordMouse(x,y);
		tablero.piezaSel = tablero.posSel;
	}else{
		tablero.posSel = [-1,-1];
		tablero.piezaSel = [-1,-1];
	}

}
function mouseDragged() {
	x = mouseX;
	y = mouseY;

	
	
	for(let i=0;i<tablero.piezas.length;i++){


		tablero.piezas[i].coord = [tablero.piezas[i].pos[0]*tablero.tam,tablero.piezas[i].pos[1]*tablero.tam];
		

		if(mouseIsPressed){
			
			if(tablero.piezas[i].pos[0] == tablero.posSel[0] && tablero.piezas[i].pos[1] == tablero.posSel[1]){


				if(mouseX > tablero.tablero[0].length*tablero.tam -tablero.tam/2)					
					x=tablero.tablero[0].length*tablero.tam-tablero.tam/2;
				if(mouseX < tablero.tam/2)					
					x=tablero.tam/2;

				if(mouseY > tablero.tablero.length*tablero.tam -tablero.tam/2)
					y=tablero.tablero.length*tablero.tam-tablero.tam/2;
				if(mouseY < tablero.tam/2)					
					y=tablero.tam/2;


				tablero.piezas[i].coord = [y-tablero.tam/2,x-tablero.tam/2];
			}

		}
	
	}
	

	
}

async function touchEnded() {
	// 1. Si no hay una pieza seleccionada, no hacer nada.
	if (tablero.posSel[0] === -1) {
		return;
	}

	// 2. Encontrar el objeto de la pieza seleccionada en el array de piezas.
	const piezaSeleccionada = tablero.piezas.find(p => p.pos[0] === tablero.posSel[0] && p.pos[1] === tablero.posSel[1]);

	// 3. Si se encontró la pieza, intentar moverla a la posición del ratón.
	if (piezaSeleccionada) {
		const posDestino = tablero.fCoordMouse(mouseX, mouseY);
		
		// Validar que el movimiento está dentro del tablero y ejecutarlo.
		if (tablero.tablero[0].length * tablero.tam >= mouseX && tablero.tablero.length * tablero.tam >= mouseY) {
			if (tablero.mover(piezaSeleccionada, posDestino) > 0) {
				tablero.actualizarEstadoJuego();
			}
		}
	}

	// 4. Limpiar la selección y reajustar las coordenadas visuales de todas las piezas a la cuadrícula.
	tablero.posSel = [-1, -1];
	tablero.piezaSel = [-1, -1];
	for (const p of tablero.piezas) {
		p.coord = [p.pos[0] * tablero.tam, p.pos[1] * tablero.tam];
	}

	// 5. Si es el turno de la IA, ejecutar su lógica.
	if (tablero.jaqueMate === 0 && tablero.tablas === 0 && tablero.turno < 0 && tablero.auto_n) {
		if (tablero.movimientos.length < 3) {
			pensamientoMoverRandom(tablero);
			tablero.actualizarEstadoJuego();
		} else {
			// Usa el método clonar para que la IA piense en un estado limpio.
			const startTime = performance.now();
			// Await the promise returned by the new async Minimax function
			let mov = await tablero.fPensamientoNegras(tablero, 2);
            const endTime = performance.now();
            lastMinimaxTime = (endTime - startTime).toFixed(2);
			
			// El estado de jaqueMate/tablas se actualiza dentro de la función de pensamiento si no hay movimientos.
			// No es necesario copiarlo desde un juego temporal.

			// Traduce la pieza de la simulación a la pieza real del tablero principal.
			if (mov && mov[0]) {
				const piezaOrigenPos = mov[0].pos;
				const piezaReal = tablero.piezas.find(p => p.pos[0] === piezaOrigenPos[0] && p.pos[1] === piezaOrigenPos[1]);
				
				if (piezaReal && tablero.mover(piezaReal, mov[1]) > 0) {
					tablero.actualizarEstadoJuego();
				} else {
					console.error("La IA eligió un movimiento ilegal o no se encontró la pieza:", mov);
				}
			}
		}
		document.getElementById("factor").value = tablero.readFEN();
	}
}



function mouseWheel(event) {
  //print(event.delta);
  //move the square according to the vertical scroll amount
  //pos += event.delta;
  //uncomment to block page scrolling
  //return false;
  
}


function mueveRandom()
{
  if(tablero.turno!=-1) return; //solo negras
  if(tablero.nroMedioMovPeon>49) tablero.tablas=1; //
  
  if(tablero.jaqueMate+tablero.tablas==0)
  	sleep(500).then(function() {
  	tablero.moverRandom();
  	tablero.actualizarEstadoJuego();
  
      console.log("Tarea: No espera " + Date())
      mueveRandom();
    })/*
  await sleep(500)
  tablero.moverRandom();
  console.log("Await: Espera respuesta " + Date())
  mueveRandom();
  */

}

function moveAuto()
{
	sleep(50).then(async function() { // Make the callback async
		if(logErrores.length > 0){
			return ; // Si ya hay errores, no continuar
		}

		// --- Lógica de Fin de Partida y Reinicio ---
		if (tablero.jaqueMate + tablero.tablas > 0) {
			// Actualiza el marcador
			if (tablero.jaqueMate > 0) {
				if (tablero.turno > 0) { victoriasNegras++; } else { victoriasBlancas++; }
			} else {
				partidasTablas++;
			}

			contadorPartidas++;
			estadoTest = `Partida ${contadorPartidas} finalizada. Jugando partida ${contadorPartidas + 1} de ${NUM_PARTIDAS_TEST}...`;
			
			if (contadorPartidas >= NUM_PARTIDAS_TEST) {
				estadoTest = `¡ÉXITO! ${NUM_PARTIDAS_TEST} partidas completadas sin errores.`;
				console.log(estadoTest);
				noLoop();
				return;
			}

			// Reinicia el tablero para la siguiente partida
			tablero = new Juego([
				[-4,-2,-3,-5,-6,-3,-2,-4], [-1,-1,-1,-1,-1,-1,-1,-1], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0],
				[0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [1,1,1,1,1,1,1,1], [4,2,3,5,6,3,2,4]
			]);
			// Re-asigna las funciones de evaluación al nuevo objeto de juego para la prueba A/B
			tablero.fdeNegras = BIBLIOTECA_EVALUACION.con_estado_buggy;
			tablero.fdeBlancas = BIBLIOTECA_EVALUACION.mejorada_con_centro;
            // Re-asigna las funciones de pensamiento al nuevo objeto de juego
            tablero.fPensamientoNegras = pensamientoMoverConMinimax; // Default thinking for black
            tablero.fPensamientoBlancas = pensamientoMoverMejorValor; // Default thinking for white

			tablero.cargaPiezas(img);
			moveAuto(); // Inicia la siguiente partida
			return; 
		}

		// --- Lógica de Selección de Movimiento (Aleatorio vs. IA) ---
		let moveResult = 0;
		let mov = null;

		// Para las primeras 2 jugadas de cada bando (total 4), usa movimientos aleatorios para dar variedad.
		if (tablero.movimientos.length < 4) { 
			moveResult = pensamientoMoverRandom(tablero); // Call the thinking function
			if (moveResult > 0) {
				tablero.actualizarEstadoJuego();
			}
		} else { // Después, usa la IA inteligente asignada
            const startTime = performance.now();
            if (tablero.turno > 0) { // Turno de las blancas
                // Await even for non-async functions for consistency, it won't break.
                mov = await tablero.fPensamientoBlancas(tablero); 
            } else { // Turno de las negras
                mov = await tablero.fPensamientoNegras(tablero, 2); 
            }
            const endTime = performance.now();
            lastMinimaxTime = (endTime - startTime).toFixed(2);

            if (mov && mov[0]) { // Si la función de pensamiento devolvió un movimiento
                const piezaOrigenPos = mov[0].pos;
                const piezaReal = tablero.piezas.find(p => p.pos[0] === piezaOrigenPos[0] && p.pos[1] === piezaOrigenPos[1]);
                
                if (piezaReal) {
                    moveResult = tablero.mover(piezaReal, mov[1]);
                    if (moveResult > 0) {
                        tablero.actualizarEstadoJuego();
                    }
                } else {
                    moveResult = -1; // No se encontró la pieza real
                }
            } else {
                // Si la función de pensamiento no devolvió un movimiento, es jaque mate/tablas.
                // La función de pensamiento ya actualiza el estado del juego (jaqueMate/tablas).
                if (tablero.jaqueMate > 0 || tablero.tablas > 0) {
                    moveResult = 1; // Considera esto un "éxito" para que no se marque como error.
                } else {
                    // Esto sería un error inesperado si la IA no devuelve movimiento y el juego no ha terminado.
                    moveResult = -1; 
                }
            }
		}

		// --- Manejo de Errores de Movimiento ---
		if (moveResult < 0) {
			const errorInfo = {
				mensaje: "La IA no pudo realizar un movimiento legal.",
				fuente: "moveAuto()",
				linea: "N/A",
				partidaNro: contadorPartidas + 1,
				movimientoNro: tablero.movimientos.length,
				turno: tablero.turno
			};
			logErrores.push(errorInfo);
			estadoTest = "¡ERROR DETECTADO! La IA no pudo mover.";
			console.error("ERROR DETECTADO:", errorInfo);
			return; 
		}

		// Llamada recursiva para el siguiente turno de la partida actual
		moveAuto();
	});
}
/*
		tablero.moverRandom();
		tablero.cargaPiezas(img);
		*/
		


function keyTyped() {
	
}

function sleep(millisecondsDuration)
{
  return new Promise((resolve) => {
    setTimeout(resolve, millisecondsDuration);
  })
}

// --- Exponer funciones a p5.js en el ámbito global ---
// Al usar módulos, p5.js en modo global no puede ver las funciones,
// así que las asignamos explícitamente al objeto window.
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



