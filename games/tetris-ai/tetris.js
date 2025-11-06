// ===== テトリミノの定義 =====
const TETROMINOS = {
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#00f0f0'
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#f0f000'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#a000f0'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: '#00f000'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: '#f00000'
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#0000f0'
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#f0a000'
    }
};

// ===== 定数 =====
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const INITIAL_SPEED = 1000;
const SPEED_INCREASE = 50;

// ===== ゲーム状態 =====
let gameState = {
    isPlaying: false,
    isPaused: false,
    soundEnabled: true
};

// ===== テトリスゲームクラス =====
class TetrisGame {
    constructor(canvas, nextCanvas, isAI = false) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nextCanvas = nextCanvas;
        this.nextCtx = nextCanvas.getContext('2d');
        this.isAI = isAI;

        this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;

        this.currentPiece = null;
        this.nextPiece = null;
        this.dropCounter = 0;
        this.dropInterval = INITIAL_SPEED;
        this.lastTime = 0;

        this.initNextPiece();
        this.spawnPiece();
    }

    initNextPiece() {
        const pieces = Object.keys(TETROMINOS);
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        this.nextPiece = {
            type: randomPiece,
            shape: TETROMINOS[randomPiece].shape,
            color: TETROMINOS[randomPiece].color,
            x: 0,
            y: 0
        };
    }

    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = {
                ...this.nextPiece,
                x: Math.floor(COLS / 2) - Math.floor(this.nextPiece.shape[0].length / 2),
                y: 0
            };

            this.initNextPiece();

            if (this.collides()) {
                this.gameOver = true;
                return false;
            }
            return true;
        }
        return false;
    }

    collides(piece = this.currentPiece, offsetX = 0, offsetY = 0) {
        const shape = piece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = piece.x + x + offsetX;
                    const newY = piece.y + y + offsetY;

                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return true;
                    }

                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    merge() {
        const shape = this.currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }

    rotate() {
        const piece = this.currentPiece;
        const originalShape = piece.shape;

        // 回転処理
        const newShape = piece.shape[0].map((_, i) =>
            piece.shape.map(row => row[i]).reverse()
        );

        piece.shape = newShape;

        // 壁蹴り処理
        let offset = 0;
        while (this.collides()) {
            piece.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (Math.abs(offset) > piece.shape[0].length) {
                piece.shape = originalShape;
                return false;
            }
        }
        return true;
    }

    moveLeft() {
        if (!this.collides(this.currentPiece, -1, 0)) {
            this.currentPiece.x--;
            return true;
        }
        return false;
    }

    moveRight() {
        if (!this.collides(this.currentPiece, 1, 0)) {
            this.currentPiece.x++;
            return true;
        }
        return false;
    }

    moveDown() {
        if (!this.collides(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            return true;
        }
        return false;
    }

    hardDrop() {
        let dropDistance = 0;
        while (!this.collides(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            dropDistance++;
        }
        this.score += dropDistance * 2;
        this.merge();
        this.clearLines();
        return this.spawnPiece();
    }

    clearLines() {
        let linesCleared = 0;
        const clearedRows = [];

        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                clearedRows.push(y);
                this.board.splice(y, 1);
                this.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++; // 同じ行を再チェック
            }
        }

        if (linesCleared > 0) {
            // スコア計算
            const points = [0, 100, 300, 500, 800];
            this.score += points[linesCleared] * this.level;
            this.lines += linesCleared;

            // レベルアップ
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropInterval = Math.max(100, INITIAL_SPEED - (this.level - 1) * SPEED_INCREASE);
            }

            // エフェクト
            if (!this.isAI) {
                createLineClearEffect(clearedRows, this.canvas);
            }
        }
    }

    update(deltaTime) {
        if (this.gameOver) return;

        this.dropCounter += deltaTime;

        if (this.dropCounter > this.dropInterval) {
            if (!this.moveDown()) {
                this.merge();
                this.clearLines();
                if (!this.spawnPiece()) {
                    this.gameOver = true;
                }
            }
            this.dropCounter = 0;
        }
    }

    draw() {
        // ボードをクリア
        this.ctx.fillStyle = 'rgba(10, 22, 40, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // グリッド線を描画
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * BLOCK_SIZE, 0);
            this.ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            this.ctx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * BLOCK_SIZE);
            this.ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
            this.ctx.stroke();
        }

        // ボードを描画
        this.drawBoard();

        // ゴーストピースを描画
        if (this.currentPiece && !this.isAI) {
            this.drawGhost();
        }

        // 現在のピースを描画
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece);
        }

        // ネクストピースを描画
        this.drawNextPiece();
    }

    drawBoard() {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x], this.ctx);
                }
            }
        }
    }

    drawPiece(piece) {
        const shape = piece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    this.drawBlock(piece.x + x, piece.y + y, piece.color, this.ctx);
                }
            }
        }
    }

    drawGhost() {
        const ghostPiece = { ...this.currentPiece };
        while (!this.collides(ghostPiece, 0, 1)) {
            ghostPiece.y++;
        }

        const shape = ghostPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const drawX = (ghostPiece.x + x) * BLOCK_SIZE;
                    const drawY = (ghostPiece.y + y) * BLOCK_SIZE;

                    this.ctx.strokeStyle = this.currentPiece.color;
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(drawX + 2, drawY + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
                }
            }
        }
    }

    drawBlock(x, y, color, ctx) {
        const drawX = x * BLOCK_SIZE;
        const drawY = y * BLOCK_SIZE;

        // メインの色
        ctx.fillStyle = color;
        ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);

        // ハイライト
        const gradient = ctx.createLinearGradient(drawX, drawY, drawX + BLOCK_SIZE, drawY + BLOCK_SIZE);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);

        // 境界線
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
    }

    drawNextPiece() {
        this.nextCtx.fillStyle = 'rgba(10, 22, 40, 0.9)';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (!this.nextPiece) return;

        const shape = this.nextPiece.shape;
        const offsetX = (this.nextCanvas.width - shape[0].length * BLOCK_SIZE) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * BLOCK_SIZE) / 2;

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const drawX = offsetX + x * BLOCK_SIZE;
                    const drawY = offsetY + y * BLOCK_SIZE;

                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);

                    const gradient = this.nextCtx.createLinearGradient(
                        drawX, drawY, drawX + BLOCK_SIZE, drawY + BLOCK_SIZE
                    );
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
                    this.nextCtx.fillStyle = gradient;
                    this.nextCtx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);

                    this.nextCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
    }

    // AIのための評価関数
    evaluateBoard() {
        let score = 0;
        let holes = 0;
        let bumpiness = 0;
        let heights = [];

        // 各列の高さとホールをカウント
        for (let x = 0; x < COLS; x++) {
            let colHeight = 0;
            let blockFound = false;

            for (let y = 0; y < ROWS; y++) {
                if (this.board[y][x]) {
                    if (!blockFound) {
                        colHeight = ROWS - y;
                        blockFound = true;
                    }
                } else if (blockFound) {
                    holes++;
                }
            }
            heights.push(colHeight);
        }

        // バンプネス（隣接する列の高さの差）を計算
        for (let i = 0; i < heights.length - 1; i++) {
            bumpiness += Math.abs(heights[i] - heights[i + 1]);
        }

        // 集約高さ
        const aggregateHeight = heights.reduce((sum, h) => sum + h, 0);

        // 完成ライン
        let completeLines = 0;
        for (let y = 0; y < ROWS; y++) {
            if (this.board[y].every(cell => cell !== 0)) {
                completeLines++;
            }
        }

        // スコア計算（重みは調整可能）
        score = completeLines * 100 - holes * 50 - bumpiness * 10 - aggregateHeight * 5;

        return score;
    }
}

