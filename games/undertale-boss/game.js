// ===== ゲーム状態管理 =====
const GameState = {
    MENU: 'menu',
    SUB_MENU: 'sub_menu',
    ATTACK: 'attack',
    DODGE: 'dodge',
    DIALOG: 'dialog',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// ===== ゲームデータ =====
const game = {
    state: GameState.DIALOG,
    currentMenuIndex: 0,
    currentSubMenuIndex: 0,
    player: {
        name: 'FRISK',
        hp: 20,
        maxHp: 20,
        x: 287,
        y: 70,
        speed: 4.5, // より速く
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
        turnCount: 0
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
    attackSliderSpeed: 5, // 少し速く
    attackSliderDirection: 1,
    dialogCallback: null,
    dialogTyping: false,
    dialogSkippable: false
};

const ctx = document.getElementById('battle-canvas').getContext('2d');

// メニュー配列
const MENU_ACTIONS = ['fight', 'act', 'item', 'mercy'];

// ===== 初期化 =====
function init() {
    // キーボード入力
    document.addEventListener('keydown', handleKeyDown);
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
        updateMenuSelection();
    });

    gameLoop();
}

// ===== キーボード操作 =====
function handleKeyDown(e) {
    game.keys[e.key] = true;
    const key = e.key.toLowerCase();

    // ダイアログ中
    if (game.state === GameState.DIALOG) {
        if ((key === 'z' || key === 'enter' || key === ' ') && game.dialogSkippable) {
            skipDialog();
        }
        return;
    }

    // メニュー選択
    if (game.state === GameState.MENU) {
        if (key === 'arrowleft') {
            game.currentMenuIndex = Math.max(0, game.currentMenuIndex - 1);
            updateMenuSelection();
            e.preventDefault();
        } else if (key === 'arrowright') {
            game.currentMenuIndex = Math.min(MENU_ACTIONS.length - 1, game.currentMenuIndex + 1);
            updateMenuSelection();
            e.preventDefault();
        } else if (key === 'z' || key === 'enter' || key === ' ') {
            handleMenuAction(MENU_ACTIONS[game.currentMenuIndex]);
            e.preventDefault();
        }
        return;
    }

    // サブメニュー選択
    if (game.state === GameState.SUB_MENU) {
        const currentMenu = getCurrentSubMenu();
        if (!currentMenu) return;

        const items = Array.from(currentMenu.children).filter(item => !item.classList.contains('used'));

        if (key === 'arrowleft' || key === 'arrowup') {
            game.currentSubMenuIndex = Math.max(0, game.currentSubMenuIndex - 1);
            updateSubMenuSelection(currentMenu, items);
            e.preventDefault();
        } else if (key === 'arrowright' || key === 'arrowdown') {
            game.currentSubMenuIndex = Math.min(items.length - 1, game.currentSubMenuIndex + 1);
            updateSubMenuSelection(currentMenu, items);
            e.preventDefault();
        } else if (key === 'z' || key === 'enter' || key === ' ') {
            const selectedItem = items[game.currentSubMenuIndex];
            if (selectedItem) {
                selectedItem.click();
            }
            e.preventDefault();
        } else if (key === 'x' || key === 'shift') {
            // キャンセル：メニューに戻る
            hideAllMenus();
            game.state = GameState.MENU;
            document.getElementById('battle-box').style.display = 'block';
            updateMenuSelection();
            e.preventDefault();
        }
        return;
    }

    // 攻撃フェーズ
    if (game.state === GameState.ATTACK && (key === 'z' || key === 'enter' || key === ' ')) {
        handleAttackTiming();
        e.preventDefault();
    }
}

function getCurrentSubMenu() {
    if (!document.getElementById('sub-menu').classList.contains('hidden')) {
        return document.getElementById('sub-menu');
    }
    if (!document.getElementById('item-menu').classList.contains('hidden')) {
        return document.getElementById('item-menu');
    }
    if (!document.getElementById('mercy-menu').classList.contains('hidden')) {
        return document.getElementById('mercy-menu');
    }
    return null;
}

