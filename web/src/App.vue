<template>
  <div>
    <b-container>
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

          <b-button @click="openFileSelector" class="mr-1" size="sm" variant="primary">
            Import
          </b-button>

          <input @change="importFile" ref="file" type="file" class="d-none">
        </b-col>
      </b-row>

      <b-row class="justify-content-center align-items-end">
        <b-col cols="3">
          Month
          <b-form-input size="sm" v-model="month" type="text"/>
        </b-col>

        <b-col cols="3">
          Year
          <b-form-input size="sm" v-model="year" type="text"/>
        </b-col>

        <b-col cols="auto" class="text-center">
          <b-button size="sm" @click="addMonth" variant="primary">Add Month</b-button>
        </b-col>
      </b-row>

      <div class="row">
        <div v-for="(block, blockIndex) in dataReverse" :key="blockIndex" class="w-100">
          <div class="text-center">
            <h1>
              {{ monthName(block.month) }}/{{ block.year }}
            </h1>
          </div>

          <div class="row">
            <div class="col-12 col-sm-6">
              <payment v-for="(payment, paymentIndex) in block.payments" :key="paymentIndex" :payment="payment"></payment>

              <div class="row">
                <div class="col-3 text-right">
                  {{ sumAllPayments(block.payments).toFixed(2) }}
                </div>
              </div>

              <div class="row">
                <div class="col offset-3">
                  <button @click="addPayment(block)" :disabled="unsavedInput" class="btn btn-sm btn-primary">Add Payment</button>
                </div>
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <div class="row mb-4">
                <div class="col">
                  <div class="row">
                    <div class="col text-right">
                      Revenue {{ revenue(block.payments).toFixed(2) }}
                    </div>
                  </div>

                  <div>
                    <div
                      v-for="(color, index) in colors"
                      :style="{
                    width: color.width + '%',
                    height: '.5em',
                    backgroundColor: color.color,
                    display: 'inline-block'
                  }"
                  :key="index"
                    ></div>
                  </div>

                  <div>
                    <div
                      v-for="(tag, index) in groupTags(block.payments)"
                      :style="{
                        width: tag.percentage + '%',
                        height: '1em',
                        backgroundColor: tag.color,
                        display: 'inline-block'
                      }"
                      :key="index"
                    ></div>
                    {{ (spent(block.payments) / revenue(block.payments) *
                    100).toFixed(1) }}%
                  </div>

                  <div class="row">
                    <div class="col text-right">
                      <div
                        :style="{
                        width: spent(block.payments) / revenue(block.payments) * 100 + '%',
                      }"
                      >
                        Spent {{ spent(block.payments).toFixed(2) }}
                        <br />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-for="(tag, index) in groupTags(block.payments)" :key="index" class="row">
                <div class="col-2 text-right">{{ tag.value.toFixed(2) }}</div>
                <div class="col-3 text-right">
                  {{ tag.name }}
                </div>
                <div class="col">
                  <div
                    :style="{
                    width: tag.percentage + '%',
                    height: '1em',
                    backgroundColor: tag.color,
                    display: 'inline-block'
                  }"
                  ></div>
                  {{ tag.percentage.toFixed(1) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </b-container>
  </div>
</template>

<script>
import Payment from "./components/Payment.vue";

export default {
  name: "App",
  components: {
    Payment,
  },

  data() {
    return {
      savedInput: "",
      input: "",
      data: [],
      colors: [
        {
          width: 60,
          color: "#2ecc71"
        },
        {
          width: 10,
          color: "#f39c12"
        },
        {
          width: 30,
          color: "#e74c3c"
        }
      ],
      tagInput: '',
      month: '',
      year: '',
    }
  },

  created() {
    this.getSavedInput();
  },

  methods: {
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
      let financialViewerContent = localStorage.getItem(
        "financial-viewer"
      );

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
      const textarea = document.createElement('textarea');
      textarea.value = this.input;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    },

    download() {
      const blob = new Blob([this.input]);
      const a = document.createElement('a');
      a.setAttribute('href', URL.createObjectURL(blob));
      a.setAttribute('download', 'financial planner.txt');
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

      reader.addEventListener('load', () => {
        this.input = reader.result;
        this.save();
      });

      reader.readAsText(file);

      event.srcElement.value = '';
    },

    revenue(payments) {
      return this.sumArray(
        this.notSuspendedPayments(payments).map(payment => Number(payment.value) || 0).filter(value => value > 0)
      );
    },

    spent(payments) {
      return -this.sumArray(
        this.notSuspendedPayments(payments).map(payment => Number(payment.value) || 0).filter(value => value < 0)
      );
    },

    groupTags(payments) {
      const revenue = this.revenue(payments);

      const tags = [
        {
          name: "others",
          value: 0
        }
      ];

      this.notSuspendedPayments(
        this.paymentsInline(payments)
      )
        .filter(payment => payment.value < 0)
        .forEach(payment => {
          if (payment.tags.length === 0) {
            tags.find(
              tag => tag.name === "others"
            ).value += -this.calculateFinalValue(payment);
          } else {
            payment.tags.forEach(tag => {
              const tagDivisions = tag.split("/");
              const tagName = tagDivisions[0];

              const t = tags.find(t => t.name === tagName);

              if (t) {
                t.value += -this.calculateFinalValue(payment);
              } else {
                tags.push({
                  name: tagName,
                  value: -this.calculateFinalValue(payment),
                });
              }
            });
          }
        });

      tags.sort((a, b) => {
        if (a.value > b.value) {
          return -1;
        } else if (a.value < b.value) {
          return 1;
        }

        return 0;
      });

      const colors = [
        "#9b59b6",
        "#2980b9",
        "#27ae60",
        "#16a085",
        "#2c3e50",
        "#f1c40f",
        "#c0392b",
        "#e67e22",
        "#2ecc71",
        "#f39c12"
      ];

      let counter = 0;

      tags.forEach(tag => {
        tag.percentage = (tag.value / revenue) * 100;
        tag.color = colors[counter++ % colors.length];
      });

      return tags.filter(
        tag => !(tag.name === "others" && tag.value === 0)
      );
    },

    addPayment(block) {
      block.payments.push({
        value: 0,
        description: '',
        payedOn: '',
        receivedOn: '',
        tags: [],
        suspended: false,
        children: [],
        isEditing: 'description',
        isMouseOver: false,
      });

      this.$nextTick(() => {
        this.edit(block, block.payments.length - 1, 'description');
      });
    },

    formatAndSave() {
      this.input = this.dataTransformed();
      this.save();
    },

    dataTransformed() {
      let output = [];

      this.data.forEach(block => {
        output.push(`\n${block.month}/${block.year}`);

        block.payments.forEach(payment => {
          let tags = '';
          let pre = [];

          if (payment.tags.length !== 0) {
            tags = ` #${payment.tags.join(' #')}`;
          }

          if (payment.payedOn) {
            pre.push(` payed on ${payment.payedOn}`);
          }

          if (payment.receivedOn) {
            pre.push(` received on ${payment.receivedOn}`);
          }

          output.push(`${String(payment.value)}${pre.join('')} ${payment.description}${tags}`);
        });
      });

      return output.join('\n').trim();
    },

    addMonth() {
      if (this.unsavedInput) {
        return false;
      }

      let month = this.fill(this.month, '0', 2);
      let year = this.fill(this.year, '0', 4);

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
      return payments.filter(payment => !payment.suspended);
    },

    sumAllPayments(payments) {
      return this.sumArray(
        this.notSuspendedPayments(payments).map(payment => Number(payment.value) || 0)
      );
    },

    calculateFinalValue(payment) {
      const children = payment.children ? payment.children.map(payment => payment.value) : [];

      let discount = 0;

      if (children.length) {
        discount = children.reduce((value, current) => value + current);
      }

      return Number((payment.value - discount).toFixed(2));
    },

    paymentsInline(payments) {
      const output = [];

      payments.forEach(payment => {
        output.push(payment);

        payment.children.forEach(subPayment => output.push(subPayment));
      });

      return output;
    },
  },

  computed: {
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

        input.split("\n").forEach(line => {
          const rules = {
            blockStart: /^(\d{2})\/(\d{4})$/,
            payment: /^( {2})?(--)?(-?[\d.]+) /,
            actionOn: /^(payed|received) on (\d{2}) ?/,
            tags: /#([^#]+)/
          };

          if (rules.blockStart.test(line)) {
            const infos = line.match(rules.blockStart);

            currentBlock = {
              month: infos[1],
              year: infos[2],
              payments: []
            };

            this.data.push(currentBlock);
          } else if (rules.payment.test(line)) {
            const infos = line.match(rules.payment);

            let text = line.slice(infos[0].length);

            let payedOn = '',
              receivedOn = '',
              tags = [],
              suspended = infos[2] === '--';

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

            if (infos[1] === '  ') {
              currentBlock.payments[currentBlock.payments.length - 1].children.push(payment);
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
      immediate: true
    }
  }
};
</script>
