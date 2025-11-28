# jcbata.github.io
# https://jcbata.github.io/

20/11/2024

## Avances Recientes (26/11/2025)

Se ha realizado una refactorización profunda del motor de Ajedrez (`03-Chess`) para mejorar el rendimiento, la modularidad y la precisión de las reglas.

-   **Nueva Arquitectura de IA:** Se separó la lógica del juego de la interfaz de usuario.
    -   Se creó una clase ligera `EstadoJuego` que maneja solo el estado y la lógica del juego, permitiendo que la IA realice cálculos de forma mucho más eficiente.
    -   La clase `Juego` ahora se encarga de la visualización y la interacción con el usuario.

-   **Mejora en Funciones de Evaluación:**
    -   Se implementaron funciones de evaluación "puras" que operan sobre el nuevo `EstadoJuego`.
    -   Se creó un "puente de compatibilidad" para poder seguir utilizando y comparando la función de evaluación `Buggy (Legado)`, que era la más efectiva.

-   **Implementación de Reglas de Finalización:**
    -   Se reintrodujo y corrigió la lógica para detectar empates por la **regla de los 50 movimientos** y por **triple repetición**.
    -   El motor de IA (Minimax) ahora reconoce estas condiciones de tablas y las tiene en cuenta en su estrategia.

-   **Mejoras de Interfaz y Corrección de Errores:**
    -   Se cambió el tema visual de la página a un diseño claro.
    -   Se corrigió un error que impedía que el tamaño de las piezas se actualizara al cambiar las dimensiones de la pantalla.
    -   Se solucionó el problema que no actualizaba la estrategia de la IA al cambiarla desde el menú desplegable.