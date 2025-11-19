const API_DOCTORS = "https://6911d53152a60f10c81f73ab.mockapi.io/doctores";
const API_USERS = "https://6911d53152a60f10c81f73ab.mockapi.io/usuarios";
const API_APPOINTMENTS = "https://690b3d176ad3beba00f40db9.mockapi.io/api/appointments";

const formMedico = document.getElementById("formMedico");
const tablaMedicosTbody = document.getElementById("tablaMedicos");
const tablaTurnosTbody = document.getElementById("tablaTurnos");
const btnLogout = document.getElementById("btnLogout");
const graficoCanvas = document.getElementById("graficoTurnos");
const mainContainer = document.querySelector(".main-container");

// Section placeholders for users 
let usersSectionEl = null;

// Chart.js instancia
let turnosChart = null;


function showTempMessage(parent, text, color = "green", ms = 2000) { // funcion para mensajes
  const msg = document.createElement("div");
  msg.textContent = text;
  msg.style.color = color;
  msg.style.fontWeight = "600";
  msg.style.marginTop = "8px";
  parent.appendChild(msg);
  setTimeout(() => parent.removeChild(msg), ms);
}

// verificacion de roles 
function requireAdmin() {
  const usuarioStr = localStorage.getItem("usuario") || localStorage.getItem("usuarioLogueado");
  if (!usuarioStr) {
    alert("Debes iniciar sesión.");
    window.location.href = "../index.html" ; 
    return null;
  }
  const usuario = JSON.parse(usuarioStr);
  const rol = (usuario.rol || usuario.role || "").toString().toLowerCase();
  if (rol !== "admin" && rol !== "administrador") {
    alert("Acceso no autorizado. Debe ser ADMIN.");
    window.location.href = "../index.html";
    return null;
  }
  return usuario;
}

const adminUser = requireAdmin();
if (!adminUser) {
  throw new Error("No admin - redirigido"); //por si ya esta redirigido
}

// logout
btnLogout.addEventListener("click", () => {
  localStorage.removeItem("usuario");
  localStorage.removeItem("usuarioLogueado");
  window.location.href = "../tpi_turnos_medicos/index.html";
});

// Doctores CRUD
async function getDoctors() {
  const res = await fetch(API_DOCTORS);
  return await res.json();
}

function crearFilaDoctor(doc) {
  const tr = document.createElement("tr");

  const tdNombre = document.createElement("td");
  tdNombre.textContent = doc.nombre || "";
  tr.appendChild(tdNombre);

  const tdEsp = document.createElement("td");
  tdEsp.textContent = doc.especialidad || "";
  tr.appendChild(tdEsp);

  const tdDias = document.createElement("td");
  tdDias.textContent = doc.dia_disponible || "";
  tr.appendChild(tdDias);

  const tdAcc = document.createElement("td");

  // update
  const btnEditar = document.createElement("button");
  btnEditar.textContent = "Editar";
  btnEditar.className = "btn-accion btn-editar";
  btnEditar.addEventListener("click", () => openEditDoctorModal(doc));
  tdAcc.appendChild(btnEditar);

  // delete
  const btnEliminar = document.createElement("button");
  btnEliminar.textContent = "Eliminar";
  btnEliminar.className = "btn-accion btn-eliminar";
  btnEliminar.addEventListener("click", async () => {
    if (!confirm(`Eliminar al médico ${doc.nombre}?`)) return;
    try {
      await fetch(`${API_DOCTORS}/${doc.id}`, { method: "DELETE" });
      await cargarYMostrarDoctores(); //recargar la tabla
      showTempMessage(document.querySelector("#medicos .section"), "Doctor eliminado", "red");
    } catch (err) {
      console.error(err);
      console.log("Error eliminando doctor");
    }
  });
  tdAcc.appendChild(btnEliminar);

  tr.appendChild(tdAcc);
  return tr;
}

async function mostrarDoctores(lista) {
  tablaMedicosTbody.innerHTML = "";
  lista.forEach(doc => {
    tablaMedicosTbody.appendChild(crearFilaDoctor(doc));
  });
}

// Formulario agregar
formMedico.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombreMedico").value.trim();
  const especialidad = document.getElementById("especialidadMedico").value.trim();
  const dias = document.getElementById("diasDisponibles").value.trim();

  if (!nombre || !especialidad) {
    showTempMessage(formMedico, "Complete nombre y especialidad", "red");
    return;
  }

  const nuevo = { nombre, especialidad, dia_disponible: dias };

  try {
    await fetch(API_DOCTORS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevo)
    });
    formMedico.reset();
    await cargarYMostrarDoctores();
    showTempMessage(document.querySelector("#medicos .section"), "Doctor agregado", "green");
  } catch (err) {
    console.error(err);
    console.log("Error al agregar doctor");
  }
});

async function cargarYMostrarDoctores() {
  try {
    const docs = await getDoctors();
    await mostrarDoctores(docs);
  } catch (err) {
    console.log("Error cargando doctores", err);
  }
}

