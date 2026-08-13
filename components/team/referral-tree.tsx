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
        <Line x1={centerX} y1="24" x2={centerX} y2={height - 36} stroke="#CBD5E1" strokeWidth="2" />
        <Circle cx={centerX} cy="18" r="12" fill={colors.primary} />
        <SvgText x={centerX} y="22" fill={colors.surface} fontSize="10" fontWeight="700" textAnchor="middle">
          YOU
        </SvgText>

        {levels.map((level, index) => {
          const y = 58 + index * 48;
          const right = index % 2 === 0;
          const nodeX = right ? width - 96 : 96;
          const lineEnd = right ? nodeX - 22 : nodeX + 22;

          return (
            <View key={level.id}>
              <Line x1={centerX} y1={y} x2={lineEnd} y2={y} stroke="#94A3B8" strokeWidth="2" />
              <Circle cx={nodeX} cy={y} r="20" fill={right ? colors.primary : colors.tertiary} />
              <SvgText x={nodeX} y={y + 4} fill={colors.surface} fontSize="11" fontWeight="700" textAnchor="middle">
                L{index + 1}
              </SvgText>
              <SvgText
                x={right ? nodeX - 34 : nodeX + 34}
                y={y - 4}
                fill={colors.text}
                fontSize="11"
                fontWeight="700"
                textAnchor={right ? 'end' : 'start'}
              >
                {level.title}
              </SvgText>
              <SvgText
                x={right ? nodeX - 34 : nodeX + 34}
                y={y + 12}
                fill={colors.muted}
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
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
  },
});
