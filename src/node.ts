import {makeDerivedStore} from 'universal-stores';
import {makeTweenedStore, easings} from './lib/index.js';

const tweened$ = makeTweenedStore(1, {
	duration: 500,
	easing: easings.easeOutCubic,
});

const all$ = makeDerivedStore([tweened$, tweened$.speed$, tweened$.state$, tweened$.target$], (x) => x);
all$.subscribe(([tweened, speed, state, target]) => {
	process.stdout.write(
		'\u001b[2K\r' +
			JSON.stringify({
				tweened: tweened.toFixed(2),
				target: target.toFixed(2),
				speed: speed.toFixed(2),
				state,
			}),
	);
});

let target = 2;
setInterval(() => {
	tweened$.target$.set(target);
	target = Math.random() * 10;
}, 4000);
