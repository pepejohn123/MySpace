document.getElementById("loginForm").addEventListener("submit", handleLogin);
document.getElementById("googleBtn").addEventListener("click", handleLoginGoogle);

function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('emailInput').value.toLowerCase();
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('loader');

    btnText.textContent = "Verificando...";
    loader.style.display = "inline-block";

    setTimeout(() => {
        if (email.includes("admin")) {
            window.location.href = "admin.html";
        } else {
            window.location.href = "residente.html";
        }
    }, 1000);
}

function handleLoginGoogle() {
    window.location.href = "residente.html";
}
