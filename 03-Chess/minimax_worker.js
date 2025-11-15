/**
 * @file minimax_worker.js
 * @description Web Worker para calcular el mejor movimiento de ajedrez usando Minimax en un hilo separado.
 * Este archivo es autocontenido y no depende de p5.js ni del DOM.
 */

// --- PASO 1: Copia de la clase Pieza (de pieza.js) ---
// Se elimina el método dibujar() y las propiedades relacionadas con la imagen.
class Pieza {
	constructor(
		tipo = 0,
		pos = [0,0],
		piezaSize = 60,
		bando = 0,
		vivo = false,
		_valores = {'1':1,'2':2,'3':3,'4':4,'5':5,'6':6}
	) {
		let a={'-1':'p','-2':'n','-3':'b','-4':'r','-5':'q','-6':'k'
		,'1':'P','2':'N','3':'B','4':'R','5':'Q','6':'K'};
		this.nombre=a[(tipo*bando).toString()];
		this.tipo =tipo;
		this.pos = pos;
		this.posAnt = pos;
		this.coord = [this.pos[0]*piezaSize,this.pos[1]*piezaSize];
		this.bando = bando;
		this.valores=_valores;
		this.valor=this.valores[tipo.toString()];
		this.vivo = vivo;
		this.posSel = [-1,-1];
		this.movPosibles=[];
		this.amenazasA=[];
		this.amenazasDe=[];
		this.defendidoPor= [];
		this.piezaSize=piezaSize;
	}
}

// --- PASO 2: Copia de la Biblioteca de Evaluación (de evaluacion.js) ---
const BIBLIOTECA_EVALUACION = {
    'con_estado_buggy': function(_pieza, turnoActual){
        let _amenazaA = 0;
        for(let i=0;i<_pieza.amenazasA.length;i++) _amenazaA += _pieza.amenazasA[i].tipo;
        if(_pieza.amenazasA.length>0) _amenazaA = _amenazaA/_pieza.amenazasA.length;

        let _tipoDe = 0;
        for(let i=0;i<_pieza.amenazasDe.length;i++) _tipoDe += _pieza.amenazasDe[i].tipo;
        if (_pieza.amenazasDe.length > 0) _tipoDe = _tipoDe/_pieza.amenazasDe.length;
        
        let _amenazaDe =_pieza.amenazasDe.length;
        let _defendidoPor =_pieza.defendidoPor.length;

        let _probComido = 0;
        if(_tipoDe>0 && _pieza.bando != turnoActual) 
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
    },
    'mejorada_con_centro': function(_pieza, turnoActual) {
        let _amenazaA = 0;
        for(let i=0;i<_pieza.amenazasA.length;i++) _amenazaA += _pieza.amenazasA[i].tipo;
        if(_pieza.amenazasA.length>0) _amenazaA = _amenazaA/_pieza.amenazasA.length;

        let _tipoDe = 0;
        for(let i=0;i<_pieza.amenazasDe.length;i++) _tipoDe += _pieza.amenazasDe[i].tipo;
        if (_pieza.amenazasDe.length > 0) _tipoDe = _tipoDe/_pieza.amenazasDe.length;
        
        let _amenazaDe =_pieza.amenazasDe.length;
        let _defendidoPor =_pieza.defendidoPor.length;

        let _probComido = 0;
        if(_tipoDe>0 && _pieza.bando != turnoActual) 
            _probComido=_amenazaDe/(_amenazaDe+_defendidoPor)*(_pieza.tipo/_tipoDe);

        let bonusCentro = 0;
        const [fila, col] = _pieza.pos;
        if (fila >= 2 && fila <= 5 && col >= 2 && col <= 5) {
            if (_pieza.tipo <= 3) { bonusCentro = 0.2; } else { bonusCentro = 0.1; }
        }

        let valorCalculado = (_pieza.valor*.8 + _pieza.movPosibles.length*.05 + _amenazaA*.1 + bonusCentro) * (1-_probComido);

        if(_pieza.tipo==1){
            let _avance = _pieza.pos[0];
            if(_pieza.bando>0) _avance = 7-_pieza.pos[0];
            _avance=Math.pow(_avance*0.05,2);
            valorCalculado = (_pieza.tipo*0.9 + _pieza.movPosibles.length*0 + _avance + _amenazaA*.1 + bonusCentro) * (1-_probComido);
        }
        
        if(_pieza.tipo==6)
            valorCalculado = (_pieza.valor*(1+_pieza.movPosibles.length*0)) * (1-_probComido);

        _pieza.valor = valorCalculado;
    }
};

