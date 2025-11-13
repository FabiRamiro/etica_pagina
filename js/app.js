// app.js – lógica de evaluación de imágenes con GSAP y SweetAlert2
const IMAGES_JSON = "assets-taller/images.json";
const TOTAL_TO_SHOW = 20;
const CAPTCHA_PROBABILITY = 1.0; // 100% de probabilidad para pruebas
// Mostrar CAPTCHA cada N respuestas (si es > 0). Si es 0 o undefined, se usa CAPTCHA_PROBABILITY
const CAPTCHA_EVERY = 4;

// ⚙️ CONFIGURACIÓN DEL CAPTCHA - MÚLTIPLES IMÁGENES
const CAPTCHA_IMAGES = [
  "assets-taller/captcha-images/image.png",
  "assets-taller/captcha-images/logo.jpg",
  "assets-taller/captcha-images/fortnite1.png",
  "assets-taller/captcha-images/fortnite2.png",
  "assets-taller/captcha-images/fortnite3.png",
  "assets-taller/captcha-images/fortnite4.png",
];

// Función para elegir imagen aleatoria
function getRandomCaptchaImage() {
  const randomIndex = Math.floor(Math.random() * CAPTCHA_IMAGES.length);
  return CAPTCHA_IMAGES[randomIndex];
}

// Reglas para miniaturas (gamemodes)
const GAMEMODE_RULES = [
  { id: 1, label: "Miniatura de mala calidad", icon: "❌", color: "#ff5e7c" },
  {
    id: 2,
    label: "Contenido inapropiado para jóvenes",
    icon: "⚠️",
    color: "#ffd700",
  },
  { id: 3, label: "Usa marcas registradas", icon: "❌", color: "#ff3b4d" },
  { id: 4, label: "Miniatura engañosa", icon: "⚠️", color: "#ff9500" },
];

// Reglas para skins
const SKIN_RULES = [
  { id: 5, label: "Personaje irreconocible", icon: "❌", color: "#ff5e7c" },
  {
    id: 6,
    label: "Skin inapropiada para jóvenes",
    icon: "⚠️",
    color: "#ffd700",
  },
  { id: 7, label: "Falta de respeto", icon: "❌", color: "#ff3b4d" },
  {
    id: 8,
    label: "Copia de otro personaje o skin",
    icon: "⚠️",
    color: "#ff9500",
  },
];

let allImages = [];
let selected = [];
let index = 0;
let responses = [];
let currentImageType = null;

const startBtn = document.getElementById("start-btn");
const evaluator = document.getElementById("evaluator");
const startScreen = document.getElementById("start-screen");
const acceptBtn = document.getElementById("accept-btn");
const rejectBtn = document.getElementById("reject-btn");
const evalImage = document.getElementById("eval-image");
const commentEl = document.getElementById("comment");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const results = document.getElementById("results");
const summary = document.getElementById("summary");
const restartTop = document.getElementById("restart-top");
const homeBtn = document.getElementById("home-btn");

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function loadImages() {
  try {
    console.log("📡 Haciendo fetch de", IMAGES_JSON);
    const timestamp = new Date().getTime();
    const res = await fetch(`${IMAGES_JSON}?t=${timestamp}`, {
      cache: "no-cache",
    });
    if (!res.ok) throw new Error("No se pudo cargar images.json");
    const data = await res.json();
    allImages = data;
    console.log("✓ Imágenes cargadas:", allImages.length, "imágenes");
  } catch (e) {
    console.error("❌ Error loading images:", e);
    allImages = [];
    await Swal.fire({
      title: "Error",
      text: "Error cargando las imágenes. Asegúrate de ejecutar desde un servidor local (no file://).",
      icon: "error",
    });
  }
}

function pickImages() {
  if (allImages.length === 0) {
    console.error("❌ allImages vacío");
    return;
  }

  const skins = allImages.filter((img) => img.includes("/skins/"));
  const gamemodes = allImages.filter((img) => img.includes("/gamemodes/"));

  console.log("📊 Total skins:", skins.length);
  console.log("📊 Total gamemodes:", gamemodes.length);

  shuffle(skins);
  shuffle(gamemodes);

  selected = [];
  const count = Math.min(
    TOTAL_TO_SHOW,
    Math.min(skins.length, gamemodes.length) * 2
  );

  for (let i = 0; i < count; i++) {
    if (i % 2 === 0) {
      selected.push(skins[Math.floor(i / 2)]);
    } else {
      selected.push(gamemodes[Math.floor(i / 2)]);
    }
  }

  console.log("✓ Imágenes seleccionadas:", selected.length);
}

