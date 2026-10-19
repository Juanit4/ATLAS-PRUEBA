/* =========================================================================
   ATLAS · ORQUESTADOR
   Arma los capítulos y el dock de capas, activa cada capa según el scroll
   y actualiza intro + mapa en cada frame de scroll.
   ========================================================================= */
(function (A) {
  const chaptersEl = document.getElementById("chapters");
  const dock = document.getElementById("dock");
  const nameEl = document.getElementById("layer-name");
  const kickerEl = document.getElementById("park-kicker");
  const park = A.park;

  /* ---------- Gestor de capas ---------- */
  let current = null, stops = [], listeners = [];
  const L = {
    fx: park.fx, under: park.fxUnder, overlay: park.overlay,
    on(el, ev, fn) { el.addEventListener(ev, fn); listeners.push([el, ev, fn]); },
    loop(fn) { const stop = A.loop(fn); stops.push(stop); return stop; },
    activate(id) {
      const layer = A.layers.find(l => l.id === id);
      if (!layer || layer === current) return;
      if (current && current.exit) current.exit(L);
      stops.forEach(f => f()); stops = [];
      listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn)); listeners = [];
      A.clear(park.fx); A.clear(park.fxUnder); A.clear(park.overlay);
      A.hideTip(park.tip);
      park.resetCrowd();
      current = layer;
      nameEl.textContent = layer.nombre;
      nameEl.style.color = layer.color;
      const idx = A.layers.indexOf(layer);
      kickerEl.textContent = idx ? `Capa ${String(idx).padStart(2, "0")} / ${A.layers.length - 1}` : "Colegiales · Comuna 13";
      dock.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.id === id));
      chaptersEl.querySelectorAll(".chapter").forEach(c => c.classList.toggle("on", c.dataset.layer === id));
      layer.enter(L);
    }
  };
  A.layerManager = L;

  /* ---------- Capítulos + dock ---------- */
  A.layers.forEach((layer, i) => {
    const art = A.h("article", { class: "chapter", "data-layer": layer.id, style: `--c:${layer.color}`, id: "capa-" + layer.id }, chaptersEl,
      `<p class="num">${A.icon(layer.forma, layer.color)} ${i ? String(i).padStart(2, "0") + " · " + layer.nombre.toUpperCase() : "TERRITORIO TESTIGO"}</p>
       <h3>${layer.titulo}</h3><p>${layer.texto}</p><p class="how">${layer.how}</p>`);
    const toy = A.h("div", { class: "toy" }, art);
    layer.build(toy, L);
    // Tocar la tarjeta activa su capa
    art.addEventListener("pointerdown", () => L.activate(layer.id));

    const b = A.h("button", { "data-id": layer.id, style: `--c:${layer.color}`, "aria-label": layer.nombre }, dock, A.icon(layer.forma, layer.color, i !== 0) + `<span>${layer.nombre}</span>`);
    b.onclick = () => { L.activate(layer.id); art.scrollIntoView({ behavior: A.reduced ? "auto" : "smooth", block: "center" }); };
  });

  /* ---------- Activación por scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      if (e.target.classList.contains("step")) {
        e.target.parentElement.querySelectorAll(".step").forEach(s => s.classList.toggle("on", s === e.target));
      } else L.activate(e.target.dataset.layer);
    });
  }, { rootMargin: "-45% 0px -45% 0px" });
  document.querySelectorAll(".step, .chapter").forEach(el => io.observe(el));
  L.activate("parque");

  /* ---------- Minimapa (marco general) ---------- */
  const mm = document.getElementById("minimap-svg");
  const BB = A.city.BB;
  mm.setAttribute("viewBox", `${BB.x - 10} ${BB.y - 10} ${BB.w + 20} ${BB.h + 20}`);
  A.s("path", { d: "M" + A.city.outline.map(q => q.map(v => v.toFixed(1)).join(" ")).join("L") + "Z", fill: "#ffffff08", stroke: "#fff", "stroke-width": 6 }, mm);
  A.D.espacios.forEach(e => {
    const [x, y] = A.project(e.lat, e.lon);
    A.s("circle", { cx: x, cy: y, r: e.id === "colegiales" ? 26 : 12, fill: e.id === "colegiales" ? A.C.acento : A.C.publico, opacity: e.id === "colegiales" ? 1 : .4, class: e.id === "colegiales" ? "pulse" : "" }, mm);
  });
  document.getElementById("minimap").addEventListener("click", () => {
    const sec = document.getElementById("city");
    window.scrollTo({ top: sec.offsetTop + (sec.offsetHeight - innerHeight) * .66, behavior: A.reduced ? "auto" : "smooth" });
  });

  /* ---------- Bucle de scroll ---------- */
  const live = document.getElementById("live");
  const intro = document.getElementById("intro");
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      A.intro.update();
      A.city.update();
      live.classList.toggle("on", scrollY > intro.offsetHeight * .8);
      ticking = false;
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();
})(window.ATLAS);
