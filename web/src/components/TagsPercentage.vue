<template>
  <div>
    <b-row class="mb-4">
      <b-col>
        <b-row>
          <b-col class="text-right">
            Revenue {{ revenue(payments).toFixed(2) }}
          </b-col>
        </b-row>

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
            v-for="(tag, index) in groupTags(payments)"
            :style="{
              width: tag.percentage + '%',
              height: '1em',
              backgroundColor: tag.color,
              display: 'inline-block'
            }"
            :key="index"
          ></div>
          {{ (spent(payments) / revenue(payments) *
          100).toFixed(1) }}%
        </div>

        <b-row>
          <b-col class="text-right">
            <div
              :style="{
                width: spent(payments) / revenue(payments) * 100 + '%',
              }"
            >
              Spent {{ spent(payments).toFixed(2) }}
            </div>
          </b-col>
        </b-row>
      </b-col>
    </b-row>

    <b-row v-for="(tag, index) in groupTags(payments)" :key="index">
      <b-col cols="2" class="text-right">
        {{ tag.value.toFixed(2) }}
      </b-col>

      <b-col cols="3" class="text-right">
        {{ tag.name }}
      </b-col>

      <b-col>
        <div
          :style="{
            width: tag.percentage + '%',
            height: '1em',
            backgroundColor: tag.color,
            display: 'inline-block'
          }"
        ></div>

        {{ tag.percentage.toFixed(1) }}%
      </b-col>
    </b-row>
  </div>
</template>

<script>
  export default {
    name: 'tags-percentage',

    props: ['payments'],

    data() {
      return {
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
      };
    },

    methods: {
      paymentsInline(payments) {
        const output = [];

        payments.forEach(payment => {
          output.push(payment);

          payment.children.forEach(subPayment => output.push(subPayment));
        });

        return output;
      },

      sumArray(array) {
        if (array.length === 0) {
          return 0;
        } else if (array.length === 1) {
          return array[0];
        }

        return array.reduce((value, current) => value + current);
      },

      spent(payments) {
        return -this.sumArray(
          this.notSuspendedPayments(payments).map(payment => Number(payment.value) || 0).filter(value => value < 0)
        );
      },

      revenue(payments) {
        return this.sumArray(
          this.notSuspendedPayments(payments).map(payment => Number(payment.value) || 0).filter(value => value > 0)
        );
      },

      notSuspendedPayments(payments) {
        return payments.filter(payment => !payment.suspended);
      },

      calculateFinalValue(payment) {
        const children = payment.children ? payment.children.map(payment => payment.value) : [];

        let discount = 0;

        if (children.length) {
          discount = children.reduce((value, current) => value + current);
        }

        return Number((payment.value - discount).toFixed(2));
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
    },
  }
</script>