// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import store from './vuex/store'
import App from './App'

/* eslint-disable no-new */
new Vue({
  store,
  el: '#app',
  template: '<App :curCiv="curCiv" :settings="settings" :basicResources="basicResources" :homeBuildings="homeBuildings" :homeUnits="homeUnits" :armyUnits="armyUnits" :normalUpgrades="normalUpgrades"/>', // eslint-disable-line max-len
  data() {
    return {
      version: 0, // This is an ordinal used to trigger reloads.
      versionData: {},
      saveTag: '',
      saveTag2: '', // For old saves.
      saveSettingsTag: '',
      logRepeat: 0,
      civSizes: [],
      curCiv: {},
      population: {},
      // Caches the total number of each wonder, so that we don't have to recount repeatedly.
      wonderCount: {},
      settings: {},
      civData: [],
      // Build a variety of additional indices so that we can iterate over specific
      // subsets of our civ objects.
      resourceData: [], // All resources
      buildingData: [], // All buildings
      upgradeData: [], // All upgrades
      powerData: [], // All 'powers' //xxx This needs refinement.
      unitData: [], // All units
      achData: [], // All achievements
      sackable: [], // All buildings that can be destroyed
      lootable: [], // All resources that can be stolen
      killable: [], // All units that can be destroyed
      homeBuildings: [], // All buildings to be displayed in the home area
      homeUnits: [], // All units to be displayed in the home area
      armyUnits: [], // All units to be displayed in the army area
      basicResources: [], // All basic (click-to-get) resources
      normalUpgrades: [], // All upgrades to be listed in the normal upgrades area
      wonderResources: [],
      body: {},

    }
  },
  created() {
    window.vm = this
    window.preLoad()
  },
  mounted() {
    this.$nextTick(() => {
      this.postLoad()
    })
  },
  components: {
    App,
  },
  methods: {
    postLoad() { // eslint-disable-line no-unused-vars
      window.initCivclicker()

      // This sets up the main game loop, which is scheduled to execute once per second.
      window.setInterval(() => {
        // debugging - mark beginning of loop execution
        // var start = new Date().getTime();

        window.tickAutosave()

        // Production workers do their thing.
        window.doFarmers()
        window.doWoodcutters()
        window.doMiners()
        window.doBlacksmiths()
        window.doTanners()
        window.doClerics()

        // Check for starvation
        window.doStarve()
        // xxx Need to kill workers who die from exposure.

        // Resources occasionally go above their caps.
        // Cull the excess /after/ other workers have taken their inputs.
        window.vm.resourceData.forEach((elem) => {
          if (elem.owned > elem.limit) {
            elem.owned = elem.limit
          }
        })

        // Timers - routines that do not occur every second
        window.doMobs()
        window.doPestControl()
        window.tickGlory()
        window.doShades()
        window.doEsiege(window.vm.civData.esiege, window.vm.civData.fortification)
        window.doRaid('party', 'player', 'enemy')

        // Population-related
        window.doGraveyards()
        window.doHealers()
        window.doCorpses()
        window.doThrone()
        window.tickGrace()
        window.tickWalk()
        window.doLabourers()
        window.tickTraders()

        window.updateResourceTotals() // This is the point where the page is updated with new resource totals
        window.testAchievements()

        // Data changes should be done; now update the UI.
        window.updateUpgrades()
        window.updateResourceRows() // Update resource display
        window.updateBuildingButtons()
        window.updateJobButtons()
        window.updatePartyButtons()
        window.updatePopulationUI()
        window.updateTargets()
        window.updateDevotion()
        window.updateWonder()
        window.updateReset()

        // Debugging - mark end of main loop and calculate delta in milliseconds
        // var end = new Date().getTime();
        // var time = end - start;
        // console.log("Main loop execution time: " + time + "ms");
      }, 1000) // updates once per second (1000 milliseconds)
    },
  },
})
