let datos = [];
let metadatosBibliotecas = [];
let mapaBibliotecas = new Map();
let datosActuales = [];
let estadoSeleccionIndicadores = new Map();
let estadoFiltroIndicadores = "vigentes";
let indiceUsuariosPropios = new Map();
let gruposTamanoBibliotecas = new Map();


const ejeSelect =
    document.getElementById("eje");

const apartadoSelect =
    document.getElementById("apartado");

const comunidadSelect =
    document.getElementById("comunidad");

const modalidadSelect =
    document.getElementById("modalidad");

const titularidadSelect =
    document.getElementById("titularidad");

const segmentadorTamano =
    document.getElementById("segmentador-tamano");

const buscarBiblioteca =
    document.getElementById("buscar-biblioteca");

const buscarIndicador =
    document.getElementById("buscar-indicador");

const botonGenerar =
    document.getElementById("generar");

const botonDescargar =
    document.getElementById("descargar");

const resumenElemento =
    document.getElementById("resumen");

const fechaActualizacionElemento =
    document.getElementById("fecha-actualizacion");

// La aplicación no publica una fecha de datos: usamos la del documento.
const fechaDocumento = new Date(document.lastModified);
const fechaActualizacion = Number.isNaN(fechaDocumento.getTime())
    ? new Date()
    : fechaDocumento;
fechaActualizacionElemento.textContent =
    new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(fechaActualizacion);
fechaActualizacionElemento.dateTime = fechaActualizacion.toISOString();

const tablaElemento =
    document.getElementById("tabla");

const selectorVistas =
    document.getElementById("selector-vistas");

const evolucionElemento =
    document.getElementById("evolucion");

const comparacionElemento =
    document.getElementById("comparacion");

const indicadorEvolucionSelect =
    document.getElementById("indicador-evolucion");

const indicadorComparacionSelect =
    document.getElementById("indicador-comparacion");

const ordenComparacionSelect =
    document.getElementById("orden-comparacion");

const orientacionComparacionSelect =
    document.getElementById("orientacion-comparacion");

const botonesModoComparacion = [
    ...document.querySelectorAll("[data-modo-comparacion]")
];

let modoComparacion = "absoluto";

const mostrarPromedioEvolucion =
    document.getElementById("mostrar-promedio-evolucion");

const aniosComparacionElemento =
    document.getElementById("anios-comparacion");

const graficoEvolucionElemento =
    document.getElementById("grafico-evolucion");

const graficoComparacionElemento =
    document.getElementById("grafico-comparacion");

const vistaImpresionGrafico =
    document.getElementById("vista-impresion-grafico");

let anioComparacionActivo = "";


tablaElemento.innerHTML =
    '<div class="mensaje">Cargando datos…</div>';

botonGenerar.disabled = true;
botonDescargar.disabled = true;


Promise.all([

    fetch("data/rebiun_real.csv")
        .then(r => {

            if (!r.ok) {
                throw new Error("No se pudo cargar rebiun.csv");
            }

            return r.text();
        }),

    fetch("data/bibliotecas_rebiun.csv")
        .then(r => {

            if (!r.ok) {
                throw new Error("No se pudo cargar bibliotecas.csv");
            }

            return r.text();
        })

])

.then(([textoDatos, textoBibliotecas]) => {

    datos =
        convertirCSV(textoDatos);


    metadatosBibliotecas =
        convertirCSV(textoBibliotecas);


    metadatosBibliotecas.forEach(b => {

        mapaBibliotecas.set(
            b.Codigo_Biblioteca_REBIUN,
            b
        );
    });


    datos.forEach(fila => {

        fila.Biblioteca =
            etiquetaBiblioteca(
                fila.Biblioteca,
                fila.Codigo_Biblioteca_REBIUN
            );

        fila.IndicadorEtiqueta =
            `${fila.Codigo_REBIUN} ${fila.Indicador}`;
    });


    cargarFiltros();

    tablaElemento.innerHTML =
        '<div class="mensaje">Seleccione los datos y pulse «Generar tabla».</div>';

    botonGenerar.disabled = false;
    botonDescargar.disabled = true;
})

.catch(error => {

    tablaElemento.innerHTML =
        `<div class="mensaje">${error.message}</div>`;

    botonGenerar.disabled = true;
    botonDescargar.disabled = true;
});



/* =========================================================
   CSV
   ========================================================= */


function convertirCSV(texto) {

    const lineas =
        texto.trim().split(/\r?\n/);


    const cabeceras =
        lineas[0]
            .split(";")
            .map(c => c.trim());


    cabeceras[0] =
        cabeceras[0]
            .replace(/^\uFEFF/, "");


    return lineas
        .slice(1)
        .map(linea => {

            const valores =
                linea.split(";");


            const fila = {};


            cabeceras.forEach(
                (cabecera, i) => {

                    fila[cabecera] =
                        valores[i] !== undefined
                            ? valores[i].trim()
                            : "";
                }
            );


            return fila;
        });
}



/* =========================================================
   UTILIDADES
   ========================================================= */


function etiquetaBiblioteca(nombre, codigo) {

    if (!codigo) {
        return nombre;
    }

    return `[${codigo}] ${nombre}`;
}


function normalizarBusqueda(texto) {

    return String(texto)

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .toLowerCase();
}



// CACHE_METADATOS_DATOS
//
// Años, ejes y apartados se calculan una sola vez
// después de cargar los datos.

let metadatosDatos = null;


function construirMetadatosDatos() {

    if (metadatosDatos) {
        return;
    }


    const anios =
        new Set();


    const ejesPorCodigo =
        new Map();


    const apartadosPorCodigo =
        new Map();


    const indicadoresPorAnio =
        new Map();


    const todosLosCodigos =
        new Set();


    datos.forEach(d => {

        if (d.Anio) {

            anios.add(
                d.Anio
            );
        }


        const anio =
            Number(d.Anio) ||
            -Infinity;


        if (
            d.Anio &&
            d.Codigo_Tecnico
        ) {

            todosLosCodigos.add(
                d.Codigo_Tecnico
            );


            let indicadoresAnio =
                indicadoresPorAnio.get(
                    d.Anio
                );


            if (!indicadoresAnio) {

                indicadoresAnio =
                    new Map();


                indicadoresPorAnio.set(
                    d.Anio,
                    indicadoresAnio
                );
            }


            if (
                !indicadoresAnio.has(
                    d.Codigo_Tecnico
                )
            ) {

                indicadoresAnio.set(
                    d.Codigo_Tecnico,
                    {
                        Anio:
                            d.Anio,

                        Eje:
                            d.Eje,

                        Nombre_Eje:
                            d.Nombre_Eje,

                        Apartado:
                            d.Apartado,

                        Nombre_Apartado:
                            d.Nombre_Apartado,

                        Codigo_REBIUN:
                            d.Codigo_REBIUN,

                        Codigo_Tecnico:
                            d.Codigo_Tecnico,

                        Indicador:
                            d.Indicador
                    }
                );
            }
        }


        if (d.Eje) {

            const existente =
                ejesPorCodigo.get(
                    d.Eje
                );


            if (
                !existente ||
                anio >= existente.anio
            ) {

                ejesPorCodigo.set(
                    d.Eje,
                    {
                        codigo:
                            d.Eje,

                        nombre:
                            d.Nombre_Eje,

                        anio
                    }
                );
            }
        }


        if (d.Apartado) {

            const existente =
                apartadosPorCodigo.get(
                    d.Apartado
                );


            if (
                !existente ||
                anio >= existente.anio
            ) {

                apartadosPorCodigo.set(
                    d.Apartado,
                    {
                        codigo:
                            d.Apartado,

                        nombre:
                            d.Nombre_Apartado,

                        eje:
                            d.Eje,

                        anio
                    }
                );
            }
        }
    });


    const aniosOrdenados =
        [...anios].sort(
            (a, b) =>
                b.localeCompare(
                    a,
                    "es",
                    { numeric: true }
                )
        );


    const ultimoAnio =
        aniosOrdenados[0] || "";


    const indicadoresUltimoAnio =
        indicadoresPorAnio.get(
            ultimoAnio
        );


    const codigosVigentes =
        new Set(
            indicadoresUltimoAnio
                ? [...indicadoresUltimoAnio.keys()]
                : []
        );


    const codigosHistoricos =
        new Set(
            [...todosLosCodigos]
                .filter(
                    codigo =>
                        !codigosVigentes.has(
                            codigo
                        )
                )
        );


    const ordenarCodigo =
        (a, b) =>
            a.codigo.localeCompare(
                b.codigo,
                "es",
                { numeric: true }
            );


    const ejes =
        [
            ...ejesPorCodigo.values()
        ].sort(
            ordenarCodigo
        );


    const apartados =
        [
            ...apartadosPorCodigo.values()
        ].sort(
            ordenarCodigo
        );


    const apartadosPorEje =
        new Map();


    apartados.forEach(
        apartado => {

            if (
                !apartadosPorEje.has(
                    apartado.eje
                )
            ) {

                apartadosPorEje.set(
                    apartado.eje,
                    []
                );
            }


            apartadosPorEje
                .get(
                    apartado.eje
                )
                .push(
                    apartado
                );
        }
    );


    metadatosDatos = {

        anios:
            aniosOrdenados,

        ultimoAnio,

        codigosVigentes,

        codigosHistoricos,

        ejes,

        ejesPorCodigo,

        apartados,

        apartadosPorEje,

        indicadoresPorAnio
    };
}


function valoresUnicos(
    campo,
    fuente = datos
) {

    return [
        ...new Set(
            fuente.map(
                fila => fila[campo]
            )
        )
    ]

    .filter(valor => valor !== "")

    .sort(
        (a, b) =>
            a.localeCompare(
                b,
                "es",
                { numeric: true }
            )
    );
}



/* =========================================================
   FILTROS
   ========================================================= */


function cargarFiltros() {

    construirMetadatosDatos();

    cargarBibliotecas();

    cargarAnios();

    construirIndiceUsuariosPropios();

    recalcularGruposTamano();

    actualizarSegmentadoresInstitucionales();

    cargarEjes();

    cargarApartados();

    cargarIndicadores();

    actualizarContadores();
}



/* =========================================================
   COMUNIDADES AUTÓNOMAS
   ========================================================= */


