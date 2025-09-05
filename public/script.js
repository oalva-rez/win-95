// Clock functionality
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    document.getElementById("clock").textContent =
        hours + ":" + minutesStr + " " + ampm;
}

updateClock();
setInterval(updateClock, 60000);

// Start menu toggle
const startBtn = document.getElementById("startBtn");
const startMenu = document.getElementById("startMenu");

startBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    startMenu.classList.toggle("active");
});

// Close start menu when clicking outside
document.addEventListener("click", function () {
    startMenu.classList.remove("active");
});

startMenu.addEventListener("click", function (e) {
    e.stopPropagation();
});

// My Computer icon click feedback
document.querySelector(".desktop-icon").addEventListener("click", function () {
    // Visual feedback only - no actual window opens
});

const audio = document.getElementById("audioPlayer");
const video = document.getElementById("videoPlayer");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");
const currentTimeEl = document.getElementById("currentTime");
const totalTimeEl = document.getElementById("totalTime");
const volumeSlider = document.getElementById("volumeSlider");
const volumeTrack = document.getElementById("volumeTrack");
const displayArea = document.getElementById("displayArea");
const trackName = document.getElementById("trackName");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let audioContext;
let analyser;
let source;
let dataArray;
let animationId;

// Initialize visualizer
function initVisualizer() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = 64;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    }
}

// Resize canvas
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Visualizer animation
function drawVisualizer() {
    animationId = requestAnimationFrame(drawVisualizer);

    if (!analyser) return;

    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / dataArray.length) * 2;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Classic green gradient with transparency for overlay effect
        const intensity = dataArray[i] / 255;
        const green = Math.floor(255 * intensity);
        const red = Math.floor(100 * intensity);
        ctx.fillStyle = `rgba(${red}, ${green}, 0, 0.8)`;

        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
    }
}

// Get the duration of the longer media file
function getMaxDuration() {
    const audioDuration = audio.duration || 0;
    const videoDuration = video.duration || 0;
    return Math.max(audioDuration, videoDuration);
}

// Get the current time of the primary media (audio)
function getCurrentTime() {
    return audio.currentTime || 0;
}

// Format time
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
}

// Sync video to audio time
function syncMedia() {
    if (Math.abs(video.currentTime - audio.currentTime) > 0.3) {
        video.currentTime = audio.currentTime;
    }
}

// Play button
playBtn.addEventListener("click", () => {
    initVisualizer();

    // Play both audio and video
    const audioPromise = audio.play();
    const videoPromise = video.play();

    Promise.all([audioPromise, videoPromise])
        .then(() => {
            playBtn.style.display = "none";
            pauseBtn.style.display = "flex";
            displayArea.classList.remove("no-audio");
            trackName.textContent = "MoreLikeU.mp3 + MoreLikeU_Vizualizer.mp4";
            drawVisualizer();
        })
        .catch(() => {
            // If video fails to load, still play audio
            audio.play();
            playBtn.style.display = "none";
            pauseBtn.style.display = "flex";
            displayArea.classList.remove("no-audio");
            trackName.textContent = "MoreLikeU.mp3 + MoreLikeU_Vizualizer.mp4";
            drawVisualizer();
        });
});

// Pause button
pauseBtn.addEventListener("click", () => {
    audio.pause();
    video.pause();
    pauseBtn.style.display = "none";
    playBtn.style.display = "flex";
    cancelAnimationFrame(animationId);
});

