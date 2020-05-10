const _payments = [
  {
    id: "c54fb5f5-3940-4b45-8497-ce92a29f7968",
    value: 10,
    description: "Bus credit",
    tags: ["bus"],
    date: "2020-05-01",
    suspended: false,
    year: 2020,
    month: 5,
  },
  {
    id: "c54fb5f4-3940-4b45-8497-ce92a29f7968",
    value: -10,
    description: "Bus credit",
    tags: ["bus"],
    date: "2020-05-01",
    suspended: true,
    year: 2020,
    month: 5,
  },
  {
    id: "c54fb5f3-3940-4b45-8497-ce92a29f7968",
    value: 100,
    description: "Bus credit",
    tags: ["bus"],
    date: "2020-06-01",
    suspended: false,
    year: 2020,
    month: 6,
  },
  {
    id: "c54fb5f2-3940-4b45-8497-ce92a29f7968",
    value: -10,
    description: "Bus credit",
    tags: ["bus"],
    date: "2020-06-01",
    suspended: false,
    year: 2020,
    month: 6,
  },
];

export default {
  getPayments(cb) {
    setTimeout(() => cb(_payments), 100);
  },

  addPayment(payment, cb) {
    payment;

    setTimeout(() => {
      cb({
        id: Math.floor(Math.random() * 1000),
      });
    }, 1000);
  },

  removePayment(payment, cb) {
    payment;

    setTimeout(() => {
      cb();
    }, 1000);
  },

  updatePayment(payment, cb) {
    setTimeout(() => {
      cb(payment.payment);
    }, 1000);
  },
};
