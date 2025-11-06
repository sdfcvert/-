// ===== ゲーム状態管理 =====
const GameState = {
    MENU: 'menu',
    ATTACK: 'attack',
    DODGE: 'dodge',
    DIALOG: 'dialog',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// ===== ゲームデータ =====
const game = {
    state: GameState.MENU,
    player: {
        name: 'FRISK',
        hp: 20,
        maxHp: 20,
        x: 285,
        y: 70,
        speed: 3,
        invulnerable: false,
        invulnerableTime: 0
    },
    boss: {
        name: 'EVIL BOSS',
        hp: 500,
        maxHp: 500,
        attackPower: 5,
        defense: 5,
        canSpare: false,
        mercy: 0,
        turnCount: 0,
        dialogues: [
            "* The evil boss blocks your way!",
            "* The boss laughs menacingly!",
            "* The boss prepares a powerful attack!",
            "* The boss seems weakened...",
            "* The boss is desperate!",
            "* You feel determination..."
        ]
    },
    items: {
        pie: { name: 'Butterscotch Pie', heal: 99, used: false },
        steak: { name: 'Glamburger', heal: 30, used: false },
        candy: { name: 'Monster Candy', heal: 10, used: false },
        water: { name: 'Water Sausage', heal: 5, used: false }
    },
    acts: {
        check: { name: 'Check', used: false },
        talk: { name: 'Talk', used: false },
        encourage: { name: 'Encourage', used: false },
        threaten: { name: 'Threaten', used: false }
    },
    bullets: [],
    keys: {},
    attackSliderPos: 0,
    attackSliderSpeed: 4,
    attackSliderDirection: 1
};

// ===== DOM要素 =====
const elements = {
    battleBox: document.getElementById('battle-box'),
    canvas: document.getElementById('battle-canvas'),
    playerHeart: document.getElementById('player-heart'),
    playerHpFill: document.getElementById('player-hp-fill'),
    playerHpText: document.getElementById('player-hp-text'),
    bossHpFill: document.getElementById('boss-hp-fill'),
    bossHp: document.getElementById('boss-hp'),
    dialogBox: document.getElementById('dialog-box'),
    dialogText: document.getElementById('dialog-text'),
    menu: document.getElementById('menu'),
    subMenu: document.getElementById('sub-menu'),
    itemMenu: document.getElementById('item-menu'),
    mercyMenu: document.getElementById('mercy-menu'),
    attackBarContainer: document.getElementById('attack-bar-container'),
    attackSlider: document.getElementById('attack-slider'),
    gameOver: document.getElementById('game-over'),
    victory: document.getElementById('victory'),
    bossSprite: document.getElementById('boss-sprite')
};

const ctx = elements.canvas.getContext('2d');

// ===== 初期化 =====
function init() {
    // メニューボタン
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', () => handleMenuAction(btn.dataset.action));
    });

    // ACTサブメニュー
    document.querySelectorAll('.sub-menu-btn').forEach(btn => {
        btn.addEventListener('click', () => handleActAction(btn.dataset.act));
    });

    // アイテムメニュー
    document.querySelectorAll('.item-btn').forEach(btn => {
        btn.addEventListener('click', () => handleItemAction(btn.dataset.item, parseInt(btn.dataset.heal)));
    });

    // MERCYメニュー
    document.querySelectorAll('.mercy-btn').forEach(btn => {
        btn.addEventListener('click', () => handleMercyAction(btn.dataset.mercy));
    });

    // キーボード入力
    document.addEventListener('keydown', (e) => {
        game.keys[e.key] = true;

        // 攻撃フェーズでスペースキー
        if (game.state === GameState.ATTACK && e.key === ' ') {
            handleAttackTiming();
        }
    });

    document.addEventListener('keyup', (e) => {
        game.keys[e.key] = false;
    });

    // Continue button
    document.getElementById('continue-btn').addEventListener('click', resetGame);

    // ハートの初期位置
    updateHeartPosition();

    // ゲーム開始
    showDialog("* The evil boss blocks your way!", () => {
        game.state = GameState.MENU;
    });

    gameLoop();
}