// Stop button
stopBtn.addEventListener("click", () => {
    audio.pause();
    video.pause();
    audio.currentTime = 0;
    video.currentTime = 0;
    pauseBtn.style.display = "none";
    playBtn.style.display = "flex";
    progressFill.style.width = "0%";
    currentTimeEl.textContent = "00:00";
    cancelAnimationFrame(animationId);

    // Clear visualizer
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Update progress
audio.addEventListener("timeupdate", () => {
    const maxDuration = getMaxDuration();
    if (maxDuration) {
        const progress = (getCurrentTime() / maxDuration) * 100;
        progressFill.style.width = progress + "%";
        currentTimeEl.textContent = formatTime(getCurrentTime());
    }

    // Sync video with audio
    syncMedia();
});

// Set duration when both media files are loaded
function updateDuration() {
    const maxDuration = getMaxDuration();
    if (maxDuration) {
        totalTimeEl.textContent = formatTime(maxDuration);
    }
}

audio.addEventListener("loadedmetadata", updateDuration);
video.addEventListener("loadedmetadata", updateDuration);

// Progress bar click
progressBar.addEventListener("click", (e) => {
    const maxDuration = getMaxDuration();
    if (maxDuration) {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * maxDuration;
        audio.currentTime = newTime;
        video.currentTime = newTime;
    }
});

// Volume control (affects audio only, video stays muted)
volumeSlider.addEventListener("click", (e) => {
    const rect = volumeSlider.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.volume = Math.max(0, Math.min(1, percent));
    volumeTrack.style.background = `linear-gradient(to right, #000080 0%, #000080 ${
        percent * 100
    }%, #c0c0c0 ${percent * 100}%, #c0c0c0 100%)`;
});

// Audio ended
audio.addEventListener("ended", () => {
    video.pause();
    pauseBtn.style.display = "none";
    playBtn.style.display = "flex";
    cancelAnimationFrame(animationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Video ended
video.addEventListener("ended", () => {
    // Don't stop audio if video ends first
    if (audio.ended || audio.currentTime >= audio.duration) {
        audio.pause();
        pauseBtn.style.display = "none";
        playBtn.style.display = "flex";
        cancelAnimationFrame(animationId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
});

// Previous/Next buttons (seek by 10 seconds)
document.getElementById("prevBtn").addEventListener("click", () => {
    const newTime = Math.max(0, getCurrentTime() - 10);
    audio.currentTime = newTime;
    video.currentTime = newTime;
});

document.getElementById("nextBtn").addEventListener("click", () => {
    const maxDuration = getMaxDuration();
    const newTime = Math.min(maxDuration, getCurrentTime() + 10);
    audio.currentTime = newTime;
    video.currentTime = newTime;
});

function suppressVideoControls() {
    const video = document.getElementById("videoPlayer");

    // Remove controls attribute completely
    video.removeAttribute("controls");

    // Prevent context menu
    video.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        return false;
    });

    // Prevent double-click fullscreen
    video.addEventListener("dblclick", function (e) {
        e.preventDefault();
        return false;
    });

    // Prevent any click events that might trigger controls
    video.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // Prevent focus that might show controls
    video.addEventListener("focus", function (e) {
        e.preventDefault();
        video.blur();
    });

    // Suppress controls on any media events
    const mediaEvents = [
        "loadstart",
        "loadeddata",
        "loadedmetadata",
        "canplay",
        "canplaythrough",
        "play",
        "playing",
        "pause",
        "ended",
        "seeking",
        "seeked",
        "timeupdate",
        "volumechange",
        "ratechange",
        "durationchange",
        "progress",
    ];

    mediaEvents.forEach((eventType) => {
        video.addEventListener(eventType, function () {
            video.removeAttribute("controls");
            // Force hide any controls that might appear
            if (video.controls) {
                video.controls = false;
            }
        });
    });

    // Continuously ensure controls stay hidden
    setInterval(() => {
        if (video.controls) {
            video.controls = false;
        }
        video.removeAttribute("controls");
    }, 100);
}

// Call this function after the DOM is loaded
document.addEventListener("DOMContentLoaded", suppressVideoControls);

// Also call it when the video is ready
document
    .getElementById("videoPlayer")
    .addEventListener("loadedmetadata", suppressVideoControls);

// Function to handle mobile Safari viewport issues
function handleMobileSafariViewport() {
    // Set CSS custom property for dynamic viewport height
    function updateViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);

        // Also set a specific height for the desktop
        const desktop = document.querySelector(".desktop");
        if (desktop) {
            desktop.style.height = `${window.innerHeight}px`;
        }

        // Ensure taskbar stays at bottom
        const taskbar = document.querySelector(".taskbar");
        if (taskbar) {
            taskbar.style.bottom = "0px";
            taskbar.style.position = "fixed";
        }
    }

    // Update on initial load
    updateViewportHeight();

    // Update on resize (when Safari interface appears/disappears)
    window.addEventListener("resize", updateViewportHeight);

    // Update on orientation change
    window.addEventListener("orientationchange", () => {
        setTimeout(updateViewportHeight, 100);
    });

    // For iOS Safari specifically - handle scroll events
    let ticking = false;
    function handleScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateViewportHeight();
                ticking = false;
            });
            ticking = true;
        }
    }

    // Only add scroll listener on mobile devices
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        window.addEventListener("scroll", handleScroll, { passive: true });

        // Also listen for touch events that might trigger Safari UI changes
        document.addEventListener(
            "touchstart",
            () => {
                setTimeout(updateViewportHeight, 300);
            },
            { passive: true }
        );
    }

    // Force update after a short delay (helps with initial load)
    setTimeout(updateViewportHeight, 500);
}

