import { useMemo } from 'react';

const usePageAssets = (modeAssets, sceneId = 1) => {
  // 使用 useMemo 避免每次 render 都重新計算篩選
  const styledAssets = useMemo(() => {
    if (!Array.isArray(modeAssets)) return [];

    return modeAssets
      .filter(asset => asset.sceneId === sceneId)
      .map(asset => ({
        ...asset,
        // 直接將轉換好的 style 準備好放在物件裡
        style: {
          position: 'absolute',
          left: asset.position?.x || 0,
          top: asset.position?.y || 0,
          width: asset.textWidth,
          height: asset.textHeight,
          fontFamily: asset.fontFamily,
          textAlign: asset.textAlign,
          fontSize: asset.fontSize,
          color: asset.color,
          fontWeight: asset.fontWeight,
          fontStyle: asset.fontStyle,
          textDecoration: asset.textDecoration,
          pointerEvents: 'none',
          zIndex: "99"
        }
      }));
  }, [modeAssets, sceneId]);

  return styledAssets;
};

export default usePageAssets;