function updateProgress() {
  progressText.textContent = `Imagen ${index + 1}/${selected.length}`;
  const pct = Math.round(((index + 1) / selected.length) * 100);
  progressBar.style.width = `${pct}%`;
}

function showImage(i) {
  console.log("🖼️ showImage llamado con índice:", i);

  if (i < 0 || i >= selected.length) {
    console.error("❌ showImage: índice inválido", i);
    return;
  }

  if (!evalImage) {
    console.error("❌ evalImage element not found!");
    return;
  }

  index = i;

  if (commentEl) commentEl.value = "";
  const ruleButtons = document.querySelectorAll(".rule-btn");
  ruleButtons.forEach((btn) => btn.classList.remove("active"));

  updateProgress();

  const imagePath = selected[index];
  console.log("📸 Mostrando imagen:", imagePath);

  currentImageType = imagePath.includes("/skins/") ? "skin" : "gamemode";
  renderRuleButtons();

  if (acceptBtn) acceptBtn.disabled = false;
  if (rejectBtn) rejectBtn.disabled = false;

  gsap.to("#eval-image", {
    scale: 0.96,
    duration: 0.12,
    opacity: 0,
    onComplete: () => {
      evalImage.src = imagePath;
      evalImage.alt = `Imagen ${index + 1}`;

      evalImage.onerror = () => {
        console.error("❌ Error loading image:", imagePath);
      };

      gsap.to("#eval-image", {
        scale: 1,
        opacity: 1,
        duration: 0.35,
        ease: "elastic.out(1,0.6)",
      });
    },
  });
}

async function showEvaluator() {
  console.log("🎬 Mostrando evaluador...");

  gsap.killTweensOf(startScreen);

  startScreen.style.display = "none";
  startScreen.style.visibility = "hidden";
  startScreen.classList.add("d-none");

  evaluator.style.display = "block";
  evaluator.style.visibility = "visible";
  evaluator.style.opacity = "1";
  evaluator.classList.remove("d-none");

  gsap.from(".evaluator-card", {
    y: 40,
    opacity: 0,
    duration: 0.6,
    ease: "power3.out",
  });
  console.log("✓ Evaluador visible");
}

