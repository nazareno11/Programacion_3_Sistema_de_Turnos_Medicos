// Selecciono los elementos
const formLogin = document.getElementById("formLogin");
const formRegistro = document.getElementById("formRegistro");
const linkRegistro = document.getElementById("linkRegistro");
const linkLogin = document.getElementById("linkLogin");
const tituloForm = document.getElementById("titulo-form");
const mensaje = document.getElementById("mensaje");

const API_USERS = "" // poner url de mockapi de los usuarios

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


//registro de usuario

formRegistro.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("emailRegistro").value;
    const pass1 = document.getElementById("passwordRegistro").value;
    const pass2 = document.getElementById("confirmarPassword").value;

    if (pass1 !== pass2) {
        mensaje.textContent = "Las contraseñas no coinciden.";
        return;
    }

    // Crear usuario en MockAPI
    try {
        const nuevoUsuario = {
            nombre,
            email,
            password: pass1,
            role: "USUARIO" 
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

//login de usuario

formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch(API_USERS);
        const usuarios = await res.json();

        const user = usuarios.find(
            (u) => u.email === email && u.password === password
        );

        if (!user) {
            mensaje.textContent = "Correo o contraseña incorrectos.";
            return;
        }

        
        localStorage.setItem("usuario", JSON.stringify(user)); //guardamos la sesion

        
        if (user.role === "ADMIN") {    // redirigimos de ventana dependiendo del rol
            window.location.href = "admin.html";  
        } else {
            window.location.href = "usuario.html";
        }

    } catch (error) {
        mensaje.textContent = "Error al iniciar sesión.";
        console.error("Error login:", error);
    }
});


