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

const destacarBibliotecaEvolucionSelect =
    document.getElementById("destacar-biblioteca-evolucion");

let bibliotecaDestacadaEvolucion = "";

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

const botonesModoEvolucion = document.querySelectorAll("[data-modo-evolucion]");
let modoEvolucion = "absoluto";

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

const versionDatos = new URLSearchParams(window.location.search).get("v");
const sufijoVersionDatos = versionDatos === null
    ? ""
    : `?${new URLSearchParams({ v: versionDatos })}`;

Promise.all([

    fetch(`data/rebiun_real.csv${sufijoVersionDatos}`, { cache: "no-store" })
        .then(r => {

            if (!r.ok) {
                throw new Error("No se pudo cargar rebiun.csv");
            }

            return r.text();
        }),

    fetch(`data/bibliotecas_rebiun.csv${sufijoVersionDatos}`, { cache: "no-store" })
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
    });


    cargarFiltros();

    const indicadoresIniciales = document.querySelectorAll('input[name="indicadorCheck"]');
    indicadoresIniciales.forEach(input => {
        input.checked = input.value === "NUSUARIOPROP";
    });
    actualizarContadores();
    botonGenerar.disabled = false;
    generarTabla();
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
    let codigoEnSeleccion = false;


    datos.forEach(d => {

        if (
            d[campoCodigo] !==
            codigo
        ) {

            return;
        }


        if (conjuntoAnios?.has(d.Anio)) {
            codigoEnSeleccion = true;
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
                !codigoEnSeleccion && mejorHistorico
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
                    eje.nombre ? `${eje.codigo}. ${eje.nombre}` : `Eje ${eje.codigo}`;


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
                    apartado.nombre ? `${apartado.codigo} ${apartado.nombre}` : `Apartado ${apartado.codigo}`;


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
                    estadoSeleccionIndicadores.get(indicador.tecnico) === true;


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
    cerrarMenusDescarga();

    datosActuales = [];

    botonDescargar.disabled = true;

    selectorVistas.hidden = true;

    tablaElemento.hidden = true;
    document.getElementById("panel-tabla").hidden = false;

    evolucionElemento.hidden = true;

    comparacionElemento.hidden = true;
    document.getElementById("proyeccion").hidden = true;

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

        elemento.textContent = grupo === "indicadorCheck"
            ? `${seleccionados.length} ${seleccionados.length === 1 ? "indicador marcado" : "indicadores marcados"} · ${visibles.length} visibles en el catálogo`
            : `${seleccionados.length} seleccionados · ${visibles.length} visibles`;
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

        Codigo_Tecnico:
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


function obtenerValorGrafico(fila, normalizado) {
    const valor = obtenerNumeroValor(fila.Valor);
    if (!normalizado || valor === null) return valor;

    const denominador = indiceUsuariosPropios.get(fila.Codigo_Biblioteca_REBIUN)?.get(fila.Anio);
    return Number.isFinite(denominador) && denominador > 0
        ? valor / denominador
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
    const anterior = select.value;

    select.innerHTML = "";

    indicadores.forEach(indicador => {

        const opcion = document.createElement("option");
        opcion.value = indicador.Codigo_Tecnico;
        opcion.textContent =
            `${indicador.Codigo_REBIUN} ${indicador.Indicador}`;
        select.appendChild(opcion);
    });
    if (indicadores.some(indicador => indicador.Codigo_Tecnico === anterior)) {
        select.value = anterior;
    }
}


function activarVista(nombreVista) {

    if (!datosActuales.length) {
        return;
    }

    cerrarMenusDescarga();

    const paneles = {
        tabla: document.getElementById("panel-tabla"),

        evolucion: evolucionElemento,
        comparacion: comparacionElemento,
        proyeccion: document.getElementById("proyeccion")
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

    tablaElemento.hidden = nombreVista !== "tabla";

    if (nombreVista === "evolucion") {
        renderizarEvolucion();
    }

    if (nombreVista === "comparacion") {
        renderizarComparacion();
    }
    if (nombreVista === "proyeccion") renderizarProyeccion();
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

    rellenarSelectorIndicadores(indicadorProyeccion, indicadores);
    cargarBibliotecasProyeccion();

    reconstruirBibliotecasEvolucion();

    actualizarModoComparacion();
    reconstruirAniosComparacion();

    selectorVistas.hidden = false;
    activarVista("evolucion");
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


function calcularEscalaAgradable(maximoReal, divisionesObjetivo = 5) {

    if (!Number.isFinite(maximoReal) || maximoReal <= 0) {
        return { maximo: 1, paso: 0.2, divisiones: 5 };
    }

    const pasoBruto = maximoReal / divisionesObjetivo;
    const potencia = 10 ** Math.floor(Math.log10(pasoBruto));
    const proporcion = pasoBruto / potencia;
    const factor = proporcion <= 1
        ? 1
        : proporcion <= 2
            ? 2
            : proporcion <= 5
                ? 5
                : 10;
    const paso = factor * potencia;
    const divisiones = Math.ceil(maximoReal / paso);

    return {
        maximo: divisiones * paso,
        paso,
        divisiones
    };
}


function reconstruirBibliotecasEvolucion() {

    const codigoIndicador = indicadorEvolucionSelect.value;
    const bibliotecas = new Map();

    datosActuales
        .filter(fila =>
            fila.Codigo_Tecnico === codigoIndicador &&
            Number.isFinite(obtenerNumeroValor(fila.Valor))
        )
        .forEach(fila => {
            const codigo = fila.Codigo_Biblioteca_REBIUN;
            const meta = mapaBibliotecas.get(codigo);
            bibliotecas.set(codigo, {
                codigo,
                nombre: meta?.Biblioteca || fila.Biblioteca,
                siglas: meta?.Siglas || ""
            });
        });

    const opciones = [...bibliotecas.values()].sort((a, b) =>
        (a.siglas || a.nombre).localeCompare(
            b.siglas || b.nombre,
            "es",
            { sensitivity: "base", numeric: true }
        )
    );

    if (!bibliotecas.has(bibliotecaDestacadaEvolucion)) {
        bibliotecaDestacadaEvolucion = "";
    }

    destacarBibliotecaEvolucionSelect.innerHTML = "";
    const opcionNinguna = document.createElement("option");
    opcionNinguna.value = "";
    opcionNinguna.textContent = "Ninguna";
    destacarBibliotecaEvolucionSelect.appendChild(opcionNinguna);

    opciones.forEach(biblioteca => {
        const opcion = document.createElement("option");
        opcion.value = biblioteca.codigo;
        opcion.textContent = biblioteca.siglas
            ? `${biblioteca.nombre} · ${biblioteca.siglas}`
            : biblioteca.nombre;
        destacarBibliotecaEvolucionSelect.appendChild(opcion);
    });

    destacarBibliotecaEvolucionSelect.value =
        bibliotecaDestacadaEvolucion;
}


function actualizarContextoIndicador(vista, selector) {
    const nombre = selector.selectedOptions[0]?.textContent;
    const cantidad = selector.options.length;
    const contexto = document.getElementById("contexto-indicador-" + vista);
    contexto.textContent = nombre
        ? `Mostrando: ${nombre} · ${cantidad} ${cantidad === 1 ? "indicador" : "indicadores"} en la consulta`
        : "";
}


const formatoEvolucion = document.getElementById("formato-evolucion");
formatoEvolucion.addEventListener("change", renderizarEvolucion);

function renderizarBarrasEvolucion(filas, anios) {
    const biblioteca = bibliotecaDestacadaEvolucion;
    if (!biblioteca) {
        graficoEvolucionElemento.textContent = "Elige una biblioteca destacada para compararla con el grupo.";
        return;
    }

    const grupos = anios.map(anio => {
        const registros = filas.filter(fila => fila.Anio === anio);
        const promedio = calcularPromedioFilas(registros);
        const valores = registros.map(fila => obtenerNumeroValor(fila.Valor))
            .filter(Number.isFinite).sort((a, b) => a - b);
        const mitad = Math.floor(valores.length / 2);
        const mediana = !valores.length ? null : valores.length % 2
            ? valores[mitad]
            : (valores[mitad - 1] + valores[mitad]) / 2;
        const propio = registros.find(fila => fila.Codigo_Biblioteca_REBIUN === biblioteca);
        return { anio, cantidad: promedio.cantidad,
            valores: [obtenerNumeroValor(propio?.Valor), promedio.valor, mediana] };
    });
    const series = [mapaBibliotecas.get(biblioteca)?.Biblioteca || biblioteca, "Promedio del grupo", "Mediana del grupo"];
    const colores = ["#78368c", "#287f92", "#73912c"];
    const ancho = Math.max(640, anios.length * 94 + 110);
    const svg = crearSVG(ancho, 360, "Evolución anual de la biblioteca frente al promedio y la mediana del grupo");
    const valores = grupos.flatMap(grupo => grupo.valores).filter(Number.isFinite);
    const minimo = Math.min(0, ...valores);
    const maximo = Math.max(0, ...valores);
    const { paso } = calcularEscalaAgradable(maximo - minimo);
    const inicio = Math.floor(minimo / paso);
    const fin = Math.max(inicio + 1, Math.ceil(maximo / paso));
    const y = valor => 288 - (valor / paso - inicio) * 260 / (fin - inicio);
    const anchoGrupo = (ancho - 110) / grupos.length;
    const anchoBarra = Math.min(28, (anchoGrupo - 18) / 3);
    for (let i = inicio; i <= fin; i += 1) {
        const marca = i * paso;
        agregarElementoSVG(svg, "line", { x1: 86, x2: ancho - 20, y1: y(marca), y2: y(marca), class: i === 0 ? "grafico-eje" : "grafico-guia" });
        agregarElementoSVG(svg, "text", { x: 78, y: y(marca) + 4, "text-anchor": "end", class: "grafico-texto" }, formatearValor(marca));
    }

    const datos = document.createElement("details");
    const resumen = document.createElement("summary");
    resumen.textContent = "Ver valores por año";
    const lista = document.createElement("ul");
    grupos.forEach(({ anio, cantidad, valores }, indice) => {
        const centro = 86 + (indice + .5) * anchoGrupo;
        valores.forEach((valor, i) => {
            if (!Number.isFinite(valor)) return;
            const barra = agregarElementoSVG(svg, "rect", {
                x: centro + (i - 1.5) * anchoBarra + 1,
                y: Math.min(y(0), y(valor)) - (valor === 0 ? 1 : 0),
                width: anchoBarra - 2, height: Math.max(1, Math.abs(y(valor) - y(0))),
                fill: colores[i],
                "data-valor-exportacion": formatearValor(valor)
            });
            agregarElementoSVG(barra, "title", {}, `${anio} · ${series[i]}: ${formatearValor(valor)} · ${cantidad} bibliotecas con dato`);
        });
        agregarElementoSVG(svg, "text", { x: centro, y: 310, "text-anchor": "middle", class: "grafico-texto" }, anio);
        agregarElementoSVG(svg, "text", { x: centro, y: 330, "text-anchor": "middle", class: "grafico-texto" }, `n = ${cantidad}`);
        const item = document.createElement("li");
        item.textContent = `${anio} · ${cantidad} bibliotecas con dato · ` + valores.map((valor, i) =>
            `${series[i]}: ${Number.isFinite(valor) ? formatearValor(valor, i ? 2 : 0) : "Sin dato"}`).join(" · ");
        lista.append(item);
    });
    datos.append(resumen, lista);
    const leyenda = document.createElement("div");
    leyenda.className = "grafico-leyenda";
    series.forEach((nombre, i) => {
        const item = document.createElement("span");
        item.className = "grafico-leyenda-item";
        const muestra = document.createElement("span");
        muestra.className = "grafico-leyenda-color";
        muestra.style.backgroundColor = colores[i];
        const etiqueta = document.createElement("span");
        etiqueta.textContent = nombre;
        item.append(muestra, etiqueta);
        leyenda.append(item);
    });
    graficoEvolucionElemento.append(svg, leyenda, datos);
}

function renderizarEvolucion() {

    document.getElementById("titulo-grafico-evolucion").textContent =
        "Evolución · " + (indicadorEvolucionSelect.selectedOptions[0]?.textContent || "Indicador");
    actualizarContextoIndicador("evolucion", indicadorEvolucionSelect);

    mostrarPromedioEvolucion.disabled = formatoEvolucion.value === "barras";
    mostrarPromedioEvolucion.closest("label").hidden = mostrarPromedioEvolucion.disabled;
    const codigo = indicadorEvolucionSelect.value;
    const indicadorPropio = codigo === "NUSUARIOPROP";
    if (indicadorPropio) modoEvolucion = "absoluto";
    const normalizado = modoEvolucion === "por-usuario";

    botonesModoEvolucion.forEach(boton => {
        const activo = boton.dataset.modoEvolucion === modoEvolucion;
        boton.disabled = indicadorPropio && boton.dataset.modoEvolucion === "por-usuario";
        boton.classList.toggle("activo", activo);
        boton.setAttribute("aria-pressed", String(activo));
    });

    const filasIndicador = datosActuales.filter(fila => fila.Codigo_Tecnico === codigo);
    const filas = normalizado
        ? filasIndicador.map(fila => ({ ...fila, Valor: obtenerValorGrafico(fila, true) }))
        : filasIndicador;
    const anios = [
        ...new Set(datosActuales.map(fila => fila.Anio))
    ].sort((a, b) => Number(a) - Number(b));
    const bibliotecas = [
        ...new Set(filas.map(fila => fila.Biblioteca))
    ].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
    const valores = filas
        .map(fila => obtenerNumeroValor(fila.Valor))
        .filter(Number.isFinite);

    const conDato = filas.filter(fila => Number.isFinite(obtenerNumeroValor(fila.Valor)));
    const cantidadBibliotecas = new Set(conDato.map(fila => fila.Codigo_Biblioteca_REBIUN)).size;
    const periodo = anios.length > 1 ? `${anios[0]}–${anios.at(-1)}` : anios[0];
    document.getElementById("cobertura-evolucion").textContent = cantidadBibliotecas
        ? `${periodo} · ${cantidadBibliotecas} ${cantidadBibliotecas === 1 ? "biblioteca" : "bibliotecas"} con dato${normalizado ? " · Por persona usuaria propia" : ""}`
        : "";

    graficoEvolucionElemento.innerHTML = "";
    const ultimoAnio = anios.at(-1);
    mostrarMetricas("evolucion", ultimoAnio, filas.filter(f => f.Anio === ultimoAnio).map(f => ({
        codigoBiblioteca: f.Codigo_Biblioteca_REBIUN, valor: obtenerNumeroValor(f.Valor)
    })).filter(f => Number.isFinite(f.valor)), bibliotecaDestacadaEvolucion);

    if (!codigo || !anios.length || !valores.length) {
        graficoEvolucionElemento.innerHTML =
            '<div class="mensaje">No existen datos numéricos suficientes para mostrar la evolución.</div>';
        return;
    }

    if (formatoEvolucion.value === "barras") {
        renderizarBarrasEvolucion(filas, obtenerSeleccionados("anioCheck").sort());
        return;
    }

    const ancho = 900;
    const alto = 430;
    const margen = { superior: 25, derecha: 155, inferior: 55, izquierda: 80 };
    const anchoUtil = ancho - margen.izquierda - margen.derecha;
    const altoUtil = alto - margen.superior - margen.inferior;
    const maximo = Math.max(...valores, 0);
    const escala = calcularEscalaAgradable(maximo);
    const escalaMaxima = escala.maximo;
    const x = anio =>
        margen.izquierda +
        (anios.length === 1
            ? anchoUtil / 2
            : anios.indexOf(anio) * anchoUtil / (anios.length - 1));
    const y = valor =>
        margen.superior + altoUtil - valor * altoUtil / escalaMaxima;
    const svg = crearSVG(ancho, alto, "Gráfico de evolución por biblioteca");

    for (let i = 0; i <= escala.divisiones; i += 1) {
        const valor = escala.paso * i;
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

    const puntosInformativos = [];
    bibliotecas.forEach(biblioteca => {
        const filaBiblioteca = filas.find(fila => fila.Biblioteca === biblioteca);
        const codigoBiblioteca = filaBiblioteca.Codigo_Biblioteca_REBIUN;
        const nombreCompleto = mapaBibliotecas.get(codigoBiblioteca)?.Biblioteca || biblioteca;
        const destacada = codigoBiblioteca === bibliotecaDestacadaEvolucion;
        const colorSerie = destacada ? "#14636a" : "#879ba5";
        const opacidadSerie = destacada ? 1 : 0.72;
        const filasBiblioteca = new Map(filas
            .filter(fila => fila.Biblioteca === biblioteca)
            .map(fila => [fila.Anio, fila]));
        const mapa = new Map([...filasBiblioteca].map(([anio, fila]) =>
            [anio, obtenerNumeroValor(fila.Valor)]));
        let puntosSegmento = [];

        const dibujarSegmento = () => {
            if (puntosSegmento.length > 1) {
                agregarElementoSVG(svg, "polyline", {
                    points: puntosSegmento.join(" "),
                    fill: "none",
                    stroke: colorSerie,
                    "stroke-width": destacada ? 3.5 : 1.15,
                    opacity: opacidadSerie
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
            agregarElementoSVG(svg, "circle", {
                cx: x(anio),
                cy: y(valor),
                r: destacada ? 4.5 : 2.5,
                fill: colorSerie,
                stroke: "#fff",
                "stroke-width": 1,
                opacity: opacidadSerie,
                "data-valor-destacado": destacada ? formatearValor(valor) : ""
            });
            const fila = filasBiblioteca.get(anio);
            puntosInformativos.push({
                x: x(anio),
                y: y(valor),
                biblioteca: tituloGraficoBiblioteca(codigoBiblioteca, nombreCompleto),
                anio,
                indicador: fila.Indicador,
                valor: formatearValor(valor),
                destacada
            });
        });
        dibujarSegmento();

        if (!destacada) return;
        const ultimo = anios.findLast(anio => Number.isFinite(mapa.get(anio)));
        if (ultimo) {
            agregarElementoSVG(svg, "text", {
                x: x(ultimo) + 10, y: y(mapa.get(ultimo)) + 4,
                fill: colorSerie, "font-weight": 700, "font-size": 13
            }, `${mapaBibliotecas.get(codigoBiblioteca)?.Siglas || codigoBiblioteca} · ${formatearValor(mapa.get(ultimo))}`);
        }
        const item = document.createElement("span");
        item.className = "grafico-leyenda-item destacada";
        item.innerHTML =
            `<span class="grafico-leyenda-color" style="background:${colorSerie}"></span>` +
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

    agregarInfoPuntosEvolucion(svg, puntosInformativos);
    graficoEvolucionElemento.appendChild(svg);
    graficoEvolucionElemento.appendChild(leyenda);
}



function agregarInfoPuntosEvolucion(svg, puntos) {
    const ficha = document.createElement("div");
    ficha.className = "ficha-punto-evolucion";
    ficha.hidden = true;
    ficha.setAttribute("aria-hidden", "true");
    graficoEvolucionElemento.appendChild(ficha);
    const capa = agregarElementoSVG(svg, "g", { class: "puntos-interactivos" });
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-label", "Gráfico de evolución. Usa las flechas para recorrer los puntos.");

    const controles = puntos.map((punto, indice) => {
        const { biblioteca, anio, indicador, valor } = punto;
        const control = agregarElementoSVG(capa, "circle", {
            cx: punto.x, cy: punto.y, r: 7,
            class: "punto-evolucion",
            tabindex: indice === 0 ? 0 : -1,
            "aria-label": `${biblioteca}, ${anio}. ${indicador}: ${valor}`
        });

        const mostrar = () => {
            const titulo = document.createElement("strong");
            titulo.textContent = biblioteca;
            const detalle = document.createElement("span");
            detalle.textContent = `${anio} · ${indicador}`;
            const cifra = document.createElement("strong");
            cifra.textContent = valor;
            ficha.replaceChildren(titulo, detalle, cifra);
            ficha.hidden = false;
            const rect = control.getBoundingClientRect();
            ficha.style.left = Math.max(8, Math.min(rect.left + 12,
                document.documentElement.clientWidth - ficha.offsetWidth - 8)) + "px";
            ficha.style.top = (rect.top >= ficha.offsetHeight + 8
                ? rect.top - ficha.offsetHeight - 6
                : rect.bottom + 6) + "px";
        };
        control.addEventListener("pointerenter", mostrar);
        control.addEventListener("pointerleave", () => {
            if (document.activeElement !== control) ficha.hidden = true;
        });
        control.addEventListener("focus", mostrar);
        control.addEventListener("blur", () => { ficha.hidden = true; });
        control.addEventListener("keydown", evento => {
            if (evento.key === "Escape") ficha.hidden = true;
            const paso = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[evento.key];
            if (!paso) return;
            evento.preventDefault();
            control.tabIndex = -1;
            const siguiente = controles[(indice + paso + controles.length) % controles.length];
            siguiente.tabIndex = 0;
            siguiente.focus();
        });
        return control;
    });
    puntos.forEach((punto, indice) => {
        if (punto.destacada) capa.appendChild(controles[indice]);
    });
}

function renderizarComparacion() {

    document.getElementById("titulo-grafico-comparacion").textContent =
        "Comparación · " + (indicadorComparacionSelect.selectedOptions[0]?.textContent || "Indicador");
    actualizarContextoIndicador("comparacion", indicadorComparacionSelect);

    const codigo = indicadorComparacionSelect.value;
    const anio = anioComparacionActivo;
    const normalizado = modoComparacion === "por-usuario";
    const barras = datosActuales
        .filter(fila =>
            fila.Codigo_Tecnico === codigo &&
            fila.Anio === anio
        )
        .map(fila => ({
            biblioteca: fila.Biblioteca,
            codigoBiblioteca: fila.Codigo_Biblioteca_REBIUN,
            valor: obtenerValorGrafico(fila, normalizado)
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

    const anterior = destacarComparacion.value;
    destacarComparacion.replaceChildren(new Option("Ninguna", ""), ...barras.map(barra =>
        new Option(barra.titulo, barra.codigoBiblioteca)));
    destacarComparacion.value = barras.some(b => b.codigoBiblioteca === anterior) ? anterior : "";
    mostrarMetricas("comparacion", anio, barras, destacarComparacion.value);

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
    const maximoReal = Math.max(...barras.map(barra => barra.valor), 0) || 1;
    const escalaVertical = calcularEscalaAgradable(maximoReal);
    const maximo = vertical ? escalaVertical.maximo : maximoReal;
    const svg = crearSVG(ancho, alto, "Gráfico de comparación entre bibliotecas");

    const puesto = obtenerPuestos(barras);
    const colorBarra = barra => barra.codigoBiblioteca === destacarComparacion.value ? "#14636a" : "#7896a8";
    if (vertical) {
        svg.style.width = `${ancho}px`;
        const paso = anchoUtil / barras.length;
        const anchoBarra = Math.min(48, paso * 0.68);
        const rotarEtiquetas = barras.some(barra => barra.etiqueta.length > 12);

        for (let indice = 0; indice <= escalaVertical.divisiones; indice += 1) {
            const valor = escalaVertical.paso * indice;
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
            }, formatearValor(valor));
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
                fill: colorBarra(barra)
            });
            const titulo = document.createElementNS(
                "http://www.w3.org/2000/svg", "title"
            );
            titulo.textContent =
                `${barra.titulo}\n${anio}\nValor: ${formatearValor(barra.valor)}`;
            rect.appendChild(titulo);
            agregarElementoSVG(svg, "text", {
                x: centroX,
                y: Math.max(22, posicionY - 7),
                "text-anchor": "middle",
                class: "grafico-texto valor-barra-comparacion"
            }, formatearValor(barra.valor));
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
        const destacada = barra.codigoBiblioteca === destacarComparacion.value;
        if (destacada) {
            agregarElementoSVG(svg, "rect", {
                x: 0, y: posicionY, width: ancho, height: altoFila, fill: "#e2f1f1"
            });
        }

        agregarElementoSVG(svg, "text", {
            x: margen.izquierda - 8,
            y: posicionY + 17,
            "text-anchor": "end",
            class: "grafico-texto grafico-etiqueta-barra",
            "font-weight": destacada ? 700 : 400
        }, `${puesto.get(barra.codigoBiblioteca)}. ${barra.etiqueta}`);
        const rect = agregarElementoSVG(svg, "rect", {
            x: margen.izquierda,
            y: posicionY + 3,
            width: Math.max(0, anchoBarra),
            height: 18,
            fill: colorBarra(barra)
        });
        const titulo = document.createElementNS(
            "http://www.w3.org/2000/svg", "title"
        );
        titulo.textContent =
            `${barra.titulo}\n${anio}\nValor: ${formatearValor(barra.valor)}`;
        rect.appendChild(titulo);
        agregarElementoSVG(svg, "text", {
            x: margen.izquierda + anchoBarra + 7,
            y: posicionY + 17,
            class: "grafico-texto valor-barra-comparacion"
        }, formatearValor(barra.valor));
    });
    }

    const promedio = calcularPromedioFilas(
        barras.map(barra => ({ Valor: barra.valor }))
    );

    if (mostrarPromedioComparacion.checked && Number.isFinite(promedio.valor)) {
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
                ? margen.izquierda + anchoUtil - 6
                : posicionPromedio + (etiquetaALaDerecha ? 6 : -6),
            y: vertical ? Math.max(18, posicionPromedio - 6) : 12,
            "text-anchor": vertical
                ? "end"
                : etiquetaALaDerecha ? "start" : "end",
            class: "grafico-texto grafico-etiqueta-promedio",
            fill: colorPromedio
        }, `Promedio de bibliotecas seleccionadas: ${formatearValor(promedio.valor)}`);
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


function obtenerContenedorGrafico(tipoVista) {
    return document.getElementById("grafico-" + tipoVista);
}

function incluirValoresExportacion(tipoVista) {
    return document.getElementById(`valores-exportacion-${tipoVista}`).checked;
}

function distribuirEtiquetasExportacion(svg, etiquetas, margenInferior) {
    const [, , ancho, alto] = svg.getAttribute("viewBox").split(/\s+/).map(Number);
    const medida = document.createElement("canvas").getContext("2d");
    medida.font = "600 10px Arial, sans-serif";
    const colocadas = [];

    etiquetas.sort((a, b) => a.x - b.x).forEach(({ x, y, valor, etiqueta }, indice) => {
        const mitad = Math.ceil(medida.measureText(valor).width / 2) + 3;
        const centro = Math.max(mitad + 4, Math.min(ancho - mitad - 4, x));
        const direcciones = indice % 2 ? [1, -1] : [-1, 1];
        const base = alto - margenInferior;
        for (let distancia = 0; distancia <= alto; distancia += 14) {
            for (const direccion of direcciones) {
                const linea = y + (direccion < 0 ? -9 - distancia : 17 + distancia);
                const caja = { izquierda: centro - mitad, derecha: centro + mitad, arriba: linea - 11, abajo: linea + 3 };
                if (caja.arriba < 2 || caja.abajo > base || colocadas.some(otra =>
                    caja.izquierda < otra.derecha && caja.derecha > otra.izquierda &&
                    caja.arriba < otra.abajo && caja.abajo > otra.arriba
                )) continue;

                if (etiqueta) {
                    etiqueta.removeAttribute("hidden");
                    etiqueta.setAttribute("x", centro);
                    etiqueta.setAttribute("y", linea);
                    etiqueta.classList.add("valor-exportacion");
                } else {
                    agregarElementoSVG(svg, "text", {
                        x: centro, y: linea, "text-anchor": "middle", class: "valor-exportacion"
                    }, valor);
                }
                colocadas.push(caja);
                return;
            }
        }
        etiqueta?.remove();
    });
}

function rotularValoresExportacion(svg, tipoVista) {
    if (!incluirValoresExportacion(tipoVista)) {
        svg.querySelectorAll(".valor-barra-comparacion").forEach(etiqueta => etiqueta.remove());
        return;
    }

    const destacados = [...svg.querySelectorAll('[data-valor-destacado]:not([data-valor-destacado=""])')];
    // La gráfica de líneas ya etiqueta el último punto destacado.
    const puntos = destacados.length <= 5 ? destacados.slice(0, -1) : [];
    puntos.push(...svg.querySelectorAll("circle[data-valor-observado], circle[data-valor-exportacion]"));
    const etiquetas = puntos.map(punto => ({
        x: Number(punto.getAttribute("cx")),
        y: Number(punto.getAttribute("cy")),
        valor: punto.dataset.valorObservado ?? punto.dataset.valorExportacion ?? punto.dataset.valorDestacado
    }));
    if (tipoVista === "comparacion" && orientacionComparacionSelect.value === "vertical") {
        etiquetas.push(...[...svg.querySelectorAll(".valor-barra-comparacion")].map(etiqueta => ({
            x: Number(etiqueta.getAttribute("x")),
            y: Number(etiqueta.getAttribute("y")) + 7,
            valor: etiqueta.textContent, etiqueta
        })));
    }
    distribuirEtiquetasExportacion(svg, etiquetas, tipoVista === "comparacion" ? 145 : 35);

    for (const marca of svg.querySelectorAll("rect[data-valor-exportacion]")) {
        const valor = marca.dataset.valorExportacion;
        const x = Number(marca.getAttribute("x")) + Number(marca.getAttribute("width")) / 2;
        const y = Number(marca.getAttribute("y"));
        const dentro = Number(marca.getAttribute("height")) > valor.length * 6 + 12;
        const origen = y + (dentro ? 6 : -4);
        agregarElementoSVG(svg, "text", {
            x, y: origen, transform: `rotate(-90 ${x} ${origen})`,
            "text-anchor": dentro ? "end" : "start",
            "dominant-baseline": "central",
            class: dentro ? "valor-exportacion valor-exportacion-interior" : "valor-exportacion"
        }, valor);
    }
}

function periodoExportacion(tipoVista) {
    if (tipoVista === "comparacion") {
        return `${anioComparacionActivo}${modoComparacion === "por-usuario" ? " · Por persona usuaria propia" : ""}`;
    }
    const anios = obtenerSeleccionados("anioCheck").sort();
    const periodo = anios.join(", ");
    return tipoVista === "evolucion" && modoEvolucion === "por-usuario"
        ? `${periodo} · Por persona usuaria propia`
        : periodo;
}

function svgExportable(tipoVista) {

    const contenedor = obtenerContenedorGrafico(tipoVista);
    const original = contenedor.querySelector("svg");

    if (!original) {
        return null;
    }

    const clon = original.cloneNode(true);
    clon.querySelector(".puntos-interactivos")?.remove();
    rotularValoresExportacion(clon, tipoVista);
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
        ".valor-exportacion{fill:#142841;font:600 10px Arial,sans-serif;paint-order:stroke;stroke:#fff;stroke-width:2px;stroke-linejoin:round}" +
        ".valor-exportacion-interior{fill:#fff;stroke:none}" +
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
                circulo.setAttribute(
                    "opacity",
                    item.classList.contains("atenuada") ? "0.45" : "1"
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
            if (item.classList.contains("atenuada")) {
                texto.setAttribute("opacity", "0.45");
            }
            if (item.classList.contains("destacada")) {
                texto.setAttribute("font-weight", "600");
            }
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

    if (tipoVista === "proyeccion") {
        alto = integrarContextoProyeccionPNG(clon, ancho, alto);
    } else {
        const indicador = document.getElementById("indicador-" + tipoVista);
        const nombreIndicador = indicador.selectedOptions[0]?.textContent || "";
        agregarElementoSVG(clon, "text", {
            x: 16, y: alto + 19, class: "grafico-texto"
        }, nombreIndicador);
        agregarElementoSVG(clon, "text", {
            x: 16, y: alto + 37, class: "grafico-texto"
        }, `${periodoExportacion(tipoVista)} · Fuente: Estadísticas REBIUN`);
        alto += 48;
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


function integrarContextoProyeccionPNG(svg, ancho, alto) {
    const trazado = agregarElementoSVG(svg, "g", { class: "trazado-proyeccion-exportado" });
    for (const elemento of [...svg.children]) {
        if (elemento !== trazado && elemento.localName !== "style") trazado.append(elemento);
    }

    let cursor = 26;
    const medida = document.createElement("canvas").getContext("2d");
    const escribir = (contenido, tamano, peso = 400) => {
        medida.font = `${peso} ${tamano}px Arial, sans-serif`;
        let linea = "";
        const dibujar = texto => {
            agregarElementoSVG(svg, "text", {
                x: 24, y: cursor, fill: "#142841", "font-family": "Arial, sans-serif",
                "font-size": tamano, "font-weight": peso
            }, texto);
            cursor += tamano + 6;
        };
        for (const palabra of contenido.split(/\s+/)) {
            const candidata = linea ? `${linea} ${palabra}` : palabra;
            if (linea && medida.measureText(candidata).width > ancho - 48) {
                dibujar(linea);
                linea = palabra;
            } else {
                linea = candidata;
            }
        }
        if (linea) dibujar(linea);
    };

    const indicador = indicadorProyeccion.selectedOptions[0]?.textContent || "";
    const biblioteca = bibliotecaProyeccion.selectedOptions[0]?.textContent || "";
    const metodo = metodoProyeccion.selectedOptions[0]?.textContent || "";
    escribir(`Proyección · ${indicador}`, 18, 700);
    escribir(`${biblioteca} · ${metodo}`, 13);
    escribir(document.getElementById("resultado-proyeccion").dataset.estimacion, 13, 700);
    escribir(`Línea vertical: último año observado · Línea discontinua: proyección · Banda: intervalo estimado del ${nivelProyeccion.value} %`, 12);
    escribir("Fuente: Estadísticas REBIUN", 11);
    trazado.setAttribute("transform", `translate(0 ${cursor - 4})`);

    return alto + cursor - 4;
}


function nombreArchivoGrafico(tipoVista, extension) {

    const codigo = document.getElementById("indicador-" + tipoVista).value;
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
        const escala = Math.min(2, 4096 / Math.max(exportacion.ancho, exportacion.alto));
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

    const selectorIndicador = document.getElementById("indicador-" + tipoVista);
    const contenedor = obtenerContenedorGrafico(tipoVista);
    if (!contenedor.querySelector("svg")) return;
    const titulo = document.getElementById("pestana-" + tipoVista).textContent.trim();

    vistaImpresionGrafico.innerHTML = "";

    const encabezado = document.createElement("h1");
    encabezado.textContent = titulo;
    vistaImpresionGrafico.appendChild(encabezado);

    const metadatos = document.createElement("div");
    metadatos.className = "metadatos-impresion";
    metadatos.textContent =
        `Indicador: ${selectorIndicador.selectedOptions[0]?.textContent || ""} · ${periodoExportacion(tipoVista)}`;
    if (tipoVista === "proyeccion") {
        metadatos.textContent += ` · ${bibliotecaProyeccion.selectedOptions[0]?.textContent || ""}`;
    }
    vistaImpresionGrafico.appendChild(metadatos);

    if (tipoVista === "proyeccion") {
        for (const id of ["resultado-proyeccion", "banda-proyeccion", "rangos-proyeccion"].filter(id =>
            id !== "rangos-proyeccion" || incluirValoresExportacion(tipoVista))) {
            const detalle = document.getElementById(id).cloneNode(true);
            detalle.removeAttribute("id");
            vistaImpresionGrafico.appendChild(detalle);
        }
    }
    const copiaGrafico = contenedor.cloneNode(true);
    copiaGrafico.removeAttribute("id");
    copiaGrafico.querySelector(".puntos-interactivos")?.remove();
    rotularValoresExportacion(copiaGrafico.querySelector("svg"), tipoVista);
    const detalleAnual = copiaGrafico.querySelector("details");
    if (detalleAnual) {
        if (incluirValoresExportacion(tipoVista)) detalleAnual.open = true;
        else detalleAnual.remove();
    }
    vistaImpresionGrafico.appendChild(copiaGrafico);

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
        const vista = boton.dataset.menuDescarga;
        const grafico = obtenerContenedorGrafico(vista);
        const actualizarDisponibilidad = () => {
            boton.disabled = !grafico.querySelector("svg");
            boton.title = boton.disabled ? "No hay un gráfico para descargar" : "Descargar gráfico";
            if (boton.disabled && boton.getAttribute("aria-expanded") === "true") {
                cerrarMenusDescarga();
            }
        };
        new MutationObserver(actualizarDisponibilidad).observe(grafico, { childList: true });
        actualizarDisponibilidad();

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
    () => {
        reconstruirBibliotecasEvolucion();
        renderizarEvolucion();
    }
);

destacarBibliotecaEvolucionSelect.addEventListener(
    "change",
    () => {
        bibliotecaDestacadaEvolucion =
            destacarBibliotecaEvolucionSelect.value;
        renderizarEvolucion();
    }
);

mostrarPromedioEvolucion.addEventListener(
    "change",
    renderizarEvolucion
);

botonesModoEvolucion.forEach(boton => {
    boton.addEventListener("click", () => {
        modoEvolucion = boton.dataset.modoEvolucion;
        renderizarEvolucion();
    });
});

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
    () => {
        ordenComparacionSelect.value =
            orientacionComparacionSelect.value === "vertical"
                ? "desc"
                : "asc";
        renderizarComparacion();
    }
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


    tablaElemento.innerHTML = construirTabla(filtrados, campoFila, campoColumna);


    resumenElemento.textContent =

        `${filtrados.length} registros · ` +

        `${anios.length} año(s) · ` +

        `${bibliotecasCompatibles.length} biblioteca(s) · ` +

        `${indicadores.length} ${indicadores.length === 1 ? "indicador en la consulta" : "indicadores en la consulta"}`;


    datosActuales =
        filtrados;

    prepararVisualizaciones();

    botonDescargar.disabled = false;
}



function construirTabla(filtrados, campoFila, campoColumna) {
    const campoIndicador = "Codigo_Tecnico";
    const codigos = valoresUnicos(campoIndicador, filtrados);
    const etiquetas = new Map(codigos.map(codigo => {
        for (const anio of metadatosDatos.anios) {
            const indicador = metadatosDatos.indicadoresPorAnio.get(anio)?.get(codigo);
            if (indicador) {
                return [codigo, `${indicador.Codigo_REBIUN} ${indicador.Indicador}`];
            }
        }
        return [codigo, codigo];
    }));

    const terceraDimension = ["Biblioteca", "Anio", campoIndicador]
        .find(campo => campo !== campoFila && campo !== campoColumna);
    const rotulo = (campo, clave) => campo === campoIndicador ? etiquetas.get(clave) : clave;
    const comparar = (campo, a, b) =>
        rotulo(campo, a).localeCompare(rotulo(campo, b), "es", { numeric: true });
    const ordenar = (campo, claves) => claves.sort((a, b) => comparar(campo, a, b));

    const porFila = new Map();
    filtrados.forEach(registro => {
        const fila = registro[campoFila];
        const subfila = registro[terceraDimension];
        const columna = registro[campoColumna];

        if (!porFila.has(fila)) porFila.set(fila, new Map());
        const subfilas = porFila.get(fila);
        if (!subfilas.has(subfila)) subfilas.set(subfila, new Map());
        const celdas = subfilas.get(subfila);
        if (!celdas.has(columna)) celdas.set(columna, []);
        celdas.get(columna).push(registro);
    });

    const columnas = ordenar(campoColumna, valoresUnicos(campoColumna, filtrados));
    const cabeceras = [
        nombreDimension(campoFila),
        nombreDimension(terceraDimension),
        ...columnas.map(columna => rotulo(campoColumna, columna))
    ].map(texto => `<th scope="col">${escaparHTML(texto)}</th>`).join("");

    const cuerpo = ordenar(campoFila, [...porFila.keys()]).map(fila => {
        const subfilas = porFila.get(fila);
        const claves = ordenar(terceraDimension, [...subfilas.keys()]);
        const grupo = claves.map((clave, indice) => {
            const celdas = subfilas.get(clave);
            const valores = columnas.map(columna => {
                const registros = celdas.get(columna) || [];
                const contenido = registros.map(registro => formatearValor(registro.Valor))
                    .filter(valor => valor !== "").join("<br>");
                return contenido
                    ? `<td class="tabla-valor">${contenido}</td>`
                    : '<td class="tabla-valor tabla-sin-dato" aria-label="Sin dato">—</td>';
            }).join("");
            const rotuloGrupo = indice === 0
                ? `<th scope="rowgroup" rowspan="${claves.length}">${escaparHTML(rotulo(campoFila, fila))}</th>`
                : "";
            const rotuloFila = `<th scope="row">${escaparHTML(rotulo(terceraDimension, clave))}</th>`;
            return `<tr>${rotuloGrupo}${rotuloFila}${valores}</tr>`;
        }).join("");
        return `<tbody>${grupo}</tbody>`;
    }).join("");

    return `<table class="tabla-resultados"><thead><tr>${cabeceras}</tr></thead>${cuerpo}</table>`;
}


/* =========================================================
   FORMATO
   ========================================================= */


function formatearValor(valor, minimumFractionDigits = 0) {

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


    const magnitud = Math.abs(numero);
    const maximumFractionDigits = magnitud > 0 && magnitud < 0.005
        ? Math.max(3, Math.ceil(-Math.log10(magnitud)))
        : 2;
    return numero.toLocaleString("es-ES", {
        minimumFractionDigits,
        maximumFractionDigits: Math.min(maximumFractionDigits, 100),
        ...(maximumFractionDigits > 100 ? { notation: "scientific", maximumFractionDigits: 2 } : {})
    });
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








/* Controles de presentación de la prueba visual. */
const panelSeleccion = document.getElementById("panel-seleccion");
const alternarSeleccion = document.getElementById("alternar-seleccion");
const aplicarSeleccion = document.getElementById("aplicar-seleccion");

alternarSeleccion.addEventListener("click", () => {
    panelSeleccion.hidden = !panelSeleccion.hidden;
    const accion = panelSeleccion.hidden ? "Mostrar" : "Ocultar";
    alternarSeleccion.textContent = accion + " bibliotecas";
    alternarSeleccion.setAttribute("aria-expanded", String(!panelSeleccion.hidden));
    alternarSeleccion.setAttribute("aria-label", accion + " panel de bibliotecas");
});

document.querySelectorAll(".acordeon").forEach(boton => {
    boton.addEventListener("click", () => {
        const contenido = document.getElementById(boton.getAttribute("aria-controls"));
        contenido.hidden = !contenido.hidden;
        boton.setAttribute("aria-expanded", String(!contenido.hidden));
    });
});

function mostrarSeleccionActual() {
    const bibliotecas = obtenerSeleccionados("bibliotecaCheck").length;
    const anios = obtenerSeleccionados("anioCheck").sort();
    const indicadores = obtenerSeleccionados("indicadorCheck").length;
    const rango = anios.length > 1 ? anios[0] + "–" + anios.at(-1) + " · " : "";
    document.getElementById("detalle-bibliotecas").textContent = bibliotecas + " seleccionadas";
    document.getElementById("detalle-anios").textContent = rango + anios.length + " seleccionados";
    const resumen = bibliotecas + " bibliotecas · " + anios.length + " años · " +
        indicadores + (indicadores === 1 ? " indicador" : " indicadores");
    const barra = document.getElementById("seleccion-actual");
    if (barra.textContent !== resumen) {
        barra.textContent = resumen;
    }
    aplicarSeleccion.disabled = botonGenerar.disabled;
}

const cambiosSeleccion = new MutationObserver(mostrarSeleccionActual);
for (const grupo of ["bibliotecas", "anios", "indicadores"]) {
    cambiosSeleccion.observe(document.getElementById("contador-" + grupo), { childList: true });
}
cambiosSeleccion.observe(botonGenerar, { attributes: true, attributeFilter: ["disabled"] });
aplicarSeleccion.addEventListener("click", () => {
    botonGenerar.click();
    if (!selectorVistas.hidden) {
        document.getElementById("pestana-evolucion").focus();
    }
});


document.querySelectorAll("[data-menu]").forEach(menu => {
    const boton = document.querySelector(`[data-menu-descarga="${menu.dataset.menu}"]`);
    menu.addEventListener("keydown", evento => {
        if (evento.key === "Escape") {
            cerrarMenusDescarga();
            boton.focus();
        }
    });
    menu.addEventListener("click", evento => {
        evento.stopPropagation();
        if (evento.target.closest("[data-descarga]")) {
            boton.focus();
        }
    });
});

const destacarComparacion = document.getElementById("destacar-comparacion");
destacarComparacion.addEventListener("change", renderizarComparacion);

function obtenerPuestos(filas) {
    const porValor = [...filas].sort((a, b) => b.valor - a.valor);
    let puesto = 0;
    return new Map(porValor.map((fila, indice) => {
        if (indice === 0 || fila.valor !== porValor[indice - 1].valor) puesto = indice + 1;
        return [fila.codigoBiblioteca, puesto];
    }));
}

function mostrarMetricas(vista, anio, filas, destacada) {
    const contenedor = document.getElementById("metricas-" + vista);
    contenedor.replaceChildren();
    contenedor.hidden = !filas.length;
    if (!filas.length) return;
    const valores = filas.map(f => f.valor).sort((a, b) => a - b);
    const mitad = Math.floor(valores.length / 2);
    const mediana = valores.length % 2 ? valores[mitad] : (valores[mitad - 1] + valores[mitad]) / 2;
    const promedio = valores.reduce((total, valor) => total + valor, 0) / valores.length;
    const datos = [
        [`Bibliotecas con dato · ${anio}`, filas.length],
        [`Mediana · ${anio}`, formatearValor(mediana, 2)],
        [`Promedio · ${anio}`, formatearValor(promedio, 2)]
    ];
    const puesto = obtenerPuestos(filas).get(destacada);
    if (puesto) datos.push(["Posición de la destacada", `${puesto} de ${filas.length}`]);
    for (const [nombre, valor] of datos) {
        const item = document.createElement("div");
        const etiqueta = document.createElement("span");
        const cifra = document.createElement("strong");
        etiqueta.textContent = nombre;
        cifra.textContent = valor;
        item.append(etiqueta, cifra);
        contenedor.append(item);
    }
}

const indicadorProyeccion = document.getElementById("indicador-proyeccion");
const bibliotecaProyeccion = document.getElementById("biblioteca-proyeccion");
const periodoProyeccion = document.getElementById("periodo-proyeccion");
const horizonteProyeccion = document.getElementById("horizonte-proyeccion");
const nivelProyeccion = document.getElementById("nivel-proyeccion");
const metodoProyeccion = document.getElementById("metodo-proyeccion");

function cargarBibliotecasProyeccion() {
    const anterior = bibliotecaProyeccion.value;
    const bibliotecas = new Map(datosActuales
        .filter(fila => fila.Codigo_Tecnico === indicadorProyeccion.value)
        .map(fila => [fila.Codigo_Biblioteca_REBIUN, fila.Biblioteca]));
    bibliotecaProyeccion.replaceChildren(...[...bibliotecas]
        .sort((a, b) => a[1].localeCompare(b[1], "es", { numeric: true }))
        .map(([codigo, nombre]) => new Option(nombre, codigo)));
    if (bibliotecas.has(anterior)) bibliotecaProyeccion.value = anterior;
}

indicadorProyeccion.addEventListener("change", () => {
    cargarBibliotecasProyeccion();
    renderizarProyeccion();
});
for (const control of [bibliotecaProyeccion, periodoProyeccion, horizonteProyeccion, nivelProyeccion, metodoProyeccion]) {
    control.addEventListener("change", renderizarProyeccion);
}

function estimarProyeccion(puntos, anio, metodo) {
    if (metodo === "ultimo") return puntos.at(-1).valor;
    const centro = puntos[0].anio;
    const mediaX = puntos.reduce((suma, p) => suma + p.anio - centro, 0) / puntos.length;
    const mediaY = puntos.reduce((suma, p) => suma + p.valor, 0) / puntos.length;
    const sumas = puntos.reduce(([xy, xx], p) => {
        const x = p.anio - centro - mediaX;
        return [xy + x * (p.valor - mediaY), xx + x * x];
    }, [0, 0]);
    return mediaY + sumas[0] / sumas[1] * (anio - centro - mediaX);
}

// Cuantiles bilaterales de Student para las series anuales del prototipo.
const cuantilesProyeccion = {
    80: [3.078, 1.886, 1.638, 1.533, 1.476, 1.440, 1.415, 1.397, 1.383],
    95: [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262]
};

function calcularIntervaloProyeccion(puntos, metodo, nivel) {
    const n = puntos.length;
    const ultimo = puntos.at(-1).anio;
    const lineal = metodo === "lineal";
    const grados = n - (lineal ? 2 : 1);
    const cuantiles = cuantilesProyeccion[nivel];
    // Para series más largas, el último cuantil tabulado es conservador.
    const critico = cuantiles[Math.min(grados, cuantiles.length) - 1];

    if (!lineal) {
        const variacion = puntos.slice(1).reduce((suma, punto, i) => {
            const anterior = puntos[i];
            return suma + (punto.valor - anterior.valor) ** 2 / (punto.anio - anterior.anio);
        }, 0);
        return anio => critico * Math.sqrt(variacion / grados * (anio - ultimo));
    }

    const media = puntos.reduce((suma, punto) => suma + punto.anio, 0) / n;
    const dispersion = puntos.reduce((suma, punto) => suma + (punto.anio - media) ** 2, 0);
    const residuos = puntos.reduce((suma, punto) =>
        suma + (punto.valor - estimarProyeccion(puntos, punto.anio, metodo)) ** 2, 0);
    return anio => critico * Math.sqrt(residuos / grados *
        (1 + 1 / n + (anio - media) ** 2 / dispersion));
}

function validarProyeccion(serie, horizonte, ventana) {
    const pruebas = serie.map(punto => {
        const corte = punto.anio - horizonte;
        const previos = ventana(serie.filter(p => p.anio <= corte), corte);
        return { punto, corte, previos };
    }).filter(({ corte, previos }) => previos.length >= 3 && previos.at(-1).anio === corte);

    const errorMedio = metodo => pruebas.reduce((suma, { punto, previos }) =>
        suma + Math.abs(estimarProyeccion(previos, punto.anio, metodo) - punto.valor), 0) / pruebas.length;
    return { pruebas, errorMedio };
}

function renderizarProyeccion() {
    const resultado = document.getElementById("resultado-proyeccion");
    const grafico = document.getElementById("grafico-proyeccion");
    const validacion = document.getElementById("validacion-proyeccion");
    const calculo = document.getElementById("calculo-proyeccion");
    const explicacion = document.getElementById("explicacion-proyeccion");
    const intervalos = document.getElementById("intervalos-proyeccion");
    const detalleValidacion = document.getElementById("detalle-validacion-proyeccion");
    calculo.hidden = true;
    intervalos.hidden = true;
    detalleValidacion.textContent = "";
    const banda = document.getElementById("banda-proyeccion");
    const rangos = document.getElementById("rangos-proyeccion");
    grafico.replaceChildren();
    grafico.hidden = true;
    banda.hidden = true;
    rangos.replaceChildren();
    validacion.textContent = "";

    const serie = datosActuales.filter(fila =>
        fila.Codigo_Tecnico === indicadorProyeccion.value &&
        fila.Codigo_Biblioteca_REBIUN === bibliotecaProyeccion.value
    ).map(fila => ({ anio: Number(fila.Anio), valor: obtenerNumeroValor(fila.Valor) }))
        .filter(p => Number.isFinite(p.valor))
        .sort((a, b) => a.anio - b.anio);
    const corte = Math.max(...new Set(datosActuales.map(fila => Number(fila.Anio))));
    const ventana = (puntos, fin) => periodoProyeccion.value === "reciente"
        ? puntos.filter(p => p.anio >= fin - 3)
        : puntos;
    const puntos = ventana(serie, corte);
    if (puntos.length < 3 || puntos.at(-1)?.anio !== corte) {
        resultado.textContent = "Datos insuficientes. Se necesitan tres observaciones y un valor en el último año de la consulta.";
        return;
    }

    const horizonte = Number(horizonteProyeccion.value);
    const anio = corte + horizonte;
    const metodo = metodoProyeccion.value;
    const nivel = nivelProyeccion.value;
    const margen = calcularIntervaloProyeccion(puntos, metodo, nivel);
    const futuros = Array.from({ length: horizonte }, (_, i) => {
        const anio = corte + i + 1;
        const valor = estimarProyeccion(puntos, anio, metodo);
        const amplitud = margen(anio);
        return { anio, valor, inferior: valor - amplitud, superior: valor + amplitud };
    });
    const final = futuros.at(-1);
    resultado.dataset.estimacion = `Proyección ${anio}: ${formatearValor(final.valor)}`;
    resultado.textContent = `${resultado.dataset.estimacion} · Intervalo estimado del ${nivel} %: de ${formatearValor(final.inferior)} a ${formatearValor(final.superior)}`;
    intervalos.querySelector("summary").textContent = `Ver intervalos del ${nivel} % por año`;
    for (const p of futuros) {
        const item = document.createElement("li");
        item.textContent = `${p.anio}: de ${formatearValor(p.inferior)} a ${formatearValor(p.superior)}`;
        rangos.append(item);
    }

    const { pruebas, errorMedio } = validarProyeccion(serie, horizonte, ventana);
    const duracion = horizonte === 1 ? "1 año" : `${horizonte} años`;
    if (pruebas.length) {
        const casos = pruebas.length === 1 ? "1 prueba" : `${pruebas.length} pruebas`;
        const anios = pruebas.map(({ punto }) => punto.anio).join(", ");
        const error = pruebas.length === 1 ? "Error absoluto" : "Error absoluto medio";
        validacion.textContent = `${error} a ${duracion} · ${casos} (${anios}). ` +
            `Tendencia lineal: ${formatearValor(errorMedio("lineal"))} · Último valor observado: ${formatearValor(errorMedio("ultimo"))}. ` +
            "Los errores se expresan en las unidades del indicador.";
        const cortes = pruebas.map(({ punto, corte }) => `${punto.anio} con datos hasta ${corte}`).join("; ");
        detalleValidacion.textContent = `Se comparó cada estimación con el dato real: ${cortes}. El error absoluto mide la distancia entre ambos valores.`;
    } else {
        validacion.textContent = `No hay suficientes datos para hacer una prueba histórica a ${duracion}.`;
    }

    const minimo = Math.min(0, ...futuros.map(p => p.inferior), ...puntos.map(p => p.valor));
    const maximo = Math.max(0, ...futuros.map(p => p.superior), ...puntos.map(p => p.valor));
    const { paso } = calcularEscalaAgradable(maximo - minimo);
    const primeraMarca = Math.floor(minimo / paso);
    const ultimaMarca = Math.max(primeraMarca + 1, Math.ceil(maximo / paso));
    const x = anioPunto => 88 + (anioPunto - puntos[0].anio) * 740 / (anio - puntos[0].anio);
    const y = valorPunto => 275 - (valorPunto / paso - primeraMarca) * 242 / (ultimaMarca - primeraMarca);
    const svg = crearSVG(900, 320, resultado.textContent);
    for (let i = primeraMarca; i <= ultimaMarca; i += 1) {
        const marca = i * paso;
        agregarElementoSVG(svg, "line", { x1: 88, x2: 855, y1: y(marca), y2: y(marca), class: "grafico-guia" });
        agregarElementoSVG(svg, "text", { x: 78, y: y(marca) + 4, "text-anchor": "end", class: "grafico-texto" }, formatearValor(marca));
    }
    for (let n = puntos[0].anio; n <= anio; n += 1) {
        agregarElementoSVG(svg, "text", { x: x(n), y: 302, "text-anchor": "middle", class: "grafico-texto" }, String(n));
    }
    puntos.forEach((p, i) => {
        const anterior = puntos[i - 1];
        if (anterior?.anio === p.anio - 1) {
            agregarElementoSVG(svg, "line", { x1: x(anterior.anio), y1: y(anterior.valor), x2: x(p.anio), y2: y(p.valor), stroke: "#14636a", "stroke-width": 2.5 });
        }
        const punto = agregarElementoSVG(svg, "circle", {
            cx: x(p.anio), cy: y(p.valor), r: 4, fill: "#14636a",
            "data-valor-observado": formatearValor(p.valor)
        });
        agregarElementoSVG(punto, "title", {}, `${p.anio} · ${formatearValor(p.valor)}`);
    });
    agregarElementoSVG(svg, "line", {
        x1: x(corte), x2: x(corte), y1: 26, y2: 275,
        stroke: "#607887", "stroke-dasharray": "3 4"
    });
    const origen = `${x(corte)},${y(puntos.at(-1).valor)}`;
    const coordenada = (p, campo) => `${x(p.anio)},${y(p[campo])}`;
    agregarElementoSVG(svg, "polygon", {
        points: [origen, ...futuros.map(p => coordenada(p, "superior")),
            ...futuros.slice().reverse().map(p => coordenada(p, "inferior"))].join(" "),
        fill: "#aad9da", "fill-opacity": .65
    });
    agregarElementoSVG(svg, "polyline", {
        points: [origen, ...futuros.map(p => coordenada(p, "valor"))].join(" "),
        fill: "none", stroke: "#14636a", "stroke-width": 2.5, "stroke-dasharray": "6 5"
    });
    for (const p of futuros) {
        const punto = agregarElementoSVG(svg, "circle", {
            cx: x(p.anio), cy: y(p.valor), r: 5, fill: "#fff", stroke: "#14636a", "stroke-width": 2,
            "data-valor-exportacion": formatearValor(p.valor)
        });
        agregarElementoSVG(punto, "title", {}, `${p.anio} · ${formatearValor(p.valor)}. Intervalo: ${formatearValor(p.inferior)} a ${formatearValor(p.superior)}`);
    }
    banda.lastChild.textContent = ` La línea vertical marca el último año observado. La línea discontinua muestra la proyección. La banda sombreada indica el intervalo estimado del ${nivel} % para cada año. Los valores reales pueden quedar fuera.`;
    const referencia = `Se usan ${puntos.length} valores observados entre ${puntos[0].anio} y ${corte} para la biblioteca y el indicador elegidos.`;
    const estimacion = metodo === "lineal"
        ? "Se ajusta una recta a esos valores y se prolonga hacia los años futuros. La banda se calcula a partir de cuánto se alejaron los datos de esa recta."
        : `Cada año futuro toma el último valor observado (${formatearValor(puntos.at(-1).valor)}). La banda se calcula a partir de cuánto cambiaron los datos entre observaciones consecutivas.`;
    explicacion.textContent = `${referencia} ${estimacion} La banda suele ensancharse cuanto más lejos se proyecta.`;
    calculo.hidden = false;
    intervalos.hidden = false;
    banda.hidden = false;
    grafico.append(svg);
    grafico.hidden = false;
}

const mostrarPromedioComparacion = document.getElementById("mostrar-promedio-comparacion");
mostrarPromedioComparacion.addEventListener("change", renderizarComparacion);

document.querySelectorAll(".boton-opciones-grafico").forEach(boton => {
    const panel = document.getElementById(boton.getAttribute("aria-controls"));
    boton.addEventListener("click", () => {
        panel.hidden = !panel.hidden;
        boton.setAttribute("aria-expanded", String(!panel.hidden));
    });
});
