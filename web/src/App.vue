<template>
  <b-container>
    <add-payment-modal ref="addPaymentModal"></add-payment-modal>

    <b-row>
      <b-col>
        Input

        <b-form-textarea
          v-model="input"
          rows="10"
          class="mb-1"
          size="sm"
        ></b-form-textarea>

        <b-button @click="save" class="mr-1" size="sm" variant="primary">
          Save Local
          <span v-if="unsavedInput">*</span>
        </b-button>

        <b-button @click="copy" class="mr-1" size="sm" variant="primary">
          Copy
        </b-button>

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
                  :disabled="unsavedInput"
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
      savedInput: "",
      input: "",
      data: [],
      tagInput: "",
      month: "",
      year: "",
    };
  },

  created() {
    this.$store.dispatch("payments/getAllPayments");
    this.getSavedInput();
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

    getSavedInput() {
      let financialViewerContent = localStorage.getItem("financial-viewer");

      if (financialViewerContent === null) {
        this.savedInput = `
03/2020
1000 salary
-70 payed on 11 dentist plan #health
-50 bus credit #transport #bus

04/2020
1000 salary
                            `;
      } else {
        this.savedInput = financialViewerContent;
      }

      this.input = this.savedInput;
    },

    save() {
      localStorage.setItem("financial-viewer", this.input);
      this.savedInput = this.input;
    },

    copy() {
      const textarea = document.createElement("textarea");
      textarea.value = this.input;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    },

    download() {
      const blob = new Blob([this.input]);
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
        this.input = reader.result;
        this.save();
      });

      reader.readAsText(file);

      event.srcElement.value = "";
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

    formatAndSave() {
      this.input = this.dataTransformed();
      this.save();
    },

    dataTransformed() {
      let output = [];

      this.data.forEach((block) => {
        output.push(`\n${block.month}/${block.year}`);

        block.payments.forEach((payment) => {
          let tags = "";
          let pre = [];

          if (payment.tags.length !== 0) {
            tags = ` #${payment.tags.join(" #")}`;
          }

          if (payment.payedOn) {
            pre.push(` payed on ${payment.payedOn}`);
          }

          if (payment.receivedOn) {
            pre.push(` received on ${payment.receivedOn}`);
          }

          output.push(
            `${String(payment.value)}${pre.join("")} ${
              payment.description
            }${tags}`
          );
        });
      });

      return output.join("\n").trim();
    },

    addMonth() {
      if (this.unsavedInput) {
        return false;
      }

      let month = this.fill(this.month, "0", 2);
      let year = this.fill(this.year, "0", 4);

      this.data.push({
        month,
        year,
        payments: [],
      });

      this.formatAndSave();
    },

    fill(text, fill, length) {
      let output = String(text).substring(0, length);

      for (let i = output.length; i < length; i++) {
        output = `${fill}${output}`;
      }

      return output;
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
      return this.months.map(({ year, month }) => {
        return {
          year,
          month,
          payments: this.payments.filter(
            (payment) => payment.year === year && payment.month === month
          ),
        };
      });
    },

    dataReverse() {
      return this.data.slice(0).reverse();
    },

    unsavedInput() {
      return this.savedInput !== this.input;
    },
  },

  watch: {
    input: {
      handler(input) {
        this.data = [];

        let currentBlock = null;

        input.split("\n").forEach((line) => {
          const rules = {
            blockStart: /^(\d{2})\/(\d{4})$/,
            payment: /^( {2})?(--)?(-?[\d.]+) /,
            actionOn: /^(payed|received) on (\d{2}) ?/,
            tags: /#([^#]+)/,
          };

          if (rules.blockStart.test(line)) {
            const infos = line.match(rules.blockStart);

            currentBlock = {
              month: infos[1],
              year: infos[2],
              payments: [],
            };

            this.data.push(currentBlock);
          } else if (rules.payment.test(line)) {
            const infos = line.match(rules.payment);

            let text = line.slice(infos[0].length);

            let payedOn = "",
              receivedOn = "",
              tags = [],
              suspended = infos[2] === "--";

            while (rules.actionOn.test(text)) {
              let matches = text.match(rules.actionOn);
              let action = matches[1];

              if (action === "payed") {
                payedOn = matches[2];
              } else if (action === "received") {
                receivedOn = matches[2];
              }

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
              payedOn: payedOn,
              receivedOn: receivedOn,
              tags: tags,
              suspended,
            };

            if (infos[1] === "  ") {
              currentBlock.payments[
                currentBlock.payments.length - 1
              ].children.push(payment);
            } else {
              currentBlock.payments.push({
                ...payment,
                children: [],
                isEditing: false,
                isMouseOver: false,
              });
            }
          }
        });
      },
      immediate: true,
    },
  },
};
</script>