function updateMenuSelection() {
    const buttons = document.querySelectorAll('.menu-btn');
    buttons.forEach((btn, index) => {
        if (index === game.currentMenuIndex) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

function updateSubMenuSelection(menu, items) {
    items.forEach((item, index) => {
        if (index === game.currentSubMenuIndex) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

// ===== メニューアクション =====
function handleMenuAction(action) {
    if (game.state !== GameState.MENU) return;

    hideAllMenus();
    game.currentSubMenuIndex = 0;

    switch (action) {
        case 'fight':
            startAttackPhase();
            break;
        case 'act':
            game.state = GameState.SUB_MENU;
            document.getElementById('sub-menu').classList.remove('hidden');
            document.getElementById('battle-box').style.display = 'none';
            setupSubMenuListeners('sub-menu-btn', (btn) => handleActAction(btn.dataset.act));
            break;
        case 'item':
            game.state = GameState.SUB_MENU;
            document.getElementById('item-menu').classList.remove('hidden');
            document.getElementById('battle-box').style.display = 'none';
            updateItemMenu();
            setupSubMenuListeners('item-btn', (btn) => handleItemAction(btn.dataset.item, parseInt(btn.dataset.heal)));
            break;
        case 'mercy':
            game.state = GameState.SUB_MENU;
            document.getElementById('mercy-menu').classList.remove('hidden');
            document.getElementById('battle-box').style.display = 'none';
            setupSubMenuListeners('mercy-btn', (btn) => handleMercyAction(btn.dataset.mercy));
            break;
    }
}

function setupSubMenuListeners(className, handler) {
    const buttons = document.querySelectorAll('.' + className);
    const availableButtons = Array.from(buttons).filter(btn => !btn.classList.contains('used'));

    buttons.forEach((btn, index) => {
        btn.onclick = () => {
            if (!btn.classList.contains('used')) {
                handler(btn);
            }
        };
    });

    if (availableButtons.length > 0) {
        updateSubMenuSelection(availableButtons[0].parentElement, availableButtons);
    }
}

// ===== FIGHT フェーズ =====
function startAttackPhase() {
    game.state = GameState.ATTACK;
    document.getElementById('battle-box').style.display = 'none';
    document.getElementById('attack-bar-container').classList.remove('hidden');
    game.attackSliderPos = 0;
    game.attackSliderDirection = 1;
}

function updateAttackSlider() {
    if (game.state !== GameState.ATTACK) return;

    game.attackSliderPos += game.attackSliderSpeed * game.attackSliderDirection;

    if (game.attackSliderPos >= 514) {
        game.attackSliderDirection = -1;
    } else if (game.attackSliderPos <= 0) {
        game.attackSliderDirection = 1;
    }

    document.getElementById('attack-slider').style.left = game.attackSliderPos + 'px';
}

function handleAttackTiming() {
    const targetCenter = 257;
    const targetWidth = 50;
    const distance = Math.abs(game.attackSliderPos - targetCenter);

    let damageMultiplier = 0;
    let resultText = '';

    if (distance < targetWidth / 4) {
        damageMultiplier = 2.2;
        resultText = 'CRITICAL!';
    } else if (distance < targetWidth / 2) {
        damageMultiplier = 1.8;
        resultText = 'GREAT!';
    } else if (distance < targetWidth) {
        damageMultiplier = 1.3;
        resultText = 'GOOD!';
    } else if (distance < targetWidth * 1.5) {
        damageMultiplier = 0.8;
        resultText = 'OK';
    } else {
        damageMultiplier = 0.3;
        resultText = 'MISS';
    }

    const damage = Math.floor((game.boss.attackPower + 12) * damageMultiplier);
    game.boss.hp = Math.max(0, game.boss.hp - damage);
    updateBossHp();

    showDamageText(resultText, damage);

    document.getElementById('boss-sprite').classList.add('damage-flash');
    setTimeout(() => document.getElementById('boss-sprite').classList.remove('damage-flash'), 600);

    document.getElementById('attack-bar-container').classList.add('hidden');

    if (game.boss.hp <= 0) {
        showVictory();
        return;
    }

    setTimeout(() => startBossTurn(), 800);
}

function showDamageText(text, damage) {
    const damageDiv = document.createElement('div');
    damageDiv.textContent = `${text} - ${Math.floor(damage)}`;
    damageDiv.style.position = 'absolute';
    damageDiv.style.top = '130px';
    damageDiv.style.left = '50%';
    damageDiv.style.transform = 'translateX(-50%)';
    damageDiv.style.fontSize = damage > 20 ? '18px' : '14px';
    damageDiv.style.color = damage > 20 ? '#ffff00' : '#fff';
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
            dialogMessage = `* EVIL BOSS - ATK ${game.boss.attackPower} DEF ${game.boss.defense}\\n* A terrifying foe that shows no mercy...`;
            mercyIncrease = 10;
            break;
        case 'talk':
            const talks = [
                "* You try to reason with the boss.\\n* It doesn't seem to care...",
                "* You tell the boss about determination.\\n* It looks slightly confused.",
                "* You compliment the boss's attacks.\\n* It seems flattered!"
            ];
            dialogMessage = talks[game.boss.turnCount % talks.length];
            mercyIncrease = 15;
            break;
        case 'encourage':
            dialogMessage = "* You encourage the boss to give up.\\n* Its DEFENSE decreased!";
            game.boss.defense = Math.max(0, game.boss.defense - 2);
            mercyIncrease = 20;
            break;
        case 'threaten':
            dialogMessage = "* You threaten the boss.\\n* It becomes more aggressive!";
            game.boss.attackPower += 1;
            mercyIncrease = 5;
            break;
    }

    game.boss.mercy += mercyIncrease;
    if (game.boss.mercy >= 100) {
        game.boss.canSpare = true;
    }

    showDialog(dialogMessage, () => startBossTurn());
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
    showHealEffect(actualHeal);

    showDialog(`* You ate the ${game.items[itemType].name}.\\n* You recovered ${actualHeal} HP!`, () => startBossTurn());
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
    healText.style.left = '110px';
    healText.style.top = '280px';

    document.getElementById('game-container').appendChild(healText);
    setTimeout(() => healText.remove(), 1200);
}

// ===== MERCY システム =====
function handleMercyAction(mercyType) {
    hideAllMenus();

    if (mercyType === 'spare') {
        if (game.boss.canSpare) {
            showDialog("* You spared the boss.\\n* It thanks you and leaves...", () => showVictory());
        } else {
            const spareText = game.boss.mercy > 50
                ? "* The boss is wavering...\\n* But it's not ready yet."
                : "* The boss refuses to be spared!\\n* Keep trying...";
            showDialog(spareText, () => startBossTurn());
        }
    } else if (mercyType === 'flee') {
        showDialog("* You can't escape from a boss fight!", () => startBossTurn());
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
        "* You feel your sins crawling..."
    ];

    showDialog(dialogues[game.boss.turnCount % dialogues.length], () => startDodgePhase());
}

// ===== 回避フェーズ =====
function startDodgePhase() {
    game.state = GameState.DODGE;
    document.getElementById('dialog-box').style.display = 'none';
    document.getElementById('battle-box').style.display = 'block';
    game.bullets = [];

    game.player.x = 287;
    game.player.y = 70;
    updateHeartPosition();

    const patterns = [
        createHorizontalBullets,
        createVerticalBullets,
        createCircularBullets,
        createRandomBullets,
        createWaveBullets,
        createSpiralBullets
    ];

    patterns[Math.floor(Math.random() * patterns.length)]();

    setTimeout(() => endDodgePhase(), 4000); // 4秒に延長
}

function endDodgePhase() {
    game.state = GameState.MENU;
    game.bullets = [];
    document.getElementById('battle-box').style.display = 'block';
    ctx.clearRect(0, 0, 575, 140);
    game.currentMenuIndex = 0;
    setTimeout(() => updateMenuSelection(), 500);
}

// ===== 弾幕パターン（速度調整済み） =====
function createHorizontalBullets() {
    for (let i = 0; i < 4; i++) {
        setTimeout(() => {
            game.bullets.push({
                x: -10,
                y: 20 + i * 30,
                width: 12,
                height: 12,
                vx: 2.2,
                vy: 0,
                color: '#fff'
            });
            game.bullets.push({
                x: 585,
                y: 30 + i * 30,
                width: 12,
                height: 12,
                vx: -2.2,
                vy: 0,
                color: '#fff'
            });
        }, i * 500);
    }
}

function createVerticalBullets() {
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            game.bullets.push({
                x: 50 + i * 85,
                y: -10,
                width: 12,
                height: 12,
                vx: 0,
                vy: 1.8,
                color: '#ff8800'
            });
        }, i * 400);
    }
}

function createCircularBullets() {
    const count = 16;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        game.bullets.push({
            x: 287 + Math.cos(angle) * 100,
            y: 70 + Math.sin(angle) * 50,
            width: 10,
            height: 10,
            vx: Math.cos(angle) * 1.5,
            vy: Math.sin(angle) * 1.5,
            color: '#ff00ff'
        });
    }
}

function createRandomBullets() {
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const side = Math.floor(Math.random() * 4);
            let x, y, vx, vy;

            switch(side) {
                case 0: // top
                    x = Math.random() * 575;
                    y = -10;
                    vx = (Math.random() - 0.5) * 2;
                    vy = 1.5 + Math.random() * 0.5;
                    break;
                case 1: // right
                    x = 585;
                    y = Math.random() * 140;
                    vx = -(1.5 + Math.random() * 0.5);
                    vy = (Math.random() - 0.5) * 2;
                    break;
                case 2: // bottom
                    x = Math.random() * 575;
                    y = 150;
                    vx = (Math.random() - 0.5) * 2;
                    vy = -(1.5 + Math.random() * 0.5);
                    break;
                case 3: // left
                    x = -10;
                    y = Math.random() * 140;
                    vx = 1.5 + Math.random() * 0.5;
                    vy = (Math.random() - 0.5) * 2;
                    break;
            }

            game.bullets.push({ x, y, width: 10, height: 10, vx, vy, color: '#00ff00' });
        }, i * 180);
    }
}