async function showResults() {
  gsap.killTweensOf("*");

  const accepted = responses.filter((r) => r.decision === "accept").length;
  const rejected = responses.filter((r) => r.decision === "reject").length;

  gsap.killTweensOf(evaluator);
  gsap.killTweensOf(".evaluator-card");

  evaluator.style.display = "none";
  evaluator.style.visibility = "hidden";
  evaluator.classList.add("d-none");

  results.style.display = "block";
  results.style.visibility = "visible";
  results.style.opacity = "1";
  results.style.zIndex = "1";
  results.classList.remove("d-none");

  const statsHTML = `
    <div class="stats-card">
      <div class="stat-item accepted-stat">
        <div class="stat-icon">✅</div>
        <div class="stat-number" data-value="${accepted}">${accepted}</div>
        <div class="stat-label">Aprobadas</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item rejected-stat">
        <div class="stat-icon">❌</div>
        <div class="stat-number" data-value="${rejected}">${rejected}</div>
        <div class="stat-label">Rechazadas</div>
      </div>
    </div>
  `;

  let listHTML = `
    <div class="response-list-wrapper">
      <div class="response-grid">
  `;

  responses.forEach((r, idx) => {
    const decisionClass =
      r.decision === "accept" ? "decision-accept" : "decision-reject";
    const badgeText = r.decision === "accept" ? "APROBADA" : "RECHAZADA";
    const badgeIcon = r.decision === "accept" ? "✓" : "✗";

    const ruleText =
      r.decision === "reject"
        ? `<div class="response-rule">${r.comment}</div>`
        : "";

    listHTML += `
      <div class="response-card ${decisionClass}" data-index="${idx}">
        <div class="response-badge ${decisionClass}">
          <span class="badge-icon">${badgeIcon}</span>
          <span class="badge-text">${badgeText}</span>
        </div>
        <div class="response-image-wrap">
          <img src="${r.image}" alt="Imagen ${idx + 1}" class="response-thumb">
        </div>
        ${ruleText}
      </div>
    `;
  });

  listHTML += `
      </div>
    </div>
  `;

  const statsWrapper = summary.querySelector(".summary-stats");
  const listWrapper = summary.querySelector(".summary-list");

  if (statsWrapper) statsWrapper.innerHTML = statsHTML;
  if (listWrapper) listWrapper.innerHTML = listHTML;

  gsap.from(".results-title", {
    y: -30,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
  });

  gsap.from(".stats-card", {
    scale: 0.9,
    opacity: 0,
    duration: 0.6,
    delay: 0.2,
    ease: "back.out(1.4)",
  });

  gsap.from(".stat-number", {
    innerText: 0,
    duration: 1.5,
    delay: 0.4,
    ease: "power2.out",
    snap: { innerText: 1 },
  });

  gsap.from(".response-card", {
    y: 50,
    opacity: 0,
    duration: 0.5,
    stagger: 0.08,
    delay: 0.6,
    ease: "power3.out",
  });

  const glow1 = document.querySelector(".glow-orb-1");
  const glow2 = document.querySelector(".glow-orb-2");
  const glow3 = document.querySelector(".glow-orb-3");

  if (glow1)
    gsap.from(glow1, { scale: 0, opacity: 0, duration: 2, ease: "power2.out" });
  if (glow2)
    gsap.from(glow2, {
      scale: 0,
      opacity: 0,
      duration: 2,
      delay: 0.3,
      ease: "power2.out",
    });
  if (glow3)
    gsap.from(glow3, {
      scale: 0,
      opacity: 0,
      duration: 2,
      delay: 0.6,
      ease: "power2.out",
    });

  gsap.from(".home-btn", {
    scale: 0,
    opacity: 0,
    duration: 0.6,
    delay: 1.2,
    ease: "back.out(1.7)",
  });
}

// ====================================
// SISTEMA DE PUZZLE CAPTCHA
// ====================================

async function showPuzzleCaptcha() {
  // Alternar aleatoriamente entre puzzle y Simon Dice
  // 70% Simon Dice, 30% Puzzle
  const gameType = Math.random() < 0.4 ? "puzzle" : "simon";

  if (gameType === "puzzle") {
    await showImagePuzzle();
  } else {
    await showSimonSays();
  }
}

async function showImagePuzzle() {
  const selectedImage = getRandomCaptchaImage();

  console.log("🧩 Mostrando puzzle CAPTCHA...");
  console.log("📸 Imagen seleccionada:", selectedImage);

  const puzzleHTML = `
    <div class="puzzle-container">
      <div class="puzzle-title">🧩 Puzzle de Verificación</div>
      <div class="puzzle-subtitle">Arrastra las piezas para completar el logo</div>
      <div class="puzzle-grid" id="puzzleGrid"></div>
      <div class="puzzle-timer">Tiempo: <span id="puzzleTimer">0</span>s</div>
      <div class="puzzle-progress"><span id="puzzleCorrect">0</span>/9 piezas correctas</div>
    </div>
  `;

  Swal.fire({
    html: puzzleHTML,
    showConfirmButton: false,
    showCloseButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: {
      popup: "puzzle-modal",
    },
    didOpen: () => {
      initPuzzle(selectedImage);
    },
  });
}