function cargarModalidades() {

    const modalidades = [
        ...new Set(
            metadatosBibliotecas
                .map(b => b.Modalidad)
                .filter(valor => valor)
        )
    ]
    .sort((a, b) =>
        a.localeCompare(
            b,
            "es"
        )
    );

    modalidadSelect.innerHTML =
        '<option value="">Todas</option>';

    modalidades.forEach(modalidad => {

        const opcion =
            document.createElement("option");

        opcion.value =
            modalidad;

        opcion.textContent =
            modalidad;

        modalidadSelect.appendChild(opcion);
    });
}


function cargarTitularidades() {

    const titularidades = [
        ...new Set(
            metadatosBibliotecas
                .map(b => b.Titularidad)
                .filter(valor => valor)
        )
    ]
    .sort((a, b) =>
        a.localeCompare(
            b,
            "es"
        )
    );

    titularidadSelect.innerHTML =
        '<option value="">Todas</option>';

    titularidades.forEach(titularidad => {

        const opcion =
            document.createElement("option");

        opcion.value =
            titularidad;

        opcion.textContent =
            titularidad;

        titularidadSelect.appendChild(opcion);
    });
}

function cargarComunidades() {

    const comunidades =
        [
            ...new Set(
                metadatosBibliotecas
                    .map(
                        b => b.Comunidad_Autonoma
                    )
                    .filter(
                        valor => valor !== ""
                    )
            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "es"
                )
        );


    comunidadSelect.innerHTML =
        '<option value="">Todas</option>';


    comunidades.forEach(
        comunidad => {

            const opcion =
                document.createElement(
                    "option"
                );


            opcion.value =
                comunidad;


            opcion.textContent =
                comunidad;


            comunidadSelect.appendChild(
                opcion
            );
        }
    );
}



/* =========================================================
   BIBLIOTECAS
   ========================================================= */


/* =========================================================
   SEGMENTADORES INSTITUCIONALES CRUZADOS
   ========================================================= */


function obtenerTamanoSeleccionado() {

    const seleccionado =
        segmentadorTamano.querySelector(
            'input[name="tamanoUsuarios"]:checked'
        );

    return seleccionado
        ? seleccionado.value
        : "todas";
}


function bibliotecaCumpleFiltrosInstitucionales(
    biblioteca,
    filtros,
    campoOmitido = null
) {

    const codigo =
        biblioteca.Codigo_Biblioteca_REBIUN;

    return (
        (
            campoOmitido === "comunidad" ||
            !filtros.comunidad ||
            biblioteca.Comunidad_Autonoma === filtros.comunidad
        ) &&
        (
            campoOmitido === "modalidad" ||
            !filtros.modalidad ||
            biblioteca.Modalidad === filtros.modalidad
        ) &&
        (
            campoOmitido === "titularidad" ||
            !filtros.titularidad ||
            biblioteca.Titularidad === filtros.titularidad
        ) &&
        (
            campoOmitido === "tamano" ||
            !filtros.tamano ||
            filtros.tamano === "todas" ||
            gruposTamanoBibliotecas.get(codigo) === filtros.tamano
        )
    );
}


function hayBibliotecasCompatibles(filtros) {

    return metadatosBibliotecas.some(
        biblioteca =>
            bibliotecaCumpleFiltrosInstitucionales(
                biblioteca,
                filtros
            )
    );
}


function obtenerOpcionesInstitucionales(
    campoObjetivo,
    seleccion
) {

    const valores =
        metadatosBibliotecas

            .filter(
                b =>
                    bibliotecaCumpleFiltrosInstitucionales(
                        b,
                        seleccion,
                        {
                            Comunidad_Autonoma: "comunidad",
                            Modalidad: "modalidad",
                            Titularidad: "titularidad"
                        }[campoObjetivo]
                    )
            )

            .map(b => b[campoObjetivo])

            .filter(valor => valor);


    return [
        ...new Set(valores)
    ]
    .sort(
        (a, b) =>
            a.localeCompare(
                b,
                "es",
                { numeric: true }
            )
    );
}


function rellenarSegmentador(
    select,
    opciones,
    valorSeleccionado
) {

    select.innerHTML =
        '<option value="">Todas</option>';


    opciones.forEach(valor => {

        const opcion =
            document.createElement("option");

        opcion.value =
            valor;

        opcion.textContent =
            valor;

        select.appendChild(opcion);
    });


    if (
        valorSeleccionado &&
        opciones.includes(valorSeleccionado)
    ) {

        select.value =
            valorSeleccionado;

    } else {

        select.value = "";
    }
}


function actualizarSegmentadoresInstitucionales(
    origen = null
) {

    const actuales = {

        comunidad:
            comunidadSelect.value,

        modalidad:
            modalidadSelect.value,

        titularidad:
            titularidadSelect.value,

        tamano:
            obtenerTamanoSeleccionado()
    };


    /*
       El filtro que acaba de cambiar tiene prioridad.

       Para las selecciones anteriores conservamos, en este orden:
       1. Comunidad autónoma
       2. Modalidad
       3. Titularidad

       Solo se conserva una selección si existe al menos una
       biblioteca que cumpla la combinación resultante.
    */

    const seleccion = {

        comunidad: "",
        modalidad: "",
        titularidad: "",
        tamano: "todas"
    };


    if (
        origen &&
        actuales[origen]
    ) {

        seleccion[origen] =
            actuales[origen];
    }


    const prioridad = [
        "comunidad",
        "modalidad",
        "titularidad",
        "tamano"
    ];


    prioridad.forEach(clave => {

        if (
            clave === origen ||
            !actuales[clave]
        ) {
            return;
        }


        const prueba = {
            ...seleccion,
            [clave]: actuales[clave]
        };


        if (
            hayBibliotecasCompatibles(
                prueba
            )
        ) {

            seleccion[clave] =
                actuales[clave];
        }
    });


    /*
       Si se ha elegido "Todas" en el filtro modificado,
       simplemente conservamos las demás selecciones compatibles.
    */

    const comunidades =
        obtenerOpcionesInstitucionales(
            "Comunidad_Autonoma",
            seleccion
        );


    const modalidades =
        obtenerOpcionesInstitucionales(
            "Modalidad",
            seleccion
        );


    const titularidades =
        obtenerOpcionesInstitucionales(
            "Titularidad",
            seleccion
        );


    rellenarSegmentador(
        comunidadSelect,
        comunidades,
        seleccion.comunidad
    );


    rellenarSegmentador(
        modalidadSelect,
        modalidades,
        seleccion.modalidad
    );


    rellenarSegmentador(
        titularidadSelect,
        titularidades,
        seleccion.titularidad
    );


    segmentadorTamano
        .querySelectorAll(
            'input[name="tamanoUsuarios"]'
        )
        .forEach(input => {

            const esTodas =
                input.value === "todas";

            const prueba = {
                ...seleccion,
                tamano: input.value
            };

            input.disabled =
                !esTodas &&
                !hayBibliotecasCompatibles(prueba);

            input.checked =
                input.value === seleccion.tamano;
        });


    aplicarFiltrosBibliotecas();

    actualizarContadores();
}


function cargarBibliotecas() {

    const contenedor =
        document.getElementById("lista-bibliotecas");

    contenedor.innerHTML = "";

    const bibliotecasOrdenadas =
        [...metadatosBibliotecas]
            .sort(
                (a, b) =>
                    a.Codigo_Biblioteca_REBIUN.localeCompare(
                        b.Codigo_Biblioteca_REBIUN,
                        "es",
                        { numeric: true }
                    )
            );


    bibliotecasOrdenadas.forEach(meta => {

        const label =
            document.createElement("label");

        label.className =
            "opcion-check";

        label.dataset.busqueda =
            normalizarBusqueda(
                `${meta.Codigo_Biblioteca_REBIUN} ${meta.Biblioteca} ${meta.Siglas || ""}`
            );

        label.dataset.comunidad =
            meta.Comunidad_Autonoma || "";

        label.dataset.modalidad =
            meta.Modalidad || "";

        label.dataset.titularidad =
            meta.Titularidad || "";

        const input =
            document.createElement("input");

        input.type =
            "checkbox";

        input.name =
            "bibliotecaCheck";

        // La clave interna es el código oficial REBIUN.
        input.value =
            meta.Codigo_Biblioteca_REBIUN;

        input.checked =
            true;

        const span =
            document.createElement("span");

        span.className = "texto-biblioteca";
        const codigo = document.createElement("span");
        codigo.className = "codigo-biblioteca";
        codigo.textContent = `[${meta.Codigo_Biblioteca_REBIUN}]`;
        const nombre = document.createElement("span");
        nombre.textContent = meta.Biblioteca;
        span.append(codigo, " ", nombre);
        if (meta.Siglas) {
            const sigla = document.createElement("span");
            sigla.className = "sigla-biblioteca";
            sigla.textContent = ` · ${meta.Siglas}`;
            span.appendChild(sigla);
        }

        label.appendChild(input);
        label.appendChild(span);

        contenedor.appendChild(label);
    });
}


function bibliotecaCumpleSegmentadores(bibliotecaId) {

    const meta =
        mapaBibliotecas.get(bibliotecaId) || {};

    const comunidad =
        comunidadSelect.value;

    const modalidad =
        modalidadSelect.value;

    const titularidad =
        titularidadSelect.value;

    const tamano =
        obtenerTamanoSeleccionado();

    if (
        comunidad &&
        meta.Comunidad_Autonoma !== comunidad
    ) {
        return false;
    }

    if (
        modalidad &&
        meta.Modalidad !== modalidad
    ) {
        return false;
    }

    if (
        titularidad &&
        meta.Titularidad !== titularidad
    ) {
        return false;
    }

    if (
        tamano !== "todas" &&
        gruposTamanoBibliotecas.get(bibliotecaId) !== tamano
    ) {
        return false;
    }

    return true;
}