function createWaveBullets() {
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            game.bullets.push({
                x: -10,
                y: 70,
                width: 12,
                height: 12,
                vx: 2.5,
                vy: 0,
                wave: true,
                waveOffset: i * 0.8,
                color: '#00ffff'
            });
        }, i * 350);
    }
}

function createSpiralBullets() {
    let angle = 0;
    for (let i = 0; i < 24; i++) {
        setTimeout(() => {
            game.bullets.push({
                x: 287,
                y: 70,
                width: 8,
                height: 8,
                vx: Math.cos(angle) * 1.8,
                vy: Math.sin(angle) * 1.8,
                color: '#ffff00'
            });
            angle += 0.6;
        }, i * 140);
    }
}

// ===== ダイアログシステム =====
let dialogInterval = null;

function showDialog(text, callback) {
    game.state = GameState.DIALOG;
    game.dialogCallback = callback;
    game.dialogTyping = true;
    game.dialogSkippable = false;

    document.getElementById('dialog-box').style.display = 'block';
    document.getElementById('battle-box').style.display = 'none';
    document.getElementById('dialog-text').textContent = '';

    // \\nを改行に変換
    text = text.replace(/\\n/g, '\n');

    let index = 0;
    if (dialogInterval) clearInterval(dialogInterval);

    dialogInterval = setInterval(() => {
        if (index < text.length) {
            const currentText = document.getElementById('dialog-text').textContent;
            document.getElementById('dialog-text').textContent = currentText + text[index];
            index++;
        } else {
            clearInterval(dialogInterval);
            game.dialogTyping = false;
            game.dialogSkippable = true;
            setTimeout(() => {
                if (game.dialogSkippable) {
                    skipDialog();
                }
            }, 1500);
        }
    }, 25); // より速いタイピング
}