async function showSimonSays() {
  console.log("🎮 Mostrando Simon Dice...");

  const simonHTML = `
    <div class="simon-container">
      <div class="simon-title">🎮 Simon Dice</div>
      <div class="simon-subtitle">Memoriza y repite la secuencia</div>
      <div class="simon-board">
        <div class="simon-button simon-red" data-color="red"></div>
        <div class="simon-button simon-blue" data-color="blue"></div>
        <div class="simon-button simon-green" data-color="green"></div>
        <div class="simon-button simon-yellow" data-color="yellow"></div>
      </div>
      <div class="simon-info">
        <div class="simon-level">Nivel: <span id="simonLevel">1</span></div>
        <div class="simon-status" id="simonStatus">Observa la secuencia...</div>
      </div>
    </div>
  `;

  Swal.fire({
    html: simonHTML,
    showConfirmButton: false,
    showCloseButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: {
      popup: "simon-modal",
    },
    didOpen: () => {
      initSimonGame();
    },
  });
}

function initSimonGame() {
  console.log("🎯 Inicializando Simon Dice");

  const colors = ["red", "blue", "green", "yellow"];
  let sequence = [];
  let playerSequence = [];
  let level = 1;
  const LEVELS_TO_WIN = 5;
  let canPlay = false;

  const buttons = document.querySelectorAll(".simon-button");
  const levelEl = document.getElementById("simonLevel");
  const statusEl = document.getElementById("simonStatus");

  function playSound(color) {
    // Frecuencias diferentes para cada color
    const frequencies = {
      red: 329.63,
      blue: 261.63,
      green: 349.23,
      yellow: 392.0,
    };
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequencies[color];
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }

  function lightUp(color) {
    const button = document.querySelector(`.simon-${color}`);
    button.classList.add("active");
    playSound(color);

    setTimeout(() => {
      button.classList.remove("active");
    }, 400);
  }

  async function playSequence() {
    canPlay = false;
    statusEl.textContent = "Observa la secuencia...";

    for (let i = 0; i < sequence.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      lightUp(sequence[i]);
    }

    await new Promise((resolve) => setTimeout(resolve, 800));
    canPlay = true;
    playerSequence = [];
    statusEl.textContent = "¡Tu turno! Repite la secuencia";
  }

  function nextLevel() {
    level++;
    levelEl.textContent = level;

    if (level > LEVELS_TO_WIN) {
      // ¡Victoria!
      console.log("🎉 ¡Simon completado!");
      statusEl.textContent = "¡Completado!";

      setTimeout(() => {
        Swal.fire({
          title: "¡Excelente!",
          html: `Completaste <strong>${LEVELS_TO_WIN}</strong> niveles`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          console.log("→ Continuando con siguiente imagen...");
          continuarDespuesDeCaptcha();
        });
      }, 500);
      return;
    }

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    sequence.push(randomColor);
    playSequence();
  }

  function handlePlayerInput(color) {
    if (!canPlay) return;

    lightUp(color);
    playerSequence.push(color);

    // Verificar si el color es correcto
    const currentIndex = playerSequence.length - 1;
    if (playerSequence[currentIndex] !== sequence[currentIndex]) {
      // Error
      canPlay = false;
      statusEl.textContent = "❌ Error! Intenta de nuevo...";
      statusEl.style.color = "#ff5e7c";

      setTimeout(() => {
        playerSequence = [];
        statusEl.style.color = "";
        playSequence();
      }, 1500);
      return;
    }

    // Si completó la secuencia correctamente
    if (playerSequence.length === sequence.length) {
      canPlay = false;
      statusEl.textContent = "✓ ¡Correcto!";
      statusEl.style.color = "#00ff88";

      setTimeout(() => {
        statusEl.style.color = "";
        nextLevel();
      }, 1000);
    }
  }

  // Event listeners para los botones
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const color = button.dataset.color;
      handlePlayerInput(color);
    });
  });

  // Iniciar el juego
  nextLevel();
  console.log("✓ Simon Dice inicializado");
}

