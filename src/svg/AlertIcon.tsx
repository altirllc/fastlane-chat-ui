

import React from 'react';
import { Svg, Path } from 'react-native-svg';


export const AlertIcon = ({ color = "#292B32" }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <Path
            d="M12 16v-5m.5-3a.5.5 0 0 1-1 0m1 0a.5.5 0 0 0-1 0m1 0h-1M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"
            fill="none"
            stroke={color}
            strokeLinejoin='round'
        />
    </Svg>
);


<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 16v-5m.5-3a.5.5 0 0 1-1 0m1 0a.5.5 0 0 0-1 0m1 0h-1M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"
    stroke="#14151A" stroke-width="1.5"
    stroke-linecap="round" stroke-linejoin="round" /></svg>