interface Segment {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  segments: Segment[];
  total: number;
  size?: number;
  thickness?: number;
}

export default function DonutChart({
  segments,
  total,
  size = 160,
  thickness = 28,
}: DonutChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="flex items-center gap-6">
      {/* SVG 도넛 차트 */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* 배경 원 */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={thickness}
          />

          {/* 데이터 세그먼트 */}
          {segments.map((seg, idx) => {
            const percent = seg.value / total;
            const dashArray = percent * circumference;
            const dashOffset = circumference * (1 - cumulativePercent) - circumference / 4;
            cumulativePercent += percent;

            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                strokeDashoffset={-dashOffset + circumference / 4}
                strokeLinecap="butt"
                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
              />
            );
          })}
        </svg>

        {/* 가운데 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-text-primary">
            {total.toLocaleString()}
          </span>
          <span className="text-xs text-text-muted">Total Issues</span>
        </div>
      </div>

      {/* 범례 */}
      <div className="space-y-2">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-text-secondary">
              {seg.label} : {seg.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
