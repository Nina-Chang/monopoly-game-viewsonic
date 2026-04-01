import { useEffect,useMemo } from 'react'
import useClickAnimation from "../hooks/useClickAnimation"
import usePageAssets from "../hooks/usePageAssets"
import useSendGameMessage from "../hooks/useSendGameMessage"
import useGameMode from "../hooks/useGameMode"

const cfg = (typeof window !== 'undefined' && window.gameConfig) ? window.gameConfig : {};

const ScoresPage = ({navigateTo, backgroundImage, players, setPlayers,bgmAudio}) => {
    const gameMode=useGameMode()
    const { modeImages,modeStrings,modePlayers,modeSounds, modeAssets } = useMemo(() => ({
        modeImages : cfg.images?.[gameMode] || {},
        modeStrings : cfg.strings?.[gameMode] || {},
        modePlayers : cfg.players?.[gameMode] || [],
        modeSounds : cfg.sounds?.[gameMode] || {},
        modeAssets : cfg.assets?.[gameMode] || [],
    }), [gameMode]);
    const { buttonScale,setScale, handleClickAnimation }=useClickAnimation((key) => handleAfterClickingButton(key))
    const { sendMessage }=useSendGameMessage()
    const pageAssets = usePageAssets(modeAssets, 4);

    const pageStyle = { 
        backgroundImage: `url(${backgroundImage})`,
        width:'1920px',
        height:'1080px',
        loading:'eager'
    };

    useEffect(() => {
        // 當這一頁載入時，立刻通知外層
        sendMessage({ sceneId: 4});
    }, [sendMessage]);

    useEffect(()=>{
        if(bgmAudio) bgmAudio.pause()
        const audioPlayer=new Audio(modeSounds.gameSuccess || './sounds/gameSuccess.mp3')
        audioPlayer.volume =0.316;
        audioPlayer.play().catch((e)=>console.log('Audio Failed',e))
    },[])

    const renderWonPlayer = () => {
        let wonPlayer;
        if (gameMode === "linear") {
            wonPlayer = players.find(player => player.step >= 23);
        } else {
            wonPlayer = players.find(player => player.step >= 24);
        }

        // 如果沒有玩家獲勝，則不渲染
        if (!wonPlayer) return null;

        const winnerImgSrc = modeImages.finchWinner?.[wonPlayer.id - 1] 
            || `./images/object/Basketball_monopoly_finch_0${wonPlayer.id}.png`;

        return (
            <img 
                className={`won-player-${wonPlayer.id}`} 
                src={winnerImgSrc} 
                alt={`Won Player ${wonPlayer.id}`} 
            />
        );
    };

    const handleAfterClickingButton=(key)=>{
        const destination=key==="home"?"start":"monopoly"
        navigateTo(destination)
        setPlayers(modePlayers || []);
    }

    return (
        <div className="page-container" style={pageStyle}>
            <div style={modeStrings.scoresTitle.style}>
                {modeStrings.scoresTitle.text}
            </div>
            {/* <span className="congratulation-text">You won!</span> */}
            {renderWonPlayer()}
            <div className="button-container">
                <button className="image-button" 
                onMouseEnter={() => setScale("home",1.1)}
                onMouseLeave={() => setScale("home",1)}
                style={{transform: `scale(${buttonScale.home})`}}
                onClick={()=>handleClickAnimation("home")}>
                    <img src={"./images/object/Basketball_monopoly_home_button.png"} alt="Back to Home"/>
                </button>
                <button className="image-button" 
                onMouseEnter={() => setScale("again",1.1)}
                onMouseLeave={() => setScale("again",1)}
                style={{transform: `scale(${buttonScale.again})`}}
                onClick={()=>handleClickAnimation("again")}>
                    <img src={"./images/object/Basketball_monopoly_again_button.png"} alt="Reset Scores"/>
                </button>
            </div>
            {pageAssets.map((asset, index) => (
                <div key={asset.id || index} style={asset.style}>
                {asset.text}
                </div>
            ))}
        </div>
    )
}

export default ScoresPage;