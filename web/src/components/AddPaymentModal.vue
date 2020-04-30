<template>
  <b-modal ref="addPaymentModal" title="Add Payment">
    <template v-slot:default>
      Value
      <b-form-input v-model="value" type="number" size="sm"></b-form-input>

      Description
      <b-form-input v-model="description" size="sm"></b-form-input>
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
  import { v4 as uuidv4 } from 'uuid';

  export default {
    name: 'add-payment-modal',

    data() {
      return {
        value: 0,
        description: '',
      };
    },

    methods: {
      show() {
        this.$refs['addPaymentModal'].show();
      },

      addPayment(callback) {
        const data = {
          id: uuidv4(),
          value: this.value,
          description: this.description,
          offline: true,
        };

        console.log(data);

        callback();
      },
    },
  }
</script>