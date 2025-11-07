// ===== ゲーム状態 =====
const game = {
    playerAnswer: '',
    aiAnswer: '',
    currentInput: '',
    playerGuesses: [],
    aiGuesses: [],
    playerTurn: true,
    gameOver: false,
    aiThinking: false
};

// ===== DOM要素 =====
const elements = {
    playerInput: document.getElementById('player-input'),
    submitBtn: document.getElementById('submit-btn'),
    clearBtn: document.getElementById('clear-btn'),
    playerHistory: document.getElementById('player-history'),
    aiHistory: document.getElementById('ai-history'),
    aiGuess: document.getElementById('ai-guess'),
    aiMessage: document.getElementById('ai-message'),
    statusMessage: document.getElementById('status-message'),
    resultOverlay: document.getElementById('result-overlay'),
    resultTitle: document.getElementById('result-title'),
    resultMessage: document.getElementById('result-message'),
    playerGuessesCount: document.getElementById('player-guesses'),
    aiGuessesCount: document.getElementById('ai-guesses'),
    playAgainBtn: document.getElementById('play-again-btn'),
    playerTurnIndicator: document.getElementById('player-turn'),
    aiTurnIndicator: document.getElementById('ai-turn')
};

// ===== 初期化 =====
function init() {
    // 答えを生成
    game.playerAnswer = generateNumber();
    game.aiAnswer = generateNumber();

    console.log('Debug - Player Answer:', game.playerAnswer);
    console.log('Debug - AI Answer:', game.aiAnswer);

    // イベントリスナー
    document.querySelectorAll('.num-btn[data-num]').forEach(btn => {
        btn.addEventListener('click', () => handleNumberInput(btn.dataset.num));
    });

    elements.clearBtn.addEventListener('click', clearInput);
    elements.submitBtn.addEventListener('click', submitGuess);
    elements.playAgainBtn.addEventListener('click', resetGame);

    // キーボード入力
    document.addEventListener('keydown', (e) => {
        if (game.gameOver) return;

        if (e.key >= '0' && e.key <= '9') {
            handleNumberInput(e.key);
        } else if (e.key === 'Backspace') {
            clearInput();
        } else if (e.key === 'Enter') {
            submitGuess();
        }
    });

    updateTurnIndicator();
    updatePlayerDisplay(); // 初期表示で最初のdigitをハイライト
    elements.statusMessage.textContent = 'Enter your 4-digit number! (0/4)';
}

// ===== ランダムな4桁の数字を生成 =====
function generateNumber() {
    const digits = [];
    while (digits.length < 4) {
        const digit = Math.floor(Math.random() * 10);
        if (!digits.includes(digit)) {
            digits.push(digit);
        }
    }
    return digits.join('');
}

// ===== 数字入力処理 =====
function handleNumberInput(num) {
    if (game.gameOver || !game.playerTurn || game.aiThinking) return;

    if (game.currentInput.length < 4 && !game.currentInput.includes(num)) {
        game.currentInput += num;
        updatePlayerDisplay();

        if (game.currentInput.length === 4) {
            elements.submitBtn.disabled = false;
            elements.statusMessage.textContent = '✓ Ready! Press Submit or Enter';
            elements.statusMessage.style.color = '#48bb78';
            elements.statusMessage.style.fontWeight = '600';
        } else {
            elements.statusMessage.textContent = `Enter your 4-digit number! (${game.currentInput.length}/4)`;
            elements.statusMessage.style.color = '#4a5568';
            elements.statusMessage.style.fontWeight = '500';
        }
    }
}

function clearInput() {
    game.currentInput = '';
    updatePlayerDisplay();
    elements.submitBtn.disabled = true;

    if (game.playerTurn && !game.gameOver) {
        elements.statusMessage.textContent = 'Enter your 4-digit number! (0/4)';
        elements.statusMessage.style.color = '#4a5568';
        elements.statusMessage.style.fontWeight = '500';
    }
}

