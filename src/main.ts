import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

import './styles/base.css';
import './styles/themes/pro.css';
import './styles/themes/spring.css';
import './styles/themes/summer.css';
import './styles/themes/autumn.css';
import './styles/themes/winter.css';
import './styles/themes/holidays.css';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
