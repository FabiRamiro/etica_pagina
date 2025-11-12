// app.js — lógica de evaluación de imágenes con GSAP y SweetAlert2
const IMAGES_JSON = "assets-taller/images.json";
const TOTAL_TO_SHOW = 20;

// Reglas para miniaturas (gamemodes)
const GAMEMODE_RULES = [
  { id: 1, label: "Miniatura de mala calidad", icon: "❌", color: "#ff5e7c" },
  { id: 2, label: "Contenido inapropiado para jóvenes", icon: "⚠️", color: "#ffd700" },
  { id: 3, label: "Usa marcas registradas", icon: "❌", color: "#ff3b4d" },
  { id: 4, label: "Miniatura engañosa", icon: "⚠️", color: "#ff9500" },
];

// Reglas para skins
const SKIN_RULES = [
  { id: 5, label: "Personaje irreconocible", icon: "❌", color: "#ff5e7c" },
  { id: 6, label: "Skin inapropiada para jóvenes", icon: "⚠️", color: "#ffd700" },
  { id: 7, label: "Falta de respeto", icon: "❌", color: "#ff3b4d" },
  { id: 8, label: "Copia de otro personaje o skin", icon: "⚠️", color: "#ff9500" },
];

let allImages = [];
let selected = [];
let index = 0;
let responses = [];
let currentImageType = null; // 'gamemode' or 'skin'

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
    // Añadir timestamp para evitar cache
    const timestamp = new Date().getTime();
    const res = await fetch(`${IMAGES_JSON}?t=${timestamp}`, {
      cache: 'no-cache'
    });
    if (!res.ok) throw new Error("No se pudo cargar images.json");
    const data = await res.json();
    allImages = data;
    console.log("✓ Imágenes cargadas:", allImages.length, "imágenes");
    console.log("📋 Primeras 3:", allImages.slice(0, 3));
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

  // Separar imágenes por categoría (skins y gamemodes)
  const skins = allImages.filter((img) => img.includes("/skins/"));
  const gamemodes = allImages.filter((img) => img.includes("/gamemodes/"));

  console.log("📊 Total skins:", skins.length);
  console.log("📊 Total gamemodes:", gamemodes.length);

  // Mezclar cada categoría
  shuffle(skins);
  shuffle(gamemodes);

  // Alternar: skin, gamemode, skin, gamemode...
  selected = [];
  const count = Math.min(
    TOTAL_TO_SHOW,
    Math.min(skins.length, gamemodes.length) * 2
  );

  for (let i = 0; i < count; i++) {
    if (i % 2 === 0) {
      // Posición par = skin
      selected.push(skins[Math.floor(i / 2)]);
    } else {
      // Posición impar = gamemode
      selected.push(gamemodes[Math.floor(i / 2)]);
    }
  }

  console.log("✓ Imágenes seleccionadas:", selected.length, selected);
}

function updateProgress() {
  progressText.textContent = `Imagen ${index + 1}/${selected.length}`;
  const pct = Math.round(((index + 1) / selected.length) * 100);
  progressBar.style.width = `${pct}%`;
}

