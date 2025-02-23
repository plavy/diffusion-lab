import React from 'react';

const ProgressPlaceholder = ({progress, color_left='var(--cui-primary)', color_right='orange'}) => {
  const position = 100 - progress;
  const styles = `
    .progress-placeholder {
      width: 100%;
      aspect-ratio: 1/1;
      background-color: var(--cui-body-bg);
      background: linear-gradient(90deg, ${color_left} 0%, ${color_left} 50%, ${color_right} 100%);
      background-size: 200% 100%;
      animation: gradient-animation 2s ease infinite;
    }

    @keyframes gradient-animation {
      0% {
        background-position: 10% 100%;
      }
      50% {
        background-position: ${position}% 100%;
      }
      100% {
        background-position: 10% 100%;
      }
    }
  `
  return <div>
    <style>{styles}</style>
    <div className="progress-placeholder"></div>
  </div>;
};

export default ProgressPlaceholder;
