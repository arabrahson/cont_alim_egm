let ingredientesGlobales = [];
let recetas = [];
let recetaActual = null;

const seccionRecetas = document.getElementById("seccionRecetas");
const seccionFormulario = document.getElementById("seccionFormulario");
const seccionCalculo = document.getElementById("seccionCalculo");
const seccionAdminIngredientes = document.getElementById("seccionAdminIngredientes");

const btnVerRecetas = document.getElementById("btnVerRecetas");
const btnAgregarReceta = document.getElementById("btnAgregarReceta");
const btnAgregarTiempo = document.getElementById("btnAgregarTiempo");
const formReceta = document.getElementById("formReceta");
const tiemposContainer = document.getElementById("tiemposContainer");

const btnCalcular = document.getElementById("btnCalcular");
const btnPDF = document.getElementById("btnPDF");
const tituloReceta = document.getElementById("tituloReceta");
const inputPersonas = document.getElementById("inputPersonas");
const resultadosDiv = document.getElementById("resultados");

const btnExportJSON = document.getElementById("btnExportJSON");
const btnImportJSON = document.getElementById("btnImportJSON");
const inputFileJSON = document.getElementById("inputFileJSON");

const btnAdminIngredientes = document.getElementById("btnAdminIngredientes");
const tbodyAdminIngredientes = document.getElementById("tbodyAdminIngredientes");
const btnGuardarAdmin = document.getElementById("btnGuardarAdmin");

// ------------------------
// Cargar JSON externos
// ------------------------
async function cargarDatos(){
  const ingRes = await fetch("ingredientes.json");
  ingredientesGlobales = await ingRes.json();

  const recRes = await fetch("recetas.json");
  const recData = await recRes.json();

  // Aplicar precios y unidades globales
  recetas = recData.map(rec => {
    rec.tiempos = rec.tiempos.map(tiempo => {
      tiempo.ingredientes = tiempo.ingredientes.map(ing=>{
        const global = ingredientesGlobales.find(g=>g.nombre===ing.nombre);
        return {
          nombre: ing.nombre,
          cantidad: ing.cantidad,
          unidad: global ? global.unidad : (ing.unidad||"unidad"),
          precio: global ? global.precio : (ing.precio||0),
          tipo: global ? global.tipo : "Otros"
        };
      });
      return tiempo;
    });
    return rec;
  });

  renderizarRecetas();
}
cargarDatos();

// ------------------------
// Navegación
// ------------------------
function mostrarSeccion(seccion){
  [seccionRecetas,seccionFormulario,seccionCalculo,seccionAdminIngredientes].forEach(s=>s.classList.add("hidden"));
  seccion.classList.remove("hidden");
}

btnVerRecetas.addEventListener("click",()=>mostrarSeccion(seccionRecetas));
btnAgregarReceta.addEventListener("click",()=>{
  limpiarFormulario();
  mostrarSeccion(seccionFormulario);
});
btnAdminIngredientes.addEventListener("click",()=>{
  mostrarSeccion(seccionAdminIngredientes);
  cargarTablaAdminIngredientes();
});

// ------------------------
// Render recetas
// ------------------------
function renderizarRecetas(){
  seccionRecetas.innerHTML="";
  if(recetas.length===0){
    seccionRecetas.innerHTML=`<div class="col-span-full text-center text-gray-500">No hay recetas aún. ¡Agrega la primera! 🍳</div>`;
    return;
  }
  recetas.forEach((rec,i)=>{
    const card = document.createElement("div");
    card.className="card p-4 bg-white rounded-lg shadow-md";
    card.innerHTML=`
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-bold text-lg">${rec.nombre}</h3>
        <span class="text-sm bg-orange-100 text-orange-600 px-2 py-1 rounded">${rec.categoria||"Sin categoría"}</span>
      </div>
      <p class="text-gray-600 mb-3">${rec.tiempos.length} tiempos</p>
      <div class="flex gap-2">
        <button class="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600" onclick="abrirCalculo(${i})">Calcular</button>
        <button class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" onclick="editarReceta(${i})">Editar</button>
        <button class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" onclick="eliminarReceta(${i})">Eliminar</button>
      </div>
    `;
    seccionRecetas.appendChild(card);
  });
}

// ------------------------
// Formulario Recetas Dinámico
// ------------------------
function limpiarFormulario(){
  recetaActual=null;
  formReceta.reset();
  tiemposContainer.innerHTML="";
}

btnAgregarTiempo.addEventListener("click",()=>{
  agregarTiempo("Tiempo "+(tiemposContainer.children.length+1));
});

