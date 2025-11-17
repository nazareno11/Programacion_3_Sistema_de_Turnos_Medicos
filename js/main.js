// Selección de elementos
const formLogin = document.getElementById("formLogin");
const formRegistro = document.getElementById("formRegistro");
const linkRegistro = document.getElementById("linkRegistro");
const linkLogin = document.getElementById("linkLogin");
const tituloForm = document.getElementById("titulo-form");
const mensaje = document.getElementById("mensaje");

// URL MockAPI usuarios
const API_USERS = "https://6911d53152a60f10c81f73ab.mockapi.io/usuarios";

// ---------------------- CAMBIO DE FORMULARIO ----------------------

linkRegistro.addEventListener("click", (e) => {
    e.preventDefault();
    formLogin.classList.add("oculto");
    formRegistro.classList.remove("oculto");
    tituloForm.textContent = "Registrarse";
    mensaje.textContent = "";
});

linkLogin.addEventListener("click", (e) => {
    e.preventDefault();
    formRegistro.classList.add("oculto");
    formLogin.classList.remove("oculto");
    tituloForm.textContent = "Iniciar Sesión";
    mensaje.textContent = "";
});

// ---------------------- REGISTRO ----------------------

formRegistro.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const mail = document.getElementById("emailRegistro").value;
    const pass1 = document.getElementById("passwordRegistro").value;
    const pass2 = document.getElementById("confirmarPassword").value;

    if (pass1 !== pass2) {
        mensaje.textContent = "Las contraseñas no coinciden.";
        return;
    }

    try {
        const nuevoUsuario = {
            nombre,
            mail,
            password: pass1,
            rol: "usuario" // → igual al de la API
        };

        await fetch(API_USERS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoUsuario)
        });

        mensaje.style.color = "green";
        mensaje.textContent = "Registro exitoso. Ahora puedes iniciar sesión.";

        setTimeout(() => {
            linkLogin.click();
            mensaje.style.color = "red";
        }, 1500);

    } catch (error) {
        mensaje.textContent = "Error al registrar. Intenta de nuevo.";
        console.error("Error registro:", error);
    }
});

// ---------------------- LOGIN ----------------------

formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailIngresado = document.getElementById("email").value;
    const passwordIngresado = document.getElementById("password").value;

    try {
        const res = await fetch(API_USERS);
        const usuarios = await res.json();

        const user = usuarios.find(
            (u) => u.mail === emailIngresado && u.password === passwordIngresado
        );

        if (!user) {
            mensaje.textContent = "Correo o contraseña incorrectos.";
            return;
        }

        // Guardar sesión
        localStorage.setItem("usuario", JSON.stringify(user));

        // Redirección por rol
        if (user.rol === "admin") {
            window.location.href = "../tpi_turnos_medicos/admin.html";
        } else {
            window.location.href = "../tpi_turnos_medicos/user.html";
        }

    } catch (error) {
        mensaje.textContent = "Error al iniciar sesión.";
        console.error("Error login:", error);
    }
});
