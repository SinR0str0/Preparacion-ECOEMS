import csv

def procesar_archivo_txt_a_csv(ruta_entrada, ruta_salida):
    with open(ruta_entrada, 'r', encoding='utf-8') as f:
        lineas = [linea.rstrip('\n') for linea in f.readlines()]

    filas = []
    i = 0
    while i < len(lineas):
        if i + 5 >= len(lineas):
            print(f"Advertencia: bloque incompleto comenzando en línea {i + 1}. Se omite.")
            break

        pregunta = lineas[i]
        opciones_raw = [lineas[i + j] for j in range(1,5)]
        opciones = [opt[3:] if len(opt) >= 3 else '' for opt in opciones_raw]

        linea_respuesta = lineas[i + 5]
        if not linea_respuesta.startswith("ANSWER: "):
            raise ValueError(f"Línea de respuesta mal formada en línea {i + 5}: '{linea_respuesta}'")

        letra = linea_respuesta[8:].strip()
        if letra not in "ABCD":
            raise ValueError(f"Letra de respuesta inválida en línea {i + 5}: '{letra}'")

        idx_correcta = ord(letra) - ord('A')  # 0 a 3
        respuesta_correcta = opciones[idx_correcta]

        # Filtrar solo las incorrectas (todas excepto la correcta)
        opciones_incorrectas = [opciones[j] for j in range(4) if j != idx_correcta]

        # Asegurarnos de que siempre haya 3 (por si hay duplicados o errores, aunque no debería pasar)
        if len(opciones_incorrectas) != 3:
            raise RuntimeError(f"Error: se esperaban 3 opciones incorrectas, pero se obtuvieron {len(opciones_incorrectas)}")

        fila = [pregunta, respuesta_correcta] + opciones_incorrectas
        filas.append(fila)

        i += 6

    # Escribir CSV
    with open(ruta_salida, 'w', newline='', encoding='utf-8') as csvfile:
        escritor = csv.writer(csvfile)
        escritor.writerows(filas)

if __name__=="__main__":
    procesar_archivo_txt_a_csv('pg.txt', 'salida.csv')