<template>
<div role="tabpanel" id="tradePane" class="trade-pane tab-pane card">
  <h4 class="card-header">Trade</h4>
  <div class="card-block">
    <span id="tradeRow"></span>
    <div id="tradeUpgradeContainer">
      <!-- v-show="civData.trade.owned"-->
      <span id="currencyRow"></span>
      <span id="commerceRow"></span>
      <h6>Buy Resources (1 gold)</h6>
      <div class="row">
        <div class="col-4" v-for="tradeItem in tradeItems">
          <button class="btn btn-secondary btn-block text-capitalize" @click="buy(tradeItem.materialId)">
            Buy {{tradeItem.requested}} {{tradeItem.materialId}}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name:  'trade-pane',
  props: ['civData'],
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {})
  },
  computed: {
    ...mapState(['tradeItems']),
  },
  methods: {
    buy(materialId) { // eslint-disable-line no-unused-vars
      const material = this.civData[materialId]
      if (this.civData.gold.owned < 1) {
        return
      }
      this.civData.gold.owned -= 1

      if (material === this.civData.food || material === this.civData.wood || material === this.civData.stone) {
        material.owned += 5000
      }
      if (material === this.civData.skins || material === this.civData.herbs || material === this.civData.ore) {
        material.owned += 500
      }
      if (material === this.civData.leather || material === this.civData.metal) {
        material.owned += 250
      }

      window.updateResourceTotals()
    },
  },
}
</script>

<style>
#tradeUpgradeContainer {
  display: none;
}
</style>
