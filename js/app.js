// app.js — interactividad: login simulado, CRUD local, búsqueda OpenLibrary

// Estado de la aplicación (simple store local)
const state = {
  books: [], // array con los libros (persistimos en localStorage)
  logged: false,
  user: null,
};

// ---------- ELEMENTOS DEL DOM ----------
const loginOpenBtn = document.getElementById("login-open"); // botón 'Iniciar sesión'
const loginDialog = document.getElementById("login-dialog"); // sección modal
const loginForm = document.getElementById("login-form"); // formulario login
const loginMsg = document.getElementById("login-message"); // mensajes login
const loginCancel = document.getElementById("login-cancel"); // cancelar login
const avatarPlaceholder = document.getElementById("avatar-placeholder"); // donde va el avatar
const userArea = document.getElementById("user-area"); // contenedor de usuario (botón/ avatar)

let logoutBtn = null; // variable para almacenar el botón 'Salir' cuando lo creemos dinámicamente

const booksList = document.getElementById("books-list"); // lista de libros (UI)
const bookForm = document.getElementById("book-form"); // form añadir/editar libro
const bookMessage = document.getElementById("book-message"); // mensajes CRUD libro
const bookClear = document.getElementById("book-clear"); // limpiar form

const searchForm = document.getElementById("search-form"); // form búsqueda OpenLibrary
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results"); // contenedor resultados búsqueda
const searchStatus = document.getElementById("search-status"); // texto estado búsqueda

