import React, { useEffect, useState } from 'react';

const ProgressPlaceholder = ({progress}) => {
  const position = 100 - progress;
  const styles = `
    .progress-placeholder {
      width: 100%;
      aspect-ratio: 1/1;
      background-color: var(--cui-body-bg);
      background: linear-gradient(90deg, var(--cui-primary) 0%, var(--cui-primary) 50%, orange 100%);
      background-size: 200% 100%;
      animation: gradient-animation 2s ease infinite;
      position: relative;
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
