<template>
<div role="tabpanel" id="jobsPane" class="jobs-pane tab-pane card">
  <h4 class="card-header">Jobs</h4>
  <div class="card-block">
    <p v-show="settings.customIncr">
      Custom Quantity <input id="homeCustomQty" type="number" min="1" step="1" value="1" />
    </p>
    <table id="jobs" class="table-sm"></table>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name:  'jobs-pane',
  props: ['homeUnits'],
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {
      window.vm.addUITable(window.vm.homeUnits, 'jobs') // Dynamically create the job controls table.
    })
  },
  computed: mapState({
    settings: state => state.settings,
    // customJobQuantity() {
    //   return this.settings.customIncr
    // },
  }),
}
</script>

<style>
#customJobQuantity {
  display: none;
}
</style>
