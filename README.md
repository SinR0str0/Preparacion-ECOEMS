## Seguimiento de Actividades Diarias – Integración Moodle / HTML / Google Sheets

Este proyecto es un sistema web (HTML + JavaScript + CSS) pensado para integrarse con **Moodle** y permitir el **seguimiento de actividades diarias tipo cuestionario**, almacenando la información en una **base de datos gestionada en Google Sheets**.

### ¿Qué hace el sistema?

- **Registra respuestas de cuestionarios diarios** realizados por el alumnado.
- **Envía y guarda los datos** (usuario, fecha, respuestas, puntuaciones, etc.) en una **hoja de cálculo de Google Sheets**, que actúa como base de datos.
- **Muestra información al estudiante** en una interfaz HTML sencilla (progreso, logros, rachas, insignias, etc., según la parte del sistema que se use).
- Está pensado para **incrustarse en Moodle** como recurso/actividad (por ejemplo, mediante etiqueta HTML, recurso de página, o iframe).

### Flujo general de funcionamiento

1. El/la estudiante accede al recurso desde **Moodle** (página HTML del sistema).
2. La página muestra un **cuestionario o conjunto de actividades diarias**.
3. Al completar el cuestionario:
   - Se recopilan los datos en el navegador (JavaScript).
   - Se envía una petición a un **Google Apps Script** vinculado a una hoja de cálculo de **Google Sheets**.
4. Google Sheets:
   - **Registra** cada intento (fecha, usuario, resultados…).
   - Permite al docente consultar y exportar los datos para **seguimiento y evaluación**.
5. Opcionalmente, la interfaz puede:
   - Mostrar **progreso acumulado, rachas de días activos, insignias o logros**.
   - Dar **retroalimentación inmediata** al alumnado.

### Requisitos

- **Moodle** (cualquier versión que permita incrustar HTML personalizado).
- Una cuenta de **Google** con:
  - Una **hoja de cálculo en Google Sheets** configurada como base de datos.
  - Un **script de Google Apps Script** que reciba las peticiones y escriba filas en la hoja.
- Navegador web moderno (Chrome, Firefox, Edge, etc.).

### Integración con Moodle

- Subir los archivos HTML/CSS/JS del sistema al servidor (o usar un servicio de hosting estático).
- Incrustar la página en Moodle mediante:
  - Un recurso de tipo **Página**, **Etiqueta**, o **Archivo** con iframe.
  - O bien un **enlace** externo que abra la página del sistema.
- Opcional: pasar información del estudiante (nombre, id, curso) desde Moodle a la página mediante parámetros de URL o configuración adicional.

### Configuración de Google Sheets

1. Crear una **hoja de cálculo** con las columnas necesarias (por ejemplo: fecha, usuario, id de actividad, respuestas, nota…).
2. Crear un **Google Apps Script** asociado que:
   - Reciba las peticiones (normalmente vía HTTP/POST).
   - Valide los datos.
   - Inserte una nueva fila en la hoja.
3. Publicar el script como **aplicación web** y usar la URL en el código JavaScript del sistema para enviar los datos.

### Uso típico

- El docente:
  - Configura la hoja de cálculo y el Apps Script.
  - Ajusta las preguntas del cuestionario y los parámetros de la página HTML.
  - Incrusta el sistema en Moodle para su grupo.
- El alumnado:
  - Entra diariamente a la actividad en Moodle.
  - Responde el cuestionario.
  - Ve su progreso (puntuaciones, rachas, logros, etc.).
- El docente:
  - Consulta la hoja de cálculo en Google Sheets para ver el **historial de participación y rendimiento**.

### Personalización

- Las preguntas del cuestionario y la lógica de puntuación se pueden editar en los archivos `.js` y/o en el HTML.
- Los estilos visuales (colores, tipografías, distribución) se ajustan desde el archivo `styles.css`.
- La lógica de logros/rachas/insignias se puede adaptar en los scripts correspondientes.

---