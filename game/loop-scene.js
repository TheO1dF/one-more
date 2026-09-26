import {cardBackArt} from './art.js';
const clock=()=>'<svg class="loop-clock" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="4"/><path d="M50 9v8M91 50h-8M50 91v-8M9 50h8" stroke="currentColor" stroke-width="4"/><path class="loop-hand" d="M46 15 50 50 49 29" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="50" cy="50" r="4" fill="currentColor"/></svg>';
export function loopSceneHTML(){
 return clock()+'<div class="loop-deck">'+[0,1,2].map(()=>'<i class="loop-card">'+cardBackArt()+'</i>').join('')+'</div>';
}
