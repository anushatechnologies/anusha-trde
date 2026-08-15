import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '../../constants/theme';
import { TeamTreeNode } from '../../types';

type ReferralTreeProps = {
  levels: TeamTreeNode[];
};

export const ReferralTree = ({ levels }: ReferralTreeProps) => {
  const width = 320;
  const height = 360;
  const centerX = width / 2;

  return (
    <View style={styles.container}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1={centerX} y1="24" x2={centerX} y2={height - 36} stroke="rgba(56, 189, 248, 0.3)" strokeWidth="2" />
        <Circle cx={centerX} cy="18" r="14" fill={colors.primary} />
        <SvgText x={centerX} y="22" fill="#FFFFFF" fontSize="10" fontWeight="700" textAnchor="middle">
          YOU
        </SvgText>

        {levels.map((level, index) => {
          const y = 58 + index * 48;
          const right = index % 2 === 0;
          const nodeX = right ? width - 96 : 96;
          const lineEnd = right ? nodeX - 22 : nodeX + 22;

          return (
            <View key={level.id}>
              <Line x1={centerX} y1={y} x2={lineEnd} y2={y} stroke="rgba(56, 189, 248, 0.25)" strokeWidth="2" />
              <Circle cx={nodeX} cy={y} r="18" fill={right ? '#2563EB' : '#0284C7'} />
              <SvgText x={nodeX} y={y + 4} fill="#FFFFFF" fontSize="11" fontWeight="700" textAnchor="middle">
                L{index + 1}
              </SvgText>
              <SvgText
                x={right ? nodeX - 30 : nodeX + 30}
                y={y - 3}
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="700"
                textAnchor={right ? 'end' : 'start'}
              >
                {level.title}
              </SvgText>
              <SvgText
                x={right ? nodeX - 30 : nodeX + 30}
                y={y + 13}
                fill={colors.cyan}
                fontSize="10"
                textAnchor={right ? 'end' : 'start'}
              >
                {level.members} members
              </SvgText>
            </View>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
  },
});