function showImage(i) {
  console.log("🖼️ showImage llamado con índice:", i);
  
  if (i < 0 || i >= selected.length) {
    console.error("❌ showImage: índice inválido", i, "selected.length:", selected.length);
    return;
  }
  
  if (!evalImage) {
    console.error("❌ evalImage element not found!");
    return;
  }
  
  index = i;
  
  // Resetear selección de regla
  if (commentEl) commentEl.value = "";
  const ruleButtons = document.querySelectorAll(".rule-btn");
  ruleButtons.forEach((btn) => btn.classList.remove("active"));
  
  updateProgress();
  
  const imagePath = selected[index];
  console.log("📸 Mostrando imagen:", imagePath, "en elemento:", evalImage);

  // Determinar tipo de imagen y renderizar reglas apropiadas
  currentImageType = imagePath.includes("/skins/") ? "skin" : "gamemode";
  renderRuleButtons();

  // Re-enable both buttons when showing new image
  if (acceptBtn) acceptBtn.disabled = false;
  if (rejectBtn) rejectBtn.disabled = false;

  // animate image change with a small scale pulse
  gsap.to("#eval-image", {
    scale: 0.96,
    duration: 0.12,
    opacity: 0,
    onComplete: () => {
      evalImage.src = imagePath;
      evalImage.alt = `Imagen ${index + 1}`;
      console.log("✓ Imagen src asignado:", evalImage.src);
      
      evalImage.onerror = () => {
        console.error("❌ Error loading image:", imagePath);
        evalImage.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23333' width='400' height='300'/%3E%3Ctext x='50%' y='50%' text-anchor='middle' dy='.3em' fill='%23fff' font-size='20'%3EImagen no encontrada%3C/text%3E%3C/svg%3E";
      };
      
      evalImage.onload = () => {
        console.log("✓ Imagen cargada exitosamente");
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

  // Limpiar animaciones GSAP del startScreen
  gsap.killTweensOf(startScreen);

  // OCULTAR startScreen completamente
  startScreen.style.display = "none";
  startScreen.style.visibility = "hidden";
  startScreen.classList.add("d-none");

  // MOSTRAR evaluator
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
  // Limpiar animaciones previas
  gsap.killTweensOf("*");

  // Ir directo a la página de resultados sin modal
  const accepted = responses.filter((r) => r.decision === "accept").length;
  const rejected = responses.filter((r) => r.decision === "reject").length;

  // Limpiar animaciones GSAP del evaluator
  gsap.killTweensOf(evaluator);
  gsap.killTweensOf(".evaluator-card");

  // OCULTAR evaluador completamente
  evaluator.style.display = "none";
  evaluator.style.visibility = "hidden";
  evaluator.classList.add("d-none");

  // MOSTRAR resultados
  results.style.display = "block";
  results.style.visibility = "visible";
  results.style.opacity = "1";
  results.style.zIndex = "1";
  results.classList.remove("d-none");

  // Build stats HTML
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

  // Build list HTML con 2 columnas y imágenes
  let listHTML = `
    <div class="response-list-wrapper">
      <div class="response-grid">
  `;
  
  responses.forEach((r, idx) => {
    const decisionClass = r.decision === "accept" ? "decision-accept" : "decision-reject";
    const badgeText = r.decision === "accept" ? "APROBADA" : "RECHAZADA";
    const badgeIcon = r.decision === "accept" ? "✓" : "✗";
    
    // Solo mostrar el comentario si es un rechazo
    const ruleText = r.decision === "reject" ? `<div class="response-rule">${r.comment}</div>` : '';

    listHTML += `
      <div class="response-card ${decisionClass}" data-index="${idx}">
        <div class="response-badge ${decisionClass}">
          <span class="badge-icon">${badgeIcon}</span>
          <span class="badge-text">${badgeText}</span>
        </div>
        <div class="response-image-wrap">
          <img src="${r.image}" alt="respuesta-${idx}" class="response-thumb" />
        </div>
        ${ruleText}
      </div>
    `;
  });

  listHTML += `
      </div>
    </div>
  `;

  document.querySelector(".summary-stats").innerHTML = statsHTML;
  document.querySelector(".summary-list").innerHTML = listHTML;

  // Scroll to top
  window.scrollTo(0, 0);

  // EPIC ANIMATIONS START HERE - con delay para asegurar renderizado
  setTimeout(() => {
    animateResultsEntrance();
  }, 50);
}

function animateResultsEntrance() {
  // Verificar que los elementos existen
  const container = document.querySelector(".results-container");
  const responseCards = document.querySelectorAll(".response-card");

  console.log("🎬 Iniciando animaciones de resultados...");
  console.log("Contenedor:", container);
  console.log("Cards encontradas:", responseCards.length);

  if (!container) {
    console.error("❌ No se encontró .results-container");
    return;
  }

  // Register plugins
  gsap.registerPlugin(ScrollTrigger, TextPlugin);

  // Resetear transformaciones previas
  gsap.set(".results-actions button", { clearProps: "all" });
  gsap.set(container, { clearProps: "all", opacity: 1 });
  gsap.set(results, { clearProps: "all", opacity: 1 });

  // Timeline master
  const masterTL = gsap.timeline();

  // 1. Contenedor
  masterTL.from(container, {
    scale: 0.5,
    opacity: 0,
    duration: 0.8,
    ease: "back.out(1.5)",
  });

  // 2. Orbes
  masterTL.from(
    ".glow-orb",
    {
      scale: 0,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
    },
    "-=0.6"
  );

  // Animación perpetua de orbes
  gsap.to(".glow-orb-1", {
    x: "random(-80, 80)",
    y: "random(-80, 80)",
    duration: 4,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });

  gsap.to(".glow-orb-2", {
    x: "random(-60, 60)",
    y: "random(-60, 60)",
    duration: 5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });

  gsap.to(".glow-orb-3", {
    x: "random(-100, 100)",
    y: "random(-100, 100)",
    duration: 6,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });

  // 3. Título
  masterTL.from(
    ".results-title",
    {
      y: -80,
      opacity: 0,
      duration: 0.6,
      ease: "power3.out",
    },
    "-=0.4"
  );

  // 4. Subtítulo
  masterTL.from(
    ".results-subtitle",
    {
      opacity: 0,
      y: 20,
      duration: 0.5,
      ease: "power2.out",
    },
    "-=0.3"
  );

  // 5. Stats card
  masterTL.from(
    ".stats-card",
    {
      scale: 0,
      opacity: 0,
      duration: 0.8,
      ease: "back.out(1.5)",
    },
    "-=0.2"
  );

  // 6. Stats items
  masterTL.from(
    ".stat-item",
    {
      scale: 0,
      opacity: 0,
      stagger: 0.15,
      duration: 0.6,
      ease: "back.out(1.5)",
    },
    "-=0.4"
  );

  // Counter animation
  const statNumbers = document.querySelectorAll(".stat-number");
  statNumbers.forEach((num) => {
    const finalValue = parseInt(num.dataset.value);
    masterTL.from(
      num,
      {
        textContent: 0,
        duration: 1,
        snap: { textContent: 1 },
        ease: "power2.out",
        onUpdate: function () {
          num.textContent = Math.round(this.targets()[0].textContent);
        },
      },
      "-=0.6"
    );
  });

  // Glow iconos
  gsap.to(".stat-icon", {
    textShadow: "0 0 15px currentColor",
    scale: 1.05,
    duration: 1,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });

  // 7. Response cards (nuevas)
  if (responseCards.length > 0) {
    console.log("🎨 Animando", responseCards.length, "response cards");

    // Contenedor de lista
    masterTL.from(
      ".response-list-wrapper",
      {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: "power2.out",
      },
      "-=0.3"
    );

    // Animar cada card desde abajo sin movimiento horizontal
    masterTL.from(
      responseCards,
      {
        y: 60,
        opacity: 0,
        scale: 0.9,
        stagger: 0.06,
        duration: 0.5,
        ease: "power2.out",
      },
      "-=0.2"
    );

    // Asegurar que se limpien TODAS las transformaciones después de la animación
    masterTL.call(() => {
      responseCards.forEach(card => {
        gsap.set(card, { clearProps: "all" });
        // Forzar reseteo de estilo inline
        card.style.transform = "";
        card.style.opacity = "";
      });
    });
  } else {
    console.warn("⚠ No se encontraron response-cards para animar");
  }

  // 8. Botón de inicio - SOLO UNO
  const homeButton = document.getElementById("home-btn");

  console.log("🔍 DEBUG - Botón encontrado:", homeButton);

  masterTL.from(
    ".results-actions",
    {
      scale: 0,
      opacity: 0,
      duration: 0.6,
      ease: "back.out(1.5)",
      clearProps: "all",
    },
    "-=0.2"
  );

  const allButtons = document.querySelectorAll(".results-actions button");
  console.log("📊 Total botones en .results-actions:", allButtons.length);

  masterTL.fromTo(
    allButtons,
    {
      scale: 0,
      opacity: 0,
    },
    {
      scale: 1,
      opacity: 1,
      stagger: 0.1,
      duration: 0.5,
      ease: "back.out(1.5)",
      clearProps: "all",
    },
    "-=0.4"
  );

  // Hover effect solo para el botón home
  if (homeButton) {
    homeButton.addEventListener("mouseenter", () => {
      gsap.to(homeButton, {
        scale: 1.1,
        boxShadow: "0 0 30px rgba(46, 230, 167, 0.6)",
        duration: 0.3,
      });
    });

    homeButton.addEventListener("mouseleave", () => {
      gsap.to(homeButton, {
        scale: 1,
        boxShadow: "0 10px 30px rgba(46, 230, 167, 0.3)",
        duration: 0.2,
      });
    });
  }

  // Callback final: asegurar que todas las cards y sus hijos estén en posición correcta
  masterTL.call(() => {
    console.log("✅ Animaciones completadas - limpiando estilos finales");

    // Detener todas las animaciones GSAP infinitas primero
    gsap.killTweensOf(".response-badge");
    gsap.killTweensOf(".stat-icon");

    responseCards.forEach(card => {
      // Limpiar cualquier transformación residual de la card
      gsap.set(card, { clearProps: "all" });
      card.style.transform = "";
      card.style.opacity = "1";
      card.style.translate = "none";
      card.style.rotate = "none";
      card.style.scale = "none";

      // Limpiar también los badges dentro de cada card
      const badge = card.querySelector(".response-badge");
      if (badge) {
        gsap.set(badge, { clearProps: "all" });
        badge.style.transform = "";
        badge.style.translate = "none";
        badge.style.rotate = "none";
        badge.style.scale = "none";
      }
    });
  });

  // Agregar pequeño delay antes de habilitar hovers
  masterTL.call(() => {
    // Hover en response cards (solo después de que las animaciones terminen)
    responseCards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        gsap.to(card, {
          y: -4,
          duration: 0.3,
          ease: "power2.out",
          overwrite: true
        });
      });

      card.addEventListener("mouseleave", () => {
        gsap.to(card, {
          y: 0,
          duration: 0.3,
          ease: "power2.inOut",
          overwrite: true
        });
      });
    });
  }, null, "+=0.2");
}

