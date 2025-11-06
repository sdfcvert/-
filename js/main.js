/**
 * Game Platform - メインスクリプト
 *
 * このファイルはゲーム一覧の表示とナビゲーションを管理します。
 */

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', function() {
    // ゲームページの場合のみゲーム一覧を表示
    if (document.querySelector('.games-page')) {
        loadGames();
    }
});

/**
 * ゲーム一覧を読み込んで表示する
 */
function loadGames() {
    const gamesGrid = document.getElementById('games-grid');
    const noGamesMessage = document.getElementById('no-games-message');

    // ゲームが存在しない場合
    if (!GAMES || GAMES.length === 0) {
        gamesGrid.style.display = 'none';
        noGamesMessage.style.display = 'block';
        return;
    }

    // 利用可能なゲームのみフィルタ（オプション）
    // すべて表示したい場合は、この行をコメントアウト
    const displayGames = GAMES; // または GAMES.filter(game => game.status === 'available');

    // ゲームカードを生成
    displayGames.forEach(game => {
        const gameCard = createGameCard(game);
        gamesGrid.appendChild(gameCard);
    });

    // グリッドを表示
    gamesGrid.style.display = 'grid';
    noGamesMessage.style.display = 'none';
}

/**
 * ゲームカード要素を作成する
 *
 * @param {Object} game - ゲーム情報オブジェクト
 * @returns {HTMLElement} ゲームカード要素
 */
function createGameCard(game) {
    // カード要素を作成
    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.gameId = game.id;

    // アイコンとタイトルのヘッダー
    const header = document.createElement('div');
    header.className = 'game-card-header';

    const icon = document.createElement('span');
    icon.className = 'game-icon';
    icon.textContent = game.icon;

    const title = document.createElement('h3');
    title.className = 'game-title';
    title.textContent = game.name;

    header.appendChild(icon);
    header.appendChild(title);

    // ゲームの説明
    const description = document.createElement('p');
    description.className = 'game-description';
    description.textContent = game.description;

    // フッター（ステータス）
    const footer = document.createElement('div');
    footer.className = 'game-footer';

    const status = document.createElement('span');
    status.className = 'game-status';
    status.textContent = STATUS_LABELS[game.status] || 'Unknown';

    // ステータスに応じた色を適用
    const statusColor = STATUS_COLORS[game.status];
    if (statusColor) {
        status.style.background = statusColor.bg;
        status.style.borderColor = statusColor.border;
        status.style.color = statusColor.text;
    }

    footer.appendChild(status);

    // すべての要素をカードに追加
    card.appendChild(header);
    card.appendChild(description);
    card.appendChild(footer);

    // クリックイベントを追加
    if (game.status === 'available') {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            e.preventDefault();
            // ゲームURLに遷移
            window.location.href = game.url;
        });
    } else {
        card.style.cursor = 'not-allowed';
        card.style.opacity = '0.7';
    }

    return card;
}

/**
 * ゲームに遷移する
 *
 * @param {Object} game - ゲーム情報オブジェクト
 */
function navigateToGame(game) {
    // ゲームURLに遷移
    window.location.href = game.url;
}

/**
 * ゲームをフィルタリングする（将来の拡張用）
 *
 * @param {string} filterType - フィルタのタイプ（例: 'category', 'status'）
 * @param {string} filterValue - フィルタの値
 */
function filterGames(filterType, filterValue) {
    const gamesGrid = document.getElementById('games-grid');
    gamesGrid.innerHTML = '';

    const filteredGames = GAMES.filter(game => {
        if (filterType === 'status') {
            return game.status === filterValue;
        }
        // 他のフィルタタイプをここに追加
        return true;
    });

    filteredGames.forEach(game => {
        const gameCard = createGameCard(game);
        gamesGrid.appendChild(gameCard);
    });
}

/**
 * ゲームを検索する（将来の拡張用）
 *
 * @param {string} searchTerm - 検索キーワード
 */
function searchGames(searchTerm) {
    const gamesGrid = document.getElementById('games-grid');
    gamesGrid.innerHTML = '';

    const searchResults = GAMES.filter(game => {
        const searchLower = searchTerm.toLowerCase();
        return game.name.toLowerCase().includes(searchLower) ||
               game.description.toLowerCase().includes(searchLower);
    });

    searchResults.forEach(game => {
        const gameCard = createGameCard(game);
        gamesGrid.appendChild(gameCard);
    });

    // 検索結果がない場合のメッセージ
    if (searchResults.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-games-message';
        noResults.innerHTML = '<p>検索結果が見つかりませんでした。</p>';
        gamesGrid.appendChild(noResults);
    }
}
