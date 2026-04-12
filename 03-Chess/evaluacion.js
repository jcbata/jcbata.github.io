// =================================================================
// BIBLIOTECA DE FUNCIONES DE EVALUACIÓN PARA LA IA DE AJEDREZ
// =================================================================

// Función original, muy simple.
function valorPieza(_pieza){
	/**
	 * Función de evaluación con nivel 0
	 * se aplica el teorema de Bayes para evaluar la probabilidad  comer o ser comido
	 */

	//cantidad de amenazas al enemigo de esta pieza
	let _amenazaA = 0; 
	// Se calcula el valor total de las piezas a las que se amenaza 
	// (el valor de cada pieza es el tipo, aunque debería ser el valor actual y no el inicial, verificar)
	for(let i=0;i<_pieza.amenazasA.length;i++) _amenazaA += _pieza.amenazasA[i].tipo;
	
	// Promedio ponderado de amenazas A
	if(_pieza.amenazasA.length>0)
	_amenazaA = _amenazaA/_pieza.amenazasA.length; 

	// De la misma forma ahora es el cálculo de las amenazas Del bando contrario
	let _tipoDe = 0;
	for(let i=0;i<_pieza.amenazasDe.length;i++) _tipoDe += _pieza.amenazasDe[i].tipo;

	_tipoDe = _tipoDe/_pieza.amenazasDe.length; // promedio ponderado de amenazas De
	
	//if(_pieza.amenazasDe.length>0)
	let _amenazaDe =_pieza.amenazasDe.length; // ??
	// cantidad de amenazas recibidas entre el valor de mi pieza
	//_amenazaDe =0;

	let _defendidoPor = 0;
	
	_defendidoPor =_pieza.defendidoPor.length; 

	// se aplica la probabilidad de ser comido si no es mi turno
	let _probComido = 0;
	//Analizar esta _probComido Bayes?
	if(_tipoDe>0 && _pieza.bando!=this.turno) 
		_probComido=_amenazaDe/(_amenazaDe+_defendidoPor)*(_pieza.tipo/_tipoDe);

	//El valor de la pieza es la razón del valor en la posición actual entre la probabilidad de ser comido
	//El valor actual considera el tipo+movilidad y valor de amenazas al enemigo
	_pieza.valor=(_pieza.tipo*.8+_pieza.movPosibles.length*.1+_amenazaA*.3)*(1-_probComido);

	// Cálculo de valor especial si es un peón
	if(_pieza.tipo==1){
		let _avance = _pieza.pos[0];
		if(_pieza.bando>0) _avance = 7-_pieza.pos[0];
		_pieza.valor=(_pieza.tipo*.8+_pieza.movPosibles.length*0+_avance*.1+_amenazaA*.1)*(1-_probComido);
	}
	
	// Cálculo de valor especial si es el Rey
	if(_pieza.tipo==6)
		_pieza.valor=_pieza.tipo-2+_pieza.movPosibles.length*.2;
}


// Función con el bug de "valor en decadencia" (stateful)
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

	if (_pieza.amenazasDe.length > 0) {
		_tipoDe = _tipoDe/_pieza.amenazasDe.length;
	}
	
	let _amenazaDe =_pieza.amenazasDe.length; // probabilidad que lo pierda
	let _defendidoPor =_pieza.defendidoPor.length; // promedio ponderado de amenazas De

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

// Función experimental que también era stateful
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

	if (_pieza.amenazasDe.length > 0) {
		_tipoDe = _tipoDe/_pieza.amenazasDe.length;
	}
	
	let _amenazaDe =_pieza.amenazasDe.length; // probabilidad que lo pierda
	let _defendidoPor =_pieza.defendidoPor.length; // promedio ponderado de amenazas De

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


// Nueva función de evaluación "sin estado" (CORREGIDA)
function valorPiezaSinEstado(_pieza){
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
	_amenazaA = _amenazaA/_pieza.amenazasA.length;

	let _tipoDe = 0;
	for(let i=0;i<_pieza.amenazasDe.length;i++) _tipoDe += _pieza.amenazasDe[i].tipo;

	if (_pieza.amenazasDe.length > 0) {
		_tipoDe = _tipoDe/_pieza.amenazasDe.length;
	}
	
	let _amenazaDe =_pieza.amenazasDe.length;
	let _defendidoPor =_pieza.defendidoPor.length;

	let _probComido = 0;
	if(_tipoDe>0 && _pieza.bando!=this.turno) 
	_probComido=_amenazaDe/(_amenazaDe+_defendidoPor)*(_pieza.tipo/_tipoDe);

	// --- INICIO DE LA CORRECCIÓN ---
	// Se usa _pieza.tipo en lugar de _pieza.valor para un cálculo sin estado.
	_pieza.valor=(_pieza.tipo*.8+_pieza.movPosibles.length*.05+_amenazaA*.1)*(1-_probComido)*(1+_reyEnemigo);

	if(_pieza.tipo==1){
		let _avance = _pieza.pos[0];
		if(_pieza.bando>0) _avance = 7-_pieza.pos[0];
		_avance=Math.pow(_avance*0.05,2);
		_pieza.valor=(_pieza.tipo*0.9+_pieza.movPosibles.length*0+_avance+_amenazaA*.1)*(1-_probComido);
	}
	
	if(_pieza.tipo==6)
		// Se usa _pieza.tipo en lugar de _pieza.valor
		_pieza.valor=(_pieza.tipo*(1+_pieza.movPosibles.length*0))*(1-_probComido);
	// --- FIN DE LA CORRECCIÓN ---
}


export const BIBLIOTECA_EVALUACION = {
    'simple': valorPieza,
    'con_estado_buggy': valorPiezaConObj,
    'con_rey_buggy': valorPiezaConObjRey,
    'sin_estado_corregida': valorPiezaSinEstado,
};
