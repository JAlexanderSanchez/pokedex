// ========================================
// CONFIGURACIÓN
// ========================================

// ⚠️ IMPORTANTE: Reemplazar esta URL con la URL de tu backend desplegado en Render
// Ejemplo: 'https://poke-explorer-backend.onrender.com'
const API_URL = 'https://pokedex-2-1asb.onrender.com'; // Cambiar en producción

// ========================================
// ESTADO DE LA APLICACIÓN
// ========================================

let currentUser = null;
let token = null;

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

// Obtener token desde localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Guardar token en localStorage
function setToken(newToken) {
  localStorage.setItem('token', newToken);
  token = newToken;
}

// Guardar usuario en localStorage
function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
  currentUser = user;
}

// Obtener usuario desde localStorage
function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Limpiar sesión
function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  token = null;
  currentUser = null;
}

// Verificar si hay sesión activa
function isAuthenticated() {
  const storedToken = getToken();
  const storedUser = getUser();
  
  if (storedToken && storedUser) {
    token = storedToken;
    currentUser = storedUser;
    return true;
  }
  return false;
}

// Mostrar alerta
function showAlert(message, type = 'error') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  
  const container = document.querySelector('.login-container') || document.querySelector('.container');
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);
    setTimeout(() => alertDiv.remove(), 5000);
  }
}

// ========================================
// PETICIONES HTTP
// ========================================

// Función genérica para hacer fetch
async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Añadir token si existe
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición');
    }

    return data;
  } catch (error) {
    console.error('Error en apiFetch:', error);
    throw error;
  }
}

// ========================================
// VISTAS (TEMPLATES)
// ========================================

function LoginView() {
  return `
    <div class="login-container">
      <h1>⚡ Poké-Explorador</h1>
      <p class="subtitle">Descubre el mundo Pokémon</p>
      
      <form id="loginForm">
        <div class="form-group">
          <label for="username">Usuario</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            placeholder="Ingresa tu usuario"
            required 
            autocomplete="username"
          >
        </div>
        
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            placeholder="Ingresa tu contraseña"
            required
            autocomplete="current-password"
          >
        </div>
        
        <button type="submit" class="btn btn-primary">Iniciar Sesión</button>
        <button type="button" id="registerBtn" class="btn btn-secondary">
          Crear Cuenta Nueva
        </button>
      </form>
    </div>
  `;
}

function DashboardView() {
  const username = currentUser?.username || 'Usuario';
  
  return `
    <div class="dashboard">
      <div class="dashboard-header">
        <h1>⚡ Poké-Explorador</h1>
        <div class="user-info">
          <span class="username">👤 ${username}</span>
          <button id="logoutBtn" class="btn-logout">Cerrar Sesión</button>
        </div>
      </div>
      
      <div class="container">
        <div class="search-container">
          <input 
            type="text" 
            id="searchInput" 
            class="search-input" 
            placeholder="Buscar Pokémon por nombre o ID..."
          >
          <button id="searchBtn" class="btn-search">🔍 Buscar</button>
        </div>
        
        <div id="pokemonGrid" class="pokemon-grid">
          <div class="empty-state">
            <h2>¡Bienvenido!</h2>
            <p>Busca un Pokémon para comenzar tu exploración</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ========================================
// RENDERIZADO
// ========================================

function render(view) {
  const app = document.getElementById('app');
  app.innerHTML = view;
  attachEventListeners();
}

// ========================================
// EVENT LISTENERS
// ========================================

function attachEventListeners() {
  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Register Button
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', handleRegister);
  }

  // Search
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// ========================================
// HANDLERS
// ========================================

async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showAlert('Por favor completa todos los campos');
    return;
  }

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    setToken(data.token);
    setUser({ id: data._id, username: data.username });
    
    window.location.hash = '#/dashboard';
  } catch (error) {
    showAlert(error.message || 'Error al iniciar sesión');
  }
}

async function handleRegister() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showAlert('Por favor completa todos los campos');
    return;
  }

  if (password.length < 6) {
    showAlert('La contraseña debe tener al menos 6 caracteres');
    return;
  }

  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    showAlert('Cuenta creada exitosamente. Iniciando sesión...', 'success');
    
    setTimeout(() => {
      setToken(data.token);
      setUser({ id: data._id, username: data.username });
      window.location.hash = '#/dashboard';
    }, 1500);
  } catch (error) {
    showAlert(error.message || 'Error al crear la cuenta');
  }
}

async function handleSearch() {
  const searchInput = document.getElementById('searchInput');
  const term = searchInput.value.trim().toLowerCase();

  if (!term) {
    showAlert('Por favor ingresa un nombre o ID de Pokémon');
    return;
  }

  const gridContainer = document.getElementById('pokemonGrid');
  gridContainer.innerHTML = '<div class="loading">Buscando Pokémon</div>';

  try {
    const data = await apiFetch('/api/search', {
      method: 'POST',
      body: JSON.stringify({ term }),
    });

    renderPokemonGrid([data]);
    searchInput.value = '';
  } catch (error) {
    gridContainer.innerHTML = `
      <div class="empty-state">
        <h2>❌ No encontrado</h2>
        <p>${error.message || 'Pokémon no encontrado. Intenta con otro nombre o ID.'}</p>
      </div>
    `;
  }
}

function handleLogout() {
  clearSession();
  window.location.hash = '#/login';
}

// ========================================
// RENDERIZADO DE POKÉMON
// ========================================

function renderPokemonGrid(pokemonList) {
  const gridContainer = document.getElementById('pokemonGrid');
  
  if (!pokemonList || pokemonList.length === 0) {
    gridContainer.innerHTML = `
      <div class="empty-state">
        <h2>No hay resultados</h2>
        <p>Intenta buscar otro Pokémon</p>
      </div>
    `;
    return;
  }

  const cardsHTML = pokemonList.map(pokemon => {
    const types = pokemon.types
      .map(t => `<span class="pokemon-type type-${t.type.name}">${t.type.name}</span>`)
      .join('');

    const imageUrl = pokemon.sprites?.other?.['official-artwork']?.front_default || 
                     pokemon.sprites?.front_default || 
                     'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';

    return `
      <div class="pokemon-card">
        <div class="pokemon-image">
          <img src="${imageUrl}" alt="${pokemon.name}">
        </div>
        <h2 class="pokemon-name">${pokemon.name}</h2>
        <p class="pokemon-id">#${String(pokemon.id).padStart(3, '0')}</p>
        <div class="pokemon-types">${types}</div>
      </div>
    `;
  }).join('');

  gridContainer.innerHTML = cardsHTML;
}

// ========================================
// ROUTER
// ========================================

function router() {
  const hash = window.location.hash || '#/login';

  // Guardia de autenticación
  if (!isAuthenticated() && hash !== '#/login') {
    window.location.hash = '#/login';
    return;
  }

  if (isAuthenticated() && hash === '#/login') {
    window.location.hash = '#/dashboard';
    return;
  }

  // Renderizar vista según la ruta
  switch (hash) {
    case '#/login':
      render(LoginView());
      break;
    case '#/dashboard':
      render(DashboardView());
      break;
    default:
      window.location.hash = '#/login';
  }
}

// ========================================
// INICIALIZACIÓN
// ========================================

window.addEventListener('hashchange', router);
window.addEventListener('load', router);