async function recordAndNext(decision) {
  const selectedRuleBtn = document.querySelector(".rule-btn.active");
  
  // Validar si se intenta rechazar sin regla seleccionada
  if (decision === "reject" && !selectedRuleBtn) {
    await Swal.fire({
      title: "Selección obligatoria",
      text: "Debes seleccionar una regla para rechazar la imagen.",
      icon: "warning",
      confirmButtonText: "Entendido",
    });

    // Animar el contenedor de reglas
    const rulesSection = document.querySelector(".rules-section");
    if (rulesSection) {
      gsap.fromTo(
        rulesSection,
        { x: -10 },
        {
          x: 10,
          duration: 0.1,
          repeat: 5,
          yoyo: true,
          ease: "power2.inOut",
          onComplete: () => {
            gsap.to(rulesSection, { x: 0, duration: 0.2 });
          },
        }
      );
    }

    return;
  }

  // AHORA sí, deshabilitar botones para prevenir clics múltiples
  if (acceptBtn) acceptBtn.disabled = true;
  if (rejectBtn) rejectBtn.disabled = true;

  // Prepare response data
  let ruleName = "Imagen aceptada";
  let ruleId = null;

  if (selectedRuleBtn) {
    ruleId = selectedRuleBtn.dataset.ruleId;
    ruleName = selectedRuleBtn.textContent.trim();
  }

  responses.push({ 
    image: selected[index], 
    decision, 
    comment: ruleName,
    ruleId: ruleId
  });

  gsap.to(".evaluator-card", {
    y: -20,
    opacity: 0,
    duration: 0.18,
    onComplete: () => {
      if (index + 1 < selected.length) {
        showImage(index + 1);
        gsap.fromTo(
          ".evaluator-card",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3 }
        );
        // Re-habilitar botones después de la transición
        setTimeout(() => {
          if (rejectBtn) rejectBtn.disabled = false;
          // acceptBtn se habilita en showImage
        }, 300);
      } else {
        showResults();
      }
    },
  });
}