// ... código previo de carga de datos, navegación y renderizado se mantiene ...

function agregarTiempo(nombre){
  const divTiempo = document.createElement("div");
  divTiempo.className="mb-4 p-2 border border-gray-300 rounded-lg bg-orange-50";
  divTiempo.innerHTML=`
    <div class="flex justify-between items-center mb-2">
      <input type="text" class="border p-1 rounded w-full" value="${nombre}">
      <button type="button" class="ml-2 text-red-500" onclick="this.closest('div').remove()">🗑 Eliminar Tiempo</button>
    </div>
    <table class="w-full border border-gray-300 mb-2">
      <thead class="bg-orange-100">
        <tr>
          <th class="p-2 border">Ingrediente</th>
          <th class="p-2 border">Cantidad</th>
          <th class="p-2 border">Unidad</th>
          <th class="p-2 border">Acción</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <button type="button" class="bg-green-400 text-white px-2 py-1 rounded" onclick="agregarIngrediente(this)">+ Agregar Ingrediente</button>
  `;
  tiemposContainer.appendChild(divTiempo);
}

function agregarIngrediente(btn){
  const tbody = btn.previousElementSibling.querySelector("tbody");
  const fila = document.createElement("tr");
  fila.innerHTML=`
    <td class="border p-1"><input placeholder="Nombre"></td>
    <td class="border p-1"><input type="number" step="0.01" min="0" placeholder="Cantidad"></td>
    <td class="border p-1"><input placeholder="Unidad"></td>
    <td class="border p-1 text-center"><button type="button" class="text-red-500" onclick="this.closest('tr').remove()">🗑</button></td>
  `;
  tbody.appendChild(fila);
}

// ... resto del código (guardar recetas, calcular, exportar PDF, administrar ingredientes) se mantiene igual ...

formReceta.addEventListener("submit",(e)=>{
  e.preventDefault();
  const tiempos = Array.from(tiemposContainer.children).map(div=>{
    const nombreTiempo = div.querySelector("input").value;
    const ingredientes = Array.from(div.querySelectorAll("tbody tr")).map(tr=>{
      const inputs = tr.querySelectorAll("input");
      return {
        nombre: inputs[0].value,
        cantidad: parseFloat(inputs[1].value),
        unidad: inputs[2].value
      };
    });
    return { nombre: nombreTiempo, ingredientes };
  });

  const nuevaReceta = {
    nombre: document.getElementById("nombreReceta").value,
    categoria: document.getElementById("categoriaReceta").value,
    tiempos
  };

  if(recetaActual!==null) recetas[recetaActual]=nuevaReceta;
  else recetas.push(nuevaReceta);

  localStorage.setItem("recetas",JSON.stringify(recetas));
  renderizarRecetas();
  mostrarSeccion(seccionRecetas);
});

// ------------------------
// Abrir calculadora de menú
// ------------------------
function abrirCalculo(i){
  recetaActual=i;
  tituloReceta.textContent = recetas[i].nombre;
  inputPersonas.value=1;
  resultadosDiv.innerHTML="";
  mostrarSeccion(seccionCalculo);
}

btnCalcular.addEventListener("click",()=>{
  const personas = parseInt(inputPersonas.value)||1;
  resultadosDiv.innerHTML="";
  recetas[recetaActual].tiempos.forEach(tiempo=>{
    const div = document.createElement("div");
    div.innerHTML=`<h3 class="font-bold text-orange-600">${tiempo.nombre}</h3>`;
    const tabla = document.createElement("table");
    tabla.className="w-full border border-gray-300 mb-4";
    tabla.innerHTML=`<thead class="bg-orange-100"><tr><th>Ingrediente</th><th>Cantidad</th><th>Unidad</th><th>Precio</th></tr></thead>`;
    const tbody = document.createElement("tbody");
    tiempo.ingredientes.forEach(ing=>{
      const global = ingredientesGlobales.find(g=>g.nombre===ing.nombre) || ing;
      const cantidad = ing.cantidad*personas;
      const precio = (global.precio || 0)*personas;
      const tr = document.createElement("tr");
      tr.innerHTML=`<td class="border p-1">${ing.nombre}</td><td class="border p-1">${cantidad}</td><td class="border p-1">${global.unidad||ing.unidad}</td><td class="border p-1">${precio.toFixed(2)}</td>`;
      tbody.appendChild(tr);
    });
    tabla.appendChild(tbody);
    div.appendChild(tabla);
    resultadosDiv.appendChild(div);
  });
});

