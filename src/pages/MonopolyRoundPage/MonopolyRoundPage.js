import React, { useState, useCallback, useEffect,useRef } from 'react'
import MonopolyRoundPageStyle from "./MonopolyRoundPage.module.css"
import useSendGameMessage from "../../hooks/useSendGameMessage"
import usePageAssets from "../../hooks/usePageAssets"

const cfg = (typeof window !== 'undefined' && window.gameConfig) ? window.gameConfig : {};
const modeImages = cfg?.images || {};
const modeSounds = cfg?.sounds || {};
const modeQuestions = cfg?.questions?.[0]?.questions || [];
const modeAssets = cfg?.assets || [];

const MonopolyRoundPage = ({navigateTo, backgroundImage,currentProblemIndex,setCurrentProblemIndex,players,setPlayers,bgmAudio}) => {
    const [scaleForDice, setScaleForDice] = useState(1)
    const initialButtonState={A:-1,B:-1,C:-1} // 0:false 1:true -1:not yet to choose
    const [isCorrect, setIsCorrect] = useState(initialButtonState) // 0:false 1:true -1:not yet to choose 
    const [sectionVisible, setSectionVisible] = useState({dice:true,question:false,chest:false,chance:false})
    const [cardIndex, setCardIndex] = useState({chest:0,chance:0});
    const [diceNumber, setDiceNumber] = useState(3); // 預設顯示 3 點
    const [isRolling, setIsRolling] = useState(false);
    const [lastPosition, setLastPosition] = useState({});// 新增 lastPosition 記錄玩家移動前的位置
    const currentPlayer=players.find(p=>p.current===true)
    const isProcessing = useRef(false);
    const [clickingBtn, setClickingBtn] = useState(null);// 記錄正在點擊的按鈕（'A'、'B' 或 'C'）
    const chestTimer=useRef(null)
    const chanceTimer=useRef(null)
    const { sendMessage }=useSendGameMessage()
    const pageAssetsInStage3 = usePageAssets(modeAssets, 3);
    const pageAssetsInStage5 = usePageAssets(modeAssets, 5);
    const pageAssetsInStage6 = usePageAssets(modeAssets, 6);
    const pageAssetsInStage7 = usePageAssets(modeAssets, 7);
    
    const pageStyle = { 
        backgroundImage: `url(${backgroundImage})`,
        width:'1920px',
        height:'1080px',
        loading:'eager'
    };

    // 取得題目字體大小的邏輯
    const getQuestionFontSize = (text) => {
        const len = text?.length || 0;
        if (len > 60) return '16px';
        if (len > 35) return '22px';
        if (len > 20) return '28px';
        if (len > 10) return '32px';
        return '36px';
    };

    // 取得選項字體大小的邏輯
    const getAnswerFontSize = (text) => {
        const len = text?.length || 0;
        if (len > 40) return '16px';
        if (len > 25) return '20px';
        if (len > 18) return '24px';
        if (len > 10) return '28px';
        return '32px';
    };

    useEffect(() => {
        // 當這一頁載入時，立刻通知外層
        sendMessage({ sceneId: 3});
    }, [sendMessage]);

    useEffect(()=>{
        if(bgmAudio && bgmAudio.paused){
            bgmAudio.currentTime = 0; // 從頭開始播放
            bgmAudio.volume=0.1
            bgmAudio.play().catch((error)=>{console.log("Audio failed",error)});
        }
        return()=>{
            if(chestTimer.current){
                clearTimeout(chestTimer.current)
            }
            if(chanceTimer.current){
                clearTimeout(chanceTimer.current)
            }
        }
    },[])

    useEffect(()=>{
        if (!currentPlayer) return;
        setIsRolling(true)
        if (currentPlayer.current===true && currentPlayer.pauseRound > 0) {
            // 扣除暫停回合，並直接切換到下一位
            const timer = setTimeout(() => {
                setPlayers(prevPlayers => {
                    const total = prevPlayers.length;
                    const nextId = (currentPlayer.id % total) + 1;
                    
                    return prevPlayers.map(p => {
                        if (p.id === currentPlayer.id) {
                            return { ...p, pauseRound: p.pauseRound - 1, current: false };
                        }
                        if (p.id === nextId) {
                            return { ...p, current: true };
                        }
                        return { ...p, current: false };
                    });
                });
            }, 500); // 延遲 0.5 秒再跳轉，讓玩家看清楚發生什麼事

            return () => clearTimeout(timer); // 清除 timer 避免記憶體洩漏
            
        }
        setIsRolling(false)
    },[currentPlayer?.id])

    const playSound=useCallback((soundPath)=>{
        const audio=new Audio(soundPath)
        audio.volume=0.316
        audio.play().catch((error)=>{
            console.log("Audio failed",error)
        })
    },[])

    const handleDiceClick=async(playerCurStep,fromChance=false)=>{
        if (isRolling) return; // 防止連點
        // 擲骰子前，記錄目前玩家的位置
        const activePlayer = players.find(p => p.current === true);
        if (activePlayer) {
            setLastPosition(prev => ({ ...prev, [activePlayer.id]: activePlayer.step }));
        }
        setIsRolling(true);
        playSound(modeSounds?.dice || "./sounds/dice.mp3")
        setScaleForDice(0.9);
        await new Promise(resolve => setTimeout(resolve, 100)); // wait for 100ms
        setScaleForDice(1);    
        // 模擬骰子隨機跳動的過程 (跳動 10 次)
        let rollCount = 0;
        const rollInterval = setInterval(() => {
            const tempNums = Array.from({ length: 6 }, (_, i) => i + 1); // [1,2,3,4,5,6]
            const randomTemp = tempNums[Math.floor(Math.random() * tempNums.length)];
            setDiceNumber(randomTemp);
            rollCount++;

            if (rollCount > 10) {
                clearInterval(rollInterval);
            }
        }, 80); // 每 80ms 跳一次

        // 等待跳動動畫結束，決定最終數字
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const finalResult = Math.floor(Math.random() * 6) + 1; // 最終 1-6
        setDiceNumber(finalResult);
        setTimeout(()=>{
            const playerId=players.find(p=>p.current===true).id
            const curStep=playerCurStep===null?null:playerCurStep
            handleMoveThePlayer(playerId,curStep,finalResult,fromChance)
        },500)
    }


    // 選項按鈕點擊處理
    const handleButtonClick = async (btn, optionTxt) => {
        // 防止重複點擊
        if (isProcessing.current) return;
        isProcessing.current = true;
        setClickingBtn(btn);
        handleAnswer(btn, optionTxt);
    };

    const handleAnswer=(button,optionText)=>{
        if(modeQuestions[currentProblemIndex]?.answer===optionText){
            // 更改按鈕狀態
            setIsCorrect(prevState => ({ ...prevState, [button]: 1 }));
            // 音效
            playSound(modeSounds?.correct || "./sounds/correct.mp3")
            setTimeout(()=>{
                if (currentPlayer && currentPlayer.step >= 24) {// 到終點
                    if(currentPlayer.currentLap===cfg.settings.lap){
                        setCurrentProblemIndex(0);
                        navigateTo("scores");
                        return;
                    }
                }
                setCurrentProblemIndex((currentProblemIndex + 1) % modeQuestions.length);
                // 卡牌消失
                sendMessage({ sceneId: 3});
                setSectionVisible({dice:true,question:false,chest:false,chance:false})
                // 換下一位玩家
                handleNextPlayerTurn()
                reset()
            },1000)
        }
        else{
            // 更改按鈕狀態
            setIsCorrect(prevState => ({ ...prevState, [button]: 0 }));
            // 音效
            playSound(modeSounds?.wrong || "./sounds/wrong.mp3")
            // 答錯退回上一個位置 (使用 lastPosition)
            const playerId = players.find(p => p.current === true).id;
            const prevStep = lastPosition[playerId] || 1;
            const diff = prevStep - currentPlayer.step;
            
            // 執行退回，並設 skipQuestion 為 true
            handleMoveThePlayer(playerId, null, diff, true);

            setTimeout(()=>{
                setCurrentProblemIndex((currentProblemIndex + 1) % modeQuestions.length);
                // 卡牌消失
                sendMessage({ sceneId: 3});
                setSectionVisible({dice:true,question:false,chest:false,chance:false})
                reset()
            },1200)
        }
    }

    const AnswerBackground = React.memo(({ status }) => {
        let imgSrc = '';

        if (status === -1) {// 還沒選
            imgSrc = `./images/object/Basketball_monopoly_answer_button.png`;
        } else if (status === 1) {// 答對
            imgSrc = `./images/object/Basketball_monopoly_right_answer_button.png`;
        } else if (status === 0) {// 答錯
            imgSrc = `./images/object/Basketball_monopoly_wrong_answer_button.png`;
        }

        return (
            <img src={imgSrc} alt={`Basketball_monopoly_answer_${status}`}  loading="lazy" decoding="async"/>
        );
    });

    const handleNextPlayerTurn = () => {
        setPlayers(prevPlayers => {
            // 完全從最新的 prevPlayers 中尋找當前啟動的玩家索引
            const currentIndex = prevPlayers.findIndex(p => p.current === true);
            
            // 防錯：如果找不到當前玩家，不做任何事
            if (currentIndex === -1) return prevPlayers;

            // 計算下一位玩家的陣列索引（支援單人或多人，自動循環）
            const nextIndex = (currentIndex + 1) % prevPlayers.length;
            
            // 取得下一位玩家的真正 ID
            const nextPlayerId = prevPlayers[nextIndex].id;

            // 更新狀態
            return prevPlayers.map(p => {
                if (p.id === nextPlayerId) {
                    return { ...p, current: true };
                } else {
                    return { ...p, current: false };
                }
            });
        });
    };

    const reset=()=>{
        setIsCorrect(initialButtonState);// 選擇題所有按鈕狀態重置
        isProcessing.current=false
        setClickingBtn(null)// 正在點擊的按鈕狀態重置
    }

    // 渲染站在某一步的玩家棋子
    const renderPieces = (stepNum) => {
        // 找出所有在這一步的玩家
        const playersOnThisStep = players.filter(p => p.step === stepNum);

        if (playersOnThisStep.length === 0) return null;

        // 判斷容器的 ClassName
        let containerClass;
        if (stepNum === 1) {
            containerClass = MonopolyRoundPageStyle['player-pieces-container-1'];
        } else if (stepNum === 5 || stepNum === 12 || stepNum === 19) {
            containerClass = MonopolyRoundPageStyle[`player-pieces-container-with-img-${stepNum}`];
        } else {
            containerClass = MonopolyRoundPageStyle['player-pieces-container-with-questions'];
        }

        return (
        <div className={containerClass}>
            {playersOnThisStep.map((p) => {
                const playerImageKey = `finchPlayer${p.id}`;
                const playerImgSrc = modeImages?.[playerImageKey] || `./images/object/Basketball_monopoly_piece_0${p.id}.png`;

                return (
                    <div 
                        key={p.id} 
                        className={`
                            ${MonopolyRoundPageStyle['player-pieces']} 
                            ${MonopolyRoundPageStyle[`piece-${p.positionInStep}`]} 
                            ${p.current ? MonopolyRoundPageStyle['is-current'] : ''}
                        `}
                    >
                        <img 
                            src={playerImgSrc} 
                            alt={`player-${p.id}`} 
                        />
                    </div>
                );
            })}
        </div>
    );
    };

    // 判斷當前第幾步的操作
    const handleAfterStepActions=(step, skipQuestion = false)=>{
        if (step >= 24) {
            sendMessage({ sceneId: 5});
            setSectionVisible({ dice: false, question: true, chest: false, chance: false });
        } 
        else if (step === 5 || step===19) {
            handleOpenChest(step).then(() => {
                // 換下一位玩家
                handleNextPlayerTurn()
            })
            .catch(()=>{})
            .finally(()=>{setCardIndex({chest:0,chance:0})})
        } 
        else if (step === 12) {
            handleOpenChance()
            .finally(()=>{setCardIndex({chest:0,chance:0})})
        } 
        else if(step === 1){
            // 換下一位玩家
            handleNextPlayerTurn()
            sendMessage({ sceneId:3});
            setSectionVisible({ dice: true, question: false, chest: false, chance: false });
        }
        else {
            sendMessage({ sceneId: 5});
            // 如果 skipQuestion 為 true，則不顯示題目視窗直接跳下一位
            if (skipQuestion) {
                handleNextPlayerTurn();
                sendMessage({ sceneId: 3});
                setSectionVisible({ dice: true, question: false, chest: false, chance: false });
            } else {
                sendMessage({ sceneId: 5});
                setSectionVisible({ dice: false, question: true, chest: false, chance: false });
            }
        }
    }

    // 移動玩家到下一步
    const handleMoveThePlayer = (playerId,playerCurStep, nextStepOrTotal, skipQuestion = false) => {
        let finalStep
        const currentPlayer = players.find(p => p.id === playerId);
        let finalLap=currentPlayer.currentLap;
        if (!currentPlayer) return;

        if (Math.abs(nextStepOrTotal) > 30) {
            finalStep = 1; // 回到原點
        } else {
            const curStep = playerCurStep===null ?currentPlayer.step:playerCurStep;
            finalStep = curStep + nextStepOrTotal;
        }

        if(currentPlayer.currentLap===cfg.settings.lap){
            if(finalStep >= 24){
                finalStep=24;
                finalLap=currentPlayer.currentLap
            }
        }   
        else{
            if(finalStep > 24){
                finalStep=finalStep-24;
                finalLap=++currentPlayer.currentLap
            }
            else if(finalStep === 24){
                finalStep=24;
                finalLap=currentPlayer.currentLap
            }
        }
        if (finalStep <= 1) finalStep = 1;

        // 更新玩家位置
        setPlayers(prevPlayers => {
            // 找出在同一個 step 的其他玩家
            const playersOnThisStep = prevPlayers.filter(p => p.step === finalStep && p.id !== playerId);
            // 把這些玩家佔用的 positionInStep 全部放進一個 Set (效能更好，查詢快)
            const occupiedPositions = new Set(playersOnThisStep.map(p => p.positionInStep));
            
            //  從 1 開始找，第一個不在 Set 裡的數字就是我們要的最小空位
            let targetPosition = 1;
            while (occupiedPositions.has(targetPosition)) {
                targetPosition++;
            }

            //  更新玩家狀態
            return prevPlayers.map(p => 
                p.id === playerId 
                    ? { ...p, step: finalStep, positionInStep: targetPosition,currentLap:finalLap } 
                    : p
            );
        });

        setTimeout(() => {
            handleAfterStepActions(finalStep, skipQuestion)
            setIsRolling(false);
            setDiceNumber(3); 
        }, 1000);
    };

    const getRandomCard=(type)=>{
        const random=Math.floor(Math.random()*100)+1;
        if(type==="chest"){
            if(random<=30){
                return 1;
            }else if(random<=60){
                return 2;
            }else if(random<=90){
                return 3;
            }else{
                return 4;
            }           
            // 1–30 (30%): 卡片 1
            // 31–60 (30%): 卡片 2
            // 61–90 (30%): 卡片 3
            // 91–100 (10%): 卡片 4
        }
        else{
            if (random <= 10) {
                return 1; // 1~10 (10%)
            } else if (random <= 50) {
                return 2; // 11~50 (40%)
            } else if (random <= 75) {
                return 3; // 51~75 (25%)
            } else {
                return 4; // 76~100 (25%)
            }
            // 1–10 (10%): 卡片 1
            // 11–50 (40%): 卡片 2
            // 51–75 (25%): 卡片 3
            // 76–100 (25%): 卡片 4
        }
    }

    const handleOpenChest=(curStep)=>{// 打開命運卡
        if (chestTimer.current) {
            return Promise.reject("寶箱動畫進行中，阻擋重複觸發");
        }
        // 立刻上鎖：先把門關上，防止極短時間內的連點
        chestTimer.current = true;
        return new Promise((resolve,reject)=>{
            let currentNewStep;
            const cardId=getRandomCard("chest");
            setCardIndex(prev=>({...prev,chest:cardId}))
            sendMessage({ sceneId: 6});
            setSectionVisible({dice:false,question:false,chest:true,chance:false})
            chestTimer.current=setTimeout(()=>{
                // 執行完畢後，將 ref 清空，釋放鎖定狀態
                chestTimer.current = null;
                setSectionVisible({dice:false,question:false,chest:false,chance:false})
                if(cardId===1){// 後退一步
                    const playerId=players.find(p=>p.current===true).id
                    handleMoveThePlayer(playerId,curStep,-1,true)
                    reject()
                }
                else if(cardId===2){// 回到原點
                    const playerId=players.find(p=>p.current===true).id
                    handleMoveThePlayer(playerId,curStep,-100,true)
                    reject()
                }
                else if(cardId===3){// 暫停一回
                    setPlayers(prevPlayers => 
                        prevPlayers.map(p => 
                            p.current === true ? {...p, pauseRound: 1} : p)
                    )
                    sendMessage({ sceneId: 3});
                    setSectionVisible({dice:true,question:false,chest:false,chance:false})
                    resolve()
                }
                else{// 和最近的玩家換位置
                    setPlayers(prevPlayers => {
                        // 找到當前玩家
                        const currentPlayer = prevPlayers.find(p => p.current);
                        if (!currentPlayer) return prevPlayers;
    
                        // 尋找最近的玩家 (排除自己)
                        let closestPlayer = null;
                        let minDistance = Infinity;
    
                        prevPlayers.forEach(p => {
                            if (p.id !== currentPlayer.id) {
                                const distance = Math.abs(p.step - currentPlayer.step);
                                // 如果距離更小，或者距離一樣但我們想選特定的(例如後面的玩家)，就更新
                                if (distance < minDistance|| (distance === minDistance && p.step > currentPlayer.step)) {
                                    minDistance = distance;
                                    closestPlayer = p;
                                    currentNewStep= p.step;
                                }
                            }
                        });
    
                        // 如果找不到其他人（例如只有一個玩家），就原地不動
                        if (!closestPlayer) {
                            currentNewStep=null
                            return prevPlayers
                        }
    
                        // 執行交換 (回傳新的陣列)
                        return prevPlayers.map(p => {
                            const playersOnThisStep = prevPlayers.filter(p => p.step === closestPlayer.step && p.id !== currentPlayer.id);
                            //  把這些玩家佔用的 positionInStep 全部放進一個 Set (效能更好，查詢快)
                            const occupiedPositions = new Set(playersOnThisStep.map(p => p.positionInStep));
                            
                            //  從 1 開始找，第一個不在 Set 裡的數字就是我們要的最小空位
                            let targetPosition = 1;
                            while (occupiedPositions.has(targetPosition)) {
                                targetPosition++;
                            }
                            if (p.id === currentPlayer.id) {
                                // 當前玩家拿到目標的位置
                                return { ...p, step: closestPlayer.step,positionInStep:targetPosition,currentLap:closestPlayer.currentLap };
                            }
                            if (p.id === closestPlayer.id) {
                                // 目標玩家拿到當前玩家的位置
                                return { ...p, step: currentPlayer.step,positionInStep:currentPlayer.positionInStep,currentLap:currentPlayer.currentLap };
                            }
                            return p;
                        });
                    });
                    // 根據換到的位置判斷之後的操作
                    if(currentNewStep===null){
                        // 換下一位玩家
                        handleNextPlayerTurn()
                        sendMessage({ sceneId: 3});
                        setSectionVisible({dice:true,question:false,chest:false,chance:false})
                    }
                    else{
                        handleAfterStepActions(currentNewStep,true)
                    }
                    reject()
                }
            },1000)
        })
    }

    const handleOpenChance=()=>{// 打開機會卡
        if (chanceTimer.current) {
            return Promise.reject("機會卡動畫進行中，阻擋重複觸發");
        }
        // 立刻上鎖：先把門關上，防止極短時間內的連點
        chanceTimer.current = true;
        return new Promise(()=>{
            let currentNewStep;
            const cardId=getRandomCard("chance");
            setCardIndex(prev=>({...prev,chance:cardId}))
            sendMessage({ sceneId:7});
            setSectionVisible({dice:false,question:false,chest:false,chance:true})
            chanceTimer.current=setTimeout(()=>{
                // 執行完畢後，將 ref 清空，釋放鎖定狀態
                chanceTimer.current = null;
                setSectionVisible({dice:false,question:false,chest:false,chance:false})
                if(cardId===1){// 再骰一次
                    sendMessage({ sceneId: 3});
                    setSectionVisible({dice:true,question:false,chest:false,chance:false})
                    handleDiceClick(12,true)
                }
                else if(cardId===2){// 前進一步
                    const playerId=players.find(p=>p.current===true).id
                    handleMoveThePlayer(playerId,12,1,true)
                }
                else if(cardId===3){// 前進二步
                    const playerId=players.find(p=>p.current===true).id
                    handleMoveThePlayer(playerId,12,2,true)
                }
                else{// 和前面最近的玩家同一格
                    setPlayers(prevPlayers => {
                        // 找到當前玩家
                        const currentPlayer = prevPlayers.find(p => p.current);
                        if (!currentPlayer) return prevPlayers;
    
                        // 尋找最近的玩家 (排除自己)
                        let closestPlayer = null;
                        let minDistance = Infinity;
    
                        prevPlayers.forEach(p => {
                            if (p.id !== currentPlayer.id && p.step > currentPlayer.step) {
                                const distance = Math.abs(p.step - currentPlayer.step);
                                
                                // 邏輯：找到距離最小的人
                                if (distance < minDistance) {
                                    minDistance = distance;
                                    closestPlayer = p;
                                    currentNewStep= p.step;
                                }
                            }
                        });
    
                        // 如果找不到其他人（例如只有一個玩家），就原地不動
                        if (!closestPlayer) {
                            currentNewStep=null
                            return prevPlayers
                        }
    
                        // 更新當前玩家的位置
                        return prevPlayers.map(p => {
                            const playersOnThisStep = prevPlayers.filter(p => p.step === closestPlayer.step && p.id !== currentPlayer.id);
                            //  把這些玩家佔用的 positionInStep 全部放進一個 Set (效能更好，查詢快)
                            const occupiedPositions = new Set(playersOnThisStep.map(p => p.positionInStep));
                            
                            //  從 1 開始找，第一個不在 Set 裡的數字就是我們要的最小空位
                            let targetPosition = 1;
                            while (occupiedPositions.has(targetPosition)) {
                                targetPosition++;
                            }
                            if (p.id === currentPlayer.id) {
                                // 將自己的 step 設為跟最近的人一樣
                                return { ...p, step: closestPlayer.step,positionInStep:targetPosition,currentLap:closestPlayer.currentLap };
                            }
                            return p;
                        });
                    });
                    // 根據換到的位置判斷之後的操作
                    if(currentNewStep===null){
                        // 換下一位玩家
                        handleNextPlayerTurn()
                        sendMessage({ sceneId: 3});
                        setSectionVisible({dice:true,question:false,chest:false,chance:false})
                    }
                    else{
                        handleAfterStepActions(currentNewStep,true)
                    }
                }
            },1000)
        })
    }


    return (
        <div className="page-container" style={pageStyle}>
            {/* 卡片區域：寶箱 */}
            <div className={`${MonopolyRoundPageStyle["card-section"]} ${sectionVisible.chest === false ? MonopolyRoundPageStyle.sectionHidden : ''}`}>
                <img src={`./images/object/Basketball_monopoly_community_chest_card_0${cardIndex.chest}.png`} alt={`chest_card_0${cardIndex.chest}`} />
            </div>

            {/* 卡片區域：機會 */}
            <div className={`${MonopolyRoundPageStyle["card-section"]} ${sectionVisible.chance === false ? MonopolyRoundPageStyle.sectionHidden : ''}`}>
                <img src={`./images/object/Basketball_monopoly_chance_card_0${cardIndex.chance}.png`} alt={`chance_card_0${cardIndex.chance}`} />
            </div>

            {/* 骰子區域 */}
            <div className={`${MonopolyRoundPageStyle["dice-section"]} ${sectionVisible.dice === false ? MonopolyRoundPageStyle.sectionHidden : ''}`}
                onMouseEnter={() => { setScaleForDice(1.1)}}
                onMouseLeave={() => { setScaleForDice(1) }}
                onClick={() => { handleDiceClick(null) }}
                style={{ transform: `scale(${scaleForDice})` }}>
                <img src="./images/object/Basketball_monopoly_dice_background.png" alt="" />

                <div className={MonopolyRoundPageStyle["dice-face"]} style={{ cursor: isRolling ? "not-allowed" : "pointer" }}>
                    <div className={`${MonopolyRoundPageStyle["dice-dots"]} ${MonopolyRoundPageStyle[`dice-value-${diceNumber}`]}`}>
                        {/* 根據點數產生對應數量的點點 */}
                        {Array.from({ length: diceNumber }).map((_, i) => (
                            <span key={i} className={MonopolyRoundPageStyle.dot}></span>
                        ))}
                    </div>
                </div>
            </div>

            {/* 問題區域 */}
            <div className={`${MonopolyRoundPageStyle["question-section"]} ${sectionVisible.question === false ? MonopolyRoundPageStyle.sectionHidden : ''}`}>
                <span className={MonopolyRoundPageStyle['question-text']}>Question</span>
                <span className={MonopolyRoundPageStyle['question-content-text']} style={{ fontSize: getQuestionFontSize(modeQuestions[currentProblemIndex]?.question) }}>{modeQuestions[currentProblemIndex]?.question || "Default Question"}</span>
                <img src="./images/object/Basketball_monopoly_question_frame.png" alt="" />
                
                <div className={MonopolyRoundPageStyle["answer-section"]}>
                    <button 
                        className={`${MonopolyRoundPageStyle["answer-image-button"]} ${clickingBtn === 'A' ? MonopolyRoundPageStyle.clicking : ''}`}
                        disabled={isProcessing.current} 
                        onClick={() => { handleButtonClick('A', modeQuestions[currentProblemIndex]?.options[0]) }}>
                        <div className={MonopolyRoundPageStyle["answer-text"]} style={{ fontSize: getAnswerFontSize(modeQuestions[currentProblemIndex]?.options[0]) }}>{modeQuestions[currentProblemIndex]?.options[0] || `A`}</div>
                        <AnswerBackground status={isCorrect.A} />
                    </button>
                    
                    <button 
                        className={`${MonopolyRoundPageStyle["answer-image-button"]} ${clickingBtn === 'B' ? MonopolyRoundPageStyle.clicking : ''}`}
                        disabled={isProcessing.current} 
                        onClick={() => handleButtonClick('B', `${modeQuestions[currentProblemIndex]?.options[1]}`)}>
                        <div className={MonopolyRoundPageStyle["answer-text"]} style={{ fontSize: getAnswerFontSize(modeQuestions[currentProblemIndex]?.options[1]) }}>{modeQuestions[currentProblemIndex]?.options[1] || `B`}</div>
                        <AnswerBackground status={isCorrect.B} />
                    </button>
                    
                    <button 
                        className={`${MonopolyRoundPageStyle["answer-image-button"]} ${clickingBtn === 'C' ? MonopolyRoundPageStyle.clicking : ''}`}
                        disabled={isProcessing.current} 
                        onClick={() => handleButtonClick('C', `${modeQuestions[currentProblemIndex]?.options[2]}`)}>
                        <div className={MonopolyRoundPageStyle["answer-text"]} style={{ fontSize: getAnswerFontSize(modeQuestions[currentProblemIndex]?.options[2]) }}>{modeQuestions[currentProblemIndex]?.options[2] || `C`}</div>
                        <AnswerBackground status={isCorrect.C} />
                    </button>
                </div>
            </div>

            {/* 地圖格子區域 */}
            <div>
                {Array.from({ length: 24 }, (_, i) => i + 1).map((stepNum) => (
                    <div key={stepNum} className={`${MonopolyRoundPageStyle["step-box"]} ${MonopolyRoundPageStyle[`step-${stepNum}`]}`}>
                        {stepNum === 1 && 
                            <>
                                <img src="./images/object/Basketball_monopoly_GO_text.png" alt="" />
                                <img className={MonopolyRoundPageStyle["arrow-direction"]} src="./images/object/Basketball_monopoly_GO_arrow.png" alt="" />
                            </>}
                        
                        {(stepNum === 5 || stepNum === 19) && <img src="./images/object/Basketball_monopoly_question_mark.png" alt="" className={MonopolyRoundPageStyle["grid-icon"]} />}
                        {stepNum === 12 && <img src="./images/object/Basketball_monopoly_treasure_chest.png" alt="" className={MonopolyRoundPageStyle["grid-icon"]} />}

                        {
                            stepNum !== 1 && stepNum !== 5 && stepNum !== 12 && stepNum !== 19 && (
                                <span>Question</span>
                            )
                        }
                        
                        {/* 渲染站在這格的所有棋子 */}
                        {renderPieces(stepNum)}
                    </div>
                ))}
            </div>
            {/* logo */}
            {
                cfg.settings.isSubscribe===false
                &&
                <div className='logo-gray'>
                <img src="./images/object/logo-gray.png" alt="logo" ></img>
                </div>
            }
            {/* 額外資源 */}
            {(sectionVisible.dice) && pageAssetsInStage3.map((asset) => (
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
            {(sectionVisible.question) && pageAssetsInStage5.map((asset) => (
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
            {sectionVisible.chest && pageAssetsInStage6.map((asset) => (
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
            {sectionVisible.chance && pageAssetsInStage7.map((asset) => (
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
    )
}

export default MonopolyRoundPage;