const API_DOCTORS = "https://6911d53152a60f10c81f73ab.mockapi.io/doctores";
const API_USERS = "https://6911d53152a60f10c81f73ab.mockapi.io/usuarios";
const API_APPOINTMENTS = "https://690b3d176ad3beba00f40db9.mockapi.io/api/appointments";

const perfilSection = document.getElementById("perfil");
const turnosDisponiblesSection = document.getElementById("turnosDisponibles");
const solicitarTurnoSection = document.getElementById("solicitarTurno");
const menuPrincipal = document.getElementById("menuPrincipal");

// Contenedores dinamicos que agregaremos
let perfilContainer;
let turnosTableContainer;
let solicitarFormContainer;

// obtener el usuario actualmente guardado en localStorage.
function getLoggedUser() {
  const s = localStorage.getItem("usuario") || localStorage.getItem("usuarioLogueado") || localStorage.getItem("usuarioLogueado");
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// Verifica el rol del usuario que inicia sesion
function requireUser() {
  const user = getLoggedUser();
  if (!user) {
    alert("Debes iniciar sesión.");
    window.location.href = "../index.html";
    return null;
  }
  const rol = (user.rol || user.role || "").toString().toLowerCase();
  if (rol !== "usuario" && rol !== "user" && rol !== "paciente" && rol !== "patient") {
    alert("Acceso no autorizado: necesitas ser USUARIO.");
    window.location.href = "../index.html";
    return null;
  }
  return user;
}

const currentUser = requireUser();
if (!currentUser) {
  throw new Error("No hay usuario válido en sesión.");
}

//  UTILIDADES 
function showSection(id) {
  document.querySelectorAll(".card").forEach(s => s.style.display = "none");
  const el = document.getElementById(id);
  if (el) el.style.display = "block";
}

function volverMenu() {
  document.querySelectorAll(".card").forEach(s => s.style.display = "none");
  document.getElementById("menuPrincipal").style.display = "block";
}

// Mensaje temporal (se muestra dentro de una seccion)
function showTempMsg(parent, text, color = "green", ms = 2500) {
  const msg = document.createElement("div");
  msg.textContent = text;
  msg.style.color = color;
  msg.style.fontWeight = "600";
  msg.style.marginTop = "8px";
  parent.appendChild(msg);
  setTimeout(() => parent.removeChild(msg), ms);
}

// Formato fecha YYYY-MM-DD
function todayYYYYMMDD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

//  PERFIL 
function renderPerfil() {
  perfilSection.innerHTML = ""; // limpiar
  perfilContainer = document.createElement("div");
  perfilContainer.className = "perfil-container";

    // Titulo de la seccion mi perfil
  const h = document.createElement("h2");
  h.textContent = "Mi Perfil";
  perfilContainer.appendChild(h);
    //nombre
  const pNombre = document.createElement("p");
  pNombre.innerHTML = `<strong>Nombre:</strong> ${currentUser.nombre || currentUser.nombre_usuario || currentUser.name || ""}`;
  perfilContainer.appendChild(pNombre);
  // mail
  const pMail = document.createElement("p");
  pMail.innerHTML = `<strong>Mail:</strong> ${currentUser.mail || currentUser.email || currentUser.username || ""}`;
  perfilContainer.appendChild(pMail);
  // boton volver 
  const btnVolver = document.createElement("button");
  btnVolver.textContent = "Volver";
  btnVolver.addEventListener("click", volverMenu);
  perfilContainer.appendChild(btnVolver);

  perfilSection.appendChild(perfilContainer);
}

// TURNOS DEL USUARIO 
async function fetchAppointments() {
  const res = await fetch(API_APPOINTMENTS);
  if (!res.ok) throw new Error("Error al obtener turnos");
  return await res.json();
}
  // recuperar doctores de la api
async function fetchDoctors() {
  const res = await fetch(API_DOCTORS);
  if (!res.ok) throw new Error("Error al obtener doctores");  
  return await res.json();
}
  // constructor de la tabla 'Mis Turnos'
function buildTurnosTable(turnos, doctorsMap) {
  const wrapper = document.createElement("div");
  wrapper.className = "turnos-wrapper";
  //titulo
  const h = document.createElement("h2");
  h.textContent = "Mis Turnos";
  wrapper.appendChild(h);
  // formato de la tabla
  const table = document.createElement("table");
  table.className = "tabla";
  table.innerHTML = `
    <thead id="tabla-mis-turnos">
      <tr><th>Medico</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Acciones</th></tr>
    </thead>
  `;
  const tbody = document.createElement("tbody");
  // Si no hay turnos registrados muestra un mensaje 
  if (!turnos || turnos.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "No tenes turnos. Solicita uno en 'Solicitar Turno'.";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    // recorre cada turno
    turnos.forEach(t => {
      const tr = document.createElement("tr");
       // Obtiene nombre del medico desde el doctorsMap
      const medicoNombre = (doctorsMap[t.doctorId] && doctorsMap[t.doctorId].nombre) || `ID ${t.doctorId}`;
      tr.innerHTML = `
        <td>${medicoNombre}</td>
        <td>${t.fecha || ""}</td>
        <td>${t.hora || ""}</td>
        <td>${(t.estado || "").toUpperCase()}</td>
      `;
      const tdAcc = document.createElement("td");

      // Boton para cancelar el turno desde el interfaz usuario
      const btnCancelar = document.createElement("button");
      btnCancelar.textContent = "Cancelar";
      btnCancelar.className = "btn-accion btn-cancelar";
      btnCancelar.disabled = ((t.estado || "").toLowerCase() === "cancelado"); // deshabilita el boton si ya esta cancelado
      btnCancelar.addEventListener("click", async () => {
        if (!confirm("Deseas cancelar este turno?")) return;
        try {
          // Obtener turno actual desde la api y actualizar estado
          const resp = await fetch(`${API_APPOINTMENTS}/${t.id}`);
          const turnoActual = await resp.json();
          const actualizado = { ...turnoActual, estado: "cancelado" };
          await fetch(`${API_APPOINTMENTS}/${t.id}`, { // manda la actualizacion a la api
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(actualizado)
          });
          await renderTurnosUsuario(); // recargar la tabla
          showTempMsg(turnosDisponiblesSection, "Turno cancelado", "red"); //mostrar mensaje temporal
        } catch (err) {
          console.error(err);
          alert("Error cancelando turno");
        }
      });

      tdAcc.appendChild(btnCancelar);
      tr.appendChild(tdAcc);
      tbody.appendChild(tr);
    });
  }

  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
}

// mostrar el turno en pantalla
async function renderTurnosUsuario() {
  turnosDisponiblesSection.innerHTML = ""; // limpiar
  turnosTableContainer = document.createElement("div");
  turnosTableContainer.className = "turnos-container";

  try {
    // carga los turnos y medicos en paralelo
    const [turnosAll, doctors] = await Promise.all([fetchAppointments(), fetchDoctors()]);

    // Filtrar solo los turnos del usuario actual
    const myTurnos = turnosAll.filter(t => String(t.patientId) === String(currentUser.id) || String(t.patientId) === String(currentUser.userId));

    // Crear mapa doctors por id
    const doctorsMap = {};
    (doctors || []).forEach(d => doctorsMap[d.id] = d);

    // Construir la tabla de turnos y agregarla al contenedor
    const tableEl = buildTurnosTable(myTurnos, doctorsMap);
    turnosTableContainer.appendChild(tableEl);

    // boton volver
    const btnVolver = document.createElement("button");
    btnVolver.textContent = "Volver";
    btnVolver.addEventListener("click", volverMenu);
    turnosTableContainer.appendChild(btnVolver); // inserta todo en la seccion principal de turnos del usuario

    turnosDisponiblesSection.appendChild(turnosTableContainer);
  } catch (err) {
    console.error("Error cargando turnos usuario", err);
    turnosDisponiblesSection.textContent = "Error cargando turnos.";
  }
}

// renderiza el formulario para solicitar turno (usuario)
async function renderSolicitarTurnoForm() {
  solicitarTurnoSection.innerHTML = ""; // limpiar
  solicitarFormContainer = document.createElement("div"); //contenedor principal
  solicitarFormContainer.className = "solicitar-container";

  const h = document.createElement("h2"); //titulo
  h.textContent = "Solicitar Turno";
  solicitarFormContainer.appendChild(h);

  const form = document.createElement("form"); //creamos el form
  form.id = "formSolicitarTurno";

  // seleccionar doctores
  const labelDoc = document.createElement("label");
  labelDoc.textContent = "Medico:";
  form.appendChild(labelDoc);

  const selectDoc = document.createElement("select");
  selectDoc.id = "selectDoctor";
  selectDoc.required = true;
  selectDoc.style.width = "100%";
  selectDoc.style.padding = "8px";
  selectDoc.style.marginBottom = "10px";
  form.appendChild(selectDoc);

  // seleccionar fecha de la consulta
  const labelFecha = document.createElement("label");
  labelFecha.textContent = "Fecha:";
  form.appendChild(labelFecha);

  const inputFecha = document.createElement("input");
  inputFecha.type = "date";
  inputFecha.id = "inputFecha";
  inputFecha.required = true;
  inputFecha.min = todayYYYYMMDD(); // hace que no se puedan seleccionar fechas pasadas
  inputFecha.style.marginBottom = "10px";
  inputFecha.style.display = "block";
  form.appendChild(inputFecha);

  // seleccionar hora de la consulta
  const labelHora = document.createElement("label");
  labelHora.textContent = "Hora:";
  form.appendChild(labelHora);

  const inputHora = document.createElement("input");
  inputHora.type = "time";
  inputHora.id = "inputHora";
  inputHora.required = true;
  inputHora.style.display = "block";
  inputHora.style.marginBottom = "12px";
  form.appendChild(inputHora);

  // boton submit del formulario
  const btnSubmit = document.createElement("button");
  btnSubmit.type = "submit";
  btnSubmit.textContent = "Solicitar Turno";
  btnSubmit.className = "btn";
  form.appendChild(btnSubmit);

  // espacio para mensajes de feedback
  const feedback = document.createElement("div");
  feedback.id = "feedbackSolicitar";
  feedback.style.marginTop = "10px";
  form.appendChild(feedback);

  solicitarFormContainer.appendChild(form);

    //boton volver
  const btnVolver = document.createElement("button");
  btnVolver.textContent = "Volver";
  btnVolver.className = "btn btn-volver";
  btnVolver.style.marginTop = "12px";
  btnVolver.addEventListener("click", volverMenu);
  solicitarFormContainer.appendChild(btnVolver);

  solicitarTurnoSection.appendChild(solicitarFormContainer); //inserta todo en la seccion principal

  // Cargar doctores en el select
  try {
    const doctors = await fetchDoctors();
    selectDoc.innerHTML = ""; //limpiar
    const optDefault = document.createElement("option"); //opcion por defecto
    optDefault.value = "";
    optDefault.textContent = "-- Seleccione un Medico --";
    selectDoc.appendChild(optDefault);

    doctors.forEach(d => { //agrega doctores al select
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = `${d.nombre} — ${d.especialidad} (${d.dia_disponible || ""})`;
      selectDoc.appendChild(opt);
    });
  } catch (err) {
    console.error("Error cargando doctores", err);
    selectDoc.innerHTML = `<option value="">Error cargando Medicos</option>`;
  }

  // Submit del formulario. Crear un nuevo turno
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    feedback.textContent = "";

    const doctorId = selectDoc.value;
    const fecha = inputFecha.value;
    const hora = inputHora.value;

    if (!doctorId || !fecha || !hora) { //validacion de campos vacios
      feedback.style.color = "red";
      feedback.textContent = "Complete todos los campos.";
      return;
    }

    // Valida que la fecha no sea pasada
    if (fecha < todayYYYYMMDD()) {
      feedback.style.color = "red";
      feedback.textContent = "Seleccione una fecha válida (no pasada).";
      return;
    }

    // Crear objeto turno para enviar a la api
    const nuevoTurno = {
      patientId: Number(currentUser.id) || currentUser.id,
      doctorId: Number(doctorId) || doctorId,
      fecha,
      hora,
      estado: "pendiente"
    };

    try { //envia el turno a la api
      const res = await fetch(API_APPOINTMENTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoTurno)
      });
      if (!res.ok) throw new Error("Error creando turno");
      // limpiar formulario, feedback y recargar turnos
      form.reset();
      feedback.style.color = "green";
      feedback.textContent = "Turno solicitado correctamente.";
      await renderTurnosUsuario();
      // mostrar la seccion de mis turnos
      showSection("turnosDisponibles");
    } catch (err) {
      console.error("Error solicitando turno", err);
      feedback.style.color = "red";
      feedback.textContent = "Error al solicitar turno. Intentá nuevamente.";
    }
  });
}

