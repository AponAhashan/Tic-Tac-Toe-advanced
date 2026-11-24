// Screens
const homeScreen = document.getElementById("homeScreen");
const modeScreen = document.getElementById("modeScreen");
const difficultyScreen = document.getElementById("difficultyScreen");
const gameScreen = document.getElementById("gameScreen");

// Menu Buttons
const startBtn = document.getElementById("startBtn");
const pvpModeBtn = document.getElementById("pvpModeBtn");
const aiModeBtn = document.getElementById("aiModeBtn");
const backToHomeBtn = document.getElementById("backToHomeBtn");
const easyModeBtn = document.getElementById("easyModeBtn");
const hardModeBtn = document.getElementById("hardModeBtn");
const backToModeBtn = document.getElementById("backToModeBtn");
const menuBtn = document.getElementById("menuBtn");

// Game Elements
const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("statusText");
const modeBadge = document.getElementById("modeBadge");
const restartBtn = document.getElementById("restartBtn");
const resetScoreBtn = document.getElementById("resetScoreBtn");

const labelX = document.getElementById("labelX");
const labelO = document.getElementById("labelO");
const scoreXEl = document.getElementById("scoreX");
const scoreOEl = document.getElementById("scoreO");
const scoreDrawEl = document.getElementById("scoreDraw");

const HUMAN_PLAYER = "X";
const AI_PLAYER = "O";

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = HUMAN_PLAYER;
let isGameActive = true;
let isAIThinking = false;

let gameMode = "pvp"; // "pvp" | "ai"
let aiDifficulty = "easy"; // "easy" | "hard"

let scores = {
  X: 0,
  O: 0,
  draw: 0
};

const winningConditions = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

// Screen Navigation Helper
function showScreen(targetScreen) {
  [homeScreen, modeScreen, difficultyScreen, gameScreen].forEach((screen) => {
    screen.classList.add("hidden");
  });
  targetScreen.classList.remove("hidden");
}

// Start Game with Selected Settings
function startGame(mode, difficulty = "easy") {
  gameMode = mode;
  aiDifficulty = difficulty;

  if (gameMode === "ai") {
    labelX.textContent = "You (X)";
    labelO.textContent = "Computer (O)";
    modeBadge.textContent = `Vs AI (${difficulty.toUpperCase()})`;
  } else {
    labelX.textContent = "Player X";
    labelO.textContent = "Player O";
    modeBadge.textContent = "1 vs 1";
  }

  resetScore();
  showScreen(gameScreen);
}

// Menu Event Listeners
startBtn.addEventListener("click", () => showScreen(modeScreen));
backToHomeBtn.addEventListener("click", () => showScreen(homeScreen));

pvpModeBtn.addEventListener("click", () => startGame("pvp"));
aiModeBtn.addEventListener("click", () => showScreen(difficultyScreen));

backToModeBtn.addEventListener("click", () => showScreen(modeScreen));
easyModeBtn.addEventListener("click", () => startGame("ai", "easy"));
hardModeBtn.addEventListener("click", () => startGame("ai", "hard"));

menuBtn.addEventListener("click", () => {
  isAIThinking = false;
  showScreen(homeScreen);
});

// Gameplay Logic
function handleCellClick(event) {
  const cell = event.target;
  const index = Number(cell.dataset.index);

  if (board[index] !== "" || !isGameActive || isAIThinking) {
    return;
  }

  if (gameMode === "ai" && currentPlayer === AI_PLAYER) {
    return;
  }

  makeMove(index, currentPlayer);

  if (isGameActive && gameMode === "ai" && currentPlayer === AI_PLAYER) {
    triggerAIMove();
  }
}

function makeMove(index, player) {
  board[index] = player;
  const cell = cells[index];
  cell.textContent = player;
  cell.classList.add(player.toLowerCase());
  cell.disabled = true;

  evaluateBoard(player);
}

function getWinningCombo(targetBoard) {
  for (const condition of winningConditions) {
    const [a, b, c] = condition;
    if (
      targetBoard[a] &&
      targetBoard[a] === targetBoard[b] &&
      targetBoard[a] === targetBoard[c]
    ) {
      return condition;
    }
  }
  return null;
}

function isBoardFull(targetBoard) {
  return !targetBoard.includes("");
}

