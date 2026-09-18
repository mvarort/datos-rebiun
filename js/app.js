let datos = [];
let metadatosBibliotecas = [];
let mapaBibliotecas = new Map();
let datosActuales = [];
let estadoSeleccionIndicadores = new Map();


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

const tablaElemento =
    document.getElementById("tabla");


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


    // CACHE_INDICADORES_POR_ANIO
    //
    // Para cada año conservamos una sola ficha por
    // Codigo_Tecnico, en lugar de repetirla una vez
    // por cada biblioteca.

    const indicadoresPorAnio =
        new Map();


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

                        Apartado:
                            d.Apartado,

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
                        codigo: d.Eje,
                        nombre: d.Nombre_Eje,
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


    apartados.forEach(apartado => {

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
            .get(apartado.eje)
            .push(apartado);
    });


    metadatosDatos = {

        // ANIOS_DESCENDENTES
        // Primero se muestran los datos más recientes.
        anios:
            [...anios].sort(
                (a, b) =>
                    b.localeCompare(
                        a,
                        "es",
                        { numeric: true }
                    )
            ),

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

    actualizarSegmentadoresInstitucionales();

    cargarEjes();

    cargarApartados();

    cargarIndicadores();

    cargarAnios();

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


function hayBibliotecasCompatibles(filtros) {

    return metadatosBibliotecas.some(b =>

        (!filtros.comunidad ||
            b.Comunidad_Autonoma === filtros.comunidad) &&

        (!filtros.modalidad ||
            b.Modalidad === filtros.modalidad) &&

        (!filtros.titularidad ||
            b.Titularidad === filtros.titularidad)
    );
}


function obtenerOpcionesInstitucionales(
    campoObjetivo,
    seleccion
) {

    const valores =
        metadatosBibliotecas

            .filter(b => {

                if (
                    campoObjetivo !== "Comunidad_Autonoma" &&
                    seleccion.comunidad &&
                    b.Comunidad_Autonoma !== seleccion.comunidad
                ) {
                    return false;
                }


                if (
                    campoObjetivo !== "Modalidad" &&
                    seleccion.modalidad &&
                    b.Modalidad !== seleccion.modalidad
                ) {
                    return false;
                }


                if (
                    campoObjetivo !== "Titularidad" &&
                    seleccion.titularidad &&
                    b.Titularidad !== seleccion.titularidad
                ) {
                    return false;
                }


                return true;
            })

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
            titularidadSelect.value
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
        titularidad: ""
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
        "titularidad"
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
                    a.Biblioteca.localeCompare(
                        b.Biblioteca,
                        "es"
                    )
            );

    bibliotecasOrdenadas.forEach(meta => {

        const label =
            document.createElement("label");

        label.className =
            "opcion-check";

        label.dataset.busqueda =
            normalizarBusqueda(
                meta.Biblioteca
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

        // El usuario sigue viendo el nombre de la institución.
        span.textContent =
            meta.Biblioteca;

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

            label.style.display =
                (
                    coincideNombre &&
                    coincideComunidad &&
                    coincideModalidad &&
                    coincideTitularidad
                )
                    ? "flex"
                    : "none";
        });

    actualizarContadores();
}

/* =========================================================
   EJES
   ========================================================= */


function cargarEjes() {

    const ejes =
        metadatosDatos.ejes.map(
            eje => eje.codigo
        );


    ejeSelect.innerHTML =
        '<option value="">Todos los ejes</option>';


    ejes.forEach(eje => {

        const registro =
            metadatosDatos
                .ejesPorCodigo
                .get(eje);


        const opcion =
            document.createElement("option");


        opcion.value =
            eje;


        opcion.textContent =
            `${eje}. ${registro.nombre}`;


        ejeSelect.appendChild(opcion);
    });
}



/* =========================================================
   APARTADOS
   ========================================================= */


function cargarApartados() {

    const apartados =
        ejeSelect.value
            ? (
                metadatosDatos
                    .apartadosPorEje
                    .get(
                        ejeSelect.value
                    ) || []
            )
            : metadatosDatos.apartados;


    const mapa =
        new Map(
            apartados.map(
                apartado => [
                    apartado.codigo,
                    apartado.nombre
                ]
            )
        );


    apartadoSelect.innerHTML =
        '<option value="">Todos los apartados</option>';


    [...mapa.entries()]

        .sort(
            (a, b) =>
                a[0].localeCompare(
                    b[0],
                    "es",
                    { numeric: true }
                )
        )

        .forEach(
            ([codigo, nombre]) => {

                const opcion =
                    document.createElement(
                        "option"
                    );


                opcion.value =
                    codigo;


                opcion.textContent =
                    `${codigo} ${nombre}`;


                apartadoSelect
                    .appendChild(opcion);
            }
        );
}



/* =========================================================
   INDICADORES
   ========================================================= */


function cargarIndicadores() {

    document
        .querySelectorAll(
            '#lista-indicadores input[name="indicadorCheck"]'
        )
        .forEach(input => {

            estadoSeleccionIndicadores.set(
                input.value,
                input.checked
            );
        });

    // ETIQUETAS_INDICADORES_POR_ANIO
    //
    // Codigo_Tecnico es la identidad longitudinal estable.
    // La etiqueta visible se toma del año más reciente
    // entre los años actualmente seleccionados.
    //
    // La fuente ya no son los 65.000+ registros,
    // sino el índice compacto de indicadores por año.

    const aniosSeleccionados =
        obtenerSeleccionados(
            "anioCheck"
        );


    const aniosFuente =
        aniosSeleccionados.length > 0
            ? aniosSeleccionados
            : metadatosDatos.anios;


    let fuente = [];


    aniosFuente.forEach(anio => {

        const indicadoresAnio =
            metadatosDatos
                .indicadoresPorAnio
                .get(anio);


        if (indicadoresAnio) {

            fuente.push(
                ...indicadoresAnio.values()
            );
        }
    });


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


    fuente.forEach(d => {

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
            anioActual > anioExistente
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
    });


    const contenedor =
        document.getElementById(
            "lista-indicadores"
        );


    contenedor.innerHTML = "";


    [...mapa.values()]

        .sort(
            (a, b) =>
                a.codigo.localeCompare(
                    b.codigo,
                    "es",
                    { numeric: true }
                )
        )

        .forEach(indicador => {

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


            label.appendChild(input);

            label.appendChild(span);

            contenedor.appendChild(label);
        });


    aplicarBusquedaIndicadores();

    actualizarContadores();
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




/* =========================================================
   ACTUALIZACIÓN DE ETIQUETAS SEGÚN AÑOS
   ========================================================= */

document
    .getElementById("lista-anios")
    .addEventListener(
        "change",
        () => {

            cargarIndicadores();

            actualizarContadores();

            invalidarDatosActuales();
        }
    );


document
    .getElementById("todos-anios")
    .addEventListener(
        "click",
        () => {

            cargarIndicadores();

            actualizarContadores();

            invalidarDatosActuales();
        }
    );


document
    .getElementById("ningun-anio")
    .addEventListener(
        "click",
        () => {

            cargarIndicadores();

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