// ------------------------
// Exportar PDF
// ------------------------
btnPDF.addEventListener("click",()=>{
  const doc = new jspdf.jsPDF();
  let y = 10;
  doc.setFontSize(16);
  doc.text(recetas[recetaActual].nombre,10,y);
  y+=10;
  recetas[recetaActual].tiempos.forEach(tiempo=>{
    doc.setFontSize(14);
    doc.text(tiempo.nombre,10,y);
    y+=8;
    tiempo.ingredientes.forEach(ing=>{
      doc.setFontSize(12);
      const global = ingredientesGlobales.find(g=>g.nombre===ing.nombre) || ing;
      doc.text(`${ing.nombre}: ${ing.cantidad} ${global.unidad} - $${global.precio}`,12,y);
      y+=6;
      if(y>280){doc.addPage();y=10;}
    });
    y+=4;
  });
  doc.save(`${recetas[recetaActual].nombre}.pdf`);
});

// ------------------------
// Export / Import JSON
// ------------------------
btnExportJSON.addEventListener("click",()=>{
  const dataStr = JSON.stringify(recetas,null,2);
  const blob = new Blob([dataStr],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url;
  a.download="recetas.json";
  a.click();
  URL.revokeObjectURL(url);
});

btnImportJSON.addEventListener("click",()=>inputFileJSON.click());
inputFileJSON.addEventListener("change",e=>{
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = ev=>{
    recetas = JSON.parse(ev.target.result);
    renderizarRecetas();
    alert("Recetas importadas ✅");
  };
  reader.readAsText(file);
});

// ------------------------
// Administrar ingredientes
// ------------------------
function cargarTablaAdminIngredientes(){
  tbodyAdminIngredientes.innerHTML="";
  ingredientesGlobales.forEach(ing=>{
    const tr = document.createElement("tr");
    tr.innerHTML=`<td class="border p-1">${ing.nombre}</td>
      <td class="border p-1"><input type="number" value="${ing.cantidad}" class="w-full p-1"></td>
      <td class="border p-1"><input value="${ing.unidad}" class="w-full p-1"></td>
      <td class="border p-1"><input type="number" value="${ing.precio}" class="w-full p-1"></td>
      <td class="border p-1"><input value="${ing.tipo}" class="w-full p-1"></td>`;
    tbodyAdminIngredientes.appendChild(tr);
  });
}

btnGuardarAdmin.addEventListener("click",()=>{
  Array.from(tbodyAdminIngredientes.querySelectorAll("tr")).forEach((tr,i)=>{
    const inputs = tr.querySelectorAll("input");
    ingredientesGlobales[i].cantidad=parseFloat(inputs[0].value);
    ingredientesGlobales[i].unidad=inputs[1].value;
    ingredientesGlobales[i].precio=parseFloat(inputs[2].value);
    ingredientesGlobales[i].tipo=inputs[3].value;
  });

  // Aplicar a recetas
  recetas.forEach(rec=>{
    rec.tiempos.forEach(tiempo=>{
      tiempo.ingredientes.forEach(ing=>{
        const global = ingredientesGlobales.find(g=>g.nombre===ing.nombre);
        if(global){
          ing.unidad=global.unidad;
          ing.precio=global.precio;
        }
      });
    });
  });

  localStorage.setItem("recetas",JSON.stringify(recetas));
  alert("Ingredientes actualizados ✅");
  renderizarRecetas();
});

// ------------------------
// Editar / Eliminar recetas
// ------------------------
function editarReceta(i){
  limpiarFormulario();
  recetaActual=i;
  const rec = recetas[i];
  document.getElementById("nombreReceta").value=rec.nombre;
  document.getElementById("categoriaReceta").value=rec.categoria;
  rec.tiempos.forEach(t=>agregarTiempo(t.nombre));
  const tiempoDivs = Array.from(tiemposContainer.children);
  tiempoDivs.forEach((div,j)=>{
    const tbody = div.querySelector("tbody");
    rec.tiempos[j].ingredientes.forEach(ing=>{
      const tr = document.createElement("tr");
      tr.innerHTML=`<td class="border p-1"><input value="${ing.nombre}"></td>
                      <td class="border p-1"><input type="number" value="${ing.cantidad}"></td>
                      <td class="border p-1"><input value="${ing.unidad}"></td>
                      <td class="border p-1 text-center"><button type="button" class="text-red-500" onclick="this.closest('tr').remove()">🗑</button></td>`;
      tbody.appendChild(tr);
    });
  });
  mostrarSeccion(seccionFormulario);
}

function eliminarReceta(i){
  if(confirm("¿Eliminar receta?")){recetas.splice(i,1); renderizarRecetas();}
}

