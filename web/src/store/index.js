import Vue from "vue";
import Vuex from "vuex";
import payments from "./modules/payments";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    payments,
  },
});