function updatePlayerDisplay() {
    const digits = elements.playerInput.querySelectorAll('.digit');
    digits.forEach((digit, index) => {
        if (index < game.currentInput.length) {
            // 入力済み
            digit.textContent = game.currentInput[index];
            digit.classList.remove('inputting');
        } else if (index === game.currentInput.length) {
            // 次に入力する位置
            digit.textContent = '-';
            digit.classList.add('inputting');
        } else {
            // 未入力
            digit.textContent = '-';
            digit.classList.remove('inputting');
        }
    });
}

// ===== 推測を提出 =====
function submitGuess() {
    if (game.currentInput.length !== 4 || game.gameOver || !game.playerTurn) return;

    const result = checkGuess(game.currentInput, game.playerAnswer);
    game.playerGuesses.push({ guess: game.currentInput, ...result });

    addHistoryItem(elements.playerHistory, game.currentInput, result);

    if (result.hit === 4) {
        endGame('player');
        return;
    }

    clearInput();
    game.playerTurn = false;
    updateTurnIndicator();

    elements.statusMessage.textContent = 'AI is thinking...';

    // AIのターン
    setTimeout(() => {
        aiTurn();
    }, 800);
}

// ===== 推測をチェック =====
function checkGuess(guess, answer) {
    let hit = 0;
    let blow = 0;

    for (let i = 0; i < 4; i++) {
        if (guess[i] === answer[i]) {
            hit++;
        } else if (answer.includes(guess[i])) {
            blow++;
        }
    }

    return { hit, blow };
}

// ===== 履歴に追加 =====
function addHistoryItem(container, guess, result) {
    const item = document.createElement('div');
    item.className = 'history-item';

    item.innerHTML = `
        <span class="history-guess">${guess}</span>
        <div class="history-result">
            <span class="result-badge hit-badge">${result.hit}H</span>
            <span class="result-badge blow-badge">${result.blow}B</span>
        </div>
    `;

    container.insertBefore(item, container.firstChild);
}

// ===== AIのターン =====
function aiTurn() {
    game.aiThinking = true;

    // AIの推測ロジック（人間らしく）
    const aiGuess = generateAIGuess();

    // AIの思考メッセージを表示
    showAIThought(aiGuess);

    setTimeout(() => {
        const result = checkGuess(aiGuess, game.aiAnswer);
        game.aiGuesses.push({ guess: aiGuess, ...result });

        // AIの推測を表示
        displayAIGuess(aiGuess);

        setTimeout(() => {
            addHistoryItem(elements.aiHistory, aiGuess, result);

            if (result.hit === 4) {
                endGame('ai');
                return;
            }

            game.playerTurn = true;
            game.aiThinking = false;
            updateTurnIndicator();
            elements.statusMessage.textContent = 'Enter your 4-digit number! (0/4)';
            elements.statusMessage.style.color = '#4a5568';
            elements.statusMessage.style.fontWeight = '500';

            // AIの推測をリセット
            setTimeout(() => {
                const digits = elements.aiGuess.querySelectorAll('.digit');
                digits.forEach(digit => {
                    digit.textContent = '?';
                });
            }, 1000);
        }, 800);
    }, 1000);
}

// ===== AIの推測生成（人間らしいロジック） =====
function generateAIGuess() {
    // 初回は完全にランダム
    if (game.aiGuesses.length === 0) {
        return generateNumber();
    }

    // 前回の結果を基に推測（80%の確率で論理的、20%で少しランダム）
    const useLogic = Math.random() > 0.2;

    if (useLogic && game.aiGuesses.length > 0) {
        const lastGuess = game.aiGuesses[game.aiGuesses.length - 1];

        // ヒットが多い場合、その位置を保持
        if (lastGuess.hit > 0) {
            let newGuess = '';
            const usedDigits = [];

            // 前回の推測の一部を保持（人間らしく完璧ではない）
            for (let i = 0; i < 4; i++) {
                if (Math.random() > 0.3) { // 70%の確率で保持
                    newGuess += lastGuess.guess[i];
                    usedDigits.push(lastGuess.guess[i]);
                } else {
                    // 新しい数字を追加
                    let digit;
                    do {
                        digit = Math.floor(Math.random() * 10).toString();
                    } while (usedDigits.includes(digit) || newGuess.includes(digit));
                    newGuess += digit;
                    usedDigits.push(digit);
                }
            }

            // 重複チェック
            const uniqueDigits = new Set(newGuess);
            if (uniqueDigits.size === 4) {
                return newGuess;
            }
        }
    }

    // ランダムな推測（論理が使えない場合や20%の確率）
    return generateNumber();
}

