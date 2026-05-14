import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { useColors } from '@/hooks/useColors';
import { formatCurrency } from '@/lib/formatters';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  total: number;
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({ data, total, size = 160, strokeWidth = 24 }: DonutChartProps) {
  const colors = useColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;

  const segments = data.map((seg) => {
    const pct = total > 0 ? seg.value / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const rotation = (offset / total) * 360 - 90;
    offset += seg.value;
    return { ...seg, dash, gap, rotation };
  });

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surface2 }]}>
        <Text style={{ color: colors.t3, fontSize: 12 }}>Aucune donnée</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G>
          {segments.map((seg, i) => (
            <Circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={0}
              rotation={seg.rotation}
              origin={`${center}, ${center}`}
              strokeLinecap="butt"
            />
          ))}
        </G>
      </Svg>
      <View style={[styles.center, { width: size - strokeWidth * 2 - 8, height: size - strokeWidth * 2 - 8 }]}>
        <Text style={[styles.totalLabel, { color: colors.t3 }]}>Total</Text>
        <Text style={[styles.totalValue, { color: colors.t1 }]} numberOfLines={1}>
          {formatCurrency(total)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