function skipDialog() {
    if (dialogInterval) clearInterval(dialogInterval);
    document.getElementById('dialog-box').style.display = 'none';
    game.dialogSkippable = false;
    if (game.dialogCallback) {
        game.dialogCallback();
        game.dialogCallback = null;
    }
}

// ===== ゲームループ =====
function gameLoop() {
    if (game.state === GameState.ATTACK) {
        updateAttackSlider();
    }

    if (game.state === GameState.DODGE) {
        updateDodgePhase();
    }

    requestAnimationFrame(gameLoop);
}

function updateDodgePhase() {
    // プレイヤーの移動（Shift で減速）
    const speed = game.keys['Shift'] ? game.player.speed * 0.5 : game.player.speed;

    if (game.keys['ArrowLeft'] || game.keys['a'] || game.keys['A']) {
        game.player.x = Math.max(10, game.player.x - speed);
    }
    if (game.keys['ArrowRight'] || game.keys['d'] || game.keys['D']) {
        game.player.x = Math.min(565, game.player.x + speed);
    }
    if (game.keys['ArrowUp'] || game.keys['w'] || game.keys['W']) {
        game.player.y = Math.max(10, game.player.y - speed);
    }
    if (game.keys['ArrowDown'] || game.keys['s'] || game.keys['S']) {
        game.player.y = Math.min(130, game.player.y + speed);
    }

    updateHeartPosition();

    // 弾の更新
    ctx.clearRect(0, 0, 575, 140);

    for (let i = game.bullets.length - 1; i >= 0; i--) {
        const bullet = game.bullets[i];

        if (bullet.wave) {
            bullet.y = 70 + Math.sin(bullet.x * 0.05 + bullet.waveOffset) * 40;
        }

        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        if (bullet.x < -50 || bullet.x > 625 || bullet.y < -50 || bullet.y > 190) {
            game.bullets.splice(i, 1);
            continue;
        }

        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        if (!game.player.invulnerable && checkCollision(bullet)) {
            takeDamage(game.boss.attackPower);
        }
    }

    if (game.player.invulnerable) {
        game.player.invulnerableTime--;
        if (game.player.invulnerableTime <= 0) {
            game.player.invulnerable = false;
            document.getElementById('player-heart').style.opacity = '1';
        } else {
            document.getElementById('player-heart').style.opacity = game.player.invulnerableTime % 8 < 4 ? '0.3' : '1';
        }
    }
}

