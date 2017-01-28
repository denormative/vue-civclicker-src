<template>
<div class="population-pane card">
  <h4 class="card-header">Population</h4>
  <div class="card-block">
    <div class="row">
      <div class="col">
        <table class="table-sm">
          <tr>
            <th scope="row">Current Population: </th>
            <td class="number"><span data-action="display_pop" data-target="current">0</span></td>
          </tr>
          <tr>
            <th scope="row">Maximum Population: </th>
            <td class="number"><span data-action="display_pop" data-target="limit">0</span></td>
          </tr>
          <tr id="zombieWorkers">
            <th scope="row">Zombies: </th>
            <td class="number"><span data-action="display" data-target="zombie">0</span></td>
          </tr>
          <tr>
            <th scope="row">Happiness: </th>
            <td><span id="morale">Content</span></td>
          </tr>
        </table>
      </div>
      <div class="col">
        <table class="table-sm">
          <tbody>
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
    <div id="populationCreate">
      <div class="unit1"><button class="btn btn-secondary btn-sm" id="spawn1button" onmousedown="spawn(1)" disabled="disabled">Recruit Worker</button><span
          class="cost"><span id="workerCost">20</span> food</span><span class="note">: Recruit a new worker</span><br></div>
      <div class="unit10"><button class="btn btn-secondary btn-sm" id="spawn10button" onmousedown="spawn(10)">Recruit 10 Workers</button><span class="cost"><span id="workerCost10">200</span>        food</span><span class="note">: Recruit 10 new workers</span></div>
      <div class="unit100"><button class="btn btn-secondary btn-sm" id="spawn100button" onmousedown="spawn(100)">Recruit 100 Workers</button><span class="cost"><span id="workerCost100">2000</span>        food</span><span class="note">: Recruit 100 new workers</span></div>
      <div class="unit1000"><button class="btn btn-secondary btn-sm" id="spawn1000button" onmousedown="spawn(1000)">Recruit 1000 Workers</button><span class="cost"><span id="workerCost1000">20000</span>        food</span><span class="note">: Recruit 1000 new workers</span></div>
      <div class="unitInfinity"><button class="btn btn-secondary btn-sm" id="spawnMaxbutton" onmousedown="spawn(Infinity)">Recruit <span id="workerNumMax">Max</span> Workers</button><span
          class="cost"><span id="workerCostMax"></span> food</span><span class="note">: Recruit as many new workers as possible</span></div>
      <div id="customSpawnQuantity"><button class="btn btn-secondary btn-sm" id="spawnCustomButton" onmousedown="spawn('custom')">Recruit Workers</button><input id="spawnCustomQty"
          type="number" min="1" step="1" value="1" />
      </div>
    </div>
  </div>
</div>
</template>

<script>
export default {
  name: 'population-pane',
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {})
  },
}
</script>

<style>
#customSpawnQuantity {
  display: none;
}

#zombieWorkers {
  display: none;
}

#morale {
  color: #0d0;
}

#graveTotal {
  display: none;
}

#walkGroup {
  display: none;
}
</style>
