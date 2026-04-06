import useClickAnimation from "../hooks/useClickAnimation"
import useSendGameMessage from "../hooks/useSendGameMessage"
import usePageAssets from "../hooks/usePageAssets"
import useGameMode from "../hooks/useGameMode"
import { useEffect,useMemo } from "react";

const cfg = (typeof window !== 'undefined' && window.gameConfig) ? window.gameConfig : {};

const StartPage = ({ onStartGame, backgroundImage }) => {
  const gameMode=useGameMode()
  const { modeStrings, modeAssets } = useMemo(() => ({
    modeStrings : cfg.strings?.[gameMode] || {},
    modeAssets : cfg.assets?.[gameMode] || [],
  }), [gameMode]);
  const { buttonScale,setScale, handleClickAnimation }=useClickAnimation(onStartGame)
  const { sendMessage }=useSendGameMessage()
  const pageAssets = usePageAssets(modeAssets, 1);

  useEffect(() => {
    // 當這一頁載入時，立刻通知外層：我現在是第 1 號場景
    sendMessage({ sceneId: 1});
  }, [sendMessage]);

  const pageStyle = { 
    backgroundImage: `url(${backgroundImage})`,
    width:'1920px',
    height:'1080px',
    loading:'eager'
  };

  return (
    <div className="page-container" style={pageStyle}>
      <div style={modeStrings.startTitle.style} className='start-page-title'>
        {modeStrings.startTitle.text}
      </div>
      <button className="image-button start-button-center" 
        onMouseEnter={()=>setScale("start",1.1)}
        onMouseLeave={()=>setScale("start",1)}
        onClick={() => handleClickAnimation("start")} style={{transform:`translate(-50%, -50%) scale(${buttonScale.start})`}}>
        <img src={"./images/object/Basketball_monopoly_start_button.png"} alt="start button"/>
        <span className="start-button-text">Start</span>
      </button>
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

export default StartPage;
