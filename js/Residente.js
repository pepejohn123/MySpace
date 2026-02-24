function openModal(id) { 
    document.getElementById(id).style.display = 'flex'; 
}

function closeAllModals() { 
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); 
}

function closeModal(e, el) { 
    if(e.target === el) el.style.display = 'none'; 
}

function toggleChat() { 
    const c = document.getElementById('chat-window'); 
    c.style.display = c.style.display === 'flex' ? 'none' : 'flex'; 
}

// LÓGICA DEL SELECTOR DE PAGO
function togglePaymentMethod(method) {
    // Ocultar todos
    document.getElementById('pay-saved').style.display = 'none';
    document.getElementById('pay-new').style.display = 'none';
    document.getElementById('pay-cash').style.display = 'none';

    // Mostrar seleccionado
    document.getElementById('pay-' + method).style.display = 'block';
}