// ===== メニューアクション =====
function handleMenuAction(action) {
    if (game.state !== GameState.MENU) return;

    hideAllMenus();

    switch (action) {
        case 'fight':
            startAttackPhase();
            break;
        case 'act':
            elements.subMenu.classList.remove('hidden');
            elements.battleBox.style.display = 'none';
            break;
        case 'item':
            elements.itemMenu.classList.remove('hidden');
            elements.battleBox.style.display = 'none';
            updateItemMenu();
            break;
        case 'mercy':
            elements.mercyMenu.classList.remove('hidden');
            elements.battleBox.style.display = 'none';
            break;
    }
}

// ===== FIGHT フェーズ =====
function startAttackPhase() {
    game.state = GameState.ATTACK;
    elements.battleBox.style.display = 'none';
    elements.attackBarContainer.classList.remove('hidden');
    game.attackSliderPos = 0;
    game.attackSliderDirection = 1;
}

function updateAttackSlider() {
    if (game.state !== GameState.ATTACK) return;

    game.attackSliderPos += game.attackSliderSpeed * game.attackSliderDirection;

    if (game.attackSliderPos >= 496) {
        game.attackSliderDirection = -1;
    } else if (game.attackSliderPos <= 0) {
        game.attackSliderDirection = 1;
    }

    elements.attackSlider.style.left = game.attackSliderPos + 'px';
}

function handleAttackTiming() {
    // タイミングの精度を計算（中央の40px幅がターゲット）
    const targetCenter = 250;
    const targetWidth = 40;
    const distance = Math.abs(game.attackSliderPos - targetCenter);

    let damageMultiplier = 0;
    if (distance < targetWidth / 2) {
        // パーフェクト！
        damageMultiplier = 2.0;
        showDamageText('CRITICAL!', game.boss.attackPower * damageMultiplier);
    } else if (distance < targetWidth) {
        // グッド
        damageMultiplier = 1.5;
        showDamageText('GOOD!', game.boss.attackPower * damageMultiplier);
    } else if (distance < targetWidth * 2) {
        // 普通
        damageMultiplier = 1.0;
        showDamageText('HIT!', game.boss.attackPower * damageMultiplier);
    } else {
        // ミス
        damageMultiplier = 0.3;
        showDamageText('MISS...', game.boss.attackPower * damageMultiplier);
    }

    const damage = Math.floor((game.boss.attackPower + 10) * damageMultiplier);
    game.boss.hp = Math.max(0, game.boss.hp - damage);
    updateBossHp();

    // ボスのダメージフラッシュ
    elements.bossSprite.classList.add('damage-flash');
    setTimeout(() => elements.bossSprite.classList.remove('damage-flash'), 600);

    elements.attackBarContainer.classList.add('hidden');

    // 勝利チェック
    if (game.boss.hp <= 0) {
        showVictory();
        return;
    }

    // ボスのターン
    setTimeout(() => {
        startBossTurn();
    }, 1000);
}

function showDamageText(text, damage) {
    const damageDiv = document.createElement('div');
    damageDiv.textContent = `${text} ${Math.floor(damage)}`;
    damageDiv.style.position = 'absolute';
    damageDiv.style.top = '120px';
    damageDiv.style.left = '50%';
    damageDiv.style.transform = 'translateX(-50%)';
    damageDiv.style.fontSize = '16px';
    damageDiv.style.color = damage > 15 ? '#ff0' : '#fff';
    damageDiv.style.fontFamily = "'Press Start 2P', monospace";
    damageDiv.style.textShadow = '2px 2px #000';
    damageDiv.style.zIndex = '100';
    damageDiv.style.animation = 'healEffect 1s ease-out forwards';

    document.getElementById('game-container').appendChild(damageDiv);

    setTimeout(() => damageDiv.remove(), 1000);
}