function aplicarFiltrosBibliotecas() {

    const termino =
        normalizarBusqueda(
            buscarBiblioteca.value
        );

    const comunidad =
        comunidadSelect.value;

    const modalidad =
        modalidadSelect.value;

    const titularidad =
        titularidadSelect.value;

    const tamano =
        obtenerTamanoSeleccionado();

    document
        .querySelectorAll(
            "#lista-bibliotecas .opcion-check"
        )
        .forEach(label => {

            const coincideNombre =
                label.dataset.busqueda
                    .includes(termino);

            const coincideComunidad =
                !comunidad ||
                label.dataset.comunidad === comunidad;

            const coincideModalidad =
                !modalidad ||
                label.dataset.modalidad === modalidad;

            const coincideTitularidad =
                !titularidad ||
                label.dataset.titularidad === titularidad;

            const coincideTamano =
                tamano === "todas" ||
                gruposTamanoBibliotecas.get(
                    label.querySelector(
                        'input[name="bibliotecaCheck"]'
                    ).value
                ) === tamano;

            label.style.display =
                (
                    coincideNombre &&
                    coincideComunidad &&
                    coincideModalidad &&
                    coincideTitularidad &&
                    coincideTamano
                )
                    ? "flex"
                    : "none";
        });

    actualizarContadores();
}

/* =========================================================
   EJES
   ========================================================= */


function codigoCumpleEstadoIndicador(
    codigo
) {

    if (
        estadoFiltroIndicadores ===
        "todos"
    ) {

        return true;
    }


    if (
        estadoFiltroIndicadores ===
        "historicos"
    ) {

        return metadatosDatos
            .codigosHistoricos
            .has(
                codigo
            );
    }


    return metadatosDatos
        .codigosVigentes
        .has(
            codigo
        );
}



function obtenerFuenteIndicadoresEstado() {

    const aniosSeleccionados =
        obtenerSeleccionados(
            "anioCheck"
        );


    const aniosFuente =
        aniosSeleccionados.length > 0
            ? aniosSeleccionados
            : metadatosDatos.anios;


    const fuente =
        [];


    aniosFuente.forEach(
        anio => {

            const mapa =
                metadatosDatos
                    .indicadoresPorAnio
                    .get(
                        anio
                    );


            if (!mapa) {
                return;
            }


            mapa.forEach(
                indicador => {

                    if (
                        codigoCumpleEstadoIndicador(
                            indicador.Codigo_Tecnico
                        )
                    ) {

                        fuente.push(
                            indicador
                        );
                    }
                }
            );
        }
    );


    return fuente;
}



const cacheNombresTaxonomia =
    new Map();


function obtenerNombreTaxonomia(
    campoCodigo,
    campoNombre,
    codigo
) {

    const aniosSeleccionados =
        obtenerSeleccionados(
            "anioCheck"
        );


    const claveCache =
        `${campoCodigo}|${campoNombre}|${codigo}|` +
        [...aniosSeleccionados]
            .sort()
            .join(",");


    if (
        cacheNombresTaxonomia.has(
            claveCache
        )
    ) {

        return cacheNombresTaxonomia.get(
            claveCache
        );
    }


    const conjuntoAnios =
        aniosSeleccionados.length > 0
            ? new Set(
                aniosSeleccionados
            )
            : null;


    let mejorSeleccionado =
        null;


    let mejorHistorico =
        null;


    datos.forEach(d => {

        if (
            d[campoCodigo] !==
            codigo
        ) {

            return;
        }


        const nombre =
            String(
                d[campoNombre] || ""
            ).trim();


        if (!nombre) {

            return;
        }


        const anio =
            Number(
                d.Anio
            ) ||
            -Infinity;


        if (
            !mejorHistorico ||
            anio >
            mejorHistorico.anio
        ) {

            mejorHistorico = {
                nombre,
                anio
            };
        }


        if (
            conjuntoAnios &&
            conjuntoAnios.has(
                d.Anio
            ) &&
            (
                !mejorSeleccionado ||
                anio >
                mejorSeleccionado.anio
            )
        ) {

            mejorSeleccionado = {
                nombre,
                anio
            };
        }
    });


    const resultado =
        mejorSeleccionado
            ? mejorSeleccionado.nombre
            : (
                mejorHistorico
                    ? mejorHistorico.nombre
                    : ""
            );


    cacheNombresTaxonomia.set(
        claveCache,
        resultado
    );


    return resultado;
}



function cargarEjes() {

    const valorAnterior =
        ejeSelect.value;


    const fuente =
        obtenerFuenteIndicadoresEstado();


    const mapa =
        new Map();


    fuente.forEach(
        d => {

            if (!d.Eje) {
                return;
            }


            const existente =
                mapa.get(
                    d.Eje
                );


            const anioActual =
                Number(d.Anio) ||
                -Infinity;


            const anioExistente =
                existente
                    ? existente.anio
                    : -Infinity;


            if (
                !existente ||
                anioActual >
                anioExistente
            ) {

                mapa.set(
                    d.Eje,
                    {
                        codigo:
                            d.Eje,

                        nombre:
                            obtenerNombreTaxonomia(
                                "Eje",
                                "Nombre_Eje",
                                d.Eje
                            ),

                        anio:
                            anioActual
                    }
                );
            }
        }
    );


    ejeSelect.innerHTML =
        '<option value="">Todos los ejes</option>';


    [...mapa.values()]

        .sort(
            (a, b) =>
                a.codigo.localeCompare(
                    b.codigo,
                    "es",
                    { numeric: true }
                )
        )

        .forEach(
            eje => {

                const opcion =
                    document.createElement(
                        "option"
                    );


                opcion.value =
                    eje.codigo;


                opcion.textContent =
                    `${eje.codigo}. ${eje.nombre}`;


                ejeSelect.appendChild(
                    opcion
                );
            }
        );


    ejeSelect.value =
        valorAnterior &&
        mapa.has(
            valorAnterior
        )

            ? valorAnterior
            : "";
}



/* =========================================================
   APARTADOS
   ========================================================= */


function cargarApartados() {

    const valorAnterior =
        apartadoSelect.value;


    let fuente =
        obtenerFuenteIndicadoresEstado();


    if (ejeSelect.value) {

        fuente =
            fuente.filter(
                d =>
                    d.Eje ===
                    ejeSelect.value
            );
    }


    const mapa =
        new Map();


    fuente.forEach(
        d => {

            if (!d.Apartado) {
                return;
            }


            const existente =
                mapa.get(
                    d.Apartado
                );


            const anioActual =
                Number(d.Anio) ||
                -Infinity;


            const anioExistente =
                existente
                    ? existente.anio
                    : -Infinity;


            if (
                !existente ||
                anioActual >
                anioExistente
            ) {

                mapa.set(
                    d.Apartado,
                    {
                        codigo:
                            d.Apartado,

                        nombre:
                            obtenerNombreTaxonomia(
                                "Apartado",
                                "Nombre_Apartado",
                                d.Apartado
                            ),

                        anio:
                            anioActual
                    }
                );
            }
        }
    );


    apartadoSelect.innerHTML =
        '<option value="">Todos los apartados</option>';


    [...mapa.values()]

        .sort(
            (a, b) =>
                a.codigo.localeCompare(
                    b.codigo,
                    "es",
                    { numeric: true }
                )
        )

        .forEach(
            apartado => {

                const opcion =
                    document.createElement(
                        "option"
                    );


                opcion.value =
                    apartado.codigo;


                opcion.textContent =
                    `${apartado.codigo} ${apartado.nombre}`;


                apartadoSelect.appendChild(
                    opcion
                );
            }
        );


    apartadoSelect.value =
        valorAnterior &&
        mapa.has(
            valorAnterior
        )

            ? valorAnterior
            : "";
}



/* =========================================================
   INDICADORES
   ========================================================= */


function cargarIndicadores() {

    document
        .querySelectorAll(
            '#lista-indicadores input[name="indicadorCheck"]'
        )
        .forEach(
            input => {

                estadoSeleccionIndicadores.set(
                    input.value,
                    input.checked
                );
            }
        );


    let fuente =
        obtenerFuenteIndicadoresEstado();


    if (ejeSelect.value) {

        fuente =
            fuente.filter(
                d =>
                    d.Eje ===
                    ejeSelect.value
            );
    }


    if (apartadoSelect.value) {

        fuente =
            fuente.filter(
                d =>
                    d.Apartado ===
                    apartadoSelect.value
            );
    }


    const mapa =
        new Map();


    fuente.forEach(
        d => {

            const existente =
                mapa.get(
                    d.Codigo_Tecnico
                );


            const anioActual =
                Number(
                    d.Anio
                );


            const anioExistente =
                existente
                    ? Number(
                        existente.anio
                    )
                    : -Infinity;


            if (
                !existente ||
                anioActual >
                anioExistente
            ) {

                mapa.set(
                    d.Codigo_Tecnico,
                    {
                        codigo:
                            d.Codigo_REBIUN,

                        tecnico:
                            d.Codigo_Tecnico,

                        anio:
                            d.Anio,

                        texto:
                            `${d.Codigo_REBIUN} ${d.Indicador}`
                    }
                );
            }
        }
    );


    const contenedor =
        document.getElementById(
            "lista-indicadores"
        );


    contenedor.innerHTML =
        "";


    [...mapa.values()]

        .sort(
            (a, b) =>
                a.codigo.localeCompare(
                    b.codigo,
                    "es",
                    { numeric: true }
                )
        )

        .forEach(
            indicador => {

                const label =
                    document.createElement(
                        "label"
                    );


                label.className =
                    "opcion-check";


                label.dataset.busqueda =
                    normalizarBusqueda(
                        `${indicador.codigo} ${indicador.tecnico} ${indicador.texto}`
                    );


                const input =
                    document.createElement(
                        "input"
                    );


                input.type =
                    "checkbox";


                input.name =
                    "indicadorCheck";


                input.value =
                    indicador.tecnico;


                input.checked =
                    estadoSeleccionIndicadores.has(
                        indicador.tecnico
                    )

                        ? estadoSeleccionIndicadores.get(
                            indicador.tecnico
                        )

                        : true;


                const span =
                    document.createElement(
                        "span"
                    );


                span.textContent =
                    indicador.texto;


                label.appendChild(
                    input
                );


                label.appendChild(
                    span
                );


                contenedor.appendChild(
                    label
                );
            }
        );


    aplicarBusquedaIndicadores();

    actualizarContadores();
}



function actualizarTaxonomiaIndicadores() {

    cargarEjes();

    cargarApartados();

    cargarIndicadores();
}



function aplicarBusquedaIndicadores() {

    const termino =
        normalizarBusqueda(
            buscarIndicador.value
        );


    document
        .querySelectorAll(
            "#lista-indicadores .opcion-check"
        )
        .forEach(label => {

            label.style.display =
                label.dataset.busqueda
                    .includes(termino)

                ? "flex"
                : "none";
        });
}