function initPuzzle(imageUrl) {
  const grid = document.getElementById("puzzleGrid");
  const timerEl = document.getElementById("puzzleTimer");
  const correctEl = document.getElementById("puzzleCorrect");

  console.log("🎯 Inicializando puzzle");

  let startTime = Date.now();
  let timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    if (timerEl) timerEl.textContent = elapsed;
  }, 1000);

  // Array para mantener el orden lógico de las piezas
  const pieceOrder = [];

  for (let i = 0; i < 9; i++) {
    const piece = document.createElement("div");
    piece.className = "puzzle-piece";
    piece.draggable = true;
    piece.dataset.correctPos = i;
    piece.dataset.pieceId = `piece-${i}`;
    piece.dataset.currentIndex = i;

    const row = Math.floor(i / 3);
    const col = i % 3;
    piece.style.backgroundImage = `url(${imageUrl})`;
    piece.style.backgroundPosition = `-${col * 100}px -${row * 100}px`;

    pieceOrder.push(piece);
  }

  // Mezclar el orden
  shuffle(pieceOrder);

  // Agregar todas las piezas al grid en orden mezclado
  pieceOrder.forEach((piece, idx) => {
    piece.dataset.currentIndex = idx;
    grid.appendChild(piece);
  });

  console.log("✓ Puzzle inicializado");

  checkPuzzle();

  let draggedPiece = null;
  let draggedStartIndex = -1;

  function handleDragStart(e) {
    draggedPiece = this;
    draggedStartIndex = parseInt(this.dataset.currentIndex);
    this.classList.add("dragging");
    console.log(`🎯 Arrastrando pieza desde índice: ${draggedStartIndex}`);
  }

  function handleDragOver(e) {
    e.preventDefault();
    return false;
  }

  function handleDrop(e) {
    e.preventDefault();
    if (draggedPiece !== this && draggedPiece) {
      const targetIndex = parseInt(this.dataset.currentIndex);

      console.log(
        `🔄 Intercambiando índices: ${draggedStartIndex} ↔ ${targetIndex}`
      );

      // Intercambiar los valores de currentIndex
      draggedPiece.dataset.currentIndex = targetIndex;
      this.dataset.currentIndex = draggedStartIndex;

      // Actualizar el array pieceOrder
      const temp = pieceOrder[draggedStartIndex];
      pieceOrder[draggedStartIndex] = pieceOrder[targetIndex];
      pieceOrder[targetIndex] = temp;

      // Limpiar y reconstruir el grid en el nuevo orden
      grid.innerHTML = "";
      pieceOrder.forEach((piece) => {
        grid.appendChild(piece);
      });

      console.log("   ✓ Intercambio completado");
      checkPuzzle();
    }
    return false;
  }

  function handleDragEnd(e) {
    if (this.classList.contains("dragging")) {
      this.classList.remove("dragging");
    }
    draggedPiece = null;
    draggedStartIndex = -1;
  }

  // Agregar event listeners
  pieceOrder.forEach((piece) => {
    piece.addEventListener("dragstart", handleDragStart);
    piece.addEventListener("dragover", handleDragOver);
    piece.addEventListener("drop", handleDrop);
    piece.addEventListener("dragend", handleDragEnd);
  });

  function checkPuzzle() {
    let correct = 0;
    const gridChildren = Array.from(grid.children);

    console.log("🔍 Validando puzzle...");

    gridChildren.forEach((piece, currentDOMIndex) => {
      const correctPos = parseInt(piece.dataset.correctPos);
      const isValid = correctPos === currentDOMIndex;

      if (isValid) {
        piece.classList.add("correct");
        correct++;
      } else {
        piece.classList.remove("correct");
      }
    });

    console.log(`📊 Resultado: ${correct}/9 piezas correctas`);

    if (correctEl) correctEl.textContent = correct;

    if (correct === 9) {
      console.log("🎉 ¡Puzzle completado!");
      clearInterval(timerInterval);
      const time = Math.floor((Date.now() - startTime) / 1000);

      // Deshabilitar drag & drop
      gridChildren.forEach((piece) => {
        piece.draggable = false;
        piece.style.cursor = "default";
      });

      setTimeout(() => {
        Swal.fire({
          title: "¡Puzzle completado!",
          html: `Lo resolviste en <strong>${time}</strong> segundos`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          console.log("→ Continuando con siguiente imagen...");
          continuarDespuesDeCaptcha();
        });
      }, 500);
    }
  }
}

function continuarDespuesDeCaptcha() {
  console.log("✅ CAPTCHA completado, continuando...");

  if (index + 1 < selected.length) {
    showImage(index + 1);
    setTimeout(() => {
      if (rejectBtn) rejectBtn.disabled = false;
    }, 300);
  } else {
    showResults();
  }
}

