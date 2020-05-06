<template>
  <b-modal ref="formPaymentModal" :title="title">
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

      <b-button size="sm" variant="success" @click="savePayment(ok)">
        {{ ucfirst(type) }}
      </b-button>
    </template>
  </b-modal>
</template>

<script>
export default {
  name: "form-payment-modal",

  data() {
    return {
      type: "",
      id: "",
      value: 0,
      description: "",
      tags: [],
      date: "",
      year: 0,
      month: 0,
    };
  },

  methods: {
    show({ type, data }) {
      this.$refs["formPaymentModal"].show();
      this.type = type;

      if (this.type === "add") {
        this.year = data.year;
        this.month = data.month;
        this.value = 0;
        this.description = "";
        this.tags = [];
      } else if (this.type === "edit") {
        ["id", "value", "description", "tags", "date"].forEach((attribute) => {
          this[attribute] = data[attribute];
        });
      }
    },

    savePayment(callback) {
      if (this.type === "add") {
        const data = {
          year: this.year,
          month: this.month,
          value: this.value,
          description: this.description,
          tags: this.tags,
          date: this.date,
          suspended: false,
        };

        this.$store.dispatch("payments/addPayment", data);
      } else if (this.type === "edit") {
        const data = {
          id: this.id,
          value: this.value,
          description: this.description,
          tags: this.tags,
          date: this.date,
        };

        this.$store.dispatch("payments/editPayment", data);
      }

      callback();
    },

    ucfirst(string) {
      return string.substring(0, 1).toUpperCase() + string.substring(1);
    },
  },

  computed: {
    title() {
      return {
        add: "Add Payment",
        edit: "Edit Payment",
      }[this.type];
    },
  },
};
</script>
