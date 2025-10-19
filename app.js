// ---------------------------
// 📦 VARIABLES GLOBALES
// ---------------------------
let recetas = JSON.parse(localStorage.getItem("recetas")) || [];
let recetaActual = null;

// Referencias a secciones
const seccionRecetas = document.getElementById("seccionRecetas");
const seccionFormulario = document.getElementById("seccionFormulario");
const seccionCalculo = document.getElementById("seccionCalculo");

// Botones y formularios
const btnVerRecetas = document.getElementById("btnVerRecetas");
const btnAgregarReceta = document.getElementById("btnAgregarReceta");
const formReceta = document.getElementById("formReceta");
const tbodyIngredientes = document.getElementById("tbodyIngredientes");
const btnAgregarIngrediente = document.getElementById("btnAgregarIngrediente");
const btnCalcular = document.getElementById("btnCalcular");
const btnPDF = document.getElementById("btnPDF");

// Campos del formulario
const nombreReceta = document.getElementById("nombreReceta");
const categoriaReceta = document.getElementById("categoriaReceta");
const tituloReceta = document.getElementById("tituloReceta");
const resultadosDiv = document.getElementById("resultados");
const inputPersonas = document.getElementById("inputPersonas");

// ---------------------------
// 🧭 FUNCIONES DE NAVEGACIÓN
// ---------------------------
function mostrarSeccion(seccion) {
  seccionRecetas.classList.add("hidden");
  seccionFormulario.classList.add("hidden");
  seccionCalculo.classList.add("hidden");
  seccion.classList.remove("hidden");
}

btnVerRecetas.addEventListener("click", () => mostrarSeccion(seccionRecetas));
btnAgregarReceta.addEventListener("click", () => {
  limpiarFormulario();
  mostrarSeccion(seccionFormulario);
});

