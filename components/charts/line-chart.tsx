import Svg, { Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import { colors } from '../../constants/theme';
import { EarningsPoint } from '../../types';

type LineChartProps = {
  data: EarningsPoint[];
  height?: number;
};

export const LineChart = React.memo(({ data = [], height = 170 }: LineChartProps) => {
  const width = 320;
  const chartHeight = height;
  const chartWidth = width;
  const maxValue = Math.max(...(data || []).map((point) => point.value), 1);

  const points = useMemo(
    () =>
      (data || []).map((point, index) => {
        const x = (index / Math.max(data.length - 1, 1)) * (chartWidth - 24) + 12;
        const y = chartHeight - (point.value / maxValue) * (chartHeight - 44) - 24;
        return { ...point, x, y };
      }),
    [chartHeight, chartWidth, data, maxValue]
  );

  const hasPoints = points.length > 0;
  const path = hasPoints ? points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ') : null;
  const area = hasPoints ? `${path} L ${points[points.length - 1].x} ${chartHeight - 12} L ${points[0].x} ${chartHeight - 12} Z` : null;

  return (
    <View>
      <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <Defs>
          <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.25" />
            <Stop offset="0.7" stopColor={colors.primary} stopOpacity="0.08" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.0" />
          </LinearGradient>
          <LinearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.primary} />
            <Stop offset="0.5" stopColor={colors.cyan} />
            <Stop offset="1" stopColor={colors.success} />
          </LinearGradient>
        </Defs>

        {[0.25, 0.5, 0.75].map((value) => (
          <Line
            key={value}
            x1="0"
            x2={chartWidth}
            y1={chartHeight * value}
            y2={chartHeight * value}
            stroke="#E2E8F0"
            strokeDasharray="4 6"
            strokeWidth="1"
          />
        ))}

        {area ? <Path d={area} fill="url(#chartGradient)" /> : null}
        {path ? <Path d={path} fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : null}

        {points.map((point) => (
          <SvgText
            key={point.label}
            x={point.x}
            y={chartHeight - 4}
            fontSize="10"
            fontWeight="600"
            fill="#64748B"
            textAnchor="middle"
          >
            {point.label}
          </SvgText>
        ))}

        {!hasPoints ? (
          <SvgText x={chartWidth / 2} y={chartHeight / 2} fontSize="12" fill="#94A3B8" textAnchor="middle">
            No projection data available
          </SvgText>
        ) : null}
      </Svg>
    </View>
  );
});
