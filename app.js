// Esperamos a que cargue todo el DOM
document.addEventListener("DOMContentLoaded", async () => {
  const recetaSelect = document.getElementById("recetaSelect");
  const personasInput = document.getElementById("personasInput");
  const calcularBtn = document.getElementById("calcularBtn");
  const resultadosSection = document.getElementById("resultados");
  const tablaResultados = document.getElementById("tablaResultados");
  const totalesDiv = document.getElementById("totales");
  const exportarBtn = document.getElementById("exportarPDF");

  let recetas = {};

  // 🔹 Cargar recetas desde JSON
  try {
    const response = await fetch("recetas.json");
    recetas = await response.json();
    console.log("Recetas cargadas:", recetas);
    cargarOpcionesRecetas(recetas);
  } catch (error) {
    console.error("Error al cargar recetas:", error);
  }

  // 🔹 Llenar menú de recetas
  function cargarOpcionesRecetas(data) {
    for (const key in data) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = data[key].nombre;
      recetaSelect.appendChild(option);
    }
  }

  // 🔹 Evento de cálculo
  calcularBtn.addEventListener("click", () => {
    const recetaId = recetaSelect.value;
    const personas = parseInt(personasInput.value);

    if (!recetaId || !personas || personas <= 0) {
      alert("Selecciona una receta y un número válido de personas.");
      return;
    }

    mostrarResultados(recetas[recetaId], personas);
  });

  // 🔹 Mostrar resultados dinámicamente
  function mostrarResultados(receta, personas) {
    resultadosSection.classList.remove("hidden");

    const ingredientes = receta.ingredientes;
    let html = `
      <table class="min-w-full border border-gray-300 bg-white rounded-lg overflow-hidden shadow-sm">
        <thead class="bg-green-600 text-white">
          <tr>
            <th class="p-2 text-left">Ingrediente</th>
            <th class="p-2 text-left">Cantidad total</th>
            <th class="p-2 text-left">Categoría</th>
            <th class="p-2 text-left">Costo total (MXN)</th>
          </tr>
        </thead>
        <tbody>
    `;

    const totalesPorTipo = {};

    ingredientes.forEach(ing => {
      const cantidadTotal = ing.cantidad * personas;
      const costoTotal = ing.precio * personas;

      if (!totalesPorTipo[ing.tipo]) totalesPorTipo[ing.tipo] = 0;
      totalesPorTipo[ing.tipo] += costoTotal;

      html += `
        <tr class="border-t hover:bg-gray-50">
          <td class="p-2">${ing.nombre}</td>
          <td class="p-2">${cantidadTotal} ${ing.unidad}</td>
          <td class="p-2 capitalize">${ing.tipo}</td>
          <td class="p-2">$${costoTotal.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    tablaResultados.innerHTML = html;

    // Totales por tipo
    let totalGeneral = 0;
    let totalesHTML = "<h3 class='text-lg font-semibold mb-2'>Totales por categoría:</h3><ul>";
    for (const tipo in totalesPorTipo) {
      totalesHTML += `<li class="mb-1 capitalize">${tipo}: <b>$${totalesPorTipo[tipo].toFixed(2)}</b></li>`;
      totalGeneral += totalesPorTipo[tipo];
    }
    totalesHTML += `</ul><p class='mt-2 font-bold'>Total general: $${totalGeneral.toFixed(2)}</p>`;

    totalesDiv.innerHTML = totalesHTML;
  }

  // 🔹 Exportar a PDF
  exportarBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Desglose de Ingredientes y Costos", 10, 10);
    doc.html(resultadosSection, {
      callback: function (doc) {
        doc.save("receta.pdf");
      },
      x: 10,
      y: 20
    });
  });
});
