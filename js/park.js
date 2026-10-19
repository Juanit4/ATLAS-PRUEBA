/* =========================================================================
   ATLAS · PLANO DEL PARQUE FERROVIARIO COLEGIALES
   Esquema (no a escala) en un lienzo de 1600 x 700.
   Incluye: calles, manzanas, parque, vías, sensores y personas en vivo.
   ========================================================================= */
(function (A) {
  const s = A.s, PD = A.D.parque;

  /* ---------- Geometría base (editable) ---------- */
  const G = {
    park: [[95,322],[140,214],[1500,168],[1536,180],[1526,250],[1300,272],[900,300],[500,336],[250,366],[118,374]],
    moldesY: x => 192 - (x - 30) * 0.0333,     // eje de la calle Moldes
    railY:   x => 410 - (x - 30) * 0.0714,     // primera vía
    cramerY: x => 512 - (x - 30) * 0.0714,     // calle Crámer
    streetsX: [110, 360, 620, 880, 1140, 1400], // cruces (izq → der) = PD.calles
    mainPath: [[115,335],[300,322],[520,306],[800,281],[1100,255],[1350,232],[1515,205]]
  };
  A.parkGeom = G;

  const inPoly = (x, y, poly) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  A.inPark = (x, y) => inPoly(x, y, G.park);
  const polyD = (pts, close = true) => "M" + pts.map(q => q.join(" ")).join("L") + (close ? "Z" : "");

  /* ---------- Dibuja el plano base dentro de un <svg> ---------- */
  A.drawParkBase = function (svg, opts = {}) {
    const base = s("g", { filter: "url(#sketch)" }, svg);
    const line = (d, w = 1, op = .7, extra = {}) => s("path", Object.assign({ d, fill: "none", stroke: "#fff", "stroke-width": w, "stroke-opacity": op, "stroke-linecap": "round" }, extra), base);

    // Manzanas arriba de Moldes y abajo de Crámer
    const xs = [-40, ...G.streetsX, 1680];
    for (let i = 0; i < xs.length - 1; i++) {
      const a = xs[i] + 14, b = xs[i + 1] - 14;
      if (b - a < 30) continue;
      // arriba
      const ta = G.moldesY(a) - 14, tb = G.moldesY(b) - 14;
      line(`M${a} ${ta}L${b} ${tb}L${b} 10L${a} 10Z`, 1, .5);
      // edificios (boceto)
      for (let k = 0; k < 5; k++) {
        const w = A.rand(20, 60), x = A.rand(a + 6, b - w - 6);
        const yb = Math.min(G.moldesY(x), G.moldesY(x + w)) - 20, h = A.rand(18, 50);
        if (yb - h > 16) line(`M${x} ${yb}h${w}v${-h}h${-w}Z`, .8, .28);
      }
      // abajo
      const ca = G.cramerY(a) + 14, cb = G.cramerY(b) + 14;
      line(`M${a} ${ca}L${b} ${cb}L${b} 690L${a} 690Z`, 1, .5);
      for (let k = 0; k < 5; k++) {
        const w = A.rand(20, 60), x = A.rand(a + 6, b - w - 6);
        const yt = Math.max(G.cramerY(x), G.cramerY(x + w)) + 22, h = A.rand(18, 50);
        if (yt + h < 684) line(`M${x} ${yt}h${w}v${h}h${-w}Z`, .8, .28);
      }
    }
    // Calles principales
    line(`M-40 ${G.moldesY(-40) - 8}L1680 ${G.moldesY(1680) - 8}`, 1.2, .8);
    line(`M-40 ${G.moldesY(-40) + 8}L1680 ${G.moldesY(1680) + 8}`, 1.2, .8);
    line(`M-40 ${G.cramerY(-40) - 8}L1680 ${G.cramerY(1680) - 8}`, 1.2, .8);
    line(`M-40 ${G.cramerY(-40) + 8}L1680 ${G.cramerY(1680) + 8}`, 1.2, .8);
    // Cruces
    G.streetsX.forEach((x, i) => {
      const w = i === 0 ? 14 : 8;
      line(`M${x - w} 10L${x - w} ${G.moldesY(x) - 8}M${x + w} 10L${x + w} ${G.moldesY(x) - 8}`, 1.1, .75);
      line(`M${x - w} ${G.cramerY(x) + 8}L${x - w} 690M${x + w} ${G.cramerY(x) + 8}L${x + w} 690`, 1.1, .75);
      if (i === 0) line(`M${x - w} ${G.moldesY(x) + 8}L${x - w} ${G.cramerY(x) - 8}M${x + w} ${G.moldesY(x) + 8}L${x + w} ${G.cramerY(x) - 8}`, 1.1, .5, { "stroke-dasharray": "4 6" });
    });
    // Vías del Mitre (3 líneas + durmientes)
    for (let k = 0; k < 3; k++) {
      line(`M-40 ${G.railY(-40) + k * 13}L1680 ${G.railY(1680) + k * 13}`, 1, .85);
      line(`M-40 ${G.railY(-40) + k * 13}L1680 ${G.railY(1680) + k * 13}`, 6, .35, { "stroke-dasharray": "1.2 7", "stroke-linecap": "butt" });
    }

    // Parque
    const park = s("g", {}, svg);
    s("path", { d: polyD(G.park), fill: A.C.publico, "fill-opacity": .09, stroke: A.C.publico, "stroke-width": 2, "stroke-opacity": .8, filter: "url(#sketch)" }, park);
    s("path", { d: polyD(G.mainPath, false), fill: "none", stroke: "#fff", "stroke-opacity": .35, "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round" }, park);
    // senderos secundarios
    [[[150,250],[300,322]], [[360,226],[420,312]], [[620,212],[660,296]], [[880,200],[900,284]], [[1140,186],[1170,258]], [[1300,272],[1320,236]]]
      .forEach(pts => s("path", { d: polyD(pts, false), fill: "none", stroke: "#fff", "stroke-opacity": .2, "stroke-width": 4, "stroke-linecap": "round" }, park));
    // Galpón y estación
    s("rect", { x: 470, y: 312, width: 110, height: 26, fill: "none", stroke: "#fff", "stroke-opacity": .7, "stroke-width": 1.2, transform: "rotate(-4 525 325)", filter: "url(#sketch)" }, park);
    s("rect", { x: 160, y: G.railY(205) + 34, width: 110, height: 16, fill: "#fff", "fill-opacity": .08, stroke: "#fff", "stroke-opacity": .8, "stroke-width": 1.2, transform: `rotate(-4 215 ${G.railY(215) + 42})` }, park);
    s("rect", { x: 160, y: G.railY(205) - 15, width: 120, height: 9, fill: "#fff", "fill-opacity": .08, stroke: "#fff", "stroke-opacity": .5, "stroke-width": 1, transform: `rotate(-4 220 ${G.railY(220) - 10})` }, park);
    // Árboles (+250 en la realidad; acá una muestra)
    let n = 0;
    for (let i = 0; i < 900 && n < 120; i++) {
      const x = A.rand(100, 1530), y = A.rand(165, 375);
      if (!inPoly(x, y, G.park)) continue;
      const nearPath = G.mainPath.some((q, j) => j && Math.abs(y - A.lerp(G.mainPath[j - 1][1], q[1], A.clamp((x - G.mainPath[j - 1][0]) / (q[0] - G.mainPath[j - 1][0])))) < 9 && x >= G.mainPath[j - 1][0] && x <= q[0]);
      if (nearPath) continue;
      s("circle", { cx: x, cy: y, r: A.rand(2.5, 6), fill: "none", stroke: A.C.publico, "stroke-opacity": .55, "stroke-width": 1 }, park);
      n++;
    }

    if (opts.labels !== false) {
      const lab = s("g", { "font-family": "JetBrains Mono, monospace", fill: "#9a9a96", "font-size": 12 }, svg);
      s("text", { x: 1560, y: G.moldesY(1560) + 4, "text-anchor": "end" }, lab, "MOLDES");
      s("text", { x: 1560, y: G.cramerY(1560) + 4, "text-anchor": "end" }, lab, "CRÁMER");
      s("text", { x: 1560, y: G.railY(1560) - 6, "text-anchor": "end", fill: "#cfcfca" }, lab, "VÍAS FFCC MITRE");
      PD.calles.forEach((c, i) => {
        const x = G.streetsX[i];
        s("text", { x: x + 4, y: 40, transform: `rotate(-90 ${x + 4} 40)`, "text-anchor": "end", "font-size": 11 }, lab, c.toUpperCase());
      });
      s("text", { x: 215, y: G.railY(215) + 70, "text-anchor": "middle", fill: "#cfcfca", "font-size": 11 }, lab, "ESTACIÓN COLEGIALES");
      s("text", { x: 525, y: 356, "text-anchor": "middle", "font-size": 10 }, lab, "GALPÓN");
    }
    return { base, park };
  };

  /* ======================================================================
     ESCENARIO PRINCIPAL DEL PARQUE
     ====================================================================== */
  const svg = document.getElementById("park-svg");
  const stage = document.getElementById("park-stage");
  const overlay = document.getElementById("park-overlay");
  const tip = document.getElementById("park-tip");

  A.drawParkBase(svg);
  const fxUnder = s("g", {}, svg);
  const peopleG = s("g", {}, svg);
  const sensorsG = s("g", {}, svg);
  const fx = s("g", {}, svg);

  /* ---------- Sensores ---------- */
  const sensorEls = PD.sensores.map(se => {
    const g = s("g", { class: "sensor", "data-tipo": se.tipo, style: "cursor:help" }, sensorsG);
    if (se.tipo === "camara") {
      const a = (se.dir || 0) * Math.PI / 180;
      s("path", { d: `M${se.x} ${se.y}L${se.x + Math.cos(a - .45) * 70} ${se.y + Math.sin(a - .45) * 70}A70 70 0 0 1 ${se.x + Math.cos(a + .45) * 70} ${se.y + Math.sin(a + .45) * 70}Z`, fill: A.C.acento, "fill-opacity": .07, class: "cone" }, g);
      s("path", { d: A.shape("triangulo", se.x, se.y, 7), fill: A.C.acento }, g);
    } else if (se.tipo === "sonido") {
      s("circle", { cx: se.x, cy: se.y, r: 6, fill: "none", stroke: A.C.ciudadanos, "stroke-width": 2 }, g);
      s("circle", { cx: se.x, cy: se.y, r: 2, fill: A.C.ciudadanos }, g);
    } else {
      s("path", { d: A.shape("cuadrado", se.x, se.y, 6), fill: "none", stroke: A.C.privado, "stroke-width": 2 }, g);
      s("circle", { cx: se.x, cy: se.y, r: 2, fill: A.C.privado, class: "blink" }, g);
    }
    g.addEventListener("pointermove", ev => {
      const nombre = { camara: "Cámara de seguridad", sonido: "Sensor de sonido", movimiento: "Sensor de movimiento" }[se.tipo];
      const val = se.tipo === "sonido" ? `${Math.round(A.park.noiseAt(se.x, se.y))} dB` : se.tipo === "camara" ? `${A.park.countNear(se.x, se.y, 90)} personas en cuadro` : `${A.park.countNear(se.x, se.y, 60)} movimientos / min`;
      A.showTip(tip, `<b>${se.id} · ${nombre}</b><span class="mono">lectura en vivo (simulada)</span><br>${val}`, ev, stage);
    });
    g.addEventListener("pointerleave", () => A.hideTip(tip));
    return { se, g };
  });

  /* ---------- Personas (simulación en tiempo real) ---------- */
  const PP = A.D.capas.personas;
  const pick = (dist) => { let r = Math.random() * 100; for (const k in dist) { r -= dist[k]; if (r <= 0) return k; } return Object.keys(dist)[0]; };
  const pathLen = []; let total = 0;
  for (let i = 1; i < G.mainPath.length; i++) { const l = Math.hypot(G.mainPath[i][0] - G.mainPath[i - 1][0], G.mainPath[i][1] - G.mainPath[i - 1][1]); pathLen.push(l); total += l; }
  function along(t) {
    let d = t * total;
    for (let i = 0; i < pathLen.length; i++) {
      if (d <= pathLen[i]) { const a = G.mainPath[i], b = G.mainPath[i + 1], k = d / pathLen[i]; return [A.lerp(a[0], b[0], k), A.lerp(a[1], b[1], k)]; }
      d -= pathLen[i];
    }
    return G.mainPath[G.mainPath.length - 1];
  }
  const spots = PD.zonas.filter(z => A.inPark(z.x, z.y));
  const people = [];
  function spawn() {
    const walker = Math.random() < .65;
    const p = {
      walker, t: Math.random(), v: (Math.random() < .5 ? -1 : 1) * A.rand(.008, .02), off: A.rand(-14, 14),
      zone: spots[Math.floor(Math.random() * spots.length)], ang: Math.random() * 6.28, rad: A.rand(4, 36),
      edad: pick(PP.edad), genero: pick(PP.genero), mascota: pick(PP.mascota) === "Con mascota",
      alpha: 0, dying: false, x: 0, y: 0
    };
    p.el = s("circle", { r: p.edad.startsWith("Niñez") ? 3 : 4.2, fill: "#f5f5f0" }, peopleG);
    if (p.mascota) p.dog = s("rect", { width: 5, height: 5, fill: "#f5f5f0", opacity: .8 }, peopleG);
    people.push(p);
  }
  let target = 0;
  const crowd = {
    colorFn: null,
    set(n) { target = Math.round(n); },
    get count() { return people.filter(p => !p.dying).length; }
  };
  A.loop((dt) => {
    const alive = people.filter(p => !p.dying);
    if (alive.length < target) for (let i = 0; i < Math.min(3, target - alive.length); i++) spawn();
    else if (alive.length > target) alive.slice(0, Math.min(3, alive.length - target)).forEach(p => p.dying = true);
    for (let i = people.length - 1; i >= 0; i--) {
      const p = people[i];
      p.alpha = A.clamp(p.alpha + (p.dying ? -dt * 2 : dt * 1.5));
      if (p.dying && p.alpha <= 0) { p.el.remove(); p.dog && p.dog.remove(); people.splice(i, 1); continue; }
      if (p.walker) {
        p.t += p.v * dt * (A.reduced ? .2 : 1);
        if (p.t > 1 || p.t < 0) { p.v *= -1; p.t = A.clamp(p.t); }
        const [x, y] = along(p.t); p.x = x; p.y = y + p.off;
      } else {
        p.ang += dt * .15;
        p.x = p.zone.x + Math.cos(p.ang) * p.rad * .3 + Math.cos(p.ang * 3) * 2;
        p.y = p.zone.y + Math.sin(p.ang) * p.rad * .2;
      }
      p.el.setAttribute("cx", p.x.toFixed(1)); p.el.setAttribute("cy", p.y.toFixed(1));
      p.el.setAttribute("opacity", (p.alpha * .9).toFixed(2));
      const col = crowd.colorFn ? crowd.colorFn(p) : "#f5f5f0";
      p.el.setAttribute("fill", col);
      if (p.dog) { p.dog.setAttribute("x", (p.x + 6).toFixed(1)); p.dog.setAttribute("y", (p.y + 2).toFixed(1)); p.dog.setAttribute("opacity", (p.alpha * .8).toFixed(2)); p.dog.setAttribute("fill", crowd.colorFn ? crowd.colorFn(p, true) : "#f5f5f0"); }
    }
  });

  /* ---------- Ruido (modelo simple) ---------- */
  function noiseAt(x, y) {
    let e = Math.pow(10, 38 / 10);
    A.D.capas.ruido.fuentes.forEach(f => { const d = Math.max(20, Math.hypot(x - f.x, y - f.y)); e += Math.pow(10, (f.db - 20 * Math.log10(d / 20)) / 10); });
    return 10 * Math.log10(e);
  }

  /* ---------- Hora actual / flujo ---------- */
  const now = () => new Date();
  const isWeekend = () => [0, 6].includes(now().getDay());
  const liveFlow = () => (isWeekend() ? A.D.capas.transito.finde : A.D.capas.transito.semana)[now().getHours()];

  /* ---------- HUD "en vivo" ---------- */
  const $ = id => document.getElementById(id);
  setInterval(() => {
    const d = now();
    $("live-clock").textContent = d.toLocaleTimeString("es-AR", { hour12: false });
    $("live-people").textContent = crowd.count;
    $("live-db").textContent = Math.round(noiseAt(700, 290) + A.rand(-2, 2));
    $("live-sensors").textContent = (A.citySensors || 0) + PD.sensores.length;
  }, 1000);

  A.park = {
    svg, stage, overlay, tip, fx, fxUnder, peopleG, sensorsG, sensorEls, crowd, people,
    noiseAt, liveFlow, isWeekend,
    countNear(x, y, r) { return people.filter(p => !p.dying && Math.hypot(p.x - x, p.y - y) < r).length; },
    resetCrowd() { crowd.colorFn = null; crowd.set(liveFlow()); }
  };
  A.park.resetCrowd();
})(window.ATLAS);
