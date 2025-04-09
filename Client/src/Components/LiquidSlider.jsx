// src/components/LiquidSlider.jsx
import React, { useState, useRef, useEffect } from 'react';
import './LiquidSlider.css'; // We'll create this CSS file next

const LiquidSlider = ({ min, max, step, value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  // Calculate the percentage for the liquid fill
  const percentage = ((value - min) / (max - min)) * 100;

  // Handle mouse and touch events
  const handleStart = () => setIsDragging(true);
  const handleEnd = () => setIsDragging(false);

  const handleMove = (clientX) => {
    if (!isDragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const newPercentage = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const newValue = min + newPercentage * (max - min);
    const steppedValue = Math.round(newValue / step) * step;
    onChange(Math.min(Math.max(steppedValue, min), max));
  };

  const handleMouseMove = (e) => handleMove(e.clientX);
  const handleTouchMove = (e) => handleMove(e.touches[0].clientX);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  return (
    <div
      className="liquid-slider"
      ref={sliderRef}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      <div className="liquid-slider-track">
        <div
          className="liquid-slider-fill"
          style={{ width: `${percentage}%` }}
        >
          <div className="liquid-slider-wave" />
        </div>
      </div>
      <div
        className="liquid-slider-thumb"
        style={{ left: `${percentage}%` }}
      />
    </div>
  );
};

export default LiquidSlider;
