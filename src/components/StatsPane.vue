<template>
<div role="tabpanel" id="statsPane" class="stats-pane tab-pane card">
  <h4 class="card-header">Stats</h4>
  <div class="card-block">
    <table class="table-sm">
      <tbody>
        <tr>
          <th scope="row">Resource clicks</th>
          <td class="number">{{curCiv.resourceClicks | prettyint}}</td>
        </tr>
        <tr>
          <th scope="row">Total Land</th>
          <td class="number"><span id="totalLand">1000</span></td>
        </tr>
        <tr>
          <th scope="row">Total Buildings</th>
          <td class="number"><span id="totalBuildings">0</span></td>
        </tr>
        <tr>
          <th scope="row">Enemies Slain</th>
          <td class="number"><span data-action="display" data-target="enemySlain">0</span></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex'
import { prettyint } from '../helpers'

export default {
  name: 'stats-pane',
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {})
  },
  computed: {
    ...mapState(['curCiv']),
  },
  filters: {
    prettyint,
  },
}
</script>

<style>

</style>
