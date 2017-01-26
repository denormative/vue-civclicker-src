<template>
<div role="tabpanel" id="statsPane" class="stats-pane tab-pane card">
  <h4 class="card-header">Stats</h4>
  <div class="card-block">
    <table class="table-sm">
      <tbody>
        <tr>
          <th scope="row">Resource clicks</th>
          <td class="number">{{curCiv.resourceClicks | prettyint(settings)}}</td>
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
        <tr>
          <th scope="row">Unburied Corpses</th>
          <td class="number"><span data-action="display" data-target="corpses">0</span></td>
        </tr>
        <tr id="graveTotal">
          <th scope="row">Unfilled Graves</th>
          <td class="number"><span data-action="display" data-target="grave">0</span></td>
        </tr>
        <tr id="walkGroup">
          <th scope="row">Walk</th>
          <td class="number"><span id="walkStat">0</span> workers per second</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
</template>

<script>
export default {
  name: 'stats-pane',
  props: ['curCiv', 'settings'],
  data() {
    return {}
  },
  filters: {
    prettyify(v) {
      return (this.settings.delimiters) ? Number(v).toLocaleString() : v.toString()
    },
    prettyint(v, settings) {
      const vv = Math.round(v)
      return (settings.delimiters) ? Number(vv).toLocaleString() : vv.toString()
    },
  },
}
</script>

<style>
#graveTotal {
  display: none;
}

#walkGroup {
  display: none;
}
</style>
