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

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / dataArray.length) * 2;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Classic green gradient
        const intensity = dataArray[i] / 255;
        const green = Math.floor(255 * intensity);
        const red = Math.floor(100 * intensity);
        ctx.fillStyle = `rgb(${red}, ${green}, 0)`;

        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
    }
}

// Format time
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
}

// Play button
playBtn.addEventListener("click", () => {
    initVisualizer();
    audio.play();
    playBtn.style.display = "none";
    pauseBtn.style.display = "flex";
    displayArea.classList.remove("no-audio");
    trackName.textContent = "Loaded Track - MoreLikeU.mp3";
    drawVisualizer();
});

// Pause button
pauseBtn.addEventListener("click", () => {
    audio.pause();
    pauseBtn.style.display = "none";
    playBtn.style.display = "flex";
    cancelAnimationFrame(animationId);
});

// Stop button
stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    pauseBtn.style.display = "none";
    playBtn.style.display = "flex";
    progressFill.style.width = "0%";
    currentTimeEl.textContent = "00:00";
    cancelAnimationFrame(animationId);

    // Clear visualizer
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});

// Update progress
audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = progress + "%";
        currentTimeEl.textContent = formatTime(audio.currentTime);
    }
});

// Set duration
audio.addEventListener("loadedmetadata", () => {
    totalTimeEl.textContent = formatTime(audio.duration);
});

// Progress bar click
progressBar.addEventListener("click", (e) => {
    if (audio.duration) {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * audio.duration;
    }
});

// Volume control
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
    pauseBtn.style.display = "none";
    playBtn.style.display = "flex";
    cancelAnimationFrame(animationId);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});

// Previous/Next buttons (non-functional but provide feedback)
document.getElementById("prevBtn").addEventListener("click", () => {
    audio.currentTime = Math.max(0, audio.currentTime - 10);
});

document.getElementById("nextBtn").addEventListener("click", () => {
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
});
