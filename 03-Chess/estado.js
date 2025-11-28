export class EstadoJuego {
    constructor(juego_o_estado) {
        if (!juego_o_estado) {
            throw new Error("EstadoJuego constructor called with undefined or null argument.");
        }

        if (juego_o_estado.constructor.name === 'Juego') {
            this.tablero = juego_o_estado.getTableroJson();
            this.piezas = juego_o_estado.piezas.map(p => ({ tipo: p.tipo, bando: p.bando, pos: [...p.pos] }));
            this.turno = juego_o_estado.turno;
            this.fenEnrroque = juego_o_estado.fenEnrroque;
            this.fenPeonPaso = juego_o_estado.fenPeonPaso;

            // --- Nuevas propiedades para reglas de fin de juego ---
            this.halfmoveClock = juego_o_estado.halfmoveClock || 0;
            this.history = juego_o_estado.history ? [...juego_o_estado.history] : [];
            if (this.history.length === 0) {
                this.history.push(this.getFenPosition());
            }

        } else { // Clonar desde otro EstadoJuego
            this.tablero = JSON.parse(JSON.stringify(juego_o_estado.tablero));
            this.piezas = JSON.parse(JSON.stringify(juego_o_estado.piezas));
            this.turno = juego_o_estado.turno;
            this.fenEnrroque = juego_o_estado.fenEnrroque;
            this.fenPeonPaso = juego_o_estado.fenPeonPaso;

            // --- Nuevas propiedades para reglas de fin de juego ---
            this.halfmoveClock = juego_o_estado.halfmoveClock;
            this.history = [...juego_o_estado.history];
        }
    }

    clonar() {
        return new EstadoJuego(this);
    }
    
    getFenPosition() {
        // Generates a FEN-like string representing only the position, for history tracking.
        // It excludes move counters, as they don't define a repetition.
        const a = { '-1':'p','-2':'n','-3':'b','-4':'r','-5':'q','-6':'k','1':'P','2':'N','3':'B','4':'R','5':'Q','6':'K' };
        let subFen = "";
        for (let i = 0; i < this.tablero.length; i++) {
			let emptySquares = 0;
			for (let j = 0; j < this.tablero[i].length; j++) {
				const piece = this.tablero[i][j];
				if (piece === 0) {
					emptySquares++;
				} else {
					if (emptySquares > 0) { subFen += emptySquares; emptySquares = 0; }
					subFen += a[piece.toString()];
				}
			}
			if (emptySquares > 0) subFen += emptySquares;
			if (i < this.tablero.length - 1) subFen += "/";
		}
        subFen += " " + (this.turno > 0 ? "w" : "b");
		subFen += " " + ((this.fenEnrroque && this.fenEnrroque.length > 0) ? this.fenEnrroque : "-");
		subFen += " " + (this.fenPeonPaso || "-");
        return subFen;
    }

    // Generates all legal moves for the current player
    generarMovimientos() {
        const movimientosLegales = [];
        const movimientosPseudoLegales = this._generarMovimientosPseudoLegales();

        for (const mov of movimientosPseudoLegales) {
            const nuevoEstado = this.clonar();
            const piezaEnNuevoEstado = nuevoEstado.piezas.find(p => p.pos[0] === mov.pieza.pos[0] && p.pos[1] === mov.pieza.pos[1]);
            
            if (piezaEnNuevoEstado) {
                nuevoEstado._mover(piezaEnNuevoEstado, mov.destino);
                
                const posRey = nuevoEstado.piezas.find(p => p.tipo === 6 && p.bando === this.turno)?.pos;
                if (posRey && !nuevoEstado._esCuadroAtacado(posRey, -this.turno)) {
                    movimientosLegales.push(mov);
                }
            }
        }
        return movimientosLegales;
    }

    _mover(pieza, posDestino) {
        const posOrigen = pieza.pos;
        const isPawnMove = pieza.tipo === 1;
        const isCapture = this.tablero[posDestino[0]][posDestino[1]] !== 0;

        // --- Actualizar Reloj de 50 Movimientos y Enroque ---
        if (isPawnMove || isCapture) {
            this.halfmoveClock = 0;
            // Captures can also affect castling rights if a rook is taken, but this is complex.
            // A simpler FEN-based update handles this more robustly.
        } else {
            this.halfmoveClock++;
        }

        if (pieza.tipo === 6) { // King move
            if(pieza.bando > 0) this.fenEnrroque = this.fenEnrroque.replace("K", "").replace("Q", "");
            else this.fenEnrroque = this.fenEnrroque.replace("k", "").replace("q", "");
        }
        if (pieza.tipo === 4) { // Rook move
            if (pieza.bando > 0) {
                if(posOrigen[0] === 7 && posOrigen[1] === 0) this.fenEnrroque = this.fenEnrroque.replace("Q", "");
                if(posOrigen[0] === 7 && posOrigen[1] === 7) this.fenEnrroque = this.fenEnrroque.replace("K", "");
            } else {
                if(posOrigen[0] === 0 && posOrigen[1] === 0) this.fenEnrroque = this.fenEnrroque.replace("q", "");
                if(posOrigen[0] === 0 && posOrigen[1] === 7) this.fenEnrroque = this.fenEnrroque.replace("k", "");
            }
        }
        
        // --- Lógica de Movimiento ---
        if (isCapture) {
            const capturedPieceIndex = this.piezas.findIndex(p => p.pos[0] === posDestino[0] && p.pos[1] === posDestino[1]);
            if (capturedPieceIndex > -1) this.piezas.splice(capturedPieceIndex, 1);
        }
        
        this.tablero[posOrigen[0]][posOrigen[1]] = 0;
        this.tablero[posDestino[0]][posDestino[1]] = pieza.tipo * pieza.bando;
        pieza.pos = posDestino;
        
        this.turno *= -1;

        // --- Actualizar Historial de Posiciones ---
        // If it was a pawn move or capture, the history for threefold repetition resets.
        if (isPawnMove || isCapture) {
            this.history = [];
        }
        this.history.push(this.getFenPosition());
    }

    _generarMovimientosPseudoLegales() {
        const movimientos = [];
        const piezasTurno = this.piezas.filter(p => p.bando === this.turno);
        for (const pieza of piezasTurno) {
            for (let i = 0; i < 8; i++) { for (let j = 0; j < 8; j++) {
                const destino = [i, j];
                if (this._esMovimientoPseudoLegal(pieza, destino)) {
                    movimientos.push({ pieza, destino });
                }
            }}
        }
        return movimientos;
    }

    _esMovimientoPseudoLegal(pieza, destino) {
        const _tablero = this.tablero;
        const posOrigen = pieza.pos;
        const _bando = pieza.bando;
        if (_tablero[destino[0]][destino[1]] !== 0 && Math.sign(_tablero[destino[0]][destino[1]]) === _bando) return false;
        switch (pieza.tipo) {
            case 1:
                const dFila = destino[0] - posOrigen[0], dCol = destino[1] - posOrigen[1];
                if (dCol === 0 && _tablero[destino[0]][destino[1]] === 0) {
                    if (dFila === -1 * _bando) return true;
                    if (dFila === -2 * _bando && (posOrigen[0] === 6 || posOrigen[0] === 1) && _tablero[posOrigen[0] - 1 * _bando][posOrigen[1]] === 0) return true;
                } else if (Math.abs(dCol) === 1 && dFila === -1 * _bando && (_tablero[destino[0]][destino[1]] !== 0 || (this.fenPeonPaso !== "-" && destino[1] === this.fenPeonPaso[1] && destino[0] === this.fenPeonPaso[0]))) return true;
                return false;
            case 2: const df=Math.abs(posOrigen[0]-destino[0]), dc=Math.abs(posOrigen[1]-destino[1]); return(df===2&&dc===1)||(df===1&&dc===2);
            case 3: return Math.abs(posOrigen[0]-destino[0])===Math.abs(posOrigen[1]-destino[1]) && this._validaObstaculoSimple(posOrigen, destino);
            case 4: return(posOrigen[0]===destino[0]||posOrigen[1]===destino[1]) && this._validaObstaculoSimple(posOrigen, destino);
            case 5: return(Math.abs(posOrigen[0]-destino[0])===Math.abs(posOrigen[1]-destino[1])||posOrigen[0]===destino[0]||posOrigen[1]===destino[1])&&this._validaObstaculoSimple(posOrigen, destino);
            case 6: 
                if (Math.abs(posOrigen[0]-destino[0])<=1 && Math.abs(posOrigen[1]-destino[1])<=1) return true;
                // Castling
                if (Math.abs(destino[1] - posOrigen[1]) === 2 && destino[0] === posOrigen[0]) {
                    // This is a simplified check. A full check would ensure path is not attacked.
                    if (_bando > 0 && posOrigen[0] === 7 && posOrigen[1] === 4) {
                        if (destino[1] === 6 && this.fenEnrroque.includes("K")) return this._validaObstaculoSimple(posOrigen, [7, 7]);
                        if (destino[1] === 2 && this.fenEnrroque.includes("Q")) return this._validaObstaculoSimple(posOrigen, [7, 0]);
                    }
                    if (_bando < 0 && posOrigen[0] === 0 && posOrigen[1] === 4) {
                        if (destino[1] === 6 && this.fenEnrroque.includes("k")) return this._validaObstaculoSimple(posOrigen, [0, 7]);
                        if (destino[1] === 2 && this.fenEnrroque.includes("q")) return this._validaObstaculoSimple(posOrigen, [0, 0]);
                    }
                }
                return false;
        }
        return false;
    }

    _esCuadroAtacado(cuadro, bandoAtacante) {
        const piezasAtacantes = this.piezas.filter(p => p.bando === bandoAtacante);
        for (const pieza of piezasAtacantes) {
            if (pieza.tipo === 1) {
                const dFila = cuadro[0] - pieza.pos[0], dCol = Math.abs(cuadro[1] - pieza.pos[1]);
                if (dFila === -1 * pieza.bando && dCol === 1) return true;
            } else if (this._esMovimientoPseudoLegal(pieza, cuadro)) return true;
        }
        return false;
    }
    
    validaJaque() {
        const jaque = { jaqueKn: 0, jaqueKb: 0 };
        const posReyBlanco = this.piezas.find(p => p.tipo === 6 && p.bando === 1)?.pos;
        const posReyNegro = this.piezas.find(p => p.tipo === 6 && p.bando === -1)?.pos;
        if (posReyBlanco && this._esCuadroAtacado(posReyBlanco, -1)) jaque.jaqueKb = 1;
        if (posReyNegro && this._esCuadroAtacado(posReyNegro, 1)) jaque.jaqueKn = 1;
        return jaque;
    }

    _validaObstaculoSimple(origen, destino) {
        let dFila = destino[0]-origen[0], dCol = destino[1]-origen[1];
        let sFila = Math.sign(dFila), sCol = Math.sign(dCol);
        let fila = origen[0] + sFila, col = origen[1] + sCol;
        while (fila !== destino[0] || col !== destino[1]) {
            if (this.tablero[fila][col] !== 0) return false;
            fila += sFila; col += sCol;
        }
        return true;
    }
}