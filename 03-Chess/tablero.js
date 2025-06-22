// para iniciar nodejs http-server

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


class Juego {
	
	constructor(
			tabl=[]
			) {
		this.tablero=tabl;
		
		this.movimientos=[];
		this.movAlg=[];
		this.piezas = [];
		this.histoFEN=[];
		this.tripleRep=0;
		this.auto_b=false;
		this.auto_n=false;
		this.tam = 60;
		this.margen=2;
		this.coordMouse=[-1,-1];
		this.turno = 1;
		this.posSel=[-1,-1];
		this.piezaSel=[-1,-1];
		this.jaque = {jaqueKn:0,jaqueKb:0};
		this.jaqueMate =0;
		this.tablas = 0;
		this.posK_b = [];
		this.posK_n = [];
		// cantidad movimientos posibles
		this.movimientos_n =0; 
		this.movimientos_b =0;

		this.movimientos.push(this.getTableroJson());

		//fen
		this.fen="";
		this.fenEnrroque="KQkq";
		this.nroMedioMovPeon=0;
		this.nroMovi_n=1; //número de movimientos de negras
		this.fenPeonPaso="-";

		//valoración
		this.valorb=0;
		this.valorn=0;

		//this.valorPieza = function(){};
		this.fdeBlancas=valorPieza;
		this.fdeNegras=valorPieza;

		this.juego = {piezas:[],tablero:tabl,turno:1,valorb:0,valorn:0,movimientos:[],nroMedioMovPe:0}

		//
		this.mensaje="Inicio";

	}
	getTableroJson(){
		return JSON.parse(JSON.stringify(this.tablero));
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
			this.tablero=Array(8).fill(Array(8).fill(0));
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
	readFEN(){
		//nomenglatura FEN para iniciar posiciones
		let a={'-1':'p','-2':'n','-3':'b','-4':'r','-5':'q','-6':'k'
			,'1':'P','2':'N','3':'B','4':'R','5':'Q','6':'K'};
		let posx=0;
		let posy=0;
		let posf=0;

		let subFen = "";
		// limpia el tablero
		let cuentaEspacios=0;
		let saltoLinea="";
		for(var i=0; i<this.tablero.length;i++){
			for(var j=0;j<this.tablero[i].length;j++){
				if(this.tablero[i][j]==0){ 
					cuentaEspacios++;
				}else{
					if(cuentaEspacios>0){
						subFen=subFen+cuentaEspacios.toString();
						cuentaEspacios=0;
					}
					let p = this.tablero[i][j].toString();
					subFen=subFen+a[p];
				}
			}
			if(cuentaEspacios>0){
				subFen=subFen+cuentaEspacios.toString();
			}
			if(i<this.tablero.length-1) subFen=subFen+"/";
			cuentaEspacios=0;
		}

		subFen=subFen+" ";  // siguiente sección del FEN

		if(this.turno>0){
			subFen=subFen+"w"; // white
		}else{
			subFen=subFen+"b"; // black
		}
		subFen=subFen+" ";  // siguiente sección del FEN
		if(this.fenEnrroque.length>0){
			subFen=subFen+this.fenEnrroque;
		}else{
			subFen=subFen+"-";
		}
		

		subFen=subFen+" ";  // siguiente sección del FEN
		subFen=subFen+this.fenPeonPaso;  //disponibilidad de peón al paso

		subFen=subFen+" ";  // siguiente sección del FEN
		subFen=subFen+this.nroMedioMovPeon.toString();

		subFen=subFen+" ";  // siguiente sección del FEN
		subFen=subFen+(this.nroMovi_n).toString();
		return subFen;
	}

	setFEN(fen){
		this.fen = fen;
	}
	getFEN(){
		return this.fen;
	}

	cargaPiezas(img){
		let i,j;
		this.piezas=[];
		// carga todas las piezas
		for(i=0;i<this.tablero.length;i++){
	
			for(j=0;j<this.tablero[i].length;j++){
	
				let bando = 0
				if(this.tablero[i][j]!=0) bando =abs(this.tablero[i][j]) / this.tablero[i][j];

				if(this.tablero[i][j]!=0){
					this.piezas.push(new Pieza(abs(this.tablero[i][j]),[i,j],this.tam,bando,1,img,{'1':10,'2':10,'3':10,'4':10,'5':10,'6':10}));
				}

				if(this.tablero[i][j] == -6) this.posK_n = [i,j];
				if(this.tablero[i][j] == 6) this.posK_b = [i,j];


			}
			

			
		}

		// carga movimientos posibles para cada pieza	
		this.movimientos_n =0;
		this.movimientos_b =0;

		for(let k= 0;k<this.piezas.length;k++){

			for(i=0;i<this.tablero.length;i++){
	
				for(j=0;j<this.tablero[i].length;j++){

					if(!(this.piezas[k].pos[0]==i && this.piezas[k].pos[1]==j))
					if(this.posicionEsLegal(this.tablero, this.piezas[k].pos, [i,j])){
						
		
						if(this.piezas[k].bando > 0){
							this.movimientos_b++;
						}else{
							this.movimientos_n++;
						}

						if(this.tablero[i][j]!=0) {
						// aquí se debe validar si el destino es su propia ficha (defensa)
							let piezaDest;
							for(let l=0;l<this.piezas.length;l++){
								if(this.piezas[l].pos[0]==i && this.piezas[l].pos[1]==j){
									piezaDest = this.piezas[l];
									break;
								}
							}
						
							if(this.piezas[k].bando==piezaDest.bando){
								piezaDest.defendidoPor.push(this.piezas[k].pos);
							}else{
								this.piezas[k].movPosibles.push([i,j]);
								this.piezas[k].amenazasA.push(piezaDest);
								piezaDest.amenazasDe.push(this.piezas[k]);
							}
						}
						else{
							this.piezas[k].movPosibles.push([i,j]);
						}
						
					}
					

				}
			}		

		}
		this.valorb=0;
		this.valorn=0;
		for(let k=0;k<this.piezas.length;k++ ){
			//valor pieza
			//fnValorPieza(this.piezas[k]);

			// se agrega una función de evaluación diferente para blancas o negras.
			if(this.piezas[k].bando>0){
				this.fdeBlancas(this.piezas[k]);

				this.valorb += this.piezas[k].valor;
			} else{
				this.fdeNegras(this.piezas[k]);

				this.valorn += this.piezas[k].valor;
			}

		}

		this.jaque = this.validaJaque(this.tablero);
	}
	

	fCoordMouse(x,y){
		let pos = [-1,-1];
		pos = [(y/this.tam|0),(x/this.tam|0)];
		// tamañox (8) -> this.tablero[0].length*this.tam;   x -> mX 
		if(mouseX > tablero.tablero[0].length*tablero.tam )					
			pos = [-1,-1];
		if(mouseX < 0)					
			pos = [-1,-1];
		if(mouseY > tablero.tablero.length*tablero.tam )
			pos = [-1,-1];
		if(mouseY < 0)					
			pos = [-1,-1];

		return pos;
	}

	deshacerMover(){
		//falta probar 
		this.movimientos.pop();
		this.tablero = this.movimientos[this.movimientos.length-1];
		this.turno=this.turno*-1;
	}
	
	moverMejorValor(_juego){
		//función para mover el Mejor Valor
		//if(this.turno!=-1) return; //solo negras

		const piezasTurno = _juego.piezas.filter(_pz => _pz.bando == this.turno && _pz.movPosibles.length >0);
		let mejorValor=-Infinity;
		let mejorPieza,mejorDestino;
		//agregado para movimiento para evitar triple repetición
		let mejorValor2=-Infinity;
		let mejorPieza2,mejorDestino2;
		//------------------------------------------------------
		for(let i=0; i<piezasTurno.length; i++){
			for(let j=0; j<piezasTurno[i].movPosibles.length; j++){

				let _otroJuego = new Juego(_juego.getTableroJson());
				//Para inicializar la función diferenciada
				_otroJuego.fdeBlancas = _juego.fdeBlancas;
				_otroJuego.fdeNegras = _juego.fdeNegras;

				_otroJuego.updateFEN(_juego.readFEN());
				_otroJuego.cargaPiezas(img);

				if(_otroJuego.mover(piezasTurno[i],piezasTurno[i].movPosibles[j])>0){
					_otroJuego.cargaPiezas(img);
					
					if(piezasTurno[i].bando<0)
						if(_otroJuego.valorn-_otroJuego.valorb>mejorValor){
							mejorValor2=mejorValor;
							mejorPieza2=mejorPieza;
							mejorDestino2=mejorDestino;

							mejorValor=_otroJuego.valorn-_otroJuego.valorb;
							mejorPieza = piezasTurno[i];
							mejorDestino = piezasTurno[i].movPosibles[j];
						}
					if(piezasTurno[i].bando>0)
						if(_otroJuego.valorb-_otroJuego.valorn>mejorValor){
							mejorValor2=mejorValor;
							mejorPieza2=mejorPieza;
							mejorDestino2=mejorDestino;

							mejorValor=_otroJuego.valorb-_otroJuego.valorn;
							mejorPieza = piezasTurno[i];
							mejorDestino = piezasTurno[i].movPosibles[j];
						}
				}


			}
		}
		if(typeof mejorPieza==='undefined'){
			if(this.jaque.jaqueKb != 0 || this.jaque.jaqueKn !=0) {
				this.jaqueMate=1;
				console.log("Jaque Mate!");
				this.mensaje="Jaque Mate!";
				
			}
			else{
				this.tablas=1;
				console.log("Tablas!");
				this.mensaje="Tablas!";
				
			}
		}

		// Evita triple repetición
		
		//let _lastmov = this.histoFEN[this.histoFEN.length-1];
		//let _rep = this.histoFEN.filter(mov => mov.split(' ')[0] == _lastmov.split(' ')[0]).length;
		
		if(this.tripleRep >1){
			console.log("Otro mejor valor");
			console.log([mejorPieza,mejorDestino]);
			mejorPieza=mejorPieza2;
			mejorDestino=mejorDestino2;
			
		}
		//-----------------------------

		//console.log([mejorPieza,mejorDestino]);
		return [mejorPieza,mejorDestino];

	}

	moverRandom(_profundidad=200){
		//if(this.turno!=-1) return; //solo negras
		//filtramos las piezas del turno	
		const piezasTurno = this.piezas.filter(_pz => _pz.bando == this.turno && _pz.movPosibles.length >0);


		//elige cualquier piezas del turno
		let _pieza = piezasTurno[this.randomInteger(0,piezasTurno.length-1)]; 
		//elige cualquier movimiento
		let _destino = _pieza.movPosibles[this.randomInteger(0,_pieza.movPosibles.length-1)];
		if(this.mover(_pieza,_destino)<0 && _profundidad>0){
			_profundidad--;
			this.moverRandom(_profundidad);
			
		}
		if(_profundidad==0) { 
			if(this.jaque.jaqueKb != 0 || this.jaque.jaqueKn !=0) {
				this.jaqueMate=1;
				console.log("Jaque Mate!");
				this.mensaje="Jaque Mate!";
				
			}
			else{
				this.tablas=1;
				console.log("Tablas!");
				this.mensaje="Tablas!";
				
			}
	
		}

	}


	mover(pieza,posDestino=[]) {
		
		let posx = {'0':'a','1':'b','2':'c','3':'d','4':'e','5':'f','6':'g','7':'h'};

		if(this.jaqueMate+this.tablas>0) return 0;
		if(posDestino.length==0){
			return 0;
		}
		if(pieza.bando != this.turno) return 0;


		//valida si en destino mi propio rey está en Jaque
		// si jaque
		//if(this.jaque==this.turno){
			// aquí se validar si en la posición de destino persiste el jaque.
			let _newTablero =this.getTableroJson();
			_newTablero[pieza.pos[0]][pieza.pos[1]] = 0;

			_newTablero[posDestino[0]][posDestino[1]] = pieza.tipo*pieza.bando;

			let _jaque = this.validaJaque(_newTablero);
			
			if(this.turno>0){
				//if(this.jaque.jaqueKb!=0){
					if(_jaque.jaqueKb!=0){
						console.log("Persiste el Jaque!");
						this.mensaje="Persiste el Jaque!";
						return -1;
					}
				//}
			}else{
				//if(this.jaque.jaqueKn!=0){
					if(_jaque.jaqueKn!=0){
						console.log("Persiste el Jaque!");
						this.mensaje="Persiste el Jaque!";
						return -1;
					}
				//}
			}

		

		//}

	

		//if(!this.validaTipo(pieza,posDestino)) return;

		if(!this.posicionEsValida(this.tablero, pieza.pos, posDestino)){ 
			console.log("Posición Ilegal: "+posDestino);
			return -1;}

		// valida que la casilla de destino no esté amenazada por el otro bando
		if(pieza.tipo==6)		
		for(let i=0;i<this.piezas.length;i++ ){
			if(this.piezas[i].bando != pieza.bando) // si es una pieza del otro bando 
			for(let j=0;j<this.piezas[i].movPosibles.length;j++){ // se busca si alguna otra pieza amenaza el destino
				if( this.piezas[i].tipo != 1 && this.piezas[i].movPosibles[j][0] ==  posDestino[0]
					&& this.piezas[i].movPosibles[j][1] ==  posDestino[1]){
						console.log("Casilla amenazada: "+posDestino);
					return -1;
				}
				/*
				// no necesario, ya se valida en el persiste el Jaque!

				if( this.piezas[i].tipo == 1 && this.piezas[i].pos[0] ==  posDestino[0]-1*this.piezas[i].bando
					&& abs(posDestino[1]-this.piezas[i].pos[1])==1){
						console.log("Casilla amenazada por Peón: "+posDestino);
					return;
				}
				*/
			}
		}

		// FIN DE VALIDACIONES


		
		//si es el rey se elimina la posibilidad del enroque
		if(pieza.tipo ==6)
			if(pieza.bando>0){
				this.fenEnrroque= this.fenEnrroque.replace("KQ","");
			}else{ 
				this.fenEnrroque= this.fenEnrroque.replace("kq","");
			}
		//si se mueve la torre se elimina la posibilidad del enroque
		if(pieza.tipo ==4)
			if(pieza.bando>0){
				if(pieza.pos[1]>0){
					this.fenEnrroque= this.fenEnrroque.replace("K","");
				}else{ 
					this.fenEnrroque= this.fenEnrroque.replace("Q","");
				}
			}else{ 
				if(pieza.pos[1]>0){
					this.fenEnrroque= this.fenEnrroque.replace("q","");
				}else{ 
					this.fenEnrroque= this.fenEnrroque.replace("k","");
				}
			}
		

		// antes de mover contamos los movimientos
		this.nroMedioMovPeon++;

		if(this.tablero[posDestino[0]][posDestino[1]]!=0) // si hay captura reinicia conteo de movimiento de Peón
			this.nroMedioMovPeon=0;

		if(pieza.tipo==1){ // si se mueve un peón reinicia conteo de movimiento de Peón
			this.nroMedioMovPeon=0;
		}

		// INICIO MOVIMIENTOS

		//Si es peón al paso
		if(pieza.tipo==1 && this.fenPeonPaso!='-')
			if(this.fenPeonPaso.substring(0,1)==posx[(posDestino[1]).toString()])
			if(this.fenPeonPaso.substring(1)==(8-posDestino[0]).toString())
				this.tablero[posDestino[0]+1*pieza.bando][posDestino[1]]=0; //eliminamos el peón al paso

		// habilita peón al paso 
		this.fenPeonPaso = "-";
		if(pieza.tipo==1 && abs(posDestino[0]-pieza.pos[0])==2){  // si es peón y el destino es + 2
			let _posdes=6;
			if(pieza.bando>0)
				_posdes=3;
			
			if(posDestino[1]<7)
			if(this.tablero[posDestino[0]][posDestino[1]+1] ==-1*pieza.bando){ 
				//verifica si a la derecha hay otro peón 
				//console.log("Peón al paso");
				this.fenPeonPaso = posx[(posDestino[1]).toString()]+_posdes.toString();
			}
			if(posDestino[1]>0)
			if(this.tablero[posDestino[0]][posDestino[1]-1] ==-1*pieza.bando){ 
				//verifica si a la izquierda hay otro peón 
				this.fenPeonPaso = posx[(posDestino[1]).toString()]+_posdes.toString();
			}
				
		}

		if(pieza.bando<0) this.nroMovi_n++;



		if( pieza.tipo== 6 &&	abs(posDestino[0]==pieza.pos[0]) && abs(posDestino[1]-pieza.pos[1])==2 ){
			//  si es enrroque movemos la torre

			let sentido = posDestino[1]-pieza.pos[1];
			let posTorre = [pieza.pos[0],this.tablero[0].length-1]; // ubicamos posición de la torre.
			if(sentido<0) posTorre = [pieza.pos[0],0];

			this.tablero[pieza.pos[0]][pieza.pos[1]+sentido/abs(sentido)] = this.tablero[posTorre[0]][posTorre[1]];
			this.tablero[posTorre[0]][posTorre[1]] = 0;

		}

		//----------------------------------------
		//movimiento algebraico.
		
		
		let _movAlgS = pieza.nombre+posx[posDestino[1].toString()]+(8-posDestino[0]).toString();
		let _movAlgL = posx[pieza.pos[1].toString()]+(8-pieza.pos[0]).toString()+posx[posDestino[1].toString()]+(8-posDestino[0]).toString();

		if(pieza.bando<0){
			if(this.movAlg.length>0){
				this.movAlg[this.movAlg.length-1]['short'][1]=_movAlgS;
				this.movAlg[this.movAlg.length-1]['large'][1]=_movAlgL;
			}
		}else{
			let _newMov = JSON.parse(JSON.stringify({'short':new Array(_movAlgS,''),'large':new Array(_movAlgL,'')}));
			
			this.movAlg.push(_newMov);
		}
		 
		//-------------------------------------------

		//Movemos la ficha
		this.tablero[pieza.pos[0]][pieza.pos[1]] = 0;
	
		this.tablero[posDestino[0]][posDestino[1]] = pieza.tipo*pieza.bando;
		
		//FIN DE MOVIMIENTO
		

		// corona Peón
		if(pieza.tipo ==1 && (posDestino[0]==0 || posDestino[0] == this.tablero.length-1))
			this.tablero[posDestino[0]][posDestino[1]] = 5*pieza.bando;
		
		this.movimientos.push(this.getTableroJson());
		let _lastmov = this.readFEN();
		this.histoFEN.push(_lastmov);


		//Triple repetición

		//let _lastmov = tablero.histoFEN[tablero.histoFEN.length-1].split(' ')[0];
		let _rep = this.histoFEN.filter(mov => mov.split(' ')[0] == _lastmov.split(' ')[0]).length;

		this.tripleRep=_rep;
		
		if(_rep>2){
			this.tablas=1;
			console.log("Triple repetición!");
			this.mensaje="Tablas!-por triple repetición";
		}

		
		this.jaque = this.validaJaque(this.tablero);

		if(this.jaque.jaqueKb != 0 || this.jaque.jaqueKn !=0){ 
			
			console.log("Jaque!"); 
			this.mensaje="Jaque!";
			if(this.nroMedioMovPeon>49){ 
				this.tablas=1;
				console.log("59 Movimientos !");
				this.mensaje="Tablas!-más de 59 movimientos";
			}

			// Si Jaque Mate.?

			// 1 Movimientos posibles del rey.?

			// 2 posibilidad de eliminar las amenazas.?

			// 3 posibilidad de obstruir las amenazas.?
		
	    }else{
			this.mensaje="Jugando...";
		}

		// ningún movimiento posible?

		//pieza.pos = posDestino;
		this.turno=this.turno*-1
		return 1;

	}

	validaJaque(_matriz){
		// verifica si alguna pieza hace jaque a algún Rey
		let _jaque={jaqueKn:0,jaqueKb:0};
		let _posKn, _posKb;
		for(let i = 0; i < _matriz.length; i++) {
			
			for(let j = 0; j < _matriz[i].length; j++) {

				if(_matriz[i][j]==6) _posKb=[i,j];
				if(_matriz[i][j]==-6) _posKn=[i,j];

			}
		
		}

		for(let i = 0; i < _matriz.length; i++) {
			
			for(let j = 0; j < _matriz[i].length; j++) {
				// si hay alguna pieza en la casilla
				if(_matriz[i][j]!=0) 
				if(abs(_matriz[i][j])/_matriz[i][j] >0){
					// si la pieza es blanca verifica si tiene un movimiento válido al rey negro
					if(this.posicionEsValida(_matriz, [i,j], _posKn)) 
						_jaque.jaqueKn=1; // jaque al rey negro

				}
				else{
					if(this.posicionEsValida(_matriz, [i,j], _posKb)) 
						_jaque.jaqueKb=1; // jaque al rey blanco

				}
				//error, si ambos reyes están en jaque siempre retorna 1

			}
		
		}
		return _jaque;
	}

	

	validaObstaculo(_tablero,origen,destino){
		let valido = true;
			// verificar que no salte
		// diferencia
		let diferenciaX = destino[0] -origen[0];
		let diferenciaY = destino[1] - origen[1];
		// sentido
		let sentidoX = 0;
		if(diferenciaX != 0)
		sentidoX = diferenciaX/abs(diferenciaX);

		let sentidoY = 0;
		if(diferenciaY != 0)
		sentidoY = diferenciaY/abs(diferenciaY);	

		let _x = origen[0];
		let _y = origen[1];

		while (destino[1] != _y || destino[0] != _x) {
			
			_x = _x +sentidoX;
			_y = _y +sentidoY;
			if(destino[1] != _y || destino[0] != _x)
				if(_tablero[_x][_y] != 0) valido = false;

		}

		return valido;
	}

	
	dibujar(color=[255,200,12,255]){
		
		let c=1;
		let _tam = this.tam;
		let _margen=this.margen;
		
		strokeWeight(_margen);
		stroke(color);
		noFill();
		rect(0, 0, this.tablero[0].length*_tam+_margen/2, this.tablero.length*_tam+_margen/2);

		/*
		for(let k= 0;k<this.piezas.length;k++){
			
			this.piezas[k].movPosibles= [];
		}
		*/

		
		for(let i = 0; i < this.tablero.length; i++) {
			
			for(let j = 0; j < this.tablero[i].length; j++) {

				// dibuja tablero
				noStroke();
				if (c==0){ color[3]=255; fill(color); c=1;} 
				else { color[3]=5; fill(color); c=0; }
				square(i*_tam+_margen/2, j*_tam+_margen/2, _tam);

				
				// dibjuja última jugada.
				if(this.movimientos.length>1)
				if(this.tablero[j][i]!= this.movimientos[this.movimientos.length-2][j][i]){
					
					fill(240,80,12,150);
					square(i*_tam+_margen/2, j*_tam+_margen/2, _tam);
				}


				// dibuja Piezas
				


				// dibuja movimiento posible
				this.dibujaMovimientoPosible(i,j,[12,100,240,80]);


				
			}
			
			if (c==0){ color[3]=255; fill(color); c=1;} 
				else { color[3]=5; fill(color); c=0; }

			text(this.tablero.length-i+1,_tam*.9,i*_tam+_margen*0);
			
		}
		
		
	}

	dibujaBarraValor(_juego){
		let _tam = this.tam;
		let _margen=this.margen;
		let _ancho = 10;
		let _x = _juego.tablero[0].length*_tam+_margen+_ancho/2;
		let _altoTotal = _juego.tablero[0].length*_tam+_margen/2;

		let _alton= _altoTotal*_juego.valorn /(_juego.valorn+_juego.valorb);
		let _altob= _altoTotal*_juego.valorb /(_juego.valorn+_juego.valorb);

		stroke(0);
		fill(0);
		rect(_x, 0, _ancho,_alton);
		fill(255);
		rect(_x, _alton, _ancho,_altob);
	
		fill(255);
		//text(round(_juego.valorn,2),_altoTotal+_ancho*2,_alton/2);
		//text(round(_juego.valorb,2),_altoTotal+_ancho*2,_alton+_altob/2);

		text(round(_juego.valorb-_juego.valorn,2),_altoTotal+_ancho*2,_alton);
	}

	dibujaMensaje(_juego){
		let _tam = this.tam;
		let _margen=this.margen;

		let _altoTotal = _juego.tablero[0].length*_tam+_margen/2;


		stroke(0);
		fill(255);
		text(this.mensaje,_margen,_altoTotal+_margen+10);

	}
	

	dibujaMovimientoPosible(i,j,color=[12,100,240,80]){
		// Si no se selecciona una Pieza no continúa
		if(!this.piezaSel) return;
		if(this.piezaSel[0]<0) return;
		if(this.tablero[this.piezaSel[0]][this.piezaSel[1]]==0) return;
		
		let _tam = this.tam;
		let _margen=this.margen;
		let _piezaSel;
		
		for(let p=0;p<this.piezas.length;p++){
			if(this.piezas[p].pos[0]==this.piezaSel[0]
				&& this.piezas[p].pos[1]==this.piezaSel[1]){
				_piezaSel = this.piezas[p];
			}
		}

		let _movPosible=false;
		for(let p=0;p<_piezaSel.movPosibles.length;p++){
			if(_piezaSel.movPosibles[p][0]==j
				&&_piezaSel.movPosibles[p][1]==i){
					_movPosible=true;
				}
		}
		//if(this.turno!=_bando) return;
						
		noStroke();
		fill(color);
		
		//if(this.posicionEsValida(this.tablero, this.piezaSel, [j,i]))
		//square(i*_tam+_margen/2, j*_tam+_margen/2, _tam);
		if(_movPosible)
		circle(i*_tam+_tam/2, j*_tam+_tam/2+_margen/2, _tam/2);
				


	}

	posicionEsValida(_tablero, posOrigen, posDestino){
		let _pieza = abs(_tablero[posOrigen[0]][posOrigen[1]]);
		let _bando = (_tablero[posOrigen[0]][posOrigen[1]])/abs(_tablero[posOrigen[0]][posOrigen[1]]);
		if(_pieza==0) return false;

		// no puede comer a la misma pieza
		if(_tablero[posDestino[0]][posDestino[1]] / abs(_tablero[posDestino[0]][posDestino[1]]) == _bando ){
			return false;
		}

		return this.posicionEsLegal(_tablero, posOrigen, posDestino);
	}

	posicionEsLegal(_tablero, posOrigen, posDestino){
		// también util para movimiento posible
		let valido = false;

		let _pieza = abs(_tablero[posOrigen[0]][posOrigen[1]]);
		let _bando = (_tablero[posOrigen[0]][posOrigen[1]])/abs(_tablero[posOrigen[0]][posOrigen[1]]);
		if(_pieza==0) return false;

		switch(_pieza){
			case 1: // Peon
				// avanzar de 1 en 1
				if(posDestino[0]==posOrigen[0]-1*_bando
				   && posDestino[1]==posOrigen[1]
				   && _tablero[posDestino[0]][posDestino[1]] == 0 ) valido = true; 
				// avanzar de 2 en la posición inicial
				if(posDestino[0]==posOrigen[0]-2*_bando
					&& posDestino[1]==posOrigen[1]
					&& _tablero[posDestino[0]][posDestino[1]] == 0
					&& _tablero[posDestino[0]+1*_bando][posDestino[1]] == 0
					&& (posOrigen[0] == 1 || posOrigen[0] == _tablero.length-2)) valido = true;
				//comer
				
				if(posDestino[0]==posOrigen[0]-1*_bando
					&& _tablero[posDestino[0]][posDestino[1]] != 0 
					&& abs(posDestino[1]-posOrigen[1])==1) valido = true; 


				 // Peón al paso
				 let posx = {'0':'a','1':'b','2':'c','3':'d','4':'e','5':'f','6':'g','7':'h'};

				if(this.fenPeonPaso != '-')
					if(this.fenPeonPaso.substring(0,1)==posx[posDestino[1].toString()])
					if(this.fenPeonPaso.substring(1)==(8-posDestino[0]).toString() )
					//Si la letra el peón al paso es igual la columna de destino entonces validar si se puede comer
						if(posDestino[0]==posOrigen[0]-1*_bando
							&& _tablero[posDestino[0]][posDestino[1]] == 0 
							&& abs(posDestino[1]-posOrigen[1])==1) valido = true; 


				break;
			case 2: // Caballo
				if((abs(posDestino[0]-posOrigen[0])==2 && abs(posDestino[1]-posOrigen[1]) == 1)
				|| (abs(posDestino[0]-posOrigen[0])==1 && abs(posDestino[1]-posOrigen[1]) == 2)
				) valido = true;
			
				break;
			case 3: // Alfil
				if(abs(posDestino[0]-posOrigen[0])==abs(posDestino[1]-posOrigen[1])) 
					valido = this.validaObstaculo(_tablero,posOrigen,posDestino);
				
				break;
			case 4: // Torre
				if(posDestino[0]==posOrigen[0]||posDestino[1] ==posOrigen[1]) {
					valido = this.validaObstaculo(_tablero,posOrigen,posDestino);
									
				}
				break;
			case 5: // Dama
				if((abs(posDestino[0]-posOrigen[0])==abs(posDestino[1]-posOrigen[1]))
				|| (posDestino[0]==posOrigen[0]||posDestino[1] ==posOrigen[1]))
				valido = this.validaObstaculo(_tablero,posOrigen,posDestino);
				break;
			case 6: // Rey

				

				if(	abs(posDestino[0]-posOrigen[0])<=1	&& abs(posDestino[1]-posOrigen[1])<=1 ) valido = true;
								
				// Enrroque
				let _sentidoEnroque = posDestino[1]-posOrigen[1];
				if( (_bando > 0 && this.jaqueKb == 0 && ((this.fenEnrroque.indexOf('K') >-1 && _sentidoEnroque==2) 
						|| (this.fenEnrroque.indexOf('Q') >-1 && _sentidoEnroque==-2 )) 
					)
					||
					(_bando < 0 && this.jaqueKn == 0  && ((this.fenEnrroque.indexOf('k') >-1 &&  _sentidoEnroque==2) 
						|| (this.fenEnrroque.indexOf('q') >-1 && _sentidoEnroque==-2))
					)
				)
				if(abs(posDestino[0]==posOrigen[0]) && abs(posDestino[1]-posOrigen[1])==2 ){
					let sentido = posDestino[1]-posOrigen[1];
					let posTorre = [posOrigen[0],_tablero[0].length-1]; // ubicamos posición de la torre.
					if(sentido<0) posTorre = [posOrigen[0],0];

					//verificamos  si hay obstáculo

					if(this.validaObstaculo(_tablero,posOrigen,posTorre)){
						valido = true;
						// verificamos que no se hayan movido el Rey o la Torre
						// ya no es necesario por el fenEnrroque
						/*
						for(let k=0;k<this.movimientos.length;k++){
							if(_tablero[posOrigen[0]][posOrigen[1]]!= this.movimientos[k][posOrigen[0]][posOrigen[1]]
							|| _tablero[posTorre[0]][posTorre[1]]!= this.movimientos[k][posTorre[0]][posTorre[1]]
								){ 
									valido = false;
									break;
								}

						}
						*/

					}else{
						valido = false;
					}

					


				}

				
				

				break;

			default:
				valido = false;
				break;	

		}
		
		return valido;
	}

	randomInteger(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}


	
}

