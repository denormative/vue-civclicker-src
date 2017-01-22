<template>
  <div class="stats-pane card">
    <h4 class="card-header">Stats</h4>
    <div class="card-block">
      <table class="table-sm">
        <tbody>
          <tr>
            <th scope="row">Resource clicks</th>
            <td><span id="clicks">0</span></td>
          </tr>
          <tr>
            <th scope="row">Total Land</th>
            <td><span id="totalLand">1000</span></td>
          </tr>
          <tr>
            <th scope="row">Total Buildings</th>
            <td><span id="totalBuildings">0</span></td>
          </tr>
          <tr>
            <th scope="row">Enemies Slain</th>
            <td><span data-action="display" data-target="enemySlain">0</span></td>
          </tr>
          <tr>
            <th scope="row">Unburied Corpses</th>
            <td><span data-action="display" data-target="corpses">0</span></td>
          </tr>
          <tr id="graveTotal">
            <th scope="row">Unfilled Graves</th>
            <td><span data-action="display" data-target="grave">0</span></td>
          </tr>
          <tr id="walkGroup">
            <th scope="row">Walk</th>
            <td><span id="walkStat">0</span> workers per second</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'stats-pane',
  props: ['curCiv'],
  data () {
    return {
    }
  }
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
