import { Pieza } from './pieza.js';
import { EstadoJuego } from './estado.js';

// La función `valorPieza` ha sido movida a `evaluacion.js`

export class Juego {
	
	constructor(tabl=[]) {
		this.tablero=tabl; // The initial board matrix
		this.piezas = []; // The array of p5-drawable Pieza objects
		this.estado = null; // This will hold the an instance of EstadoJuego
		
		// --- Game State Properties (needed for EstadoJuego constructor) ---
		this.turno = 1;
		this.fenEnrroque="KQkq";
		this.fenPeonPaso="-";
		this.jaque = {jaqueKn:0,jaqueKb:0};
		this.jaqueMate =0;
		this.tablas = 0;
		this.movimientos = []; // Move history for UI reporting
		this.movimientos.push(this.getTableroJson());
		this.halfmoveClock = 0;
		this.history = [];


		// --- UI/Interaction Properties ---
		this.tam = 60;
		this.margen=2;
		this.posSel=[-1,-1];
		this.piezaSel=[-1,-1];
		this.mensaje="Inicio";

		// --- AI-related properties that are configured from principal.js ---
        this.fPensamientoBlancas = null;
        this.fPensamientoNegras = null;
        this.fdeBlancas = null;
        this.fdeNegras = null;
	}
	getTableroJson(){
		return JSON.parse(JSON.stringify(this.tablero));
	}

	clonar() {
		// Crea un nuevo objeto Juego para el clon.
		const clon = new Juego();

		// Copia profunda de la matriz del tablero.
		clon.tablero = this.getTableroJson();

		// Copia directa de todas las propiedades críticas del estado.
		clon.turno = this.turno;
		clon.fenEnrroque = this.fenEnrroque;
		clon.fenPeonPaso = this.fenPeonPaso;
		clon.nroMedioMovPeon = this.nroMedioMovPeon;
		clon.nroMovi_n = this.nroMovi_n;
		clon.tripleRep = this.tripleRep;

		// Copia el estado de jaque actual.
		clon.jaque = JSON.parse(JSON.stringify(this.jaque));

		// Copia las funciones de evaluación.
		clon.fdeBlancas = this.fdeBlancas;
		clon.fdeNegras = this.fdeNegras;

        // Copia las funciones de pensamiento.
        clon.fPensamientoBlancas = this.fPensamientoBlancas;
        clon.fPensamientoNegras = this.fPensamientoNegras;
		
		// Inicializa el clon con sus piezas y movimientos calculados.
		clon.tam = this.tam; // El tamaño del tablero es necesario para la creación de piezas.
		clon.cargaPiezas(this.img); // `img` es una variable global, lo cual funciona por ahora.

		return clon;
	}

	updateFEN(fen){
		//nomenglatura FEN para iniciar posiciones
		let a={'p':-1,'n':-2,'b':-3,'r':-4,'q':-5,'k':-6,'P':1,'N':2,'B':3,'R':4,'Q':5,'K':6}
		let posx=0;
		let posy=0;
		let posf=0;
		
		let subFen = fen.split(" ");
		// limpia el tablero
		if(this.tablero.length==0)
		{
			//this.tablero=Array(8).fill(Array(8).fill(0));
			this.tablero = Array.from({length:8}, () => Array(8).fill(0));
		}else{
			for(var i=0; i<this.tablero.length;i++){
				for(var j=0;j<this.tablero[i].length;j++){
					this.tablero[i][j]=0;
				}
			}
		}

		for(var f=0;f<subFen[0].length;f++){
			let dato = subFen[0].substring(f,f+1)
			if(dato=="/") { // es un salto de linea
				posx++;
				posy=0;
			}else if(!isNaN(dato)){ // son casilleros sin pieza
				posy=posy+parseInt(dato);
			}else{ 
				this.tablero[posx][posy]=a[dato];
				posy++;
			}
			if(posx>this.tablero.length-1 && posy>this.tablero[0].length-1){
				break;
			}
			posf = f;
		}
		
		if(subFen[1]=="w"){
			this.turno=1
		}else{
			this.turno=-1
		}

		this.fenEnrroque = subFen[2];
		this.fenPeonPaso = subFen[3];
		this.nroMedioMovPeon = subFen[4];
		this.nroMovi_n= parseInt(subFen[5],10);

	}
	readFEN() {
		// Generates a FEN string from the current game state.
		const a = { '-1': 'p', '-2': 'n', '-3': 'b', '-4': 'r', '-5': 'q', '-6': 'k', '1': 'P', '2': 'N', '3': 'B', '4': 'R', '5': 'Q', '6': 'K' };
		let subFen = "";
		
		for (let i = 0; i < this.estado.tablero.length; i++) {
			let emptySquares = 0;
			for (let j = 0; j < this.estado.tablero[i].length; j++) {
				const piece = this.estado.tablero[i][j];
				if (piece === 0) {
					emptySquares++;
				} else {
					if (emptySquares > 0) {
						subFen += emptySquares;
						emptySquares = 0;
					}
					subFen += a[piece.toString()];
				}
			}
			if (emptySquares > 0) {
				subFen += emptySquares;
			}
			if (i < this.estado.tablero.length - 1) {
				subFen += "/";
			}
		}

		subFen += " ";
		subFen += this.estado.turno > 0 ? "w" : "b";
		subFen += " ";
		subFen += (this.estado.fenEnrroque && this.estado.fenEnrroque.length > 0) ? this.estado.fenEnrroque : "-";
		subFen += " ";
		subFen += this.estado.fenPeonPaso || "-";
		
		// Add placeholders for half-move clock and full-move number
		subFen += " 0 1";

		return subFen;
	}

