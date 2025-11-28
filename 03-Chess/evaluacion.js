// =================================================================
// BIBLIOTECA DE FUNCIONES DE EVALUACIÓN
// =================================================================

// -----------------------------------------------------------------
// SECCIÓN 1: Funciones de Evaluación Puras (Nuevas y Rápidas)
// -----------------------------------------------------------------

function evalMaterial(estado) {
    const pieceValues = { 1: 1, 2: 3, 3: 3, 4: 5, 5: 9, 6: 200 };
    let score = 0;
    for (const pieza of estado.piezas) {
        score += (pieceValues[pieza.tipo] || 0) * pieza.bando;
    }
    return score * estado.turno;
}

function evalPosicional(estado) {
    const pieceValues = { 1: 100, 2: 320, 3: 330, 4: 500, 5: 900, 6: 20000 };
    const pawnTable = [ [0,0,0,0,0,0,0,0], [50,50,50,50,50,50,50,50], [10,10,20,30,30,20,10,10], [5,5,10,25,25,10,5,5], [0,0,0,20,20,0,0,0], [5,-5,-10,0,0,-10,-5,5], [5,10,10,-20,-20,10,10,5], [0,0,0,0,0,0,0,0] ];
    const knightTable = [ [-50,-40,-30,-30,-30,-30,-40,-50], [-40,-20,0,0,0,0,-20,-40], [-30,0,10,15,15,10,0,-30], [-30,5,15,20,20,15,5,-30], [-30,0,15,20,20,15,0,-30], [-30,5,10,15,15,10,5,-30], [-40,-20,0,5,5,0,-20,-40], [-50,-40,-30,-30,-30,-30,-40,-50] ];
    let score = 0;
    for (const pieza of estado.piezas) {
        const value = pieceValues[pieza.tipo] || 0;
        let positionScore = 0;
        const row = pieza.pos[0], col = pieza.pos[1];
        if (pieza.tipo === 1) positionScore = (pieza.bando === 1) ? pawnTable[row][col] : pawnTable[7-row][col];
        else if (pieza.tipo === 2) positionScore = knightTable[row][col];
        score += (value + positionScore) * pieza.bando;
    }
    return score * estado.turno;
}


// -----------------------------------------------------------------
// SECCIÓN 2: Puente de Compatibilidad para Funciones Heredadas (Lento)
// -----------------------------------------------------------------

// --- Lógica de la función "buggy" original, ahora marcada como _legado ---
function _valorPiezaConObj_legado(_pieza, turnoActual){
	let _amenazaA = 0;
	for(let i=0;i<_pieza.amenazasA.length;i++) _amenazaA += _pieza.amenazasA[i].tipo;
	if(_pieza.amenazasA.length>0) _amenazaA = _amenazaA/_pieza.amenazasA.length;

	let _tipoDe = 0;
	for(let i=0;i<_pieza.amenazasDe.length;i++) _tipoDe += _pieza.amenazasDe[i].tipo;
	if (_pieza.amenazasDe.length > 0) _tipoDe = _tipoDe/_pieza.amenazasDe.length;
	
	let _amenazaDe =_pieza.amenazasDe.length;
	let _defendidoPor =_pieza.defendidoPor.length;

	let _probComido = 0;
	if(_tipoDe > 0 && _pieza.bando != turnoActual) 
	    _probComido = _amenazaDe / (_amenazaDe + _defendidoPor) * (_pieza.tipo / _tipoDe);

	// Este uso de _pieza.valor hace que la función sea "stateful" (depende del estado anterior)
	_pieza.valor = (_pieza.valor * .8 + _pieza.movPosibles.length * .05 + _amenazaA * .1) * (1 - _probComido);

	if(_pieza.tipo==1){
		let _avance = _pieza.bando === 1 ? (7 - _pieza.pos[0]) : _pieza.pos[0];
		_avance = Math.pow(_avance * 0.05, 2);
		_pieza.valor=(_pieza.tipo * 0.9 + _pieza.movPosibles.length * 0 + _avance + _amenazaA * .1) * (1 - _probComido);
	}
	
	if(_pieza.tipo==6)
		_pieza.valor=(_pieza.valor * (1 + _pieza.movPosibles.length * 0)) * (1 - _probComido);
}

// --- Funciones de ayuda para el pre-cálculo, copiadas de la lógica de EstadoJuego ---
function _validaObstaculoSimple(tablero, origen, destino) {
    let dFila = destino[0] - origen[0], dCol = destino[1] - origen[1];
    let sFila = Math.sign(dFila), sCol = Math.sign(dCol);
    let fila = origen[0] + sFila, col = origen[1] + sCol;
    while (fila !== destino[0] || col !== destino[1]) {
        if (tablero[fila][col] !== 0) return false;
        fila += sFila; col += sCol;
    }
    return true;
}