function evaluateBoard(lastPlayer) {
  const wonCombo = getWinningCombo(board);

  if (wonCombo) {
    isGameActive = false;
    scores[lastPlayer]++;
    updateScoreboard();
    highlightWinningCells(wonCombo);
    disableAllCells();

    if (gameMode === "ai" && lastPlayer === AI_PLAYER) {
      statusText.textContent = "Computer (O) Wins!";
    } else if (gameMode === "ai" && lastPlayer === HUMAN_PLAYER) {
      statusText.textContent = "You (X) Win!";
    } else {
      statusText.textContent = `Player ${lastPlayer} Wins!`;
    }
    return;
  }

  if (isBoardFull(board)) {
    isGameActive = false;
    scores.draw++;
    updateScoreboard();
    statusText.textContent = "It's a Draw!";
    return;
  }

  currentPlayer = currentPlayer === HUMAN_PLAYER ? AI_PLAYER : HUMAN_PLAYER;
  updateTurnStatus();
}

function updateTurnStatus() {
  if (gameMode === "ai") {
    statusText.textContent =
      currentPlayer === HUMAN_PLAYER ? "Your Turn (X)" : "Computer is thinking...";
  } else {
    statusText.textContent = `Player ${currentPlayer}'s Turn`;
  }
}

function triggerAIMove() {
  isAIThinking = true;
  updateTurnStatus();

  setTimeout(() => {
    if (!isGameActive || gameMode !== "ai") {
      isAIThinking = false;
      return;
    }

    const moveIndex =
      aiDifficulty === "hard" ? getBestMoveMinimax() : getRandomMove();

    isAIThinking = false;

    if (moveIndex !== -1 && board[moveIndex] === "") {
      makeMove(moveIndex, AI_PLAYER);
    }
  }, 320);
}

function getRandomMove() {
  const availableIndices = board
    .map((val, idx) => (val === "" ? idx : -1))
    .filter((idx) => idx !== -1);

  if (availableIndices.length === 0) return -1;
  const randomIdx = Math.floor(Math.random() * availableIndices.length);
  return availableIndices[randomIdx];
}

function getBestMoveMinimax() {
  const emptyCount = board.filter((val) => val === "").length;
  if (emptyCount === 9) return 4;

  let bestScore = -Infinity;
  let bestMove = -1;

  for (let i = 0; i < board.length; i++) {
    if (board[i] === "") {
      board[i] = AI_PLAYER;
      const score = minimax(board, 0, false);
      board[i] = "";

      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }

  return bestMove;
}

function minimax(tempBoard, depth, isMaximizing) {
  const winnerCombo = getWinningCombo(tempBoard);
  if (winnerCombo) {
    const winner = tempBoard[winnerCombo[0]];
    if (winner === AI_PLAYER) return 10 - depth;
    if (winner === HUMAN_PLAYER) return depth - 10;
  }

  if (isBoardFull(tempBoard)) {
    return 0;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < tempBoard.length; i++) {
      if (tempBoard[i] === "") {
        tempBoard[i] = AI_PLAYER;
        const score = minimax(tempBoard, depth + 1, false);
        tempBoard[i] = "";
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < tempBoard.length; i++) {
      if (tempBoard[i] === "") {
        tempBoard[i] = HUMAN_PLAYER;
        const score = minimax(tempBoard, depth + 1, true);
        tempBoard[i] = "";
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

function highlightWinningCells(combo) {
  combo.forEach((index) => {
    cells[index].classList.add("win");
  });
}

function disableAllCells() {
  cells.forEach((cell) => {
    cell.disabled = true;
  });
}

function updateScoreboard() {
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
  scoreDrawEl.textContent = scores.draw;
}

function restartRound() {
  isAIThinking = false;
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = HUMAN_PLAYER;
  isGameActive = true;
  updateTurnStatus();

  cells.forEach((cell) => {
    cell.textContent = "";
    cell.disabled = false;
    cell.classList.remove("x", "o", "win");
  });
}

function resetScore() {
  scores = { X: 0, O: 0, draw: 0 };
  updateScoreboard();
  restartRound();
}

cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
restartBtn.addEventListener("click", restartRound);
resetScoreBtn.addEventListener("click", resetScore);