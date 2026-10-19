/* =========================================================================
   ATLAS · utilidades compartidas (namespace global window.ATLAS)
   ========================================================================= */
window.ATLAS = window.ATLAS || {};

(function (A) {
  const NS = "http://www.w3.org/2000/svg";
  A.D = window.ATLAS_DATA;
  A.C = A.D.colores;

  /* Crear elementos SVG / HTML */
  A.s = function (tag, attrs, parent, text) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  A.h = function (tag, attrs, parent, html) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "style") e.style.cssText = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };
  A.clear = (el) => { while (el && el.firstChild) el.removeChild(el.firstChild); };

  /* Matemática */
  A.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  A.lerp = (a, b, t) => a + (b - a) * t;
  A.seg = (t, a, b) => A.clamp((t - a) / (b - a));           // sub-progreso
  A.ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  A.rand = (a, b) => a + Math.random() * (b - a);
  A.fmt = (n) => Math.round(n).toLocaleString("es-AR");

  /* Progreso de scroll de una sección "scrolly" (0 → 1) */
  A.progress = function (section) {
    const r = section.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    return total <= 0 ? 0 : A.clamp(-r.top / total);
  };

  /* Etiquetas de dato real / ejemplo */
  A.tag = (real) => real ? '<span class="tag real">real</span>' : '<span class="tag ej">ejemplo</span>';
  A.src = (d) => d && d.fuente
    ? `<div class="src">Fuente: ${d.url ? `<a href="${d.url}" target="_blank" rel="noopener">${d.fuente}</a>` : d.fuente}</div>` : "";

  /* Guardado local (aportes de la persona) */
  A.store = {
    get(k, d) { try { const v = localStorage.getItem("atlas:" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("atlas:" + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* Figuras geométricas → atributo "d" de un path centrado en (cx, cy) */
  A.shape = function (forma, cx, cy, r) {
    const poly = (n, rot) => {
      let d = "";
      for (let i = 0; i < n; i++) {
        const a = rot + (i * 2 * Math.PI) / n;
        d += (i ? "L" : "M") + (cx + r * Math.cos(a)).toFixed(2) + " " + (cy + r * Math.sin(a)).toFixed(2);
      }
      return d + "Z";
    };
    switch (forma) {
      case "triangulo": return poly(3, -Math.PI / 2);
      case "cuadrado":  return poly(4, -Math.PI / 4);
      case "rombo":     return poly(4, -Math.PI / 2);
      case "hexagono":  return poly(6, 0);
      case "pentagono": return poly(5, -Math.PI / 2);
      case "reuleaux": {
        const p = [0, 1, 2].map(i => {
          const a = -Math.PI / 2 + i * 2 * Math.PI / 3;
          return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
        });
        const s = (r * Math.sqrt(3)).toFixed(2);
        const f = (q) => q[0].toFixed(2) + " " + q[1].toFixed(2);
        return `M${f(p[0])}A${s} ${s} 0 0 1 ${f(p[1])}A${s} ${s} 0 0 1 ${f(p[2])}A${s} ${s} 0 0 1 ${f(p[0])}Z`;
      }
      default: // círculo
        return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
    }
  };

  /* Ícono SVG pequeño de una figura (para botones) */
  A.icon = function (forma, color, filled = true) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${A.shape(forma, 12, 12.5, 9)}" fill="${filled ? color : "none"}" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
  };

  /* Coordenadas del puntero dentro de un SVG */
  A.svgPoint = function (svg, evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
  };

  /* Posicionar tooltip dentro de un contenedor */
  A.showTip = function (tip, html, evt, container) {
    tip.innerHTML = html;
    tip.classList.add("on");
    const box = container.getBoundingClientRect();
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = evt.clientX - box.left + 16, y = evt.clientY - box.top + 16;
    if (x + w > box.width - 10) x = evt.clientX - box.left - w - 16;
    if (y + h > box.height - 10) y = evt.clientY - box.top - h - 16;
    tip.style.left = Math.max(10, x) + "px";
    tip.style.top = Math.max(10, y) + "px";
  };
  A.hideTip = (tip) => { tip.classList.remove("on", "pinned"); };

  /* Bucle de animación compartido */
  const loops = new Set();
  A.loop = (fn) => { loops.add(fn); return () => loops.delete(fn); };
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    loops.forEach(fn => fn(dt, now));
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  A.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
})(window.ATLAS);