/* =========================================================
   AÑOS
   ========================================================= */


function cargarAnios() {

    const contenedor =
        document.getElementById(
            "lista-anios"
        );


    contenedor.innerHTML = "";


    metadatosDatos.anios
        .forEach(anio => {

            const label =
                document.createElement(
                    "label"
                );


            label.className =
                "opcion-check";


            const input =
                document.createElement(
                    "input"
                );


            input.type =
                "checkbox";


            input.name =
                "anioCheck";


            input.value =
                anio;


            input.checked =
                true;


            const span =
                document.createElement(
                    "span"
                );


            span.textContent =
                anio;


            label.appendChild(input);

            label.appendChild(span);

            contenedor.appendChild(label);
        });
}


function construirIndiceUsuariosPropios() {

    indiceUsuariosPropios = new Map();

    datos.forEach(fila => {

        if (fila.Codigo_Tecnico !== "NUSUARIOPROP") {
            return;
        }

        const textoValor =
            String(fila.Valor).trim();

        if (textoValor === "") {
            return;
        }

        const valor =
            Number(
                textoValor.replace(",", ".")
            );

        if (!Number.isFinite(valor)) {
            return;
        }

        const codigo =
            fila.Codigo_Biblioteca_REBIUN;

        if (!indiceUsuariosPropios.has(codigo)) {
            indiceUsuariosPropios.set(
                codigo,
                new Map()
            );
        }

        indiceUsuariosPropios
            .get(codigo)
            .set(fila.Anio, valor);
    });
}


function clasificarMedianaUsuarios(mediana) {

    if (mediana <= 20000) {
        return "grupo1";
    }

    if (mediana <= 40000) {
        return "grupo2";
    }

    return "grupo3";
}


function recalcularGruposTamano() {

    const anios =
        obtenerSeleccionados("anioCheck");

    gruposTamanoBibliotecas = new Map();

    metadatosBibliotecas.forEach(biblioteca => {

        const valoresPorAnio =
            indiceUsuariosPropios.get(
                biblioteca.Codigo_Biblioteca_REBIUN
            );

        const valores =
            anios
                .map(anio =>
                    valoresPorAnio
                        ? valoresPorAnio.get(anio)
                        : undefined
                )
                .filter(Number.isFinite);

        const grupo =
            valores.length === 0
                ? "sin-dato"
                : (() => {

                    valores.sort(
                        (a, b) => a - b
                    );

                    const centro =
                        Math.floor(
                            valores.length / 2
                        );

                    const mediana =
                        valores.length % 2 === 1
                            ? valores[centro]
                            : (
                                valores[centro - 1] +
                                valores[centro]
                            ) / 2;

                    return clasificarMedianaUsuarios(
                        mediana
                    );
                })();

        gruposTamanoBibliotecas.set(
            biblioteca.Codigo_Biblioteca_REBIUN,
            grupo
        );
    });
}



/* =========================================================
   SELECCIÓN
   ========================================================= */


function obtenerSeleccionados(
    nombreGrupo
) {

    return [
        ...document.querySelectorAll(
            `input[name="${nombreGrupo}"]:checked`
        )
    ].map(
        input => input.value
    );
}



function invalidarDatosActuales() {

    datosActuales = [];

    botonDescargar.disabled = true;

    selectorVistas.hidden = true;

    tablaElemento.hidden = true;

    evolucionElemento.hidden = true;

    comparacionElemento.hidden = true;

    graficoEvolucionElemento.innerHTML = "";

    graficoComparacionElemento.innerHTML = "";

    resumenElemento.textContent = "";
}



function marcarGrupo(
    nombreGrupo,
    estado
) {

    document
        .querySelectorAll(
            `input[name="${nombreGrupo}"]`
        )
        .forEach(input => {

            input.checked =
                estado;
        });


    invalidarDatosActuales();


    if (nombreGrupo === "anioCheck") {

        recalcularGruposTamano();

        actualizarSegmentadoresInstitucionales();
    }


    actualizarContadores();
}



function marcarVisibles(
    nombreGrupo,
    estado
) {

    document
        .querySelectorAll(
            `input[name="${nombreGrupo}"]`
        )
        .forEach(input => {

            const label =
                input.closest(
                    ".opcion-check"
                );


            if (
                label &&
                label.style.display !== "none"
            ) {

                input.checked =
                    estado;
            }
        });


    invalidarDatosActuales();


    actualizarContadores();
}



/* =========================================================
   CONTADORES
   ========================================================= */


function actualizarContador(
    grupo,
    id
) {

    const todos =
        [
            ...document.querySelectorAll(
                `input[name="${grupo}"]`
            )
        ];


    const seleccionados =
        todos.filter(
            input => input.checked
        );


    const visibles =
        todos.filter(input => {

            const label =
                input.closest(
                    ".opcion-check"
                );


            return (
                !label ||
                label.style.display !==
                    "none"
            );
        });


    const elemento =
        document.getElementById(id);


    if (elemento) {

        elemento.textContent =
            `${seleccionados.length} seleccionados · ${visibles.length} visibles`;
    }
}



function actualizarContadores() {

    actualizarContador(
        "bibliotecaCheck",
        "contador-bibliotecas"
    );


    actualizarContador(
        "indicadorCheck",
        "contador-indicadores"
    );


    actualizarContador(
        "anioCheck",
        "contador-anios"
    );
}



/* =========================================================
   EVENTOS
   ========================================================= */


comunidadSelect.addEventListener(
    "change",
    () => {

        invalidarDatosActuales();

        actualizarSegmentadoresInstitucionales(
            "comunidad"
        );
    }
);


modalidadSelect.addEventListener(
    "change",
    () => {

        invalidarDatosActuales();

        actualizarSegmentadoresInstitucionales(
            "modalidad"
        );
    }
);


titularidadSelect.addEventListener(
    "change",
    () => {

        invalidarDatosActuales();

        actualizarSegmentadoresInstitucionales(
            "titularidad"
        );
    }
);


segmentadorTamano.addEventListener(
    "change",
    () => {

        invalidarDatosActuales();

        actualizarSegmentadoresInstitucionales(
            "tamano"
        );
    }
);


buscarBiblioteca.addEventListener(
    "input",
    aplicarFiltrosBibliotecas
);


buscarIndicador.addEventListener(
    "input",
    aplicarBusquedaIndicadores
);


ejeSelect.addEventListener(
    "change",
    () => {

        invalidarDatosActuales();

        cargarApartados();

        buscarIndicador.value = "";

        cargarIndicadores();
    }
);


apartadoSelect.addEventListener(
    "change",
    () => {

        invalidarDatosActuales();

        buscarIndicador.value = "";

        cargarIndicadores();
    }
);



document
    .getElementById("marcar-bibliotecas")
    .addEventListener(
        "click",
        () =>
            marcarVisibles(
                "bibliotecaCheck",
                true
            )
    );


document
    .getElementById("desmarcar-bibliotecas")
    .addEventListener(
        "click",
        () =>
            marcarVisibles(
                "bibliotecaCheck",
                false
            )
    );


document
    .getElementById("marcar-indicadores")
    .addEventListener(
        "click",
        () =>
            marcarVisibles(
                "indicadorCheck",
                true
            )
    );


document
    .getElementById("desmarcar-indicadores")
    .addEventListener(
        "click",
        () =>
            marcarVisibles(
                "indicadorCheck",
                false
            )
    );


document
    .getElementById("todos-anios")
    .addEventListener(
        "click",
        () =>
            marcarGrupo(
                "anioCheck",
                true
            )
    );


document
    .getElementById("ningun-anio")
    .addEventListener(
        "click",
        () =>
            marcarGrupo(
                "anioCheck",
                false
            )
    );


[
    "lista-bibliotecas",
    "lista-indicadores",
    "lista-anios"
]
.forEach(id => {

    document
        .getElementById(id)
        .addEventListener(
            "change",
            () => {

                invalidarDatosActuales();

                if (id === "lista-anios") {

                    recalcularGruposTamano();

                    actualizarSegmentadoresInstitucionales();
                }

                actualizarContadores();
            }
        );
});


[
    "filas",
    "columnas"
]
.forEach(id => {

    document
        .getElementById(id)
        .addEventListener(
            "change",
            invalidarDatosActuales
        );
});



/* =========================================================
   TABLA
   ========================================================= */


document
    .getElementById("generar")
    .addEventListener(
        "click",
        generarTabla
    );



function nombreDimension(campo) {

    const nombres = {

        Biblioteca:
            "Biblioteca",

        Anio:
            "Año",

        IndicadorEtiqueta:
            "Indicador"
    };


    return nombres[campo] || campo;
}


const coloresGraficos = [
    "#338C87",
    "#4E79A7",
    "#E07B39",
    "#7A6FAC",
    "#5A9A68",
    "#C95F5F",
    "#B08A3E",
    "#6D7C8A",
    "#A4678A",
    "#4F9DA6",
    "#8C7853",
    "#7B8F5A"
];

const colorPromedio = "#8E9797";


function obtenerNumeroValor(valor) {

    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {
        return null;
    }

    const texto = String(valor).trim();
    const normalizado =
        texto.includes(",") && !texto.includes(".")
            ? texto.replace(",", ".")
            : texto;
    const numero = Number(normalizado);

    return Number.isFinite(numero)
        ? numero
        : null;
}


function calcularPromedioFilas(filas) {

    const valores = filas
        .map(fila => obtenerNumeroValor(fila.Valor))
        .filter(Number.isFinite);

    return {
        valor: valores.length
            ? valores.reduce((suma, valor) => suma + valor, 0) /
                valores.length
            : null,
        cantidad: valores.length
    };
}


function obtenerIndicadoresDatosActuales() {

    const porCodigo = new Map();

    datosActuales.forEach(fila => {

        const anterior = porCodigo.get(fila.Codigo_Tecnico);

        if (
            !anterior ||
            Number(fila.Anio) > Number(anterior.Anio)
        ) {
            porCodigo.set(fila.Codigo_Tecnico, fila);
        }
    });

    return [...porCodigo.values()]
        .sort((a, b) =>
            a.Codigo_REBIUN.localeCompare(
                b.Codigo_REBIUN,
                "es",
                { numeric: true }
            )
        );
}