// ---------------------------
// 🍽️ LISTA DE RECETAS
// ---------------------------
function renderizarRecetas() {
  seccionRecetas.innerHTML = "";

  if (recetas.length === 0) {
    seccionRecetas.innerHTML = `
      <div class="col-span-full text-center text-gray-500">
        No hay recetas aún. ¡Agrega la primera! 🍳
      </div>`;
    return;
  }

  recetas.forEach((receta, i) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-header flex justify-between items-center">
        <h3 class="font-bold text-lg">${receta.nombre}</h3>
        <span class="text-sm bg-white text-orange-600 px-2 py-1 rounded">${receta.categoria || "Sin categoría"}</span>
      </div>
      <div class="card-body">
        <p class="text-gray-600 mb-3">${receta.ingredientes.length} ingredientes</p>
        <div class="flex justify-between">
          <button class="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600" onclick="abrirCalculo(${i})">
            Calcular
          </button>
          <button class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" onclick="editarReceta(${i})">
            Editar
          </button>
          <button class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" onclick="eliminarReceta(${i})">
            Eliminar
          </button>
        </div>
      </div>
    `;

    seccionRecetas.appendChild(card);
  });
}

// ---------------------------
// ✏️ FORMULARIO DE RECETAS
// ---------------------------
function limpiarFormulario() {
  recetaActual = null;
  nombreReceta.value = "";
  categoriaReceta.value = "";
  tbodyIngredientes.innerHTML = "";
}

btnAgregarIngrediente.addEventListener("click", () => {
  const fila = document.createElement("tr");
  fila.innerHTML = `
    <td class="border p-1"><input class="w-full p-1" placeholder="Nombre"></td>
    <td class="border p-1"><input type="number" class="w-full p-1" placeholder="Cantidad"></td>
    <td class="border p-1"><input class="w-full p-1" placeholder="Unidad"></td>
    <td class="border p-1"><input type="number" class="w-full p-1" placeholder="Precio"></td>
    <td class="border p-1"><input class="w-full p-1" placeholder="Tipo"></td>
    <td class="border p-1 text-center">
      <button type="button" class="text-red-500" onclick="this.closest('tr').remove()">🗑️</button>
    </td>
  `;
  tbodyIngredientes.appendChild(fila);
});

formReceta.addEventListener("submit", (e) => {
  e.preventDefault();

  const ingredientes = Array.from(tbodyIngredientes.querySelectorAll("tr")).map(tr => {
    const inputs = tr.querySelectorAll("input");
    return {
      nombre: inputs[0].value,
      cantidad: parseFloat(inputs[1].value),
      unidad: inputs[2].value,
      precio: parseFloat(inputs[3].value),
      tipo: inputs[4].value
    };
  });

  const nuevaReceta = {
    nombre: nombreReceta.value,
    categoria: categoriaReceta.value,
    ingredientes
  };

  if (recetaActual !== null) {
    recetas[recetaActual] = nuevaReceta;
  } else {
    recetas.push(nuevaReceta);
  }

  localStorage.setItem("recetas", JSON.stringify(recetas));
  renderizarRecetas();
  mostrarSeccion(seccionRecetas);
});

// ---------------------------
// 🧮 CÁLCULO DE INGREDIENTES
// ---------------------------
function abrirCalculo(index) {
  recetaActual = index;
  const receta = recetas[index];
  tituloReceta.textContent = receta.nombre;
  resultadosDiv.innerHTML = "";
  inputPersonas.value = "";
  mostrarSeccion(seccionCalculo);
}

btnCalcular.addEventListener("click", () => {
  const personas = parseInt(inputPersonas.value);
  if (!personas || personas < 1) {
    alert("Por favor, ingresa un número válido de personas.");
    return;
  }

  const receta = recetas[recetaActual];
  const agrupados = {};

  receta.ingredientes.forEach(ing => {
    const total = ing.cantidad * personas;
    const costo = (ing.precio || 0) * total;
    if (!agrupados[ing.tipo]) agrupados[ing.tipo] = [];
    agrupados[ing.tipo].push({ ...ing, total, costo });
  });

  resultadosDiv.innerHTML = "";

  Object.keys(agrupados).forEach(tipo => {
    const tabla = document.createElement("table");
    tabla.className = "w-full border border-gray-300 mb-4";

    let totalTipo = 0;

    const filas = agrupados[tipo].map(ing => {
      totalTipo += ing.costo;
      return `
        <tr>
          <td class="border p-1">${ing.nombre}</td>
          <td class="border p-1">${ing.total} ${ing.unidad}</td>
          <td class="border p-1">$${ing.costo.toFixed(2)}</td>
        </tr>
      `;
    }).join("");

    tabla.innerHTML = `
      <thead class="bg-orange-100">
        <tr><th colspan="3" class="text-left p-2">${tipo}</th></tr>
        <tr><th>Ingrediente</th><th>Cantidad</th><th>Costo</th></tr>
      </thead>
      <tbody>${filas}</tbody>
      <tfoot class="bg-gray-100">
        <tr><td colspan="2" class="text-right font-bold">Total ${tipo}</td><td class="font-bold">$${totalTipo.toFixed(2)}</td></tr>
      </tfoot>
    `;

    resultadosDiv.appendChild(tabla);
  });
});

// ---------------------------
// 📄 EXPORTAR A PDF
// ---------------------------
btnPDF.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text(tituloReceta.textContent, 10, 10);
  doc.html(resultadosDiv, {
    callback: function (doc) {
      doc.save(`${tituloReceta.textContent}.pdf`);
    },
    x: 10,
    y: 20
  });
});

// ---------------------------
// ✂️ EDITAR Y ELIMINAR RECETA
// ---------------------------
function editarReceta(index) {
  recetaActual = index;
  const receta = recetas[index];

  nombreReceta.value = receta.nombre;
  categoriaReceta.value = receta.categoria;
  tbodyIngredientes.innerHTML = "";

  receta.ingredientes.forEach(ing => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="border p-1"><input value="${ing.nombre}" class="w-full p-1"></td>
      <td class="border p-1"><input type="number" value="${ing.cantidad}" class="w-full p-1"></td>
      <td class="border p-1"><input value="${ing.unidad}" class="w-full p-1"></td>
      <td class="border p-1"><input type="number" value="${ing.precio}" class="w-full p-1"></td>
      <td class="border p-1"><input value="${ing.tipo}" class="w-full p-1"></td>
      <td class="border p-1 text-center">
        <button type="button" class="text-red-500" onclick="this.closest('tr').remove()">🗑️</button>
      </td>
    `;
    tbodyIngredientes.appendChild(fila);
  });

  mostrarSeccion(seccionFormulario);
}

function eliminarReceta(index) {
  if (confirm("¿Seguro que quieres eliminar esta receta?")) {
    recetas.splice(index, 1);
    localStorage.setItem("recetas", JSON.stringify(recetas));
    renderizarRecetas();
  }
}

// ---------------------------
// 🚀 INICIO
// ---------------------------
renderizarRecetas();