// Function to prevent scrolling on mobile (keeps desktop fixed)
function preventMobileScroll() {
    // Prevent pull-to-refresh and other scroll behaviors
    document.body.addEventListener(
        "touchstart",
        function (e) {
            if (e.touches.length === 1) {
                // Prevent default only if not interacting with controls
                const target = e.target;
                const isControl = target.closest(
                    ".control-button, .progress-bar, .volume-slider, .start-button, .menu-item"
                );
                if (!isControl) {
                    // Only prevent if at the top or bottom of scroll
                    const scrollTop =
                        window.pageYOffset ||
                        document.documentElement.scrollTop;
                    const scrollHeight = document.documentElement.scrollHeight;
                    const clientHeight = document.documentElement.clientHeight;

                    if (
                        scrollTop === 0 ||
                        scrollTop === scrollHeight - clientHeight
                    ) {
                        e.preventDefault();
                    }
                }
            }
        },
        { passive: false }
    );

    // Prevent overscroll
    document.body.addEventListener(
        "touchmove",
        function (e) {
            const target = e.target;
            const isScrollable = target.closest(
                ".desktop-area, .start-menu-items"
            );
            if (!isScrollable) {
                e.preventDefault();
            }
        },
        { passive: false }
    );
}

// Initialize mobile Safari fixes
document.addEventListener("DOMContentLoaded", function () {
    handleMobileSafariViewport();
    preventMobileScroll();
});

// Also run when page is fully loaded
window.addEventListener("load", function () {
    handleMobileSafariViewport();
});

document.addEventListener("DOMContentLoaded", function () {
    // --- Window elements ---
    const wmpWindow = document.getElementById("wmpWindow");
    const btnMinimize = document.getElementById("btnMinimize");
    const btnMaxRestore = document.getElementById("btnMaxRestore");
    const btnClose = document.getElementById("btnClose");
    const taskbarApps = document.getElementById("taskbarApps");
    const desktopLauncher = document.getElementById("desktopLauncher");

    // Keep a single task button reference
    let wmpTaskButton = null;
    // Track whether we are maximized
    let isMaximized = false;

    // Create the taskbar button once
    function ensureTaskButton() {
        if (wmpTaskButton) return wmpTaskButton;
        const btn = document.createElement("button");
        btn.className = "task-button";
        btn.type = "button";
        btn.textContent = "Windows Media Player";
        btn.addEventListener("click", () => {
            // Restore if minimized or hidden
            wmpWindow.classList.remove("minimized");
            wmpWindow.style.display = ""; // ensure visible if closed reopened
            focusWindow();
        });
        taskbarApps.appendChild(btn);
        wmpTaskButton = btn;
        return btn;
    }

    // Bring window to front visually
    function focusWindow() {
        // Simple focus by bumping z-index
        wmpWindow.style.zIndex = 1002;
        setTimeout(() => (wmpWindow.style.zIndex = ""), 0);
    }

    // Minimize - hide the window, show task button
    btnMinimize.addEventListener("click", () => {
        ensureTaskButton();
        wmpWindow.classList.add("minimized");
    });

    // Maximize or restore toggle
    btnMaxRestore.addEventListener("click", () => {
        isMaximized = !isMaximized;
        if (isMaximized) {
            wmpWindow.classList.add("maximized");
            btnMaxRestore.textContent = "▢"; // change to restore icon look if you want
        } else {
            wmpWindow.classList.remove("maximized");
            btnMaxRestore.textContent = "□";
        }
        focusWindow();
    });

    // Close - stop playback and hide window
    btnClose.addEventListener("click", () => {
        console.log("Close button clicked");
        try {
            audio.pause();
            video.pause();
            audio.currentTime = 0;
            video.currentTime = 0;
        } catch {}
        wmpWindow.classList.remove("maximized", "minimized");
        wmpWindow.style.display = "none";
        // Keep task button if you want quick reopen, or remove it if you want it gone
        // Here we keep it for quick relaunch
        ensureTaskButton();
    });
});