// ===== ACT システム =====
function handleActAction(actType) {
    if (game.acts[actType].used && actType !== 'talk') return;

    hideAllMenus();
    game.acts[actType].used = true;

    let dialogMessage = '';
    let mercyIncrease = 0;

    switch (actType) {
        case 'check':
            dialogMessage = `* EVIL BOSS - ATK ${game.boss.attackPower} DEF ${game.boss.defense}\n* A terrifying foe that shows no mercy...`;
            mercyIncrease = 10;
            break;
        case 'talk':
            const talks = [
                "* You try to reason with the boss.\n* It doesn't seem to care...",
                "* You tell the boss about determination.\n* It looks slightly confused.",
                "* You compliment the boss's attacks.\n* It seems flattered!"
            ];
            dialogMessage = talks[game.boss.turnCount % talks.length];
            mercyIncrease = 15;
            break;
        case 'encourage':
            dialogMessage = "* You encourage the boss to give up.\n* Its DEFENSE decreased!";
            game.boss.defense = Math.max(0, game.boss.defense - 2);
            mercyIncrease = 20;
            break;
        case 'threaten':
            dialogMessage = "* You threaten the boss.\n* It becomes more aggressive!";
            game.boss.attackPower += 2;
            mercyIncrease = 5;
            break;
    }

    game.boss.mercy += mercyIncrease;
    if (game.boss.mercy >= 100) {
        game.boss.canSpare = true;
    }

    showDialog(dialogMessage, () => {
        startBossTurn();
    });
}

// ===== ITEM システム =====
function handleItemAction(itemType, heal) {
    if (game.items[itemType].used) return;

    hideAllMenus();
    game.items[itemType].used = true;

    const oldHp = game.player.hp;
    game.player.hp = Math.min(game.player.maxHp, game.player.hp + heal);
    const actualHeal = game.player.hp - oldHp;

    updatePlayerHp();

    // ヒールエフェクト
    showHealEffect(actualHeal);

    showDialog(`* You ate the ${game.items[itemType].name}.\n* You recovered ${actualHeal} HP!`, () => {
        startBossTurn();
    });
}

function updateItemMenu() {
    document.querySelectorAll('.item-btn').forEach(btn => {
        const itemType = btn.dataset.item;
        if (game.items[itemType].used) {
            btn.classList.add('used');
            btn.disabled = true;
        }
    });
}

function showHealEffect(amount) {
    const healText = document.createElement('div');
    healText.className = 'heal-text';
    healText.textContent = `+${amount}`;
    healText.style.left = '100px';
    healText.style.top = '280px';

    document.getElementById('game-container').appendChild(healText);

    setTimeout(() => healText.remove(), 1000);
}

// ===== MERCY システム =====
function handleMercyAction(mercyType) {
    hideAllMenus();

    if (mercyType === 'spare') {
        if (game.boss.canSpare) {
            showDialog("* You spared the boss.\n* It thanks you and leaves...", () => {
                showVictory();
            });
        } else {
            showDialog("* The boss refuses to be spared!\n* Keep trying...", () => {
                startBossTurn();
            });
        }
    } else if (mercyType === 'flee') {
        showDialog("* You can't escape from a boss fight!", () => {
            startBossTurn();
        });
    }
}

// ===== ボスのターン =====
function startBossTurn() {
    game.boss.turnCount++;

    const dialogues = [
        "* The boss prepares an attack!",
        "* The boss's eyes glow red!",
        "* The boss summons dark energy!",
        "* The boss grins wickedly!",
        "* You feel your sins crawling on your back..."
    ];

    showDialog(dialogues[game.boss.turnCount % dialogues.length], () => {
        startDodgePhase();
    });
}

// ===== 回避フェーズ =====
function startDodgePhase() {
    game.state = GameState.DODGE;
    elements.dialogBox.style.display = 'none';
    elements.battleBox.style.display = 'block';
    game.bullets = [];

    // プレイヤーをボックス中央に
    game.player.x = 285;
    game.player.y = 70;
    updateHeartPosition();

    // ランダムな攻撃パターンを選択
    const patterns = [
        createHorizontalBullets,
        createVerticalBullets,
        createCircularBullets,
        createRandomBullets,
        createWaveBullets,
        createSpiralBullets
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    pattern();

    // 3秒後に終了
    setTimeout(() => {
        endDodgePhase();
    }, 3000);
}

function endDodgePhase() {
    game.state = GameState.MENU;
    game.bullets = [];
    elements.battleBox.style.display = 'block';
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

    // 次のターン
    setTimeout(() => {
        game.state = GameState.MENU;
    }, 500);
}

// ===== 弾幕パターン =====
function createHorizontalBullets() {
    const rows = 3;
    for (let i = 0; i < rows; i++) {
        setTimeout(() => {
            game.bullets.push({
                x: -10,
                y: 20 + i * 40,
                width: 15,
                height: 15,
                vx: 3 + Math.random(),
                vy: 0,
                color: '#fff'
            });
            game.bullets.push({
                x: 580,
                y: 30 + i * 40,
                width: 15,
                height: 15,
                vx: -(3 + Math.random()),
                vy: 0,
                color: '#fff'
            });
        }, i * 400);
    }
}

function createVerticalBullets() {
    const cols = 5;
    for (let i = 0; i < cols; i++) {
        setTimeout(() => {
            game.bullets.push({
                x: 50 + i * 100,
                y: -10,
                width: 15,
                height: 15,
                vx: 0,
                vy: 2 + Math.random(),
                color: '#ff8800'
            });
        }, i * 300);
    }
}

function createCircularBullets() {
    const count = 12;
    const centerX = 285;
    const centerY = 70;

    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        game.bullets.push({
            x: centerX + Math.cos(angle) * 80,
            y: centerY + Math.sin(angle) * 40,
            width: 12,
            height: 12,
            vx: Math.cos(angle) * 2,
            vy: Math.sin(angle) * 2,
            color: '#ff00ff'
        });
    }
}

