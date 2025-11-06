/**
 * ゲーム設定ファイル
 *
 * 新しいゲームを追加するには、このファイルの GAMES 配列に
 * 新しいオブジェクトを追加するだけです。
 *
 * 各ゲームオブジェクトの構造：
 * {
 *   id: "unique-game-id",           // ユニークなID（英数字とハイフン）
 *   name: "ゲーム名",                // 表示されるゲーム名
 *   description: "ゲームの説明",     // ゲームの簡単な説明
 *   icon: "🎮",                     // ゲームのアイコン（絵文字または画像パス）
 *   url: "games/game-folder/",      // ゲームのフォルダパス
 *   status: "available"             // ステータス（available, coming-soon, maintenance）
 * }
 */

const GAMES = [
    // ===== 実装済みゲーム =====
    {
        id: "tetris-ai-battle",
        name: "Tetris AI Battle",
        description: "AIと対戦できる本格的なテトリス。矢印キーまたはWASDで操作。スペースキーでハードドロップ。",
        icon: "🎮",
        url: "games/tetris-ai/index.html",
        status: "available"
    },
    {
        id: "undertale-boss-battle",
        name: "Boss Battle",
        description: "Undertale風のボス戦。FIGHT、ACT、ITEM、MERCYを駆使してボスを倒そう！矢印キーで回避、スペースキーで攻撃。",
        icon: "❤️",
        url: "games/undertale-boss/index.html",
        status: "available"
    },

    // ===== ここに新しいゲームを追加 =====
    // {
    //     id: "my-new-game",
    //     name: "私の新しいゲーム",
    //     description: "このゲームは○○です。",
    //     icon: "🎮",
    //     url: "games/my-new-game/",
    //     status: "available"
    // },
];

/**
 * ステータスのラベル定義
 */
const STATUS_LABELS = {
    "available": "プレイ可能",
    "coming-soon": "近日公開",
    "maintenance": "メンテナンス中"
};

/**
 * ステータスのカラー設定
 */
const STATUS_COLORS = {
    "available": {
        bg: "rgba(76, 175, 80, 0.3)",
        border: "rgba(76, 175, 80, 0.6)",
        text: "#a8f5a8"
    },
    "coming-soon": {
        bg: "rgba(255, 152, 0, 0.3)",
        border: "rgba(255, 152, 0, 0.6)",
        text: "#ffd699"
    },
    "maintenance": {
        bg: "rgba(244, 67, 54, 0.3)",
        border: "rgba(244, 67, 54, 0.6)",
        text: "#ffb3b3"
    }
};
