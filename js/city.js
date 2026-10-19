/* =========================================================================
   ATLAS · MAPA ESQUEMÁTICO DE CABA
   Se dibuja con el scroll como un boceto: contorno → avenidas y vías →
   manzanas → espacios verdes → zoom a Colegiales.
   ========================================================================= */
(function (A) {
  const sec = document.getElementById("city");
  const stage = sec.querySelector(".stage");
  const svg = document.getElementById("city-svg");
  const tip = document.getElementById("city-tip");
  const legend = document.getElementById("city-legend");
  const zoomCtrl = document.getElementById("zoom-ctrl");
  const s = A.s, CABA = A.D.caba;

  /* ---------- Proyección lat/lon → plano ---------- */
  const K = 5000, LON0 = -58.545, LAT0 = -34.528, COS = Math.cos(34.62 * Math.PI / 180);
  const P = (lat, lon) => [(lon - LON0) * COS * K, (LAT0 - lat) * K];
  A.project = P;
  const pathOf = (pts, close) => pts.map((q, i) => (i ? "L" : "M") + P(q[0], q[1]).map(v => v.toFixed(1)).join(" ")).join("") + (close ? "Z" : "");

  const outline = CABA.contorno.map(q => P(q[0], q[1]));
  const xs = outline.map(q => q[0]), ys = outline.map(q => q[1]);
  const BB = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  const FULL = { x: BB.x - 60, y: BB.y - 40, w: BB.w + 120, h: BB.h + 80 };
  const colegiales = A.D.espacios.find(e => e.id === "colegiales");
  const [CX, CY] = P(colegiales.lat, colegiales.lon);
  const ZOOM = { x: CX - 55, y: CY - 32, w: 110, h: 64 };
  svg.setAttribute("viewBox", `${FULL.x} ${FULL.y} ${FULL.w} ${FULL.h}`);

  /* ---------- defs ---------- */
  const defs = s("defs", {}, svg);
  const filt = s("filter", { id: "sketch-city", x: "-5%", y: "-5%", width: "110%", height: "110%" }, defs);
  const turb = s("feTurbulence", { type: "fractalNoise", baseFrequency: ".04", numOctaves: 2, seed: 7, result: "n" }, filt);
  const disp = s("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale: 3, xChannelSelector: "R", yChannelSelector: "G" }, filt);
  s("path", { d: pathOf(CABA.contorno, true) }, s("clipPath", { id: "caba-clip" }, defs));
  const mask = s("mask", { id: "grid-mask", maskUnits: "userSpaceOnUse", x: FULL.x, y: FULL.y, width: FULL.w, height: FULL.h }, defs);
  s("rect", { x: FULL.x, y: FULL.y, width: FULL.w, height: FULL.h, fill: "#000" }, mask);
  const maskCircle = s("circle", { cx: CX, cy: CY, r: 0, fill: "#fff" }, mask);

  const root = s("g", {}, svg);
  const sketch = s("g", { filter: "url(#sketch-city)" }, root);

  /* ---------- Río (textura de líneas) ---------- */
  const water = s("g", { opacity: 0 }, sketch);
  for (let i = 0; i < 26; i++) {
    const y = BB.y + i * 34;
    s("path", { d: `M${BB.x + BB.w * .55 + i * 9} ${y} q 30 -6 60 0 t 60 0 t 60 0 t 60 0`, stroke: "#fff", "stroke-opacity": .14, fill: "none", "stroke-width": 1, "vector-effect": "non-scaling-stroke" }, water);
  }
  const riverLbl = s("text", { x: BB.x + BB.w * .86, y: BB.y + BB.h * .22, fill: "#888", "font-size": 15, "font-style": "italic", "font-family": "Inter Tight", "text-anchor": "middle", opacity: 0 }, root, "Río de la Plata");

  /* ---------- Manzanas (grilla rotada, recortada al contorno) ---------- */
  const gridG = s("g", { "clip-path": "url(#caba-clip)", mask: "url(#grid-mask)" }, sketch);
  const gridInner = s("g", { transform: `rotate(-38 ${BB.x + BB.w / 2} ${BB.y + BB.h / 2})` }, gridG);
  const span = Math.max(BB.w, BB.h) * 1.5, ox = BB.x + BB.w / 2 - span / 2, oy = BB.y + BB.h / 2 - span / 2;
  let gd = "";
  for (let v = 0; v <= span; v += 6.2) {
    gd += `M${(ox + v).toFixed(1)} ${oy.toFixed(1)}V${(oy + span).toFixed(1)}`;
    gd += `M${ox.toFixed(1)} ${(oy + v).toFixed(1)}H${(ox + span).toFixed(1)}`;
  }
  s("path", { d: gd, stroke: "#fff", "stroke-opacity": .22, "stroke-width": .6, fill: "none", "vector-effect": "non-scaling-stroke" }, gridInner);

  /* ---------- Contorno, avenidas, vías ---------- */
  const draw = (d, w, op, parent) => s("path", { d, fill: "none", stroke: "#fff", "stroke-width": w, "stroke-opacity": op, "stroke-linecap": "round", "stroke-linejoin": "round", pathLength: 1, "stroke-dasharray": "1 1", "stroke-dashoffset": 1, "vector-effect": "non-scaling-stroke" }, parent);
  const outlinePath = draw(pathOf(CABA.contorno, true), 2.4, 1, sketch);
  const outlinePath2 = draw(pathOf(CABA.contorno.map(q => [q[0] + .0006, q[1] - .0005]), true), 1, .5, sketch); // trazo doble, "a mano"
  const avs = CABA.avenidas.filter(a => a.pts.length).map(a => draw(pathOf(a.pts), 1.6, .85, sketch));
  const rails = CABA.vias.map(v => draw(pathOf(v.pts), 1, .9, sketch));
  const ties = s("g", { opacity: 0 }, sketch);
  CABA.vias.forEach(v => s("path", { d: pathOf(v.pts), fill: "none", stroke: "#fff", "stroke-width": 5, "stroke-dasharray": "1 5", "vector-effect": "non-scaling-stroke" }, ties));

  /* Etiquetas */
  const labels = s("g", { opacity: 0, "font-family": "JetBrains Mono, monospace", fill: "#9a9a96" }, root);
  const labelEls = CABA.barrios.map(b => {
    const [x, y] = P(b[1], b[2]);
    return s("text", { x, y, "font-size": 9, "text-anchor": "middle", "letter-spacing": .5 }, labels, b[0].toUpperCase());
  });
  const avLabels = s("g", { opacity: 0, "font-family": "Inter Tight", fill: "#cfcfca", "font-style": "italic" }, root);
  CABA.avenidas.filter(a => a.pts.length > 1).forEach(a => {
    const m = a.pts[Math.floor(a.pts.length / 2)];
    const [x, y] = P(m[0], m[1]);
    s("text", { x: x + 4, y: y - 4, "font-size": 8 }, avLabels, a.nombre);
  });
  const gp = P(-34.612, -58.531);
  s("text", { x: gp[0] - 8, y: gp[1], "font-size": 9, transform: `rotate(-84 ${gp[0] - 8} ${gp[1]})`, "text-anchor": "middle" }, avLabels, "Av. General Paz");
  const ri = P(-34.668, -58.425);
  s("text", { x: ri[0] + 6, y: ri[1] + 12, "font-size": 9, transform: `rotate(38 ${ri[0] + 6} ${ri[1] + 12})` }, avLabels, "Riachuelo");

  /* ---------- Red de sensores (puntitos) ---------- */
  function inside(x, y) {
    let c = false;
    for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
      const [xi, yi] = outline[i], [xj, yj] = outline[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  const sensorsG = s("g", { opacity: 0 }, root);
  let sensorCount = 0;
  for (let i = 0; i < 400 && sensorCount < 160; i++) {
    const x = A.rand(BB.x, BB.x + BB.w), y = A.rand(BB.y, BB.y + BB.h);
    if (!inside(x, y)) continue;
    s("circle", { cx: x, cy: y, r: 1.3, fill: [A.C.ciudadanos, A.C.publico, A.C.privado][sensorCount % 3], class: Math.random() < .3 ? "blink" : "" }, sensorsG);
    sensorCount++;
  }
  A.citySensors = sensorCount;

  /* ---------- Parque Colegiales (silueta al hacer zoom) ---------- */
  const r1 = P(-34.5770, -58.4180), r2 = P(-34.5735, -58.4490), r3 = P(-34.5600, -58.4750);
  const dir = [r3[0] - r1[0], r3[1] - r1[1]], dl = Math.hypot(dir[0], dir[1]);
  const u = [dir[0] / dl, dir[1] / dl], n = [-u[1], u[0]];
  const L = 30, W = 3.4, off = 3.2;
  const pc = [CX, CY];
  const corner = (a, b) => [pc[0] + u[0] * a + n[0] * b, pc[1] + u[1] * a + n[1] * b];
  const parkPoly = [corner(-L / 2, -off), corner(L / 2, -off - 0.4), corner(L / 2 + 1, -off - W * .55), corner(-L / 2, -off - W * 1.25)];
  const parkOutline = s("g", { opacity: 0 }, root);
  s("path", { d: "M" + parkPoly.map(q => q.map(v => v.toFixed(2)).join(" ")).join("L") + "Z", fill: A.C.publico, "fill-opacity": .25, stroke: A.C.acento, "stroke-width": 2, "vector-effect": "non-scaling-stroke" }, parkOutline);
  const lblPos = corner(0, -off - W * 2.6);
  s("text", { x: lblPos[0], y: lblPos[1], "font-size": 3, fill: A.C.acento, "text-anchor": "middle", "font-family": "Inter Tight", "font-weight": 600 }, parkOutline, "Parque Ferroviario Colegiales");
  const lblPos2 = corner(0, 5.2);
  s("text", { x: lblPos2[0], y: lblPos2[1], "font-size": 2, fill: "#aaa", "text-anchor": "middle", "font-family": "JetBrains Mono" }, parkOutline, "vías FFCC Mitre · Estación Colegiales");

  /* ---------- Espacios verdes ---------- */
  const parksG = s("g", {}, root);
  const parks = A.D.espacios.map((e, i) => {
    const [x, y] = P(e.lat, e.lon);
    const r = e.id === "colegiales" ? 9 : 4 + Math.sqrt(e.ha) * 1.5;
    const act = e.estado === "activo";
    const g = s("g", { class: "park-shape", style: `transform-origin:${x}px ${y}px`, tabindex: 0, role: "button", "aria-label": e.nombre }, parksG);
    const scaleG = s("g", {}, g);
    if (act) {
      s("circle", { cx: x, cy: y, r: r * 1.6, fill: "none", stroke: A.C.acento, "stroke-width": 1, "vector-effect": "non-scaling-stroke", class: "pulse" }, scaleG);
    }
    s("path", {
      d: A.shape(e.forma, x, y, r),
      fill: act ? A.C.acento : A.C.publico, "fill-opacity": act ? 1 : .18,
      stroke: act ? A.C.acento : A.C.publico, "stroke-width": 1.4, "vector-effect": "non-scaling-stroke"
    }, scaleG);
    const votes = () => (A.store.get("votos", {})[e.id] || 0);
    const info = () => act
      ? `<b>${e.nombre}</b><span class="mono">${e.barrio} · Comuna ${e.comuna}</span><br>Lectura ATLAS disponible.<br><span class="mono">clic para entrar →</span>`
      : `<b>${e.nombre}</b><span class="mono">${e.barrio} · Comuna ${e.comuna}</span><br>Todavía no tiene lectura ATLAS.<br><span class="mono">${votes()} votos para relevarlo</span>`;
    g.addEventListener("pointermove", ev => { if (!tip.classList.contains("pinned")) A.showTip(tip, info(), ev, stage); });
    g.addEventListener("pointerleave", () => { if (!tip.classList.contains("pinned")) A.hideTip(tip); });
    const open = ev => {
      ev.stopPropagation();
      if (act) { document.getElementById("park").scrollIntoView({ behavior: A.reduced ? "auto" : "smooth" }); return; }
      A.showTip(tip, info() + `<br><button class="btn small" id="vote-btn">Votar para que sea el próximo</button>`, ev, stage);
      tip.classList.add("pinned");
      document.getElementById("vote-btn").onclick = (e2) => {
        e2.stopPropagation();
        const v = A.store.get("votos", {}); v[e.id] = (v[e.id] || 0) + 1; A.store.set("votos", v);
        A.showTip(tip, info() + `<br><span class="mono" style="color:#0a7">¡Gracias! Tu voto quedó registrado.</span>`, ev, stage);
        tip.classList.add("pinned");
      };
    };
    g.addEventListener("click", open);
    g.addEventListener("keydown", ev => { if (ev.key === "Enter") open(Object.assign(ev, { clientX: stage.clientWidth / 2, clientY: stage.clientHeight / 2 })); });
    return { e, g, scaleG, x, y, i, act };
  });
  stage.addEventListener("click", () => A.hideTip(tip));

  /* ---------- Zoom con botones (mueve el scroll) ---------- */
  zoomCtrl.addEventListener("click", ev => {
    const b = ev.target.closest("button"); if (!b) return;
    const total = sec.offsetHeight - window.innerHeight;
    const target = b.dataset.zoom === "in" ? .97 : .66;
    window.scrollTo({ top: sec.offsetTop + total * target, behavior: A.reduced ? "auto" : "smooth" });
  });

  /* ---------- Render por scroll ---------- */
  function render(p) {
    const o = A.ease(A.seg(p, 0, .16));
    outlinePath.setAttribute("stroke-dashoffset", 1 - o);
    outlinePath2.setAttribute("stroke-dashoffset", 1 - A.ease(A.seg(p, .04, .2)));
    water.setAttribute("opacity", A.seg(p, .08, .2));
    riverLbl.setAttribute("opacity", A.seg(p, .1, .2) * (1 - A.seg(p, .74, .8)));

    avs.forEach((a, i) => a.setAttribute("stroke-dashoffset", 1 - A.ease(A.seg(p, .14 + i * .015, .3 + i * .01))));
    rails.forEach((a, i) => a.setAttribute("stroke-dashoffset", 1 - A.ease(A.seg(p, .18 + i * .02, .32))));
    ties.setAttribute("opacity", A.seg(p, .26, .34) * .8);
    avLabels.setAttribute("opacity", A.seg(p, .24, .32) * (1 - A.seg(p, .76, .82)));

    maskCircle.setAttribute("r", A.ease(A.seg(p, .3, .5)) * 900);
    labels.setAttribute("opacity", A.seg(p, .38, .48) * (1 - A.seg(p, .76, .82)) * .9);

    // Espacios verdes: aparecen escalonados
    parks.forEach(pk => {
      const t = A.seg(p, .46 + pk.i * .006, .56 + pk.i * .006);
      const sc = A.ease(t);
      pk.g.style.opacity = t;
      pk.g.style.pointerEvents = t > .5 ? "auto" : "none";
      pk.scaleG.setAttribute("transform", `translate(${pk.x} ${pk.y}) scale(${sc / zoomK}) translate(${-pk.x} ${-pk.y})`);
    });
    sensorsG.setAttribute("opacity", A.seg(p, .52, .6) * .8 * (1 - A.seg(p, .72, .8)));
    legend.classList.toggle("on", p > .5);
    zoomCtrl.classList.toggle("on", p > .55);

    // Zoom a Colegiales
    const z = A.ease(A.seg(p, .72, .94));
    const vb = {
      x: A.lerp(FULL.x, ZOOM.x, z), y: A.lerp(FULL.y, ZOOM.y, z),
      w: A.lerp(FULL.w, ZOOM.w, z), h: A.lerp(FULL.h, ZOOM.h, z)
    };
    svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    zoomK = FULL.w / vb.w;
    // El "temblor" del boceto se mantiene parejo a cualquier escala
    disp.setAttribute("scale", (3 / zoomK).toFixed(3));
    turb.setAttribute("baseFrequency", (.04 * zoomK).toFixed(4));
    parkOutline.setAttribute("opacity", A.seg(p, .86, .94));
    parks.forEach(pk => {
      if (pk.act) pk.g.style.opacity = Math.min(+pk.g.style.opacity, 1 - A.seg(p, .86, .93) * .85);
      else pk.g.style.opacity = +pk.g.style.opacity * (1 - z * .6);
    });
  }
  let zoomK = 1;

  A.city = { update() { render(A.progress(sec)); }, outline, BB, P };
  render(0);
})(window.ATLAS);
