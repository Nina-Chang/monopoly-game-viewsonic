import { useEffect,useMemo } from 'react';
import useClickAnimation from '../hooks/useClickAnimation';
import usePageAssets from '../hooks/usePageAssets';
import useSendGameMessage from '../hooks/useSendGameMessage';
import useGameMode from '../hooks/useGameMode';

const cfg = (typeof window !== 'undefined' && window.gameConfig) ? window.gameConfig : {};

const InstructionsPage = ({ navigateTo, backgroundImage }) => {
  const gameMode=useGameMode()
  const { modeImages, modeAssets } = useMemo(() => ({
    modeImages : cfg.images?.[gameMode] || {},
    modeAssets : cfg.assets?.[gameMode] || [],
  }), [gameMode]);
  const { buttonScale,setScale, handleClickAnimation }=useClickAnimation(()=>navigateTo('monopoly'))
  const { sendMessage }=useSendGameMessage()
  const pageAssets = usePageAssets(modeAssets, 2);

  useEffect(() => {
    // 當這一頁載入時，立刻通知外層
    sendMessage({ sceneId: 2});
  }, [sendMessage]);

  const pageStyle = { 
    backgroundImage: `url(${backgroundImage})`,
    width:'1920px',
    height:'1080px',
    loading:'eager'
  };

  return (
    <div className="page-container" style={pageStyle}>
      <span className="sticker-text">How to play</span>
      <div className="instructions-text">
        <p>1. Roll the dice and move your game piece.</p>
        <p>2. Teams may land on spaces with questions, Fate cards, or Chance cards.</p>
        <p>3. The first team to finish the required number of laps wins!</p>
      </div>
      <div className="continue-button loop-animation">
        <button 
        onMouseEnter={() => setScale("continue",1.1)}
        onMouseLeave={() => setScale("continue",1)}
        style={{transform: `scale(${buttonScale.continue})`}}
        className="image-button" 
        onClick={() =>handleClickAnimation("continue")}>
          <img src={modeImages?.btnNext || 'images/object/Basketball_monopoly_next_button.png'} alt="Continue" />
        </button>
      </div>
      {pageAssets.map((asset) => (
        <div key={asset.RawId || asset.id} style={asset.style}>
            {asset.Type === 'Text' ? 
            (
                asset.displayContent
            ) 
            : (
                <img 
                    src={asset.displayContent} 
                    alt="game-asset" 
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain',
                        display: 'block' 
                    }} 
                />
            )}
        </div>
      ))}
    </div>
  );
};

export default InstructionsPage;
