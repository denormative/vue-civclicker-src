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
        <div class="col-4"><button class="btn btn-secondary btn-block" @click="buy('food')">Buy 5000 Food</button></div>
        <div class="col-4"><button class="btn btn-secondary btn-block" @click="buy('wood')">Buy 5000 Wood</button></div>
        <div class="col-4"><button class="btn btn-secondary btn-block" @click="buy('stone')">Buy 5000 Stone</button></div>
        <div class="col-4"><button class="btn btn-secondary btn-block" @click="buy('skins')">Buy 500 Skins</button></div>
        <div class="col-4"><button class="btn btn-secondary btn-block" @click="buy('herbs')">Buy 500 Herbs</button></div>
        <div class="col-4"><button class="btn btn-secondary btn-block" @click="buy('ore')">Buy 500 Ore</button></div>
        <div class="col-4"><button class="btn btn-secondary btn-block" @click="buy('leather')">Buy 250 Leather</button></div>
        <div class="col-4"><button class="btn btn-secondary btn-block" @click="buy('metal')">Buy 250 Metal</button></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name:  'trade-pane',
  props: ['civData'],
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {})
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
