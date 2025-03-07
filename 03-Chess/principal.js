let width = screen.width, height = screen.height;
let tablero, img;


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
	tablero.tam = Math.min(width, height) / 8;
	tablero.auto_n=true;
	tablero.fdeNegras = valorPiezaConObj;
	tablero.fdeBlancas = valorPiezaConObj;
	//tablero.fdeBlancas = valorPiezaConObjRey;
	tablero.cargaPiezas(img);
	
	
	//moveAuto(); // Se activa para que las blancas jueguen automáticamente
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
	//fullscreen(true);
	console.log(tablero.fCoordMouse(x,y));
	tablero.posSel = tablero.fCoordMouse(x,y);
	tablero.piezaSel = tablero.posSel;

	
		
	
}
function mouseDragged() {
	x = mouseX;
	y = mouseY;

	
	
	for(i=0;i<tablero.piezas.length;i++){


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
	
       let pos = tablero.fCoordMouse(mouseX,mouseY);
	//  aquí ya debería estar seleccionada la pieza en otro evento
	if(tablero.posSel[0]!==-1){
		
	}


	for(i=0;i<tablero.piezas.length;i++){ 
		// el buqle es para buscar la pieza seleccinada. aunque también se podría ubicar solo con las coordenadas posSel

		if(tablero.posSel[0]>-1){
			
			if(tablero.piezas[i].pos[0] == tablero.posSel[0] && tablero.piezas[i].pos[1] == tablero.posSel[1]){
				//valida que la pieza sea la seleccionada
				if(tablero.tablero[0].length*tablero.tam>=mouseX && tablero.tablero.length*tablero.tam>=mouseY){
				tablero.mover(tablero.piezas[i],pos);
				tablero.cargaPiezas(img);	// crea las piezas en el tablero a partir de la matriz
				console.log("pieza:",tablero.piezas[i]);
				}
			}
			
		}
		if(tablero.piezas[i])
		tablero.piezas[i].coord = [tablero.piezas[i].pos[0]*tablero.tam,tablero.piezas[i].pos[1]*tablero.tam];


	}

	if(tablero.jaqueMate ==0 && tablero.tablas==0){

		if(tablero.turno<0) {
			if(tablero.auto_n)
			if(tablero.movimientos.length <3){

				tablero.moverRandom();
				tablero.cargaPiezas(img);
			
			}else{
				let juegoTmp = new Juego(tablero.getTableroJson());
				//Para inicializar la función diferenciada
				juegoTmp.fdeBlancas = tablero.fdeBlancas;
				juegoTmp.fdeNegras = tablero.fdeNegras;

				juegoTmp.updateFEN(tablero.readFEN());
				juegoTmp.cargaPiezas(img);
				juegoTmp.tripleRep=tablero.tripleRep;

				let mov = juegoTmp.moverMejorValor(juegoTmp);
				tablero.tablas=juegoTmp.tablas;
				tablero.jaqueMate=juegoTmp.jaqueMate;
				tablero.mover(mov[0],mov[1]);
				tablero.cargaPiezas(img);
				console.log("pieza:",mov[0]);
				console.log(mov);

			}

			document.getElementById("factor").value = tablero.readFEN();
								
		
		}else{
			/*
			if(tablero.movimientos.length <3){

				tablero.moverRandom();
				tablero.cargaPiezas(img);
			
			}else{
				
				let juegoTmp = new Juego(tablero.getTableroJson());
				juegoTmp.updateFEN(tablero.readFEN());
				juegoTmp.cargaPiezas(img);
				let mov = juegoTmp.moverMejorValor(juegoTmp);
				tablero.tablas=juegoTmp.tablas;
				tablero.jaqueMate=juegoTmp.jaqueMate;
				tablero.mover(mov[0],mov[1]);
				tablero.cargaPiezas(img);
				
				
			}
			*/

		}
	
	}
	
	
	//tablero.moverRandom();
	
	
	tablero.posSel = [-1,-1];
	tablero.piezaSel = [-1,-1];

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
	tablero.cargaPiezas(img);

    console.log("Tarea: No espera " + Date())
    mueveRandom();
  })
/*
  await sleep(500)
  tablero.moverRandom();
  console.log("Await: Espera respuesta " + Date())
  mueveRandom();
  */

}

function moveAuto()
{
 
  if(tablero.jaqueMate+tablero.tablas>0) return;
  sleep(1500).then(function() {

	if(tablero.turno<0) {
		if(tablero.movimientos.length <3){

			tablero.moverRandom();
			tablero.cargaPiezas(img);
		
		}else{
			let juegoTmp = new Juego(tablero.getTableroJson());
			//Para inicializar la función diferenciada
			juegoTmp.fdeBlancas = tablero.fdeBlancas;
			juegoTmp.fdeNegras = tablero.fdeNegras;

			juegoTmp.updateFEN(tablero.readFEN());
			juegoTmp.cargaPiezas(img);
			juegoTmp.tripleRep=tablero.tripleRep; // conteo de triple

			let mov = juegoTmp.moverMejorValor(juegoTmp);
			tablero.tablas=juegoTmp.tablas;
			tablero.jaqueMate=juegoTmp.jaqueMate;
			tablero.mover(mov[0],mov[1]);
			tablero.cargaPiezas(img);
			console.log("Juega Valor:" + Date());
			console.log(mov);

		}
		
	}else{
		/*
		tablero.moverRandom();
		tablero.cargaPiezas(img);
		
		console.log("Juega Ramdom:" + Date());
		*/

		
		/*
		console.log("Juega Valor:" + Date());
		*/

		if(tablero.movimientos.length <3){

			tablero.moverRandom();
			tablero.cargaPiezas(img);
		
		}else{
			let juegoTmp = new Juego(tablero.getTableroJson());
			//Para inicializar la función diferenciada
			juegoTmp.fdeBlancas = tablero.fdeBlancas;
			juegoTmp.fdeNegras = tablero.fdeNegras;

			juegoTmp.updateFEN(tablero.readFEN());
			juegoTmp.cargaPiezas(img);
			juegoTmp.tripleRep=tablero.tripleRep;

			let mov = juegoTmp.moverMejorValor(juegoTmp);
			tablero.tablas=juegoTmp.tablas;
			tablero.jaqueMate=juegoTmp.jaqueMate;
			tablero.mover(mov[0],mov[1]);
			tablero.cargaPiezas(img);
			console.log("Juega Valor:" + Date());
			console.log(mov);

		}
	}

  	//console.log("b:"+tablero.valorb+", n:"+tablero.valorn+", mov:"+tablero.nroMedioMovPeon);
    moveAuto();
  })
/*
  await sleep(500)
  tablero.moverRandom();
  console.log("Await: Espera respuesta " + Date())
  mueveRandom();
  */

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
