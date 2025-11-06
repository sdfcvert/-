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
    // ===== サンプルゲーム（削除可能） =====
    {
        id: "sample-game-1",
        name: "サンプルゲーム 1",
        description: "これはサンプルゲームです。実際のゲームを追加する際は、このエントリを削除してください。",
        icon: "🎯",
        url: "games/sample-1/",
        status: "coming-soon"
    },
    {
        id: "sample-game-2",
        name: "サンプルゲーム 2",
        description: "これも見本です。新しいゲームを追加するには、上記の形式に従ってください。",
        icon: "🎲",
        url: "games/sample-2/",
        status: "coming-soon"
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
