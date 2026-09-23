import {dealerActor} from './dealer-art.js';
import {posterBack} from './poster-art.js';
import {getCardBack} from './art-style.js';
export const strangerArt=()=>dealerActor().replace('class="dealer-actor','class="dealer-actor host-portrait');
export const cardBackArt=()=>posterBack(getCardBack());
export function classicStrangerArt(){return `<img class="host-portrait" src="./game/assets/dealer-sprite.png" alt="" draggable="false">`;}
export function classicCardBackArt(){return `<svg class="back-art" viewBox="0 0 118 168" aria-hidden="true"><rect x="1" y="1" width="116" height="166" rx="8" fill="#142d25" stroke="#d2bb7e" stroke-width="2"/><path d="M12 27 27 12h64l15 15v114l-15 15H27l-15-15Z" fill="none" stroke="#b9a66d"/><path d="M18 33 33 18h52l15 15v102l-15 15H33l-15-15Z" fill="none" stroke="#b9a66d" stroke-width=".6"/><path d="M21 55 59 26l38 29M21 113l38 29 38-29M28 61l31-22 31 22M28 107l31 22 31-22" fill="none" stroke="#72845c"/><path d="M59 48 90 84l-31 36-31-36Z" fill="#273e2e" stroke="#d4bc7a"/><path d="M45 65h28M45 103h28M49 66q0 12 10 18-10 6-10 18M69 66q0 12-10 18 10 6 10 18" stroke="#d4bc7a" stroke-width="2" fill="none"/><path d="m53 73 6 7 6-7m-12 26 6-8 6 8Z" fill="#d4bc7a"/><circle cx="59" cy="21" r="2" fill="#decb91"/><circle cx="59" cy="147" r="2" fill="#decb91"/><path d="m21 78 4 6-4 6-4-6Zm76 0 4 6-4 6-4-6Z" fill="#decb91"/></svg>`;}
