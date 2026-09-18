# REBIUN Data Explorer

**Aplicación pública:**  
https://mvarort.github.io/datos-rebiun/

Aplicación web estática para consultar y comparar datos estadísticos de la Red de Bibliotecas Universitarias y Científicas Españolas (REBIUN).

El selector permite combinar bibliotecas, características institucionales, años e indicadores y generar tablas comparativas a partir de los datos estadísticos REBIUN.

La aplicación está desarrollada exclusivamente con HTML, CSS y JavaScript y está preparada para su publicación mediante GitHub Pages.

## Datos disponibles

La versión actual integra información de las campañas 2020–2025.

| Año | Registros | Indicadores |
|---:|---:|---:|
| 2020 | 9.102 | 123 |
| 2021 | 9.490 | 130 |
| 2022 | 10.439 | 143 |
| 2023 | 12.168 | 156 |
| 2024 | 12.168 | 156 |
| 2025 | 12.558 | 161 |

En total, el fichero longitudinal contiene **65.925 registros**.

El directorio institucional incluye **78 bibliotecas o instituciones REBIUN**, identificadas mediante su código oficial REBIUN.

## Funcionalidades

### 1. Selección

La parte superior reúne los principales criterios generales de la consulta.

#### Bibliotecas

Las bibliotecas pueden filtrarse mediante:

- Comunidad autónoma.
- Modalidad.
- Titularidad.
- Buscador por nombre de biblioteca.
- Selección individual mediante casillas.

Los segmentadores institucionales se cruzan dinámicamente, de manera que solo se ofrecen combinaciones existentes en el directorio de bibliotecas.

#### Años

Los años se integran en la misma zona de selección general y aparecen del más reciente al más antiguo:

- 2025
- 2024
- 2023
- 2022
- 2021
- 2020

Pueden seleccionarse uno o varios años simultáneamente.

### 2. Indicadores

Los indicadores se organizan siguiendo la estructura REBIUN:

**Eje → Apartado → Indicador**

El selector permite:

- seleccionar un eje;
- seleccionar un apartado;
- buscar por código o denominación;
- marcar o desmarcar indicadores individualmente o en bloque.

La identidad longitudinal de cada indicador se establece mediante `Codigo_Tecnico`.

Cuando la numeración o denominación REBIUN de un indicador ha cambiado entre campañas, la interfaz muestra la correspondiente al **año más reciente de los seleccionados**.

Esto permite mantener una identidad estable del indicador sin presentar como actual una codificación histórica anterior.

### 3. Organización del resultado

Las dimensiones disponibles son:

- Biblioteca.
- Año.
- Indicador.

El usuario puede decidir qué dimensión aparece en filas y cuál en columnas.

La tercera dimensión se representa dentro de las celdas cuando existen varios registros para una misma combinación.

En tablas densas, cada dato se presenta en una línea diferenciada:

- etiqueta del indicador a la izquierda;
- valor alineado a la derecha;
- separación horizontal fina entre datos.

Esto facilita la comparación entre años, bibliotecas e indicadores.

## Exportación

La selección que haya generado una tabla válida puede descargarse en formato CSV.

El botón de descarga permanece deshabilitado mientras no exista una selección válida con registros.

## Estructura de los datos

### `data/rebiun_real.csv`

Fichero longitudinal de estadísticas.

Campos principales:

```text
Anio
Codigo_Biblioteca_REBIUN
Biblioteca
Eje
Nombre_Eje
Apartado
Nombre_Apartado
Codigo_REBIUN
Codigo_Tecnico
Indicador
Valor
```

La unidad básica del fichero es:

```text
Año + Biblioteca + Codigo_Tecnico
```

### `data/bibliotecas_rebiun.csv`

Directorio institucional utilizado por los segmentadores.

Campos:

```text
Codigo_Biblioteca_REBIUN
Biblioteca
Comunidad_Autonoma
Modalidad
Titularidad
```

`Codigo_Biblioteca_REBIUN` se utiliza como clave interna estable de las instituciones y se conserva como texto para mantener los ceros iniciales.

## Rendimiento

La aplicación funciona íntegramente en el navegador, sin servidor de aplicaciones ni base de datos.

Para manejar con agilidad más de 65.000 registros se han incorporado varias optimizaciones:

- uso de `Set` para comprobar selecciones;
- agrupación de las celdas mediante `Map`;
- caché de años, ejes y apartados;
- índice compacto de indicadores por año;
- eliminación de recorridos repetidos del conjunto completo de datos;
- generación de la tabla únicamente cuando el usuario la solicita.

Los cambios de eje, apartado y año trabajan sobre estructuras indexadas y no requieren recorrer reiteradamente todo el fichero estadístico.

## Interfaz

El diseño busca una presentación compacta y próxima a la identidad visual de REBIUN.

Se han incorporado:

- tipografía sans serif de sistema;
- uso discreto de tonos turquesa inspirados en la web de REBIUN;
- reducción del tamaño tipográfico y del espaciado vertical;
- encabezados compactos;
- años ordenados del más reciente al más antiguo;
- Bibliotecas y Años integrados en una única sección de selección;
- disposición responsive para pantallas de menor tamaño;
- tablas compactas preparadas para comparaciones con múltiples indicadores;
- separación visual de los distintos datos incluidos dentro de una misma celda.

## Arquitectura

La aplicación no utiliza frameworks ni dependencias de ejecución.

```text
selector-rebiun/
│
├── index.html
├── css/
│   └── estilos.css
├── js/
│   └── app.js
└── data/
    ├── rebiun_real.csv
    └── bibliotecas_rebiun.csv
```

Tecnologías utilizadas:

- HTML5
- CSS
- JavaScript
- CSV

Esta arquitectura permite publicar directamente el proyecto como sitio estático mediante GitHub Pages.

## Ejecución local

Desde la carpeta del proyecto:

```powershell
py -m http.server 8000
```

Después abrir:

```text
http://localhost:8000
```

Durante el desarrollo puede utilizarse `Ctrl + F5` para forzar la recarga de los archivos.

## Control de calidad

Durante el desarrollo se han realizado comprobaciones sobre:

- correspondencia entre códigos oficiales REBIUN y bibliotecas;
- conservación de ceros iniciales en los códigos institucionales;
- correspondencia entre `Codigo_REBIUN` y `Codigo_Tecnico`;
- cambios históricos de numeración de indicadores;
- integridad del grano Año + Biblioteca + Indicador;
- segmentadores institucionales cruzados;
- indicadores disponibles según campaña;
- generación de tablas con selecciones amplias;
- exportación únicamente de selecciones válidas.

Como caso de control se ha utilizado, entre otros:

```text
Universidad de Sevilla
Código REBIUN: 67
Año: 2025
Eje: 6. Servicios
Apartado: 6.2 Préstamos domiciliarios
```

## Estado del proyecto

Versión funcional preparada para publicación inicial.

Incluye actualmente:

- campañas 2020–2025;
- directorio institucional REBIUN;
- selección y comparación multidimensional;
- tratamiento longitudinal de indicadores;
- exportación CSV;
- optimización para funcionamiento completamente estático;
- interfaz responsive y compacta.
