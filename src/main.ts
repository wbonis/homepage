import { mount } from 'svelte';
import Desktop from './components/Desktop/Desktop.svelte';
import './css/global.css';
import './helpers/tracking';
import { detectDeviceType } from './helpers/device-detect';

const deviceType = detectDeviceType();

if (deviceType !== 'desktop') {
	import('./css/devices.css');
}

const desktop = mount(Desktop, {
	target: document.getElementById('root'),
	props: { deviceType },
});

export default desktop;