// --- PASO 3: Copia de la clase Juego (de tablero.js) ---
// Versión reducida solo con la lógica necesaria para la simulación.
class Juego {
	constructor(tabl=[]) {
		this.tablero=tabl;
		this.movimientos=[];
		this.piezas = [];
		this.histoFEN=[];
		this.tripleRep=0;
		this.tam = 60;
		this.turno = 1;
		this.jaque = {jaqueKn:0,jaqueKb:0};
		this.jaqueMate =0;
		this.tablas = 0;
		this.fenEnrroque="KQkq";
		this.nroMedioMovPeon=0;
		this.nroMovi_n=1;
		this.fenPeonPaso="-";
		this.valorb=0;
		this.valorn=0;
        this.fdeBlancas = null;
        this.fdeNegras = null;
		if (tabl.length > 0) {
			this.movimientos.push(this.getTableroJson());
		}
	}
	getTableroJson(){ return JSON.parse(JSON.stringify(this.tablero)); }
	clonar() {
		const clon = new Juego();
		clon.tablero = this.getTableroJson();
		clon.turno = this.turno;
		clon.fenEnrroque = this.fenEnrroque;
		clon.fenPeonPaso = this.fenPeonPaso;
		clon.nroMedioMovPeon = this.nroMedioMovPeon;
		clon.nroMovi_n = this.nroMovi_n;
		clon.tripleRep = this.tripleRep;
		clon.jaque = JSON.parse(JSON.stringify(this.jaque));
		clon.fdeBlancas = this.fdeBlancas;
		clon.fdeNegras = this.fdeNegras;
		clon.tam = this.tam;
		clon.cargaPiezas();
		return clon;
	}
	updateFEN(fen){
		let a={'p':-1,'n':-2,'b':-3,'r':-4,'q':-5,'k':-6,'P':1,'N':2,'B':3,'R':4,'Q':5,'K':6}
		let posx=0, posy=0;
		let subFen = fen.split(" ");
		this.tablero = Array.from({length:8}, () => Array(8).fill(0));
		for(var f=0;f<subFen[0].length;f++){
			let dato = subFen[0].substring(f,f+1)
			if(dato=="/") { posx++; posy=0; }
			else if(!isNaN(dato)){ posy=posy+parseInt(dato); }
			else{ this.tablero[posx][posy]=a[dato]; posy++; }
		}
		this.turno = (subFen[1]=="w") ? 1 : -1;
		this.fenEnrroque = subFen[2];
		this.fenPeonPaso = subFen[3];
		this.nroMedioMovPeon = parseInt(subFen[4], 10);
		this.nroMovi_n= parseInt(subFen[5],10);
	}
	crearObjetosPieza() {
		this.piezas = [];
		for (let i = 0; i < this.tablero.length; i++) {
			for (let j = 0; j < this.tablero[i].length; j++) {
				if (this.tablero[i][j] != 0) {
                    let bando = Math.abs(this.tablero[i][j]) / this.tablero[i][j];
					this.piezas.push(new Pieza(Math.abs(this.tablero[i][j]), [i, j], this.tam, bando));
				}
			}
		}
	}
	actualizarEstadoJuego() {
		this.valorb = 0; this.valorn = 0;
		for (let k = 0; k < this.piezas.length; k++) {
			this.piezas[k].movPosibles = []; this.piezas[k].amenazasA = [];
			this.piezas[k].amenazasDe = []; this.piezas[k].defendidoPor = [];
		}
		for (let k = 0; k < this.piezas.length; k++) {
			for (let i = 0; i < this.tablero.length; i++) {
				for (let j = 0; j < this.tablero[i].length; j++) {
					if (!(this.piezas[k].pos[0] == i && this.piezas[k].pos[1] == j))
						if (this.posicionEsLegal(this.tablero, this.piezas[k].pos, [i, j])) {
							if (this.tablero[i][j] != 0) {
								let piezaDest;
								for (let l = 0; l < this.piezas.length; l++) {
									if (this.piezas[l].pos[0] == i && this.piezas[l].pos[1] == j) {
										piezaDest = this.piezas[l]; break;
									}
								}
                                if (typeof piezaDest === 'undefined') { continue; }
								if (this.piezas[k].bando == piezaDest.bando) {
									piezaDest.defendidoPor.push(this.piezas[k].pos);
								} else {
									this.piezas[k].movPosibles.push([i, j]);
									this.piezas[k].amenazasA.push(piezaDest);
									piezaDest.amenazasDe.push(this.piezas[k]);
								}
							} else { this.piezas[k].movPosibles.push([i, j]); }
						}
				}
			}
		}
		for (let k = 0; k < this.piezas.length; k++) {
			if (this.piezas[k].bando > 0) {
				this.fdeBlancas(this.piezas[k], this.turno); this.valorb += this.piezas[k].valor;
			} else {
				this.fdeNegras(this.piezas[k], this.turno); this.valorn += this.piezas[k].valor;
			}
		}
		this.jaque = this.validaJaque(this.tablero);
	}
	cargaPiezas() { this.crearObjetosPieza(); this.actualizarEstadoJuego(); }
	mover(pieza,posDestino=[]) {
		if(this.jaqueMate+this.tablas>0 || posDestino.length==0 || !pieza || pieza.bando != this.turno) return 0;
		let _newTablero =this.getTableroJson();
		_newTablero[pieza.pos[0]][pieza.pos[1]] = 0;
		_newTablero[posDestino[0]][posDestino[1]] = pieza.tipo*pieza.bando;
		let _jaque = this.validaJaque(_newTablero);
		if(this.turno>0){ if(_jaque.jaqueKb!=0){ return -1; } }
        else{ if(_jaque.jaqueKn!=0){ return -1; } }
		if(!this.posicionEsValida(this.tablero, pieza.pos, posDestino)){ return -1; }
		if (this.tablero[posDestino[0]][posDestino[1]] != 0) {
			const capturedPieceIndex = this.piezas.findIndex(p => p.pos[0] === posDestino[0] && p.pos[1] === posDestino[1]);
			if (capturedPieceIndex > -1) { this.piezas.splice(capturedPieceIndex, 1); }
		}
		if(pieza.tipo==1 && this.fenPeonPaso!='-') {
			const enPassantRow = posDestino[0] + 1 * pieza.bando;
			const enPassantCol = posDestino[1];
            let posx = {'0':'a','1':'b','2':'c','3':'d','4':'e','5':'f','6':'g','7':'h'};
			if(this.fenPeonPaso.substring(0,1)==posx[enPassantCol.toString()] && this.fenPeonPaso.substring(1)==(8-posDestino[0]).toString()) {
				const capturedPieceIndex = this.piezas.findIndex(p => p.pos[0] === enPassantRow && p.pos[1] === enPassantCol);
				if (capturedPieceIndex > -1) { this.piezas.splice(capturedPieceIndex, 1); }
				this.tablero[enPassantRow][enPassantCol]=0;
			}
		}
		this.tablero[pieza.pos[0]][pieza.pos[1]] = 0;
		this.tablero[posDestino[0]][posDestino[1]] = pieza.tipo*pieza.bando;
		if(pieza.tipo ==1 && (posDestino[0]==0 || posDestino[0] == 7)) {
			this.tablero[posDestino[0]][posDestino[1]] = 5*pieza.bando;
			pieza.tipo = 5;
		}
		pieza.pos = posDestino;
		this.turno=this.turno*-1;
		return 1;
	}
	validaJaque(_matriz){
		let _jaque={jaqueKn:0,jaqueKb:0}; let _posKn, _posKb;
		for(let i=0;i<_matriz.length;i++) { for(let j=0;j<_matriz[i].length;j++) {
			if(_matriz[i][j]==6) _posKb=[i,j]; if(_matriz[i][j]==-6) _posKn=[i,j];
		} }
		for(let i=0;i<_matriz.length;i++) { for(let j=0;j<_matriz[i].length;j++) {
			if(_matriz[i][j]!=0) {
				if(Math.abs(_matriz[i][j])/_matriz[i][j] >0){
					if(this.posicionEsValida(_matriz, [i,j], _posKn)) _jaque.jaqueKn=1;
				} else {
					if(this.posicionEsValida(_matriz, [i,j], _posKb)) _jaque.jaqueKb=1;
				}
			}
		} }
		return _jaque;
	}
	validaObstaculo(_tablero,origen,destino){
		let valido = true;
		let diferenciaX = destino[0] -origen[0]; let diferenciaY = destino[1] - origen[1];
		let sentidoX = (diferenciaX != 0) ? diferenciaX/Math.abs(diferenciaX) : 0;
		let sentidoY = (diferenciaY != 0) ? diferenciaY/Math.abs(diferenciaY) : 0;
		let _x = origen[0] + sentidoX; let _y = origen[1] + sentidoY;
		while (destino[1] != _y || destino[0] != _x) {
			if(_x < 0 || _x > 7 || _y < 0 || _y > 7) break;
			if(_tablero[_x][_y] != 0) { valido = false; break; }
			_x += sentidoX; _y += sentidoY;
		}
		return valido;
	}
	posicionEsValida(_tablero, posOrigen, posDestino){
        if(!posDestino || posDestino[0] < 0 || posDestino[0] > 7 || posDestino[1] < 0 || posDestino[1] > 7) return false;
		let _pieza = Math.abs(_tablero[posOrigen[0]][posOrigen[1]]);
		if(_pieza==0) return false;
        let _bando = _tablero[posOrigen[0]][posOrigen[1]] / _pieza;
		if(_tablero[posDestino[0]][posDestino[1]] != 0 && (_tablero[posDestino[0]][posDestino[1]] / Math.abs(_tablero[posDestino[0]][posDestino[1]])) == _bando ){
			return false;
		}
		return this.posicionEsLegal(_tablero, posOrigen, posDestino);
	}
	posicionEsLegal(_tablero, posOrigen, posDestino){
		let valido = false;
		let _pieza = Math.abs(_tablero[posOrigen[0]][posOrigen[1]]);
		if(_pieza==0) return false;
        let _bando = _tablero[posOrigen[0]][posOrigen[1]]/_pieza;
		switch(_pieza){
			case 1: // Peon
				if(posDestino[0]==posOrigen[0]-1*_bando && posDestino[1]==posOrigen[1] && _tablero[posDestino[0]][posDestino[1]] == 0 ) valido = true; 
				if(posDestino[0]==posOrigen[0]-2*_bando && posDestino[1]==posOrigen[1] && _tablero[posDestino[0]][posDestino[1]] == 0 && _tablero[posDestino[0]+1*_bando][posDestino[1]] == 0 && (posOrigen[0] == 1 || posOrigen[0] == 6)) valido = true;
				if(posDestino[0]==posOrigen[0]-1*_bando && _tablero[posDestino[0]][posDestino[1]] != 0 && Math.abs(posDestino[1]-posOrigen[1])==1) valido = true; 
                let posx = {'0':'a','1':'b','2':'c','3':'d','4':'e','5':'f','6':'g','7':'h'};
				if(this.fenPeonPaso != '-' && this.fenPeonPaso.substring(0,1)==posx[posDestino[1].toString()] && this.fenPeonPaso.substring(1)==(8-posDestino[0]).toString() && posDestino[0]==posOrigen[0]-1*_bando && _tablero[posDestino[0]][posDestino[1]] == 0 && Math.abs(posDestino[1]-posOrigen[1])==1) valido = true; 
				break;
			case 2: // Caballo
				if((Math.abs(posDestino[0]-posOrigen[0])==2 && Math.abs(posDestino[1]-posOrigen[1]) == 1) || (Math.abs(posDestino[0]-posOrigen[0])==1 && Math.abs(posDestino[1]-posOrigen[1]) == 2)) valido = true;
				break;
			case 3: // Alfil
				if(Math.abs(posDestino[0]-posOrigen[0])==Math.abs(posDestino[1]-posOrigen[1])) valido = this.validaObstaculo(_tablero,posOrigen,posDestino);
				break;
			case 4: // Torre
				if(posDestino[0]==posOrigen[0]||posDestino[1] ==posOrigen[1]) valido = this.validaObstaculo(_tablero,posOrigen,posDestino);
				break;
			case 5: // Dama
				if((Math.abs(posDestino[0]-posOrigen[0])==Math.abs(posDestino[1]-posOrigen[1])) || (posDestino[0]==posOrigen[0]||posDestino[1] ==posOrigen[1])) valido = this.validaObstaculo(_tablero,posOrigen,posDestino);
				break;
			case 6: // Rey
				if(Math.abs(posDestino[0]-posOrigen[0])<=1 && Math.abs(posDestino[1]-posOrigen[1])<=1 ) valido = true;
				break;
		}
		return valido;
	}
}

