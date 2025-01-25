// constants.js

// Variables de juego
let score = 0;
let lives = 5;
let squareClicked = false;
let moveInterval = 2000; // Tiempo inicial de 2000 ms
let moveTimer; // Variable para el temporizador de movimiento
let level = 1; //Nivel inicial
const flies = []; // Lista de moscas

// Selecciona los elementos necesarios
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
//const square = document.getElementById("square");
const gameArea = document.getElementById("game-area");