function rellenarSelectorIndicadores(select, indicadores) {

    select.innerHTML = "";

    indicadores.forEach(indicador => {

        const opcion = document.createElement("option");
        opcion.value = indicador.Codigo_Tecnico;
        opcion.textContent =
            `${indicador.Codigo_REBIUN} ${indicador.Indicador}`;
        select.appendChild(opcion);
    });
}


function activarVista(nombreVista) {

    if (!datosActuales.length) {
        return;
    }

    const paneles = {
        tabla: tablaElemento,
        evolucion: evolucionElemento,
        comparacion: comparacionElemento
    };

    Object.entries(paneles).forEach(
        ([nombre, panel]) => {
            panel.hidden = nombre !== nombreVista;
        }
    );

    selectorVistas
        .querySelectorAll('[role="tab"]')
        .forEach(boton => {
            const activo = boton.dataset.vista === nombreVista;
            boton.classList.toggle("activa", activo);
            boton.setAttribute("aria-selected", activo ? "true" : "false");
            boton.tabIndex = activo ? 0 : -1;
        });

    if (nombreVista === "evolucion") {
        renderizarEvolucion();
    }

    if (nombreVista === "comparacion") {
        renderizarComparacion();
    }
}


function prepararVisualizaciones() {

    const indicadores = obtenerIndicadoresDatosActuales();

    rellenarSelectorIndicadores(
        indicadorEvolucionSelect,
        indicadores
    );
    rellenarSelectorIndicadores(
        indicadorComparacionSelect,
        indicadores
    );

    ordenComparacionSelect.value = "desc";
    orientacionComparacionSelect.value = "horizontal";

    actualizarModoComparacion();
    reconstruirAniosComparacion();

    selectorVistas.hidden = false;
    activarVista("tabla");
}


function reconstruirAniosComparacion() {

    const codigo = indicadorComparacionSelect.value;
    const anios = [
        ...new Set(
            datosActuales
                .filter(fila => fila.Codigo_Tecnico === codigo)
                .map(fila => fila.Anio)
        )
    ].sort((a, b) => Number(a) - Number(b));

    if (!anios.includes(anioComparacionActivo)) {
        anioComparacionActivo = anios[anios.length - 1] || "";
    }

    aniosComparacionElemento.innerHTML = "";

    anios.forEach(anio => {
        const boton = document.createElement("button");
        const activo = anio === anioComparacionActivo;
        boton.type = "button";
        boton.className = `chip-anio${activo ? " activo" : ""}`;
        boton.textContent = anio;
        boton.setAttribute("aria-pressed", activo ? "true" : "false");
        boton.addEventListener("click", () => {
            anioComparacionActivo = anio;
            reconstruirAniosComparacion();
            renderizarComparacion();
        });
        aniosComparacionElemento.appendChild(boton);
    });
}


function actualizarModoComparacion() {

    const indicadorPropio =
        indicadorComparacionSelect.value === "NUSUARIOPROP";

    if (indicadorPropio) {
        modoComparacion = "absoluto";
    }

    botonesModoComparacion.forEach(boton => {
        const activo = boton.dataset.modoComparacion === modoComparacion;
        boton.disabled = indicadorPropio &&
            boton.dataset.modoComparacion === "por-usuario";
        boton.classList.toggle("activo", activo);
        boton.setAttribute("aria-pressed", activo ? "true" : "false");
    });
}


function colorBiblioteca(biblioteca) {

    let hash = 0;

    for (const caracter of biblioteca) {
        hash = (hash * 31 + caracter.codePointAt(0)) >>> 0;
    }

    return coloresGraficos[hash % coloresGraficos.length];
}


function siglasBiblioteca(codigo) {
    return mapaBibliotecas.get(codigo)?.Siglas || "";
}


function etiquetaGraficoBiblioteca(codigo, nombre) {
    return siglasBiblioteca(codigo) || nombre;
}


function tituloGraficoBiblioteca(codigo, nombre) {
    const siglas = siglasBiblioteca(codigo);
    return `${nombre}${siglas ? ` (${siglas})` : ""}`;
}


function crearSVG(ancho, alto, etiqueta) {

    const espacio = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(espacio, "svg");
    svg.setAttribute("viewBox", `0 0 ${ancho} ${alto}`);
    svg.setAttribute("class", "grafico-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", etiqueta);
    return svg;
}


function agregarElementoSVG(svg, tipo, atributos, texto = null) {

    const elemento = document.createElementNS(
        "http://www.w3.org/2000/svg",
        tipo
    );

    Object.entries(atributos).forEach(
        ([nombre, valor]) => elemento.setAttribute(nombre, valor)
    );

    if (texto !== null) {
        elemento.textContent = texto;
    }

    svg.appendChild(elemento);
    return elemento;
}


function renderizarEvolucion() {

    const codigo = indicadorEvolucionSelect.value;
    const filas = datosActuales.filter(
        fila => fila.Codigo_Tecnico === codigo
    );
    const anios = [
        ...new Set(datosActuales.map(fila => fila.Anio))
    ].sort((a, b) => Number(a) - Number(b));
    const bibliotecas = [
        ...new Set(filas.map(fila => fila.Biblioteca))
    ].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
    const valores = filas
        .map(fila => obtenerNumeroValor(fila.Valor))
        .filter(Number.isFinite);

    graficoEvolucionElemento.innerHTML = "";

    if (!codigo || !anios.length || !valores.length) {
        graficoEvolucionElemento.innerHTML =
            '<div class="mensaje">No existen datos numéricos suficientes para mostrar la evolución.</div>';
        return;
    }

    const ancho = 900;
    const alto = 430;
    const margen = { superior: 25, derecha: 25, inferior: 55, izquierda: 80 };
    const anchoUtil = ancho - margen.izquierda - margen.derecha;
    const altoUtil = alto - margen.superior - margen.inferior;
    const maximo = Math.max(...valores, 0);
    const escalaMaxima = maximo || 1;
    const x = anio =>
        margen.izquierda +
        (anios.length === 1
            ? anchoUtil / 2
            : anios.indexOf(anio) * anchoUtil / (anios.length - 1));
    const y = valor =>
        margen.superior + altoUtil - valor * altoUtil / escalaMaxima;
    const svg = crearSVG(ancho, alto, "Gráfico de evolución por biblioteca");

    for (let i = 0; i <= 4; i += 1) {
        const valor = escalaMaxima * i / 4;
        const posicionY = y(valor);
        agregarElementoSVG(svg, "line", {
            x1: margen.izquierda,
            y1: posicionY,
            x2: ancho - margen.derecha,
            y2: posicionY,
            class: "grafico-guia"
        });
        agregarElementoSVG(svg, "text", {
            x: margen.izquierda - 8,
            y: posicionY + 4,
            "text-anchor": "end",
            class: "grafico-texto"
        }, formatearValor(valor));
    }

    anios.forEach(anio => {
        agregarElementoSVG(svg, "text", {
            x: x(anio),
            y: alto - margen.inferior + 24,
            "text-anchor": "middle",
            class: "grafico-texto"
        }, anio);
    });

    agregarElementoSVG(svg, "line", {
        x1: margen.izquierda,
        y1: margen.superior,
        x2: margen.izquierda,
        y2: alto - margen.inferior,
        class: "grafico-eje"
    });
    agregarElementoSVG(svg, "line", {
        x1: margen.izquierda,
        y1: alto - margen.inferior,
        x2: ancho - margen.derecha,
        y2: alto - margen.inferior,
        class: "grafico-eje"
    });

    const leyenda = document.createElement("div");
    leyenda.className = "grafico-leyenda";

    bibliotecas.forEach(biblioteca => {
        const color = colorBiblioteca(biblioteca);
        const filaBiblioteca = filas.find(fila => fila.Biblioteca === biblioteca);
        const codigoBiblioteca = filaBiblioteca.Codigo_Biblioteca_REBIUN;
        const nombreCompleto = mapaBibliotecas.get(codigoBiblioteca)?.Biblioteca || biblioteca;
        const mapa = new Map(
            filas
                .filter(fila => fila.Biblioteca === biblioteca)
                .map(fila => [fila.Anio, obtenerNumeroValor(fila.Valor)])
        );
        let puntosSegmento = [];

        const dibujarSegmento = () => {
            if (puntosSegmento.length > 1) {
                agregarElementoSVG(svg, "polyline", {
                    points: puntosSegmento.join(" "),
                    fill: "none",
                    stroke: color,
                    "stroke-width": 2
                });
            }
            puntosSegmento = [];
        };

        anios.forEach(anio => {
            const valor = mapa.get(anio);

            if (!Number.isFinite(valor)) {
                dibujarSegmento();
                return;
            }

            const punto = `${x(anio)},${y(valor)}`;
            puntosSegmento.push(punto);
            const circulo = agregarElementoSVG(svg, "circle", {
                cx: x(anio),
                cy: y(valor),
                r: 4,
                fill: color,
                stroke: "#fff",
                "stroke-width": 1
            });
            const titulo = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "title"
            );
            titulo.textContent =
                `${tituloGraficoBiblioteca(codigoBiblioteca, nombreCompleto)}\n${anio}\nValor: ${formatearValor(valor)}`;
            circulo.appendChild(titulo);
        });
        dibujarSegmento();

        const item = document.createElement("span");
        item.className = "grafico-leyenda-item";
        item.innerHTML =
            `<span class="grafico-leyenda-color" style="background:${color}"></span>` +
            `<span>${escaparHTML(etiquetaGraficoBiblioteca(codigoBiblioteca, nombreCompleto))}</span>`;
        leyenda.appendChild(item);
    });

    if (mostrarPromedioEvolucion.checked) {
        let puntosSegmento = [];

        const dibujarSegmentoPromedio = () => {
            if (puntosSegmento.length > 1) {
                agregarElementoSVG(svg, "polyline", {
                    points: puntosSegmento.join(" "),
                    fill: "none",
                    stroke: colorPromedio,
                    "stroke-width": 1.5,
                    "stroke-dasharray": "4 4",
                    opacity: 0.75
                });
            }
            puntosSegmento = [];
        };

        anios.forEach(anio => {
            const promedio = calcularPromedioFilas(
                filas.filter(fila => fila.Anio === anio)
            );

            if (!Number.isFinite(promedio.valor)) {
                dibujarSegmentoPromedio();
                return;
            }

            puntosSegmento.push(
                `${x(anio)},${y(promedio.valor)}`
            );
            const areaTooltip = agregarElementoSVG(svg, "circle", {
                cx: x(anio),
                cy: y(promedio.valor),
                r: 7,
                fill: "transparent",
                stroke: "none",
                "pointer-events": "all"
            });
            const titulo = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "title"
            );
            titulo.textContent =
                `${anio}\n` +
                `Promedio: ${formatearValor(promedio.valor)}\n` +
                `${promedio.cantidad} bibliotecas con dato`;
            areaTooltip.appendChild(titulo);
        });
        dibujarSegmentoPromedio();

        const itemPromedio = document.createElement("span");
        itemPromedio.className =
            "grafico-leyenda-item grafico-leyenda-promedio";
        itemPromedio.innerHTML =
            '<span class="grafico-leyenda-linea-promedio"></span>' +
            "<span>Promedio de bibliotecas seleccionadas</span>";
        leyenda.appendChild(itemPromedio);
    }

    graficoEvolucionElemento.appendChild(svg);
    graficoEvolucionElemento.appendChild(leyenda);
}


