let datos = [];
let metadatosBibliotecas = [];
let mapaBibliotecas = new Map();
let datosActuales = [];


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

    document.getElementById("tabla").innerHTML =
        '<div class="mensaje">Seleccione los datos y pulse «Generar tabla».</div>';
})

.catch(error => {

    document.getElementById("tabla").innerHTML =
        `<div class="mensaje">${error.message}</div>`;
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
        valoresUnicos("Eje");


    ejeSelect.innerHTML =
        '<option value="">Todos los ejes</option>';


    ejes.forEach(eje => {

        const registro =
            datos.find(
                d => d.Eje === eje
            );


        const opcion =
            document.createElement("option");


        opcion.value =
            eje;


        opcion.textContent =
            `${eje}. ${registro.Nombre_Eje}`;


        ejeSelect.appendChild(opcion);
    });
}



/* =========================================================
   APARTADOS
   ========================================================= */


function cargarApartados() {

    let fuente =
        datos;


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


    fuente.forEach(d => {

        if (
            d.Apartado &&
            !mapa.has(d.Apartado)
        ) {

            mapa.set(
                d.Apartado,
                d.Nombre_Apartado
            );
        }
    });


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

    let fuente =
        datos;


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

        if (
            !mapa.has(
                d.Codigo_Tecnico
            )
        ) {

            mapa.set(
                d.Codigo_Tecnico,
                {
                    codigo:
                        d.Codigo_REBIUN,

                    tecnico:
                        d.Codigo_Tecnico,

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
                true;


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


    valoresUnicos("Anio")
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
    () =>
        actualizarSegmentadoresInstitucionales(
            "comunidad"
        )
);


modalidadSelect.addEventListener(
    "change",
    () =>
        actualizarSegmentadoresInstitucionales(
            "modalidad"
        )
);


titularidadSelect.addEventListener(
    "change",
    () =>
        actualizarSegmentadoresInstitucionales(
            "titularidad"
        )
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

        cargarApartados();

        buscarIndicador.value = "";

        cargarIndicadores();
    }
);


apartadoSelect.addEventListener(
    "change",
    () => {

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
            actualizarContadores
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



function generarTabla() {

    const anios =
        obtenerSeleccionados(
            "anioCheck"
        );


    let bibliotecas =
        obtenerSeleccionados(
            "bibliotecaCheck"
        );


    const indicadores =
        obtenerSeleccionados(
            "indicadorCheck"
        );


    bibliotecas =
        bibliotecas.filter(
            bibliotecaCumpleSegmentadores
        );


    if (
        anios.length === 0 ||
        bibliotecas.length === 0 ||
        indicadores.length === 0
    ) {

        datosActuales = [];


        document.getElementById(
            "resumen"
        ).textContent = "";


        document.getElementById(
            "tabla"
        ).innerHTML =
            '<div class="mensaje">' +
            'La selección actual no contiene datos.' +
            '</div>';


        return;
    }


    let filtrados =
        datos.filter(d =>

            anios.includes(
                d.Anio
            ) &&

            bibliotecas.includes(d.Codigo_Biblioteca_REBIUN) &&

            indicadores.includes(
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


    datosActuales =
        filtrados;


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

        document.getElementById(
            "tabla"
        ).innerHTML =
            '<div class="mensaje">' +
            'Filas y columnas deben ser diferentes.' +
            '</div>';


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

                const registros =
                    filtrados.filter(
                        d =>
                            d[campoFila] === fila &&
                            d[campoColumna] === columna
                    );


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


                    contenido =
                        registros

                            .map(r =>
                                `<strong>${escaparHTML(
                                    r[terceraDimension]
                                )}</strong>: ${formatearValor(
                                    r.Valor
                                )}`
                            )

                            .join("<br>");
                }


                html +=
                    `<td>${contenido}</td>`;
            }
        );


        html += "</tr>";
    });


    html +=
        "</tbody></table>";


    document.getElementById(
        "tabla"
    ).innerHTML = html;


    document.getElementById(
        "resumen"
    ).textContent =

        `${filtrados.length} registros · ` +

        `${anios.length} año(s) · ` +

        `${bibliotecas.length} biblioteca(s) · ` +

        `${indicadores.length} indicador(es)`;
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






