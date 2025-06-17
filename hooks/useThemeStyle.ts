/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { baseStyles } from '@/constants/StyleSheet';
import { useColorScheme } from '@/hooks/useColorScheme';

export function useThemeColor() {
  const theme = useColorScheme() ?? 'light';

  return baseStyles(theme);
}
