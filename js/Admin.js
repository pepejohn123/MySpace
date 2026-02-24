// --- SISTEMA DE NAVEGACIÓN ---
function changeSection(name) {
    // 1. Desactivar todos los botones del menú
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    // 2. Activar el botón clicado
    document.getElementById('btn-'+name).classList.add('active');
    
    // 3. Ocultar TODAS las secciones
    document.querySelectorAll('.section-view').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active-view');
    });
    
    // 4. Mostrar la sección deseada
    const section = document.getElementById('view-'+name);
    if(section) {
        section.style.display = 'block';
        setTimeout(() => section.classList.add('active-view'), 10);
    }

    // 5. LÓGICA DEL BOTÓN: Solo visible en 'propiedades'
    const fab = document.getElementById('fab-propiedad');
    if (fab) {
        if (name === 'propiedades') {
            fab.style.display = 'flex';
        } else {
            fab.style.display = 'none';
        }
    }
}

// --- FILTRO LATERAL (ZONAS) ---
function filterByZone(zoneId, element) {
    document.querySelectorAll('.zone-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');

    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const cardZone = card.getAttribute('data-zone');
        if (zoneId === 'all' || cardZone === zoneId) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

// --- MODALES ---
function closeModal(e, el) { if(e.target === el) el.style.display = 'none'; }
function openCalendar() { document.getElementById('modal-calendar').style.display = 'flex'; }
function openCitaModal(sol, loc) { 
    document.getElementById('cita-solicitud').value = sol; 
    document.getElementById('cita-ubicacion').value = loc; 
    document.getElementById('modal-cita').style.display = 'flex'; 
}
function openReservaAction() { document.getElementById('modal-reserva-action').style.display = 'flex'; }

function togglePropertyFields(type) {
    const res = document.getElementById('residential-fields'); 
    const comm = document.getElementById('common-fields');
    if (type === 'area_comun') { 
        res.style.display = 'none'; 
        comm.style.display = 'block'; 
    } else { 
        res.style.display = 'block'; 
        comm.style.display = 'none'; 
    }
}

function openDetailModal(element, type) {
    const modal = document.getElementById('modal-detail');
    
    // 1. LEER DATOS DE LA TARJETA CLICADA
    const title = element.querySelector('h3').innerText;
    const resident = element.querySelector('p').innerText;
    const imgUrl = element.querySelector('img').src;
    const badgeText = element.querySelector('.status-badge').innerText; // Lee si es Fuga, Deudor, etc.

    // 2. LLENAR EL MODAL
    document.getElementById('detail-title').innerText = title;
    document.getElementById('detail-subtitle').innerText = 'Residente: ' + resident;
    document.getElementById('detail-img').src = imgUrl;

    // 3. TEXTOS FIJOS SEGÚN TIPO
    const descEl = document.getElementById('detail-desc');
    const featuresDiv = document.getElementById('features-container');
    const servicesList = document.getElementById('services-list');

    if (type === 'depto') {
        descEl.innerText = "Departamento con acabados de lujo, piso de mármol y vista panorámica.";
        featuresDiv.innerHTML = `<div class="feature"><i class="fa-solid fa-bed"></i>3 Rec</div><div class="feature"><i class="fa-solid fa-bath"></i>2 Baños</div><div class="feature"><i class="fa-solid fa-car"></i>2 Autos</div>`;
        servicesList.innerHTML = `<li><i class="fa-solid fa-check" style="color:green"></i> Mantenimiento</li><li><i class="fa-solid fa-check" style="color:green"></i> Seguridad 24/7</li>`;
    } else if (type === 'casa') {
        descEl.innerText = "Casa residencial de dos niveles con jardín privado y terraza trasera.";
        featuresDiv.innerHTML = `<div class="feature"><i class="fa-solid fa-bed"></i>4 Rec</div><div class="feature"><i class="fa-solid fa-tree"></i>Jardín</div><div class="feature"><i class="fa-solid fa-warehouse"></i>Bodega</div>`;
        servicesList.innerHTML = `<li><i class="fa-solid fa-check" style="color:green"></i> Vigilancia</li><li><i class="fa-solid fa-check" style="color:green"></i> Recolección</li>`;
    } else { // Areas comunes
        descEl.innerText = "Área común para uso exclusivo de residentes. Requiere reservación para eventos.";
        featuresDiv.innerHTML = `<div class="feature"><i class="fa-solid fa-users"></i>Aforo</div><div class="feature"><i class="fa-solid fa-clock"></i>Horario</div>`;
        servicesList.innerHTML = `<li><i class="fa-solid fa-check" style="color:green"></i> Limpieza</li>`;
    }

    // 4. LÓGICA DE ALERTAS (ROJO, AZUL, VERDE)
    const alertBox = document.getElementById('modal-alert');
    const alertTitle = document.getElementById('alert-title');
    const alertText = document.getElementById('alert-text');

    alertBox.style.display = 'block'; // Mostrar siempre una caja

    if (badgeText.includes('Reporte') || badgeText.includes('Fuga') || badgeText.includes('Jardín') || badgeText.includes('⚠')) {
        // CASO: PROBLEMA (ROJO)
        alertBox.style.background = '#FEF2F2';
        alertBox.style.borderColor = '#FECACA';
        alertBox.style.color = '#991B1B';
        alertTitle.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Atención Requerida';
        
        if(badgeText.includes('Fuga')) alertText.innerText = "Se reportó una fuga activa. Personal notificado.";
        else if(badgeText.includes('Jardín')) alertText.innerText = "Falta de mantenimiento en área verde.";
        else alertText.innerText = "Existe un reporte de mantenimiento pendiente.";

    } else if (badgeText.includes('Deudor')) {
        // CASO: DEUDA (ROJO)
        alertBox.style.background = '#FEF2F2';
        alertBox.style.borderColor = '#FECACA';
        alertBox.style.color = '#991B1B';
        alertTitle.innerHTML = '<i class="fa-solid fa-hand-holding-dollar"></i> Adeudo Pendiente';
        alertText.innerText = "Esta unidad presenta cuotas vencidas.";

    } else if (badgeText.includes('En Renta')) {
        // CASO: RENTA (AZUL)
        alertBox.style.background = '#EFF6FF';
        alertBox.style.borderColor = '#BFDBFE';
        alertBox.style.color = '#1E40AF';
        alertTitle.innerHTML = '<i class="fa-solid fa-key"></i> Propiedad en Renta';
        alertText.innerText = "Unidad disponible. Contactar administración.";

    } else {
        // CASO: TODO BIEN (VERDE)
        alertBox.style.background = '#ECFDF5';
        alertBox.style.borderColor = '#A7F3D0';
        alertBox.style.color = '#065F46';
        alertTitle.innerHTML = '<i class="fa-solid fa-circle-check"></i> Estado Correcto';
        alertText.innerText = "Sin reportes ni adeudos activos.";
    }
    
    modal.style.display = 'flex';
}

// --- LÓGICA DE SERVICIOS Y CITAS ---

// 1. Abrir Modal para Agendar
function openAgendarModal(servicio, ubicacion) {
    document.getElementById('cita-solicitud').value = servicio;
    document.getElementById('cita-ubicacion').value = ubicacion;
    // Poner fecha de hoy por defecto
    document.getElementById('cita-fecha').valueAsDate = new Date();
    document.getElementById('modal-cita').style.display = 'flex';
}

// 2. Confirmar Cita (Simulación)
function confirmarCita() {
    const servicio = document.getElementById('cita-solicitud').value;
    const fecha = document.getElementById('cita-fecha').value;
    const hora = document.getElementById('cita-hora').value;
    const ubicacion = document.getElementById('cita-ubicacion').value;

    if(!fecha || !hora) {
        alert("Por favor selecciona fecha y hora.");
        return;
    }

    // Cerrar modal
    document.getElementById('modal-cita').style.display = 'none';

    // Mensaje de éxito simulando la notificación
    alert(`✅ Cita Agendada con éxito.\n\n📅 Se ha agregado al calendario: ${servicio} en ${ubicacion}.\n📩 Se envió una notificación automática al residente con el horario: ${fecha} a las ${hora}.`);
}

// 3. Mostrar Info del Proveedor (Teléfono)
function showProviderInfo(nombre, telefono) {
    alert(`📞 Contactar Proveedor\n\nEmpresa: ${nombre}\nTeléfono: ${telefono}\n\n(Llamando...)`);
}
// --- FUNCIÓN PARA MOSTRAR EL TELÉFONO ---
function showProviderInfo(nombre, telefono) {
    // 1. Poner los datos en el modal
    document.getElementById('contact-name').innerText = nombre;
    document.getElementById('contact-phone').innerText = telefono;
    
    // 2. Hacer que al dar click al número, intente llamar (útil en celular)
    document.getElementById('contact-phone').href = "tel:" + telefono;
    
    // 3. Mostrar la ventana
    document.getElementById('modal-contact').style.display = 'flex';
}