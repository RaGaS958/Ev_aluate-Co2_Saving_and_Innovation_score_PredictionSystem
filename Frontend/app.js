/* ═══════════════════════════════════════════════════════════════
   EV_aluate — Main Application Script
   Three.js | GSAP | Chart.js | FastAPI Client
═══════════════════════════════════════════════════════════════ */

"use strict";

const API_BASE = "https://ev-aluate-co2-saving-and-innovation.onrender.com";

/* ─────────────────────────────────────────────────────────────
   TOAST SYSTEM
───────────────────────────────────────────────────────────── */
const Toast = {
  icons: { success:"fa-circle-check", error:"fa-circle-xmark", info:"fa-circle-info", warning:"fa-triangle-exclamation" },

  show(type, title, msg, dur = 4000) {
    const container = document.getElementById("toast-container");
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.innerHTML = `
      <i class="fa-solid ${this.icons[type]} toast-icon"></i>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${msg}</div>
      </div>`;
    container.appendChild(t);
    requestAnimationFrame(() => { requestAnimationFrame(() => t.classList.add("show")); });
    setTimeout(() => { t.classList.replace("show","hide"); setTimeout(() => t.remove(), 400); }, dur);
  },

  success: (t,m,d)=>Toast.show("success",t,m,d),
  error:   (t,m,d)=>Toast.show("error",t,m,d),
  info:    (t,m,d)=>Toast.show("info",t,m,d),
  warning: (t,m,d)=>Toast.show("warning",t,m,d),
};

/* ─────────────────────────────────────────────────────────────
   API CLIENT
───────────────────────────────────────────────────────────── */
const API = {
  async get(path) {
    const r = await fetch(API_BASE + path);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(err.detail || `HTTP ${r.status}`);
    }
    return r.json();
  }
};

