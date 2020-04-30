<template>
  <b-row>
    <b-col cols="3" class="text-right"
      :style="{
        textDecoration: payment.suspended ? 'line-through' : null,
      }"
    >
      {{ calculateFinalValue(payment) }}
    </b-col>

    <b-col>
      <b-badge
        v-for="type in [{
          name: 'Received on',
          attribute: 'receivedOn',
          color: 'info',
        }, {
          name: 'Payed on',
          attribute: 'payedOn',
          color: 'success',
        }]"
        :key="type.attribute"
        :class="[
          `mr-1`,
          {
            'd-none': !payment[type.attribute],
          },
        ]"
        :variant="type.color"
      >
        {{ type.name }}
        {{ payment[type.attribute] }}
      </b-badge>

      <tags :tags="payment.tags"></tags>

      <span
        :style="{
          textDecoration: payment.suspended ? 'line-through' : null,
        }"
      >
        {{ upperCaseFirstLetter(payment.description) }}
      </span>

      <payment v-for="(subPayment, subPaymentIndex) in payment.children" :key="subPaymentIndex" :payment="subPayment"></payment>
    </b-col>
  </b-row>
</template>

<script>

  import Tags from "./Tags.vue";
  export default {
    name: 'payment',

    props: ['payment'],

    components: {
      Tags,
    },

    data() {
      return {};
    },

    methods: {
      endEdit(payment) {
        payment.isEditing = false;

        this.formatAndSave();
      },

      edit(block, paymentIndex, attribute, subIndex) {
        if (this.unsavedInput) {
          return false;
        }

        let complement = '';

        if (attribute === 'tags') {
          complement = `-${subIndex}`;

          this.tagInput = block.payments[paymentIndex].tags[subIndex];
        }

        block.payments[paymentIndex].isEditing = attribute + complement;

        this.$nextTick(() => {
          this.$refs[`${block.month}-${block.year}-${paymentIndex}-${attribute}${complement}`][0].focus();
        });
      },

      calculateFinalValue(payment) {
        const children = payment.children ? payment.children.map(payment => payment.value) : [];

        let discount = 0;

        if (children.length) {
          discount = children.reduce((value, current) => value + current);
        }

        return Number((payment.value - discount).toFixed(2));
      },

      upperCaseFirstLetter(text) {
        return text.slice(0, 1).toUpperCase() + text.slice(1);
      },
    },
  }
</script>