import Svg, { Path } from 'react-native-svg';

const paths = { right: 'm9 5 7 7-7 7', left: 'm15 5-7 7 7 7', down: 'm5 9 7 7 7-7', up: 'm5 15 7-7 7 7' };

/** Fixed vector geometry avoids platform font differences and text clipping. */
export function Chevron({ direction = 'right', color = '#686868' }: { direction?: keyof typeof paths; color?: string }) {
  return <Svg width={20} height={20} viewBox="0 0 24 24" style={{ flexShrink: 0 }} pointerEvents="none" accessible={false}><Path d={paths[direction]} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}
