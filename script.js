const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
const levelCounter = document.getElementById("level-counter");
const restartBtn = document.getElementById("restartBtn");

let cols, rows, cellSize;
let grid = [];
let current;
let stack = [];
let player = { x: 0, y: 0 };
let level = 1;
const maxLevel = 100;

let confettiTimer;

// Responsive canvas
function resizeCanvas() {
  canvas.width = window.innerWidth - 20;  // Adjusting to fit within the screen
  canvas.height = window.innerHeight - 20;
  generateMaze();
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function Cell(i, j) {
  this.i = i;
  this.j = j;
  this.walls = [true, true, true, true]; // top, right, bottom, left
  this.visited = false;

  this.checkNeighbors = function () {
    let neighbors = [];
    const top = grid[index(i, j - 1)];
    const right = grid[index(i + 1, j)];
    const bottom = grid[index(i, j + 1)];
    const left = grid[index(i - 1, j)];

    if (top && !top.visited) neighbors.push(top);
    if (right && !right.visited) neighbors.push(right);
    if (bottom && !bottom.visited) neighbors.push(bottom);
    if (left && !left.visited) neighbors.push(left);

    if (neighbors.length > 0) {
      return neighbors[Math.floor(Math.random() * neighbors.length)];
    }
    return undefined;
  };

  this.show = function () {
    let x = this.i * cellSize;
    let y = this.j * cellSize;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;

    if (this.walls[0]) drawLine(x, y, x + cellSize, y); // top
    if (this.walls[1]) drawLine(x + cellSize, y, x + cellSize, y + cellSize); // right
    if (this.walls[2]) drawLine(x + cellSize, y + cellSize, x, y + cellSize); // bottom
    if (this.walls[3]) drawLine(x, y + cellSize, x, y); // left
  };
}

function drawLine(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function index(i, j) {
  if (i < 0 || j < 0 || i >= cols || j >= rows) return -1;
  return i + j * cols;
}

function generateMaze() {
  grid = [];
  stack = [];

  // Calculate the number of columns and rows based on the canvas size
  cols = Math.floor(canvas.width / 20);  // 20px per cell
  rows = Math.floor(canvas.height / 20);  // 20px per cell
  cellSize = Math.min(canvas.width / cols, canvas.height / rows);  // Dynamic cell size to fit the screen

  // Create the grid of cells
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      grid.push(new Cell(i, j));
    }
  }

  current = grid[0];
  player = { x: 0, y: 0 };

  // Define the finish position (bottom-right corner)
  grid[cols * rows - 1].finish = true;

  mazeLoop();
}

function removeWalls(a, b) {
  let x = a.i - b.i;
  let y = a.j - b.j;

  if (x === 1) {
    a.walls[3] = false;
    b.walls[1] = false;
  } else if (x === -1) {
    a.walls[1] = false;
    b.walls[3] = false;
  }

  if (y === 1) {
    a.walls[0] = false;
    b.walls[2] = false;
  } else if (y === -1) {
    a.walls[2] = false;
    b.walls[0] = false;
  }
}

function mazeLoop() {
  const interval = setInterval(() => {
    current.visited = true;
    const next = current.checkNeighbors();

    if (next) {
      stack.push(current);
      removeWalls(current, next);
      current = next;
    } else if (stack.length > 0) {
      current = stack.pop();
    } else {
      clearInterval(interval);
      drawMaze();
      drawPlayer();
    }
    drawMaze();
  }, 10);
}

function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  grid.forEach(cell => cell.show());
  drawFinish();
  drawPlayer();
}

function drawPlayer() {
  const r = cellSize / 3;
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(
    player.x * cellSize + cellSize / 2,
    player.y * cellSize + cellSize / 2,
    r,
    0,
    2 * Math.PI
  );
  ctx.fill();
}

function drawFinish() {
  const finishCell = grid[cols * rows - 1];  // Bottom-right corner
  const x = finishCell.i * cellSize;
  const y = finishCell.j * cellSize;

  ctx.fillStyle = "green";  // Finish point color
  ctx.fillRect(x + 5, y + 5, cellSize - 10, cellSize - 10);  // Draw finish box inside the cell
}

function movePlayer(dx, dy) {
  const indexFrom = index(player.x, player.y);
  const cell = grid[indexFrom];
  if (!cell) return;

  let nx = player.x + dx;
  let ny = player.y + dy;

  // Prevent player from moving off the map
  if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;

  const indexTo = index(nx, ny);
  const nextCell = grid[indexTo];
  if (!nextCell) return;

  if (dx === -1 && !cell.walls[3]) player.x--;
  else if (dx === 1 && !cell.walls[1]) player.x++;
  else if (dy === -1 && !cell.walls[0]) player.y--;
  else if (dy === 1 && !cell.walls[2]) player.y++;

  drawMaze();

  // Check if player reached the finish
  if (player.x === cols - 1 && player.y === rows - 1) {
    if (level === maxLevel) {
      setTimeout(() => {
        playWinSound();
        startConfetti();
      }, 300); // Add slight delay for effect
    } else {
      level++;
      levelCounter.textContent = "Level: " + level;
      generateMaze();
    }
  }
}

function playWinSound() {
  const audio = new Audio("https://www.soundjay.com/button/beep-07.wav"); // You can replace this URL with your own sound
  audio.play();
}

// Confetti function
function startConfetti() {
  const confettiCanvas = document.createElement("canvas");
  document.body.appendChild(confettiCanvas);
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  const confettiCtx = confettiCanvas.getContext("2d");

  const particles = [];
  for (let i = 0; i < 200; i++) {
    particles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height,
      r: Math.random() * 5 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      speedX: Math.random() * 4 - 2,
      speedY: Math.random() * 4 + 2,
      opacity: 1,
    });
  }

  function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    particles.forEach(particle => {
      confettiCtx.beginPath();
      confettiCtx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      confettiCtx.fillStyle = particle.color;
      confettiCtx.fill();

      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.opacity -= 0.01;

      if (particle.opacity <= 0) {
        particle.opacity = 1;
        particle.x = Math.random() * confettiCanvas.width;
        particle.y = 0;
      }
    });

    if (!confettiTimer) {
      confettiTimer = requestAnimationFrame(animateConfetti);
    }
  }

  animateConfetti();
}

// Restart Game
restartBtn.addEventListener("click", () => {
  level = 1;
  levelCounter.textContent = "Level: 1";
  document.body.removeChild(confettiCanvas); // Remove confetti canvas
  cancelAnimationFrame(confettiTimer); // Stop confetti animation
  generateMaze();
});

generateMaze();

// Add event listener for WASD movement
document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "w": // Move up
      movePlayer(0, -1);
      break;
    case "a": // Move left
      movePlayer(-1, 0);
      break;
    case "s": // Move down
      movePlayer(0, 1);
      break;
    case "d": // Move right
      movePlayer(1, 0);
      break;
  }
});
