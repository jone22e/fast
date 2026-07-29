import { createApp } from 'vue';
import App from './App.vue';
import { vReveal } from './reveal';
import './style.css';

createApp(App).directive('reveal', vReveal).mount('#app');