// ====================================
// FUNCIONES PRINCIPALES
// ====================================

async function recordAndNext(dec) {
  console.log(`📝 Registrando decisión: ${dec}`);

  if (acceptBtn) acceptBtn.disabled = true;
  if (rejectBtn) rejectBtn.disabled = true;

  let comment = "";

  if (dec === "reject") {
    const activeBtn = document.querySelector(".rule-btn.active");
    if (!activeBtn) {
      await Swal.fire({
        title: "Selecciona una regla",
        text: "Para rechazar, debes seleccionar una regla aplicable.",
        icon: "warning",
      });
      if (rejectBtn) rejectBtn.disabled = false;
      if (acceptBtn) acceptBtn.disabled = false;
      return;
    }
    const ruleId = parseInt(activeBtn.dataset.ruleId);
    const allRules = [...GAMEMODE_RULES, ...SKIN_RULES];
    const rule = allRules.find((r) => r.id === ruleId);
    comment = rule ? rule.label : "Sin motivo";
  }

  responses.push({
    image: selected[index],
    decision: dec,
    comment: comment,
  });

  gsap.to("#eval-image", {
    scale: 0.95,
    opacity: 0.7,
    duration: 0.25,
    ease: "power2.in",
    onComplete: () => {
      gsap.to("#eval-image", { scale: 1, opacity: 1, duration: 0.3 });
    },
  });

  // Decidir si mostramos captcha
  // - Si CAPTCHA_EVERY está definido y > 0: mostrar cada N respuestas (ej. cada 3 respuestas)
  // - Si CAPTCHA_EVERY es 0 o no está definido: usar la probabilidad aleatoria CAPTCHA_PROBABILITY
  const shouldShowCaptcha =
    typeof CAPTCHA_EVERY !== "undefined" && CAPTCHA_EVERY > 0
      ? responses.length % CAPTCHA_EVERY === 0
      : Math.random() < CAPTCHA_PROBABILITY;

  if (shouldShowCaptcha && index + 1 < selected.length) {
    console.log("🎲 ¡Activado CAPTCHA!");
    await showPuzzleCaptcha();
  } else {
    if (index + 1 < selected.length) {
      showImage(index + 1);
      setTimeout(() => {
        if (rejectBtn) rejectBtn.disabled = false;
      }, 300);
    } else {
      showResults();
    }
  }
}

function resetAll() {
  console.log("🔄 Reiniciando aplicación...");

  gsap.killTweensOf("*");

  responses = [];
  selected = [];
  index = 0;
  currentImageType = null;

  if (evalImage) {
    evalImage.src = "";
    evalImage.alt = "";
  }

  const rulesContainer = document.querySelector(".rules-container-stacked");
  if (rulesContainer) {
    rulesContainer.innerHTML = "";
  }

  const ruleButtons = document.querySelectorAll(".rule-btn");
  ruleButtons.forEach((btn) => btn.classList.remove("active"));

  if (progressBar) progressBar.style.width = "0%";
  if (progressText) progressText.textContent = "Imagen 0/0";

  if (startBtn) startBtn.disabled = false;
  if (acceptBtn) acceptBtn.disabled = false;

  gsap.set([results, evaluator, startScreen, ".evaluator-card"], {
    clearProps: "all",
  });

  gsap.set(
    ".results-container, .results-container *, .response-card, .glow-orb, .stat-item, .response-badge",
    {
      clearProps: "all",
    }
  );

  results.style.display = "none";
  results.style.visibility = "hidden";
  results.classList.add("d-none");

  evaluator.style.display = "none";
  evaluator.style.visibility = "hidden";
  evaluator.classList.add("d-none");

  startScreen.style.display = "block";
  startScreen.style.visibility = "visible";
  startScreen.style.opacity = "1";
  startScreen.style.transform = "none";
  startScreen.style.zIndex = "999";
  startScreen.style.position = "relative";
  startScreen.classList.remove("d-none");

  gsap.from("#start-screen", { y: 20, opacity: 0, duration: 0.6 });

  console.log("✓ Reinicio completo");
}

