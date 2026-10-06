import { Dimensions } from 'react-native';

/**
 * React Native의 숫자는 기기 독립 픽셀(dp)이다. 화면을 구성할 때 임의의
 * 숫자 대신 이 토큰을 사용해 iOS·Android에서 같은 리듬과 터치 크기를 유지한다.
 */
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const size = {
  touch: 44,
  touchLarge: 52,
  icon: 24,
  tabBar: 64,
  bottomFloat: 76,
  contentMax: 720,
  timelineHour: 60,
} as const;

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 } as const;
export const font = { xs: 11, sm: 12, md: 14, lg: 16, xl: 22, display: 28 } as const;

/** 화면 폭에 맞는 공통 좌우 여백. 360dp 이하에서도 콘텐츠 폭을 확보한다. */
export const pageGutter = () => {
  const width = Dimensions.get('window').width;
  if (width <= 360) return space[4];
  if (width >= 600) return space[8];
  return space[5];
};
