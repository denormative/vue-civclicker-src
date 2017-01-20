<template>
  <div class="basic-resources">
    <div id="basicResourcesContainer">
      <h3>Basic Resources</h3>
      <table id="basicResources"></table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'basic-resources',
  data () {
    return {
    }
  }
}
</script>

<style>
#basicResources button {
  text-transform: capitalize;
}

#basicResources {
  margin-left: 0.3em;
}

#basicResources button {
  padding: 0.3em;
}
</style>
