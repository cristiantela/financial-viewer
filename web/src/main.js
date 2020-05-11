import Vue from "vue";
import store from "./store";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueQRCodeComponent from "vue-qrcode-component";

import App from "./App.vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

Vue.component("qr-code", VueQRCodeComponent);

Vue.config.productionTip = false;

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

new Vue({
  store,
  render: (h) => h(App),
}).$mount("#app");
