import {characterArt} from './character-art.js';
export const PAN_ART_URL=new URL('./assets/pan/pan-character-v4.png',import.meta.url).href;
export function panArt(){return characterArt('pan',{className:'pan-portrait pan-editorial flat-character'});}
// Retained as a reversible art revision; no longer used in the game.
export function panLegacyArt(){return `<svg class="pan-portrait" viewBox="0 0 420 470" role="img" aria-label="Pan" xmlns="http://www.w3.org/2000/svg">
 <path d="M30 464V294Q27 214 101 208h184q89 4 90 97v159Z" fill="#372c60"/>
 <path d="M44 455V291q2-55 47-61h-9q-51 5-52 64v170h345v-15Z" fill="#df5196"/>
 <g class="pan-body">
  <path d="m111 242 77-27 68 2 71 49 36 164-34 34H45l22-128Z" fill="#161936"/>
  <path d="m112 242 69-30 23 116-36 122-89-21 13-117Z" fill="#574798"/>
  <path d="m181 214 62-7 37 86-42 97-34-62Z" fill="#fff8e8"/>
  <path d="m233 215 24 4 32 57-28 6 14 29-44 104 15-94Z" fill="#df5196"/>
  <path d="m175 218-35 18-16 59 35 4-13 30 45 96 13-97Z" fill="#ff4928"/>
  <path d="m206 265 27-8 12 17-18 16-22-8-15 8-3-26Z" fill="#161936"/>
  <path d="m212 285 12 1 12 89-17 27-13-27Z" fill="#161936"/>
  <path d="m184 372 10 4-4 10-10-4Z" fill="#edbd38"/>
 </g>
 <g class="pan-head">
  <path d="m223 59 46-44q60-31 99 21 23 39-5 68-27 24-44 1 39 3 30-31-7-26-38-20l-45 62Z" fill="#edbd38"/>
  <path d="m273 61 26-21q31-12 50 9 16 18 1 39 3-31-24-30l-36 28Z" fill="#ff4928"/>
  <path d="m139 121-44-35-12 36 49 49Z" fill="#edbd38"/>
  <path d="m102 110 24 23-4 16Z" fill="#ff4928"/>
  <path d="m153 117 16-32 70-25 51 31 9 55-22 72-48 45-53-25-23-47Z" fill="#d58660"/>
  <path d="m183 114 48-31 47 17-6 42 36 38-37 12-11 36-32 20-38-41-12-51Z" fill="#f4c68f"/>
  <path d="m159 99 28-28 52-13 47 23 7 29-31-14-39 13-16 36-32-10-8 29-22-15Z" fill="#161936"/>
  <path d="m183 145 29-6 18 11-36 2Z" fill="#161936"/>
  <path d="m246 138 28-9 5 10-29 9Z" fill="#161936"/>
  <path d="m193 157 21-4-10 9Z" fill="#fff8e8"/><path d="m202 154 4 1-2 9-4-1Z" fill="#161936"/>
  <path d="m251 151 20-5-7 11Z" fill="#fff8e8"/><path d="m261 148 4-1-1 10-4 1Z" fill="#161936"/>
  <path d="m242 152-9 34 32 0-10-8Z" fill="#b75643"/>
  <path d="m264 181 19-5-3 7-15 4Z" fill="#161936"/>
  <path d="m202 186 16 14 48-1 17-11-17 24-36 12-27-15Z" fill="#161936"/>
  <path d="m220 203 42-1-10 8-26 2Z" fill="#fff8e8"/>
  <path d="m180 184 22 28 25 23 32-17-21 38-35 15-20-40Z" fill="#161936"/>
  <path d="m203 233 14 8 8 22-19 12-5-21Z" fill="#81b8ba"/>
  <path d="M186 111q-49-90-103-62-40 23-19 74 16 34 43 13 13-11 5-25-4 23-23 5-20-27 5-41 36-16 54 56Z" fill="#edbd38"/>
  <path d="M145 87q-36-37-56-14-18 14-3 38-7-21 14-23 17-3 36 24Z" fill="#ff4928"/>
  <path d="m126 60 10 6-7 15-9-5Zm19 14 8 9-11 12-7-9Z" fill="#fff8e8"/>
 </g>
 <g class="pan-glass-arm">
  <path d="m98 287-26 49 11 77 145 15 73-71-27-34-74 56-71-19Z" fill="#574798"/>
  <path d="m87 394 116 15 77-68-7-18-74 56-71-19Z" fill="#372c60"/>
  <path d="m257 333 24-19 25 25-24 22Z" fill="#fff8e8"/>
  <path d="m278 322 9-26 15-12 23 1 4 10-20 5-3 9 22-10 17 5-1 10-18 1-19 25-13 1Z" fill="#f4c68f"/>
  <path d="m314 306 21-6 6 6-19 8-13 17-10 0Z" fill="#d58660"/>
  <path d="M298 223h62l-8 36-20 12v46h18v8h-44v-8h18v-46l-19-12Z" fill="#edbd38"/>
  <path d="m309 231 6 22 15 9 13-8 7-23Z" fill="#9c3048"/>
  <path d="m302 224 6 30 8 6-7-36Z" fill="#fff8e8"/>
 </g>
 <path d="M25 437 394 412l10 48-373 10Z" fill="#339563"/>
 <path d="m45 450 74-6-6 8-60 4Z" fill="#edbd38"/>
 <path d="m304 435 28-3 5 11-27 4Z" fill="#ff4928"/>
</svg>`;}

export const panHandArt=()=>`<svg viewBox="0 0 500 170" aria-hidden="true"><path d="M0 10h213l74 62-17 75L0 124Z" fill="#fff8e8"/><path d="m0 98 268 27 10 22L0 124Z" fill="#645348"/><path d="m238 47 53 24-15 62-49-15Z" fill="#fff8e8"/><path d="m284 72 36-23 76-5 39 11 38 5 6 16-61-3-43 6 41 8 56-2 7 15-70 11-38-8-17 11 58 5 7 14-46 12-49-7-45-12Z" fill="#c66c43"/><path d="m365 103 50 2 50-6-45 14-51-5-11 7-37-5Z" fill="#874029"/><path d="m357 129 52-4 9 9-45 11-34-4Z" fill="#874029"/><g class="pan-ring" aria-label="Ring on the ring finger"><path d="m376 123 10-1 4 19-10 1Z" fill="#a97128"/><path d="m376 123 10-1 2 13-10 2Z" fill="#edbd38"/><path d="m377 122 8-1 2 6-8 1Z" fill="#fff8e8"/></g></svg>`;

export const giftGlassArt=()=>`<svg viewBox="0 0 180 240" aria-hidden="true"><g class="gift-bowl"><path d="M23 18h134l-11 74-46 35H80L34 92Z" fill="#edbd38"/><path d="m38 28 9 53 41 29 36-26 14-56Z" fill="#9c3048"/><path d="m27 22 11 65 13 9-9-74Z" fill="#fff8e8"/><path class="gift-cracks" d="m82 20 12 34-18 17 23 18-8 32m-15-50-31 10m54 8 45-5" fill="none" stroke="#fff8e8" stroke-width="5"/></g><g class="gift-stem"><path d="M80 116h20v85l44 18v12H36v-12l44-18Z" fill="#edbd38"/><path d="M80 122h7v79l-39 21h-8l40-25Z" fill="#fff8e8"/></g></svg>`;
