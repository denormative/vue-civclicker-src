<template>
<div class="current-deity-pane card" v-show="hasDeity">
  <h4 class="card-header">Current Deity</h4>
  <div class="card-block">
    <table id="activeDeity">
      <tr>
        <td></td>
      </tr>
    </table>
  </div>
</div>
</template>

<script>
export default {
  name: 'current-deity-pane',
  props: ['curCiv'],
  data() {
    return {}
  },
  computed: {
    hasDeity() {
      return this.curCiv.deities[0].name
    },
  },
}
</script>

<style scoped>

</style>
