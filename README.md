# 🎲 Monopoly Interactive Learning Game (Round)

一個基於 React 開發的「迴圈式」互動大富翁遊戲。玩家在 24 格的地圖上循環移動，透過回答問題累積積分，並觸發各種特殊事件。

## 📋 遊戲流程 (Page Flow)

開始畫面 → 遊戲說明 → 大富翁主遊戲 (迴圈地圖) → 結算排名
  ↑ (循環)          ↓ (事件觸發)
骰子/移動 ←→ 題目回答 / 命運與機會事件

### 核心頁面說明
| 頁面名稱 | 類型 | 目的 |
|-----------|------|---------|
| `start` | Intro | 遊戲標題與開場進入點 |
| `instructions` | Info | 操作說明與遊戲規則 |
| `monopoly` | Game | **核心遊戲區**：包含迴圈地圖、棋子移動動畫、事件判定 |
| `scores` | Ending | 最終積分統計與排行榜 |

### 遊戲機制 (Game Mechanics)
* **擲骰移動**：點擊骰子產隨機點數，棋子進行非同步位移（1 秒動畫）。
* **題目挑戰**：停留於一般格子時觸發答題，影響積分。
* **特殊格點判定**：
  - **命運格 (第 5,19 格)**：觸發命運卡（含：後退一格、回到原點、暫停一回、換位等效果）。
  - **機會格 (第 12 格)**：觸發機會事件（含：前進一格、獲得分數、暫停一回、換位等效果）。
* **終點判定**：抵達第 24 格時進入結算畫面。

## 🛠️ 技術實作細節 (Tech Stack)

### 1. 非同步位移與順序保證
- **Framework**: React (Hooks: `useState`, `useEffect`, `useRef`)
- **Scaling Solution**: CSS `transform: scale()` 動態計算 (基準: 1920x1080)
- **Assets**: 透過 `cfg.js` 設定檔動態載入圖片與音效路徑。


# 🚀 Monopoly Interactive Learning Game (Linear)

一個基於 React 開發的互動式大富翁遊戲，支援自動縮放適應螢幕、非同步玩家位移系統，以及靈活的命運/機會卡牌機制。

## 📋 遊戲流程 (Page Flow)

開始畫面 → 遊戲說明 → 大富翁主遊戲 → 結算排名
  ↑ (循環)          ↓ (事件觸發)
骰子/移動 ←→ 題目回答 / 命運機會卡

### 核心頁面說明
| 頁面名稱 | 類型 | 目的 |
|-----------|------|---------|
| `start` | Intro | 遊戲標題開場 |
| `instructions` | Story | 玩法與規則介紹 |
| `monopoly` | Game | **核心遊戲區**<br>包含地圖渲染、棋子移動、題目觸發 |
| `scores` | Ending | 最終積分排行榜與遊戲完結 |

### 遊戲機制 (Game Mechanics)
1. **擲骰移動**：點擊骰子產隨機點數，棋子進行非同步位移（1 秒動畫）。
2. **題目挑戰**：停留於一般格子時觸發答題，影響積分。
3. **特殊格點**：
   - **第 8 格 (命運)**：觸發 `handleOpenChest` 事件（後退、回原點、暫停、換位）。
   - **第 11 格 (機會)**：觸發 `handleOpenChance` 事件。
4. **終點判定**：抵達第 23 格時進入結算畫面。

## 🛠️ 技術棧 (Tech Stack)
- **Framework**: React (Hooks: `useState`, `useEffect`, `useRef`)
- **Scaling Solution**: CSS `transform: scale()` 動態計算 (基準: 1920x1080)
- **Assets**: 透過 `cfg.js` 設定檔動態載入圖片與音效路徑。

## 🚀 Quick Start
npm install
npm start

**Game designed for 1920x1080 full-screen play.**
