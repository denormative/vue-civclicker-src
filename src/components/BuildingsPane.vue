<template>
<div role="tabpanel" id="buildingsPane" class="buildings-pane tab-pane active">
  <p id="customBuildQuantity">
    Custom Quantity <input id="buildingCustomQty" type="number" min="1" step="1" value="1" />
  </p>
  <table id="buildings"></table>
</div>
</template>

<script>
export default {
  name: 'buildings-pane',
  data() {
    return {}
  }
}
</script>

<style>
#customBuildQuantity {
  display: none;
  margin-left: 1em;
}
</style>
