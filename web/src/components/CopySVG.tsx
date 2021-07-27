
import React, { FunctionComponent } from 'react'; // importing FunctionComponent

type CopySVGProps = {
  fill: string,
}

const CopySVG: FunctionComponent<CopySVGProps> = ({ fill }) => (
  <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
    width="12pt" height="12pt" viewBox="0 0 512.000000 512.000000"
    preserveAspectRatio="xMidYMid meet">

    <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
      fill="#000000" stroke="none">
      <path fill={fill} d="M721 5109 c-174 -34 -327 -191 -361 -368 -6 -35 -10 -621 -10 -1697
l0 -1644 230 0 230 0 0 1625 0 1625 1398 2 1397 3 3 233 2 232 -1422 -1 c-783
-1 -1443 -5 -1467 -10z"/>
      <path fill={fill} d="M1643 4175 c-175 -38 -324 -195 -353 -370 -13 -81 -13 -3338 0 -3419
30 -185 191 -346 376 -376 82 -14 2654 -13 2725 0 182 35 334 187 369 369 14
74 14 3358 0 3432 -25 131 -125 266 -241 325 -109 55 -75 54 -1499 53 -1068 0
-1327 -3 -1377 -14z m2667 -2080 l0 -1625 -1280 0 -1280 0 0 1625 0 1625 1280
0 1280 0 0 -1625z"/>
    </g>
  </svg>

);

export default CopySVG;