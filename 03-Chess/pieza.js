export class Pieza {

	constructor(
		tipo = 0,
		pos = [0,0],
		piezaSize = 60,
		bando = 0,
		vivo = false,
		img = null,
		_valores = {'1':1,'2':2,'3':3,'4':4,'5':5,'6':6}
	) {
	let a={'-1':'p','-2':'n','-3':'b','-4':'r','-5':'q','-6':'k'
	,'1':'P','2':'N','3':'B','4':'R','5':'Q','6':'K'};
	this.nombre=a[(tipo*bando).toString()];
	this.tipo =tipo;

	this.pos = pos; // posición en la matriz del tablero
	this.posAnt = pos;
	this.coord = [this.pos[0]*piezaSize,this.pos[1]*piezaSize]; //para dibujar
	this.bando = bando;
	this.valores=_valores; //valor de las fichas
	this.valor=this.valores[tipo.toString()];
	this.vivo = vivo; // no usado
	this.img = img;
	this.posSel = [-1,-1];
	this.movPosibles=[];
	this.amenazasA=[];
	this.amenazasDe=[];
	this.defendidoPor= [];
	this.piezaSize=piezaSize;
	}

	dibujar(estilo) {
		//estos valores dependenden de la imágen png
		let _estilo = estilo;
		let ancho = this.img.width/6;
		let alto = this.img.height/12;
		let bandoPos = 0; // identifica el bando (Blancas o Negras)
				
		if(this.bando<0) bandoPos = _estilo*alto*2;
		if(this.bando>0) bandoPos = _estilo*alto*2+alto;

		if(this.tipo>0){
			image(this.img, //imagen completa
				this.coord[1],this.coord[0],  // posición en el tablero
				this.piezaSize, this.piezaSize, // tamaño del sprite
				(this.tipo - 1)*ancho,bandoPos  // recorte inicio del sprite 0,0
				,ancho,alto); // recorte fin del sprite ancho
			
		}
	}

}