// --- PASO 4: Copia de la función Minimax (de tablero.js) ---
function minimax(_juego, profundidad, alpha, beta, isMaximizingPlayer, bandoOriginal) {
    if (profundidad === 0) {
        _juego.actualizarEstadoJuego();
        if (bandoOriginal > 0) { return _juego.valorb - _juego.valorn; } 
        else { return _juego.valorn - _juego.valorb; }
    }

    _juego.actualizarEstadoJuego(); // Make sure moves are generated for the current player
    const piezasTurno = _juego.piezas.filter(_pz => _pz.bando == _juego.turno && _pz.movPosibles.length > 0);

    if (piezasTurno.length === 0) { // Game is over
        if (_juego.jaque.jaqueKb > 0 || _juego.jaque.jaqueKn > 0) {
            // Checkmate. This is a terminal node.
            // If we are the maximizing player and there are no moves, it's a loss.
            // If we are the minimizing player and there are no moves, it's a win for the maximizer.
            return isMaximizingPlayer ? -Infinity : +Infinity;
        } else {
            // Stalemate
            return 0;
        }
    }

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const pieza of piezasTurno) { for (const destino of pieza.movPosibles) {
            let _juegoSimulado = _juego.clonar();
            const piezaEnSimulacion = _juegoSimulado.piezas.find(p => p.pos[0] === pieza.pos[0] && p.pos[1] === pieza.pos[1]);
            if (piezaEnSimulacion && _juegoSimulado.mover(piezaEnSimulacion, destino) > 0) {
                const evaluation = minimax(_juegoSimulado, profundidad - 1, alpha, beta, false, bandoOriginal);
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) { break; }
            }
        } if (beta <= alpha) { break; } }
        return maxEval;
    } else { // Minimizing Player
        let minEval = Infinity;
        for (const pieza of piezasTurno) { for (const destino of pieza.movPosibles) {
            let _juegoSimulado = _juego.clonar();
            const piezaEnSimulacion = _juegoSimulado.piezas.find(p => p.pos[0] === pieza.pos[0] && p.pos[1] === pieza.pos[1]);
            if (piezaEnSimulacion && _juegoSimulado.mover(piezaEnSimulacion, destino) > 0) {
                const evaluation = minimax(_juegoSimulado, profundidad - 1, alpha, beta, true, bandoOriginal);
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) { break; }
            }
        } if (beta <= alpha) { break; } }
        return minEval;
    }
}

