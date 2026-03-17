const loginForm = document.getElementById("loginForm");
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById("emailInput").value;
    const password = document.querySelector("input[type=password]").value;
    const res = await fetch('/api/login', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
        email,
        password
    })
});
    if(!res.ok){
        alert("Credenciales incorrectas");
        return;
    }
    const data = await res.json();
    localStorage.setItem('token', data.token);
    if(data.role === 'admin'){
        window.location.href = "../admin/Admin.html";
    }
    if(data.role === 'residente'){
        window.location.href = "../residente/Residente.html";
    }
});