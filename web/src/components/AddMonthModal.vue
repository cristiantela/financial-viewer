<template>
  <b-modal ref="addMonthModal" title="Add Month">
    <template v-slot:default>
      Month

      <b-form-select
        v-model="month"
        size="sm"
        :options="months"
      ></b-form-select>

      Year

      <b-form-input v-model="year" size="sm" type="number"></b-form-input>
    </template>

    <template v-slot:modal-footer="{ ok, cancel }">
      <b-button size="sm" variant="outline-secondary" @click="cancel()">
        Cancel
      </b-button>

      <b-button size="sm" variant="success" @click="addMonth(ok)">
        Add
      </b-button>
    </template>
  </b-modal>
</template>

<script>
export default {
  name: "add-month-modal",

  data() {
    return {
      months: "January,February,March,April,May,June,July,August,September,October,November,December"
        .split(",")
        .map((month, index) => ({
          value: index + 1,
          text: month,
        })),
      month: "",
      year: "",
    };
  },

  methods: {
    show() {
      this.$refs.addMonthModal.show();
    },

    addMonth(callback) {
      const data = {
        month: this.month,
        year: this.year,
      };

      this.$store.dispatch("payments/addMonth", data);

      callback();
    },
  },
};
</script>