// --- PASO 5: Lógica principal del Worker ---
self.onmessage = function(e) {
    const { fen, move, profundidad, bandoOriginal, piezaPos } = e.data;
    
    // 1. Recrear el estado del juego a partir del FEN.
    const _juego = new Juego();
    _juego.fdeNegras = BIBLIOTECA_EVALUACION.con_estado_buggy;
    _juego.fdeBlancas = BIBLIOTECA_EVALUACION.mejorada_con_centro;
    _juego.updateFEN(fen);
    _juego.cargaPiezas();

    // 2. Encontrar el objeto de la pieza para el movimiento que este worker debe evaluar.
    const piezaEnSimulacion = _juego.piezas.find(p => p.pos[0] === piezaPos[0] && p.pos[1] === piezaPos[1]);

    let score = -Infinity;

    // 3. Realizar el movimiento y comenzar la evaluación minimax.
    if (piezaEnSimulacion && _juego.mover(piezaEnSimulacion, move) > 0) {
        // La profundidad ya está reducida en 1 porque el primer movimiento lo hace el hilo principal.
        // El oponente es el jugador minimizador.
        score = minimax(_juego, profundidad - 1, -Infinity, Infinity, false, bandoOriginal);
    } else {
        // Si el movimiento es ilegal, mover() devuelve <= 0.
        // Devolvemos null para indicar que este movimiento debe ser descartado.
        score = null;
    }

    // 4. Devolver el resultado al hilo principal.
    self.postMessage({
        move: { piezaPos: piezaPos, destino: move },
        score: score
    });
};
