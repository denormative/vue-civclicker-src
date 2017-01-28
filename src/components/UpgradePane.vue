<template>
<div role="tabpanel" id="upgradesPane" class="upgrades-pane tab-pane">
  <table id="upgrades"></table>
</div>
</template>

<script>
export default {
  name: 'upgrades-pane',
  props: ['normalUpgrades'],
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {
      window.addUpgradeRows() // This sets up the framework for the upgrade items.
      window.addUITable(window.vm.normalUpgrades, 'upgrades') // Place the stubs for most upgrades under the upgrades tab.
    })
  },
  methods: {
  },
}
</script>

<style scoped>

</style>