function renderizarComparacion() {

    const codigo = indicadorComparacionSelect.value;
    const anio = anioComparacionActivo;
    const normalizado = modoComparacion === "por-usuario";
    const formatoRatio = new Intl.NumberFormat("es-ES", {
        maximumFractionDigits: 3
    });
    const barras = datosActuales
        .filter(fila =>
            fila.Codigo_Tecnico === codigo &&
            fila.Anio === anio
        )
        .map(fila => ({
            biblioteca: fila.Biblioteca,
            codigoBiblioteca: fila.Codigo_Biblioteca_REBIUN,
            valor: obtenerNumeroValor(fila.Valor),
            denominador: normalizado
                ? indiceUsuariosPropios
                    .get(fila.Codigo_Biblioteca_REBIUN)
                    ?.get(fila.Anio)
                : null
        }))
        .map(barra => ({
            biblioteca: barra.biblioteca,
            codigoBiblioteca: barra.codigoBiblioteca,
            valor: normalizado
                ? Number.isFinite(barra.valor) &&
                    Number.isFinite(barra.denominador) &&
                    barra.denominador > 0
                    ? barra.valor / barra.denominador
                    : null
                : barra.valor
        }))
        .filter(barra => Number.isFinite(barra.valor))
        .map(barra => ({
            ...barra,
            etiqueta: etiquetaGraficoBiblioteca(
                barra.codigoBiblioteca,
                mapaBibliotecas.get(barra.codigoBiblioteca)?.Biblioteca || barra.biblioteca
            ),
            titulo: tituloGraficoBiblioteca(
                barra.codigoBiblioteca,
                mapaBibliotecas.get(barra.codigoBiblioteca)?.Biblioteca || barra.biblioteca
            )
        }))
        .sort((a, b) => {
            if (ordenComparacionSelect.value === "alfabetico") {
                return a.etiqueta.localeCompare(b.etiqueta, "es", {
                    sensitivity: "base",
                    numeric: true
                });
            }
            return ordenComparacionSelect.value === "asc"
                ? a.valor - b.valor
                : b.valor - a.valor;
        });

    graficoComparacionElemento.innerHTML = "";

    if (!codigo || !anio || !barras.length) {
        graficoComparacionElemento.innerHTML =
            normalizado
                ? '<div class="mensaje">No hay datos de personas usuarias propias disponibles para normalizar esta comparación.</div>'
                : '<div class="mensaje">No existen datos numéricos para esta combinación de indicador y año.</div>';
        return;
    }

    if (normalizado) {
        const medida = document.createElement("p");
        medida.className = "medida-comparacion";
        medida.textContent =
            `${indicadorComparacionSelect.selectedOptions[0]?.textContent || "Indicador"} por persona usuaria propia`;
        graficoComparacionElemento.appendChild(medida);
    }

    const vertical = orientacionComparacionSelect.value === "vertical";
    const ancho = vertical ? Math.max(900, barras.length * 90 + 100) : 900;
    const altoFila = 28;
    const espacioEtiquetas = Math.max(
        145,
        Math.min(300, Math.max(...barras.map(barra => barra.etiqueta.length)) * 5 + 20)
    );
    const margen = vertical
        ? { superior: 35, derecha: 35, inferior: espacioEtiquetas, izquierda: 75 }
        : { superior: 18, derecha: 105, inferior: 25, izquierda: 260 };
    const alto = vertical
        ? 375 + margen.inferior
        : margen.superior + margen.inferior + barras.length * altoFila;
    const anchoUtil = ancho - margen.izquierda - margen.derecha;
    const altoUtil = alto - margen.superior - margen.inferior;
    const maximo = Math.max(...barras.map(barra => barra.valor), 0) || 1;
    const svg = crearSVG(ancho, alto, "Gráfico de comparación entre bibliotecas");

    if (vertical) {
        svg.style.width = `${ancho}px`;
        const paso = anchoUtil / barras.length;
        const anchoBarra = Math.min(48, paso * 0.68);
        const rotarEtiquetas = barras.some(barra => barra.etiqueta.length > 12);

        for (let indice = 0; indice <= 4; indice += 1) {
            const valor = maximo * indice / 4;
            const posicionY = margen.superior + altoUtil - valor * altoUtil / maximo;
            agregarElementoSVG(svg, "line", {
                x1: margen.izquierda,
                y1: posicionY,
                x2: ancho - margen.derecha,
                y2: posicionY,
                class: "grafico-guia"
            });
            agregarElementoSVG(svg, "text", {
                x: margen.izquierda - 7,
                y: posicionY + 4,
                "text-anchor": "end",
                class: "grafico-texto"
            }, normalizado ? formatoRatio.format(valor) : formatearValor(valor));
        }
        agregarElementoSVG(svg, "line", {
            x1: margen.izquierda,
            y1: margen.superior,
            x2: margen.izquierda,
            y2: alto - margen.inferior,
            class: "grafico-eje"
        });

        barras.forEach((barra, indice) => {
            const centroX = margen.izquierda + (indice + 0.5) * paso;
            const alturaBarra = barra.valor * altoUtil / maximo;
            const posicionY = margen.superior + altoUtil - alturaBarra;
            const rect = agregarElementoSVG(svg, "rect", {
                x: centroX - anchoBarra / 2,
                y: posicionY,
                width: anchoBarra,
                height: alturaBarra,
                fill: "#7896A8"
            });
            const titulo = document.createElementNS(
                "http://www.w3.org/2000/svg", "title"
            );
            titulo.textContent =
                `${barra.titulo}\n${anio}\nValor: ${normalizado
                    ? formatoRatio.format(barra.valor)
                    : formatearValor(barra.valor)}`;
            rect.appendChild(titulo);
            agregarElementoSVG(svg, "text", {
                x: centroX,
                y: Math.max(22, posicionY - 7),
                "text-anchor": "middle",
                class: "grafico-texto"
            }, normalizado ? formatoRatio.format(barra.valor) : formatearValor(barra.valor));
            const etiqueta = agregarElementoSVG(svg, "text", {
                x: centroX,
                y: alto - margen.inferior + 18,
                "text-anchor": rotarEtiquetas ? "end" : "middle",
                class: "grafico-texto grafico-etiqueta-barra"
            }, barra.etiqueta);
            if (rotarEtiquetas) {
                etiqueta.setAttribute(
                    "transform",
                    `rotate(-40 ${centroX} ${alto - margen.inferior + 18})`
                );
            }
        });
    } else {

    barras.forEach((barra, indice) => {
        const posicionY = margen.superior + indice * altoFila;
        const anchoBarra = barra.valor * anchoUtil / maximo;

        agregarElementoSVG(svg, "text", {
            x: margen.izquierda - 8,
            y: posicionY + 17,
            "text-anchor": "end",
            class: "grafico-texto grafico-etiqueta-barra"
        }, barra.etiqueta);
        const rect = agregarElementoSVG(svg, "rect", {
            x: margen.izquierda,
            y: posicionY + 3,
            width: Math.max(0, anchoBarra),
            height: 18,
            fill: "#7896A8"
        });
        const titulo = document.createElementNS(
            "http://www.w3.org/2000/svg", "title"
        );
        titulo.textContent =
            `${barra.titulo}\n${anio}\nValor: ${normalizado
                ? formatoRatio.format(barra.valor)
                : formatearValor(barra.valor)}`;
        rect.appendChild(titulo);
        agregarElementoSVG(svg, "text", {
            x: margen.izquierda + anchoBarra + 7,
            y: posicionY + 17,
            class: "grafico-texto"
        }, normalizado
            ? formatoRatio.format(barra.valor)
            : formatearValor(barra.valor));
    });
    }

    const promedio = calcularPromedioFilas(
        barras.map(barra => ({ Valor: barra.valor }))
    );

    if (Number.isFinite(promedio.valor)) {
        const posicionPromedio = vertical
            ? margen.superior + altoUtil - promedio.valor * altoUtil / maximo
            : margen.izquierda + promedio.valor * anchoUtil / maximo;
        const etiquetaALaDerecha =
            posicionPromedio < ancho - margen.derecha - 250;

        agregarElementoSVG(svg, "line", {
            x1: vertical ? margen.izquierda : posicionPromedio,
            y1: vertical ? posicionPromedio : margen.superior,
            x2: vertical ? ancho - margen.derecha : posicionPromedio,
            y2: vertical ? posicionPromedio : alto - margen.inferior,
            stroke: colorPromedio,
            "stroke-width": 1.5,
            "stroke-dasharray": "4 4",
            opacity: 0.75
        });
        agregarElementoSVG(svg, "text", {
            x: vertical
                ? margen.izquierda + 6
                : posicionPromedio + (etiquetaALaDerecha ? 6 : -6),
            y: vertical ? Math.max(18, posicionPromedio - 6) : 12,
            "text-anchor": vertical
                ? "start"
                : etiquetaALaDerecha ? "start" : "end",
            class: "grafico-texto grafico-etiqueta-promedio",
            fill: colorPromedio
        }, `Promedio de bibliotecas seleccionadas: ${normalizado
            ? formatoRatio.format(promedio.valor)
            : formatearValor(promedio.valor)}`);
    }

    graficoComparacionElemento.appendChild(svg);
}


