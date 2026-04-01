import { useState } from 'react';
const cfg = (typeof window !== 'undefined' && window.gameConfig) ? window.gameConfig : {};

// 取得目前的遊戲模式，若沒設定則預設為 matching
const gameMode = cfg.settings?.gameMode || 'matching';

const modeSounds = cfg.sounds?.[gameMode] || {};

const useClickAnimation = (onComplete,haveSound=true, delay = 300) => {
  const [buttonScale, setButtonScale] = useState({});

  const handleClickAnimation = async (key) => {
    setButtonScale(prev => ({ ...prev, [key]: 0.9 }));
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    setButtonScale(prev => ({ ...prev, [key]: 1 }));
    
    if(haveSound){
        const audioPlayer =new Audio(modeSounds.buttonClick || './sounds/button_click.mp3');
        audioPlayer.volume = 0.316; 
        audioPlayer.loop = false;
        audioPlayer.play().catch((error)=>{console.log("Audio failed",error)});
    }
    
    if (onComplete) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      onComplete(key);
    }
  };

  const setScale = (key, value) => {
    setButtonScale(prev => ({ ...prev, [key]: value }));
  };

  return { buttonScale,setScale, handleClickAnimation };
};

export default useClickAnimation;
