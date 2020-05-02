<template>
  <b-container>
    <add-payment-modal ref="addPaymentModal"></add-payment-modal>

    <b-row>
      <b-col>
        <b-button @click="download" class="mr-1" size="sm" variant="primary">
          Download
        </b-button>

        <b-button
          @click="openFileSelector"
          class="mr-1"
          size="sm"
          variant="primary"
        >
          Import
        </b-button>

        <input @change="importFile" ref="file" type="file" class="d-none" />
      </b-col>
    </b-row>

    <b-row class="justify-content-center align-items-end">
      <b-col cols="3">
        Month
        <b-form-input size="sm" v-model="month" type="text" />
      </b-col>

      <b-col cols="3">
        Year
        <b-form-input size="sm" v-model="year" type="text" />
      </b-col>

      <b-col cols="auto" class="text-center">
        <b-button size="sm" @click="addMonth" variant="primary"
          >Add Month</b-button
        >
      </b-col>
    </b-row>

    <b-row>
      <div
        v-for="block in groupPaymentsByMonths"
        :key="`${block.year}-${block.month}`"
        class="w-100"
      >
        <div class="text-center">
          <h1>{{ monthName(block.month) }}/{{ block.year }}</h1>
        </div>

        <b-row>
          <b-col cols="12" sm="6">
            <payment
              v-for="payment in block.payments"
              :key="payment.id"
              :payment="payment"
            ></payment>

            <payment
              :payment="{
                value: sumAllPayments(block.payments).toFixed(2),
                description: '',
              }"
              hide-controls
            ></payment>

            <b-row>
              <b-col offset="3">
                <b-button
                  @click="
                    openAddPaymentModal({
                      year: block.year,
                      month: block.month,
                    })
                  "
                  size="sm"
                  variant="primary"
                >
                  Add Payment
                </b-button>
              </b-col>
            </b-row>
          </b-col>

          <b-col cols="12" sm="6">
            <tags-percentage :payments="block.payments"></tags-percentage>
          </b-col>
        </b-row>
      </div>
    </b-row>
  </b-container>
</template>

<script>
import AddPaymentModal from "./components/AddPaymentModal.vue";
import Payment from "./components/Payment.vue";
import TagsPercentage from "./components/TagsPercentage.vue";
import { mapState } from "vuex";

