import { useCallback } from 'react';

const TARGET_ORIGIN = process.env.REACT_APP_GAME_TARGET_ORIGIN || '*';

const useSendGameMessage = (targetOrigin = TARGET_ORIGIN) => {
  const sendMessage = useCallback(({sceneId}) => {
    const message = {
      type: 'SCENE_CHANGE',
      sceneId: sceneId,
    };

    window.parent.postMessage(message, targetOrigin);
  }, [targetOrigin]);

  return { sendMessage };
};

export default useSendGameMessage;