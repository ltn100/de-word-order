import { getLegendEntries } from '../utils/colorUtils';
import './ColorLegend.css';

export function ColorLegend() {
  const entries = getLegendEntries();

  return (
    <div className="color-legend">
      <h3 className="legend-title">Word Types</h3>
      <div className="legend-entries">
        {entries.map((entry) => (
          <div key={entry.label} className="legend-entry">
            <span
              className="legend-color"
              style={{ backgroundColor: entry.color }}
            />
            <span className="legend-label">{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
