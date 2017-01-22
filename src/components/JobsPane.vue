<template>
<div class="jobs-pane card">
  <h4 class="card-header">Jobs</h4>
  <div class="card-block">
    <p v-show="customJobQuantity">
      Custom Quantity <input id="homeCustomQty" type="number" min="1" step="1" value="1" />
    </p>
    <table id="jobs" class="table-sm"></table>
  </div>
</div>
</template>

<script>
export default {
  name: 'jobs-pane',
  props: ['settings'],
  data() {
    return {}
  },
  computed: {
    customJobQuantity: function() {
      return this.settings.customIncr
    }
  }
}
</script>

<style>
#customJobQuantity {
  display: none;
}
</style>
