interface WallThicknessSliderProps {
  thickness: number;
  onThicknessChange: (thickness: number) => void;
}

export function WallThicknessSlider({ thickness, onThicknessChange }: WallThicknessSliderProps) {
  return (
    <div className="parameter-slider-container">
      <div className="parameter-slider-header">
        <span className="parameter-slider-label">Wall Thickness</span>
        <span className="parameter-slider-value">{thickness}</span>
        <span className="parameter-slider-unit">units</span>
      </div>
      <div className="parameter-slider-wrapper">
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={thickness}
          onChange={(e) => onThicknessChange(parseFloat(e.target.value))}
          className="parameter-slider"
        />
        <div className="parameter-slider-track">
          <div
            className="parameter-slider-fill"
            style={{ width: `${((thickness - 0.1) / (10 - 0.1)) * 100}%` }}
          />
        </div>
      </div>
      <div className="parameter-slider-range">
        <span>0.1</span>
        <span>2</span>
      </div>
    </div>
  );
}
