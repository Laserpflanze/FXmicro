// ==UserScript==
// @run-at       document-start
// @name         Vkij V7 - GUI Fix
// @description  Automation with Fixed GUI Syntax
// @match        *://*/*
// @grant        none
// ==/UserScript==

(() => {
    const tickLength = 557.675225; // [cite: 1]
    const keyPressAdvance = 200;   // [cite: 1]
    let timers = []; // [cite: 1]
    let isRunning = false; // [cite: 2]

    const openingPatternTicks = [
        { cycle: 0, tick: 7.0, keys: "r", percent: 20.80078125 }, // [cite: 2]
        { cycle: 0, tick: 9.1, keys: "t", percent: 17.87109375 }, // [cite: 2]
        { cycle: 1, tick: 6.8, keys: "z", percent: 16.50390625 }, // [cite: 2]
        { cycle: 1, tick: 8.2, keys: "u", percent: 38.18359375 }, // [cite: 3]
        { cycle: 2, tick: 5.9, keys: "i", percent: 18.84765625 }, // [cite: 3]
        { cycle: 2, tick: 7.3, keys: "o", percent: 19.3359375 },  // [cite: 3]
        { cycle: 2, tick: 8.0, keys: ".", percent: 38.96484375 }, // [cite: 3]
        { cycle: 2, tick: 9.4, keys: "ü", percent: 45.8984375 },  // [cite: 3]
        { cycle: 3, tick: 6.4, keys: "+", percent: 0.09765625 }, // [cite: 4]
        { cycle: 3, tick: 7.1, keys: "j", percent: 47.36328125 }, // [cite: 4]
        { cycle: 3, tick: 8.5, keys: "k", percent: 36.328125 },   // [cite: 4]
        { cycle: 3, tick: 9.2, keys: "l", percent: 89.0625 },     // [cite: 4]
        { cycle: 4, tick: 6.2, keys: "ö", percent: 28.80859375 }, // [cite: 4]
        { cycle: 4, tick: 7.6, keys: "ä", percent: 24.0234375 },  // [cite: 5]
        { cycle: 4, tick: 8.3, keys: "#", percent: 32.03125 },   // [cite: 5]
        { cycle: 4, tick: 9.0, keys: "y", percent: 72.4609375 },  // [cite: 5]
    ];

    const openingPattern = openingPatternTicks.map(o => ({
        delay: o.cycle * 10 * tickLength + o.tick * tickLength, // [cite: 6]
        keys: o.keys, // [cite: 6]
        percent: o.percent // [cite: 6]
    }));

    // --- GUI Logic ---
    function createGUI() {
        const gui = document.createElement('div');
        Object.assign(gui.style, {
            position: 'fixed', top: '10px', right: '10px', zIndex: '10000',
            background: '#111', color: '#0f0', padding: '10px', border: '2px solid #333',
            fontFamily: 'monospace', borderRadius: '5px', width: '150px'
        });

        gui.innerHTML = `
            <div style="font-weight:bold; border-bottom:1px solid #333; margin-bottom:5px;">Vkij V7</div>
            <div id="gui-status" style="color:red">STOPPED</div>
            <div id="gui-body">
                <button id="gui-start" style="width:100%; margin-top:5px;">START (T)</button>
                <button id="gui-stop" style="width:100%; margin-top:5px;">STOP (P)</button>
            </div>
            <button id="gui-min" style="width:100%; margin-top:5px; font-size:9px;">MINIMIZE</button>
        `;
        document.body.appendChild(gui);

        const statusEl = gui.querySelector('#gui-status');
        const bodyEl = gui.querySelector('#gui-body');

        gui.querySelector('#gui-start').onclick = startScript;
        gui.querySelector('#gui-stop').onclick = stopScript;
        gui.querySelector('#gui-min').onclick = () => {
            bodyEl.style.display = bodyEl.style.display === 'none' ? 'block' : 'none';
        };

        // UI Syncing
        window.addEventListener("keydown", (e) => {
            if (e.key.toLowerCase() === "t") { statusEl.innerText = "RUNNING"; statusEl.style.color = "lime"; }
            if (e.key.toLowerCase() === "p") { statusEl.innerText = "STOPPED"; statusEl.style.color = "red"; }
        });
    }

    // --- Original Logic ---
    function dispatchKey(target, type, key) {
        const event = new KeyboardEvent(type, { key, code: `Key${key.toUpperCase()}`, bubbles: true, cancelable: true }); // [cite: 7]
        target.dispatchEvent(event); // [cite: 8]
    }

    function simulateKeysSequence(keys) {
        const target = document.activeElement || document.body; // [cite: 8, 9]
        let i = 0;
        function next() {
            if (i < keys.length) {
                dispatchKey(target, "keydown", keys[i]); // [cite: 10]
                dispatchKey(target, "keyup", keys[i]); // [cite: 10]
                i++;
                setTimeout(next, 0); // [cite: 10]
            }
        }
        next();
    }

    function simulateSend(percent) {
        const event = new KeyboardEvent("keydown", { key: " ", code: "Space", bubbles: true, cancelable: true }); // [cite: 11]
        document.dispatchEvent(event); // [cite: 12]
        console.log(`[SEND] ${percent}%`); // [cite: 12]
    }

    function runStep(index) {
        if (index >= openingPattern.length || !isRunning) return; // [cite: 12]
        const { delay, keys, percent } = openingPattern[index]; // [cite: 13]

        timers.push(setTimeout(() => {
            if (!isRunning) return;
            if (keys.length > 0) simulateKeysSequence(keys); // [cite: 13]
        }, delay - keyPressAdvance)); // [cite: 13]

        timers.push(setTimeout(() => {
            if (!isRunning) return;
            simulateSend(percent); // [cite: 14]
        }, delay)); // [cite: 14]
    }

    function startScript() {
        if (isRunning) return; // [cite: 15]
        isRunning = true; // [cite: 15]
        timers = []; // [cite: 16]
        for (let i = 0; i < openingPattern.length; i++) runStep(i); // [cite: 16]
    }

    function stopScript() {
        timers.forEach(t => clearTimeout(t)); // [cite: 17]
        timers = []; // [cite: 17]
        isRunning = false; // [cite: 18]
    }

    window.addEventListener("keydown", e => {
        const key = e.key.toLowerCase(); // [cite: 18]
        if (key === "t") startScript(); // [cite: 18]
        if (key === "p") stopScript(); // [cite: 18]
    });

    if (document.readyState === "complete") createGUI();
    else window.addEventListener("load", createGUI);

    console.log("[SCRIPT] Ready."); // [cite: 19]
})();