// ===== AIクラス =====
class TetrisAI {
    constructor(game) {
        this.game = game;
        this.thinkDelay = 100;
        this.lastThink = 0;
    }

    findBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;

        const currentPiece = { ...this.game.currentPiece };

        // すべての回転を試す
        for (let rotation = 0; rotation < 4; rotation++) {
            // すべての位置を試す
            for (let x = -2; x < COLS + 2; x++) {
                const testPiece = {
                    ...currentPiece,
                    shape: JSON.parse(JSON.stringify(currentPiece.shape)),
                    x: x,
                    y: 0
                };

                // 回転を適用
                for (let r = 0; r < rotation; r++) {
                    const newShape = testPiece.shape[0].map((_, i) =>
                        testPiece.shape.map(row => row[i]).reverse()
                    );
                    testPiece.shape = newShape;
                }

                // 衝突チェック
                if (this.game.collides(testPiece, 0, 0)) continue;

                // 落下させる
                while (!this.game.collides(testPiece, 0, 1)) {
                    testPiece.y++;
                }

                // ボードをシミュレート
                const simulatedBoard = JSON.parse(JSON.stringify(this.game.board));
                const shape = testPiece.shape;
                for (let y = 0; y < shape.length; y++) {
                    for (let sx = 0; sx < shape[y].length; sx++) {
                        if (shape[y][sx]) {
                            const boardY = testPiece.y + y;
                            const boardX = testPiece.x + sx;
                            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                                simulatedBoard[boardY][boardX] = testPiece.color;
                            }
                        }
                    }
                }

                // 一時的にボードを置き換えて評価
                const originalBoard = this.game.board;
                this.game.board = simulatedBoard;
                const score = this.game.evaluateBoard();
                this.game.board = originalBoard;

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { rotation, x, y: testPiece.y };
                }
            }
        }

        return bestMove;
    }

    executeMove(move) {
        if (!move) return;

        // 回転
        for (let i = 0; i < move.rotation; i++) {
            this.game.rotate();
        }

        // 横移動
        const targetX = move.x;
        while (this.game.currentPiece.x < targetX) {
            if (!this.game.moveRight()) break;
        }
        while (this.game.currentPiece.x > targetX) {
            if (!this.game.moveLeft()) break;
        }

        // ハードドロップ
        this.game.hardDrop();
    }

    update(deltaTime) {
        if (this.game.gameOver) return;

        this.lastThink += deltaTime;

        if (this.lastThink > this.thinkDelay && this.game.currentPiece) {
            const move = this.findBestMove();
            this.executeMove(move);
            this.lastThink = 0;
        }
    }
}

