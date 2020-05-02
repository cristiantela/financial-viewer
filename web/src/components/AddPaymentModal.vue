<template>
  <b-modal ref="addPaymentModal" title="Add Payment">
    <template v-slot:default>
      Value
      <b-form-input v-model="value" type="number" size="sm"></b-form-input>

      Description
      <b-form-input v-model="description" size="sm"></b-form-input>

      Tags
      <b-form-tags v-model="tags" size="sm"></b-form-tags>

      Date
      <b-form-datepicker
        v-model="date"
        locale="en"
        today-button
        reset-button
        size="sm"
      ></b-form-datepicker>
    </template>

    <template v-slot:modal-footer="{ ok, cancel }">
      <b-button size="sm" variant="outline-secondary" @click="cancel()">
        Cancel
      </b-button>

      <b-button size="sm" variant="success" @click="addPayment(ok)">
        Add
      </b-button>
    </template>
  </b-modal>
</template>

<script>
export default {
  name: "add-payment-modal",

  data() {
    return {
      value: 0,
      description: "",
      tags: [],
      date: "",
      year: 0,
      month: 0,
    };
  },

  methods: {
    show(data) {
      this.$refs["addPaymentModal"].show();

      this.year = data.year;
      this.month = data.month;
      this.value = 0;
      this.description = "";
      this.tags = [];
    },

    addPayment(callback) {
      const data = {
        year: this.year,
        month: this.month,
        value: this.value,
        description: this.description,
        tags: this.tags,
        date: this.date,
      };

      this.$store.dispatch("payments/addPayment", data);

      callback();
    },
  },
};
</script>
