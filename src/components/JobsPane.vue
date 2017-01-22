<template>
  <div class="jobs-pane">
    <div id="jobsContainer">
      <h3>Jobs</h3>
      <p id="customJobQuantity">
        Custom Quantity <input id="homeCustomQty" type="number" min="1" step="1" value="1" />
      </p>
      <table id="jobs"></table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'jobs-pane',
  data () {
    return {
    }
  }
}
</script>

<style>
#customJobQuantity {
  display: none;
}
</style>