	setFEN(fen){
		this.fen = fen;
	}
	getFEN(){
		return this.fen;
	}

	crearObjetosPieza(img) {
		let i, j;
		this.piezas = [];
		// carga todas las piezas
		for (i = 0; i < this.tablero.length; i++) {
			for (j = 0; j < this.tablero[i].length; j++) {
				let bando = 0
				if (this.tablero[i][j] != 0) bando = Math.abs(this.tablero[i][j]) / this.tablero[i][j];

				if (this.tablero[i][j] != 0) {
					this.piezas.push(new Pieza(Math.abs(this.tablero[i][j]), [i, j], this.tam, bando, 1, img, { '1': 10, '2': 10, '3': 10, '4': 10, '5': 10, '6': 10 }));
				}

				if (this.tablero[i][j] == -6) this.posK_n = [i, j];
				if (this.tablero[i][j] == 6) this.posK_b = [i, j];
			}
		}
	}

	actualizarEstadoJuego() {
		// Reset UI-specific properties on the drawable pieces
		for (let k = 0; k < this.piezas.length; k++) {
			this.piezas[k].movPosibles = [];
		}

		// Delegate move generation to the state object
		const movimientosLegales = this.estado.generarMovimientos();

		// Populate the UI pieces with their possible moves for drawing
		for(const mov of movimientosLegales) {
			// Find the corresponding p5 piece object to update its UI properties
			const piezaOriginal = this.piezas.find(p => p.pos[0] === mov.pieza.pos[0] && p.pos[1] === mov.pieza.pos[1]);
			if(piezaOriginal) {
				piezaOriginal.movPosibles.push(mov.destino);
			}
		}
        
        // Update the game's check status from the state object
        this.jaque = this.estado.validaJaque();

		// Check for mate/stalemate
		if (movimientosLegales.length === 0) {
			if (this.jaque.jaqueKb !== 0 || this.jaque.jaqueKn !== 0) {
				this.jaqueMate = 1;
				this.mensaje = "Jaque Mate!";
			} else {
				this.tablas = 1;
				this.mensaje = "Tablas!";
			}
		}
	}

	cargaPiezas(img) {
		this.crearObjetosPieza(img);
        // After creating the UI pieces, create the logical game state from them.
		this.estado = new EstadoJuego(this);
		this.actualizarEstadoJuego();
	}

	fCoordMouse(x, y) {
		let pos = [(y / this.tam | 0), (x / this.tam | 0)];
		if (x > 8 * this.tam || x < 0 || y > 8 * this.tam || y < 0) {
			return [-1, -1];
		}
		return pos;
	}

