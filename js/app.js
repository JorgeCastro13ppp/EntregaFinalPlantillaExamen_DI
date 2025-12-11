// ===============================================
//  app.js — versión final corregida y estable
//  Jorge · Desarrollo de Interfaces
// ===============================================


// ------------------------------------------------
// ESTADO GLOBAL
// ------------------------------------------------
const state = {
  books: [],
  logged: false,
  user: null
};


// ------------------------------------------------
// ELEMENTOS DOM
// ------------------------------------------------
const loginOpenBtn = document.getElementById("login-open");
const loginDialog = document.getElementById("login-dialog");
const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-message");
const loginCancel = document.getElementById("login-cancel");

const avatarPlaceholder = document.getElementById("avatar-placeholder");

const booksList = document.getElementById("books-list");
const bookForm = document.getElementById("book-form");
const bookMessage = document.getElementById("book-message");
const bookClear = document.getElementById("book-clear");

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
const searchStatus = document.getElementById("search-status");


// ------------------------------------------------
// STORAGE
// ------------------------------------------------
function saveLocal() {
  localStorage.setItem("miBiblioteca", JSON.stringify(state.books));
}

function loadLocal() {
  const raw = localStorage.getItem("miBiblioteca");
  if (!raw) return;

  try {
    state.books = JSON.parse(raw) || [];
  } catch {
    state.books = [];
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}


// ------------------------------------------------
// HELPERS — CARÁTULAS
// ------------------------------------------------
function coverURL(id, size = "S") {
  return `https://covers.openlibrary.org/b/id/${id}-${size}.jpg`;
}

function noCover() {
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='130' height='200'>
        <rect width='100%' height='100%' fill='#f3f4f6'/>
        <text x='50%' y='50%' text-anchor='middle' fill='#6b7280' font-size='14'>No cover</text>
      </svg>`
    )
  );
}


// ------------------------------------------------
// LOGIN / AVATAR
// ------------------------------------------------
const AVATAR_URL = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

function showAvatar(u) {
  avatarPlaceholder.innerHTML = `
    <img src="${AVATAR_URL}" alt="Avatar usuario" id="avatar-img">
    <button id="logout-btn" class="nav-btn secondary">Salir</button>
  `;

  document.getElementById("logout-btn").addEventListener("click", () => {
    if (!confirm("¿Seguro que quieres cerrar sesión?")) return;
    state.logged = false;
    state.user = null;
    avatarPlaceholder.innerHTML = "";
    loginOpenBtn.style.display = "inline-block";
  });

  loginOpenBtn.style.display = "none";
}



// ------------------------------------------------
// LOGIN — EVENTOS
// ------------------------------------------------
loginOpenBtn.addEventListener("click", () =>
  loginDialog.setAttribute("aria-hidden", "false")
);

loginCancel.addEventListener("click", () => {
  loginDialog.setAttribute("aria-hidden", "true");
  loginForm.reset();
  loginMsg.textContent = "";
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value;

  if (u !== "1234") {
    loginMsg.textContent = "Usuario incorrecto";
    loginMsg.style.color = "var(--danger)";
    return;
  }

  if (p !== "password") {
    loginMsg.textContent = "Contraseña incorrecta";
    loginMsg.style.color = "var(--danger)";
    return;
  }

  state.logged = true;
  state.user = u;
  showAvatar(u);

  loginDialog.setAttribute("aria-hidden", "true");
  loginForm.reset();
  loginMsg.textContent = "";
});


// ------------------------------------------------
// RENDERIZAR LIBROS
// ------------------------------------------------
function renderBooks() {
  booksList.innerHTML = "";

  if (state.books.length === 0) {
    booksList.innerHTML = `<p class="status">No hay libros todavía.</p>`;
    return;
  }

  state.books.forEach((b) => {
    const li = document.createElement("li");
    li.className = "book-card";

    // Imagen
    const img = document.createElement("img");
    img.alt = `${b.title} — carátula`;
    img.src = b.cover_i ? coverURL(b.cover_i, b.cover_size || "S") : noCover();

    // Meta
    const meta = document.createElement("div");
    meta.className = "book-meta";

    meta.innerHTML = `
      <h3>${b.title}</h3>
      <p>
        <strong>Autor:</strong> ${b.author || "Desconocido"}<br>
        <strong>Año:</strong> ${b.year || "s.f."}<br>
        <strong>Género: <span class="genero">${b.genere|| "Otro"}</span> </strong> <br>
        ${b.isbn ? `<strong>ISBN:</strong> ${b.isbn}` : ""}
      </p>
    `;

    // Selector S/M/L
    const selectWrap = document.createElement("div");
    selectWrap.className = "cover-select";
    selectWrap.innerHTML = `
      <label>Tamaño:</label>
      <select>
        <option value="S">S</option>
        <option value="M">M</option>
        <option value="L">L</option>
      </select>
    `;

    const select = selectWrap.querySelector("select");
    select.value = b.cover_size || "S";

    select.addEventListener("change", () => {
      b.cover_size = select.value;
      img.src = b.cover_i ? coverURL(b.cover_i, b.cover_size) : noCover();
      saveLocal();
    });

    meta.appendChild(selectWrap);

    // Acciones
    const actions = document.createElement("div");
    actions.className = "book-actions";
    actions.innerHTML = `
      <button class="secondary">Editar</button>
      <button>Borrar</button>
    `;

    actions.children[0].addEventListener("click", () => loadToForm(b.id));
    actions.children[1].addEventListener("click", () => removeBook(b.id));

    meta.appendChild(actions);

    li.appendChild(img);
    li.appendChild(meta);

    booksList.appendChild(li);
  });
}


// ------------------------------------------------
// CRUD LIBROS
// ------------------------------------------------
function addBook(data) {
  const book = {
    id: uid(),
    title: data.title || "",
    author: data.author || "",
    year: data.year || "",
    cover_i: data.cover_i || "",
    cover_size: data.cover_size || "S",
    genere: data.genere || "Otros",
    isbn: data.isbn || ""
  };

  state.books.unshift(book);
  saveLocal();
  renderBooks();
  markCancerBooks();
}

function loadToForm(id) {
  const b = state.books.find((x) => x.id === id);
  if (!b) return;

  document.getElementById("book-id").value = b.id;
  document.getElementById("title").value = b.title;
  document.getElementById("author").value = b.author;
  document.getElementById("year").value = b.year;
  document.getElementById("cover").value = b.cover_i;
  document.getElementById("genere").value = b.genere;
  document.getElementById("isbn").value = b.isbn;

  window.location.hash = "#form-agregar";
}

function removeBook(id) {
  if (!confirm("¿Deseas borrar este libro?")) return;

  state.books = state.books.filter((b) => b.id !== id);
  saveLocal();
  renderBooks();
}


// ------------------------------------------------
// FORMULARIO DE AÑADIR/EDITAR
// ------------------------------------------------
bookForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = document.getElementById("book-id").value;
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const year = document.getElementById("year").value.trim();
  const cover_i = document.getElementById("cover").value.trim();
  const genere = document.getElementById("genere").value.trim();
  const isbn = document.getElementById("isbn").value.trim();

  if (!title) {
    bookMessage.textContent = "El título es obligatorio";
    return;
  }

  if (id) {
    // Editar libro existente
    const b = state.books.find((x) => x.id === id);

    b.title = title;
    b.author = author;
    b.year = year;
    b.cover_i = cover_i;
    b.genere = genere;
    b.isbn = isbn;

    saveLocal();
    renderBooks();
    markCancerBooks();
    bookMessage.textContent = "Libro actualizado";
  } else {
    // Nuevo libro
    addBook({ title, author, year, cover_i,genere, isbn });
    bookMessage.textContent = "Libro añadido";
  }

  bookForm.reset();
  document.getElementById("book-id").value = "";

  setTimeout(() => (bookMessage.textContent = ""), 1800);
});

bookClear.addEventListener("click", () => {
  bookForm.reset();
  document.getElementById("book-id").value = "";
});


// ------------------------------------------------
// BÚSQUEDA OPENLIBRARY
// ------------------------------------------------
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const q = searchInput.value.trim();
  if (!q) return;

  searchResults.innerHTML = "";
  searchStatus.textContent = "Buscando...";

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(q)}&limit=18`
    );

    if (!res.ok) throw new Error("Error en la búsqueda");

    const data = await res.json();

    searchStatus.textContent = `${data.docs.length} resultados`;

    if (!data.docs.length) {
      searchResults.innerHTML = `<p class="status">No se encontraron resultados.</p>`;
      return;
    }

    data.docs.forEach((d) => {
      const card = document.createElement("article");
      card.className = "book-card";

      const img = document.createElement("img");
      img.src = d.cover_i ? coverURL(d.cover_i) : noCover();
      img.alt = d.title;

      const meta = document.createElement("div");
      meta.className = "book-meta";

      const author = (d.author_name && d.author_name[0]) || "Desconocido";

      meta.innerHTML = `
        <h3>${d.title}</h3>
        <p>
          <strong>Autor:</strong> ${author}<br>
          <strong>Año:</strong> ${d.first_publish_year || "s.f."}<br>
          <strong>Género <span class="genero">${d.genere}</span></strong>
          <strong>ISBN:</strong> ${(d.isbn && d.isbn[0]) || "No disponible"}
        </p>
      `;

      const btn = document.createElement("button");
      btn.textContent = "Añadir";

      btn.addEventListener("click", () => {
        addBook({
          title: d.title,
          author,
          year: d.first_publish_year,
          cover_i: d.cover_i,
          isbn: d.isbn ? d.isbn[0] : ""
        });
      });

      meta.appendChild(btn);

      card.appendChild(img);
      card.appendChild(meta);
      searchResults.appendChild(card);
    });
  } catch {
    searchStatus.textContent = "Error en la búsqueda";
  }
});


// ------------------------------------------------
// INICIALIZACIÓN
// ------------------------------------------------
(function init() {
  loadLocal();

  if (state.books.length === 0) {
    state.books = [
      {
        id: uid(),
        title: "Don Quijote de la Mancha",
        author: "Miguel de Cervantes",
        year: 1605,
        cover_i: "8463501",
        genere: "No ficción",
        cover_size: "S"
      }
    ];
    saveLocal();
  }

  renderBooks();
  markCancerBooks();
})();

function markCancerBooks() {
  const cards = document.querySelectorAll('.book-card');

  cards.forEach(card => {
    const generoEl = card.querySelector('.genero');
    if (!generoEl) return;

    const gen = generoEl.textContent.trim().toLowerCase();

    if (gen === "día contra el cáncer" || gen === "día contra el cancer") {
      card.classList.add("cancer-book");
    } else {
      card.classList.remove("cancer-book");
    }
  });
}