(function () {
    const wmpWindow = document.querySelector(".media-player-window");
    const btns = Array.from(
        document.querySelectorAll(".title-bar-buttons .title-bar-button")
    );
    if (!wmpWindow || btns.length < 3) return;

    // map buttons: prefer data-action, else fall back to order
    const byAction = Object.create(null);
    btns.forEach((b, i) => {
        const act = b.dataset && b.dataset.action;
        if (act) byAction[act] = b;
    });
    const btnMin = byAction.min || btns[0];
    const btnMax = byAction.maxrestore || btns[1];
    const btnClose = byAction.close || btns[2];

    // simple state
    let isMaximized = false;
    let taskBtn = null;
    const taskbarApps = document.getElementById("taskbarApps");

    function ensureTaskBtn() {
        if (taskBtn || !taskbarApps) return taskBtn;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "task-button";
        b.textContent = "Windows Media Player";
        addPress(b, () => {
            wmpWindow.style.display = "";
            wmpWindow.classList.remove("minimized");
            focusWin();
        });
        taskbarApps.appendChild(b);
        taskBtn = b;
        return b;
    }

    function focusWin() {
        wmpWindow.style.zIndex = 1002;
        setTimeout(() => (wmpWindow.style.zIndex = ""), 0);
    }

    // unified press helper for iOS + desktop
    function addPress(el, handler) {
        let touched = false;

        function run(e) {
            e.stopPropagation();
            e.preventDefault();
            handler(e);
        }

        el.addEventListener(
            "touchend",
            (e) => {
                touched = true;
                run(e);
            },
            { passive: false }
        );

        el.addEventListener("click", (e) => {
            // ignore the click that follows a touch on some browsers
            if (touched) {
                touched = false;
                return;
            }
            run(e);
        });
    }

    // stop drag handlers on the title bar from eating taps on buttons
    btns.forEach((b) => {
        ["touchstart", "touchmove"].forEach((type) => {
            b.addEventListener(type, (e) => e.stopPropagation(), {
                passive: false,
            });
        });
    });

    // actions
    addPress(btnMin, () => {
        ensureTaskBtn();
        wmpWindow.classList.add("minimized"); // ensure CSS sets display none for this class
    });

    addPress(btnMax, () => {
        isMaximized = !isMaximized;
        wmpWindow.classList.toggle("maximized", isMaximized);
        // swap glyph if you like
        if (!btnMax.dataset.action)
            btnMax.textContent = isMaximized ? "▢" : "□";
        focusWin();
    });

    addPress(btnClose, () => {
        // stop media if available, but do not crash if not present
        try {
            const audio = document.querySelector("audio");
            const video = document.querySelector("video");
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        } catch {}
        wmpWindow.classList.remove("maximized", "minimized");
        wmpWindow.style.display = "none";
        ensureTaskBtn(); // keep for quick reopen
    });

    // optional: make a desktop icon reopen it if you have one
    const desktopLauncher = document.getElementById("desktopLauncher");
    if (desktopLauncher) {
        addPress(desktopLauncher, () => {
            wmpWindow.style.display = "";
            wmpWindow.classList.remove("minimized");
            focusWin();
            ensureTaskBtn();
        });
    }
})();
