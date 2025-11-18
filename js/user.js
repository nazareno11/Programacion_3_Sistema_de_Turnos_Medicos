// user.js

// ======================= CONFIG ENDPOINTS =======================
const API_DOCTORS = "https://6911d53152a60f10c81f73ab.mockapi.io/doctores";
const API_USERS = "https://6911d53152a60f10c81f73ab.mockapi.io/usuarios";
const API_APPOINTMENTS = "https://690b3d176ad3beba00f40db9.mockapi.io/api/appointments";

// ======================= SELECTORES / SECCIONES =======================
const perfilSection = document.getElementById("perfil");
const turnosDisponiblesSection = document.getElementById("turnosDisponibles");
const solicitarTurnoSection = document.getElementById("solicitarTurno");
const menuPrincipal = document.getElementById("menuPrincipal");

// Contenedores dinamicos que agregaremos
let perfilContainer;
let turnosTableContainer;
let solicitarFormContainer;

// Obtener usuario logueado (acepta key "usuario" o "usuarioLogueado")
function getLoggedUser() {
  const s = localStorage.getItem("usuario") || localStorage.getItem("usuarioLogueado") || localStorage.getItem("usuarioLogueado");
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// Verificar sesión / rol
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

// ======================= UTILIDADES =======================
function showSection(id) {
  document.querySelectorAll(".card").forEach(s => s.style.display = "none");
  const el = document.getElementById(id);
  if (el) el.style.display = "block";
}

function volverMenu() {
  document.querySelectorAll(".card").forEach(s => s.style.display = "none");
  document.getElementById("menuPrincipal").style.display = "block";
}

// Mensaje temporal (dentro de una sección)
function showTempMsg(parent, text, color = "green", ms = 2500) {
  const msg = document.createElement("div");
  msg.textContent = text;
  msg.style.color = color;
  msg.style.fontWeight = "600";
  msg.style.marginTop = "8px";
  parent.appendChild(msg);
  setTimeout(() => parent.removeChild(msg), ms);
}

// Formato fecha hoy YYYY-MM-DD
function todayYYYYMMDD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ======================= PERFIL =======================
function renderPerfil() {
  perfilSection.innerHTML = ""; // limpiar
  perfilContainer = document.createElement("div");
  perfilContainer.className = "perfil-container";

  const h = document.createElement("h2");
  h.textContent = "Mi Perfil";
  perfilContainer.appendChild(h);

  const pNombre = document.createElement("p");
  pNombre.innerHTML = `<strong>Nombre:</strong> ${currentUser.nombre || currentUser.nombre_usuario || currentUser.name || ""}`;
  perfilContainer.appendChild(pNombre);

  const pMail = document.createElement("p");
  pMail.innerHTML = `<strong>Mail:</strong> ${currentUser.mail || currentUser.email || currentUser.username || ""}`;
  perfilContainer.appendChild(pMail);

  // Podés añadir más campos (DNI, teléfono) si los guardan en usuarios
  const btnVolver = document.createElement("button");
  btnVolver.textContent = "Volver";
  btnVolver.addEventListener("click", volverMenu);
  perfilContainer.appendChild(btnVolver);

  perfilSection.appendChild(perfilContainer);
}

// ======================= TURNOS DEL USUARIO =======================
async function fetchAppointments() {
  const res = await fetch(API_APPOINTMENTS);
  if (!res.ok) throw new Error("Error al obtener turnos");
  return await res.json();
}

async function fetchDoctors() {
  const res = await fetch(API_DOCTORS);
  if (!res.ok) throw new Error("Error al obtener doctores");
  return await res.json();
}

function buildTurnosTable(turnos, doctorsMap) {
  const wrapper = document.createElement("div");
  wrapper.className = "turnos-wrapper";

  const h = document.createElement("h2");
  h.textContent = "Mis Turnos";
  wrapper.appendChild(h);

  const table = document.createElement("table");
  table.className = "tabla";
  table.innerHTML = `
    <thead id="tabla-mis-turnos">
      <tr><th>Médico</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Acciones</th></tr>
    </thead>
  `;
  const tbody = document.createElement("tbody");

  if (!turnos || turnos.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "No tenés turnos. Solicitá uno en 'Solicitar Turno'.";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    turnos.forEach(t => {
      const tr = document.createElement("tr");
      const medicoNombre = (doctorsMap[t.doctorId] && doctorsMap[t.doctorId].nombre) || `ID ${t.doctorId}`;
      tr.innerHTML = `
        <td>${medicoNombre}</td>
        <td>${t.fecha || ""}</td>
        <td>${t.hora || ""}</td>
        <td>${(t.estado || "").toUpperCase()}</td>
      `;
      const tdAcc = document.createElement("td");

      // Cancelar (si no está cancelado)
      const btnCancelar = document.createElement("button");
      btnCancelar.textContent = "Cancelar";
      btnCancelar.className = "btn-accion btn-cancelar";
      btnCancelar.disabled = ((t.estado || "").toLowerCase() === "cancelado");
      btnCancelar.addEventListener("click", async () => {
        if (!confirm("Deseás cancelar este turno?")) return;
        try {
          // Obtener turno actual y actualizar estado
          const resp = await fetch(`${API_APPOINTMENTS}/${t.id}`);
          const turnoActual = await resp.json();
          const actualizado = { ...turnoActual, estado: "cancelado" };
          await fetch(`${API_APPOINTMENTS}/${t.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(actualizado)
          });
          await renderTurnosUsuario(); // recargar
          showTempMsg(turnosDisponiblesSection, "Turno cancelado", "red");
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

async function renderTurnosUsuario() {
  turnosDisponiblesSection.innerHTML = ""; // limpiar
  turnosTableContainer = document.createElement("div");
  turnosTableContainer.className = "turnos-container";

  try {
    const [turnosAll, doctors] = await Promise.all([fetchAppointments(), fetchDoctors()]);

    // Filtrar solo los turnos del usuario actual
    const myTurnos = turnosAll.filter(t => String(t.patientId) === String(currentUser.id) || String(t.patientId) === String(currentUser.userId));

    // Crear mapa doctors por id
    const doctorsMap = {};
    (doctors || []).forEach(d => doctorsMap[d.id] = d);

    const tableEl = buildTurnosTable(myTurnos, doctorsMap);
    turnosTableContainer.appendChild(tableEl);

    const btnVolver = document.createElement("button");
    btnVolver.textContent = "Volver";
    btnVolver.addEventListener("click", volverMenu);
    turnosTableContainer.appendChild(btnVolver);

    turnosDisponiblesSection.appendChild(turnosTableContainer);
  } catch (err) {
    console.error("Error cargando turnos usuario", err);
    turnosDisponiblesSection.textContent = "Error cargando turnos.";
  }
}

// ======================= SOLICITAR TURNO (formulario simple) =======================
async function renderSolicitarTurnoForm() {
  solicitarTurnoSection.innerHTML = ""; // limpiar
  solicitarFormContainer = document.createElement("div");
  solicitarFormContainer.className = "solicitar-container";

  const h = document.createElement("h2");
  h.textContent = "Solicitar Turno";
  solicitarFormContainer.appendChild(h);

  const form = document.createElement("form");
  form.id = "formSolicitarTurno";

  // select doctores
  const labelDoc = document.createElement("label");
  labelDoc.textContent = "Médico:";
  form.appendChild(labelDoc);

  const selectDoc = document.createElement("select");
  selectDoc.id = "selectDoctor";
  selectDoc.required = true;
  selectDoc.style.width = "100%";
  selectDoc.style.padding = "8px";
  selectDoc.style.marginBottom = "10px";
  form.appendChild(selectDoc);

  // fecha
  const labelFecha = document.createElement("label");
  labelFecha.textContent = "Fecha:";
  form.appendChild(labelFecha);

  const inputFecha = document.createElement("input");
  inputFecha.type = "date";
  inputFecha.id = "inputFecha";
  inputFecha.required = true;
  inputFecha.min = todayYYYYMMDD(); // no permitir fechas pasadas
  inputFecha.style.marginBottom = "10px";
  inputFecha.style.display = "block";
  form.appendChild(inputFecha);

  // hora
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

  // submit
  const btnSubmit = document.createElement("button");
  btnSubmit.type = "submit";
  btnSubmit.textContent = "Solicitar Turno";
  btnSubmit.className = "btn";
  form.appendChild(btnSubmit);

  // feedback
  const feedback = document.createElement("div");
  feedback.id = "feedbackSolicitar";
  feedback.style.marginTop = "10px";
  form.appendChild(feedback);

  solicitarFormContainer.appendChild(form);

  const btnVolver = document.createElement("button");
  btnVolver.textContent = "Volver";
  btnVolver.className = "btn btn-volver";
  btnVolver.style.marginTop = "12px";
  btnVolver.addEventListener("click", volverMenu);
  solicitarFormContainer.appendChild(btnVolver);

  solicitarTurnoSection.appendChild(solicitarFormContainer);

  // Cargar doctores en el select
  try {
    const doctors = await fetchDoctors();
    selectDoc.innerHTML = "";
    const optDefault = document.createElement("option");
    optDefault.value = "";
    optDefault.textContent = "-- Seleccione un médico --";
    selectDoc.appendChild(optDefault);

    doctors.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = `${d.nombre} — ${d.especialidad} (${d.dia_disponible || ""})`;
      selectDoc.appendChild(opt);
    });
  } catch (err) {
    console.error("Error cargando doctores", err);
    selectDoc.innerHTML = `<option value="">Error cargando médicos</option>`;
  }

  // Submit handler: crear turno
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    feedback.textContent = "";

    const doctorId = selectDoc.value;
    const fecha = inputFecha.value;
    const hora = inputHora.value;

    if (!doctorId || !fecha || !hora) {
      feedback.style.color = "red";
      feedback.textContent = "Complete todos los campos.";
      return;
    }

    // Validación de fecha mínima
    if (fecha < todayYYYYMMDD()) {
      feedback.style.color = "red";
      feedback.textContent = "Seleccione una fecha válida (no pasada).";
      return;
    }

    // Crear objeto turno
    const nuevoTurno = {
      patientId: Number(currentUser.id) || currentUser.id,
      doctorId: Number(doctorId) || doctorId,
      fecha,
      hora,
      estado: "pendiente"
    };

    try {
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
      // opcional: mostrar la sección de mis turnos
      showSection("turnosDisponibles");
    } catch (err) {
      console.error("Error solicitando turno", err);
      feedback.style.color = "red";
      feedback.textContent = "Error al solicitar turno. Intentá nuevamente.";
    }
  });
}

// ======================= CERRAR SESIÓN =======================
function cerrarSesion() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("usuarioLogueado");
  window.location.href = "../tpi_turnos_medicos/index.html";
}

// ======================= INICIALIZACIÓN =======================
function initUserPanel() {
  // Render perfil básico
  renderPerfil();

  // Por defecto mostrar menú principal (HTML ya lo hace), pero aseguramos estado
  volverMenu();

  // Preparar listeners para mostrar secciones (las funciones mostrar/volverMenu en el HTML usan display)
  // Si el HTML llama mostrar('perfil'), mostrar('turnosDisponibles') o mostrar('solicitarTurno'),
  // las secciones quedarán en blanco hasta que se rendericen; añadimos listeners para cuando se muestren.
  // Para simplicidad, cada vez que mostramos una sección, renderizamos su contenido.
  const observer = new MutationObserver(() => {
    // cuando se haga visible la sección perfil -> render
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