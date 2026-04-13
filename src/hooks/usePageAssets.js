import { useMemo } from 'react';

const usePageAssets = (modeAssets = [], sceneId = 1) => {
  const styledAssets = useMemo(() => {
    if (!Array.isArray(modeAssets)) return [];

    return modeAssets
      .filter(asset => Number(asset.StageId) === sceneId)
      .map(asset => {
        const isText = asset.Type === 'Text';
        
        const baseStyle = {
          position: 'absolute',
          left: `${asset.Position_X}px`,
          top: `${asset.Position_Y}px`,
          width: `${asset.Width}px`,
          height: `${asset.Height}px`,
          transform: `rotate(${asset.Rotation}deg)`,
          pointerEvents: 'none',
          zIndex: "99",
        };

        const textStyle = isText ? {
          display: 'flex',
          alignItems: 'center',
          justifyContent: asset.Align?.toLowerCase() === 'center' ? 'center' : (asset.Align?.toLowerCase() === 'right' ? 'flex-end' : 'flex-start'),
          fontFamily: asset.FontFamily,
          fontSize: `${asset.FontSize}px`,
          color: asset.Color,
          textAlign: asset.Align?.toLowerCase(),
          fontWeight: asset.Weight?.toLowerCase(),
          fontStyle: asset.FontStyle,
          textDecoration:asset.TextDecoration,
        } : {};

        return {
          ...asset,
          displayContent: asset.Content, 
          style: { ...baseStyle, ...textStyle }
        };
      });
  }, [modeAssets, sceneId]);

  return styledAssets;
};

export default usePageAssets;