function createRandomBullets() {
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const side = Math.floor(Math.random() * 4);
            let x, y, vx, vy;

            switch(side) {
                case 0: // top
                    x = Math.random() * 570;
                    y = -10;
                    vx = (Math.random() - 0.5) * 2;
                    vy = 2 + Math.random();
                    break;
                case 1: // right
                    x = 580;
                    y = Math.random() * 140;
                    vx = -(2 + Math.random());
                    vy = (Math.random() - 0.5) * 2;
                    break;
                case 2: // bottom
                    x = Math.random() * 570;
                    y = 150;
                    vx = (Math.random() - 0.5) * 2;
                    vy = -(2 + Math.random());
                    break;
                case 3: // left
                    x = -10;
                    y = Math.random() * 140;
                    vx = 2 + Math.random();
                    vy = (Math.random() - 0.5) * 2;
                    break;
            }

            game.bullets.push({
                x, y,
                width: 12,
                height: 12,
                vx, vy,
                color: '#00ff00'
            });
        }, i * 150);
    }
}

function createWaveBullets() {
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            game.bullets.push({
                x: -10,
                y: 70,
                width: 15,
                height: 15,
                vx: 3,
                vy: 0,
                wave: true,
                waveOffset: i * 0.5,
                color: '#00ffff'
            });
        }, i * 300);
    }
}

function createSpiralBullets() {
    const centerX = 285;
    const centerY = 70;
    let angle = 0;

    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const radius = 10 + i * 3;
            game.bullets.push({
                x: centerX,
                y: centerY,
                width: 10,
                height: 10,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                color: '#ffff00'
            });
            angle += 0.5;
        }, i * 100);
    }
}

// ===== ダイアログシステム =====
function showDialog(text, callback) {
    game.state = GameState.DIALOG;
    elements.dialogBox.style.display = 'block';
    elements.battleBox.style.display = 'none';
    elements.dialogText.textContent = '';

    let index = 0;
    const typewriterInterval = setInterval(() => {
        if (index < text.length) {
            elements.dialogText.textContent += text[index];
            index++;
        } else {
            clearInterval(typewriterInterval);
            setTimeout(() => {
                elements.dialogBox.style.display = 'none';
                if (callback) callback();
            }, 1500);
        }
    }, 30);
}

// ===== ゲームループ =====
function gameLoop() {
    // 攻撃スライダーの更新
    if (game.state === GameState.ATTACK) {
        updateAttackSlider();
    }

    // 回避フェーズの更新
    if (game.state === GameState.DODGE) {
        updateDodgePhase();
    }

    requestAnimationFrame(gameLoop);
}

