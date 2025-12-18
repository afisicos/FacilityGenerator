
interface BottomBarProps {
  wallHeight: number;
  wallThickness: number;
  onWallHeightChange: (height: number) => void;
  onWallThicknessChange: (thickness: number) => void;
}

// Enhanced Slider Input Component
function SliderInput({ label, value, onChange, min, max, step, unit = '' }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="bottom-slider-container">
      <div className="bottom-slider-row">
        <label className="bottom-slider-label">{label}</label>

        <span className="bottom-slider-min">{min}</span>

        <div className="bottom-slider-wrapper">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="bottom-slider-input"
          />

          <div className="bottom-slider-track">
            <div
              className="bottom-slider-fill"
              style={{ width: `${percentage}%` }}
            />
            <div
              className="bottom-slider-thumb"
              style={{ left: `${percentage}%` }}
            />
          </div>
        </div>

        <span className="bottom-slider-max">{max}</span>

        <div className="bottom-slider-value-display">
          <span className="bottom-slider-value">{value}</span>
          <span className="bottom-slider-unit">{unit}</span>
        </div>
      </div>
    </div>
  );
}

export function BottomBar({
  wallHeight,
  wallThickness,
  onWallHeightChange,
  onWallThicknessChange,
}: BottomBarProps) {
  return (
    <div className="bottom-bar">
      <div className="bottom-bar-content">
        <SliderInput
          label="Wall Height"
          value={wallHeight}
          onChange={onWallHeightChange}
          min={1}
          max={50}
          step={1}
          unit=" units"
        />

        <SliderInput
          label="Wall Thickness"
          value={wallThickness}
          onChange={onWallThicknessChange}
          min={0.1}
          max={10}
          step={0.1}
          unit=" units"
        />
      </div>
    </div>
  );
}
