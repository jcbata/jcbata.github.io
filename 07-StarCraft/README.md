# Insectoid Dominion

Un mini-juego de estrategia en tiempo real (RTS) inspirado en StarCraft, desarrollado en JavaScript y HTML5 usando el framework Phaser 3.

## Cómo Ejecutar el Juego

Para jugar, necesitas servir los archivos en un servidor web local. Los navegadores modernos tienen políticas de seguridad que impiden que los juegos se ejecuten correctamente si se abren directamente desde el sistema de archivos (`file:///...`).

La forma más sencilla es usar el servidor que viene incorporado con Python:

1.  Abre una terminal en la carpeta raíz del proyecto.
2.  Ejecuta el siguiente comando:
    ```sh
    python -m http.server 8000
    ```
3.  Abre tu navegador web y ve a la dirección `http://localhost:8000`.

## Funcionalidades Implementadas

### Motor y Núcleo
- **Framework:** Construido sobre Phaser 3.
- **Canvas Responsivo:** El lienzo del juego se ajusta y centra automáticamente al tamaño del dispositivo o ventana del navegador.
- **Servidor Local:** Configurado para pruebas fáciles y consistentes.

### Controles (Táctil y Ratón)
- **Esquema Unificado:** Los controles funcionan de la misma manera con un clic del ratón o un toque en la pantalla.
- **Selección:** Se puede seleccionar una unidad a la vez. La unidad seleccionada se resalta con un borde amarillo.
- **Comandos Contextuales:**
    - Con una unidad seleccionada, tocar/hacer clic en el suelo emite una orden de **movimiento**.
    - Con un Recolector seleccionado, tocar/hacer clic en un Nodo de Biomasa emite una orden de **recolección**.

### Economía y Construcción
- **Recurso Único:** El juego utiliza **Biomasa** como recurso principal, mostrado en la esquina superior izquierda.
- **Ciclo de Recolección Completo:**
    1.  La **Colmena (Hive)** (edificio principal) puede crear **Recolectores**.
    2.  Los Recolectores pueden ser enviados a los **Nodos de Biomasa** (círculos verdes).
    3.  La unidad recolecta por unos segundos (se vuelve azul para indicar que está llena).
    4.  Regresa de forma autónoma a la Colmena para depositar la Biomasa, incrementando el total del jugador.
    5.  La unidad se detiene en el borde de la Colmena para ser fácil de volver a seleccionar.
- **Árbol de Edificios Básico:**
    - Se puede construir la **Cámara de Cría (Brood Chamber)** usando un botón en la interfaz, la cual descuenta Biomasa.

### Unidades
- **Recolector (Harvester):** Unidad básica de recolección (cuadrado blanco).
- **Escarabajo Soldado (Soldier Beetle):** Unidad de combate básica (cuadrado rojo) que se puede crear desde la Cámara de Cría. Actualmente solo se puede mover.