// ===== AIの思考メッセージ =====
function showAIThought(guess) {
    const messages = [
        "Hmm, let me analyze...",
        "Interesting pattern...",
        "I think I'm getting close...",
        "Let me try this one...",
        "Based on the previous results...",
        "This should work...",
        "Let me calculate...",
        "I have a hunch..."
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    elements.aiMessage.textContent = randomMessage;
}

// ===== AIの推測を表示 =====
function displayAIGuess(guess) {
    const digits = elements.aiGuess.querySelectorAll('.digit');
    digits.forEach((digit, index) => {
        setTimeout(() => {
            digit.textContent = guess[index];
            digit.style.animation = 'none';
            setTimeout(() => {
                digit.style.animation = '';
            }, 10);
        }, index * 150);
    });
}

// ===== ターンインジケーターを更新 =====
function updateTurnIndicator() {
    if (game.playerTurn) {
        elements.playerTurnIndicator.classList.add('active');
        elements.aiTurnIndicator.classList.remove('active');
    } else {
        elements.playerTurnIndicator.classList.remove('active');
        elements.aiTurnIndicator.classList.add('active');
    }
}

// ===== ゲーム終了 =====
function endGame(winner) {
    game.gameOver = true;

    elements.playerGuessesCount.textContent = game.playerGuesses.length;
    elements.aiGuessesCount.textContent = game.aiGuesses.length;

    if (winner === 'player') {
        elements.resultTitle.textContent = '🎉 You Win!';
        elements.resultTitle.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
        elements.resultTitle.style.webkitBackgroundClip = 'text';
        elements.resultTitle.style.webkitTextFillColor = 'transparent';
        elements.resultMessage.textContent = `Congratulations! You found the number in ${game.playerGuesses.length} ${game.playerGuesses.length === 1 ? 'guess' : 'guesses'}!`;
    } else {
        elements.resultTitle.textContent = '🤖 AI Wins!';
        elements.resultTitle.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        elements.resultTitle.style.webkitBackgroundClip = 'text';
        elements.resultTitle.style.webkitTextFillColor = 'transparent';
        elements.resultMessage.textContent = `The AI found the number in ${game.aiGuesses.length} ${game.aiGuesses.length === 1 ? 'guess' : 'guesses'}. Better luck next time!`;
    }

    setTimeout(() => {
        elements.resultOverlay.classList.remove('hidden');
    }, 500);
}

// ===== ゲームリセット =====
function resetGame() {
    game.playerAnswer = generateNumber();
    game.aiAnswer = generateNumber();
    game.currentInput = '';
    game.playerGuesses = [];
    game.aiGuesses = [];
    game.playerTurn = true;
    game.gameOver = false;
    game.aiThinking = false;

    console.log('Debug - Player Answer:', game.playerAnswer);
    console.log('Debug - AI Answer:', game.aiAnswer);

    elements.playerHistory.innerHTML = '';
    elements.aiHistory.innerHTML = '';
    elements.resultOverlay.classList.add('hidden');
    elements.statusMessage.textContent = 'Enter your 4-digit number! (0/4)';
    elements.statusMessage.style.color = '#4a5568';
    elements.statusMessage.style.fontWeight = '500';

    clearInput();
    updateTurnIndicator();
    updatePlayerDisplay(); // 初期表示で最初のdigitをハイライト

    // AIの表示をリセット
    const aiDigits = elements.aiGuess.querySelectorAll('.digit');
    aiDigits.forEach(digit => {
        digit.textContent = '?';
    });

    elements.aiMessage.textContent = 'Let me think...';
}

// ===== ゲーム開始 =====
init();
