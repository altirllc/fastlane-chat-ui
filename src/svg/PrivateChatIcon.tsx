

import React from 'react';
import { Svg, Path } from 'react-native-svg';


export const PrivateChatIcon = ({ color = "#D9E5FC" }: { color?: string }) => (
    <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <Path
            d="M19.25 18C19.25 15.3766 21.3766 13.25 24 13.25C26.6234 13.25 28.75 15.3766 28.75 18C28.75 20.6234 26.6234 22.75 24 22.75C21.3766 22.75 19.25 20.6234 19.25 18Z"
            fill="#6E768A"
        />
        <Path
            d="M20.95 25.25C17.802 25.25 15.25 27.802 15.25 30.95C15.25 33.0487 16.9513 34.75 19.05 34.75H28.95C31.0487 34.75 32.75 33.0487 32.75 30.95C32.75 27.802 30.198 25.25 27.05 25.25H20.95Z"
            fill="#6E768A"
            stroke={color}
            strokeWidth="1.6224"
        />
    </Svg>
);
