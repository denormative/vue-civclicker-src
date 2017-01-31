<template>
<div role="tabpanel" id="buildingsPane" class="buildings-pane tab-pane active">
  <p v-show="settings.customIncr">
    Custom Quantity <input id="buildingCustomQty" type="number" min="1" step="1" value="1" />
  </p>
  <table id="buildings"></table>
</div>
</template>

<script>
export default {
  name: 'buildings-pane',
  props: ['homeBuildings', 'settings'],
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {
      window.addUITable(window.vm.homeBuildings, 'buildings') // Dynamically create the building controls table.
    })
  },
}
</script>

<style>
</style>
