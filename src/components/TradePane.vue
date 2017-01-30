<template>
<div role="tabpanel" id="tradePane" class="trade-pane tab-pane">
  <span id="tradeRow"></span>
  <div id="tradeUpgradeContainer">
    <span id="currencyRow"></span>
    <span id="commerceRow"></span>
    <h4>Buy Resources (1 gold)</h4>
    <button class="btn btn-secondary btn-sm tradeResource" @click="buy('food')">Buy 5000 Food</button><br>
    <button class="btn btn-secondary btn-sm tradeResource" @click="buy('wood')">Buy 5000 Wood</button><br>
    <button class="btn btn-secondary btn-sm tradeResource" @click="buy('stone')">Buy 5000 Stone</button><br>
    <button class="btn btn-secondary btn-sm tradeResource" @click="buy('skins')">Buy 500 Skins</button><br>
    <button class="btn btn-secondary btn-sm tradeResource" @click="buy('herbs')">Buy 500 Herbs</button><br>
    <button class="btn btn-secondary btn-sm tradeResource" @click="buy('ore')">Buy 500 Ore</button><br>
    <button class="btn btn-secondary btn-sm tradeResource" @click="buy('leather')">Buy 250 Leather</button><br>
    <button class="btn btn-secondary btn-sm tradeResource" @click="buy('metal')">Buy 250 Metal</button><br>
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
