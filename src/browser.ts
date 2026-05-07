import './style.css';
import {makeTweenedStore, easings} from './lib/index.js';
import {makeDerivedStore} from 'universal-stores';

const appDiv = document.getElementById('app') as HTMLDivElement;

document.body.style.overflow = 'hidden';

const stateDiv = document.createElement('div');
stateDiv.style.fontFamily = 'monospace';
stateDiv.style.whiteSpace = 'pre';
const headSpeedDiv = document.createElement('div');
headSpeedDiv.style.fontFamily = 'monospace';
headSpeedDiv.style.whiteSpace = 'pre';
const avgSpeedDiv = document.createElement('div');
avgSpeedDiv.style.fontFamily = 'monospace';
avgSpeedDiv.style.whiteSpace = 'pre';

appDiv.append(stateDiv);
appDiv.append(headSpeedDiv);
appDiv.append(avgSpeedDiv);

const chainLength = 10;

const star = [
	...new Array(chainLength).fill(0).map((_, i) =>
		makeTweenedStore(
			{left: 300, top: 300},
			i === 0
				? {}
				: {
						duration: 300 + Math.random() * 600,
						easing: easings.easeInOutCubic,
					},
		),
	),
];

const r = 150;
for (let i = 1; i < star.length; i++) {
	const phi = ((Math.PI * 2) / (star.length - 1)) * i;
	star[0].subscribe((currentValue) => {
		star[i].target$.set({
			left: currentValue.left + r * Math.cos(phi),
			top: currentValue.top + r * Math.sin(phi),
		});
	});
}

for (let i = 0; i < star.length; i++) {
	const tweened$ = star[i];
	const easeDiv = document.createElement('div');
	easeDiv.style.position = 'absolute';
	easeDiv.style.top = '50px';
	easeDiv.style.width = '50px';
	easeDiv.style.height = '50px';
	easeDiv.style.zIndex = String(star.length - i);
	easeDiv.style.background = `rgba(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)}, 0.5)`;
	appDiv.append(easeDiv);
	tweened$.subscribe(({left, top}) => {
		easeDiv.style.top = top - 25 + 'px';
		easeDiv.style.left = left - 25 + 'px';
	});
	tweened$.speed$.subscribe((pixelsPerSecond) => {
		easeDiv.style.transform = `rotateZ(${-pixelsPerSecond / 50}deg)`;
	});
}

star[0].speed$.subscribe((pixelsPerSecond) => {
	headSpeedDiv.textContent = `Head speed: ${pixelsPerSecond.toFixed(2).padStart(6, ' ')}px/s`;
});
const avgSpeed$ = makeDerivedStore<[number, ...number[]], number>(
	[star[0].speed$, ...star.slice(1).map((tweened) => tweened.speed$)],
	(speeds: number[]) => speeds.reduce((sum, cur) => sum + cur, 0) / speeds.length,
);
avgSpeed$.subscribe((pixelsPerSecond) => {
	avgSpeedDiv.textContent = `Avg speed: ${pixelsPerSecond.toFixed(2).padStart(6, ' ')}px/s`;
});
star[0].state$.subscribe((state) => (stateDiv.textContent = `Head tweened state: ${state}`));

if (window.matchMedia('(pointer: fine)').matches) {
	window.addEventListener('mousedown', (e) => {
		e.preventDefault();
		star.slice(1).forEach((s) => s.target$.set({left: e.pageX, top: e.pageY}));
	});

	window.addEventListener('mousemove', (e) => {
		e.preventDefault();
		star[0].target$.set({left: e.pageX, top: e.pageY});
	});
} else {
	window.addEventListener(
		'touchstart',
		(e) => {
			e.preventDefault();
			star.slice(1).forEach((s) =>
				s.target$.set({
					left: e.changedTouches[0].clientX,
					top: e.changedTouches[0].clientY,
				}),
			);
		},
		true,
	);
	window.addEventListener(
		'touchmove',
		(e) => {
			e.preventDefault();
			star[0].target$.set({
				left: e.changedTouches[0].clientX,
				top: e.changedTouches[0].clientY,
			});
		},
		true,
	);
}

window.addEventListener('keydown', (e) => {
	if (e.key === ' ') {
		star.forEach((c) => {
			c.skip().then(() => console.log('SKIPPED'), console.error);
		});
	} else if (e.key.toLowerCase() === 'p') {
		star.slice(1).forEach((c) => {
			c.pause().then(() => console.log('PAUSED'), console.error);
		});
	} else if (e.key.toLowerCase() === 'r') {
		star.slice(1).forEach((c) => {
			c.resume();
			console.log('RESUMED');
		});
	}
});
