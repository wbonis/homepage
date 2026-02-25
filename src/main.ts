import { mount } from 'svelte';
import Desktop from './components/Desktop/Desktop.svelte';
import './css/global.css';
import './helpers/tracking';

const desktop = mount(Desktop, {
	target: document.getElementById('root'),
});

export default desktop;