function resetAll() {
  console.log("🔄 Reiniciando aplicación...");
  
  // Matar todas las animaciones GSAP activas
  gsap.killTweensOf("*");

  // Limpiar arrays de datos
  responses = [];
  selected = [];
  index = 0;
  currentImageType = null;

  // Limpiar imagen del evaluador
  if (evalImage) {
    evalImage.src = "";
    evalImage.alt = "";
  }
  
  // Limpiar contenedor de reglas
  const rulesContainer = document.querySelector(".rules-container-stacked");
  if (rulesContainer) {
    rulesContainer.innerHTML = "";
  }
  
  // Limpiar selección de reglas
  const ruleButtons = document.querySelectorAll(".rule-btn");
  ruleButtons.forEach((btn) => btn.classList.remove("active"));
  
  // Resetear progreso
  if (progressBar) progressBar.style.width = "0%";
  if (progressText) progressText.textContent = "Imagen 0/0";
  
  // Re-habilitar botones
  if (startBtn) startBtn.disabled = false;
  if (acceptBtn) acceptBtn.disabled = false;

  // Limpiar todas las transformaciones GSAP de los contenedores principales
  gsap.set([results, evaluator, startScreen, ".evaluator-card"], { clearProps: "all" });

  // Limpiar todas las transformaciones de elementos internos de resultados
  gsap.set(".results-container, .results-container *, .response-card, .glow-orb, .stat-item, .response-badge", {
    clearProps: "all"
  });

  // OCULTAR COMPLETAMENTE evaluador y resultados
  results.style.display = "none";
  results.style.visibility = "hidden";
  results.classList.add("d-none");

  evaluator.style.display = "none";
  evaluator.style.visibility = "hidden";
  evaluator.classList.add("d-none");

  // MOSTRAR pantalla de inicio
  startScreen.style.display = "block";
  startScreen.style.visibility = "visible";
  startScreen.style.opacity = "1";
  startScreen.style.transform = "none";
  startScreen.style.zIndex = "999";
  startScreen.style.position = "relative";
  startScreen.classList.remove("d-none");

  // Animación de entrada
  gsap.from("#start-screen", { y: 20, opacity: 0, duration: 0.6 });
  
  console.log("✓ Reinicio completo - estado limpio");
}

function renderRuleButtons() {
  console.log("🎯 Renderizando botones de reglas para:", currentImageType);
  const container = document.querySelector(".rules-container-stacked");

  if (!container) {
    console.error("⚠ No se encontró .rules-container-stacked");
    return;
  }

  console.log("✓ Contenedor encontrado:", container);
  container.innerHTML = "";

  // Seleccionar el set de reglas apropiado
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
      // Si el botón ya está activo, deseleccionarlo
      if (btn.classList.contains("active")) {
        btn.classList.remove("active");
        // Re-habilitar botón de aceptar cuando se deselecciona
        if (acceptBtn) acceptBtn.disabled = false;
      } else {
        // Desactivar otros botones
        document.querySelectorAll(".rule-btn").forEach((b) => b.classList.remove("active"));
        // Activar este botón
        btn.classList.add("active");
        // Deshabilitar botón de aceptar cuando se selecciona una regla
        if (acceptBtn) acceptBtn.disabled = true;
      }

      // Animación
      gsap.to(btn, {
        scale: 1.02,
        duration: 0.15,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(btn, { scale: 1, duration: 0.1 });
        }
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

  console.log("📥 Cargando imágenes...");
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