function cerrarMenusDescarga(excepto = null) {

    document
        .querySelectorAll(".menu-descarga-grafico")
        .forEach(menu => {
            if (menu === excepto) {
                return;
            }
            menu.hidden = true;
            const boton = document.querySelector(
                `[data-menu-descarga="${menu.dataset.menu}"]`
            );
            if (boton) {
                boton.setAttribute("aria-expanded", "false");
            }
        });
}


function svgExportable(tipoVista) {

    const contenedor = tipoVista === "evolucion"
        ? graficoEvolucionElemento
        : graficoComparacionElemento;
    const original = contenedor.querySelector("svg");

    if (!original) {
        return null;
    }

    const clon = original.cloneNode(true);
    const partesVista = clon.getAttribute("viewBox")
        .split(/\s+/)
        .map(Number);
    const ancho = partesVista[2];
    let alto = partesVista[3];

    const estilo = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "style"
    );
    estilo.textContent =
        ".grafico-texto{fill:#333;font:12px 'Segoe UI',Arial,sans-serif}" +
        ".grafico-etiqueta-barra{font-size:11px}" +
        ".grafico-etiqueta-promedio{fill:#8E9797;font-size:11px;font-weight:500}" +
        ".grafico-eje{stroke:#899796;stroke-width:1}" +
        ".grafico-guia{stroke:#e4ebea;stroke-width:1}";
    clon.insertBefore(estilo, clon.firstChild);

    if (tipoVista === "evolucion") {
        const items = [
            ...contenedor.querySelectorAll(".grafico-leyenda-item")
        ];
        const inicioLeyenda = alto + 18;
        const grupo = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );

        items.forEach((item, indice) => {
            const y = inicioLeyenda + indice * 20;
            const esPromedio = item.classList.contains(
                "grafico-leyenda-promedio"
            );

            if (esPromedio) {
                const linea = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "line"
                );
                linea.setAttribute("x1", "10");
                linea.setAttribute("y1", String(y - 4));
                linea.setAttribute("x2", "26");
                linea.setAttribute("y2", String(y - 4));
                linea.setAttribute("stroke", colorPromedio);
                linea.setAttribute("stroke-width", "1.5");
                linea.setAttribute("stroke-dasharray", "4 4");
                linea.setAttribute("opacity", "0.75");
                grupo.appendChild(linea);
            } else {
                const circulo = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "circle"
                );
                circulo.setAttribute("cx", "18");
                circulo.setAttribute("cy", String(y - 4));
                circulo.setAttribute("r", "5");
                circulo.setAttribute(
                    "fill",
                    getComputedStyle(
                        item.querySelector(".grafico-leyenda-color")
                    ).backgroundColor
                );
                grupo.appendChild(circulo);
            }

            const texto = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );
            texto.setAttribute("x", "30");
            texto.setAttribute("y", String(y));
            texto.setAttribute("class", "grafico-texto");
            texto.textContent = item.textContent.trim();
            grupo.appendChild(texto);
        });

        clon.appendChild(grupo);
        alto = inicioLeyenda + items.length * 20 + 8;
    }

    if (tipoVista === "comparacion" && modoComparacion === "por-usuario") {
        const medida = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );
        medida.setAttribute("x", "16");
        medida.setAttribute("y", String(alto + 19));
        medida.setAttribute("class", "grafico-texto");
        medida.textContent = "Por persona usuaria propia";
        clon.appendChild(medida);
        alto += 30;
    }

    clon.setAttribute("viewBox", `0 0 ${ancho} ${alto}`);
    clon.setAttribute("width", String(ancho));
    clon.setAttribute("height", String(alto));

    const fondo = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
    );
    fondo.setAttribute("x", "0");
    fondo.setAttribute("y", "0");
    fondo.setAttribute("width", "100%");
    fondo.setAttribute("height", "100%");
    fondo.setAttribute("fill", "#fff");
    clon.insertBefore(fondo, clon.firstChild);

    return { svg: clon, ancho, alto };
}


function nombreArchivoGrafico(tipoVista, extension) {

    const codigo = tipoVista === "evolucion"
        ? indicadorEvolucionSelect.value
        : indicadorComparacionSelect.value;
    const fecha = new Date().toISOString().slice(0, 10);
    const partes = ["REBIUN", tipoVista, codigo];

    if (tipoVista === "comparacion") {
        partes.push(anioComparacionActivo);
        if (modoComparacion === "por-usuario") {
            partes.push("por_usuario");
        }
        return `${partes.join("_")}.${extension}`;
    }

    partes.push(fecha);

    return `${partes.join("_")}.${extension}`;
}


function descargarGraficoPNG(tipoVista) {

    const exportacion = svgExportable(tipoVista);

    if (!exportacion) {
        return;
    }

    const serializado = new XMLSerializer()
        .serializeToString(exportacion.svg);
    const blobSVG = new Blob(
        [serializado],
        { type: "image/svg+xml;charset=utf-8" }
    );
    const urlSVG = URL.createObjectURL(blobSVG);
    const imagen = new Image();

    imagen.onload = () => {
        const escala = 2;
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(exportacion.ancho * escala);
        canvas.height = Math.ceil(exportacion.alto * escala);
        const contexto = canvas.getContext("2d");
        contexto.fillStyle = "#fff";
        contexto.fillRect(0, 0, canvas.width, canvas.height);
        contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(urlSVG);

        canvas.toBlob(blobPNG => {
            if (!blobPNG) {
                return;
            }
            const urlPNG = URL.createObjectURL(blobPNG);
            const enlace = document.createElement("a");
            enlace.href = urlPNG;
            enlace.download = nombreArchivoGrafico(tipoVista, "png");
            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();
            window.setTimeout(
                () => URL.revokeObjectURL(urlPNG),
                1000
            );
        }, "image/png");
    };

    imagen.src = urlSVG;
}


function prepararImpresionGrafico(tipoVista) {

    const esEvolucion = tipoVista === "evolucion";
    const selectorIndicador = esEvolucion
        ? indicadorEvolucionSelect
        : indicadorComparacionSelect;
    const contenedor = esEvolucion
        ? graficoEvolucionElemento
        : graficoComparacionElemento;
    const titulo = esEvolucion
        ? "Evolución"
        : "Comparación";

    vistaImpresionGrafico.innerHTML = "";

    const encabezado = document.createElement("h1");
    encabezado.textContent = titulo;
    vistaImpresionGrafico.appendChild(encabezado);

    const metadatos = document.createElement("div");
    metadatos.className = "metadatos-impresion";
    metadatos.textContent =
        `Indicador: ${selectorIndicador.selectedOptions[0]?.textContent || ""}` +
        (esEvolucion ? "" : ` · Año: ${anioComparacionActivo}`) +
        (!esEvolucion && modoComparacion === "por-usuario"
            ? " · Por persona usuaria propia"
            : "");
    vistaImpresionGrafico.appendChild(metadatos);

    vistaImpresionGrafico.appendChild(contenedor.cloneNode(true));

    const fuente = document.createElement("div");
    fuente.className = "fuente-grafico";
    fuente.textContent = "Fuente: Estadísticas REBIUN";
    vistaImpresionGrafico.appendChild(fuente);

    vistaImpresionGrafico.setAttribute("aria-hidden", "false");
    document.body.classList.add("imprimiendo-grafico");

    const limpiar = () => {
        document.body.classList.remove("imprimiendo-grafico");
        vistaImpresionGrafico.setAttribute("aria-hidden", "true");
        vistaImpresionGrafico.innerHTML = "";
    };

    window.addEventListener("afterprint", limpiar, { once: true });
    window.print();
}


document
    .querySelectorAll("[data-menu-descarga]")
    .forEach(boton => {
        boton.addEventListener("click", evento => {
            evento.stopPropagation();
            const menu = document.querySelector(
                `[data-menu="${boton.dataset.menuDescarga}"]`
            );
            const abrir = menu.hidden;
            cerrarMenusDescarga(abrir ? menu : null);
            menu.hidden = !abrir;
            boton.setAttribute("aria-expanded", abrir ? "true" : "false");
        });
    });


document
    .querySelectorAll("[data-descarga]")
    .forEach(boton => {
        boton.addEventListener("click", () => {
            const tipoVista = boton.dataset.vistaDescarga;
            cerrarMenusDescarga();

            if (boton.dataset.descarga === "png") {
                descargarGraficoPNG(tipoVista);
            } else {
                prepararImpresionGrafico(tipoVista);
            }
        });
    });


document.addEventListener("click", () => cerrarMenusDescarga());


selectorVistas
    .querySelectorAll('[role="tab"]')
    .forEach(boton => {
        boton.addEventListener(
            "click",
            () => activarVista(boton.dataset.vista)
        );
        boton.addEventListener(
            "keydown",
            evento => {
                if (!["ArrowLeft", "ArrowRight"].includes(evento.key)) {
                    return;
                }
                evento.preventDefault();
                const pestanas = [
                    ...selectorVistas.querySelectorAll('[role="tab"]')
                ];
                const desplazamiento = evento.key === "ArrowRight" ? 1 : -1;
                const indice = (
                    pestanas.indexOf(boton) + desplazamiento + pestanas.length
                ) % pestanas.length;
                pestanas[indice].focus();
                activarVista(pestanas[indice].dataset.vista);
            }
        );
    });


indicadorEvolucionSelect.addEventListener(
    "change",
    renderizarEvolucion
);

mostrarPromedioEvolucion.addEventListener(
    "change",
    renderizarEvolucion
);

indicadorComparacionSelect.addEventListener(
    "change",
    () => {
        actualizarModoComparacion();
        reconstruirAniosComparacion();
        renderizarComparacion();
    }
);

ordenComparacionSelect.addEventListener(
    "change",
    renderizarComparacion
);

orientacionComparacionSelect.addEventListener(
    "change",
    renderizarComparacion
);

botonesModoComparacion.forEach(boton => {
    boton.addEventListener("click", () => {
        if (boton.disabled) {
            return;
        }
        modoComparacion = boton.dataset.modoComparacion;
        actualizarModoComparacion();
        renderizarComparacion();
    });
});




/* =========================================================
   ACTUALIZACIÓN DE ETIQUETAS SEGÚN AÑOS
   ========================================================= */

