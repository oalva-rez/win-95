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