// ===== エフェクト関数 =====
function createLineClearEffect(rows, canvas) {
    const rect = canvas.getBoundingClientRect();

    rows.forEach(row => {
        for (let i = 0; i < 20; i++) {
            createParticle(
                rect.left + Math.random() * rect.width,
                rect.top + row * BLOCK_SIZE + Math.random() * BLOCK_SIZE
            );
        }
    });
}

function createParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;

    document.getElementById('particleContainer').appendChild(particle);

    setTimeout(() => particle.remove(), 1000);
}

// ===== ゲーム管理 =====
let playerGame, aiGame, aiController;

function initGame() {
    const playerCanvas = document.getElementById('playerCanvas');
    const playerNextCanvas = document.getElementById('playerNextCanvas');
    const aiCanvas = document.getElementById('aiCanvas');
    const aiNextCanvas = document.getElementById('aiNextCanvas');

    playerGame = new TetrisGame(playerCanvas, playerNextCanvas, false);
    aiGame = new TetrisGame(aiCanvas, aiNextCanvas, true);
    aiController = new TetrisAI(aiGame);

    gameState.isPlaying = true;
    gameState.isPaused = false;

    document.getElementById('startButton').style.display = 'none';
    document.getElementById('pauseButton').style.display = 'block';
    document.getElementById('restartButton').style.display = 'none';
}

function gameLoop(currentTime = 0) {
    if (!gameState.isPlaying) return;

    const deltaTime = currentTime - (playerGame.lastTime || 0);
    playerGame.lastTime = currentTime;
    aiGame.lastTime = currentTime;

    if (!gameState.isPaused) {
        // プレイヤーの更新
        if (!playerGame.gameOver) {
            playerGame.update(deltaTime);
        }

        // AIの更新
        if (!aiGame.gameOver) {
            aiGame.update(deltaTime);
            aiController.update(deltaTime);
        }

        // UIの更新
        updateUI();

        // ゲームオーバーチェック
        if (playerGame.gameOver || aiGame.gameOver) {
            handleGameOver();
        }
    }

    // 描画
    playerGame.draw();
    aiGame.draw();

    requestAnimationFrame(gameLoop);
}