//  CERRAR SESION 
function cerrarSesion() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("usuarioLogueado");
  window.location.href = "../tpi_turnos_medicos/index.html";
}

//  INICIALIZACION 
function initUserPanel() {
  // Render perfil basico
  renderPerfil();

  // Por defecto mostrar menu principal (el html ya lo hace pero para asegurar)
  volverMenu();

  // Preparar listeners para mostrar secciones (las funciones mostrar/volverMenu en el HTML usan display)
  // Si el HTML llama mostrar('perfil'), mostrar('turnosDisponibles') o mostrar('solicitarTurno'),
  // las secciones quedaran en blanco hasta que se rendericen. Añadimos listeners para cuando se muestren.
  // Cada vez que mostramos una seccion, renderizamos su contenido.

  const observer = new MutationObserver(() => {
    // cuando se haga visible la seccion perfil -> render
    if (document.getElementById("perfil").style.display !== "none") {
      renderPerfil();
    }
    if (document.getElementById("turnosDisponibles").style.display !== "none") {
      renderTurnosUsuario();
    }
    if (document.getElementById("solicitarTurno").style.display !== "none") {
      renderSolicitarTurnoForm();
    }
  });

  // observar cambios en atributo style del main container para detectar show/hide
  document.querySelectorAll(".card").forEach(card => {
    observer.observe(card, { attributes: true, attributeFilter: ["style"] });
  });
}

// arrancar
initUserPanel();

// funciones mostrar/ocultar
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