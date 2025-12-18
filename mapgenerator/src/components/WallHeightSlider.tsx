interface WallHeightSliderProps {
  height: number;
  onHeightChange: (height: number) => void;
}

export function WallHeightSlider({ height, onHeightChange }: WallHeightSliderProps) {
  return (
    <div className="parameter-slider-container">
      <div className="parameter-slider-header">
        <span className="parameter-slider-label">Wall Height</span>
        <span className="parameter-slider-value">{height}</span>
        <span className="parameter-slider-unit">units</span>
      </div>
      <div className="parameter-slider-wrapper">
        <input
          type="range"
          min="1"
          max="50"
          step="1"
          value={height}
          onChange={(e) => onHeightChange(parseFloat(e.target.value))}
          className="parameter-slider"
        />
        <div className="parameter-slider-track">
          <div
            className="parameter-slider-fill"
            style={{ width: `${((height - 1) / (50 - 1)) * 100}%` }}
          />
        </div>
      </div>
      <div className="parameter-slider-range">
        <span>1</span>
        <span>50</span>
      </div>
    </div>
  );
}