export default {
  name: "App",
  components: {
    AddPaymentModal,
    Payment,
    TagsPercentage,
  },

  data() {
    return {
      data: [],
      tagInput: "",
      month: "",
      year: "",
    };
  },

  created() {
    this.$store.dispatch("payments/getAllPayments");
  },

  methods: {
    openAddPaymentModal(data) {
      this.$refs["addPaymentModal"].show(data);
    },

    monthName(month) {
      return "January,February,March,April,May,June,July,August,September,November,December".split(
        ","
      )[month - 1];
    },

    sumArray(array) {
      if (array.length === 0) {
        return 0;
      } else if (array.length === 1) {
        return array[0];
      }

      return array.reduce((value, current) => value + current);
    },

    download() {
      const output = this.convertGroupPaymentsToText(
        this.groupPaymentsByMonths
      );

      const blob = new Blob([output]);
      const a = document.createElement("a");
      a.setAttribute("href", URL.createObjectURL(blob));
      a.setAttribute("download", "financial planner.txt");
      a.click();
    },

    openFileSelector() {
      this.$refs.file.click();
    },

    importFile(event) {
      const { files } = event.srcElement;

      if (files.length < 1) {
        return false;
      }

      const reader = new FileReader();
      const file = files[0];

      reader.addEventListener("load", () => {
        this.$store.dispatch(
          "payments/setAllPayments",
          this.textToJson(reader.result)
        );
      });

      reader.readAsText(file);

      event.srcElement.value = "";
    },

    textToJson(text) {
      const payments = [];

      let currentBlock = null;

      text.split("\n").forEach((line) => {
        const rules = {
          blockStart: /^(\d{2})\/(\d{4})$/,
          payment: /^( {2})?(--)?(-?[\d.]+) /,
          date: /^on ((\d{4}-\d{2}-)?\d{2}) ?/,
          tags: /#([^#]+)/,
        };

        if (rules.blockStart.test(line)) {
          const infos = line.match(rules.blockStart);

          currentBlock = {
            month: infos[1],
            year: infos[2],
          };
        } else if (rules.payment.test(line)) {
          const infos = line.match(rules.payment);

          let text = line.slice(infos[0].length);

          let date = "",
            tags = [],
            suspended = infos[2] === "--";

          if (rules.date.test(text)) {
            let matches = text.match(rules.date);

            console.log(matches);

            date = matches[1];

            text = text.slice(matches[0].length);
          }

          while (rules.tags.test(text)) {
            let matches = text.match(rules.tags);

            text =
              text.slice(0, matches.index) +
              text.slice(matches.index + matches[0].length);

            tags.push(matches[1].trim());
          }

          const payment = {
            value: Number(infos[3]),
            description: text.trim(),
            date: date,
            tags: tags,
            suspended,
          };

          if (infos[1] === "  ") {
            // currentBlock.payments[
            //   currentBlock.payments.length - 1
            // ].children.push(payment);
          } else {
            payments.push({
              ...currentBlock,
              ...payment,
            });
          }
        }
      });

      return payments;
    },

    addPayment(block) {
      block.payments.push({
        value: 0,
        description: "",
        payedOn: "",
        receivedOn: "",
        tags: [],
        suspended: false,
        children: [],
        isEditing: "description",
        isMouseOver: false,
      });

      this.$nextTick(() => {
        this.edit(block, block.payments.length - 1, "description");
      });
    },

    convertGroupPaymentsToText(groupPayments) {
      let output = [];

      groupPayments.forEach((block) => {
        output.push(
          `\n${this.fill(block.month, "0", 2)}/${this.fill(block.year, "0", 4)}`
        );

        block.payments.forEach((payment) => {
          let tags = "";
          let pre = [];
          let suspended = payment.suspended ? "--" : "";

          if (payment.tags.length !== 0) {
            tags = ` #${payment.tags.join(" #")}`;
          }

          if (payment.date) {
            pre.push(` on ${payment.date}`);
          }

          output.push(
            `${suspended}${String(payment.value)}${pre.join("")} ${
              payment.description
            }${tags}`
          );
        });
      });

      return output.join("\n").trim();
    },

    addMonth() {
      let month = this.fill(this.month, "0", 2);
      let year = this.fill(this.year, "0", 4);

      this.data.push({
        month,
        year,
        payments: [],
      });
    },

    fill(text, fill, length) {
      let output = String(text).substring(0, length);

      return fill.repeat(length - output.length) + output;
    },

    notSuspendedPayments(payments) {
      return payments.filter((payment) => !payment.suspended);
    },

    sumAllPayments(payments) {
      return this.sumArray(
        this.notSuspendedPayments(payments).map(
          (payment) => Number(payment.value) || 0
        )
      );
    },
  },

  computed: {
    ...mapState({
      payments: (state) => state.payments.all,
    }),

    months() {
      const months = this.payments.map((payment) => ({
        year: payment.year,
        month: payment.month,
      }));

      return months.filter(
        (month, index) =>
          index ===
          months.findIndex((localMonth) => {
            return (
              localMonth.year === month.year && localMonth.month === month.month
            );
          })
      );
    },

    groupPaymentsByMonths() {
      return this.months
        .map(({ year, month }) => {
          return {
            year,
            month,
            payments: this.payments.filter(
              (payment) => payment.year === year && payment.month === month
            ),
          };
        })
        .slice(0)
        .sort((month1, month2) => {
          const group1 = `${month1.year}${month1.month}`;
          const group2 = `${month2.year}${month2.month}`;

          if (group1 > group2) {
            return -1;
          } else if (group1 < group2) {
            return 1;
          }
        });
    },

    dataReverse() {
      return this.data.slice(0).reverse();
    },
  },

  watch: {},
};
</script>
