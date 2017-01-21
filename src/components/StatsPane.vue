<template>
  <div class="stats-pane">
    <div id="statsContainer">
      <h3>Stats</h3> Resource clicks: <span id="clicks">0</span><br> Total Land: <span id="totalLand">1000</span><br> Total Buildings: <span id="totalBuildings">0</span><br> Enemies Slain: <span data-action="display" data-target="enemySlain">0</span><br> Unburied
      Corpses: <span data-action="display" data-target="corpses">0</span><br>
      <span id="graveTotal">Unfilled Graves: <span data-action="display" data-target="grave">0</span><br>
      </span>
      <span id="walkGroup"><br>Walk: <span id="walkStat">0</span> workers per second<br></span>
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
