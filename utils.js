// ==UserScript==
// @run-at       document-start
// @name         Echo is Goated Vkij V7 - GUI Edition
// @description  Attack automation for Vkij V7 with a toggleable GUI
// @namespace    http://tampermonkey.net/
// @version      1.1
// @match        *://*/*
// @grant        none
// ==/UserScript==

(() => {
    const tickLength = 557.675225; [cite: 1]
    const keyPressAdvance = 200;   [cite: 1]
    let timers = []; [cite: 1]
    let isRunning = false; [cite: 2]

    const openingPatternTicks = [
        { cycle: 0, tick: 7.0, keys: "r", percent: 20.80078125 }, [cite: 2]
        { cycle: 0, tick: 9.1, keys: "t", percent: 17.87109375 }, [cite: 2]
        { cycle: 1, tick: 6.8, keys: "z", percent: 16.50390625 }, [cite: 2]
        { cycle: 1, tick: 8.2, keys: "u", percent: 38.18359375 }, [cite: 3]
        { cycle: 2, tick: 5.9, keys: "i", percent: 18.84765625 }, [cite: 3]
        { cycle: 2, tick: 7.3, keys: "o", percent: 19.3359375 }, [cite: 3]
        { cycle: 2, tick: 8.0, keys: ".", percent: 38.96484375 }, [cite: 3]
        { cycle: 2, tick: 9.4, keys: "ü", percent: 45.8984375 }, [cite: 3]
        { cycle: 3, tick: 6.4, keys: "+", percent: 0.09765625 }, [cite: 4]
        { cycle: 3, tick: 7.1, keys: "j", percent: 47.36328125 }, [cite: 4]
        { cycle: 3, tick: 8.5, keys: "k", percent: 36.328125 }, [cite: 4]
        { cycle: 3, tick: 9.2, keys: "l", percent: 89.0625 }, [cite: 4]
        { cycle: 4, tick: 6.2, keys: "ö", percent: 28.80859375 }, [cite: 4]
        { cycle: 4, tick: 7.6, keys: "ä", percent: 24.0234375 }, [cite: 5]
        { cycle: 4, tick: 8.3, keys: "#", percent: 32.03125 }, [cite: 5]
        { cycle: 4, tick: 9.0, keys: "y", percent: 72.4609375 }, [cite: 5]
    ];

    const openingPattern = openingPatternTicks.map(o => ({
        delay: o.cycle * 10 * tickLength + o.tick * tickLength, [cite: 6]
        keys: o.keys, [cite: 6]
        percent: o.percent [cite: 6]
    }));

    // --- GUI Logic ---
    function createGUI() {
        const gui = document.createElement('div');
        gui.id = 'vkij-gui';
        Object.assign(gui.style, {
            position: 'fixed', top: '20px', right: '20px', zIndex: '9999',
            background: '#222', color: '#fff', padding: '10px', borderRadius: '8px',
            border: '1px solid #444', fontFamily: 'sans-serif', width: '180px', textAlign: 'center'
        });

        gui.innerHTML = `
            <div id="gui-header" style="cursor: move; font-weight: bold; margin-bottom: 8px;">Vkij V7 Control</div>
            <div id="gui-content">
                <div id="status" style="color: #ff4444; margin-bottom: 10px;">Status: STOPPED</div>
                <button id="btn-start" style="width: 100%; margin-bottom: 5px; cursor: pointer;">START (T)</button>
                <button id="btn-stop" style="width: 100%; margin-bottom: 5px; cursor: pointer;">STOP (P)</button>
            </div>
            <button id="btn-minimize" style="font-size: 10px; width: 100%; background: none; color: #888; border: none; cursor: pointer;">MINIMIZE</button>
        `;
        document.body.appendChild(gui);

        // Update UI status
        const updateStatus = (running) => {
            const statusDiv = document.getElementById('status');
            statusDiv.innerText = running ? "Status: RUNNING" : "Status: STOPPED";
            statusDiv.style.color = running ? "#44ff44" : "#ff4444";
        };

        // Event Listeners
        document.getElementById('btn-start').onclick = () => { startScript(); updateStatus(true); };
        document.getElementById('btn-stop').onclick = () => { stopScript(); updateStatus(false); };
        
        let isMinimized = false;
        document.getElementById('btn-minimize').onclick = () => {
            isMinimized = !isMinimized;
            document.getElementById('gui-content').style.display = isMinimized ? 'none' : 'block';
            document.getElementById('btn-minimize').innerText = isMinimized ? 'MAXIMIZE' : 'MINIMIZE';
            gui.style.width = isMinimized ? '100px' : '180px';
        };

        // Sync UI with hotkeys
        window.addEventListener("keydown", e => {
            if (e.key.toLowerCase() === "t") updateStatus(true);
            if (e.key.toLowerCase() === "p") updateStatus(false);
        });
    }

    // --- Original Script Functions ---
    function dispatchKey(target, type, key) {
        const event = new KeyboardEvent(type, {
            key,
            code: `Key${key.toUpperCase()}`, [cite: 7]
            bubbles: true,
            cancelable: true
        });
        target.dispatchEvent(event); [cite: 8]
    }

    function simulateKeysSequence(keys) {
        const target = document.activeElement || document.body; [cite: 8, 9]
        let i = 0;
        function next() {
            if (i < keys.length) {
                const key = keys[i]; [cite: 9]
                dispatchKey(target, "keydown", key); [cite: 10]
                dispatchKey(target, "keyup", key); [cite: 10]
                i++;
                setTimeout(next, 0); [cite: 10]
            }
        }
        next();
    }

    function simulateSend(percent) {
        const event = new KeyboardEvent("keydown", {
            key: " ",
            code: "Space",
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event); [cite: 12]
        console.log(`[SEND] ${percent}%`); [cite: 12]
    }

    function runStep(index) {
        if (index >= openingPattern.length || !isRunning) return; [cite: 12]
        const { delay, keys, percent } = openingPattern[index]; [cite: 13]

        timers.push(setTimeout(() => {
            if (!isRunning) return; [cite: 13]
            if (keys.length > 0) simulateKeysSequence(keys); [cite: 13]
        }, delay - keyPressAdvance)); [cite: 13]

        timers.push(setTimeout(() => {
            if (!isRunning) return; [cite: 14]
            simulateSend(percent); [cite: 14]
        }, delay)); [cite: 14]
    }

    function startScript() {
        if (isRunning) return; [cite: 15]
        isRunning = true; [cite: 15]
        timers = []; [cite: 16]
        console.log("[SCRIPT] Starting Vkij V7 opening..."); [cite: 16]
        for (let i = 0; i < openingPattern.length; i++) runStep(i); [cite: 16]
    }

    function stopScript() {
        timers.forEach(t => clearTimeout(t)); [cite: 17]
        timers = []; [cite: 17]
        isRunning = false; [cite: 18]
        console.log("[SCRIPT] Attack sequence stopped."); [cite: 18]
    }

    window.addEventListener("keydown", e => {
        const key = e.key.toLowerCase(); [cite: 18]
        if (key === "t") startScript(); [cite: 18]
        if (key === "p") stopScript(); [cite: 18]
    });

    // Wait for DOM to load to create GUI
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createGUI);
    } else {
        createGUI();
    }

    console.log("[SCRIPT] Ready. Press 'T' to launch or 'P' to stop."); [cite: 19]
})();
