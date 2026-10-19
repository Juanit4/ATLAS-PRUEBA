/* =========================================================================
   ATLAS · INTRO
   Conflictos + Necesidades + Recursos se acercan con el scroll.
   Su intersección (triángulo de Reuleaux) es el símbolo de ATLAS.
   ========================================================================= */
(function (A) {
  const sec = document.getElementById("intro");
  const svg = document.getElementById("intro-svg");
  const copy = document.getElementById("intro-copy");
  const hint = document.getElementById("scroll-hint");
  const s = A.s;

  const CX = 500, CY = 270, R = 120, D = 125, RR = D / Math.sqrt(3);
  const C = [
    { label: "CONFLICTOS",  color: A.C.conflictos,  from: [500, 120], to: [CX, CY - RR] },
    { label: "NECESIDADES", color: A.C.necesidades, from: [300, 430], to: [CX - D / 2, CY + RR / 2] },
    { label: "RECURSOS",    color: A.C.recursos,    from: [700, 430], to: [CX + D / 2, CY + RR / 2] }
  ];

  const defs = s("defs", {}, svg);
  const clips = C.map((c, i) => s("circle", {}, s("clipPath", { id: "icp" + i }, defs)));
  const circles = C.map(c => s("circle", { fill: c.color, "fill-opacity": .92 }, svg));
  // Intersección: un círculo blanco recortado por los otros dos
  const wrap = s("g", {}, svg);
  const g1 = s("g", { "clip-path": "url(#icp1)" }, wrap);
  const g2 = s("g", { "clip-path": "url(#icp2)" }, g1);
  const white = s("circle", { fill: "#fff" }, g2);
  const labels = C.map(c => s("text", {
    "text-anchor": "middle", "dominant-baseline": "middle", fill: "#fff",
    "font-family": "Inter Tight, sans-serif", "font-weight": 700, "font-size": 17, "letter-spacing": 1
  }, svg, c.label));
  // Satélites: puntitos que representan información dispersa
  const dots = [];
  for (let i = 0; i < 46; i++) {
    const col = [A.C.ciudadanos, A.C.publico, A.C.privado][i % 3];
    const a = Math.random() * Math.PI * 2, d = A.rand(180, 420);
    dots.push({
      el: s("circle", { r: A.rand(3, 11), fill: col, opacity: .8 }, svg),
      x: CX + Math.cos(a) * d * 1.3, y: CY + Math.sin(a) * d * .7
    });
  }

  function render(p) {
    const grow = A.ease(A.seg(p, 0, .25));
    const mv = A.ease(A.seg(p, .18, .5));
    const fade = A.seg(p, .5, .7);
    const shrink = A.ease(A.seg(p, .58, .85));
    const r = A.lerp(70, R, grow);

    C.forEach((c, i) => {
      const x = A.lerp(c.from[0], c.to[0], mv), y = A.lerp(c.from[1], c.to[1], mv);
      [circles[i], clips[i]].forEach(e => { e.setAttribute("cx", x); e.setAttribute("cy", y); e.setAttribute("r", r); });
      circles[i].setAttribute("opacity", 1 - fade);
      labels[i].setAttribute("x", x); labels[i].setAttribute("y", y);
      labels[i].setAttribute("opacity", 1 - A.seg(p, .2, .34));
    });
    white.setAttribute("cx", clips[0].getAttribute("cx"));
    white.setAttribute("cy", clips[0].getAttribute("cy"));
    white.setAttribute("r", r);

    // El símbolo sube y se achica para dejar lugar al logotipo
    const k = A.lerp(1, .55, shrink), ty = A.lerp(0, -95, shrink);
    wrap.setAttribute("transform", `translate(${CX} ${CY + ty}) scale(${k}) translate(${-CX} ${-CY})`);

    // Información dispersa: se acerca y desaparece dentro del cruce
    const pull = A.ease(A.seg(p, .05, .5));
    dots.forEach(d => {
      d.el.setAttribute("cx", A.lerp(d.x, CX, pull));
      d.el.setAttribute("cy", A.lerp(d.y, CY, pull));
      d.el.setAttribute("opacity", .8 * (1 - A.seg(p, .35, .5)));
    });

    const c = A.seg(p, .7, .9);
    copy.style.opacity = c;
    copy.style.transform = `translateY(${(1 - c) * 20}px)`;
    hint.style.opacity = p > .03 ? 0 : 1;
  }

  A.intro = { update() { render(A.progress(sec)); } };
  render(0);
})(window.ATLAS);