function _esMovimientoPseudoLegal(tablero, pieza, destino) {
    const posOrigen = pieza.pos, _bando = pieza.bando;
    if (tablero[destino[0]][destino[1]] !== 0 && Math.sign(tablero[destino[0]][destino[1]]) === _bando) return false;
    switch (pieza.tipo) {
        case 1:
            const dFila = destino[0] - posOrigen[0], dCol = destino[1] - posOrigen[1];
            if (dCol === 0 && tablero[destino[0]][destino[1]] === 0) {
                if (dFila === -1 * _bando) return true;
                if (dFila === -2 * _bando && (posOrigen[0] === 6 || posOrigen[0] === 1) && tablero[posOrigen[0] - 1 * _bando][posOrigen[1]] === 0) return true;
            } else if (Math.abs(dCol) === 1 && dFila === -1 * _bando && tablero[destino[0]][destino[1]] !== 0) return true;
            return false;
        case 2: const df=Math.abs(posOrigen[0]-destino[0]), dc=Math.abs(posOrigen[1]-destino[1]); return(df===2&&dc===1)||(df===1&&dc===2);
        case 3: return Math.abs(posOrigen[0]-destino[0])===Math.abs(posOrigen[1]-destino[1]) && _validaObstaculoSimple(tablero, posOrigen, destino);
        case 4: return(posOrigen[0]===destino[0]||posOrigen[1]===destino[1]) && _validaObstaculoSimple(tablero, posOrigen, destino);
        case 5: return(Math.abs(posOrigen[0]-destino[0])===Math.abs(posOrigen[1]-destino[1])||posOrigen[0]===destino[0]||posOrigen[1]===destino[1])&&_validaObstaculoSimple(tablero, posOrigen, destino);
        case 6: return Math.abs(posOrigen[0]-destino[0])<=1&&Math.abs(posOrigen[1]-destino[1])<=1;
    }
    return false;
}

// --- El pre-calculador que genera los datos que la función legacy necesita ---
function _precalcularDatosLegados(estado) {
    for (const p of estado.piezas) { p.movPosibles = []; p.amenazasA = []; p.amenazasDe = []; p.defendidoPor = []; }
    for (const piezaOrigen of estado.piezas) {
        for (let i = 0; i < 8; i++) { for (let j = 0; j < 8; j++) {
            const destino = [i, j];
            if (piezaOrigen.pos[0] === i && piezaOrigen.pos[1] === j) continue;
            if (_esMovimientoPseudoLegal(estado.tablero, piezaOrigen, destino)) {
                const piezaEnDestinoValor = estado.tablero[i][j];
                if (piezaEnDestinoValor !== 0) {
                    const piezaDestino = estado.piezas.find(p => p.pos[0] === i && p.pos[1] === j);
                    if (piezaDestino) {
                        if (piezaOrigen.bando === piezaDestino.bando) piezaDestino.defendidoPor.push(piezaOrigen);
                        else {
                            piezaOrigen.movPosibles.push(destino);
                            piezaOrigen.amenazasA.push(piezaDestino);
                            piezaDestino.amenazasDe.push(piezaOrigen);
                        }
                    }
                } else piezaOrigen.movPosibles.push(destino);
            }
        }}
    }
}

// --- La función "envoltura" (wrapper) que une todo ---
function evalBuggyLegado(estado) {
    // 1. Pre-calcula los datos de amenazas/defensas y los añade a las piezas del estado
    _precalcularDatosLegados(estado);

    // 2. Ahora que los datos existen, calcula la puntuación usando la lógica antigua
    let score = 0;
    const pieceValues = { 1: 1, 2: 3.2, 3: 3.3, 4: 5, 5: 9, 6: 200 };
    for (const pieza of estado.piezas) {
        pieza.valor = pieceValues[pieza.tipo] || 0; // Resetea el valor antes de llamar a la función stateful
        _valorPiezaConObj_legado(pieza, estado.turno);
        score += pieza.valor * pieza.bando;
    }
    return score * estado.turno;
}


// -----------------------------------------------------------------
// SECCIÓN 3: Biblioteca de exportación
// -----------------------------------------------------------------

export const BIBLIOTECA_EVALUACION = {
    'Material Simple': evalMaterial,
    'Posicional (Nuevo)': evalPosicional,
    'Buggy (Legado)': evalBuggyLegado,
};