// ---------- HELPERS: localStorage y UID ----------
function saveLocal() {
  // Guardamos únicamente la lista de libros (no el estado de login)
  localStorage.setItem("miBiblioteca", JSON.stringify(state.books));
}
function loadLocal() {
  const data = localStorage.getItem("miBiblioteca");
  if (data) state.books = JSON.parse(data);
}
function uid() {
  // id única simple
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ---------- RENDER: Botón SALIR (dinámico) ----------
function renderLogoutButton() {
  // Si ya existe, salimos (previene duplicados)
  if (logoutBtn) return;

  // Creamos botón 'Salir'
  logoutBtn = document.createElement("button");
  logoutBtn.textContent = "Salir";
  logoutBtn.id = "logout-btn";

  // Estilo mínimo (se puede mover a CSS)
  logoutBtn.style.background = "var(--danger)";
  logoutBtn.style.padding = ".45rem .8rem";
  logoutBtn.style.borderRadius = "8px";
  logoutBtn.style.color = "#fff";
  logoutBtn.style.border = "none";
  logoutBtn.style.cursor = "pointer";

  // Al hacer click en 'Salir' mostramos confirmación
  logoutBtn.addEventListener("click", () => {
    // Confirmación simple con confirm(). Puedes reemplazar por modal si prefieres.
    const confirmar = confirm("Vas a cerrar sesión.\n¿Estás seguro?");
    if (!confirmar) return;

    // Limpieza de estado
    state.logged = false;
    state.user = null;

    // Borrar avatar visualmente
    avatarPlaceholder.innerHTML = "";

    // Eliminar el botón logout y volver a mostrar 'Iniciar sesión'
    logoutBtn.remove();
    logoutBtn = null;

    // Hacemos visible el botón de inicio de sesión
    loginOpenBtn.style.display = "inline-block";
  });

  // Añadimos el botón al área de usuario y ocultamos el 'Iniciar sesión'
  userArea.appendChild(logoutBtn);
  loginOpenBtn.style.display = "none";
}

// ---------- RENDER: Lista de libros ----------
function renderBooks() {
  booksList.innerHTML = "";
  if (state.books.length === 0) {
    booksList.innerHTML =
      '<p class="status">No hay libros. Añade uno en el formulario.</p>';
    return;
  }

  // Para cada libro construimos la tarjeta (card) DOM
  state.books.forEach((b) => {
    const li = document.createElement("li");
    li.className = "book-card";
    li.tabIndex = 0; // para navegación por teclado

    // Imagen (carátula)
    const img = document.createElement("img");
    img.alt = b.title + " — carátula";
    if (b.cover_i)
      img.src = `https://covers.openlibrary.org/b/id/${b.cover_i}-S.jpg`;
    else
      img.src =
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="130" height="200"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="14">No cover</text></svg>';

    // Metadatos (título, autor, año)
    const meta = document.createElement("div");
    meta.className = "book-meta";
    const h3 = document.createElement("h3");
    h3.textContent = b.title;
    const p = document.createElement("p");
    p.textContent = `${b.author || "Desconocido"} — ${b.year || "s.f."}`;
    meta.appendChild(h3);
    meta.appendChild(p);

    // Acciones: editar y borrar
    const actions = document.createElement("div");
    actions.className = "book-actions";

    const edit = document.createElement("button");
    edit.textContent = "Editar";
    edit.className = "secondary";
    edit.addEventListener("click", () => loadToForm(b.id));

    const del = document.createElement("button");
    del.textContent = "Borrar";
    del.addEventListener("click", () => removeBook(b.id));

    actions.appendChild(edit);
    actions.appendChild(del);

    // Montaje del card
    li.appendChild(img);
    li.appendChild(meta);
    li.appendChild(actions);

    booksList.appendChild(li);
  });
}

// ---------- CRUD libros ----------
function addBook(data) {
  const newBook = {
    id: uid(),
    title: data.title,
    author: data.author,
    year: data.year,
    cover_i: data.cover,
  };
  state.books.unshift(newBook); // añadimos al inicio
  saveLocal();
  renderBooks();
  bookMessage.textContent = "Libro guardado";
  setTimeout(() => (bookMessage.textContent = ""), 1500);
}

function loadToForm(id) {
  const b = state.books.find((x) => x.id === id);
  if (!b) return;
  document.getElementById("book-id").value = b.id;
  document.getElementById("title").value = b.title;
  document.getElementById("author").value = b.author || "";
  document.getElementById("year").value = b.year || "";
  document.getElementById("cover").value = b.cover_i || "";
  // Llevar al formulario
  window.location.hash = "#form-agregar";
}

function removeBook(id) {
  if (!confirm("¿Eliminar este libro?")) return;
  state.books = state.books.filter((x) => x.id !== id);
  saveLocal();
  renderBooks();
}

// ---------- EVENTOS FORM LIBROS ----------
bookForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("book-id").value;
  const title = document.getElementById("title").value.trim();
  if (!title) {
    bookMessage.textContent = "El título es obligatorio";
    return;
  }
  const author = document.getElementById("author").value.trim();
  const year = document.getElementById("year").value;
  const cover = document.getElementById("cover").value.trim();

  if (id) {
    // editar si existe id
    const b = state.books.find((x) => x.id === id);
    if (b) {
      b.title = title;
      b.author = author;
      b.year = year;
      b.cover_i = cover;
      saveLocal();
      renderBooks();
      bookMessage.textContent = "Libro actualizado";
      setTimeout(() => (bookMessage.textContent = ""), 1500);
    }
  } else {
    // crear nuevo
    addBook({ title, author, year, cover });
  }

  // reset del form
  bookForm.reset();
  document.getElementById("book-id").value = "";
});

bookClear.addEventListener("click", () => {
  bookForm.reset();
  document.getElementById("book-id").value = "";
});

// ---------- LOGIN: abrir / cerrar modal ----------
loginOpenBtn.addEventListener("click", () => {
  // mostramos dialog usando aria-hidden="false"
  loginDialog.setAttribute("aria-hidden", "false");
  document.getElementById("username").focus();
});

loginCancel.addEventListener("click", () => {
  loginDialog.setAttribute("aria-hidden", "true");
  loginMsg.textContent = "";
  loginForm.reset();
});

// ---------- LOGIN: submit (validación simple) ----------
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value;

  // Credenciales simuladas
  if (u !== "1234") {
    loginMsg.textContent = "Usuario no encontrado";
    loginMsg.style.color = "var(--danger)";
    return;
  }
  if (p !== "password") {
    loginMsg.textContent = "Contraseña incorrecta";
    loginMsg.style.color = "var(--danger)";
    return;
  }

  // Éxito: actualizamos estado y renderizamos avatar y botón salir
  state.logged = true;
  state.user = u;
  loginMsg.textContent = "Conectado";
  loginMsg.style.color = "var(--success)";

  // Mostrar avatar en la esquina superior derecha
  renderAvatar();

  // Mostrar botón Salir y ocultar Iniciar sesión
  renderLogoutButton();

  // Cerramos el diálogo suavemente
  setTimeout(() => {
    loginDialog.setAttribute("aria-hidden", "true");
    loginMsg.textContent = "";
    loginForm.reset();
  }, 600);
});