/* ─────────────────────────────────────────────────────────────
   CHART MANAGER
───────────────────────────────────────────────────────────── */
const ChartManager = {
  _charts: {},

  destroy(id) {
    if (this._charts[id]) { this._charts[id].destroy(); delete this._charts[id]; }
  },

  // ── Colour palettes ──────────────────────────────────────
  colors: {
    cyan:   "#00d4ff", green: "#00ff88", violet: "#7c3aed",
    amber:  "#f59e0b", red:   "#ef4444", pink:   "#ec4899",
    cyanA:  "rgba(0,212,255,0.2)", greenA: "rgba(0,255,136,0.2)",
    violetA:"rgba(124,58,237,0.2)",
  },

  defaults() {
    return {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { labels: { color: "#8fa3be", font: { family: "Rajdhani", weight: "600", size: 12 } } } },
    };
  },

  // ── Feature Importance (Home) ─────────────────────────────
  homeFeature(data) {
    this.destroy("homeFeatureChart");
    const ctx = document.getElementById("homeFeatureChart");
    if (!ctx) return;
    this._charts["homeFeatureChart"] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.feature_importance.features,
        datasets: [
          { label: "CO₂ Model", data: data.feature_importance.co2_model,
            backgroundColor: "rgba(0,255,136,0.7)", borderColor: "#00ff88", borderWidth: 2, borderRadius: 6 },
          { label: "Innovation Model", data: data.feature_importance.innovation_model,
            backgroundColor: "rgba(124,58,237,0.7)", borderColor: "#7c3aed", borderWidth: 2, borderRadius: 6 },
        ]
      },
      options: {
        ...this.defaults(),
        scales: {
          x: { grid: { color:"rgba(255,255,255,0.04)" }, ticks: { color:"#8fa3be", font:{family:"Rajdhani",weight:"600"} } },
          y: { grid: { color:"rgba(255,255,255,0.04)" }, ticks: { color:"#8fa3be", font:{family:"Rajdhani"} }, min: 0, max: 110 },
        },
        plugins: {
          legend: { position:"top", labels:{color:"#8fa3be",font:{family:"Rajdhani",weight:"600",size:12}} },
          tooltip: {
            backgroundColor:"rgba(5,10,20,0.95)",
            titleColor:"#00d4ff", bodyColor:"#e2eaf5",
            borderColor:"rgba(0,212,255,0.3)", borderWidth:1,
            callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}/100` }
          }
        },
      }
    });
  },

  // ── Radar (Analytics) ────────────────────────────────────
  radar(data) {
    this.destroy("radarChart");
    const ctx = document.getElementById("radarChart");
    if (!ctx) return;
    const r = data.model_radar;
    this._charts["radarChart"] = new Chart(ctx, {
      type: "radar",
      data: {
        labels: r.categories,
        datasets: [
          { label:"CO₂ Model", data:r.co2_values, fill:true,
            backgroundColor:"rgba(0,255,136,0.15)", borderColor:"#00ff88",
            pointBackgroundColor:"#00ff88", pointBorderColor:"#050a14", pointRadius:5, borderWidth:2 },
          { label:"Innovation Model", data:r.innovation_values, fill:true,
            backgroundColor:"rgba(124,58,237,0.15)", borderColor:"#7c3aed",
            pointBackgroundColor:"#7c3aed", pointBorderColor:"#050a14", pointRadius:5, borderWidth:2 },
        ]
      },
      options: {
        ...this.defaults(),
        scales: {
          r: {
            min:90, max:100, ticks:{ stepSize:2.5, color:"#4a6180", font:{family:"Space Mono",size:9}, backdropColor:"transparent" },
            grid:{ color:"rgba(255,255,255,0.06)" },
            angleLines:{ color:"rgba(255,255,255,0.08)" },
            pointLabels:{ color:"#8fa3be", font:{family:"Orbitron",size:11,weight:"700"} }
          }
        },
        plugins: {
          legend:{ position:"bottom", labels:{color:"#8fa3be",font:{family:"Rajdhani",weight:"600",size:12}} },
          tooltip:{ backgroundColor:"rgba(5,10,20,0.95)", titleColor:"#00d4ff", bodyColor:"#e2eaf5", borderColor:"rgba(0,212,255,0.3)", borderWidth:1 }
        }
      }
    });
  },

  // ── Feature Importance (Analytics) ───────────────────────
  featureImportance(data) {
    this.destroy("featureImportanceChart");
    const ctx = document.getElementById("featureImportanceChart");
    if (!ctx) return;
    const fi = data.feature_importance || {
      features: ["Range","Battery","Top Speed","Fast Charge","Price"],
      co2_model: [100,88,74,71,45],
      innovation_model: [79,85,90,84,47]
    };
    this._charts["featureImportanceChart"] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: fi.features,
        datasets: [
          { label:"CO₂ Model",        data: fi.co2_model,        backgroundColor:"rgba(0,255,136,0.7)",  borderColor:"#00ff88", borderWidth:2, borderRadius:5, borderSkipped:false },
          { label:"Innovation Model",  data: fi.innovation_model, backgroundColor:"rgba(124,58,237,0.7)", borderColor:"#7c3aed", borderWidth:2, borderRadius:5, borderSkipped:false },
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid:{color:"rgba(255,255,255,0.04)"}, ticks:{color:"#8fa3be",font:{family:"Rajdhani",size:11}}, min:0, max:110 },
          y: { grid:{color:"rgba(255,255,255,0.04)"}, ticks:{color:"#e2eaf5",font:{family:"Rajdhani",weight:"700",size:12}}, afterFit(scaleInstance){ scaleInstance.width = 96; } },
        },
        plugins: {
          legend: { position:"top", labels:{color:"#8fa3be",font:{family:"Rajdhani",weight:"600",size:12},boxWidth:12,padding:14} },
          tooltip: { backgroundColor:"rgba(5,10,20,0.95)", titleColor:"#00d4ff", bodyColor:"#e2eaf5", borderColor:"rgba(0,212,255,0.3)", borderWidth:1 },
        }
      }
    });
  },

  // ── Heatmap ───────────────────────────────────────────────
  _heatmapData: null,

  heatmap(data) {
    this._heatmapData = data;
    this._drawHeatmap();

    // ResizeObserver: re-draw when card width changes
    const wrap = document.getElementById("heatmapWrap");
    if (wrap && !this._heatmapObs) {
      this._heatmapObs = new ResizeObserver(() => this._drawHeatmap());
      this._heatmapObs.observe(wrap);
    }
  },

  _drawHeatmap() {
    const data   = this._heatmapData;
    const canvas = document.getElementById("heatmapChart");
    if (!canvas || !data) return;

    const cm      = data.correlation_matrix;
    const rows    = ["CO₂ Savings", "Range Factor", "Innovation Score"];
    const rowData = [cm.co2_savings, cm.range_factor, cm.innovation_score];
    const cols    = cm.features;

    // Size canvas to wrapper
    const wrap = canvas.parentElement;
    const W    = wrap.clientWidth  || 400;
    const isSm = W < 340;
    const isMd = W < 520;

    // Dynamic label widths based on available space
    const labelW  = isSm ? 72 : isMd ? 90 : 118;
    const padTop  = isSm ? 36 : 44;
    const padBot  = 8;
    const nRows   = rows.length;
    const nCols   = cols.length;
    const gridW   = W - labelW - 8;
    const cellW   = gridW / nCols;
    const cellH   = isSm ? 38 : 46;
    const H       = padTop + nRows * cellH + padBot;

    canvas.width  = W;
    canvas.height = H;

    const ctx2 = canvas.getContext("2d");
    ctx2.clearRect(0, 0, W, H);

    // Colour: negative = red, zero = mid, positive = cyan
    function getColor(v) {
      const t = (v + 1) / 2;
      const r = Math.round(239 + (0   - 239) * t);
      const g = Math.round(68  + (212 - 68)  * t);
      const b = Math.round(68  + (255 - 68)  * t);
      return `rgba(${r},${g},${b},${0.25 + Math.abs(v) * 0.55})`;
    }

    // Column headers
    const colFontSize = isSm ? 8 : isMd ? 9 : 10;
    ctx2.fillStyle    = "#8fa3be";
    ctx2.font         = `600 ${colFontSize}px Rajdhani`;
    ctx2.textAlign    = "center";
    ctx2.textBaseline = "bottom";
    cols.forEach((col, ci) => {
      const cx = labelW + ci * cellW + cellW / 2;
      // Truncate if too narrow
      const maxChars = Math.floor(cellW / (colFontSize * 0.55));
      const label    = col.length > maxChars ? col.slice(0, maxChars - 1) + "…" : col;
      ctx2.fillText(label, cx, padTop - 6);
    });

    // Row labels + cells
    const rowFontSize = isSm ? 8 : isMd ? 10 : 11;
    rows.forEach((row, ri) => {
      const cy = padTop + ri * cellH;

      // Row label
      ctx2.fillStyle    = "#8fa3be";
      ctx2.font         = `600 ${rowFontSize}px Rajdhani`;
      ctx2.textAlign    = "right";
      ctx2.textBaseline = "middle";
      const maxLabelChars = Math.floor((labelW - 8) / (rowFontSize * 0.55));
      const rowLabel      = row.length > maxLabelChars ? row.slice(0, maxLabelChars - 1) + "…" : row;
      ctx2.fillText(rowLabel, labelW - 8, cy + cellH / 2);

      cols.forEach((_, ci) => {
        const val  = rowData[ri][ci];
        const cx   = labelW + ci * cellW;

        // Cell fill
        ctx2.fillStyle = getColor(val);
        ctx2.beginPath();
        if (ctx2.roundRect) {
          ctx2.roundRect(cx + 2, cy + 2, cellW - 4, cellH - 4, 5);
        } else {
          ctx2.rect(cx + 2, cy + 2, cellW - 4, cellH - 4);
        }
        ctx2.fill();

        // Cell border glow
        ctx2.strokeStyle = val > 0 ? "rgba(0,212,255,0.18)" : "rgba(239,68,68,0.18)";
        ctx2.lineWidth   = 1;
        ctx2.stroke();

        // Value text — hide if cell too narrow
        if (cellW > 30) {
          const valFontSize = isSm ? 8 : isMd ? 10 : 12;
          ctx2.fillStyle    = Math.abs(val) > 0.5 ? "#ffffff" : "#e2eaf5";
          ctx2.font         = `700 ${valFontSize}px 'Space Mono', monospace`;
          ctx2.textAlign    = "center";
          ctx2.textBaseline = "middle";
          ctx2.fillText(val.toFixed(2), cx + cellW / 2, cy + cellH / 2);
        }
      });
    });

    // Colour scale legend bar
    const barX = labelW, barY = H - 6, barH = 4, barW = gridW;
    const grad = ctx2.createLinearGradient(barX, barY, barX + barW, barY);
    grad.addColorStop(0,   "rgba(239,68,68,0.8)");
    grad.addColorStop(0.5, "rgba(100,100,100,0.4)");
    grad.addColorStop(1,   "rgba(0,212,255,0.8)");
    ctx2.fillStyle = grad;
    if (ctx2.roundRect) {
      ctx2.beginPath();
      ctx2.roundRect(barX, barY, barW, barH, 2);
      ctx2.fill();
    } else {
      ctx2.fillRect(barX, barY, barW, barH);
    }
  },

  // ── Convergence (Analytics) ───────────────────────────────
  convergence(data) {
    this.destroy("convergenceChart");
    const ctx = document.getElementById("convergenceChart");
    if (!ctx) return;
    const c = data.training_convergence;
    this._charts["convergenceChart"] = new Chart(ctx, {
      type:"line",
      data:{
        labels: c.iterations,
        datasets:[
          { label:"CO₂ Model (XGBoost)", data:c.co2_scores, borderColor:"#00ff88",
            backgroundColor:"rgba(0,255,136,0.08)", fill:true, tension:0.4, borderWidth:2.5, pointRadius:0 },
          { label:"Innovation Model (Linear)", data:c.innovation_scores, borderColor:"#7c3aed",
            backgroundColor:"rgba(124,58,237,0.08)", fill:true, tension:0.4, borderWidth:2.5, pointRadius:0 },
        ]
      },
      options:{
        ...this.defaults(),
        scales:{
          x:{ grid:{color:"rgba(255,255,255,0.04)"}, ticks:{color:"#8fa3be",font:{family:"Rajdhani"}}, title:{display:true,text:"Training Iterations",color:"#4a6180",font:{family:"Orbitron",size:10}} },
          y:{ grid:{color:"rgba(255,255,255,0.04)"}, ticks:{color:"#8fa3be",font:{family:"Space Mono",size:10}}, min:0.83, max:1.01, title:{display:true,text:"R² Score",color:"#4a6180",font:{family:"Orbitron",size:10}} },
        },
        plugins:{
          legend:{position:"top",labels:{color:"#8fa3be",font:{family:"Rajdhani",weight:"600",size:12}}},
          tooltip:{mode:"index",intersect:false,backgroundColor:"rgba(5,10,20,0.95)",titleColor:"#00d4ff",bodyColor:"#e2eaf5",borderColor:"rgba(0,212,255,0.3)",borderWidth:1},
        },
        interaction:{mode:"index",intersect:false}
      }
    });
  },

  // ── EV Segments Bar ───────────────────────────────────────
  segments(data) {
    this.destroy("segmentsChart");
    const ctx = document.getElementById("segmentsChart");
    if (!ctx) return;
    const s = data.ev_segments;
    this._charts["segmentsChart"] = new Chart(ctx, {
      type:"bar",
      data:{
        labels: s.labels,
        datasets:[
          { label:"Avg CO₂ Savings (kg)", data:s.co2_avg, backgroundColor:"rgba(0,255,136,0.7)", borderColor:"#00ff88", borderWidth:2, borderRadius:6, yAxisID:"y" },
          { label:"Avg Innovation Score", data:s.innovation_avg.map(v=>v*50), backgroundColor:"rgba(124,58,237,0.7)", borderColor:"#7c3aed", borderWidth:2, borderRadius:6, yAxisID:"y" },
        ]
      },
      options:{
        ...this.defaults(),
        scales:{
          x:{ grid:{color:"rgba(255,255,255,0.04)"}, ticks:{color:"#8fa3be",font:{family:"Rajdhani",weight:"600"}} },
          y:{ grid:{color:"rgba(255,255,255,0.04)"}, ticks:{color:"#8fa3be",font:{family:"Rajdhani"}}, title:{display:true,text:"Score",color:"#4a6180",font:{family:"Orbitron",size:10}} },
        },
        plugins:{
          legend:{position:"top",labels:{color:"#8fa3be",font:{family:"Rajdhani",weight:"600",size:12}}},
          tooltip:{backgroundColor:"rgba(5,10,20,0.95)",titleColor:"#00d4ff",bodyColor:"#e2eaf5",borderColor:"rgba(0,212,255,0.3)",borderWidth:1},
        }
      }
    });
  },

  // ── Doughnut (Distribution) ───────────────────────────────
  distribution(data) {
    this.destroy("distributionChart");
    const ctx = document.getElementById("distributionChart");
    if (!ctx) return;
    const s = data.ev_segments;
    this._charts["distributionChart"] = new Chart(ctx, {
      type:"doughnut",
      data:{
        labels: s.labels,
        datasets:[{ data:s.count,
          backgroundColor:["rgba(0,212,255,0.7)","rgba(0,255,136,0.7)","rgba(124,58,237,0.7)","rgba(245,158,11,0.7)","rgba(239,68,68,0.7)"],
          borderColor:["#00d4ff","#00ff88","#7c3aed","#f59e0b","#ef4444"],
          borderWidth:2, hoverOffset:8 }]
      },
      options:{
        ...this.defaults(),
        cutout:"65%",
        plugins:{
          legend:{position:"right",labels:{color:"#8fa3be",font:{family:"Rajdhani",weight:"600",size:12},padding:14}},
          tooltip:{backgroundColor:"rgba(5,10,20,0.95)",titleColor:"#00d4ff",bodyColor:"#e2eaf5",borderColor:"rgba(0,212,255,0.3)",borderWidth:1,
            callbacks:{ label: ctx=>`  ${ctx.label}: ${ctx.raw} EVs` }},
        }
      }
    });
  },

  // ── Scatter (Predict Results) ─────────────────────────────
  scatter(prediction) {
    this.destroy("scatterChart");
    const ctx = document.getElementById("scatterChart");
    if (!ctx) return;
    const pts = prediction.context_innovation.map((x,i) => ({ x, y:prediction.context_co2[i] }));
    this._charts["scatterChart"] = new Chart(ctx, {
      type:"scatter",
      data:{
        datasets:[
          { label:"Market EVs", data:pts, backgroundColor:"rgba(147,51,234,0.5)", borderColor:"#9333ea", borderWidth:1, pointRadius:5, pointHoverRadius:7 },
          { label:"Your Vehicle", data:[{x:prediction.innovation_score, y:prediction.co2_savings}],
            backgroundColor:"rgba(239,68,68,0.9)", borderColor:"#ef4444", borderWidth:2, pointRadius:10, pointStyle:"star", pointHoverRadius:14 },
        ]
      },
      options:{
        ...this.defaults(),
        scales:{
          x:{grid:{color:"rgba(255,255,255,0.04)"}, ticks:{color:"#8fa3be",font:{family:"Rajdhani"}}, min:0, max:1, title:{display:true,text:"Innovation Score (0-1)",color:"#4a6180",font:{family:"Orbitron",size:10}}},
          y:{grid:{color:"rgba(255,255,255,0.04)"}, ticks:{color:"#8fa3be",font:{family:"Rajdhani"}}, title:{display:true,text:"CO₂ Savings (kg)",color:"#4a6180",font:{family:"Orbitron",size:10}}},
        },
        plugins:{
          legend:{position:"top",labels:{color:"#8fa3be",font:{family:"Rajdhani",weight:"600",size:12}}},
          tooltip:{backgroundColor:"rgba(5,10,20,0.95)",titleColor:"#00d4ff",bodyColor:"#e2eaf5",borderColor:"rgba(0,212,255,0.3)",borderWidth:1,
            callbacks:{ label: ctx=>`  ${ctx.dataset.label}: Innovation=${ctx.raw.x.toFixed(3)}, CO₂=${ctx.raw.y.toFixed(2)}kg` }},
        }
      }
    });
  },

  // ── Rating Radar ──────────────────────────────────────────
  ratingRadar(scores) {
    this.destroy("ratingRadarChart");
    const ctx = document.getElementById("ratingRadarChart");
    if (!ctx) return;
    const labels = ["Range","Efficiency","Charging","Value","Innovation","Eco Impact"];
    const values = [
      scores.range, scores.efficiency, scores.charging,
      scores.value, scores.innovation, scores.eco
    ];
    this._charts["ratingRadarChart"] = new Chart(ctx, {
      type:"radar",
      data:{
        labels,
        datasets:[{
          label:"Your EV",
          data: values,
          fill: true,
          backgroundColor: "rgba(0,212,255,0.12)",
          borderColor: "#00d4ff",
          pointBackgroundColor: values.map(v =>
            v >= 90 ? "#ff6b35" : v >= 75 ? "#00d4ff" : v >= 60 ? "#00ff88" : v >= 45 ? "#f59e0b" : "#ef4444"
          ),
          pointBorderColor: "#050a14",
          pointRadius: 6,
          pointHoverRadius: 9,
          borderWidth: 2.5,
        },{
          label:"Market Average",
          data:[62,58,55,60,58,60],
          fill:true,
          backgroundColor:"rgba(255,255,255,0.03)",
          borderColor:"rgba(255,255,255,0.15)",
          pointBackgroundColor:"rgba(255,255,255,0.25)",
          pointBorderColor:"#050a14",
          pointRadius:4,
          borderWidth:1.5,
          borderDash:[4,4],
        }]
      },
      options:{
        ...this.defaults(),
        scales:{
          r:{
            min:0, max:100,
            ticks:{ stepSize:25, color:"#4a6180", font:{family:"Space Mono",size:9}, backdropColor:"transparent" },
            grid:{ color:"rgba(255,255,255,0.06)" },
            angleLines:{ color:"rgba(0,212,255,0.12)" },
            pointLabels:{ color:"#8fa3be", font:{family:"Orbitron",size:10,weight:"700"} }
          }
        },
        plugins:{
          legend:{position:"bottom",labels:{color:"#8fa3be",font:{family:"Rajdhani",weight:"600",size:12},padding:14}},
          tooltip:{
            backgroundColor:"rgba(5,10,20,0.95)",titleColor:"#00d4ff",bodyColor:"#e2eaf5",
            borderColor:"rgba(0,212,255,0.3)",borderWidth:1,
            callbacks:{
              label: ctx => {
                const v = ctx.raw;
                const grade = v>=90?"S+":(v>=75?"A":(v>=60?"B":(v>=45?"C":"D")));
                return `  ${ctx.dataset.label}: ${v.toFixed(1)} (Grade ${grade})`;
              }
            }
          }
        }
      }
    });
  },

  // ── Overall Ring (doughnut) ───────────────────────────────
  overallRing(score) {
    const canvas = document.getElementById("overallRingChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 160, H = 160;
    ctx.clearRect(0, 0, W, H);

    const cx = W/2, cy = H/2, r = 62, lineW = 14;
    const pct = Math.min(score / 100, 1);

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = lineW;
    ctx.stroke();

    // Segments (4 coloured arcs)
    const segs = [
      { from:0, to:0.45, color:"rgba(239,68,68,0.4)" },
      { from:0.45, to:0.60, color:"rgba(245,158,11,0.4)" },
      { from:0.60, to:0.75, color:"rgba(0,255,136,0.4)" },
      { from:0.75, to:0.90, color:"rgba(0,212,255,0.4)" },
      { from:0.90, to:1.0,  color:"rgba(255,107,53,0.4)" },
    ];

    segs.forEach(s => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI/2 + s.from*Math.PI*2, -Math.PI/2 + s.to*Math.PI*2);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = lineW;
      ctx.stroke();
    });

    // Value arc
    const scoreColor = score>=90?"#ff6b35":score>=75?"#00d4ff":score>=60?"#00ff88":score>=45?"#f59e0b":"#ef4444";
    const grd = ctx.createLinearGradient(cx-r, cy, cx+r, cy);
    grd.addColorStop(0, scoreColor);
    grd.addColorStop(1, "#00d4ff");
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + pct*Math.PI*2);
    ctx.strokeStyle = grd;
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    ctx.stroke();

    // Outer glow dot at tip
    const angle = -Math.PI/2 + pct*Math.PI*2;
    const tipX  = cx + r*Math.cos(angle);
    const tipY  = cy + r*Math.sin(angle);
    ctx.beginPath();
    ctx.arc(tipX, tipY, 5, 0, Math.PI*2);
    ctx.fillStyle = scoreColor;
    ctx.shadowColor = scoreColor;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  },

  // ── Gauge (Canvas) ────────────────────────────────────────
  gauge(canvasId, pct, color1, color2) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W/2, cy = H - 20;
    const r  = Math.min(W, H*1.4) * 0.42;
    const startA = Math.PI, endA = 2 * Math.PI;
    const angle  = startA + (pct/100) * Math.PI;

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, r, startA, endA);
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.stroke();

    // Value arc
    const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.beginPath();
    ctx.arc(cx, cy, r, startA, angle);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.stroke();

    // Threshold line (90%)
    const ta = startA + 0.9 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx + (r-18)*Math.cos(ta), cy + (r-18)*Math.sin(ta));
    ctx.lineTo(cx + (r+6) *Math.cos(ta), cy + (r+6) *Math.sin(ta));
    ctx.strokeStyle = "rgba(239,68,68,0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Needle
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const na = angle;
    ctx.lineTo(cx + (r-22)*Math.cos(na), cy + (r-22)*Math.sin(na));
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI*2);
    ctx.fillStyle = "#00d4ff";
    ctx.fill();
  },
};

/* ─────────────────────────────────────────────────────────────
   THREE.JS SCENE
───────────────────────────────────────────────────────────── */
const ThreeScene = {
  scene: null, camera: null, renderer: null,
  car: null, rings: [], particles: null, animId: null,

  init() {
    const canvas = document.getElementById("three-canvas");
    if (!canvas || !window.THREE) return;

    // Dispose previous instance if re-called
    if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
    if (this.renderer) { this.renderer.dispose(); this.renderer = null; }
    this.rings = []; this.particles = null; this.car = null;

    const container = document.getElementById("hero3D");
    const W = container.clientWidth  || container.offsetWidth  || 480;
    const H = container.clientHeight || container.offsetHeight || 380;

    const isMobile = W < 520;

    this.scene    = new THREE.Scene();
    this.camera   = new THREE.PerspectiveCamera(isMobile ? 60 : 50, W/H, 0.1, 100);
    this.camera.position.set(0, isMobile ? 1 : 1.5, isMobile ? 8.5 : 7);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha:true });
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    this.renderer.setClearColor(0x000000, 0);

    // Lights
    const ambLight = new THREE.AmbientLight(0x00d4ff, 0.3);
    this.scene.add(ambLight);
    const ptLight = new THREE.PointLight(0x00d4ff, 1.5, 20);
    ptLight.position.set(0, 3, 3);
    this.scene.add(ptLight);
    const ptLight2 = new THREE.PointLight(0x00ff88, 1, 15);
    ptLight2.position.set(-4, 0, 2);
    this.scene.add(ptLight2);

    this._buildCar();
    if (!isMobile) this._buildRings();
    this._buildParticles(isMobile ? 200 : 600);
    this._addGrid();
    this._animate();

    // Resize observer (more reliable than window resize)
    if (this._resizeObs) this._resizeObs.disconnect();
    this._resizeObs = new ResizeObserver(() => this._resize());
    this._resizeObs.observe(container);
  },

  _lineMat(color = 0x00d4ff, opacity = 0.9) {
    return new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  },

  _buildCar() {
    this.car = new THREE.Group();
    const mCyan  = this._lineMat(0x00d4ff, 0.85);
    const mGreen = this._lineMat(0x00ff88, 0.75);
    const mViolet= this._lineMat(0x7c3aed, 0.6);

    const edge = (geom, mat) => {
      const edges = new THREE.EdgesGeometry(geom);
      return new THREE.LineSegments(edges, mat);
    };

    // ── Chassis (lower body) ──────────────────────────────
    const chassis = edge(new THREE.BoxGeometry(3.8, 0.45, 1.7), mCyan);
    chassis.position.y = 0;
    this.car.add(chassis);

    // ── Cabin ─────────────────────────────────────────────
    const cabin = edge(new THREE.BoxGeometry(2.1, 0.65, 1.55), mCyan);
    cabin.position.set(-0.1, 0.55, 0);
    this.car.add(cabin);

    // ── Hood (front slope) ────────────────────────────────
    const hood = edge(new THREE.BoxGeometry(0.9, 0.25, 1.65), mCyan);
    hood.position.set(1.4, 0.3, 0);
    this.car.add(hood);

    // ── Trunk ─────────────────────────────────────────────
    const trunk = edge(new THREE.BoxGeometry(0.7, 0.25, 1.65), mCyan);
    trunk.position.set(-1.3, 0.3, 0);
    this.car.add(trunk);

    // ── Battery pack ─────────────────────────────────────
    const battery = edge(new THREE.BoxGeometry(3.2, 0.18, 1.5), mGreen);
    battery.position.y = -0.28;
    this.car.add(battery);

    // ── Wheels (4) ────────────────────────────────────────
    const wheelPositions = [
      [ 1.3, -0.38,  0.92], [-1.3, -0.38,  0.92],
      [ 1.3, -0.38, -0.92], [-1.3, -0.38, -0.92]
    ];
    wheelPositions.forEach(([x,y,z]) => {
      const w = edge(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 14), mViolet);
      w.rotation.x = Math.PI / 2;
      w.position.set(x, y, z);
      this.car.add(w);

      // inner rim
      const rim = edge(new THREE.CylinderGeometry(0.18, 0.18, 0.3, 8), mCyan);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(x, y, z);
      this.car.add(rim);
    });

    // ── Headlights ────────────────────────────────────────
    const hlGeo = new THREE.BoxGeometry(0.08, 0.15, 0.5);
    const hlMat = this._lineMat(0xffffff, 0.9);
    [-0.35, 0.35].forEach(z => {
      const hl = edge(hlGeo, hlMat);
      hl.position.set(1.9, 0.15, z);
      this.car.add(hl);
    });

    // ── Taillights ────────────────────────────────────────
    const tlMat = this._lineMat(0xff3300, 0.8);
    [-0.35, 0.35].forEach(z => {
      const tl = edge(hlGeo, tlMat);
      tl.position.set(-1.9, 0.15, z);
      this.car.add(tl);
    });

    // ── Scan line inside car (moving) ─────────────────────
    const scanMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.3 });
    const scanGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2.2, 0, 0), new THREE.Vector3(2.2, 0, 0)
    ]);
    this._scanLine = new THREE.Line(scanGeo, scanMat);
    this._scanLine.position.z = -0.9;
    this.car.add(this._scanLine);

    this.car.position.y = -0.3;
    this.scene.add(this.car);
  },

  _buildRings() {
    const configs = [
      { r:2.4, tube:0.012, color:0x00d4ff, rx:Math.PI/2.2, ry:0,        rz:0,       spd: 0.004 },
      { r:3.0, tube:0.01,  color:0x00ff88, rx:Math.PI/3,   ry:Math.PI/6, rz:0,      spd:-0.003 },
      { r:3.7, tube:0.008, color:0x7c3aed, rx:Math.PI/4,   ry:Math.PI/4, rz:0.3,    spd: 0.002 },
    ];
    configs.forEach(cfg => {
      const geo = new THREE.TorusGeometry(cfg.r, cfg.tube, 8, 80);
      const mat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.55 });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.set(cfg.rx, cfg.ry, cfg.rz);
      ring._spd = cfg.spd;
      this.scene.add(ring);
      this.rings.push(ring);
    });
  },

  _buildParticles(count = 600) {
    const pos   = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 22;
      pos[i*3+1] = (Math.random() - 0.5) * 14;
      pos[i*3+2] = (Math.random() - 0.5) * 16;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x00d4ff, size: 0.045, transparent: true, opacity: 0.5 });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  },

  _addGrid() {
    const grid = new THREE.GridHelper(14, 18, 0x00d4ff, 0x0a1628);
    grid.position.y = -0.85;
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    this.scene.add(grid);
  },

  _scanDir: 1,
  _scanZ:  -0.9,

  _animate() {
    this.animId = requestAnimationFrame(() => this._animate());
    const t = Date.now() * 0.001;

    // Car gentle rotation & bob
    if (this.car) {
      this.car.rotation.y = Math.sin(t * 0.35) * 0.35;
      this.car.position.y = -0.3 + Math.sin(t * 0.7) * 0.06;

      // Scan line inside car
      if (this._scanLine) {
        this._scanZ += this._scanDir * 0.012;
        if (this._scanZ > 0.9 || this._scanZ < -0.9) this._scanDir *= -1;
        this._scanLine.position.z = this._scanZ;
        this._scanLine.material.opacity = 0.2 + Math.abs(Math.sin(t*2)) * 0.15;
      }
    }

    // Rings
    this.rings.forEach(r => { r.rotation.z += r._spd; });

    // Particles drift
    if (this.particles) this.particles.rotation.y += 0.0006;

    this.renderer.render(this.scene, this.camera);
  },

  _resize() {
    const container = document.getElementById("hero3D");
    if (!container || !this.renderer || !this.camera) return;
    const W = container.clientWidth  || container.offsetWidth  || 480;
    const H = container.clientHeight || container.offsetHeight || 380;
    if (W < 2 || H < 2) return;
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H);
  },

  dispose() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.renderer) this.renderer.dispose();
  }
};

/* ─────────────────────────────────────────────────────────────
   HERO BACKGROUND (canvas particle grid)
───────────────────────────────────────────────────────────── */
const HeroBg = {
  canvas: null, ctx: null, pts: [], animId: null,

  init() {
    this.canvas = document.getElementById("hero-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this._resize();
    this._build();
    this._animate();
    window.addEventListener("resize", () => { this._resize(); this._build(); });
  },

  _resize() {
    this.canvas.width  = this.canvas.parentElement.offsetWidth;
    this.canvas.height = this.canvas.parentElement.offsetHeight;
  },

  _build() {
    const N = Math.floor((this.canvas.width * this.canvas.height) / 15000);
    this.pts = Array.from({ length: N }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.5 + 0.5,
    }));
  },

  _animate() {
    this.animId = requestAnimationFrame(() => this._animate());
    const { ctx, canvas, pts } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = "rgba(0,212,255,0.3)";
      ctx.fill();
    });

    pts.forEach((a, i) => {
      for (let j = i+1; j < pts.length; j++) {
        const b = pts[j];
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        if (d < 100) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,212,255,${0.06*(1 - d/100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });
  },
};

/* ─────────────────────────────────────────────────────────────
   GSAP ANIMATIONS
───────────────────────────────────────────────────────────── */
const Animations = {
  heroIn() {
    if (!window.gsap) return;
    gsap.set(".hero-badge, .hero-title .line1, .hero-title .line2, .hero-title .line3, .hero-subtitle, .hero-cta", { opacity:0, y:30 });
    gsap.to(".hero-badge",           { opacity:1, y:0, duration:0.6, delay:0.2, ease:"power3.out" });
    gsap.to(".hero-title .line1",    { opacity:1, y:0, duration:0.6, delay:0.35, ease:"power3.out" });
    gsap.to(".hero-title .line2",    { opacity:1, y:0, duration:0.6, delay:0.48, ease:"power3.out" });
    gsap.to(".hero-title .line3",    { opacity:1, y:0, duration:0.6, delay:0.6,  ease:"power3.out" });
    gsap.to(".hero-subtitle",        { opacity:1, y:0, duration:0.6, delay:0.72, ease:"power3.out" });
    gsap.to(".hero-cta",             { opacity:1, y:0, duration:0.6, delay:0.85, ease:"power3.out" });
    gsap.set(".hero-3d-container",   { opacity:0, scale:0.85 });
    gsap.to(".hero-3d-container",    { opacity:1, scale:1, duration:1.1, delay:0.4, ease:"power3.out" });
  },

  scrollSetup() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".feature-card").forEach((el, i) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
        opacity: 0, y: 40, duration: 0.6, delay: i * 0.1, ease: "power3.out"
      });
    });

    gsap.utils.toArray(".model-card").forEach((el, i) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
        opacity: 0, x: i === 0 ? -40 : 40, duration: 0.7, ease: "power3.out"
      });
    });

    gsap.utils.toArray(".pipeline-step").forEach((el, i) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
        opacity: 0, x: -30, duration: 0.5, delay: i * 0.06, ease: "power2.out"
      });
    });
  },

  pageIn(pageId) {
    if (!window.gsap) return;
    const page = document.getElementById(pageId);
    if (!page) return;
    gsap.from(page, { opacity:0, y:20, duration:0.4, ease:"power2.out" });
  },

  countUp(el, target, suffix = "", dur = 1800) {
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.innerHTML = `<span class="stat-val">${(target * ease).toFixed(target % 1 !== 0 ? 2 : 0)}${suffix}</span><div class="stat-lbl">${el.dataset.label}</div>`;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  initStats() {
    document.querySelectorAll(".stat-item").forEach(el => {
      const val = parseFloat(el.dataset.val);
      const suf = el.dataset.suffix || "";
      Animations.countUp(el, val, suf, 2000);
    });
  },

  resultIn(results) {
    if (!window.gsap) return;
    gsap.from(results, { opacity:0, y:30, duration:0.5, ease:"power3.out" });
    gsap.from(".result-card", { opacity:0, y:40, duration:0.6, stagger:0.15, delay:0.2, ease:"power3.out" });
    gsap.from(".gauge-card",  { opacity:0, scale:0.9, duration:0.5, stagger:0.1, delay:0.4, ease:"back.out" });
  },

  animateValue(el, from, to, decimals = 2, dur = 1200) {
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = (from + (to - from) * ease).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
};

/* ─────────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────────── */
const Nav = {
  init() {
    // Scroll effect
    window.addEventListener("scroll", () => {
      document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 20);
    });

    // All nav link clicks
    document.querySelectorAll("[data-page]").forEach(el => {
      el.addEventListener("click", e => {
        e.preventDefault();
        EVApp.navigate(el.dataset.page);
      });
    });

    // Hamburger
    const ham = document.getElementById("hamburger");
    const overlay = document.getElementById("mobileOverlay");

    ham.addEventListener("click", () => {
      const open = overlay.classList.toggle("open");
      ham.classList.toggle("active", open);
      overlay.style.display = open ? "block" : "none";
      document.body.style.overflow = open ? "hidden" : "";
    });

    overlay.addEventListener("click", e => {
      if (e.target === overlay) Nav.closeMenu();
    });
  },

  closeMenu() {
    const overlay = document.getElementById("mobileOverlay");
    overlay.classList.remove("open");
    document.getElementById("hamburger").classList.remove("active");
    document.body.style.overflow = "";
    setTimeout(() => { overlay.style.display = "none"; }, 350);
  },

  setActive(page) {
    document.querySelectorAll(".nav-link, .mobile-nav-link").forEach(el => {
      el.classList.toggle("active", el.dataset.page === page);
    });
  }
};

/* ─────────────────────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────────────────────── */
const EVApp = {
  currentPage: "home",
  currency: "EUR",
  statsData: null,
  analyticsData: null,
  _analyticsLoaded: false,

  async init() {
    Nav.init();
    HeroBg.init();
    Animations.heroIn();
    Animations.initStats();

    // Route from hash
    const hash = window.location.hash.replace("#","") || "home";
    await this.navigate(hash, true);

    // Check API
    this._checkAPI();

    // GSAP scroll
    Animations.scrollSetup();
  },

  async _checkAPI() {
    const status = document.getElementById("apiStatus");
    try {
      await API.get("/api/health");
      status.className = "api-status connected";
      status.querySelector(".status-text").textContent = "API Online";
      Toast.success("API Connected", "Backend is running on port 8000");
    } catch {
      status.className = "api-status error";
      status.querySelector(".status-text").textContent = "API Offline";
      Toast.error("API Offline", "Start uvicorn: uvicorn main:app --reload", 8000);
    }
  },

  async navigate(page, initial = false) {
    if (!["home","predict","analytics","about"].includes(page)) page = "home";

    // Hide all
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));

    // Show target
    const target = document.getElementById(`page-${page}`);
    if (target) {
      target.classList.remove("hidden");
      if (!initial) Animations.pageIn(`page-${page}`);
    }

    window.location.hash = page;
    this.currentPage = page;
    Nav.setActive(page);
    Nav.closeMenu();
    window.scrollTo({ top: 0, behavior: initial ? "instant" : "smooth" });

    // Page-specific init
    if (page === "home") await this._initHome();
    if (page === "analytics") await this._initAnalytics();
  },

  async _initHome() {
    ThreeScene.init();
    try {
      this.statsData = await API.get("/api/stats");
      this._renderModelMetrics(this.statsData);
      ChartManager.homeFeature(this.statsData);
    } catch {
      Toast.warning("Offline Mode", "Using cached model metrics");
      this._renderModelMetricsDefault();
      ChartManager.homeFeature({
        feature_importance: {
          features:["Range","Battery","Top Speed","Fast Charge","Price"],
          co2_model:[100,88,74,71,45], innovation_model:[79,85,90,84,47]
        }
      });
    }
  },

  _renderModelMetrics(data) {
    const co2 = data.model_metrics.co2;
    const inn = data.model_metrics.innovation;

    const co2Grid = document.getElementById("co2MetricsGrid");
    const innGrid = document.getElementById("innoMetricsGrid");
    if (!co2Grid || !innGrid) return;

    const makeItems = (m) => [
      { v:`${m.r2.toFixed(4)}`, l:"R² Score" },
      { v:`${m.mae.toFixed(3)}`, l:"MAE" },
      { v:`${m.rmse.toFixed(3)}`, l:"RMSE" },
      { v:`${m.cv_mean.toFixed(4)}`, l:"CV Mean" },
      { v:`${m.cv_std.toFixed(4)}`, l:"CV Std" },
      { v:`5-Fold`,  l:"Cross-Val" },
    ];

    const render = (grid, items) => {
      grid.innerHTML = items.map(i => `
        <div class="mm-item">
          <div class="mm-val">${i.v}</div>
          <div class="mm-lbl">${i.l}</div>
        </div>`).join("");
    };

    render(co2Grid, makeItems(co2));
    render(innGrid, makeItems(inn));
  },

  _renderModelMetricsDefault() {
    this._renderModelMetrics({
      model_metrics: {
        co2:{ r2:0.9957, mae:0.312, rmse:0.472, cv_mean:0.9938, cv_std:0.0029 },
        innovation:{ r2:0.9904, mae:0.0066, rmse:0.0100, cv_mean:0.9924, cv_std:0.0017 }
      }
    });
  },

  async _initAnalytics() {
    if (this._analyticsLoaded) return;
    try {
      this.analyticsData = await API.get("/api/analytics");
      const statsData    = this.statsData || await API.get("/api/stats");

      ChartManager.radar({ model_radar: this.analyticsData.model_radar });
      ChartManager.featureImportance(statsData);
      ChartManager.heatmap(this.analyticsData);
      ChartManager.convergence(this.analyticsData);
      ChartManager.segments(this.analyticsData);
      ChartManager.distribution(this.analyticsData);
      this._analyticsLoaded = true;
      Toast.success("Analytics Loaded", "All charts rendered successfully");
    } catch {
      Toast.error("Analytics Error", "Could not load analytics data from API");
    }
  },

  setCurrency(c) {
    this.currency = c;
    document.getElementById("currEUR").classList.toggle("active", c === "EUR");
    document.getElementById("currINR").classList.toggle("active", c === "INR");

    const EUR_TO_INR = 90.91;
    const INR_TO_EUR = 0.011;

    if (c === "INR") {
      document.getElementById("priceLabelText").textContent = "Price (INR ₹)";
      document.getElementById("priceUnit").textContent = "₹";
      document.getElementById("priceHint").textContent = "₹18,182 – ₹22,73,000";
      const priceInp = document.getElementById("inp-price");
      const priceSl  = document.getElementById("sl-price");
      priceInp.min = Math.round(20000 * EUR_TO_INR); priceInp.max = Math.round(250000 * EUR_TO_INR);
      priceInp.value = Math.round(59017 * EUR_TO_INR);
      priceSl.min = priceInp.min; priceSl.max = priceInp.max; priceSl.value = priceInp.value;
      this._syncSlider("inp-price", "sl-price");
    } else {
      document.getElementById("priceLabelText").textContent = "Price (EUR €)";
      document.getElementById("priceUnit").textContent = "€";
      document.getElementById("priceHint").textContent = "€20,000 – €250,000";
      const priceInp = document.getElementById("inp-price");
      const priceSl  = document.getElementById("sl-price");
      priceInp.min = 20000; priceInp.max = 250000;
      priceInp.value = 59017;
      priceSl.min = 20000; priceSl.max = 250000; priceSl.value = 59017;
      this._syncSlider("inp-price", "sl-price");
    }
  },

  _syncSlider(inputId, sliderId) {
    const inp = document.getElementById(inputId);
    const sl  = document.getElementById(sliderId);
    if (!inp || !sl) return;
    const pct = ((inp.value - sl.min) / (sl.max - sl.min)) * 100;
    sl.style.setProperty("--progress", pct + "%");
  },

  initSliders() {
    const pairs = [
      ["inp-battery","sl-battery"],
      ["inp-efficiency","sl-efficiency"],
      ["inp-fastcharge","sl-fastcharge"],
      ["inp-price","sl-price"],
      ["inp-range","sl-range"],
      ["inp-topspeed","sl-topspeed"],
    ];

    pairs.forEach(([inputId, sliderId]) => {
      const inp = document.getElementById(inputId);
      const sl  = document.getElementById(sliderId);
      if (!inp || !sl) return;

      const sync = (val) => {
        const pct = ((val - sl.min) / (sl.max - sl.min)) * 100;
        sl.style.setProperty("--progress", pct + "%");
      };

      inp.addEventListener("input", () => { sl.value = inp.value; sync(inp.value); });
      sl.addEventListener("input",  () => { inp.value = sl.value; sync(sl.value); });
      sync(inp.value);
    });
  },

  resetForm() {
    const defaults = { battery:75, efficiency:172, fastcharge:670, price:59017, range:435, topspeed:217 };
    Object.entries(defaults).forEach(([k, v]) => {
      const inp = document.getElementById(`inp-${k}`);
      const sl  = document.getElementById(`sl-${k}`);
      if (inp) inp.value = v;
      if (sl)  { sl.value = v; this._syncSlider(`inp-${k}`, `sl-${k}`); }
    });
    if (this.currency === "INR") this.setCurrency("EUR");
    document.getElementById("resultsSection").classList.add("hidden");
    Toast.info("Form Reset", "All values returned to defaults");
  },

  async runPrediction() {
    const btn = document.getElementById("predictBtn");
    const icon = btn.querySelector(".btn-predict-icon i");

    btn.disabled = true;
    btn.classList.add("loading");
    icon.className = "fa-solid fa-spinner";

    const data = {
      battery:    parseFloat(document.getElementById("inp-battery").value),
      efficiency: parseFloat(document.getElementById("inp-efficiency").value),
      fast_charge:parseFloat(document.getElementById("inp-fastcharge").value),
      price:      parseFloat(document.getElementById("inp-price").value),
      range_km:   parseFloat(document.getElementById("inp-range").value),
      top_speed:  parseFloat(document.getElementById("inp-topspeed").value),
      currency:   this.currency,
    };

    try {
      const result = await API.post("/api/predict", data);
      this._showResults(result, data.range_km, data);
      Toast.success("Prediction Complete", `CO₂: ${result.co2_savings.toFixed(2)}kg | Innovation: ${(result.innovation_score*100).toFixed(1)}%`);
    } catch (e) {
      Toast.error("Prediction Failed", e.message || "Check API connection");
    } finally {
      btn.disabled = false;
      btn.classList.remove("loading");
      icon.className = "fa-solid fa-microchip";
    }
  },

  // ── Compute normalised rating scores (0–100) from prediction ──
  _computeRatings(r, inputData) {
    const battery    = inputData.battery    || 75;
    const efficiency = inputData.efficiency || 172;
    const fast_charge= inputData.fast_charge|| 670;
    const range_km   = inputData.range_km   || 435;
    const top_speed  = inputData.top_speed  || 217;
    const price_eur  = r.price_eur          || 59017;

    return {
      range:      Math.min((range_km    / 700)   * 100, 100),
      efficiency: Math.min(((300 - efficiency) / 170) * 100, 100),
      charging:   Math.min((fast_charge  / 1300) * 100, 100),
      value:      Math.min(Math.max((1 - price_eur / 250000) * 130, 0), 100),
      innovation: r.inno_percentage,
      eco:        r.co2_percentage,
    };
  },

  _getGrade(score) {
    if (score >= 90) return { letter:"S+", label:"Elite Performance",   cls:"grade-sp" };
    if (score >= 75) return { letter:"A",  label:"Advanced",            cls:"grade-a"  };
    if (score >= 60) return { letter:"B",  label:"Good",                cls:"grade-b"  };
    if (score >= 45) return { letter:"C",  label:"Standard",            cls:"grade-c"  };
    return              { letter:"D",  label:"Basic",               cls:"grade-d"  };
  },

  _renderRatingCard(r, inputData) {
    const scores  = this._computeRatings(r, inputData);
    const overall = parseFloat(
      (Object.values(scores).reduce((a,b) => a+b, 0) / Object.keys(scores).length).toFixed(1)
    );
    const grade   = this._getGrade(overall);

    // Badge
    const badge = document.getElementById("ratingBadge");
    badge.className = `rating-grade-badge ${grade.cls}`;
    document.getElementById("ratingLetter").textContent = grade.letter;
    document.getElementById("ratingLabel").textContent  = grade.label;

    // Overall ring + score
    ChartManager.overallRing(overall);
    Animations.animateValue(document.getElementById("overallScore"), 0, overall, 1, 1200);

    // Stars (out of 5)
    const stars = overall / 20;
    const starEls = document.querySelectorAll(".sr-star");
    starEls.forEach((el, i) => {
      el.className = "fa-solid fa-star sr-star filled";
      if (i + 1 > Math.ceil(stars)) {
        el.className = i + 0.5 < stars
          ? "fa-solid fa-star-half-stroke sr-star half"
          : "fa-regular fa-star sr-star";
      }
    });
    document.getElementById("starLabel").textContent = `${stars.toFixed(1)} / 5.0`;

    // Category bars
    const cats = [
      { bar:"rcRangeBar", score:"rcRangeScore", val: scores.range },
      { bar:"rcEffBar",   score:"rcEffScore",   val: scores.efficiency },
      { bar:"rcChgBar",   score:"rcChgScore",   val: scores.charging },
      { bar:"rcValBar",   score:"rcValScore",   val: scores.value },
      { bar:"rcInnBar",   score:"rcInnScore",   val: scores.innovation },
      { bar:"rcEcoBar",   score:"rcEcoScore",   val: scores.eco },
    ];

    setTimeout(() => {
      cats.forEach(c => {
        const bar = document.getElementById(c.bar);
        const sc  = document.getElementById(c.score);
        if (bar) bar.style.width = c.val.toFixed(1) + "%";
        if (sc)  sc.textContent  = c.val.toFixed(0);
      });
    }, 700);

    // Radar
    setTimeout(() => ChartManager.ratingRadar(scores), 300);
  },

  _showResults(r, range_km, inputData = {}) {
    const sec = document.getElementById("resultsSection");
    sec.classList.remove("hidden");

    // Timestamp
    document.getElementById("resultsTimestamp").textContent =
      `Predicted at ${new Date().toLocaleTimeString()} | Range: ${range_km} km`;

    // Primary values (animated)
    const co2El  = document.getElementById("co2Value");
    const innoEl = document.getElementById("innoValue");
    Animations.animateValue(co2El,  0, r.co2_savings,      2, 1200);
    Animations.animateValue(innoEl, 0, r.innovation_score, 3, 1200);
    document.getElementById("innoSubtext").textContent = `${r.inno_percentage.toFixed(1)}% innovation rating`;

    // Gauges
    setTimeout(() => {
      ChartManager.gauge("gaugeInno", r.inno_percentage,  "#7c3aed", "#00d4ff");
      ChartManager.gauge("gaugeCO2",  r.co2_percentage,   "#00ff88", "#00d4ff");
      document.getElementById("gaugeInnoVal").textContent = `${r.inno_percentage.toFixed(1)}%`;
      document.getElementById("gaugeCO2Val").textContent  = `${r.co2_percentage.toFixed(1)}%`;
    }, 400);

    // Breakdown bars
    setTimeout(() => {
      document.getElementById("techEdgeBar").style.width    = r.tech_edge + "%";
      document.getElementById("energyIntelBar").style.width = r.energy_intel + "%";
      document.getElementById("userValueBar").style.width   = r.user_value + "%";
      document.getElementById("techEdgeVal").textContent    = r.tech_edge.toFixed(1) + "%";
      document.getElementById("energyIntelVal").textContent = r.energy_intel.toFixed(1) + "%";
      document.getElementById("userValueVal").textContent   = r.user_value.toFixed(1) + "%";
    }, 600);

    // Env metrics
    document.getElementById("treesVal").textContent    = r.trees_equivalent.toFixed(1);
    document.getElementById("petrolVal").textContent   = r.petrol_saved.toFixed(1) + " L";
    document.getElementById("chargeIdxVal").textContent = r.charge_index.toFixed(1);
    document.getElementById("battEffVal").textContent  = r.battery_efficiency.toFixed(1);

    // Scatter
    setTimeout(() => ChartManager.scatter(r), 300);

    // Rating card
    this._renderRatingCard(r, inputData);

    // Scroll & animate
    Animations.resultIn(sec);
    setTimeout(() => sec.scrollIntoView({ behavior:"smooth", block:"start" }), 200);
  },
};

/* ─────────────────────────────────────────────────────────────
   BOOT
───────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  // Show loading screen briefly
  const loadDiv = document.createElement("div");
  loadDiv.className = "loading-overlay";
  loadDiv.innerHTML = `
    <div class="loader-logo">EV<span>_aluate</span></div>
    <div class="loader-bar-wrap"><div class="loader-bar"></div></div>`;
  document.body.prepend(loadDiv);

  setTimeout(() => {
    loadDiv.classList.add("hidden");
    setTimeout(() => loadDiv.remove(), 500);
  }, 1500);

  // Ensure mobile overlay hidden initially
  const overlay = document.getElementById("mobileOverlay");
  overlay.style.display = "none";

  // Init app
  EVApp.init();
  EVApp.initSliders();
});
