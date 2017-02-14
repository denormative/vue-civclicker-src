<template>
<div role="tabpanel" id="buildingsPane" class="buildings-pane tab-pane card active">
  <div class="card-header d-flex justify-content-end" v-show="settings.showHeaders || settings.customIncr">
    <h4 class="mb-0 mr-auto" v-show="settings.showHeaders">Buildings</h4>
    <div v-show="settings.customIncr">
      Custom Quantity: <input id="buildingCustomQty" type="number" min="1" step="1" value="10000"/>
    </div>
  </div>
  <div class="card-block">
    <table id="buildings"></table>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name:  'buildings-pane',
  props: ['homeBuildings'],
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {
      window.vm.addUITable(window.vm.homeBuildings, 'buildings') // Dynamically create the building controls table.
    })
  },
  computed: {
    ...mapState(['settings']),
  },
}
</script>

<style>

</style>
