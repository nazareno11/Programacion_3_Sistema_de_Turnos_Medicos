// Selecciono los elementos
const formLogin = document.getElementById("formLogin");
const formRegistro = document.getElementById("formRegistro");
const linkRegistro = document.getElementById("linkRegistro");
const linkLogin = document.getElementById("linkLogin");
const tituloForm = document.getElementById("titulo-form");
const mensaje = document.getElementById("mensaje");

// Cambiar de Login a Registro
linkRegistro.addEventListener("click", (e) => {
    e.preventDefault();
    formLogin.classList.add("oculto");
    formRegistro.classList.remove("oculto");
    tituloForm.textContent = "Registrarse";
    mensaje.textContent = "";
});

// Cambiar de Registro a Login
linkLogin.addEventListener("click", (e) => {
    e.preventDefault();
    formRegistro.classList.add("oculto");
    formLogin.classList.remove("oculto");
    tituloForm.textContent = "Iniciar Sesión";
    mensaje.textContent = "";
});

// Validar registro (ejemplo basico)
formRegistro.addEventListener("submit", (e) => {
    e.preventDefault();

    const pass1 = document.getElementById("passwordRegistro").value;
    const pass2 = document.getElementById("confirmarPassword").value;

    if (pass1 !== pass2) {
        mensaje.textContent = "Las contraseñas no coinciden.";
    } else {
        mensaje.style.color = "green";
        mensaje.textContent = "Registro exitoso. Ahora puedes iniciar sesión.";
        setTimeout(() => {
            linkLogin.click(); // Vuelve al login automaticamente
            mensaje.style.color = "red";
        }, 1500);
    }
});
