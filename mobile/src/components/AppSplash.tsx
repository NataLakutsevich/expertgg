import React from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../theme/theme';

// Base dimensions of the logo lockup as sized on SignInScreen (small, top-aligned
// there because a form sits below it). Scaling all three glyphs by the same
// factor preserves the baseline-alignment compensation already tuned for the
// PNGs' internal whitespace (see each glyph's translateY below).
const BASE_E_HEIGHT = 35.7;
const BASE_E_ASPECT = 349 / 365;
const BASE_PERT_HEIGHT = 59.4;
const BASE_PERT_ASPECT = 1246 / 609;
const BASE_SWORD_SIZE = 43;
const BASE_GAP = 6;
const BASE_LOCKUP_WIDTH =
  BASE_E_HEIGHT * BASE_E_ASPECT + BASE_SWORD_SIZE + BASE_PERT_HEIGHT * BASE_PERT_ASPECT + 2 * BASE_GAP;

// Target: the full "e[swords]pert" lockup spans ~72% of screen width, centered
// on screen — matches the dedicated splash mock (unlike SignInScreen, there is
// no form below it to leave room for).
const LOCKUP_WIDTH_PERCENT = 0.72;

/**
 * Branded splash shown while AuthContext resolves the stored session
 * (RootNavigator's "loading" state) — the native boot splash hands off to
 * this, which then hands off to SignIn or Tabs.
 */
export default function AppSplash() {
  const { width } = useWindowDimensions();
  const scale = (width * LOCKUP_WIDTH_PERCENT) / BASE_LOCKUP_WIDTH;

  return (
    <LinearGradient
      colors={['#001F4F', '#090C15']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}>
      <View style={[styles.logoRow, { gap: BASE_GAP * scale }]}>
        <Image
          source={require('../assets/logo/glyph_e.png')}
          style={{
            height: BASE_E_HEIGHT * scale,
            width: BASE_E_HEIGHT * BASE_E_ASPECT * scale,
            transform: [{ translateY: -15.9 * scale }],
          }}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/icons/empty-state-swords.png')}
          style={{
            width: BASE_SWORD_SIZE * scale,
            height: BASE_SWORD_SIZE * scale,
            alignSelf: 'center',
            transform: [{ translateY: -3 * scale }],
          }}
          tintColor={colors.textPrimary}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/logo/glyph_pert.png')}
          style={{
            height: BASE_PERT_HEIGHT * scale,
            width: BASE_PERT_HEIGHT * BASE_PERT_ASPECT * scale,
          }}
          resizeMode="contain"
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end', // baseline-align, same compensation as SignInScreen
  },
});
