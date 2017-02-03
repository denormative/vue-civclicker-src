<template>
<div role="tabpanel" id="buildingsPane" class="buildings-pane tab-pane active">
  <p v-show="settings.customIncr">
    Custom Quantity <input id="buildingCustomQty" type="number" min="1" step="1" value="1" />
  </p>
  <table id="buildings"></table>
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
  computed: mapState({
    settings: state => state.settings,
  }),
}
</script>

<style>

</style>
