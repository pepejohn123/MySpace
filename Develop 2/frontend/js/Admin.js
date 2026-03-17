// ===============================
// DATOS MOCK (TEMPORAL)
// ===============================

const propiedadesMock = [
  {
    id: 1,
    nombre: "Torre A - 304",
    residente: "Juan Pérez",
    imagen: "https://images.unsplash.com/photo-1560448204",
  },

  {
    id: 2,
    nombre: "Casa 08 - Roble",
    residente: "Laura González",
    imagen: "https://images.unsplash.com/photo-1605276374104",
  },
];

// ===============================
// CARGAR PROPIEDADES
// ===============================

function cargarPropiedades(data) {
  const container = document.getElementById("propiedades-container");

  container.innerHTML = "";

  data.forEach((p) => {
    container.innerHTML += `

<div class="card">

<div class="card-img-wrap">
<img src="${p.imagen}">
</div>

<div class="card-info">
<h3>${p.nombre}</h3>
<p>${p.residente}</p>
</div>

</div>

`;
  });
}

// ===============================
// INIT
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  // TEMPORAL
  cargarPropiedades(propiedadesMock);

  // FUTURO CON API

  /*
fetch("/api/propiedades")
.then(res => res.json())
.then(data => {
cargarPropiedades(data)
})
*/
});
