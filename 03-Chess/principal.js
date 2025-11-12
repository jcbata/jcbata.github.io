let width = screen.width, height = screen.height;
let tablero, img;

// --- Variables para el Test Runner Automático ---
const MODO_TEST = true; // Poner en true para activar las pruebas automáticas
const NUM_PARTIDAS_TEST = 100; // Número de partidas a simular
let contadorPartidas = 0;
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
    // Detenemos el bucle de dibujado para inspeccionar el estado.
    noLoop(); 
    estadoTest = "¡ERROR DETECTADO! Revisar consola y log de errores.";
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
	tablero.fdeNegras = valorPiezaConObj;
	tablero.fdeBlancas = valorPiezaConObj;
	//tablero.fdeBlancas = valorPiezaConObjRey;
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

	tablero.dibujaBarraValor(tablero);
	tablero.dibujaMensaje(tablero);

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

function touchEnded() {
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
			tablero.moverRandom();
			tablero.actualizarEstadoJuego();
		} else {
			// Usa el método clonar para que la IA piense en un estado limpio.
			let juegoTmp = tablero.clonar();
			let mov = juegoTmp.moverMejorValor(juegoTmp);
			tablero.tablas = juegoTmp.tablas;
			tablero.jaqueMate = juegoTmp.jaqueMate;

			// Traduce la pieza de la simulación a la pieza real del tablero principal.
			if (mov[0]) {
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
	// --- Lógica del Test Runner ---
	// Condición de fin de partida (jaque mate, tablas, o más de 200 movimientos para evitar bucles infinitos)
	if (tablero.jaqueMate + tablero.tablas > 0 || tablero.movimientos.length > 200) {
		contadorPartidas++;
		estadoTest = `Partida ${contadorPartidas} finalizada. Jugando partida ${contadorPartidas + 1} de ${NUM_PARTIDAS_TEST}...`;
		
		if (contadorPartidas >= NUM_PARTIDAS_TEST) {
			estadoTest = `¡ÉXITO! ${NUM_PARTIDAS_TEST} partidas completadas sin errores.`;
			console.log(estadoTest);
			noLoop(); // Detiene el juego
			return;
		}

		// Reinicia el tablero para la siguiente partida
		tablero = new Juego([
			[-4,-2,-3,-5,-6,-3,-2,-4], [-1,-1,-1,-1,-1,-1,-1,-1], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [1,1,1,1,1,1,1,1], [4,2,3,5,6,3,2,4]
		]);
		tablero.cargaPiezas(img);
	}

	// --- Lógica de Juego de la IA (el código que ya teníamos) ---
	sleep(50).then(function() { // Reducido el delay para acelerar las pruebas
		let juegoTmp = tablero.clonar();
		let mov = juegoTmp.moverMejorValor(juegoTmp);
		tablero.tablas = juegoTmp.tablas;
		tablero.jaqueMate = juegoTmp.jaqueMate;

		if (mov[0]) {
			const piezaOrigenPos = mov[0].pos;
			const piezaReal = tablero.piezas.find(p => p.pos[0] === piezaOrigenPos[0] && p.pos[1] === piezaOrigenPos[1]);
			
			if (piezaReal && tablero.mover(piezaReal, mov[1]) > 0) {
				tablero.actualizarEstadoJuego();
			} else {
				// Si hay un error, el manejador global window.onerror lo capturará.
				// Forzamos un error para asegurarnos de que se capture.
				throw new Error(`La IA eligió un movimiento ilegal o no se encontró la pieza: ${mov}`);
			}
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

function valorPiezaConObj(_pieza){
	//En esta función de evaluación evita triple repetición

	let _reyEnemigo=0;
	let _amenazaA = 0;
	for(let i=0;i<_pieza.amenazasA.length;i++){
		if(_pieza.amenazasA[i].tipo==6){
			_amenazaA += _pieza.amenazasA[i].tipo;
			_reyEnemigo=(10-_pieza.amenazasA[i].movPosibles.length);
		}else{
			_amenazaA += _pieza.amenazasA[i].tipo;
		}

	} 

	if(_pieza.amenazasA.length>0)
	_amenazaA = _amenazaA/_pieza.amenazasA.length; // promedio ponderado de amenazas A

	let _tipoDe = 0;
	for(let i=0;i<_pieza.amenazasDe.length;i++) _tipoDe += _pieza.amenazasDe[i].tipo;

	_tipoDe = _tipoDe/_pieza.amenazasDe.length;
	
	//if(_pieza.amenazasDe.length>0)
	let _amenazaDe =_pieza.amenazasDe.length; // probabilidad que lo pierda
	// cantidad de amenazas recibidas entre el valor de mi pieza
	//_amenazaDe =0;

	let _defendidoPor = 0;
	
	_defendidoPor =_pieza.defendidoPor.length; // promedio ponderado de amenazas De

	// se aplica la probabilidad de ser comido si no es mi turno
	let _probComido = 0;
	if(_tipoDe>0 && _pieza.bando!=this.turno) 
	_probComido=_amenazaDe/(_amenazaDe+_defendidoPor)*(_pieza.tipo/_tipoDe);

	_pieza.valor=(_pieza.valor*.8+_pieza.movPosibles.length*.05+_amenazaA*.1)*(1-_probComido);

	if(_pieza.tipo==1){
		let _avance = _pieza.pos[0];
		if(_pieza.bando>0) _avance = 7-_pieza.pos[0];
		_avance=Math.pow(_avance*0.05,2);
		_pieza.valor=(_pieza.tipo*0.9+_pieza.movPosibles.length*0+_avance+_amenazaA*.1)*(1-_probComido);
	}
	
	if(_pieza.tipo==6)
		_pieza.valor=(_pieza.valor*(1+_pieza.movPosibles.length*0))*(1-_probComido);

	
}

function valorPiezaConObjRey(_pieza){

	let _reyEnemigo=0;
	let _amenazaA = 0;
	for(let i=0;i<_pieza.amenazasA.length;i++){
		if(_pieza.amenazasA[i].tipo==6){
			_amenazaA += _pieza.amenazasA[i].tipo;
			_reyEnemigo=(10-_pieza.amenazasA[i].movPosibles.length);
		}else{
			_amenazaA += _pieza.amenazasA[i].tipo;
		}

	} 

	if(_pieza.amenazasA.length>0)
	_amenazaA = _amenazaA/_pieza.amenazasA.length; // promedio ponderado de amenazas A

	let _tipoDe = 0;
	for(let i=0;i<_pieza.amenazasDe.length;i++) _tipoDe += _pieza.amenazasDe[i].tipo;

	_tipoDe = _tipoDe/_pieza.amenazasDe.length;
	
	//if(_pieza.amenazasDe.length>0)
	let _amenazaDe =_pieza.amenazasDe.length; // probabilidad que lo pierda
	// cantidad de amenazas recibidas entre el valor de mi pieza
	//_amenazaDe =0;

	let _defendidoPor = 0;
	
	_defendidoPor =_pieza.defendidoPor.length; // promedio ponderado de amenazas De

	// se aplica la probabilidad de ser comido si no es mi turno
	let _probComido = 0;
	if(_tipoDe>0 && _pieza.bando!=this.turno) 
	_probComido=_amenazaDe/(_amenazaDe+_defendidoPor)*(_pieza.tipo/_tipoDe);

	_pieza.valor=(_pieza.valor*.8+_pieza.movPosibles.length*.1+_amenazaA*.2)*(1-_probComido)*(1+_reyEnemigo);

	if(_pieza.tipo==1){
		let _avance = _pieza.pos[0];
		if(_pieza.bando>0) _avance = 7-_pieza.pos[0];
		_pieza.valor=(_pieza.tipo*.8+_pieza.movPosibles.length*0+_avance*.2+_amenazaA*.2)*(1-_probComido)*(1+_reyEnemigo);
	}
	
	if(_pieza.tipo==6)
		_pieza.valor=(_pieza.valor*(1+_pieza.movPosibles.length*.2))*(1-_probComido);

	
}
