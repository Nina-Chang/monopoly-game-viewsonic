import './App.css';
import { useState, useRef, useLayoutEffect,useEffect } from 'react';
import StartPage from './pages/StartPage';
import InstructionsPage from './pages/InstructionsPage';
import MonopolyRoundPage from './pages/MonopolyRoundPage/MonopolyRoundPage';
import MonopolyLinearPage from './pages/MonopolyLinearPage/MonopolyLinearPage';
import ScoresPage from './pages/ScoresPage';
import useGameMode from "./hooks/useGameMode"

const cfg = (typeof window !== 'undefined' && window.gameConfig) ? window.gameConfig : {};
const modeImages = cfg?.images || {};
const modePlayers = cfg?.players || [];
const modeSounds = cfg?.sounds || {};

function App() {
  const gameMode=useGameMode()
  const backgroundImages = {
    start: modeImages.bgStart || './images/background/Basketball_monopoly_linear_01_FHD.png',
    instructions: modeImages.bgInstructions || './images/background/Basketball_monopoly_linear_02_FHD.png',
    // monopoly:modeImages.bgMonopoly || './images/background/Basketball_monopoly_linear_03_FHD.png',
    monopoly:gameMode==="linear"?modeImages.bgMonopoly:'./images/background/Basketball_monopoly_round_03_FHD.png' || './images/background/Basketball_monopoly_linear_03_FHD.png',
    scores: modeImages.bgScores || './images/background/Basketball_monopoly_linear_04_FHD.png',
  };
  const [page, setPage] = useState('start');
  const [players, setPlayers] = useState(modePlayers || []);
  const [scale, setScale] = useState(1);
  const [currentProblemIndex,setCurrentProblemIndex]=useState(0)
  const audioRef=useRef(null)

  const navigateTo = (pageName) => setPage(pageName);

  const gameStyle = { 
    transform: `scale(${scale})`,
  };

  const handleStartGame=()=>{
    if(audioRef.current && audioRef.current.paused){
      audioRef.current.volume=0.1
      audioRef.current.currentTime = 0; // 從頭開始播放
      audioRef.current.play().catch((error)=>{
        console.log("Audio failed",error)
      })
    }
    navigateTo('instructions')
  }

  useEffect(() => {
    const startAudioContext = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.volume = 0.1;
        audioRef.current.loop = true;
        audioRef.current.play()
          .then(() => {
            window.removeEventListener('click', startAudioContext);
            window.removeEventListener('touchstart', startAudioContext);
          })
          .catch((error) => {
            console.log("Audio play failed:", error);
          });
      }
    };

    window.addEventListener('click', startAudioContext);
    window.addEventListener('touchstart', startAudioContext);

    return () => {
      window.removeEventListener('click', startAudioContext);
      window.removeEventListener('touchstart', startAudioContext);
    };
  }, []);

  useLayoutEffect(() => {
    // 視窗縮放
    const handleResize = () => {
      if (window.innerWidth === 0) return;
      const scaleX = window.innerWidth / 1920;
      const scaleY = window.innerHeight / 1080;
      setScale(Math.min(scaleX, scaleY));
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    
    return () => {
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="game-viewport">
      <div style={gameStyle}>
        {/* 場景1 */}
        {page === 'start' && (<StartPage navigateTo={navigateTo} onStartGame={handleStartGame} backgroundImage={backgroundImages.start}/>)}
        {/* 場景2 */}
        {page === 'instructions' && (<InstructionsPage navigateTo={navigateTo} onStartGame={handleStartGame} backgroundImage={backgroundImages.instructions}/>)}
        {/* 場景3 */}
        {(page === 'monopoly'&&gameMode==="round") && (<MonopolyRoundPage navigateTo={navigateTo} backgroundImage={backgroundImages.monopoly} currentProblemIndex={currentProblemIndex} setCurrentProblemIndex={setCurrentProblemIndex} players={players} setPlayers={setPlayers} bgmAudio={audioRef.current}/>)}
        {(page === 'monopoly'&&gameMode==="linear") && (<MonopolyLinearPage navigateTo={navigateTo} backgroundImage={backgroundImages.monopoly} currentProblemIndex={currentProblemIndex} setCurrentProblemIndex={setCurrentProblemIndex} players={players} setPlayers={setPlayers} bgmAudio={audioRef.current}/>)}
        {/* 場景4 */}
        {page === 'scores' && (<ScoresPage navigateTo={navigateTo} backgroundImage={backgroundImages.scores} players={players} setPlayers={setPlayers} bgmAudio={audioRef.current}/>)}
      </div>

      <audio ref={audioRef} src={modeSounds?.bgm || './sounds/funny-cartoon-no-copyright-music.mp3'} loop preload='auto'/>
    </div>
  );
}

export default App;
