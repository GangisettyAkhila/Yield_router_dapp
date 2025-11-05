import * as React from 'react';

interface SoundEffects {
  playHover: () => void;
  playClick: () => void;
}

export function useSoundEffects(): SoundEffects {
  const [hoverSound] = React.useState(() => new Audio('/src/assets/sounds/hover.mp3'));
  const [clickSound] = React.useState(() => new Audio('/src/assets/sounds/click.mp3'));

  // Preload sounds
  React.useEffect(() => {
    hoverSound.load();
    clickSound.load();
  }, [hoverSound, clickSound]);

  const playHover = React.useCallback(() => {
    hoverSound.currentTime = 0;
    hoverSound.volume = 0.2;
    hoverSound.play().catch(() => {
      // Ignore errors - browsers may block autoplay
    });
  }, [hoverSound]);

  const playClick = React.useCallback(() => {
    clickSound.currentTime = 0;
    clickSound.volume = 0.3;
    clickSound.play().catch(() => {
      // Ignore errors - browsers may block autoplay
    });
  }, [clickSound]);

  return { playHover, playClick };
}