	mover(pieza, posDestino = []) {
		// Basic checks: game not over, piece exists, and it's the correct player's turn.
		// Note: this.estado.turno is the source of truth for the current turn.
		if (this.jaqueMate > 0 || this.tablas > 0 || !pieza || pieza.bando !== this.estado.turno) {
			return 0;
		}

		// Validate if the move is in the list of pre-calculated legal moves
		const esLegal = pieza.movPosibles.some(mov =>
			mov[0] === posDestino[0] && mov[1] === posDestino[1]
		);

		if (!esLegal) {
			this.mensaje = "Movimiento ilegal!";
			console.log("Intento de movimiento ilegal:", pieza.pos, "->", posDestino);
			return -1;
		}

		// --- If legal, apply the move ---

		// Handle capture by removing the UI piece
		if (this.estado.tablero[posDestino[0]][posDestino[1]] !== 0) {
			const capturedPieceIndex = this.piezas.findIndex(p => p.pos[0] === posDestino[0] && p.pos[1] === posDestino[1]);
			if (capturedPieceIndex > -1) {
				this.piezas.splice(capturedPieceIndex, 1);
			}
		}

		// Find the corresponding piece in the logical state
		const piezaEnEstado = this.estado.piezas.find(p => p.pos[0] === pieza.pos[0] && p.pos[1] === pieza.pos[1]);

		if (!piezaEnEstado) {
			console.error("Desync: No se encontró la pieza lógica para mover.");
			return -1;
		}

		// Move the piece in the logical state (this also updates the turn)
		this.estado._mover(piezaEnEstado, posDestino);

		// Sync the Juego's board and the UI piece's position from the updated state
		this.tablero = this.estado.tablero;
		pieza.pos = [...posDestino]; // Update the UI piece's position
		pieza.coord = [pieza.pos[0] * this.tam, pieza.pos[1] * this.tam]; // Update drawing coordinates

		this.movimientos.push(this.getTableroJson());

		// Handle pawn promotion for the UI piece
		if (pieza.tipo === 1 && (posDestino[0] === 0 || posDestino[0] === 7)) {
			pieza.tipo = 5; // Promote to Queen
			pieza.nombre = pieza.bando > 0 ? 'Q' : 'q';
		}
		
		// TODO: Handle en passant and castling visuals from state changes.

		// Recalculate possible moves and check status for the next player
		this.actualizarEstadoJuego();

		// --- Check for draws after the move ---
		if (this.estado.halfmoveClock >= 100) { // 50 full moves
			this.tablas = 1;
			this.mensaje = "Tablas (Regla de 50 mov.)";
		}
		const currentFenPos = this.estado.getFenPosition();
		const repetitions = this.estado.history.filter(h => h === currentFenPos).length;
		if (repetitions >= 3) {
			this.tablas = 1;
			this.mensaje = "Tablas (Triple Repetición)";
		}

		return 1;
	}

	dibujar() {
		const lightColor = [240, 217, 181]; // Light wood color
		const darkColor = [181, 136, 99];   // Dark wood color
		const borderColor = [140, 100, 70];   // A darker border for the board
		const moveHighlightColor = [100, 180, 255, 150]; // A light, translucent blue

		let _tam = this.tam;
		let _margen = this.margen;

		// Draw border
		strokeWeight(_margen);
		stroke(borderColor);
		noFill();
		rect(0, 0, this.tablero[0].length * _tam + _margen / 2, this.tablero.length * _tam + _margen / 2);
		noStroke();

		// Draw squares
		for (let i = 0; i < this.tablero.length; i++) {
			for (let j = 0; j < this.tablero[i].length; j++) {
				if ((i + j) % 2 === 0) {
					fill(lightColor);
				} else {
					fill(darkColor);
				}
				square(j * _tam + _margen / 2, i * _tam + _margen / 2, _tam);
			}
		}

		// Draw possible move highlights
		if (this.piezaSel[0] !== -1) {
			const piezaSeleccionada = this.piezas.find(p => p.pos[0] === this.piezaSel[0] && p.pos[1] === this.piezaSel[1]);
			if (piezaSeleccionada) {
				fill(moveHighlightColor);
				noStroke();
				for (const mov of piezaSeleccionada.movPosibles) {
					circle(mov[1] * _tam + _tam / 2, mov[0] * _tam + _tam / 2 + _margen / 2, _tam / 2);
				}
			}
		}
	}

	dibujaBarrasDeValor(_juego){
        // This function needs to be refactored to not depend on evaluation properties
        // that were removed from the main Juego object. For now, it will do nothing.
	}

