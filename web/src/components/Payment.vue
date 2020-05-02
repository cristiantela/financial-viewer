<template>
  <b-row>
    <b-col
      cols="3"
      class="text-right"
      :style="{
        textDecoration: payment.suspended ? 'line-through' : null,
      }"
    >
      {{ calculateFinalValue(payment) }}
    </b-col>

    <b-col>
      <b-row>
        <b-col>
          <b-spinner
            v-if="payment.status === 'uploading'"
            variant="primary"
            small
            class="mr-1"
          ></b-spinner>

          <b-icon
            v-else-if="payment.error"
            icon="exclamation-circle-fill"
            variant="danger"
            title="Error"
            v-b-popover.hover.bottomright="payment.error"
            class="mr-1"
          ></b-icon>

          <b-badge
            v-if="payment.date"
            class="mr-1"
            :variant="payment.value > 0 ? 'info' : 'success'"
          >
            {{ payment.value > 0 ? "Received on" : "Payed on" }}
            {{ payment.date }}
          </b-badge>

          <tags :tags="payment.tags"></tags>

          <span
            :style="{
              textDecoration: payment.suspended ? 'line-through' : null,
            }"
          >
            {{ upperCaseFirstLetter(payment.description) }}
          </span>

          <payment
            v-for="(subPayment, subPaymentIndex) in payment.children"
            :key="subPaymentIndex"
            :payment="subPayment"
          ></payment>
        </b-col>

        <b-col v-if="!hideControls" cols="auto">
          <b-dropdown right variant="link" no-caret size="sm">
            <template v-slot:button-content>
              <b-icon icon="three-dots-vertical" variant="secondary"></b-icon>
            </template>

            <b-dropdown-item @click="removePayment(payment)" href="#" size="sm"
              >Remove</b-dropdown-item
            >
          </b-dropdown>
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</template>

<script>
import Tags from "./Tags.vue";
import { mapActions } from "vuex";
export default {
  name: "payment",

  props: {
    payment: Object,
    hideControls: Boolean,
  },

  components: {
    Tags,
  },

  data() {
    return {};
  },

  methods: {
    ...mapActions("payments", ["removePayment"]),

    endEdit(payment) {
      payment.isEditing = false;

      this.formatAndSave();
    },

    edit(block, paymentIndex, attribute, subIndex) {
      if (this.unsavedInput) {
        return false;
      }

      let complement = "";

      if (attribute === "tags") {
        complement = `-${subIndex}`;

        this.tagInput = block.payments[paymentIndex].tags[subIndex];
      }

      block.payments[paymentIndex].isEditing = attribute + complement;

      this.$nextTick(() => {
        this.$refs[
          `${block.month}-${block.year}-${paymentIndex}-${attribute}${complement}`
        ][0].focus();
      });
    },

    calculateFinalValue(payment) {
      const children = payment.children
        ? payment.children.map((payment) => payment.value)
        : [];

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
};
</script>
