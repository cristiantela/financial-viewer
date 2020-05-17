<template>
  <div>
    <div ref="navbar" class="bg-dark sticky-top py-2">
      <b-container>
        <b-row align-v="center" align-h="between">
          <b-col cols="auto">
            <b-button
              v-if="saveType === 'local'"
              @click="saveLocal"
              class="mr-1"
              variant="primary"
            >
              Save Local

              <span
                v-if="
                  savedInput !==
                    convertGroupPaymentsToText(groupPaymentsByMonths)
                "
              >
                (Not saved)
              </span>
            </b-button>
          </b-col>

          <b-col cols="auto" class="text-white">
            <span v-if="currentBlock">
              <b-form-select
                @change="changeMonth"
                :value="`${format(currentBlock)}`"
                class="w-auto"
              >
                <b-form-select-option
                  v-for="month in monthsOrdered"
                  :key="format(month)"
                  :value="format(month)"
                >
                  {{ monthName(month.month) }}/{{ month.year }}
                </b-form-select-option>
              </b-form-select>
            </span>

            <span v-else>
              Financial Viewer
            </span>
          </b-col>

          <b-col cols="auto">
            <b-dropdown right text="Actions" variant="primary">
              <b-dropdown-item href="#" @click="download">
                Download
              </b-dropdown-item>

              <b-dropdown-item href="#" @click="openFileSelector">
                Import
              </b-dropdown-item>
            </b-dropdown>

            <input @change="importFile" ref="file" type="file" class="d-none" />
          </b-col>
        </b-row>
      </b-container>
    </div>

    <b-container class="py-4">
      <form-payment-modal ref="formPaymentModal"></form-payment-modal>
      <add-month-modal ref="addMonthModal"></add-month-modal>

      <b-row align-h="between" align-v="end" class="mb-2">
        <b-col>
          Saving type:

          <b-form-group class="mb-0">
            <b-form-select
              v-model="saveType"
              :style="{
                width: '150px',
              }"
              class="mr-1"
            >
              <b-form-select-option value="local">Local</b-form-select-option>
              <b-form-select-option value="online" disabled>
                Online (The API is being built)
              </b-form-select-option>
            </b-form-select>
          </b-form-group>
        </b-col>
      </b-row>

      <b-row class="justify-content-center align-items-end">
        <b-col cols="auto" class="text-center">
          <b-button size="sm" @click="openAddMonthModal" variant="primary">
            Add Month
          </b-button>
        </b-col>
      </b-row>

      <b-row
        v-for="block in groupPaymentsByMonths"
        :key="`${block.year}-${block.month}`"
        :ref="format(block)"
      >
        <b-col>
          <div class="text-center">
            <h1>{{ monthName(block.month) }}/{{ block.year }}</h1>
          </div>

          <b-row>
            <b-col cols="12" sm="6">
              <payment
                v-for="payment in removeTheNonePayment(block.payments)"
                :key="payment.id"
                :payment="payment"
                @openEditPaymentModal="openEditPaymentModal"
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
        </b-col>
      </b-row>
    </b-container>

    <Footer></Footer>
  </div>
</template>

<script>
import FormPaymentModal from "./components/FormPaymentModal.vue";
import addMonthModal from "./components/AddMonthModal.vue";
import Payment from "./components/Payment.vue";
import TagsPercentage from "./components/TagsPercentage.vue";
import Footer from "./components/Footer.vue";
import { mapState } from "vuex";

export default {
  name: "App",

  components: {
    FormPaymentModal,
    addMonthModal,
    Payment,
    TagsPercentage,
    Footer,
  },

  data() {
    return {
      data: [],
      saveType: localStorage.getItem("fv-save-type")
        ? localStorage.getItem("fv-save-type")
        : "local",
      savedInput: "",
      scrollY: 0,
    };
  },

  created() {
    if (this.saveType === "local" && localStorage.getItem("fv-input")) {
      this.savedInput = localStorage.getItem("fv-input");

      this.setPaymentsByText(this.savedInput);
    } else {
      this.$store.dispatch("payments/getAllPayments");
    }

    window.addEventListener("scroll", () => {
      this.scrollY = window.scrollY;
    });
  },

  methods: {
    changeMonth(value) {
      window.scrollTo(0, this.offsetTopBlock(value));
    },

    offsetTopBlock(block) {
      const element = this.$refs[block];

      if (!element || !element.length) {
        return 0;
      }

      return this.offsetTop(element[0]) - this.$refs.navbar.offsetHeight;
    },

    offsetTop(element) {
      let top = 0;

      while (element !== null) {
        top += element.offsetTop;
        element = element.offsetParent;
      }

      return top;
    },

    format(block) {
      const month = this.fill(block.month, "0", 2);
      const year = this.fill(block.year, "0", 4);

      return `month-${month}${year}`;
    },

    openAddPaymentModal(data) {
      this.$refs["formPaymentModal"].show({
        type: "add",
        data,
      });
    },

    openEditPaymentModal(payment) {
      this.$refs["formPaymentModal"].show({
        type: "edit",
        data: payment,
      });
    },

    monthName(month) {
      return "January,February,March,April,May,June,July,August,September,October,November,December".split(
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
        this.setPaymentsByText(reader.result);
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

          if (infos[1] !== "  ") {
            payments.push({
              ...currentBlock,
              ...payment,
            });
          }
        }
      });

      return payments;
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

    openAddMonthModal() {
      this.$refs.addMonthModal.show();
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

    saveLocal() {
      this.savedInput = this.convertGroupPaymentsToText(
        this.groupPaymentsByMonths
      );

      localStorage.setItem("fv-input", this.savedInput);
    },

    setPaymentsByText(text) {
      this.$store.dispatch("payments/setAllPayments", this.textToJson(text));
    },

    removeTheNonePayment(payments) {
      return payments.filter((payment) => payment.description !== "NONE");
    },
  },

  computed: {
    ...mapState({
      payments: (state) => state.payments.all,
    }),

    currentBlock() {
      let current = {
        block: null,
        maxTop: 0,
      };

      this.months.forEach((block) => {
        const top = this.offsetTopBlock(this.format(block));

        if (this.scrollY >= top && top > current.maxTop) {
          current.block = block;
          current.maxTop = top;
        }
      });

      return current.block;
    },

    monthsOrdered() {
      return this.months.slice(0).sort((block1, block2) => {
        if (block1.year === block2.year) {
          if (block1.month === block2.month) {
            return 0;
          } else if (block1.month > block2.month) {
            return -1;
          } else {
            return 1;
          }
        } else if (block1.year > block2.year) {
          return -1;
        } else {
          return 1;
        }
      });
    },

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

  watch: {
    saveType(value) {
      localStorage.setItem("fv-save-type", value);
    },
  },
};
</script>
