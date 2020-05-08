import api from "../../api";

import { v4 as uuidv4 } from "uuid";

const state = () => ({
  all: [],
});

const getters = {};

const actions = {
  getAllPayments({ commit }) {
    api.getPayments((payments) => {
      commit(
        "setPayments",
        payments.map((payment) => ({
          ...payment,
          offline: false,
          status: "uploaded",
          error: "",
        }))
      );
    });
  },

  setAllPayments({ commit }, payments) {
    commit(
      "setPayments",
      payments.map((payment) => ({
        ...payment,
        id: uuidv4(),
        offline: true,
        status: "uploaded",
        error: "",
      }))
    );
  },

  addPayment({ commit }, data) {
    const body = {
      ...data,
      id: uuidv4(),
      offline: true,
      status: "uploading",
      error: "",
    };

    commit("addPayment", body);

    api.addPayment(
      body,
      (payment) => {
        commit("updatePayment", {
          id: body.id,
          payment: {
            ...payment,
            offline: false,
            status: "uploaded",
          },
        });
      },
      (error) => {
        commit("updatePayment", {
          id: body.id,
          payment: {
            status: "error",
            error: error.message,
          },
        });
      }
    );
  },

  removePayment({ commit }, data) {
    const body = {
      id: data.id,
    };

    commit("updatePayment", {
      id: body.id,
      payment: {
        status: "uploading",
      },
    });

    api.removePayment(
      body,
      () => {
        commit("removePayment", {
          id: body.id,
        });
      },
      (error) => {
        commit("updatePayment", {
          id: body.id,
          payment: {
            status: "error",
            error: error.message,
          },
        });
      }
    );
  },

  editPayment({ commit }, data) {
    const body = {
      id: data.id,
      value: data.value,
      description: data.description,
      tags: data.tags,
      date: data.date,
    };

    commit("updatePayment", {
      id: body.id,
      payment: {
        value: body.value,
        description: body.description,
        tags: body.tags,
        date: body.date,
        status: "uploading",
      },
    });

    api.updatePayment(
      body,
      () => {
        commit("updatePayment", {
          id: body.id,
          payment: {
            status: "uploaded",
          },
        });
      },
      (error) => {
        commit("updatePayment", {
          id: body.id,
          payment: {
            status: "error",
            error: error.message,
          },
        });
      }
    );
  },

  updatePayment({ commit }, payment) {
    const body = {
      id: payment.id,
      payment: payment.payment,
    };

    commit("updatePayment", {
      id: body.id,
      payment: {
        status: "uploading",
        error: "",
      },
    });

    api.updatePayment(
      body,
      (payment) => {
        commit("updatePayment", {
          id: body.id,
          payment: {
            ...payment,
            status: "uploaded",
          },
        });
      },
      (error) => {
        commit("updatePayment", {
          id: body.id,
          payment: {
            status: "error",
            error: error.message,
          },
        });
      }
    );
  },

  addMonth(store, data) {
    const body = {
      year: data.year,
      month: data.month,
      value: 0,
      description: "NONE",
      tags: [],
      date: "",
      suspended: false,
    };

    this.dispatch("payments/addPayment", body);
  },
};

const mutations = {
  setPayments(state, payments) {
    state.all = payments;
  },

  addPayment(state, payment) {
    state.all.push(payment);
  },

  updatePayment(state, { id, payment }) {
    const paymentState = state.all.find(
      (paymentState) => paymentState.id === id
    );

    Object.keys(payment).forEach((attribute) => {
      paymentState[attribute] = payment[attribute];
    });
  },

  removePayment(state, { id }) {
    state.all.splice(
      state.all.findIndex((payment) => payment.id === id),
      1
    );
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