	dibujaMensaje(_juego){
		let _tam = this.tam;
		let _margen = this.margen;
		let _altoTotal = this.tablero[0].length*_tam+_margen/2;

		stroke(0);
		fill(255);
		text(this.mensaje, _margen, _altoTotal + _margen + 10);
	}

	randomInteger(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	
} // End of Juego class

// Nueva función de pensamiento: Mover el mejor valor (equivalente al antiguo moverMejorValor)
export function pensamientoMoverMejorValor(_estado, fEval) {
    const movimientos = _estado.generarMovimientos();
    if (movimientos.length === 0) return null;

    let mejorMovimiento = null;
    let mejorValor = -Infinity;

    for (const mov of movimientos) {
        const nuevoEstado = _estado.clonar();
        // The piece object in 'mov' belongs to the original state, so find the equivalent in the new state
        const piezaEnNuevoEstado = nuevoEstado.piezas.find(p => p.pos[0] === mov.pieza.pos[0] && p.pos[1] === mov.pieza.pos[1]);
        
        if (piezaEnNuevoEstado) {
            nuevoEstado._mover(piezaEnNuevoEstado, mov.destino);
            const valor = fEval(nuevoEstado); // Use the provided evaluation function

            if (valor > mejorValor) {
                mejorValor = valor;
                mejorMovimiento = mov;
            }
        }
    }

    if (mejorMovimiento) {
        // Return the logical piece from the original state and the destination
        return [mejorMovimiento.pieza, mejorMovimiento.destino];
    }
    return null;
} // End of pensamientoMoverMejorValor function

// Nueva función de pensamiento: Mover aleatoriamente
export function pensamientoMoverRandom(_estado){
    const movimientos = _estado.generarMovimientos();
    if(movimientos.length === 0) return null;
    
    const movAleatorio = movimientos[Math.floor(Math.random() * movimientos.length)];
    
    // Return the logical piece and the destination
    return [movAleatorio.pieza, movAleatorio.destino];
}

// Nueva función de pensamiento: Implementación de Minimax (Placeholder)
// Nueva función de pensamiento: Implementación de Minimax con Web Workers
export function pensamientoMoverConMinimax(_estado, profundidad = 3, evalFunctionName) {
    console.log(`Iniciando búsqueda Minimax paralela con prof ${profundidad} y eval ${evalFunctionName}`);

    return new Promise((resolve, reject) => {
        const movimientos = _estado.generarMovimientos();

        if (movimientos.length === 0) {
            resolve(null); // No moves available
            return;
        }

        const workerPromises = movimientos.map(move => {
            return new Promise((resolveWorker) => {
                const worker = new Worker('./minimax_worker.js', { type: 'module' });
                
                worker.onmessage = (e) => {
                    resolveWorker({ move: move, score: e.data.score });
                    worker.terminate();
                };
                worker.onerror = (err) => {
                    console.error("Error en Web Worker:", err.message);
                    resolveWorker({ move: move, score: -Infinity }); // Return a bad score on error
                    worker.terminate();
                };
                
                // Create the next state by applying the move
                const nuevoEstado = _estado.clonar();
                const piezaEnNuevoEstado = nuevoEstado.piezas.find(p => p.pos[0] === move.pieza.pos[0] && p.pos[1] === move.pieza.pos[1]);
                nuevoEstado._mover(piezaEnNuevoEstado, move.destino);

                worker.postMessage({
                    estadoData: nuevoEstado, // Pass the new state object
                    profundidad: profundidad - 1,
                    evalFunctionName: evalFunctionName,
                });
            });
        });

        Promise.all(workerPromises)
            .then(resultados => {
                let mejorResultado = { score: -Infinity };
                
                for (const res of resultados) {
                    // The worker returns the score from the opponent's perspective. We need to negate it.
                    const score = -res.score;
                    if (score > mejorResultado.score) {
                        mejorResultado = { score: score, move: res.move };
                    }
                }
                
                if (mejorResultado.move) {
                    resolve([mejorResultado.move.pieza, mejorResultado.move.destino]);
                } else {
                    // This can happen if all moves lead to an error or illegal state
                    console.log("No se encontró un mejor movimiento válido.");
                    resolve(null);
                }
            })
            .catch(err => reject(err));
    });
}




	

