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

const chain = [
	...new Array(chainLength).fill(0).map((_, i) =>
		makeTweenedStore(
			{left: 10, top: 10},
			{
				duration: 200 + (i / chainLength) * 400,
				easing: easings.easeOutCubic,
			},
		),
	),
];

for (let i = 1; i < chain.length; i++) {
	chain[i - 1].subscribe((currentValue) => {
		chain[i].target$.set({...currentValue});
	});
}

for (let i = 0; i < chain.length; i++) {
	const tweened$ = chain[i];
	const easeDiv = document.createElement('div');
	easeDiv.style.position = 'absolute';
	easeDiv.style.top = '50px';
	easeDiv.style.width = '50px';
	easeDiv.style.height = '50px';
	easeDiv.style.zIndex = String(chain.length - i);
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

chain[0].speed$.subscribe((pixelsPerSecond) => {
	headSpeedDiv.textContent = `Head speed: ${pixelsPerSecond.toFixed(2).padStart(6, ' ')}px/s`;
});
const avgSpeed$ = makeDerivedStore<[number, ...number[]], number>(
	[chain[0].speed$, ...chain.slice(1).map((tweened) => tweened.speed$)],
	(speeds: number[]) => speeds.reduce((sum, cur) => sum + cur, 0) / speeds.length,
);
avgSpeed$.subscribe((pixelsPerSecond) => {
	avgSpeedDiv.textContent = `Avg speed: ${pixelsPerSecond.toFixed(2).padStart(6, ' ')}px/s`;
});
chain[0].state$.subscribe((state) => (stateDiv.textContent = `Head tweened state: ${state}`));

window.addEventListener('mousemove', (e) => {
	e.preventDefault();
	chain[0].target$.set({left: e.pageX, top: e.pageY});
});

window.addEventListener('mousedown', (e) => {
	e.preventDefault();
	chain[0].target$.set({left: e.pageX, top: e.pageY});
});

window.addEventListener('keydown', (e) => {
	if (e.key === ' ') {
		chain.forEach((c) => {
			c.skip().then(() => console.log('SKIPPED'), console.error);
		});
	} else if (e.key.toLowerCase() === 'p') {
		chain.slice(1).forEach((c) => {
			c.pause().then(() => console.log('PAUSED'), console.error);
		});
	} else if (e.key.toLowerCase() === 'r') {
		chain.slice(1).forEach((c) => {
			c.resume();
			console.log('RESUMED');
		});
	}
});
