# ajedrez
Un juego de ajedrez básico utilizando P5.js

Implementa la creación del tablero, las piezas, los movimientos permitidos, la captura, el jaque.

Aún pendiente  lo del jaque mate.

Es un ejercicio para descubrir las características del frameword P5.js, y que en el futuro utilizaré para  investigación en redes neuronales y aplicaciones de aprendizaje automático.

---

## Refactorización y Banco de Pruebas (Nov 2025)

El proyecto ha sido sometido a una importante refactorización para modernizar su arquitectura y facilitar la experimentación con la IA.

### Cambios Arquitectónicos
- **Modularización del Código:** El código monolítico se ha separado en módulos de JavaScript (ES6), incluyendo `principal.js`, `tablero.js`, `pieza.js` y un nuevo módulo `evaluacion.js`.
- **Biblioteca de Funciones de Evaluación:** Se ha creado el archivo `evaluacion.js` para albergar una colección de diferentes funciones de evaluación de la IA. Esto permite intercambiar y comparar "cerebros" de IA con facilidad.
- **Test Runner Automatizado:** Se ha implementado un sistema de pruebas automatizadas (`moveAuto`) que enfrenta a una IA contra otra. El sistema incluye un marcador en pantalla (Victorias/Derrotas/Tablas) y un registro de errores, permitiendo realizar pruebas A/B de forma robusta.

### Hallazgos sobre la Inteligencia Artificial

Se realizaron una serie de pruebas A/B para comparar diferentes lógicas de evaluación:

1.  **Función "Con Estado" vs. "Sin Estado":** Se enfrentó la función original (`con_estado_buggy`), que contenía una lógica de "valor en decadencia" (`valor = valor * 0.8 + ...`), contra una versión teóricamente "corregida" que era puramente "sin estado".
2.  **Resultado Sorprendente:** La versión original "con estado" demostró ser **abrumadoramente superior**.
3.  **Hipótesis:** La lógica de `valor * 0.8` no es un bug, sino una **característica emergente y potente**. Actúa como una forma de "memoria posicional" o "inercia", dando a la IA una mayor coherencia en sus planes a largo plazo al valorar más las piezas que han estado en buenas posiciones en turnos anteriores.

### Propuesta de Siguientes Pasos

Basado en estos hallazgos, el camino a seguir no es "corregir" la función ganadora, sino **iterar sobre ella**.

1.  **Mejora Iterativa:** Usar la función `con_estado_buggy` como base.
2.  **Experimentación con Heurísticas:** Añadir gradualmente nuevas heurísticas a esta base para ver si podemos mejorarla. El primer experimento (añadir un "bonus por control del centro") demostró no tener un impacto significativo, lo que indica que la lógica "con estado" es el factor dominante. Futuras heurísticas a probar podrían ser:
    - Seguridad del Rey.
    - Estructura de peones (peones doblados, aislados, pasados).
    - Actividad de las piezas (torres en columnas abiertas, etc.).
3.  **Validación Continua:** Utilizar el test runner para validar científicamente el impacto de cada nuevo cambio, asegurando que cualquier modificación realmente mejore el rendimiento de la IA.

---

### Implementación de Minimax y Mejoras de UI (Nov 2025)

Continuando con la experimentación, se han introducido mejoras significativas tanto en la capacidad de la IA como en las herramientas de visualización y depuración.

#### Optimización con Web Workers
- **Minimax Paralelo:** Se ha refactorizado el algoritmo Minimax para que se ejecute en paralelo utilizando Web Workers. La función `pensamientoMoverConMinimax` ahora actúa como un "gerente" que distribuye el cálculo de las ramas del árbol de movimientos entre múltiples hilos.
- **Rendimiento:** Esta arquitectura permite aprovechar las CPUs multinúcleo modernas, acelerando significativamente el tiempo de respuesta de la IA en búsquedas de mayor profundidad. Se ha añadido un medidor de tiempo en pantalla para monitorizar el rendimiento.

#### Visualización y Depuración
- **Doble Barra de Evaluación:** Se ha implementado una segunda barra de evaluación. Ahora la interfaz muestra dos barras paralelas que representan la "opinión" de la posición actual según cada una de las funciones de evaluación asignadas (a blancas y negras), permitiendo una comparación visual directa de sus heurísticas.
- **Acceso Global para Depuración:** Se ha expuesto el objeto principal `tablero` al ámbito global (`window`) para facilitar la inspección y depuración en tiempo real desde la consola del navegador.

#### Corrección de Bugs Críticos
- **Detección de Jaque Mate:** Se corrigió un error fundamental en la lógica de la IA que le impedía reconocer un jaque mate. El problema radicaba en que el generador de movimientos no validaba si una jugada dejaba al propio rey en jaque, lo que hacía que la IA eligiera movimientos ilegales en situaciones de mate. La nueva implementación filtra estos movimientos y ahora detecta correctamente el final de la partida.
- **Robustez del Test Runner:** Se solucionaron varios errores de `TypeError` que detenían las pruebas automáticas. Estos fallos se debían a desincronizaciones entre la matriz del tablero y la lista de objetos de piezas durante la simulación. Se han añadido salvaguardas para hacer el sistema más robusto.