function renderRuleButtons() {
  console.log("🎯 Renderizando botones de reglas para:", currentImageType);
  const container = document.querySelector(".rules-container-stacked");

  if (!container) {
    console.error("⚠ No se encontró .rules-container-stacked");
    return;
  }

  container.innerHTML = "";

  const rulesToUse = currentImageType === "skin" ? SKIN_RULES : GAMEMODE_RULES;

  rulesToUse.forEach((rule) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rule-btn";
    btn.dataset.ruleId = rule.id;
    btn.style.setProperty("--rule-color", rule.color);
    btn.innerHTML = `
      <span class="rule-icon">${rule.icon}</span>
      <span class="rule-label">${rule.label}</span>
    `;

    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) {
        btn.classList.remove("active");
        if (acceptBtn) acceptBtn.disabled = false;
      } else {
        document
          .querySelectorAll(".rule-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        if (acceptBtn) acceptBtn.disabled = true;
      }

      gsap.to(btn, {
        scale: 1.02,
        duration: 0.15,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(btn, { scale: 1, duration: 0.1 });
        },
      });
    });

    container.appendChild(btn);
  });

  console.log("✓ Botones renderizados:", rulesToUse.length);
}

startBtn.addEventListener("click", async () => {
  console.log("🎮 Botón inicio presionado");
  startBtn.disabled = true;

  const result = await Swal.fire({
    title: "Listo para empezar?",
    text: "Revisa 20 imágenes y selecciona la regla aplicable.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, iniciar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) {
    console.log("❌ Usuario canceló");
    startBtn.disabled = false;
    return;
  }

  console.log("🔥 Cargando imágenes...");
  await loadImages();

  if (allImages.length === 0) {
    console.error("❌ No se cargaron imágenes");
    startBtn.disabled = false;
    await Swal.fire({
      title: "Error",
      text: "No se pudieron cargar las imágenes. Verifica la consola.",
      icon: "error",
    });
    return;
  }

  console.log("🎲 Seleccionando imágenes aleatorias...");
  pickImages();

  if (selected.length === 0) {
    console.error("❌ No se seleccionaron imágenes");
    startBtn.disabled = false;
    await Swal.fire({
      title: "Error",
      text: "No hay imágenes para mostrar. Verifica la carpeta assets-taller.",
      icon: "error",
    });
    return;
  }

  console.log("✅ Todo listo, mostrando evaluador...");
  await showEvaluator();
  renderRuleButtons();
  showImage(0);
});

acceptBtn.addEventListener("click", () => recordAndNext("accept"));
rejectBtn.addEventListener("click", () => recordAndNext("reject"));

restartTop.addEventListener("click", async () => {
  const res = await Swal.fire({
    title: "Reiniciar evaluación?",
    text: "Se perderá el progreso actual.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, reiniciar",
    cancelButtonText: "Cancelar",
  });
  if (res.isConfirmed) resetAll();
});

if (homeBtn) {
  homeBtn.addEventListener("click", () => {
    resetAll();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  gsap.from("#start-screen", {
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
  });

  const animatedBtns = [startBtn, acceptBtn, rejectBtn, restartTop];
  animatedBtns.forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("mouseenter", () => {
      gsap.to(btn, {
        scale: 1.08,
        boxShadow: "0 0 24px #7b61ff99",
        duration: 0.22,
        ease: "power2.out",
      });
    });
    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, {
        scale: 1,
        boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
        duration: 0.18,
        ease: "power2.inOut",
      });
    });
    btn.addEventListener("mousedown", () => {
      gsap.to(btn, { scale: 0.95, duration: 0.1 });
    });
    btn.addEventListener("mouseup", () => {
      gsap.to(btn, { scale: 1.08, duration: 0.12 });
    });
  });

  if (evalImage) {
    evalImage.addEventListener("load", () => {
      gsap.fromTo(
        evalImage,
        { boxShadow: "0 0 0px #00d4ff00" },
        { boxShadow: "0 0 32px #00d4ff77", duration: 0.7, ease: "power2.out" }
      );
      setTimeout(() => {
        gsap.to(evalImage, {
          boxShadow: "0 0 0px #00d4ff00",
          duration: 0.7,
          ease: "power2.in",
        });
      }, 900);
    });
  }
});
