import { useMemo } from 'react';

/**
 * 自定義 Hook：取得 URL 中的 gameMode 參數
 * @param {string} defaultMode - 如果找不到參數時的預設值
 * @returns {string} 當前的遊戲模式
 */
const cfg = (typeof window !== 'undefined' && window.gameConfig) ? window.gameConfig : {};

const useGameMode = (defaultMode = 'round') => {
  // const gameMode = useMemo(() => {
  //   if (typeof window === 'undefined') return defaultMode;
    
  //   const urlParams = new URLSearchParams(window.location.search);
  //   return urlParams.get('gameMode') || defaultMode;
  // }, []); 
  const gameMode=cfg.settings?.gameMode || 'round';

  return gameMode;
};

export default useGameMode