// ---------- AVATAR RENDER ----------
function renderAvatar() {
  avatarPlaceholder.innerHTML = "";
  if (state.logged) {
    // generamos un avatar muy básico con SVG inline (no necesitas imagen real)
    const img = document.createElement("img");
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='88' height='88'><rect width='100%' height='100%' fill='%231f6feb'/><text x='50%' y='55%' font-size='36' text-anchor='middle' fill='white' font-family='Arial' dy='.3em'>${state.user.slice(
      -2
    )}</text></svg>`;
    img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    img.alt = "Avatar del usuario " + state.user;
    avatarPlaceholder.appendChild(img);
    // marcamos aria-hidden=false para que lector de pantalla lo detecte si es relevante
    avatarPlaceholder.setAttribute("aria-hidden", "false");
  } else {
    avatarPlaceholder.setAttribute("aria-hidden", "true");
  }
}

// ---------- BÚSQUEDA: OpenLibrary ----------
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (!q) return;

  searchStatus.textContent = "Buscando...";
  searchResults.innerHTML = "";

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(
        q
      )}&limit=12`
    );
    if (!res.ok) throw new Error("error en la búsqueda");

    const data = await res.json();
    searchStatus.textContent = `${data.docs.length} resultados`;

    // Renderizado de resultados (cada resultado con botón 'Añadir' para importar al catálogo local)
    data.docs.forEach((d) => {
      const card = document.createElement("article");
      card.className = "book-card";

      const img = document.createElement("img");
      img.alt = (d.title || "Sin título") + " — carátula";
      if (d.cover_i)
        img.src = `https://covers.openlibrary.org/b/id/${d.cover_i}-S.jpg`;
      else
        img.src =
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="130" height="200"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="14">No cover</text></svg>';

      const meta = document.createElement("div");
      meta.className = "book-meta";

      const h3 = document.createElement("h3");
      h3.textContent = d.title;

      const p = document.createElement("p");
      p.textContent = `${
        (d.author_name && d.author_name[0]) || "Desconocido"
      } — ${d.first_publish_year || "s.f."}`;

      const actions = document.createElement("div");
      actions.className = "book-actions";

      const addBtn = document.createElement("button");
      addBtn.textContent = "Añadir";
      addBtn.addEventListener("click", () => {
        // añadir desde resultado
        const newB = {
          title: d.title,
          author: (d.author_name && d.author_name[0]) || "",
          year: d.first_publish_year || "",
          cover_i: d.cover_i || "",
        };
        state.books.unshift({ id: uid(), ...newB });
        saveLocal();
        renderBooks();
      });

      actions.appendChild(addBtn);
      meta.appendChild(h3);
      meta.appendChild(p);
      meta.appendChild(actions);
      card.appendChild(img);
      card.appendChild(meta);
      searchResults.appendChild(card);
    });
  } catch (err) {
    searchStatus.textContent = "Error buscando";
  }
});

// ---------- INICIALIZACIÓN ----------
(function init() {
  loadLocal();
  // Seed inicial si no hay datos
  if (state.books.length === 0) {
    state.books = [
      {
        id: uid(),
        title: "Don Quijote de la Mancha",
        author: "Miguel de Cervantes",
        year: 1605,
        cover_i: "8463501",
      },
      {
        id: uid(),
        title: "La sombra del viento",
        author: "Carlos Ruiz Zafón",
        year: 2001,
      },
    ];
    saveLocal();
  }

  renderBooks();
})();

// ---------- ACCESIBILIDAD ADICIONAL ----------
// Cerrar diálogo con Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    loginDialog.setAttribute("aria-hidden", "true");
    loginMsg.textContent = "";
  }
});

// Focus visible (añade / quita clase para estilos de foco)
document.addEventListener("focusin", (e) => {
  if (e.target.matches("button,input,textarea,a"))
    e.target.classList.add("focus-visible");
});
document.addEventListener("focusout", (e) => {
  if (e.target.matches("button,input,textarea,a"))
    e.target.classList.remove("focus-visible");
});
