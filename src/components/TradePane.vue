<template>
<div role="tabpanel" id="tradePane" class="trade-pane tab-pane">
  <span id="tradeRow"></span>
  <div id="tradeUpgradeContainer">
    <span id="currencyRow"></span>
    <span id="commerceRow"></span>
    <h4>Buy Resources (1 gold)</h4>
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
  name: 'trade-pane',
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {
    })
  },
  methods: {
    buy(materialId) { // eslint-disable-line no-unused-vars
      const material = window.vm.civData[materialId]
      if (window.vm.civData.gold.owned < 1) {
        return
      }
      window.vm.civData.gold.owned -= 1

      if (material === window.vm.civData.food || material === window.vm.civData.wood || material === window.vm.civData.stone) {
        material.owned += 5000
      }
      if (material === window.vm.civData.skins || material === window.vm.civData.herbs || material === window.vm.civData.ore) {
        material.owned += 500
      }
      if (material === window.vm.civData.leather || material === window.vm.civData.metal) {
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
