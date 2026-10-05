import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme';

export type IconName = 'home' | 'grid' | 'diamond' | 'bag' | 'person' | 'search' | 'back' | 'heart' | 'plus' | 'minus' | 'arrow' | 'check' | 'down' | 'close';

/** Thin-stroke (1.5) icon set. `filled` applies the 35% brass fill used by the active tab. */
export function Icon({ name, size = 24, color = colors.ink, filled = false }: { name: IconName; size?: number; color?: string; filled?: boolean }) {
  const fill = filled ? colors.brassFill35 : 'none';
  const p = { stroke: color, strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {name === 'home' && <Path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" {...p} fill={fill} />}
      {name === 'grid' && (<>
        <Rect x="4" y="4" width="7" height="7" rx="1.5" {...p} fill={fill} /><Rect x="13" y="4" width="7" height="7" rx="1.5" {...p} fill={fill} />
        <Rect x="4" y="13" width="7" height="7" rx="1.5" {...p} fill={fill} /><Rect x="13" y="13" width="7" height="7" rx="1.5" {...p} fill={fill} /></>)}
      {name === 'diamond' && <Path d="M12 3l9 9-9 9-9-9z M12 8l4 4-4 4-4-4z" {...p} fill={fill} />}
      {name === 'bag' && <Path d="M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8" {...p} fill={fill} />}
      {name === 'person' && (<><Circle cx="12" cy="8.5" r="3.5" {...p} fill={fill} /><Path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" {...p} /></>)}
      {name === 'search' && (<><Circle cx="11" cy="11" r="6.5" {...p} /><Path d="M16 16l4.5 4.5" {...p} /></>)}
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...p} />}
      {name === 'heart' && <Path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" {...p} fill={filled ? color : 'none'} />}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...p} />}
      {name === 'minus' && <Path d="M5 12h14" {...p} />}
      {name === 'arrow' && <Path d="M5 12h14M13 6l6 6-6 6" {...p} />}
      {name === 'check' && <Path d="M5 12.5l4.5 4.5L19 7.5" {...p} />}
      {name === 'down' && <Path d="M6 9l6 6 6-6" {...p} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...p} />}
    </Svg>
  );
}
