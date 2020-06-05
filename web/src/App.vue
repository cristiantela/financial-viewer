<template>
  <div>
    <div ref="navbar" class="bg-dark sticky-top py-2">
      <b-container>
        <b-row align-v="center" align-h="between" class="text-white">
          <b-col cols="auto">
            Saving type:

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

          <b-col cols="auto">
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

      <b-row class="justify-content-center align-items-end">
        <b-col cols="auto" class="text-center">
          <b-button size="sm" @click="openAddMonthModal" variant="primary">
            Add Month
          </b-button>
        </b-col>
      </b-row>

      <b-row>
        <b-col>
          <h1>Projects</h1>
        </b-col>
      </b-row>

      <b-row v-for="project in projects" :key="project.id">
        <b-col>
          {{ project.payment.description }}

          <b-row
            v-for="(month, index) in getProjectPeriod(project)"
            :key="index"
          >
            <b-col>
              {{ month.month }}/{{ month.year }}

              {{ project.payment.value / getProjectPeriod(project).length }}
            </b-col>
          </b-row>
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
                v-for="payment in getAllPayments(block.payments)"
                :key="payment.id"
                :payment="payment"
                @openEditPaymentModal="openEditPaymentModal"
              ></payment>

              <payment
                :payment="{
                  value: sumAllPayments(getAllPayments(block.payments)).toFixed(
                    2
                  ),
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
              <tags-percentage
                :payments="getAllPayments(block.payments)"
              ></tags-percentage>
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
      projects: [],
      data: [],
      saveType: localStorage.getItem("fv-save-type")
        ? localStorage.getItem("fv-save-type")
        : "local",
      savedInput: "",
      scrollY: 0,

      rules: {
        payment: /^( {2})?(--)?(-?[\d.]+) /,
        date: /^on ((\d{4}-\d{2}-)?\d{2}) ?/,
        tags: /#([^#]+)/,
      },
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
    getProjectPeriod(project) {
      const periodRule = /(\d{2})\/(\d{4})/;

      let [month, year] = project.from
        .match(periodRule)
        .slice(1)
        .map(Number);

      const [monthEnd, yearEnd] = project.to
        .match(periodRule)
        .slice(1)
        .map(Number);

      const months = [];

      for (; year <= yearEnd && month <= monthEnd; ) {
        months.push({
          month,
          year,
        });

        month++;

        if (month === 13) {
          month = 1;
          year++;
        }
      }

      return months;
    },

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
        };

        if (rules.blockStart.test(line)) {
          const infos = line.match(rules.blockStart);

          currentBlock = {
            month: infos[1],
            year: infos[2],
          };
        } else if (this.rules.payment.test(line)) {
          const payment = this.getPaymentFromLine(line);

          payments.push({
            ...currentBlock,
            ...payment,
          });
        }
      });

      return payments;
    },

    getPaymentFromLine(line) {
      const infos = line.match(this.rules.payment);

      let text = line.slice(infos[0].length);

      let date = "",
        tags = [],
        suspended = infos[2] === "--";

      if (this.rules.date.test(text)) {
        let matches = text.match(this.rules.date);

        date = matches[1];

        text = text.slice(matches[0].length);
      }

      while (this.rules.tags.test(text)) {
        let matches = text.match(this.rules.tags);

        text =
          text.slice(0, matches.index) +
          text.slice(matches.index + matches[0].length);

        tags.push(matches[1].trim());
      }

      return {
        value: Number(infos[3]),
        description: text.trim(),
        date: date,
        tags: tags,
        suspended,
      };
    },

    convertGroupPaymentsToText(groupPayments) {
      let output = [];

      groupPayments.forEach((block) => {
        output.push(
          `\n${this.fill(block.month, "0", 2)}/${this.fill(block.year, "0", 4)}`
        );

        block.payments.forEach((payment) => {
          output.push(this.convertPaymentLineToText(payment));
        });
      });

      return (
        this.convertProjectsToText() +
        "\n\n" +
        output.join("\n").trim()
      ).trim();
    },

    convertPaymentLineToText(payment) {
      let tags = "";
      let pre = [];
      let suspended = payment.suspended ? "--" : "";

      if (payment.tags.length !== 0) {
        tags = ` #${payment.tags.join(" #")}`;
      }

      if (payment.date) {
        pre.push(` on ${payment.date}`);
      }

      return `${suspended}${String(payment.value)}${pre.join("")} ${
        payment.description
      }${tags}`;
    },

    convertProjectsToText() {
      return this.projects
        .map((project) => {
          return `project ${project.id} ${this.convertPaymentLineToText(
            project.payment
          )}\n  from ${project.from} to ${project.to}`;
        })
        .join("\n\n");
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
      this.projects = this.getProjectsFromText(text);

      this.$store.dispatch("payments/setAllPayments", this.textToJson(text));
    },

    getAllPayments(payments) {
      const otherPayments = [];

      const paymentReference = payments[0];

      this.projects.forEach((project) => {
        this.getProjectPeriod(project).forEach((month, index, all) => {
          if (
            month.month === Number(paymentReference.month) &&
            month.year === Number(paymentReference.year)
          ) {
            otherPayments.push({
              ...project.payment,
              value: -project.payment.value / all.length,
            });
          }
        });
      });

      return payments
        .filter((payment) => payment.description !== "NONE")
        .concat(otherPayments);
    },

    getProjectsFromText(text) {
      const projectRule = /^project ([a-z0-9-]+) /;
      const periodRule = /^ {2}from (\d{2}\/\d{4}) to (\d{2}\/\d{4})$/;

      let projects = [];
      let isProject = false;

      text.split("\n").forEach((line) => {
        if (projectRule.test(line)) {
          isProject = true;

          const [content, projectId] = line.match(projectRule);

          projects.push({
            id: projectId,
            payment: this.getPaymentFromLine(line.slice(content.length)),
            from: null,
            to: null,
          });
        }

        if (isProject && periodRule.test(line)) {
          const [from, to] = line.match(periodRule).slice(1);

          const lastIndex = projects.length - 1;

          projects[lastIndex].from = from;
          projects[lastIndex].to = to;
        }

        if (line === "" && isProject) {
          isProject = false;
        }
      });

      return projects;
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