function updateUI() {
    document.getElementById('playerScore').textContent = playerGame.score;
    document.getElementById('playerLines').textContent = playerGame.lines;
    document.getElementById('playerLevel').textContent = playerGame.level;

    document.getElementById('aiScore').textContent = aiGame.score;
    document.getElementById('aiLines').textContent = aiGame.lines;
    document.getElementById('aiLevel').textContent = aiGame.level;
}

function handleGameOver() {
    gameState.isPlaying = false;

    const playerOverlay = document.getElementById('playerGameOver');
    const aiOverlay = document.getElementById('aiGameOver');
    const resultText = document.getElementById('resultText');

    if (playerGame.gameOver && aiGame.gameOver) {
        // 引き分け
        if (playerGame.score > aiGame.score) {
            resultText.textContent = 'YOU WIN! 🎉';
            playerOverlay.querySelector('h2').textContent = 'WINNER!';
            playerOverlay.querySelector('h2').style.color = '#00ff00';
        } else if (playerGame.score < aiGame.score) {
            resultText.textContent = 'AI WINS! 🤖';
        } else {
            resultText.textContent = 'DRAW! 🤝';
        }
    } else if (playerGame.gameOver) {
        resultText.textContent = 'AI WINS! 🤖';
        aiOverlay.querySelector('h2').textContent = 'AI WINS!';
        aiOverlay.querySelector('h2').style.color = '#00ff00';
    } else if (aiGame.gameOver) {
        resultText.textContent = 'YOU WIN! 🎉';
        playerOverlay.querySelector('h2').textContent = 'WINNER!';
        playerOverlay.querySelector('h2').style.color = '#00ff00';
    }

    if (playerGame.gameOver) {
        playerOverlay.classList.add('show');
    }
    if (aiGame.gameOver) {
        aiOverlay.classList.add('show');
    }

    document.getElementById('pauseButton').style.display = 'none';
    document.getElementById('restartButton').style.display = 'block';
}

// ===== キーボード入力 =====
document.addEventListener('keydown', (e) => {
    if (!gameState.isPlaying || gameState.isPaused || playerGame.gameOver) return;

    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            playerGame.moveLeft();
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            playerGame.moveRight();
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (playerGame.moveDown()) {
                playerGame.score += 1;
            }
            e.preventDefault();
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            playerGame.rotate();
            e.preventDefault();
            break;
        case ' ':
            playerGame.hardDrop();
            e.preventDefault();
            break;
    }
});

// ===== ボタンイベント =====
document.getElementById('startButton').addEventListener('click', () => {
    initGame();
    requestAnimationFrame(gameLoop);
});

document.getElementById('pauseButton').addEventListener('click', () => {
    gameState.isPaused = !gameState.isPaused;
    document.getElementById('pauseButton').textContent = gameState.isPaused ? 'RESUME' : 'PAUSE';
});

document.getElementById('restartButton').addEventListener('click', () => {
    document.getElementById('playerGameOver').classList.remove('show');
    document.getElementById('aiGameOver').classList.remove('show');
    initGame();
    requestAnimationFrame(gameLoop);
});

document.getElementById('soundToggle').addEventListener('click', (e) => {
    gameState.soundEnabled = !gameState.soundEnabled;
    e.target.textContent = gameState.soundEnabled ? '🔊' : '🔇';
});

// ===== 初期化 =====
window.addEventListener('load', () => {
    // 初期描画
    const playerCanvas = document.getElementById('playerCanvas');
    const playerCtx = playerCanvas.getContext('2d');
    playerCtx.fillStyle = 'rgba(10, 22, 40, 0.9)';
    playerCtx.fillRect(0, 0, playerCanvas.width, playerCanvas.height);

    const aiCanvas = document.getElementById('aiCanvas');
    const aiCtx = aiCanvas.getContext('2d');
    aiCtx.fillStyle = 'rgba(10, 22, 40, 0.9)';
    aiCtx.fillRect(0, 0, aiCanvas.width, aiCanvas.height);
});
