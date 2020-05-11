<template>
  <div class="bg-dark text-light">
    <b-container class="py-4">
      <b-row>
        <b-col>
          <div class="text-center mb-2">
            2020 &copy; with
            <b-icon icon="heart-fill" variant="danger"></b-icon>

            by

            <b-dropdown>
              <template v-slot:button-content>
                Matheus Cristian &#x1F308;
              </template>

              <b-dropdown-item
                href="https://github.com/cristiantela"
                target="_blank"
              >
                Github
              </b-dropdown-item>

              <b-dropdown-item
                href="https://www.instagram.com/cristiantela/"
                target="_blank"
              >
                Instagram
              </b-dropdown-item>
            </b-dropdown>
          </div>

          <div>
            Support

            <b-card
              no-body
              class="mt-1 text-dark"
              :style="{ wordBreak: 'break-word' }"
            >
              <b-tabs pills card vertical>
                <b-tab title="NuBank" active>
                  <b-card-text>
                    <qr-code
                      text="https://nubank.com.br/pagar/199pu6/LgHoTf64iQ"
                      :size="100"
                      class="qr-code"
                    ></qr-code>

                    <br />

                    Or access the link
                    <a
                      href="https://nubank.com.br/pagar/199pu6/LgHoTf64iQ"
                      target="_blank"
                    >
                      https://nubank.com.br/pagar/199pu6/LgHoTf64iQ
                    </a>
                  </b-card-text>
                </b-tab>

                <b-tab title="PicPay">
                  <b-card-text>
                    <qr-code
                      text="https://picpay.me/cristiantela"
                      :size="100"
                      class="qr-code"
                    ></qr-code>

                    <br />

                    Or access the link
                    <a href="https://picpay.me/cristiantela" target="_blank">
                      https://picpay.me/cristiantela
                    </a>
                  </b-card-text>
                </b-tab>
              </b-tabs>
            </b-card>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
export default {
  name: "layout-footer",

  data() {
    return {};
  },
};
</script>

<style scoped>
.qr-code {
  border: 3px solid white;
  display: inline-block;
}
</style>
