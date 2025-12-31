// ==UserScript==
// @name         MessiahV2 - Exact Restore + Features FIX
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Compact UI, Preset Side-Menu, Fix Load Bug, and Delete Presets
// @author       xtra?
// @match        https://fxclient.github.io/FXclient/
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @run-at       document-start
// ==/UserScript==

(async function () {
  'use strict';

  const w = unsafeWindow;

  // --- Persistence & Initialization ---
  const settings = {
      manualPercent: parseInt(localStorage.getItem('exynos_pct')) || 12,
      useDynamic: localStorage.getItem('exynos_dyn') !== 'false',
      attackDelay: parseInt(localStorage.getItem('exynos_delay')) || 1,
      minLand: parseInt(localStorage.getItem('exynos_land')) || 1,
      dyn_0s: parseInt(localStorage.getItem('exynos_d0')) || 17,
      dyn_18s: parseInt(localStorage.getItem('exynos_d18')) || 12,
      dyn_38s: parseInt(localStorage.getItem('exynos_d38')) || 8,
      presets: JSON.parse(localStorage.getItem('exynos_presets')) || {}
  };

  const WAVE_INTERVAL_MS = 5500;
  let waveInterval = null;
  let startTime = null;
  const lastAttack = new Map();

  // --- UI Construction ---
  const gui = document.createElement('div');
  gui.id = 'exynos-gui';
  gui.innerHTML = `
    <div id="exynos-header">
        <span></span>
        <span style="flex-grow:1; text-align:center;">Project Exynos</span>
        <span id="exynos-minimize">_</span>
    </div>
    <div id="exynos-body">
         <div id="smart-attack">Smart Attack: OFF</div>
         <div class="control-group" id="pct-group">
             <div class="label-row"><span>Attack Amount</span><span id="val-pct">${settings.manualPercent}%</span></div>
             <input type="range" id="slider-pct" class="custom-slider" min="1" max="30" value="${settings.manualPercent}">
         </div>
         <div id="btn-dynamic" class="${settings.useDynamic ? 'active' : ''}">Dynamic Percentage: ${settings.useDynamic ? 'ON' : 'OFF'}</div>

         <button id="btn-edit-dyn" style="width:100%; font-size:10px; background:rgba(255,255,255,0.1); color:#fff; border:1px solid #fff; cursor:pointer; padding:4px;">Edit Dynamic %</button>

         <div class="control-group">
             <div class="label-row"><span>Burst Delay</span><span id="val-int">${settings.attackDelay}ms</span></div>
             <input type="range" id="slider-int" class="custom-slider" min="1" max="667" value="${settings.attackDelay}">
         </div>
         <div class="control-group">
             <div class="label-row"><span>Min Target Land</span><span id="val-land">${settings.minLand}</span></div>
             <input type="range" id="slider-land" class="custom-slider" min="1" max="2468" value="${settings.minLand}">
         </div>

         <button id="btn-open-presets" style="width:100%; font-size:11px; background:rgba(255,255,255,0.1); color:#fff; border:1px solid #fff; cursor:pointer; padding:6px;">Manage Presets</button>

         <button id="btn-reset" style="width:100%; background:#8b0000; color:#fff; border:1px solid #fff; cursor:pointer; font-size:11px; padding:4px;">RESET ALL</button>
    </div>

    <div id="dyn-editor" style="display:none; position:absolute; left:245px; top:0; width:180px; background:rgba(0,0,0,0.9); border:2px solid #fff; padding:10px;">
        <div style="text-align:center; font-size:12px; margin-bottom:10px;">Dynamic Scaling %</div>
        <div class="control-group">
            <div class="label-row"><span>0s-18s</span><span id="val-0s">${settings.dyn_0s}%</span></div>
            <input type="range" id="edit-0s" class="custom-slider" min="1" max="50" value="${settings.dyn_0s}">
        </div>
        <div class="control-group">
            <div class="label-row"><span>18s-38s</span><span id="val-18s">${settings.dyn_18s}%</span></div>
            <input type="range" id="edit-18s" class="custom-slider" min="1" max="50" value="${settings.dyn_18s}">
        </div>
        <div class="control-group">
            <div class="label-row"><span>38s+</span><span id="val-38s">${settings.dyn_38s}%</span></div>
            <input type="range" id="edit-38s" class="custom-slider" min="1" max="50" value="${settings.dyn_38s}">
        </div>
        <button id="close-dyn-editor" style="width:100%; margin-top:10px; cursor:pointer;">Done</button>
    </div>

    <div id="preset-modal" style="display:none; position:absolute; left:245px; top:0; width:180px; background:rgba(0,0,0,0.9); border:2px solid #fff; padding:10px; flex-direction: column; gap: 8px;">
        <div style="text-align:center; font-size:12px; margin-bottom:5px;">Presets</div>
        <div style="display:flex; gap:5px;">
            <input type="text" id="preset-name" placeholder="Name..." style="flex-grow:1; background:#222; border:1px solid #fff; color:#fff; font-size:10px; padding:3px;">
            <button id="btn-save-preset" style="font-size:10px; cursor:pointer; background:#006400; color:#fff; border:1px solid #fff;">Save</button>
        </div>
        <div id="preset-container" style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;"></div>
        <button id="close-preset-modal" style="width:100%; margin-top:5px; cursor:pointer;">Done</button>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #exynos-gui { position: fixed; left: 40px; top: 40px; width: 240px; background: rgba(0, 0, 0, 0.85); border: 2px solid #fff; font-family: sans-serif; z-index: 2147483647; color: #fff; user-select: none; }
    #exynos-header { background: rgba(0, 100, 0, 0.9); padding: 10px; font-weight: bold; cursor: move; border-bottom: 2px solid #fff; display: flex; align-items: center; justify-content: space-between; }
    #exynos-body { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
    #exynos-body.minimized { display: none; }
    #smart-attack { background: rgba(0, 0, 0, 0.85); border: 2px solid #fff; padding: 8px; cursor: pointer; text-align: center; font-weight: bold; font-size: 13px; }
    #smart-attack.active { background: rgba(0, 128, 0, 0.8); }
    #btn-dynamic { background: rgba(0, 0, 0, 0.5); border: 1px solid #fff; padding: 6px; text-align: center; cursor: pointer; font-size: 11px; }
    #btn-dynamic.active { background: rgba(0, 128, 0, 0.8); border-color: #fff; }
    .control-group { display: flex; flex-direction: column; gap: 5px; transition: opacity 0.3s; }
    .control-group.disabled { opacity: 0.3; pointer-events: none; }
    .label-row { display: flex; justify-content: space-between; font-size: 11px; color: #ccc; }
    #exynos-minimize { cursor: pointer; padding: 0 5px; line-height: 10px; }
    .custom-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #333; outline: none; margin: 8px 0; }
    .custom-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 18px; background: #fff; cursor: pointer; border: 1px solid #000; }
    .preset-item { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.1); padding: 5px; border: 1px solid #444; font-size: 11px; }
    .btn-del { color: #ff4d4d; cursor: pointer; font-weight: bold; padding-left: 10px; }
    .btn-load { color: #fff; cursor: pointer; flex-grow: 1; }
    .btn-load:hover { color: #4dff4d; }
  `;
  document.head.appendChild(style);
  document.documentElement.appendChild(gui);

  const save = () => {
      localStorage.setItem('exynos_pct', settings.manualPercent);
      localStorage.setItem('exynos_dyn', settings.useDynamic);
      localStorage.setItem('exynos_delay', settings.attackDelay);
      localStorage.setItem('exynos_land', settings.minLand);
      localStorage.setItem('exynos_d0', settings.dyn_0s);
      localStorage.setItem('exynos_d18', settings.dyn_18s);
      localStorage.setItem('exynos_d38', settings.dyn_38s);
      localStorage.setItem('exynos_presets', JSON.stringify(settings.presets));
  };

  const applySettingsToUI = () => {
      document.getElementById('slider-pct').value = settings.manualPercent;
      document.getElementById('val-pct').innerText = settings.manualPercent + '%';
      const dynBtn = document.getElementById('btn-dynamic');
      dynBtn.className = settings.useDynamic ? 'active' : '';
      dynBtn.innerText = `Dynamic Percentage: ${settings.useDynamic ? 'ON' : 'OFF'}`;
      document.getElementById('slider-int').value = settings.attackDelay;
      document.getElementById('val-int').innerText = settings.attackDelay + 'ms';
      document.getElementById('slider-land').value = settings.minLand;
      document.getElementById('val-land').innerText = settings.minLand;
      ['0s', '18s', '38s'].forEach(id => {
          document.getElementById('edit-'+id).value = settings['dyn_'+id];
          document.getElementById('val-'+id).innerText = settings['dyn_'+id] + '%';
      });
      updateGUI();
  };

  const updatePresetsUI = () => {
      const container = document.getElementById('preset-container');
      container.innerHTML = '';
      for (let name in settings.presets) {
          let div = document.createElement('div');
          div.className = 'preset-item';
          div.innerHTML = `<span class="btn-load">${name}</span><span class="btn-del" data-name="${name}">✖</span>`;
          div.querySelector('.btn-load').onclick = () => {
              Object.assign(settings, JSON.parse(JSON.stringify(settings.presets[name])));
              applySettingsToUI();
              save();
          };
          div.querySelector('.btn-del').onclick = (e) => {
              delete settings.presets[e.target.getAttribute('data-name')];
              save(); updatePresetsUI();
          };
          container.appendChild(div);
      }
  };

  if (!w._trackedSockets) {
    w._trackedSockets = [];
    const NativeWS = w.WebSocket;
    w.WebSocket = function (u, p) {
      const ws = p ? new NativeWS(u, p) : new NativeWS(u);
      w._trackedSockets.push(ws);
      ws.addEventListener('close', () => { const i = w._trackedSockets.indexOf(ws); if (i > -1) w._trackedSockets.splice(i, 1); });
      return ws;
    };
  }

  class BitWriter {
    constructor(b) { this.buffer = new Uint8Array(Math.ceil(b / 8)); this.bit = 0; }
    write(n, v) {
      for (let i = n - 1; i >= 0; i--) {
        const byte = Math.floor(this.bit / 8);
        const bitInByte = 7 - (this.bit % 8);
        if ((v >> i) & 1) this.buffer[byte] |= 1 << bitInByte;
        this.bit++;
      }
    }
    bytes() { return this.buffer; }
  }

  const percentToValue = p => Math.round(Math.max(0, Math.min(100, p)) * 1023 / 100);
  const makePacket = (p, t) => {
    const bw = new BitWriter(32);
    bw.write(1, 1); bw.write(4, 1);
    bw.write(10, percentToValue(p));
    bw.write(10, t); bw.write(7, 0);
    return bw.bytes();
  };

  function findBorderingIds(myCells, allBorders, offsets, totalPlayers, myId) {
    const cellSet = new Set(myCells), neighbors = new Set();
    for (let i = 0; i < totalPlayers; i++) {
      if (i === myId || !allBorders[i]) continue;
      for (let c of allBorders[i]) {
        for (let offset of offsets) { if (cellSet.has(c - offset)) { neighbors.add(i); break; } }
      }
    }
    return neighbors;
  }

  function getDynamicAttackPercent() {
    if (startTime === null) return settings.dyn_0s;
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed < 18) return settings.dyn_0s;
    if (elapsed < 38) return settings.dyn_18s;
    return settings.dyn_38s;
  }

  async function attackCheck() {
    const ag = w.ag;
    const ac = w.ac;
    const troopData = ag.h2;
    const landData = ag.go;
    const borders = ag.gg;
    const offsets = ac.f3;

    if (!troopData || !landData || !borders || !offsets) return;

    const name = w.localStorage.getItem('d122');
    if (!name) return;

    const myId = w?.aD?.data?.playerNamesData?.indexOf(name);
    if (myId == null || myId === -1 || !borders[myId]) return;

    const now = Date.now();
    const borderSet = findBorderingIds(borders[myId], borders, offsets, borders.length, myId);
    const attackPercent = settings.useDynamic ? getDynamicAttackPercent() : settings.manualPercent;
    const attackedIds = new Set();

    // BATCH 1
    let batch1Targets = [];
    for (const enemyId of borderSet) {
      const troops = troopData[enemyId];
      const land = landData[enemyId];
      if (troops != null && land != null && land >= settings.minLand) {
        if (troops / land < 0.6) {
          batch1Targets.push({ enemyId, land });
        }
      }
    }
    batch1Targets.sort((a, b) => b.land - a.land);

    for (const target of batch1Targets) {
      if (!waveInterval) return;
      const packet = makePacket(attackPercent, target.enemyId);
      for (let ws of w._trackedSockets) {
        if (ws.readyState === ws.OPEN) {
          try {
            ws.send(packet);
            lastAttack.set(target.enemyId, now);
            attackedIds.add(target.enemyId);
          } catch {}
        }
      }
      await new Promise(resolve => setTimeout(resolve, settings.attackDelay));
    }

    if (!waveInterval) return;
    await new Promise(resolve => setTimeout(resolve, 1000));

    // BATCH 2
    let batch2Targets = [];
    for (const enemyId of borderSet) {
      if (attackedIds.has(enemyId)) continue;
      const troops = troopData[enemyId];
      const land = landData[enemyId];
      if (troops != null && land != null && land >= settings.minLand) {
        if (troops / land < 0.6) {
          batch2Targets.push({ enemyId, land });
        }
      }
    }
    batch2Targets.sort((a, b) => b.land - a.land);

    for (const target of batch2Targets) {
      if (!waveInterval) return;
      const packet = makePacket(attackPercent, target.enemyId);
      for (let ws of w._trackedSockets) {
        if (ws.readyState === ws.OPEN) {
          try {
            ws.send(packet);
            lastAttack.set(target.enemyId, now);
            attackedIds.add(target.enemyId);
          } catch {}
        }
      }
      await new Promise(resolve => setTimeout(resolve, settings.attackDelay));
    }

    const elapsed = (now - startTime) / 1000;
    if (elapsed >= 18) {
      if (!waveInterval) return;
      await new Promise(resolve => setTimeout(resolve, 1000));
      // BATCH 3
      let batch3Targets = [];
      for (const enemyId of borderSet) {
        if (attackedIds.has(enemyId)) continue;
        const troops = troopData[enemyId];
        const land = landData[enemyId];
        if (troops != null && land != null && land >= settings.minLand) {
          if (troops / land < 0.6) {
            batch3Targets.push({ enemyId, land });
          }
        }
      }
      batch3Targets.sort((a, b) => b.land - a.land);

      for (const target of batch3Targets) {
        if (!waveInterval) return;
        const packet = makePacket(attackPercent, target.enemyId);
        for (let ws of w._trackedSockets) {
          if (ws.readyState === ws.OPEN) {
            try {
              ws.send(packet);
              lastAttack.set(target.enemyId, now);
              attackedIds.add(target.enemyId);
            } catch {}
          }
        }
        await new Promise(resolve => setTimeout(resolve, settings.attackDelay));
      }
    }
  }

  const updateGUI = () => {
    document.getElementById('pct-group').classList.toggle('disabled', settings.useDynamic);
  };

  document.getElementById('slider-pct').oninput = function() {
      settings.manualPercent = parseInt(this.value);
      document.getElementById('val-pct').innerText = this.value + '%';
      save();
  };

  document.getElementById('btn-dynamic').onclick = function() {
      settings.useDynamic = !settings.useDynamic;
      this.classList.toggle('active');
      this.innerText = `Dynamic Percentage: ${settings.useDynamic ? 'ON' : 'OFF'}`;
      updateGUI();
      save();
  };

  document.getElementById('btn-edit-dyn').onclick = () => {
      document.getElementById('preset-modal').style.display = 'none';
      document.getElementById('dyn-editor').style.display = 'block';
  };
  document.getElementById('close-dyn-editor').onclick = () => { document.getElementById('dyn-editor').style.display = 'none'; save(); };

  ['0s', '18s', '38s'].forEach(id => {
      document.getElementById('edit-'+id).oninput = function() {
          settings['dyn_'+id] = parseInt(this.value);
          document.getElementById('val-'+id).innerText = this.value + '%';
      };
  });

  document.getElementById('btn-open-presets').onclick = () => {
      document.getElementById('dyn-editor').style.display = 'none';
      document.getElementById('preset-modal').style.display = 'flex';
  };
  document.getElementById('close-preset-modal').onclick = () => document.getElementById('preset-modal').style.display = 'none';

  document.getElementById('btn-save-preset').onclick = () => {
      const name = document.getElementById('preset-name').value.trim();
      if (!name) return;
      const snapshot = JSON.parse(JSON.stringify(settings));
      delete snapshot.presets; 
      settings.presets[name] = snapshot;
      save(); 
      updatePresetsUI();
      document.getElementById('preset-name').value = '';
  };

  document.getElementById('btn-reset').onclick = () => {
      localStorage.clear();
      location.reload();
  };

  document.getElementById('slider-int').oninput = function() {
      settings.attackDelay = parseInt(this.value);
      document.getElementById('val-int').innerText = this.value + 'ms';
      save();
  };

  document.getElementById('slider-land').oninput = function() {
      settings.minLand = parseInt(this.value);
      document.getElementById('val-land').innerText = this.value;
      save();
  };

const toggleAttack = (forceOff = false) => {
      const btn = document.getElementById('smart-attack');
      if (waveInterval || forceOff) {
          clearInterval(waveInterval);
          waveInterval = null;
          btn.innerText = "Smart Attack: OFF";
          btn.classList.remove('active');
      } else {
          startTime = Date.now();
          // Assign interval ID first so attackCheck sees it is active
          waveInterval = setInterval(attackCheck, WAVE_INTERVAL_MS);
          attackCheck(); 
          btn.innerText = "Smart Attack: ON";
          btn.classList.add('active');
      }
  };

  document.getElementById('smart-attack').onclick = () => toggleAttack();
  document.getElementById('exynos-minimize').onclick = () => document.getElementById('exynos-body').classList.toggle('minimized');

  let isDragging = false, dragOffset = [0, 0];
  const header = document.getElementById('exynos-header');
  header.onmousedown = (e) => { isDragging = true; dragOffset = [gui.offsetLeft - e.clientX, gui.offsetTop - e.clientY]; };
  document.onmousemove = (e) => { if (isDragging) { gui.style.left = (e.clientX + dragOffset[0]) + 'px'; gui.style.top = (e.clientY + dragOffset[1]) + 'px'; } };
  document.onmouseup = () => isDragging = false;

  window.addEventListener('keydown', e => {
      if (e.key.toLowerCase() === 'q' && !waveInterval) toggleAttack();
      if (e.key.toLowerCase() === 'e' && waveInterval) toggleAttack(true);
  });

  updateGUI();
  updatePresetsUI();
})();
