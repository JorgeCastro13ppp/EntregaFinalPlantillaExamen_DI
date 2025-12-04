// app.js — actualizado: selector S/M/L operativo, styling corregido, y campo ISBN añadido/guardado.

/* ==========================
   Estado de la aplicación
   ========================== */
   const state = {
    books: [],
    logged: false,
    user: null
  };
  
  /* ==========================
     Elementos DOM
     ========================== */
  const loginOpenBtn = document.getElementById("login-open");
  const loginDialog = document.getElementById("login-dialog");
  const loginForm = document.getElementById("login-form");
  const loginMsg = document.getElementById("login-message");
  const loginCancel = document.getElementById("login-cancel");
  const avatarPlaceholder = document.getElementById("avatar-placeholder");
  const userArea = document.getElementById("user-area");
  
  let logoutBtn = null;
  
  const booksList = document.getElementById("books-list");
  const bookForm = document.getElementById("book-form");
  const bookMessage = document.getElementById("book-message");
  const bookClear = document.getElementById("book-clear");
  
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  const searchStatus = document.getElementById("search-status");
  const spinner = document.getElementById("spinner");
  
  /* ==========================
     Helpers: localStorage + UID
     ========================== */
  function saveLocal() {
    localStorage.setItem("miBiblioteca", JSON.stringify(state.books));
  }
  function loadLocal() {
    const data = localStorage.getItem("miBiblioteca");
    if (data) {
      try { state.books = JSON.parse(data) || []; } catch (e) { state.books = []; }
    }
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  
  /* ==========================
     Helper: cover URL S/M/L
     ========================== */
  function coverURL(id, size = "S") {
    if (!id) return "";
    return `https://covers.openlibrary.org/b/id/${id}-${size}.jpg`;
  }
  function noCover(width = 130, height = 200, text = "No cover") {
    return (
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-size='14'>${text}</text></svg>`
      )
    );
  }
  
  /* ==========================
     Render Logout button
     ========================== */
  function renderLogoutButton() {
    if (logoutBtn) return;
  
    logoutBtn = document.createElement("button");
    logoutBtn.id = "logout-btn";
    logoutBtn.textContent = "Salir";
    logoutBtn.style.background = "var(--danger)";
    logoutBtn.style.color = "#fff";
    logoutBtn.style.border = "none";
    logoutBtn.style.padding = ".45rem .8rem";
    logoutBtn.style.borderRadius = "8px";
    logoutBtn.style.cursor = "pointer";
  
    logoutBtn.addEventListener("click", () => {
      if (!confirm("Vas a cerrar sesión.\n¿Estás seguro?")) return;
      state.logged = false;
      state.user = null;
      avatarPlaceholder.innerHTML = "";
      avatarPlaceholder.setAttribute("aria-hidden", "true");
      logoutBtn.remove();
      logoutBtn = null;
      loginOpenBtn.style.display = "inline-block";
    });
  
    userArea.appendChild(logoutBtn);
    loginOpenBtn.style.display = "none";
  }
  
  /* ==========================
     Render Books (Catálogo)
     ========================== */
  function renderBooks() {
    booksList.innerHTML = "";
  
    if (!state.books.length) {
      booksList.innerHTML = `<p class="status">No hay libros. Añade uno en el formulario.</p>`;
      return;
    }
  
    state.books.forEach((b) => {
      const li = document.createElement("li");
      li.className = "book-card";
      li.tabIndex = 0;
  
      // Imagen principal (inicial en tamaño S)
      const img = document.createElement("img");
      img.alt = `${b.title || "Sin título"} — carátula`;
      img.src = b.cover_i ? coverURL(b.cover_i, "S") : noCover();
  
      // Meta
      const meta = document.createElement("div");
      meta.className = "book-meta";
  
      const h3 = document.createElement("h3");
      h3.textContent = b.title || "Sin título";
      meta.appendChild(h3);
  
      const p = document.createElement("p");
      p.innerHTML =
        `<strong>Autor:</strong> ${b.author || "Desconocido"}<br>` +
        `<strong>Año:</strong> ${b.year || "s.f."}<br>` +
        (b.subject ? `<strong>Género:</strong> ${b.subject}<br>` : "") +
        (b.edition_count ? `<strong>Ediciones:</strong> ${b.edition_count}<br>` : "") +
        (b.pages ? `<strong>Páginas:</strong> ${b.pages}<br>` : "") +
        (b.isbn ? `<strong>ISBN:</strong> ${b.isbn}<br>` : "");
  
      meta.appendChild(p);
  
      // Selector S/M/L (funcional)
      const coverSelectContainer = document.createElement("div");
      coverSelectContainer.className = "cover-select";
  
      const label = document.createElement("label");
      label.textContent = "Tamaño:";
      label.setAttribute("for", `cover-size-${b.id}`);
  
      const select = document.createElement("select");
      select.id = `cover-size-${b.id}`;
      ["S", "M", "L"].forEach((sz) => {
        const opt = document.createElement("option");
        opt.value = sz;
        opt.textContent = sz;
        select.appendChild(opt);
      });
      // default S
      select.value = "S";
  
      // actualiza la imagen al cambiar el select
      select.addEventListener("change", () => {
        img.src = b.cover_i ? coverURL(b.cover_i, select.value) : noCover();
      });
  
      coverSelectContainer.appendChild(label);
      coverSelectContainer.appendChild(select);
      meta.appendChild(coverSelectContainer);
  
      // Acciones
      const actions = document.createElement("div");
      actions.className = "book-actions";
  
      const editBtn = document.createElement("button");
      editBtn.className = "secondary";
      editBtn.textContent = "Editar";
      editBtn.addEventListener("click", () => loadToForm(b.id));
  
      const delBtn = document.createElement("button");
      delBtn.textContent = "Borrar";
      delBtn.addEventListener("click", () => removeBook(b.id));
  
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      meta.appendChild(actions);
  
      li.appendChild(img);
      li.appendChild(meta);
      booksList.appendChild(li);
    });
  }
  
  /* ==========================
     CRUD libros
     ========================== */
  function addBook(data) {
    const newBook = {
      id: uid(),
      title: data.title || "",
      author: data.author || "",
      year: data.year || "",
      cover_i: data.cover_i || data.cover || "",
      subject: data.subject || "",
      edition_count: data.edition_count || "",
      pages: data.pages || "",
      isbn: data.isbn || ""
    };
    state.books.unshift(newBook);
    saveLocal();
    renderBooks();
  
    // highlight
    const firstCard = booksList.querySelector(".book-card");
    if (firstCard) {
      firstCard.classList.add("highlight");
      setTimeout(() => firstCard.classList.remove("highlight"), 1400);
    }
  }
  
  function loadToForm(id) {
    const b = state.books.find((x) => x.id === id);
    if (!b) return;
    document.getElementById("book-id").value = b.id;
    document.getElementById("title").value = b.title || "";
    document.getElementById("author").value = b.author || "";
    document.getElementById("year").value = b.year || "";
    document.getElementById("cover").value = b.cover_i || "";
    // nuevo campo ISBN
    const isbnInput = document.getElementById("isbn");
    if (isbnInput) isbnInput.value = b.isbn || "";
    window.location.hash = "#form-agregar";
  }
  
  function removeBook(id) {
    if (!confirm("¿Eliminar este libro?")) return;
    state.books = state.books.filter((x) => x.id !== id);
    saveLocal();
    renderBooks();
  }
  
  /* ==========================
     Form Añadir/Editar
  ========================== */
  bookForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("book-id").value;
    const title = document.getElementById("title").value.trim();
    if (!title) {
      bookMessage.textContent = "El título es obligatorio";
      return;
    }
    const author = document.getElementById("author").value.trim();
    const year = document.getElementById("year").value.trim();
    const cover = document.getElementById("cover").value.trim();
    const isbn = (document.getElementById("isbn") && document.getElementById("isbn").value.trim()) || "";
  
    if (id) {
      const b = state.books.find((x) => x.id === id);
      if (!b) return;
      b.title = title;
      b.author = author;
      b.year = year;
      b.cover_i = cover;
      b.isbn = isbn;
      saveLocal();
      renderBooks();
      bookMessage.textContent = "Libro actualizado";
      setTimeout(() => (bookMessage.textContent = ""), 1500);
    } else {
      addBook({ title, author, year, cover, isbn });
      bookMessage.textContent = "Libro añadido";
      setTimeout(() => (bookMessage.textContent = ""), 1500);
    }
  
    bookForm.reset();
    document.getElementById("book-id").value = "";
  });
  
  /* clear */
  bookClear.addEventListener("click", () => {
    bookForm.reset();
    const isbnInput = document.getElementById("isbn");
    if (isbnInput) isbnInput.value = "";
    document.getElementById("book-id").value = "";
  });
  
  /* ==========================
        LOGIN / AVATAR
  ========================== */
  loginOpenBtn.addEventListener("click", () => {
    loginDialog.setAttribute("aria-hidden", "false");
    const u = document.getElementById("username");
    if (u) u.focus();
  });
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
      loginDialog.classList.add("shake");
      setTimeout(() => loginDialog.classList.remove("shake"), 300);
      return;
    }
    if (p !== "password") {
      loginMsg.textContent = "Contraseña incorrecta";
      loginMsg.style.color = "var(--danger)";
      loginDialog.classList.add("shake");
      setTimeout(() => loginDialog.classList.remove("shake"), 300);
      return;
    }
    state.logged = true;
    state.user = u;
    renderAvatar();
    renderLogoutButton();
    loginDialog.setAttribute("aria-hidden", "true");
    loginForm.reset();
    loginMsg.textContent = "";
  });
  
  function renderAvatar() {
    avatarPlaceholder.innerHTML = "";
    if (!state.logged) {
      avatarPlaceholder.setAttribute("aria-hidden", "true");
      return;
    }
    const img = document.createElement("img");
    const initials = String(state.user).slice(-2);
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' width='88' height='88'><rect width='100%' height='100%' fill='%231f6feb'/><text x='50%' y='55%' font-size='36' fill='white' text-anchor='middle'>${initials}</text></svg>`;
    img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    img.alt = `Avatar del usuario ${state.user}`;
    avatarPlaceholder.appendChild(img);
    avatarPlaceholder.setAttribute("aria-hidden", "false");
  }
  
  /* ==========================
     Búsqueda OpenLibrary
  ========================== */
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (!q) return;
  
    searchResults.innerHTML = "";
    searchStatus.textContent = "Buscando...";
    if (spinner) spinner.style.display = "block";
  
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(q)}&limit=18`
      );
      if (!res.ok) throw new Error("error");
      const data = await res.json();
      searchStatus.textContent = `${data.docs.length} resultados`;
  
      if (!data.docs || data.docs.length === 0) {
        searchResults.innerHTML = '<p class="status">No se encontraron resultados.</p>';
        return;
      }
  
      data.docs.forEach((d) => {
        const card = document.createElement("article");
        card.className = "book-card";
  
        const img = document.createElement("img");
        img.alt = `${d.title || "Sin título"} — carátula`;
        img.src = d.cover_i ? coverURL(d.cover_i, "S") : noCover();
  
        const meta = document.createElement("div");
        meta.className = "book-meta";
  
        const h3 = document.createElement("h3");
        h3.textContent = d.title || "Sin título";
  
        const author = (d.author_name && d.author_name[0]) || "Desconocido";
  
        const p = document.createElement("p");
        p.innerHTML =
          `<strong>Autor:</strong> ${author}<br>` +
          `<strong>Año:</strong> ${d.first_publish_year || "s.f."}<br>` +
          `<strong>Género:</strong> ${(d.subject && d.subject[0]) || "No disponible"}<br>` +
          `<strong>Ediciones:</strong> ${d.edition_count || "No disponible"}<br>` +
          `<strong>Páginas:</strong> ${d.number_of_pages_median || "No disponible"}<br>` +
          `<strong>ISBN:</strong> ${(d.isbn && d.isbn[0]) || "No disponible"}`;
  
        meta.appendChild(h3);
        meta.appendChild(p);
  
        // Selector S/M/L en resultados
        const coverSelect = document.createElement("div");
        coverSelect.className = "cover-select";
        const label = document.createElement("label");
        label.textContent = "Tamaño:";
        const select = document.createElement("select");
        ["S", "M", "L"].forEach(sz => {
          const opt = document.createElement("option");
          opt.value = sz;
          opt.textContent = sz;
          select.appendChild(opt);
        });
        select.value = "S";
        select.addEventListener("change", () => {
          img.src = d.cover_i ? coverURL(d.cover_i, select.value) : noCover();
        });
        coverSelect.appendChild(label);
        coverSelect.appendChild(select);
        meta.appendChild(coverSelect);
  
        // Añadir botón
        const addBtn = document.createElement("button");
        addBtn.textContent = "Añadir";
        addBtn.addEventListener("click", () => {
          const newB = {
            title: d.title || "",
            author: (d.author_name && d.author_name[0]) || "",
            year: d.first_publish_year || "",
            cover_i: d.cover_i || "",
            subject: (d.subject && d.subject[0]) || "",
            edition_count: d.edition_count || "",
            pages: d.number_of_pages_median || "",
            isbn: (d.isbn && d.isbn[0]) || ""
          };
          addBook(newB);
        });
  
        meta.appendChild(addBtn);
  
        card.appendChild(img);
        card.appendChild(meta);
        searchResults.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      searchStatus.textContent = "Error buscando";
    } finally {
      if (spinner) spinner.style.display = "none";
    }
  });
  
  /* ==========================
     Inicialización
  ========================== */
  (function init() {
    loadLocal();
    if (!state.books || state.books.length === 0) {
      state.books = [
        { id: uid(), title: "Don Quijote de la Mancha", author: "Miguel de Cervantes", year: 1605, cover_i: "8463501" },
        { id: uid(), title: "La sombra del viento", author: "Carlos Ruiz Zafón", year: 2001 }
      ];
      saveLocal();
    }
    renderBooks();
  })();
  
  /* ==========================
     Accesibilidad y utilidades
  ========================== */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      loginDialog.setAttribute("aria-hidden", "true");
      loginMsg.textContent = "";
    }
  });
  