function actualizarBotonesEstadoIndicadores() {

    document
        .querySelectorAll(
            "[data-estado-indicadores]"
        )
        .forEach(
            boton => {

                const activo =
                    boton.dataset
                        .estadoIndicadores ===
                    estadoFiltroIndicadores;


                boton.classList.toggle(
                    "activo",
                    activo
                );


                boton.setAttribute(
                    "aria-pressed",
                    activo
                        ? "true"
                        : "false"
                );
            }
        );
}



document
    .querySelectorAll(
        "[data-estado-indicadores]"
    )
    .forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    const nuevoEstado =
                        boton.dataset
                            .estadoIndicadores;


                    if (
                        nuevoEstado ===
                        estadoFiltroIndicadores
                    ) {

                        return;
                    }


                    estadoFiltroIndicadores =
                        nuevoEstado;


                    actualizarBotonesEstadoIndicadores();


                    buscarIndicador.value =
                        "";


                    invalidarDatosActuales();


                    actualizarTaxonomiaIndicadores();
                }
            );
        }
    );


actualizarBotonesEstadoIndicadores();



document
    .getElementById("lista-anios")
    .addEventListener(
        "change",
        () => {

            actualizarTaxonomiaIndicadores();

            actualizarContadores();

            invalidarDatosActuales();
        }
    );


document
    .getElementById("todos-anios")
    .addEventListener(
        "click",
        () => {

            actualizarTaxonomiaIndicadores();

            actualizarContadores();

            invalidarDatosActuales();
        }
    );


document
    .getElementById("ningun-anio")
    .addEventListener(
        "click",
        () => {

            actualizarTaxonomiaIndicadores();

            actualizarContadores();

            invalidarDatosActuales();
        }
    );


function generarTabla() {

    const anios =
        obtenerSeleccionados(
            "anioCheck"
        );


    const bibliotecasMarcadas =
        obtenerSeleccionados(
            "bibliotecaCheck"
        );


    const indicadores =
        obtenerSeleccionados(
            "indicadorCheck"
        );


    const bibliotecasCompatibles =
        bibliotecasMarcadas.filter(
            bibliotecaCumpleSegmentadores
        );


    invalidarDatosActuales();

    resumenElemento.textContent = "";


    const diagnosticar = registrosEncontrados => {

        console.debug(
            "Diagnóstico de generación REBIUN",
            {
                aniosSeleccionados: anios,
                bibliotecasMarcadas,
                bibliotecasCompatibles,
                indicadoresSeleccionados: indicadores,
                eje: ejeSelect.value,
                apartado: apartadoSelect.value,
                registrosEncontrados
            }
        );
    };


    const mostrarMensaje = mensaje => {

        tablaElemento.hidden = false;

        tablaElemento.innerHTML =
            `<div class="mensaje">${mensaje}</div>`;
    };


    if (anios.length === 0) {

        diagnosticar(0);

        mostrarMensaje("No hay años seleccionados.");

        return;
    }


    if (bibliotecasMarcadas.length === 0) {

        diagnosticar(0);

        mostrarMensaje("No hay bibliotecas seleccionadas.");

        return;
    }


    if (bibliotecasCompatibles.length === 0) {

        diagnosticar(0);

        mostrarMensaje(
            "Hay bibliotecas marcadas, pero ninguna es compatible con los segmentadores institucionales actuales."
        );

        return;
    }


    if (indicadores.length === 0) {

        diagnosticar(0);

        mostrarMensaje("No hay indicadores seleccionados.");

        return;
    }


    const campoFila =
        document.getElementById(
            "filas"
        ).value;


    const campoColumna =
        document.getElementById(
            "columnas"
        ).value;


    if (
        campoFila ===
        campoColumna
    ) {

        diagnosticar(0);

        mostrarMensaje(
            "Filas y columnas deben ser diferentes."
        );

        return;
    }


    const aniosSet =
        new Set(anios);

    const bibliotecasCompatiblesSet =
        new Set(
            bibliotecasCompatibles
        );

    const indicadoresSet =
        new Set(indicadores);


    let filtrados =
        datos.filter(d =>

            aniosSet.has(
                d.Anio
            ) &&

            bibliotecasCompatiblesSet.has(
                d.Codigo_Biblioteca_REBIUN
            ) &&

            indicadoresSet.has(
                d.Codigo_Tecnico
            )
        );


    if (ejeSelect.value) {

        filtrados =
            filtrados.filter(
                d =>
                    d.Eje ===
                    ejeSelect.value
            );
    }


    if (apartadoSelect.value) {

        filtrados =
            filtrados.filter(
                d =>
                    d.Apartado ===
                    apartadoSelect.value
            );
    }


    diagnosticar(filtrados.length);


    if (filtrados.length === 0) {

        mostrarMensaje(
            "La selección es válida, pero no existen registros en rebiun_real.csv que coincidan con ella."
        );

        return;
    }


    const filas =
        valoresUnicos(
            campoFila,
            filtrados
        );


    const columnas =
        valoresUnicos(
            campoColumna,
            filtrados
        );


    const dimensiones = [
        "Biblioteca",
        "Anio",
        "IndicadorEtiqueta"
    ];


    const terceraDimension =
        dimensiones.find(
            d =>
                d !== campoFila &&
                d !== campoColumna
        );


    // MAPA_CELDAS_OPTIMIZADO
    //
    // Se agrupan los registros una sola vez por
    // fila y columna. Así evitamos recorrer
    // filtrados completo para cada celda.

    const mapaCeldas =
        new Map();


    filtrados.forEach(d => {

        const claveFila =
            d[campoFila];

        const claveColumna =
            d[campoColumna];


        let mapaFila =
            mapaCeldas.get(
                claveFila
            );


        if (!mapaFila) {

            mapaFila =
                new Map();

            mapaCeldas.set(
                claveFila,
                mapaFila
            );
        }


        let registrosCelda =
            mapaFila.get(
                claveColumna
            );


        if (!registrosCelda) {

            registrosCelda = [];

            mapaFila.set(
                claveColumna,
                registrosCelda
            );
        }


        registrosCelda.push(d);
    });


    let html =
        "<table>";


    html +=
        `<thead><tr><th>${nombreDimension(campoFila)}</th>`;


    columnas.forEach(
        columna => {

            html +=
                `<th>${escaparHTML(columna)}</th>`;
        }
    );


    html +=
        "</tr></thead><tbody>";


    filas.forEach(fila => {

        html +=
            `<tr><td>${escaparHTML(fila)}</td>`;


        columnas.forEach(
            columna => {

                const mapaFila =
                    mapaCeldas.get(
                        fila
                    );


                const registros =
                    mapaFila
                        ? (
                            mapaFila.get(
                                columna
                            ) || []
                        )
                        : [];


                let contenido = "";


                if (
                    registros.length === 1
                ) {

                    contenido =
                        formatearValor(
                            registros[0].Valor
                        );
                }


                else if (
                    registros.length > 1
                ) {

                    registros.sort(
                        (a, b) =>
                            a[terceraDimension]
                                .localeCompare(
                                    b[terceraDimension],
                                    "es",
                                    { numeric: true }
                                )
                    );


                    // DATO_CELDA_ESTRUCTURADO
                    //
                    // Cada registro se presenta como una pequeña fila
                    // dentro de la celda: etiqueta a la izquierda y
                    // valor alineado a la derecha.

                    contenido =
                        registros

                            .map(r =>
                                `<div class="dato-celda">` +
                                    `<span class="dato-etiqueta">${escaparHTML(
                                        r[terceraDimension]
                                    )}</span>` +
                                    `<span class="dato-valor">${formatearValor(
                                        r.Valor
                                    )}</span>` +
                                `</div>`
                            )

                            .join("");
                }


                html +=
                    `<td>${contenido}</td>`;
            }
        );


        html += "</tr>";
    });


    html +=
        "</tbody></table>";


    tablaElemento.innerHTML = html;


    resumenElemento.textContent =

        `${filtrados.length} registros · ` +

        `${anios.length} año(s) · ` +

        `${bibliotecasCompatibles.length} biblioteca(s) · ` +

        `${indicadores.length} indicador(es)`;


    datosActuales =
        filtrados;

    prepararVisualizaciones();

    botonDescargar.disabled = false;
}



/* =========================================================
   FORMATO
   ========================================================= */


function formatearValor(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return "";
    }


    const texto =
        String(valor).trim();


    let normalizado =
        texto;


    if (
        texto.includes(",") &&
        !texto.includes(".")
    ) {

        normalizado =
            texto.replace(",", ".");
    }


    const numero =
        Number(normalizado);


    if (
        Number.isNaN(numero)
    ) {

        return escaparHTML(texto);
    }


    return numero.toLocaleString(
        "es-ES",
        {
            maximumFractionDigits: 4
        }
    );
}



function escaparHTML(texto) {

    return String(texto)

        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}



/* =========================================================
   DESCARGA
   ========================================================= */


document
    .getElementById("descargar")
    .addEventListener(
        "click",
        descargarCSV
    );



function escaparCSV(valor) {

    const texto =
        valor === null ||
        valor === undefined
            ? ""
            : String(valor);


    if (
        texto.includes(";") ||
        texto.includes('"') ||
        texto.includes("\n") ||
        texto.includes("\r")
    ) {

        return '"' +
            texto.replaceAll(
                '"',
                '""'
            ) +
            '"';
    }


    return texto;
}



function descargarCSV() {

    if (!datosActuales.length) {

        alert(
            "No hay datos seleccionados para descargar."
        );

        return;
    }


    const cabeceras = [

        "Anio",
        "Biblioteca",
        "Eje",
        "Nombre_Eje",
        "Apartado",
        "Nombre_Apartado",
        "Codigo_REBIUN",
        "Codigo_Tecnico",
        "Indicador",
        "Valor"
    ];


    const lineas = [
        cabeceras.join(";")
    ];


    datosActuales.forEach(fila => {

        lineas.push(

            cabeceras
                .map(
                    c =>
                        escaparCSV(
                            fila[c]
                        )
                )
                .join(";")
        );
    });


    const contenido =
        "\uFEFF" +
        lineas.join("\r\n");


    const blob =
        new Blob(
            [contenido],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const enlace =
        document.createElement("a");


    enlace.href =
        url;


    enlace.download =
        "seleccion_rebiun.csv";


    document.body
        .appendChild(enlace);


    enlace.click();


    enlace.remove();


    URL.revokeObjectURL(url);
}






