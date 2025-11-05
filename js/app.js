// app.js — lógica de evaluación de imágenes con GSAP y SweetAlert2
const IMAGES_JSON = "assets-taller/images.json";
const TOTAL_TO_SHOW = 10;

let allImages = [];
let selected = [];
let index = 0;
let responses = [];

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
    const res = await fetch(IMAGES_JSON);
    if (!res.ok) throw new Error("No se pudo cargar images.json");
    const data = await res.json();
    allImages = data;
  } catch (e) {
    console.error(e);
    await Swal.fire({
      title: "Error",
      text: "Error cargando las imágenes. Asegúrate de ejecutar desde un servidor local (no file://).",
      icon: "error",
    });
  }
}

function pickImages() {
  // Separar imágenes por categoría (skins y gamemodes)
  const skins = allImages.filter((img) => img.includes("/skins/"));
  const gamemodes = allImages.filter((img) => img.includes("/gamemodes/"));

  console.log("Total skins:", skins.length);
  console.log("Total gamemodes:", gamemodes.length);

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

  console.log("Imágenes seleccionadas en orden:", selected);
}

function updateProgress() {
  progressText.textContent = `Imagen ${index + 1}/${selected.length}`;
  const pct = Math.round(((index + 1) / selected.length) * 100);
  progressBar.style.width = `${pct}%`;
}

function showImage(i) {
  if (i < 0 || i >= selected.length) return;
  index = i;
  commentEl.value = "";
  updateProgress();
  // animate image change with a small scale pulse
  gsap.to("#eval-image", {
    scale: 0.96,
    duration: 0.12,
    opacity: 0,
    onComplete: () => {
      evalImage.src = selected[index];
      evalImage.alt = `Imagen ${index + 1}`;
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
  // animated intro using GSAP
  startScreen.classList.add("d-none");
  evaluator.classList.remove("d-none");
  gsap.from(".evaluator-card", {
    y: 40,
    opacity: 0,
    duration: 0.6,
    ease: "power3.out",
  });
}

async function showResults() {
  // Ir directo a la página de resultados sin modal
  const accepted = responses.filter((r) => r.decision === "accept").length;
  const rejected = responses.filter((r) => r.decision === "reject").length;

  // Ocultar evaluador y mostrar resultados
  evaluator.classList.add("d-none");
  results.classList.remove("d-none");

  // Build stats HTML
  const statsHTML = `
    <div class="stats-card">
      <div class="stat-item accepted-stat">
        <div class="stat-icon">✓</div>
        <div class="stat-number" data-value="${accepted}">${accepted}</div>
        <div class="stat-label">Aprobadas</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item rejected-stat">
        <div class="stat-icon">✗</div>
        <div class="stat-number" data-value="${rejected}">${rejected}</div>
        <div class="stat-label">Rechazadas</div>
      </div>
    </div>
  `;

  // Build list HTML
  let listHTML =
    '<div class="text-start mx-auto response-list" style="max-width:720px"><ol class="custom-list">';
  responses.forEach((r, idx) => {
    const decisionClass =
      r.decision === "accept" ? "decision-accept" : "decision-reject";
    listHTML += `
      <li class="list-item ${decisionClass}" data-index="${idx}">
        <div class="list-item-content">
          <div class="decision-badge ${decisionClass}">${
      r.decision === "accept" ? "✓ ACEPTADA" : "✗ RECHAZADA"
    }</div>
          <code class="image-path">${r.image}</code>
          <div class="comment-section">
            <div class="comment-label">Justificación:</div>
            <div class="comment-text">${r.comment}</div>
          </div>
        </div>
      </li>
    `;
  });
  listHTML += "</ol></div>";

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
  const listItems = document.querySelectorAll(".list-item");

  console.log("Iniciando animaciones...");
  console.log("Contenedor:", container);
  console.log("Items encontrados:", listItems.length);

  if (!container) {
    console.error("No se encontró .results-container");
    return;
  }

  // Register plugins
  gsap.registerPlugin(ScrollTrigger, TextPlugin);

  // Resetear cualquier transformación previa en los botones
  gsap.set(".results-actions button", { clearProps: "all" });

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

  // 7. Lista de respuestas
  if (listItems.length > 0) {
    console.log("Animando", listItems.length, "items");

    // Contenedor de lista
    masterTL.from(
      ".response-list",
      {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: "power2.out",
      },
      "-=0.3"
    );

    // Animar cada item
    masterTL.from(
      listItems,
      {
        x: (index) => (index % 2 === 0 ? -100 : 100),
        opacity: 0,
        scale: 0.9,
        stagger: 0.1,
        duration: 0.5,
        ease: "back.out(1.3)",
        clearProps: "all",
      },
      "-=0.2"
    );
  } else {
    console.warn("No se encontraron items para animar");
  }

  // 8. Botón de inicio - SOLO UNO
  const homeButton = document.getElementById("home-btn");

  console.log("🔍 DEBUG - Botón encontrado:");
  console.log("home-btn:", homeButton);

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
        duration: 0.3,
      });
    });
  }

  // Hover en list items
  listItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      gsap.to(item, {
        scale: 1.02,
        x: 5,
        duration: 0.3,
      });
    });

    item.addEventListener("mouseleave", () => {
      gsap.to(item, {
        scale: 1,
        x: 0,
        duration: 0.3,
      });
    });
  });

  // Badges flotantes
  const badges = document.querySelectorAll(".decision-badge");
  badges.forEach((badge, i) => {
    gsap.to(badge, {
      y: "random(-3, 3)",
      duration: "random(2, 3)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: i * 0.1,
    });
  });
}

async function recordAndNext(decision) {
  const comment = commentEl.value.trim();

  if (!comment) {
    await Swal.fire({
      title: "Comentario obligatorio",
      text: "Por favor, escribe el por qué de tu decisión antes de continuar.",
      icon: "warning",
      confirmButtonText: "Entendido",
    });

    gsap.fromTo(
      commentEl,
      { x: -10, borderColor: "#ff5e7c" },
      {
        x: 10,
        duration: 0.1,
        repeat: 5,
        yoyo: true,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.to(commentEl, { x: 0, borderColor: "", duration: 0.2 });
        },
      }
    );

    commentEl.focus();
    return;
  }

  responses.push({ image: selected[index], decision, comment });

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
      } else {
        showResults();
      }
    },
  });
}

function resetAll() {
  responses = [];
  selected = [];
  index = 0;
  results.classList.add("d-none");
  evaluator.classList.add("d-none");
  startScreen.classList.remove("d-none");

  // Re-habilitar el botón de inicio
  startBtn.disabled = false;

  gsap.from("#start-screen", { y: 20, opacity: 0, duration: 0.6 });
}

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  const result = await Swal.fire({
    title: "Listo para empezar?",
    text: "Revisa 10 imágenes y responde honestamente.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, iniciar",
    cancelButtonText: "Cancelar",
  });
  if (!result.isConfirmed) {
    startBtn.disabled = false;
    return;
  }

  await loadImages();
  if (allImages.length === 0) {
    startBtn.disabled = false;
    return;
  }
  pickImages();
  await showEvaluator();
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
