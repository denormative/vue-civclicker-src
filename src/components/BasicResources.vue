<template>
  <div class="basic-resources card">
    <h4 class="card-header">Basic Resources</h4>
    <div class="card-block">
      <table id="basicResources" class="table-sm"></table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'basic-resources',
  props: ['basicResources'],
  data () {
    return {
    }
  },
  mounted() {
    this.$nextTick(() => {
      window.vm.addUITable(this.basicResources, 'basicResources') // Dynamically create the basic resource table.
    })
  },
}
</script>

<style>
#basicResources button {
  text-transform: capitalize;
}
</style>
