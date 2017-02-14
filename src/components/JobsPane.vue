<template>
<div role="tabpanel" id="jobsPane" class="jobs-pane tab-pane card">
  <div class="card-header d-flex justify-content-end" v-show="settings.showHeaders || settings.customIncr">
    <h4 class="mb-0 mr-auto" v-show="settings.showHeaders">Jobs</h4>
    <div v-show="settings.customIncr">
      Custom Quantity: <input id="homeCustomQty" type="number" min="1" step="1" value="1" />
    </div>
  </div>
  <div class="card-block">
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
  computed: {
    ...mapState(['settings']),
  },
}
</script>

<style>
#customJobQuantity {
  display: none;
}
</style>