function updateDodgePhase() {
    // プレイヤーの移動
    if (game.keys['ArrowLeft'] || game.keys['a']) {
        game.player.x = Math.max(10, game.player.x - game.player.speed);
    }
    if (game.keys['ArrowRight'] || game.keys['d']) {
        game.player.x = Math.min(560, game.player.x + game.player.speed);
    }
    if (game.keys['ArrowUp'] || game.keys['w']) {
        game.player.y = Math.max(10, game.player.y - game.player.speed);
    }
    if (game.keys['ArrowDown'] || game.keys['s']) {
        game.player.y = Math.min(130, game.player.y + game.player.speed);
    }

    updateHeartPosition();

    // 弾の更新
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

    for (let i = game.bullets.length - 1; i >= 0; i--) {
        const bullet = game.bullets[i];

        // 波動弾の特殊な動き
        if (bullet.wave) {
            bullet.y = 70 + Math.sin(bullet.x * 0.05 + bullet.waveOffset) * 30;
        }

        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // 画面外の弾を削除
        if (bullet.x < -50 || bullet.x > 620 || bullet.y < -50 || bullet.y > 190) {
            game.bullets.splice(i, 1);
            continue;
        }

        // 弾を描画
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // 当たり判定（無敵時間でなければ）
        if (!game.player.invulnerable && checkCollision(bullet)) {
            takeDamage(game.boss.attackPower);
        }
    }

    // 無敵時間の更新
    if (game.player.invulnerable) {
        game.player.invulnerableTime--;
        if (game.player.invulnerableTime <= 0) {
            game.player.invulnerable = false;
            elements.playerHeart.style.opacity = '1';
        } else {
            // 点滅エフェクト
            elements.playerHeart.style.opacity = game.player.invulnerableTime % 10 < 5 ? '0.3' : '1';
        }
    }
}

function checkCollision(bullet) {
    const heartSize = 16;
    return (
        game.player.x < bullet.x + bullet.width &&
        game.player.x + heartSize > bullet.x &&
        game.player.y < bullet.y + bullet.height &&
        game.player.y + heartSize > bullet.y
    );
}

function takeDamage(damage) {
    game.player.hp = Math.max(0, game.player.hp - damage);
    game.player.invulnerable = true;
    game.player.invulnerableTime = 30; // 約0.5秒

    updatePlayerHp();

    // ダメージエフェクト
    elements.playerHeart.classList.add('damage-flash');
    setTimeout(() => elements.playerHeart.classList.remove('damage-flash'), 200);

    // ゲームオーバーチェック
    if (game.player.hp <= 0) {
        showGameOver();
    }
}

// ===== UI更新 =====
function updateHeartPosition() {
    elements.playerHeart.style.left = game.player.x + 'px';
    elements.playerHeart.style.top = game.player.y + 'px';
}

function updatePlayerHp() {
    const percentage = (game.player.hp / game.player.maxHp) * 100;
    elements.playerHpFill.style.width = percentage + '%';
    elements.playerHpText.textContent = `${game.player.hp} / ${game.player.maxHp}`;

    // HPが低いと赤くなる
    if (percentage < 30) {
        elements.playerHpFill.style.background = '#ff0000';
    } else {
        elements.playerHpFill.style.background = '#ffff00';
    }
}

function updateBossHp() {
    const percentage = (game.boss.hp / game.boss.maxHp) * 100;
    elements.bossHpFill.style.width = percentage + '%';
    elements.bossHp.textContent = game.boss.hp;
}

// ===== ユーティリティ =====
function hideAllMenus() {
    elements.subMenu.classList.add('hidden');
    elements.itemMenu.classList.add('hidden');
    elements.mercyMenu.classList.add('hidden');
    elements.attackBarContainer.classList.add('hidden');
}

function showGameOver() {
    game.state = GameState.GAME_OVER;
    elements.gameOver.classList.remove('hidden');
}

function showVictory() {
    game.state = GameState.VICTORY;
    elements.victory.classList.remove('hidden');
}

function resetGame() {
    // ゲーム状態をリセット
    game.player.hp = game.player.maxHp;
    game.boss.hp = game.boss.maxHp;
    game.boss.turnCount = 0;
    game.boss.mercy = 0;
    game.boss.canSpare = false;
    game.boss.attackPower = 5;
    game.boss.defense = 5;
    game.bullets = [];

    // アイテムとACTをリセット
    Object.keys(game.items).forEach(key => {
        game.items[key].used = false;
    });
    Object.keys(game.acts).forEach(key => {
        game.acts[key].used = false;
    });

    // UI更新
    updatePlayerHp();
    updateBossHp();
    updateItemMenu();

    elements.gameOver.classList.add('hidden');
    elements.victory.classList.add('hidden');

    // ゲーム再開
    showDialog("* The evil boss blocks your way!", () => {
        game.state = GameState.MENU;
    });
}

// ===== ゲーム開始 =====
init();
