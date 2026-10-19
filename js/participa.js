/* =========================================================================
   ATLAS · PARTICIPÁ
   La persona elige un tipo de aporte, toca el plano y deja su marca.
   (Se guarda en el navegador. Ver README para compartirlo con todos.)
   ========================================================================= */
(function (A) {
  const svg = document.getElementById("pin-svg");
  const typesEl = document.getElementById("pin-types");
  const input = document.getElementById("pin-text");
  const countEl = document.getElementById("pin-count");
  const s = A.s;

  const TYPES = [
    { id: "problema", nombre: "Problema", forma: "triangulo", color: A.C.alerta },
    { id: "idea",     nombre: "Idea",     forma: "circulo",   color: A.C.publico },
    { id: "uso",      nombre: "Uso",      forma: "cuadrado",  color: A.C.ciudadanos },
    { id: "pedido",   nombre: "Pedido",   forma: "hexagono",  color: A.C.acento }
  ];
  let type = TYPES[0];

  TYPES.forEach((t, i) => {
    const b = A.h("button", { class: i ? "" : "on", style: `--c:${t.color}`, role: "radio", "aria-checked": i ? "false" : "true" }, typesEl, A.icon(t.forma, t.color) + t.nombre);
    b.onclick = () => { type = t; typesEl.querySelectorAll("button").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); }); };
  });

  A.drawParkBase(svg);
  const pinsG = s("g", {}, svg);
  const hintG = s("text", { x: 800, y: 620, "text-anchor": "middle", fill: "#f8e544", "font-size": 18, "font-family": "JetBrains Mono" }, svg, "tocá el plano para dejar tu aporte");

  function render() {
    A.clear(pinsG);
    const pins = A.store.get("pins", []);
    pins.forEach(p => {
      const t = TYPES.find(x => x.id === p.tipo) || TYPES[0];
      const g = s("g", {}, pinsG);
      s("line", { x1: p.x, y1: p.y, x2: p.x, y2: p.y - 26, stroke: t.color, "stroke-width": 2 }, g);
      s("path", { d: A.shape(t.forma, p.x, p.y - 34, 11), fill: t.color, stroke: "#111", "stroke-width": 2 }, g);
      s("circle", { cx: p.x, cy: p.y, r: 3, fill: t.color }, g);
      s("title", {}, g, `${t.nombre}: ${p.texto}`);
      if (p.texto) s("text", { x: p.x + 16, y: p.y - 30, fill: "#fff", "font-size": 13, "font-family": "Inter Tight" }, g, p.texto.length > 30 ? p.texto.slice(0, 28) + "…" : p.texto);
    });
    countEl.textContent = pins.length ? `${pins.length} aporte${pins.length > 1 ? "s" : ""} tuyo${pins.length > 1 ? "s" : ""} en el mapa.` : "";
    hintG.setAttribute("opacity", pins.length ? 0 : 1);
  }

  svg.addEventListener("click", ev => {
    const p = A.svgPoint(svg, ev);
    const pins = A.store.get("pins", []);
    pins.push({ x: Math.round(p.x), y: Math.round(p.y), tipo: type.id, texto: input.value.trim() || type.nombre, fecha: new Date().toISOString() });
    A.store.set("pins", pins);
    input.value = "";
    render();
    // >>> Para compartirlo con toda la comunidad, mandá el aporte a tu backend acá:
    // fetch("https://TU-API/aportes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pins[pins.length - 1]) });
  });

  render();
})(window.ATLAS);
