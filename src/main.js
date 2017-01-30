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
  template: `
    <App
      :curCiv="curCiv"
      :settings="settings"
      :basicResources="basicResources"
      :homeBuildings="homeBuildings"
      :homeUnits="homeUnits"
      :armyUnits="armyUnits"
      :normalUpgrades="normalUpgrades"
      :civSizes="civSizes"
    />`,
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

        this.tickAutosave()

        // Production workers do their thing.
        this.doFarmers()
        this.doWoodcutters()
        this.doMiners()
        this.doBlacksmiths()
        this.doTanners()
        this.doClerics()

        // Check for starvation
        this.doStarve()
        // xxx Need to kill workers who die from exposure.

        // Resources occasionally go above their caps.
        // Cull the excess /after/ other workers have taken their inputs.
        this.resourceData.forEach((elem) => {
          if (elem.owned > elem.limit) {
            elem.owned = elem.limit
          }
        })

        // Timers - routines that do not occur every second
        this.doMobs()
        this.doPestControl()
        this.tickGlory()
        this.doShades()
        this.doEsiege(this.civData.esiege, this.civData.fortification)
        this.doRaid('party', 'player', 'enemy')

        // Population-related
        this.doGraveyards()
        this.doHealers()
        this.doCorpses()
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
    // Handling raids
    doRaid(place, attackerID, defenderID) { // eslint-disable-line no-unused-vars
      if (!window.vm.curCiv.raid.raiding) {
        return
      } // We're not raiding right now.

      const attackers = window.getCombatants(place, attackerID)
      const defenders = window.getCombatants(place, defenderID)

      if (attackers.length && !defenders.length) { // Win check.
        // Slaughter any losing noncombatant units.
        // xxx Should give throne and corpses for any human ones?
        window.vm.unitData.filter((elem) => ((elem.alignment === defenderID) && (elem.place === place)))
          .forEach((elem) => {
            elem.owned = 0
          })

        if (!window.vm.curCiv.raid.victory) {
          window.gameLog('Raid victorious!')
        } // Notify player on initial win.
        window.vm.curCiv.raid.victory = true // Flag victory for future handling
      }

      if (!attackers.length && defenders.length) { // Loss check.
        // Slaughter any losing noncombatant units.
        // xxx Should give throne and corpses for any human ones?
        window.vm.unitData.filter((elem) => ((elem.alignment === attackerID) && (elem.place === place)))
          .forEach((elem) => {
            elem.owned = 0
          })

        window.gameLog('Raid defeated') // Notify player
        window.resetRaiding()
        return
      }

      // Do the actual combat.
      attackers.forEach((attacker) => {
        defenders.forEach((defender) => {
          window.doFight(attacker, defender)
        }) // FIGHT!
      })

      // Handle siege engines
      window.doSiege(window.vm.civData.siege, window.vm.civData.efort)
    },
    tickAutosave() { // eslint-disable-line no-unused-vars
      if (window.vm.settings.autosave && (++window.vm.settings.autosaveCounter >= window.vm.settings.autosaveTime)) { // eslint-disable-line no-plusplus
        window.vm.settings.autosaveCounter = 0
        // If autosave fails, disable it.
        if (!window.save('auto')) {
          window.vm.settings.autosave = false
        }
      }
    },
    // xxx Need to improve 'net' handling.
    doFarmers() { // eslint-disable-line no-unused-vars
      const specialChance = window.vm.civData.food.specialChance + (0.1 * window.vm.civData.flensing.owned)
      let millMod = 1
      if (window.vm.population.current > 0 || window.vm.curCiv.zombie.owned > 0) {
        millMod = window.vm.population.current / (window.vm.population.current + window.vm.curCiv.zombie.owned)
      }
      window.vm.civData.food.net = window.vm.civData.farmer.owned *
        (1 + (window.vm.civData.farmer.efficiency * window.vm.curCiv.morale.efficiency)) *
        ((window.vm.civData.pestControl.timer > 0) ? 1.01 : 1) * window.getWonderBonus(window.vm.civData.food) *
        (1 + (window.vm.civData.walk.rate / 120)) * (1 + ((window.vm.civData.mill.owned * millMod) / 200)) // Farmers farm food
      window.vm.civData.food.net -= window.vm.population.current // The living window.vm.population eats food.
      window.vm.civData.food.owned += window.vm.civData.food.net
      if (window.vm.civData.skinning.owned && window.vm.civData.farmer.owned > 0) { // and sometimes get skins
        const numSkins = specialChance * (window.vm.civData.food.increment +
          ((window.vm.civData.butchering.owned * window.vm.civData.farmer.owned) / 15.0)) *
            window.getWonderBonus(window.vm.civData.skins)
        window.vm.civData.skins.owned += window.rndRound(numSkins)
      }
    },
    doWoodcutters() { // eslint-disable-line no-unused-vars
      window.vm.civData.wood.net = window.vm.civData.woodcutter.owned *
        (window.vm.civData.woodcutter.efficiency * window.vm.curCiv.morale.efficiency) *
        window.getWonderBonus(window.vm.civData.wood) // Woodcutters cut wood
      window.vm.civData.wood.owned += window.vm.civData.wood.net
      if (window.vm.civData.harvesting.owned && window.vm.civData.woodcutter.owned > 0) { // and sometimes get herbs
        const numHerbs = window.vm.civData.wood.specialChance * (window.vm.civData.wood.increment +
          ((window.vm.civData.gardening.owned * window.vm.civData.woodcutter.owned) / 5.0)) *
            window.getWonderBonus(window.vm.civData.herbs)
        window.vm.civData.herbs.owned += window.rndRound(numHerbs)
      }
    },
    doMiners() { // eslint-disable-line no-unused-vars
      const specialChance = window.vm.civData.stone.specialChance + (window.vm.civData.macerating.owned ? 0.1 : 0)
      window.vm.civData.stone.net = window.vm.civData.miner.owned *
        (window.vm.civData.miner.efficiency * window.vm.curCiv.morale.efficiency) * window.getWonderBonus(window.vm.civData.stone) // Miners mine stone
      window.vm.civData.stone.owned += window.vm.civData.stone.net
      if (window.vm.civData.prospecting.owned && window.vm.civData.miner.owned > 0) { // and sometimes get ore
        const numOre = specialChance * (window.vm.civData.stone.increment +
            ((window.vm.civData.extraction.owned * window.vm.civData.miner.owned) / 5.0)) *
              window.getWonderBonus(window.vm.civData.ore)
        window.vm.civData.ore.owned += window.rndRound(numOre)
      }
    },
    doBlacksmiths() { // eslint-disable-line no-unused-vars
      const numUsed = Math.min(window.vm.civData.ore.owned,
        (window.vm.civData.blacksmith.owned * window.vm.civData.blacksmith.efficiency * window.vm.curCiv.morale.efficiency))
      window.vm.civData.ore.owned -= numUsed
      window.vm.civData.metal.owned += numUsed * window.getWonderBonus(window.vm.civData.metal)
    },
    doTanners() { // eslint-disable-line no-unused-vars
      const numUsed = Math.min(window.vm.civData.skins.owned,
        (window.vm.civData.tanner.owned * window.vm.civData.tanner.efficiency * window.vm.curCiv.morale.efficiency))
      window.vm.civData.skins.owned -= numUsed
      window.vm.civData.leather.owned += numUsed * window.getWonderBonus(window.vm.civData.leather)
    },
    doClerics() { // eslint-disable-line no-unused-vars
      window.vm.civData.piety.owned += window.vm.civData.cleric.owned *
        (window.vm.civData.cleric.efficiency + (window.vm.civData.cleric.efficiency *
          (window.vm.civData.writing.owned))) * (1 + ((window.vm.civData.secrets.owned) *
          (1 - (100 / (window.vm.civData.graveyard.owned + 100))))) * window.vm.curCiv.morale.efficiency *
            window.getWonderBonus(window.vm.civData.piety)
    },
    // Picks the next worker to starve.  Kills the sick first, then the healthy.
    // Deployed military starve last.
    // Return the job ID of the selected target.
    pickStarveTarget() {
      let modNum
      let jobNum
      const modList = ['ill', 'owned'] // The sick starve first
      // xxx Remove this hard-coded list.
      const jobList = ['unemployed', 'blacksmith', 'tanner', 'miner', 'woodcutter',
        'cleric', 'cavalry', 'soldier', 'healer', 'labourer', 'farmer',
      ]

      for (modNum = 0; modNum < modList.length; ++modNum) {
        for (jobNum = 0; jobNum < jobList.length; ++jobNum) {
          if (window.vm.civData[jobList[jobNum]][modList[modNum]] > 0) {
            return window.vm.civData[jobList[jobNum]]
          }
        }
      }
      // These don't have Ill variants at the moment.
      if (window.vm.civData.cavalryParty.owned > 0) {
        return window.vm.civData.cavalryParty
      }
      if (window.vm.civData.soldierParty.owned > 0) {
        return window.vm.civData.soldierParty
      }

      return null
    },
    // Culls workers when they starve.
    starve(numArg) {
      let targetObj
      let i
      let num = (numArg === undefined) ? 1 : numArg
      num = Math.min(num, window.vm.population.current)

      for (i = 0; i < num; ++i) {
        targetObj = this.pickStarveTarget()
        if (!targetObj) {
          return i
        }

        if (targetObj.ill) {
          targetObj.ill -= 1
        }
        else {
          targetObj.owned -= 1
        }
        window.updatePopulation()

        window.vm.civData.corpses.owned += 1 // Increments corpse number
        // Workers dying may trigger Book of the Dead
        if (window.vm.civData.book.owned) {
          window.vm.civData.piety.owned += 10
        }
      }

      return num
    },
    doStarve() { // eslint-disable-line no-unused-vars
      let corpsesEaten
      let numStarve
      if (window.vm.civData.food.owned < 0 && window.vm.civData.waste.owned) { // Workers eat corpses if needed
        corpsesEaten = Math.min(window.vm.civData.corpses.owned, -window.vm.civData.food.owned)
        window.vm.civData.corpses.owned -= corpsesEaten
        window.vm.civData.food.owned += corpsesEaten
      }

      if (window.vm.civData.food.owned < 0) { // starve if there's not enough food.
        // xxx This is very kind.  Only 0.1% deaths no matter how big the shortage?
        numStarve = this.starve(Math.ceil(window.vm.population.current / 1000))
        if (numStarve === 1) {
          window.gameLog('A worker starved to death')
        }
        if (numStarve > 1) {
          window.gameLog(`${window.prettify(numStarve)} workers starved to death`)
        }
        window.adjustMorale(-0.01)
        window.vm.civData.food.owned = 0
      }
    },
    spawnMob(mobObj, numArg) {
      let num = numArg
      let numSge = 0
      let msg = ''

      if (num === undefined) { // By default, base numbers on current window.vm.population
        const maxMob = ((window.vm.population.current + window.vm.curCiv.zombie.owned) / 50)
        num = Math.ceil(maxMob * Math.random())
      }

      if (num === 0) {
        return num
      } // Nobody came

      // Human mobs might bring siege engines.
      if (mobObj.species === 'human') {
        numSge = Math.floor((Math.random() * num) / 100)
      }

      mobObj.owned += num
      window.vm.civData.esiege.owned += numSge

      msg = `${window.prettify(num)} ${mobObj.getQtyName(num)} attacked` // xxx L10N
      if (numSge > 0) {
        msg += `, with ${window.prettify(numSge)} ${window.vm.civData.esiege.getQtyName(numSge)}`
      } // xxx L10N
      window.gameLog(msg)

      return num
    },
    // Some attackers get a damage mod against some defenders
    getCasualtyMod(attacker, defender) {
      // Cavalry take 50% more casualties vs infantry
      if ((defender.combatType === 'cavalry') && (attacker.combatType === 'infantry')) {
        return 1.50
      }

      return 1.0 // Otherwise no modifier
    },
    doFight(attacker, defender) {
      if ((attacker.owned <= 0) || (defender.owned <= 0)) {
        return
      }

      // Defenses vary depending on whether the player is attacking or defending.
      const fortMod = (defender.alignment === 'player' ?
        (window.vm.civData.fortification.owned * window.vm.civData.fortification.efficiency) :
        (window.vm.civData.efort.owned * window.vm.civData.efort.efficiency))
      const palisadeMod = ((defender.alignment === 'player') &&
        (window.vm.civData.palisade.owned)) * window.vm.civData.palisade.efficiency

      // Determine casualties on each side.  Round fractional casualties
      // probabilistically, and don't inflict more than 100% casualties.
      const attackerCas = Math.min(attacker.owned,
        window.rndRound(this.getCasualtyMod(defender, attacker) * defender.owned * defender.efficiency))
      const defenderCas = Math.min(defender.owned,
        window.rndRound(this.getCasualtyMod(attacker, defender) * attacker.owned *
          (attacker.efficiency - palisadeMod) * Math.max(1 - fortMod, 0)))

      attacker.owned -= attackerCas
      defender.owned -= defenderCas

      // Give player credit for kills.
      const playerCredit = ((attacker.alignment === 'player') ? defenderCas : // eslint-disable-line no-nested-ternary
        (defender.alignment === 'player') ? attackerCas : 0)

      // Increments enemies slain, corpses, and piety
      window.vm.curCiv.enemySlain.owned += playerCredit
      if (window.vm.civData.throne.owned) {
        window.vm.civData.throne.count += playerCredit
      }
      window.vm.civData.corpses.owned += (attackerCas + defenderCas)
      if (window.vm.civData.book.owned) {
        window.vm.civData.piety.owned += (attackerCas + defenderCas) * 10
      }

      // Updates window.vm.population figures (including total window.vm.population)
      window.updatePopulation()
    },
    doMobs() { // eslint-disable-line no-unused-vars
      // Checks when mobs will attack
      // xxx Perhaps this should go after the mobs attack, so we give 1 turn's warning?
      let mobType
      let choose
      if (window.vm.population.current + window.vm.curCiv.zombie.owned > 0) {
        window.vm.curCiv.attackCounter += 1
      } // No attacks if deserted.
      if (window.vm.population.current + window.vm.curCiv.zombie.owned > 0 && window.vm.curCiv.attackCounter > (60 * 5)) { // Minimum 5 minutes
        if (600 * Math.random() < 1) {
          window.vm.curCiv.attackCounter = 0
          // Choose which kind of mob will attack
          mobType = 'wolf' // Default to wolves
          if (window.vm.population.current + window.vm.curCiv.zombie.owned >= 10000) {
            choose = Math.random()
            if (choose > 0.5) {
              mobType = 'barbarian'
            }
            else if (choose > 0.2) {
              mobType = 'bandit'
            }
          }
          else if (window.vm.population.current + window.vm.curCiv.zombie.owned >= 1000) {
            if (Math.random() > 0.5) {
              mobType = 'bandit'
            }
          }
          this.spawnMob(window.vm.civData[mobType])
        }
      }

      // Handling mob attacks
      window.getCombatants('home', 'enemy').forEach((attacker) => {
        if (attacker.owned <= 0) {
          return
        } // In case the last one was killed in an earlier iteration.

        const defenders = window.getCombatants(attacker.place, 'player')
        if (!defenders.length) {
          attacker.onWin()
          return
        } // Undefended

        defenders.forEach((defender) => {
          this.doFight(attacker, defender)
        }) // FIGHT!
      })
    },
    doPestControl() { // eslint-disable-line no-unused-vars
      // Decrements the pestControl Timer
      if (window.vm.civData.pestControl.timer > 0) {
        window.vm.civData.pestControl.timer -= 1
      }
    },
    tickGlory() { // eslint-disable-line no-unused-vars
      // Handles the Glory bonus
      if (window.vm.civData.glory.timer > 0) {
        document.getElementById('gloryTimer').innerHTML = window.vm.civData.glory.timer-- // eslint-disable-line no-plusplus
      }
      else {
        document.getElementById('gloryGroup').style.display = 'none'
      }
    },
    doShades() { // eslint-disable-line no-unused-vars
      const defender = window.vm.civData.shade
      if (defender.owned <= 0) {
        return
      }

      // Attack each enemy in turn.
      window.getCombatants(defender.place, 'enemy').forEach((attacker) => {
        const num = Math.floor(Math.min((attacker.owned / 4), defender.owned))
        // xxx Should we give book and throne credit here?
        defender.owned -= num
        attacker.owned -= num
      })

      // Shades fade away even if not killed.
      defender.owned = Math.max(Math.floor(defender.owned * 0.95), 0)
    },
    // Process siege engine attack.
    // Returns the number of hits.
    doSiege(siegeObj, targetObj) {
      let i
      let hit
      let hits = 0
      // Only half can fire every round due to reloading time.
      // We also allow no more than 2 per defending fortification.
      const firing = Math.ceil(Math.min(siegeObj.owned / 2, targetObj.owned * 2))
      for (i = 0; i < firing; ++i) {
        hit = Math.random()
        if (hit > 0.95) {
          siegeObj.owned -= 1
        } // misfire; destroys itself
        if (hit >= siegeObj.efficiency) {
          continue
        } // miss
        hits += 1 // hit
        if (--targetObj.owned <= 0) { // eslint-disable-line no-plusplus
          break
        }
      }

      return hits
    },
    // Deals with potentially capturing enemy siege engines.
    doEsiege(siegeObj, targetObj) { // eslint-disable-line no-unused-vars
      if (siegeObj.owned <= 0) {
        return
      }

      // First check there are enemies there defending them
      if (!window.getCombatants(siegeObj.place, siegeObj.alignment).length &&
        window.getCombatants(targetObj.place, targetObj.alignment).length) {
        // the siege engines are undefended; maybe capture them.
        if ((targetObj.alignment === 'player') && window.vm.civData.mathematics.owned) { // Can we use them?
          window.gameLog(`Captured ${window.prettify(siegeObj.owned)} enemy siege engines.`)
          window.vm.civData.siege.owned += siegeObj.owned // capture them
        }
        siegeObj.owned = 0
      }
      else if (this.doSiege(siegeObj, targetObj) > 0) {
        if (targetObj.id === 'fortification') {
          window.updateRequirements(targetObj)
          window.gameLog('Enemy siege engine damaged our fortifications')
        }
      }
    },
    doGraveyards() { // eslint-disable-line no-unused-vars
      let i
      if (window.vm.civData.corpses.owned > 0 && window.vm.curCiv.grave.owned > 0) {
        // Clerics will bury corpses if there are graves to fill and corpses lying around
        for (i = 0; i < window.vm.civData.cleric.owned; i++) {
          if (window.vm.civData.corpses.owned > 0 && window.vm.curCiv.grave.owned > 0) {
            window.vm.civData.corpses.owned -= 1
            window.vm.curCiv.grave.owned -= 1
          }
        }
        window.updatePopulationUI()
      }
    },
    // Select a sick worker type to cure, with certain priorities
    getNextPatient() {
      let i
      // xxx Need to generalize this list.
      const jobs = ['healer', 'cleric', 'farmer', 'soldier', 'cavalry', 'labourer',
        'woodcutter', 'miner', 'tanner', 'blacksmith', 'unemployed',
      ]
      for (i = 0; i < jobs.length; ++i) {
        if (window.vm.civData[jobs[i]].ill > 0) {
          return jobs[i]
        }
      }

      return ''
    },
    // Try to heal the specified number of people in the specified job
    // Makes them sick if the number is negative.
    heal(job, numArg) {
      if (!window.isValid(job) || !job) {
        return 0
      }
      let num = (numArg === undefined) ? 1 : numArg

      num = Math.min(num, window.vm.civData[job].ill)
      num = Math.max(num, -window.vm.civData[job].owned)
      window.vm.civData[job].ill -= num
      window.vm.population.totalSick -= num
      window.vm.civData[job].owned += num
      window.vm.population.healthy += num

      return num
    },
    doHealers() { // eslint-disable-line no-unused-vars
      let job
      let numHealed = 0
      const numHealers = window.vm.civData.healer.owned + (window.vm.civData.cat.owned * (window.vm.civData.companion.owned))

      // How much healing can we do?
      window.vm.civData.healer.cureCount += (numHealers * window.vm.civData.healer.efficiency * window.vm.curCiv.morale.efficiency)

      // We can't cure more sick people than there are
      window.vm.civData.healer.cureCount = Math.min(window.vm.civData.healer.cureCount, window.vm.population.totalSick)

      // Cure people until we run out of healing capacity or herbs
      while (window.vm.civData.healer.cureCount >= 1 && window.vm.civData.herbs.owned >= 1) {
        job = this.getNextPatient()
        if (!job) {
          break
        }
        this.heal(job)
        window.vm.civData.healer.cureCount -= 1
        window.vm.civData.herbs.owned -= 1
        numHealed += 1
      }

      return numHealed
    },
    // Selects random workers, transfers them to their Ill variants
    plague(sickNum) {
      let actualNum = 0
      let i

      window.updatePopulation()
      // Apply in 1-worker groups to spread it out.
      for (i = 0; i < sickNum; i++) {
        actualNum += -this.heal(window.randomHealthyWorker(), -1)
      }

      return actualNum
    },
    doCorpses() { // eslint-disable-line no-unused-vars
      if (window.vm.civData.corpses.owned <= 0) {
        return
      }

      // Corpses lying around will occasionally make people sick.
      // 1-in-50 chance (1-in-100 with feast)
      const sickChance = 50 * Math.random() * (1 + window.vm.civData.feast.owned)
      if (sickChance >= 1) {
        return
      }

      // Infect up to 1% of the window.vm.population.
      let num = Math.floor((window.vm.population.current / 100) * Math.random())
      if (num <= 0) {
        return
      }

      num = this.plague(num)
      if (num > 0) {
        window.updatePopulation()
        window.gameLog(`${window.prettify(num)} workers got sick`) // notify player
      }
    },


  },
})
