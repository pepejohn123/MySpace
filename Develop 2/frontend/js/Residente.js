
// ===============================
// DATOS DE PRUEBA (TEMPORAL)
// ===============================
const mockData = {

nombre: "Juan Pérez González",

departamento: "Torre A • Depto 304",

imagen: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",

estado_pago: "Al corriente",

caracteristicas: [
{icono:"fa-solid fa-bed", texto:"3 Rec"},
{icono:"fa-solid fa-bath", texto:"2 Baños"},
{icono:"fa-solid fa-kitchen-set", texto:"Integral"},
{icono:"fa-solid fa-tree", texto:"Balcón"}
],

servicios:[
"Mantenimiento de Áreas Comunes",
"Recolección de Basura",
"Seguridad 24/7",
"2 Cajones de Estacionamiento"
],

movimientos:[

{
titulo:"Fuga en lavabo",
fecha:"Ticket #890",
estado:"En revisión",
color:"#F59E0B"
},

{
titulo:"Pago Enero",
fecha:"Hace 2 semanas",
estado:"-$1,500.00",
color:"#00C853"
}

]

}
//Cargar perfil
function cargarPerfil(data) {
  document.getElementById("user-name").innerText = "Hola," + data.nombre;
  document.getElementById("dept-name").innerText = data.departamento;
  document.getElementById("dept-owner").innerText = "Titular:" + data.nombre;
  document.getElementById("dept-image").src = data.imagen;
  document.getElementById("payment-status").innerHTML =
    '<i class="fa-solid fa-circle-check"></i> ' + data.estado_pago;
  cargarFeatures(data.caracteristicas);
  cargarServicios(data.servicios);
  cargarMovimientos(data.movimientos);
}
//Cargar Features
function cargarFeatures(Features) {
  const container = document.getElementById("features-container");
  container.innerHTML = "";
  features.forEach((f) => {
    container.innerHTML += `
        <div class="feature">
        <i class="${f.icono}"></i>
        <span>${f.texto}</span>
        </div>
        `
  });
}
//Servicios Activos
function cargarServicios(servicios) {
  const list = document.getElementById("services-list");
  list.innerHTML = "";
  servicios.forEach((s) => {
    list.innerHTML += `
        <li>
            <i class="fa-solid fa-circle-check"></i>
            ${s} 
        </li>
        `
  });
}
//Movimientos Recientes
function cargarMovimientos(movs) {
  const container = document.getElementById("activity-list");
  container.innerHTML = "";
  movs.forEach((m) => {
    container.innerHTML += `
        <div class="activity-item">
        <div>
        <b>${m.titulo}</b>
        <br>
        <small style="color:#666">
        ${m.fecha}
        </small>
        </div>
        <span style="color:${m.color}; font-weight:bold;">
        ${m.estado}
        </span>
        </div>
        `
  });
}
//Modales
function openModal(id){
    document.getElementById(id).style.display = "flex";
}
function closeModal(event, overlay){
    if(event.target === overlay){
        overlay.style.display = "none";
    }
}
function closeAllModals(){
    document.querySelectorAll(".modal-overlay").forEach(m => m.style.display = "none");
}
//Chat
function toggleChat(){
    const chat = document.getElementById("chat-window")
    if(chat.style.display === "flex"){
        chat.style.display = "none";
    }else{
        chat.style.display = "flex";
    }
}
function mostrarRespuesta(tipo){
    if(tipo === "wifi"){
        alert("La clave del WiFi es: WIFI_CONDO_2026");
    }
    if(tipo === "basura"){
        alert("La basura se saca de 8pm a 10pm");
    }
}
//Inicio del Dashboard
document.addEventListener("DOMContentLoaded", () => {
    //TEST
    cargarPerfil(mockData);    
    //FUTURO API
    // fetch("/api/residente/perfil")
    // .then(res => res.json()).then(data => {
    //     cargarPerfil(data);
    // });
})
