const fs = require('fs');
const file = 'c:\\invest\\components\\screens\\signup-flow-screens.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { LinearGradient } from 'expo-linear-gradient';",
  "import { LinearGradient } from 'expo-linear-gradient';\nimport { BlurView } from 'expo-blur';\nimport { styles } from './signup-flow-styles';"
);

content = content.replace(
  '<StatusBar barStyle="light-content" backgroundColor={colors.dark} />',
  '<LinearGradient colors={[\'#0F172A\', \'#020617\', \'#1E1B4B\']} style={styles.globalBackground} />\n      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />\n      <BlurView intensity={isTablet ? 30 : 0} tint="dark" style={[styles.stepShellBlur, !isTablet && styles.stepShellMobileBlur]}>'
);

content = content.replace(
  '<LinearGradient colors={gradients.dark} style={[styles.heroPanel, { paddingTop: Math.max(insets.top + 12, 26) }]}>',
  '<LinearGradient colors={[\'rgba(255,255,255,0.05)\', \'transparent\']} style={[styles.heroPanel, { paddingTop: Math.max(insets.top + 12, 26) }]}>'
);

content = content.replace(
  '        <View style={styles.progressRail}>\n          <View style={[styles.progressFill, { width: stepProgressWidth }]} />\n        </View>\n      </View>\n    </AppScreen>',
  '        <View style={styles.progressRail}>\n          <View style={[styles.progressFill, { width: stepProgressWidth }]} />\n        </View>\n      </View>\n      </BlurView>\n    </AppScreen>'
);

content = content.replace(/const styles = StyleSheet\.create\(\{[\s\S]*\}\);\s*$/, '');

fs.writeFileSync(file, content);
console.log('Patch successfully applied to signup-flow-screens.tsx');