//editar doctor
function openEditDoctorModal(doc) {
  // crear un modal simple en DOM (sin librerías)
  const modal = document.createElement("div");
  modal.className = "modal-edit-overlay";
  modal.style = `
    position:fixed;left:0;top:0;width:100%;height:100%;
    display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);z-index:9999;
  `;

  const box = document.createElement("div");
  box.style = `
    background:#fff;padding:20px;border-radius:12px;min-width:300px;max-width:90%;
  `;

  box.innerHTML = `
    <h3>Editar Médico</h3>
    <label>Nombre</label>
    <input id="editNombre" value="${escapeHtml(doc.nombre || "")}" style="width:100%;padding:8px;margin-bottom:8px;">
    <label>Especialidad</label>
    <input id="editEsp" value="${escapeHtml(doc.especialidad || "")}" style="width:100%;padding:8px;margin-bottom:8px;">
    <label>Días disponibles</label>
    <input id="editDias" value="${escapeHtml(doc.dia_disponible || "")}" style="width:100%;padding:8px;margin-bottom:12px;">
    <div style="text-align:right">
      <button id="cancelEdit" style="margin-right:8px;padding:6px 10px;border-radius:6px;">Cancelar</button>
      <button id="saveEdit" style="padding:6px 10px;border-radius:6px;background:#4a90e2;color:#fff;border:none;">Guardar</button>
    </div>
  `;

  modal.appendChild(box);
  document.body.appendChild(modal);

  document.getElementById("cancelEdit").addEventListener("click", () => document.body.removeChild(modal));
  document.getElementById("saveEdit").addEventListener("click", async () => {
    const nombre = document.getElementById("editNombre").value.trim();
    const especialidad = document.getElementById("editEsp").value.trim();
    const dias = document.getElementById("editDias").value.trim();

    if (!nombre || !especialidad) {
      alert("Nombre y especialidad obligatorios");
      return;
    }

    try {
      await fetch(`${API_DOCTORS}/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, especialidad, dia_disponible: dias })
      });
      document.body.removeChild(modal);
      await cargarYMostrarDoctores();
      showTempMessage(document.querySelector("#medicos .section"), "Doctor editado", "green");
    } catch (err) {
      console.error(err);
      console.log("Error al editar");
    }
  });
}

// funcion para que no se rompa el html si se escriben comillas al editar un medico
function escapeHtml(str) {
  return str.replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

// users crud
async function getUsers() {
  const res = await fetch(API_USERS);
  return await res.json();
}

function ensureUsersSection() {  //crear la seccion de usuarios solo una vez
  if (usersSectionEl) return usersSectionEl; //si seccionuser ya fe creado sale de la funcion(y no duplicar la seccion en el html)

  // si no existe se crea
  usersSectionEl = document.createElement("section");
  usersSectionEl.className = "section";
  usersSectionEl.id = "usuarios";
  usersSectionEl.innerHTML = `
    <h2>Gestión de Usuarios</h2>
    <div class="users-wrapper">
      <table class="tabla" id="tablaUsuarios">
        <thead>
          <tr><th>Nombre</th><th>Mail</th><th>Rol</th><th>Acciones</th></tr>
        </thead>
        <tbody id="tablaUsuariosBody"></tbody>
      </table>
    </div>
  `;

  // insertarlo después de la sección medicos
  const medicosSection = document.getElementById("medicos");
  medicosSection.parentNode.insertBefore(usersSectionEl, medicosSection.nextSibling);
  return usersSectionEl; //lo guarda en la variable global
}

function crearFilaUsuario(u) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${u.nombre || ""}</td>
    <td>${u.mail || ""}</td>
    <td>${u.rol || ""}</td>
  `;
  const tdAcc = document.createElement("td");

  const btnEliminar = document.createElement("button");
  btnEliminar.className = "btn-accion btn-eliminar";
  btnEliminar.textContent = "Eliminar";
  btnEliminar.addEventListener("click", async () => {
    if (!confirm(`Eliminar usuario ${u.nombre}?`)) return;
    try {
      await fetch(`${API_USERS}/${u.id}`, { method: "DELETE" });
      await cargarYMostrarUsuarios();
      showTempMessage(usersSectionEl, "Usuario eliminado", "red");
    } catch (err) {
      console.error(err);
      console.log("Error eliminando usuario");
    }
  });

  tdAcc.appendChild(btnEliminar);
  tr.appendChild(tdAcc);
  return tr;
}

async function cargarYMostrarUsuarios() {
  try {
    ensureUsersSection();
    const usuarios = await getUsers();
    const tbody = document.getElementById("tablaUsuariosBody");
    tbody.innerHTML = "";
    usuarios.forEach(u => tbody.appendChild(crearFilaUsuario(u)));
  } catch (err) {
    console.log("Error cargando usuarios", err);
  }
}

// Turnos listar y acciones
async function getAppointments() {
  const res = await fetch(API_APPOINTMENTS);
  return await res.json();
}

function crearFilaTurno(turno, usersCache = {}, doctorsCache = {}) {
  const tr = document.createElement("tr");

  const pacienteTd = document.createElement("td");
  pacienteTd.textContent = (usersCache[turno.patientId]?.nombre) || `ID ${turno.patientId}`;
  tr.appendChild(pacienteTd);

  const medicoTd = document.createElement("td");
  medicoTd.textContent = (doctorsCache[turno.doctorId]?.nombre) || `ID ${turno.doctorId}`;
  tr.appendChild(medicoTd);

  const fechaTd = document.createElement("td");
  fechaTd.textContent = turno.fecha || "";
  tr.appendChild(fechaTd);

  const horaTd = document.createElement("td");
  horaTd.textContent = turno.hora || "";
  tr.appendChild(horaTd);

  const estadoTd = document.createElement("td");
  estadoTd.textContent = (turno.estado || "").toUpperCase();
  tr.appendChild(estadoTd);

  const accionesTd = document.createElement("td");

  // Confirmar (solo si está pendiente)
  const btnConfirm = document.createElement("button");
  btnConfirm.className = "btn-accion btn-confirmar";
  btnConfirm.textContent = "Confirmar";
  btnConfirm.disabled = (turno.estado || "").toLowerCase() !== "pendiente";
  btnConfirm.addEventListener("click", async () => {
    await updateAppointmentEstado(turno.id, "confirmado");
  });
  accionesTd.appendChild(btnConfirm);

  // Cancelar
  const btnCancel = document.createElement("button");
  btnCancel.className = "btn-accion btn-cancelar";
  btnCancel.textContent = "Cancelar";
  btnCancel.disabled = (turno.estado || "").toLowerCase() === "cancelado";
  btnCancel.addEventListener("click", async () => {
    await updateAppointmentEstado(turno.id, "cancelado");
  });
  accionesTd.appendChild(btnCancel);

  // Eliminar
  const btnDel = document.createElement("button");
  btnDel.className = "btn-accion btn-eliminar";
  btnDel.textContent = "Eliminar";
  btnDel.addEventListener("click", async () => {
    if (!confirm("Eliminar turno?")) return;
    try {
      await fetch(`${API_APPOINTMENTS}/${turno.id}`, { method: "DELETE" });
      await cargarYMostrarTurnos();
      showTempMessage(document.querySelector("#turnos .section"), "Turno eliminado", "red");
    } catch (err) {
      console.error(err);
      console.log("Error eliminando turno");
    }
  });
  accionesTd.appendChild(btnDel);

  tr.appendChild(accionesTd);
  return tr;
}

async function updateAppointmentEstado(id, nuevoEstado) {
  try {
    // Obtener turno actual 
    const res = await fetch(`${API_APPOINTMENTS}/${id}`);
    const turno = await res.json();
    const actualizado = { ...turno, estado: nuevoEstado }; //creamos el nuevo objeto actualizado
    await fetch(`${API_APPOINTMENTS}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(actualizado)
    });
    await cargarYMostrarTurnos(); //recargamos 
    showTempMessage(document.querySelector("#turnos .section"), `Turno ${nuevoEstado}`, "green");
  } catch (err) {
    console.error(err);
    console.log("Error actualizando estado");
  }
}

async function cargarYMostrarTurnos() {
  try {
    const [turnos, usuarios, doctores] = await Promise.all([getAppointments(), getUsers(), getDoctors()]); //llama a las 3 apis al mismo tiempo
    // crear caches por id para mostrar nombres
    const usersCache = {};
    usuarios.forEach(u => usersCache[u.id] = u);
    const doctorsCache = {};
    doctores.forEach(d => doctorsCache[d.id] = d);

    tablaTurnosTbody.innerHTML = "";
    turnos.forEach(t => tablaTurnosTbody.appendChild(crearFilaTurno(t, usersCache, doctorsCache))); //creamos cada fila
    actualizarGrafico(turnos);
  } catch (err) {
    console.log("Error cargando turnos", err);
  }
}

//  DASHBOARD (Chart.js) 
function initChart() {
  if (!graficoCanvas) return; //verificar si existe el canvas
  const ctx = graficoCanvas.getContext("2d"); 
  turnosChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["pendiente", "confirmado", "cancelado"],
      datasets: [{
        label: "Turnos",
        data: [0, 0, 0, 0],
        backgroundColor: ["#f1c40f", "#2ecc71", "#e74c3c"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    }
  });
}

function actualizarGrafico(turnos) {
  if (!turnosChart) return; // verificar si existe el grafico
  const estados = { pendiente: 0, confirmado: 0, cancelado: 0, completado: 0 }; //contador para cada estado
  turnos.forEach(t => { //recorremos los turnos 
    const e = (t.estado || "").toLowerCase();
    if (e in estados) estados[e] += 1;
    else estados["pendiente"] += 0; // ignora otros estados
  });
  turnosChart.data.datasets[0].data = [
    estados.pendiente,
    estados.confirmado,
    estados.cancelado,
    estados.completado
  ];
  turnosChart.update(); //recarga y dibuja el grafico
}

// inicializar
async function initAdmin() {
  // iniciar chart
  initChart();

  // cargar datos principales
  await cargarYMostrarDoctores();
  await cargarYMostrarUsuarios();
  await cargarYMostrarTurnos();
}

initAdmin().catch(err => console.error("Error init admin", err)); 
