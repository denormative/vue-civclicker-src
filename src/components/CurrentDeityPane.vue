<template>
<div class="current-deity-pane card" v-show="hasDeity">
  <h4 class="card-header" v-show="settings.showHeaders">Current Deity</h4>
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
import { mapState } from 'vuex'

export default {
  name: 'current-deity-pane',
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {})
  },
  computed: {
    ...mapState(['settings', 'curCiv']),
    hasDeity() {
      return this.curCiv.deities[0].name
    },
  },
}
</script>

<style scoped>

</style>
