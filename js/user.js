function cerrarSesion() {
    localStorage.removeItem("usuarioLogueado");
    window.location.href = "index.html";
}

function mostrar(id) {
    document.querySelectorAll(".card").forEach(s => s.style.display = "none");
    document.getElementById(id).style.display = "block";
}

function volverMenu() {
    document.querySelectorAll(".card").forEach(s => s.style.display = "none");
    document.getElementById("menuPrincipal").style.display = "block";
}
