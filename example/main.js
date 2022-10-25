import Vue from 'vue'
import uploader from '../src'
import App from './App.vue'
import axios from 'axios'

Vue.use(uploader)

Vue.prototype.$axios = axios
/* eslint-disable no-new */
new Vue({
  render(createElement) {
    return createElement(App)
  }
}).$mount('#app')
