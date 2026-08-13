import { Image, StyleSheet, View } from 'react-native';

type BrandLogoProps = {
  size?: number;
};

const brandLogoSource = require('../../assets/brand-logo.png');

export const BrandLogo = ({ size = 72 }: BrandLogoProps) => {
  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <Image
        source={brandLogoSource}
        style={styles.image}
        resizeMode="contain"
        accessible
        accessibilityLabel="Anusha Trade logo"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
