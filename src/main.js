// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import store from './vuex/store'
import App from './App'

/* global VersionData indexArrayByAttr civDataTable CivObj */
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
    this.preLoad()
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
    preLoad() { // eslint-disable-line no-unused-vars
      this.version = 19 // This is an ordinal used to trigger reloads.

      this.versionData = new VersionData(1, 1, 59, 'alpha')

      this.saveTag = 'civ'
      this.saveTag2 = `${this.saveTag}2` // For old saves.
      this.saveSettingsTag = 'civSettings'
      this.logRepeat = 1

      // Civ size category minimums
      /* beautify preserve:start */
      this.civSizes = [
        { min_pop: 0, name: 'Thorp', id: 'thorp' },
        { min_pop: 20, name: 'Hamlet', id: 'hamlet' },
        { min_pop: 60, name: 'Village', id: 'village' },
        { min_pop: 200, name: 'Small Town', id: 'smallTown' },
        // xxx This is a really big jump.  Reduce it.
        { min_pop: 2000, name: 'Large Town', id: 'largeTown' },
        { min_pop: 5000, name: 'Small City', id: 'smallCity' },
        { min_pop: 10000, name: 'Large City', id: 'largeCity' },
        { min_pop: 20000, name: 'Metro&shy;polis', id: 'metropolis' },
        { min_pop: 50000, name: 'Small Nation', id: 'smallNation' },
        { min_pop: 100000, name: 'Nation', id: 'nation' },
        { min_pop: 200000, name: 'Large Nation', id: 'largeNation' },
        { min_pop: 500000, name: 'Empire', id: 'empire' },
      ]
      /* beautify preserve:end */
      indexArrayByAttr(this.civSizes, 'id')

      // Annotate with max this.population and index.
      this.civSizes.forEach((elem, i, arr) => {
        elem.max_pop = (i + 1 < arr.length) ? (arr[i + 1].min_pop - 1) : Infinity
        elem.idx = i
      })

      this.civSizes.getCivSize = function(popcnt) { // eslint-disable-line func-names
        let i
        for (i = 0; i < this.length; ++i) {
          if (popcnt <= this[i].max_pop) {
            return this[i]
          }
        }
        return this[0]
      }

      // Declare variables here so they can be referenced later.
      this.curCiv = {
        civName: 'Woodstock',
        rulerName: 'Orteil',

        zombie: {
          owned: 0,
        },
        grave: {
          owned: 0,
        },
        enemySlain: {
          owned: 0,
        },
        morale: {
          mod: 1.0,
        },

        resourceClicks: 0, // For NeverClick
        attackCounter: 0, // How long since last attack?

        trader: {
          materialId: '',
          requested: 0,
          timer: 0,
          counter: 0, // How long since last trader?
        },

        raid: {
          raiding: false, // Are we in a raid right now?
          victory: false, // Are we in a "raid succeeded" (Plunder-enabled) state right now?
          epop: 0, // Population of enemy we're raiding.
          plunderLoot: {}, // Loot we get if we win.
          last: '',
          targetMax: this.civSizes[0].id, // Largest target allowed
        },

        curWonder: {
          name: '',
          stage: 0, // 0 = Not started, 1 = Building, 2 = Built, awaiting selection, 3 = Finished.
          progress: 0, // Percentage completed.
          rushed: false,
        },
        wonders: [], // Array of {name: name, resourceId: resourceId} for all wonders.

        // Known deities.  The 0th element is the current game's deity.
        // If the name is "", no deity has been created (can also check for worship upgrade)
        // If the name is populated but the domain is not, the domain has not been selected.
        deities: [{
          name: '',
          domain: '',
          maxDev: 0,
        }], // array of { name, domain, maxDev }

        // xxx We're still accessing many of the properties put here by this.civData
        // elements without going through the this.civData accessors.  That should
        // change.
      }

      // These are not saved, but we need them up here for the asset data to init properly.
      this.population = {
        current: 0,
        limit: 0,
        healthy: 0,
        totalSick: 0,
      }

      // These are settings that should probably be tied to the browser.
      this.settings = {
        autosave: true,
        autosaveCounter: 1,
        autosaveTime: 60, // Currently autosave is every minute. Might change to 5 mins in future.
        customIncr: false,
        fontSize: 1.0,
        delimiters: true,
        textShadow: false,
        notes: true,
        worksafe: false,
        useIcons: true,
      }

      // Initialize Data
      this.civData = civDataTable()

      this.civData.forEach((elem) => {
        if (!(elem instanceof CivObj)) {
          return
        } // Unknown type
        if (elem.type === 'resource') {
          this.resourceData.push(elem)
          if (elem.vulnerable === true) {
            this.lootable.push(elem)
          }
          if (elem.subType === 'basic') {
            this.basicResources.push(elem)
          }
        }
        if (elem.type === 'building') {
          this.buildingData.push(elem)
          if (elem.vulnerable === true) {
            this.sackable.push(elem)
          }
          if (elem.subType === 'normal' || elem.subType === 'land') {
            this.homeBuildings.push(elem)
          }
        }
        if (elem.subType === 'prayer') {
          this.powerData.push(elem)
        }
        else if (elem.type === 'upgrade') {
          this.upgradeData.push(elem)
          if (elem.subType === 'upgrade') {
            this.normalUpgrades.push(elem)
          }
        }
        if (elem.type === 'unit') {
          this.unitData.push(elem)
          if (elem.vulnerable === true) {
            this.killable.push(elem)
          }
          if (elem.place === 'home') {
            this.homeUnits.push(elem)
          }
          if (elem.place === 'party') {
            this.armyUnits.push(elem)
          }
        }
        if (elem.type === 'achievement') {
          this.achData.push(elem)
        }
      })

      // The resources that Wonders consume, and can give bonuses for.
      this.wonderResources = [
        this.civData.food,
        this.civData.wood,
        this.civData.stone,
        this.civData.skins,
        this.civData.herbs,
        this.civData.ore,
        this.civData.leather,
        this.civData.metal,
        this.civData.piety,
      ]
    },
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
        this.resourceData.forEach((elem) => {
          if (elem.owned > elem.limit) {
            elem.owned = elem.limit
          }
        })

        // Timers - routines that do not occur every second
        window.doMobs()
        window.doPestControl()
        window.tickGlory()
        window.doShades()
        window.doEsiege(this.civData.esiege, this.civData.fortification)
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
