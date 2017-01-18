<template>
  <div class="buildings-pane">
    <div id="buildingsPane" class="selectPane selected">
      <p id="customBuildQuantity">
        Custom Quantity <input id="buildingCustomQty" type="number" min="1" step="1" value="1" />
      </p>
      <table id="buildings"></table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'buildings-pane',
  data () {
    return {
    }
  }
}
</script>

<style scoped>
</style>
