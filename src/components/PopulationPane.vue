<template>
<div class="population-pane card">
  <h4 class="card-header" v-show="settings.showHeaders">Population</h4>
  <div class="card-block">
    <div class="row">
      <div class="col">
        <table class="table-sm">
          <tr>
            <th scope="row">Current Population: </th>
            <td class="number">{{population.current | prettyint}}</td>
          </tr>
          <tr>
            <th scope="row">Maximum Population: </th>
            <td class="number">{{population.limit | prettyint}}</td>
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
    <button class="unit1 btn btn-secondary btn-sm" id="spawn1button" onmousedown="spawn(1)" disabled="disabled" data-toggle="popover" :data-content="workerCostInfo(1)">
      Recruit Worker
    </button>
    <button class="unit10 btn btn-secondary btn-sm" id="spawn10button" onmousedown="spawn(10)" disabled="disabled" data-toggle="popover" :data-content="workerCostInfo(10)">
      Recruit 10 Workers
    </button>
    <button class="unit100 btn btn-secondary btn-sm" id="spawn100button" onmousedown="spawn(100)" disabled="disabled" data-toggle="popover" :data-content="workerCostInfo(100)">
      Recruit 100 Workers
    </button>
    <button class="unit1000 btn btn-secondary btn-sm" id="spawn1000button" onmousedown="spawn(1000)" disabled="disabled" data-toggle="popover" :data-content="workerCostInfo(1000)">
      Recruit 1000 Workers
    </button>
    <button class="unit10000 btn btn-secondary btn-sm" id="spawn10000button" onmousedown="spawn(10000)" disabled="disabled" data-toggle="popover" :data-content="workerCostInfo(10000)">
      Recruit 10000 Workers
    </button>
    <button class="unitInfinity btn btn-secondary btn-sm" id="spawnMaxbutton" onmousedown="spawn(Infinity)">
      Recruit <span id="workerNumMax">Max</span> Workers
    </button>
    <span class="cost"><span id="workerCostMax"></span> food</span>
    <span class="note">: Recruit as many new workers as possible</span>
    <div v-show="settings.customIncr">
      <button class="btn btn-secondary btn-sm" id="spawnCustomButton" onmousedown="spawn('custom')">Recruit Workers</button>
      <input id="spawnCustomQty" type="number" min="1" step="1" value="1" />
    </div>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex'
// import { mapGetters } from 'vuex'
import { prettyint } from '../helpers'

export default {
  name: 'population-pane',
  data() {
    return {}
  },
  created() {
    this.$nextTick(() => {
      window.$('[data-toggle="popover"]').popover({
        trigger:   'hover',
        placement: 'top',
        html:      true,
      })
    })
  },
  mounted() {
    this.$nextTick(() => {})
  },
  computed: {
    ...mapState(['settings', 'population']),
    // ...mapGetters([
    //   '',
    // ]}
    workerCostInfo() {
      return function(numWorkers) { // eslint-disable-line
        const msg = (numWorkers === 1) ? 'Recruit a new worker' : `Recruit ${numWorkers} new workers`

        return `<b>${prettyint(window.calcWorkerCost(numWorkers))} food</b><br>${msg}`
      }
    },
  },
  filters: {
    prettyint,
  },
}
</script>

<style>
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