function checkCollision(bullet) {
    const heartSize = 18;
    return (
        game.player.x - heartSize/2 < bullet.x + bullet.width &&
        game.player.x + heartSize/2 > bullet.x &&
        game.player.y - heartSize/2 < bullet.y + bullet.height &&
        game.player.y + heartSize/2 > bullet.y
    );
}

function takeDamage(damage) {
    game.player.hp = Math.max(0, game.player.hp - damage);
    game.player.invulnerable = true;
    game.player.invulnerableTime = 40;

    updatePlayerHp();

    document.getElementById('player-heart').classList.add('damage-flash');
    setTimeout(() => document.getElementById('player-heart').classList.remove('damage-flash'), 300);

    if (game.player.hp <= 0) {
        showGameOver();
    }
}

// ===== UI更新 =====
function updateHeartPosition() {
    document.getElementById('player-heart').style.left = game.player.x + 'px';
    document.getElementById('player-heart').style.top = game.player.y + 'px';
}

function updatePlayerHp() {
    const percentage = (game.player.hp / game.player.maxHp) * 100;
    document.getElementById('player-hp-fill').style.width = percentage + '%';
    document.getElementById('player-hp-text').textContent = `${game.player.hp} / ${game.player.maxHp}`;

    if (percentage < 30) {
        document.getElementById('player-hp-fill').style.background = '#ff0000';
    } else {
        document.getElementById('player-hp-fill').style.background = '#ffff00';
    }
}

function updateBossHp() {
    const percentage = (game.boss.hp / game.boss.maxHp) * 100;
    document.getElementById('boss-hp-fill').style.width = percentage + '%';
    document.getElementById('boss-hp').textContent = game.boss.hp;
}

// ===== ユーティリティ =====
function hideAllMenus() {
    document.getElementById('sub-menu').classList.add('hidden');
    document.getElementById('item-menu').classList.add('hidden');
    document.getElementById('mercy-menu').classList.add('hidden');
    document.getElementById('attack-bar-container').classList.add('hidden');
}

function showGameOver() {
    game.state = GameState.GAME_OVER;
    document.getElementById('game-over').classList.remove('hidden');
}

function showVictory() {
    game.state = GameState.VICTORY;
    document.getElementById('victory').classList.remove('hidden');
}

function resetGame() {
    game.player.hp = game.player.maxHp;
    game.boss.hp = game.boss.maxHp;
    game.boss.turnCount = 0;
    game.boss.mercy = 0;
    game.boss.canSpare = false;
    game.boss.attackPower = 5;
    game.boss.defense = 5;
    game.bullets = [];
    game.currentMenuIndex = 0;

    Object.keys(game.items).forEach(key => game.items[key].used = false);
    Object.keys(game.acts).forEach(key => game.acts[key].used = false);

    updatePlayerHp();
    updateBossHp();
    updateItemMenu();

    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('victory').classList.add('hidden');

    showDialog("* The evil boss blocks your way!", () => {
        game.state = GameState.MENU;
        updateMenuSelection();
    });
}

// ===== ゲーム開始 =====
init();
