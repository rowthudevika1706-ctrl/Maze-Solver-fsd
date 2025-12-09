let inputCanvas = document.getElementById("mazeCanvas");
let solvedCanvas = document.getElementById("solvedCanvas");
let inputCtx = inputCanvas.getContext("2d");
let solvedCtx = solvedCanvas.getContext("2d");

let mazeMatrix = [], animationInterval, animationIndex = 0;
let currentPath = [], pathCoordinates = [];
let animationPaused = false;

const bgm = document.getElementById("bgm");
const stepCounter = document.getElementById("stepCounter");

document.getElementById("upload-btn").addEventListener("click", () => {
  document.getElementById("mazeInput").click();
});

document.getElementById("mazeInput").addEventListener("change", function (e) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      inputCanvas.width = img.width;
      inputCanvas.height = img.height;
      solvedCanvas.width = img.width;
      solvedCanvas.height = img.height;
      inputCtx.drawImage(img, 0, 0);
      solvedCtx.drawImage(img, 0, 0);
      extractMaze();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
});

function extractMaze() {
  let imgData = inputCtx.getImageData(0, 0, inputCanvas.width, inputCanvas.height).data;
  mazeMatrix = [];
  for (let y = 0; y < inputCanvas.height; y++) {
    let row = [];
    for (let x = 0; x < inputCanvas.width; x++) {
      let i = (y * inputCanvas.width + x) * 4;
      let avg = (imgData[i] + imgData[i+1] + imgData[i+2]) / 3;
      row.push(avg > 128 ? 1 : 0);
    }
    mazeMatrix.push(row);
  }

  document.getElementById("uploaded-maze").style.display = "block";
  document.getElementById("solve-btn").style.display = "inline-block";
}

document.getElementById("solve-btn").addEventListener("click", () => {
  const start = [1, 1];
  const end = [mazeMatrix.length - 2, mazeMatrix[0].length - 2];
  const path = bfs(start, end);

  if (path) {
    currentPath = path;
    pathCoordinates.length = 0;
    path.forEach(([y, x]) => pathCoordinates.push({ x, y }));
    animationIndex = 0;
    animationPaused = false;
    stepCounter.textContent = "Step: 0";
    document.getElementById("solved-maze-container").style.display = "block";
    animatePath();
    bgm.volume = parseFloat(document.getElementById("bgmVolume").value);
    bgm.play();

    document.getElementById("download-btn").style.display = "inline-block";
    document.getElementById("export-png-btn").style.display = "inline-block";
    document.getElementById("reset-btn").style.display = "inline-block";
    document.getElementById("animation-controls").style.display = "block";
  } else {
    alert("No path found!");
  }
});

function animatePath() {
  clearInterval(animationInterval);
  const speed = 101 - parseInt(document.getElementById("speedRange").value);
  const color = document.getElementById("colorPicker").value || "#ff0000";

  animationInterval = setInterval(() => {
    if (!animationPaused && animationIndex < currentPath.length) {
      const { x, y } = pathCoordinates[animationIndex];
      solvedCtx.fillStyle = color;
      solvedCtx.fillRect(x, y, 1, 1);

      animationIndex++;
      stepCounter.textContent = `Step:${animationIndex}`;

      if (animationIndex >= currentPath.length) {
        clearInterval(animationInterval);
        bgm.pause();
        bgm.currentTime = 0;
      }
    }
  }, speed);
}

document.getElementById("speedRange").addEventListener("input", () => {
  if (!animationPaused) animatePath();
});
document.getElementById("colorPicker").addEventListener("change", () => {
  if (!animationPaused) animatePath();
});
document.getElementById("toggleAnimation").addEventListener("click", function () {
  animationPaused = !animationPaused;
  this.textContent = animationPaused ? "Play" : "Pause";
  if (!animationPaused) animatePath();
});
document.getElementById("bgmVolume").addEventListener("input", function () {
  bgm.volume = parseFloat(this.value);
});
document.getElementById("export-png-btn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "solved_maze.png";
  link.href = solvedCanvas.toDataURL("image/png");
  link.click();
});
document.getElementById("download-btn").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.addImage(solvedCanvas.toDataURL("image/png"), 'PNG', 10, 10, 180, 180);
  pdf.save("solved_maze.pdf");
});
document.getElementById("reset-btn").addEventListener("click", () => {
  clearInterval(animationInterval);
  inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
  solvedCtx.clearRect(0, 0, solvedCanvas.width, solvedCanvas.height);
  currentPath = [];
  animationIndex = 0;
  animationPaused = false;
  document.getElementById("mazeInput").value = "";
  document.getElementById("uploaded-maze").style.display = "none";
  document.getElementById("solved-maze-container").style.display = "none";
  document.getElementById("solve-btn").style.display = "none";
  document.getElementById("download-btn").style.display = "none";
  document.getElementById("export-png-btn").style.display = "none";
  document.getElementById("reset-btn").style.display = "none";
  document.getElementById("animation-controls").style.display = "none";
  stepCounter.textContent = "Step: 0";
  bgm.pause();
  bgm.currentTime = 0;
});

function bfs(start, end) {
  let queue = [start], visited = new Set(), prev = {};
  visited.add(start.toString());

  while (queue.length) {
    let [y, x] = queue.shift();
    if (y === end[0] && x === end[1]) break;
    for (let [dy, dx] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      let ny = y + dy, nx = x + dx;
      if (mazeMatrix[ny]?.[nx] === 1 && !visited.has([ny, nx].toString())) {
        queue.push([ny, nx]);
        visited.add([ny, nx].toString());
        prev[[ny, nx]] = [y, x];
      }
    }
  }

  let path = [], curr = end;
  while (curr && curr.toString() !== start.toString()) {
    path.push(curr);
    curr = prev[curr];
  }
  if (curr) {
    path.push(start);
    return path.reverse();
  }
  return null;
}
const clickSound = document.getElementById("clickSound");

document.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    clickSound.currentTime = 0; // Reset for rapid clicks
    clickSound.play();
  });
});