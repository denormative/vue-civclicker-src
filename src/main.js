// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import { mapState } from 'vuex'
import store from './vuex/store'
import App from './App'

import tradeItems from './csv/tradeItems.csv'
// Civ size category minimums
// Really big jump between smallTown and largeTown.  Reduce it.
import civSizes from './csv/civSizes.csv'

/* global VersionData indexArrayByAttr civDataTable CivObj */
/* eslint-disable no-new */
new Vue({
  store,
  el:       '#app',
  template: `
    <App
      :basicResources="basicResources"
      :homeBuildings="homeBuildings"
      :homeUnits="homeUnits"
      :armyUnits="armyUnits"
      :normalUpgrades="normalUpgrades"
      :achData="achData"
      :civData="civData"
    />`,
  data() {
    return {
      saveTag:         '',
      saveTag2:        '', // For old saves.
      saveSettingsTag: '',
      logRepeat:       0,
      civData:         [],
      // Build a variety of additional indices so that we can iterate over specific
      // subsets of our civ objects.
      resourceData:    [], // All resources
      buildingData:    [], // All buildings
      upgradeData:     [], // All upgrades
      powerData:       [], // All 'powers' //xxx This needs refinement.
      unitData:        [], // All units
      achData:         [], // All achievements
      sackable:        [], // All buildings that can be destroyed
      lootable:        [], // All resources that can be stolen
      killable:        [], // All units that can be destroyed
      homeBuildings:   [], // All buildings to be displayed in the home area
      homeUnits:       [], // All units to be displayed in the home area
      armyUnits:       [], // All units to be displayed in the army area
      basicResources:  [], // All basic (click-to-get) resources
      normalUpgrades:  [], // All upgrades to be listed in the normal upgrades area
      wonderResources: [],
    }
  },
  beforeCreate() {
    this.$store.commit('populate', {
      tradeItems,
      civSizes,
    })
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
  computed: {
    ...mapState(['curCiv']),
  },
  methods: {
    preLoad() {
      this.saveTag = 'civ'
      this.saveTag2 = `${this.saveTag}2` // For old saves.
      this.saveSettingsTag = 'civSettings'
      this.logRepeat = 1

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
    postLoad() {
      window.makeDeitiesTables()

      if (!window.load('localStorage')) { // immediately attempts to load
        // Prompt player for names
        window.renameCiv()
        window.renameRuler()
      }

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
        this.doThrone()
        this.tickGrace()
        this.tickWalk()
        this.doLabourers()
        this.tickTraders()

        window.updateResourceTotals() // This is the point where the page is updated with new resource totals
        this.testAchievements()

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
    doRaid(place, attackerID, defenderID) {
      if (!this.curCiv.raid.raiding) {
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

        if (!this.curCiv.raid.victory) {
          window.gameLog('Raid victorious!')
        } // Notify player on initial win.
        this.curCiv.raid.victory = true // Flag victory for future handling
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
          this.doFight(attacker, defender)
        }) // FIGHT!
      })

      // Handle siege engines
      this.doSiege(window.vm.civData.siege, window.vm.civData.efort)
    },
    tickAutosave() {
      if (this.$store.state.settings.autosave &&
        (this.$store.state.settings.autosaveCounter >= this.$store.state.settings.autosaveTime)) {
        this.$store.commit('resetAutosaveCounter')
        // If autosave fails, disable it.
        if (!window.save('auto')) {
          this.$store.commit('disableAutosave')
        }
      }
      this.$store.commit('incrementAutosaveCounter')
    },
    // xxx Need to improve 'net' handling.
    doFarmers() {
      const specialChance = window.vm.civData.food.specialChance + (0.1 * window.vm.civData.flensing.owned)
      let millMod = 1
      if (window.vm.$store.state.population.current > 0 || this.curCiv.zombie.owned > 0) {
        millMod = this.$store.state.population.current /
          (this.$store.state.population.current + this.curCiv.zombie.owned)
      }
      window.vm.civData.food.net = window.vm.civData.farmer.owned *
        (1 + (window.vm.civData.farmer.efficiency * this.curCiv.morale.efficiency)) *
        ((window.vm.civData.pestControl.timer > 0) ? 1.01 : 1) * window.getWonderBonus(window.vm.civData.food) *
        (1 + (window.vm.civData.walk.rate / 120)) * (1 + ((window.vm.civData.mill.owned * millMod) / 200)) // Farmers farm food
      window.vm.civData.food.net -= this.$store.state.population.current // The living population eats food.
      window.vm.civData.food.owned += window.vm.civData.food.net
      if (window.vm.civData.skinning.owned && window.vm.civData.farmer.owned > 0) { // and sometimes get skins
        const numSkins = specialChance * (window.vm.civData.food.increment +
            ((window.vm.civData.butchering.owned * window.vm.civData.farmer.owned) / 15.0)) *
          window.getWonderBonus(window.vm.civData.skins)
        window.vm.civData.skins.owned += window.rndRound(numSkins)
      }
    },
    doWoodcutters() {
      window.vm.civData.wood.net = window.vm.civData.woodcutter.owned *
        (window.vm.civData.woodcutter.efficiency * this.curCiv.morale.efficiency) *
        window.getWonderBonus(window.vm.civData.wood) // Woodcutters cut wood
      window.vm.civData.wood.owned += window.vm.civData.wood.net
      if (window.vm.civData.harvesting.owned && window.vm.civData.woodcutter.owned > 0) { // and sometimes get herbs
        const numHerbs = window.vm.civData.wood.specialChance * (window.vm.civData.wood.increment +
            ((window.vm.civData.gardening.owned * window.vm.civData.woodcutter.owned) / 5.0)) *
          window.getWonderBonus(window.vm.civData.herbs)
        window.vm.civData.herbs.owned += window.rndRound(numHerbs)
      }
    },
    doMiners() {
      const specialChance = window.vm.civData.stone.specialChance + (window.vm.civData.macerating.owned ? 0.1 : 0)
      window.vm.civData.stone.net = window.vm.civData.miner.owned *
        (window.vm.civData.miner.efficiency * this.curCiv.morale.efficiency) * window.getWonderBonus(window.vm.civData.stone) // Miners mine stone
      window.vm.civData.stone.owned += window.vm.civData.stone.net
      if (window.vm.civData.prospecting.owned && window.vm.civData.miner.owned > 0) { // and sometimes get ore
        const numOre = specialChance * (window.vm.civData.stone.increment +
            ((window.vm.civData.extraction.owned * window.vm.civData.miner.owned) / 5.0)) *
          window.getWonderBonus(window.vm.civData.ore)
        window.vm.civData.ore.owned += window.rndRound(numOre)
      }
    },
    doBlacksmiths() {
      const numUsed = Math.min(window.vm.civData.ore.owned,
        (window.vm.civData.blacksmith.owned * window.vm.civData.blacksmith.efficiency * this.curCiv.morale.efficiency))
      window.vm.civData.ore.owned -= numUsed
      window.vm.civData.metal.owned += numUsed * window.getWonderBonus(window.vm.civData.metal)
    },
    doTanners() {
      const numUsed = Math.min(window.vm.civData.skins.owned,
        (window.vm.civData.tanner.owned * window.vm.civData.tanner.efficiency * this.curCiv.morale.efficiency))
      window.vm.civData.skins.owned -= numUsed
      window.vm.civData.leather.owned += numUsed * window.getWonderBonus(window.vm.civData.leather)
    },
    doClerics() {
      window.vm.civData.piety.owned += window.vm.civData.cleric.owned *
        (window.vm.civData.cleric.efficiency + (window.vm.civData.cleric.efficiency *
          (window.vm.civData.writing.owned))) * (1 + ((window.vm.civData.secrets.owned) *
          (1 - (100 / (window.vm.civData.graveyard.owned + 100))))) * this.curCiv.morale.efficiency *
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
      num = Math.min(num, this.$store.state.population.current)

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
    doStarve() {
      let corpsesEaten
      let numStarve
      if (window.vm.civData.food.owned < 0 && window.vm.civData.waste.owned) { // Workers eat corpses if needed
        corpsesEaten = Math.min(window.vm.civData.corpses.owned, -window.vm.civData.food.owned)
        window.vm.civData.corpses.owned -= corpsesEaten
        window.vm.civData.food.owned += corpsesEaten
      }

      if (window.vm.civData.food.owned < 0) { // starve if there's not enough food.
        // xxx This is very kind.  Only 0.1% deaths no matter how big the shortage?
        numStarve = this.starve(Math.ceil(this.$store.state.population.current / 1000))
        if (numStarve === 1) {
          window.gameLog('A worker starved to death')
        }
        if (numStarve > 1) {
          window.gameLog(`${window.vm.prettify(numStarve)} workers starved to death`)
        }
        window.adjustMorale(-0.01)
        window.vm.civData.food.owned = 0
      }
    },
    spawnMob(mobObj, numArg) {
      let num = numArg
      let numSge = 0
      let msg = ''

      if (num === undefined) { // By default, base numbers on current population
        const maxMob = ((this.$store.state.population.current + this.curCiv.zombie.owned) / 50)
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

      msg = `${window.vm.prettify(num)} ${mobObj.getQtyName(num)} attacked` // xxx L10N
      if (numSge > 0) {
        msg += `, with ${window.vm.prettify(numSge)} ${window.vm.civData.esiege.getQtyName(numSge)}`
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
      this.curCiv.enemySlain.owned += playerCredit
      if (window.vm.civData.throne.owned) {
        window.vm.civData.throne.count += playerCredit
      }
      window.vm.civData.corpses.owned += (attackerCas + defenderCas)
      if (window.vm.civData.book.owned) {
        window.vm.civData.piety.owned += (attackerCas + defenderCas) * 10
      }

      // Updates population figures (including total population)
      window.updatePopulation()
    },
    doMobs() {
      // Checks when mobs will attack
      // xxx Perhaps this should go after the mobs attack, so we give 1 turn's warning?
      let mobType
      let choose
      if (this.$store.state.population.current + this.curCiv.zombie.owned > 0) {
        this.curCiv.attackCounter += 1
      } // No attacks if deserted.
      if (this.$store.state.population.current + this.curCiv.zombie.owned > 0 &&
        this.curCiv.attackCounter > (60 * 5)) { // Minimum 5 minutes
        if (600 * Math.random() < 1) {
          this.curCiv.attackCounter = 0
          // Choose which kind of mob will attack
          mobType = 'wolf' // Default to wolves
          if (this.$store.state.population.current + this.curCiv.zombie.owned >= 10000) {
            choose = Math.random()
            if (choose > 0.5) {
              mobType = 'barbarian'
            }
            else if (choose > 0.2) {
              mobType = 'bandit'
            }
          }
          else if (this.$store.state.population.current + this.curCiv.zombie.owned >= 1000) {
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
    doPestControl() {
      // Decrements the pestControl Timer
      if (window.vm.civData.pestControl.timer > 0) {
        window.vm.civData.pestControl.timer -= 1
      }
    },
    tickGlory() {
      // Handles the Glory bonus
      if (window.vm.civData.glory.timer > 0) {
        document.getElementById('gloryTimer').innerHTML = window.vm.civData.glory.timer-- // eslint-disable-line no-plusplus
      }
      else {
        document.getElementById('gloryGroup').style.display = 'none'
      }
    },
    doShades() {
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
    doEsiege(siegeObj, targetObj) {
      if (siegeObj.owned <= 0) {
        return
      }

      // First check there are enemies there defending them
      if (!window.getCombatants(siegeObj.place, siegeObj.alignment).length &&
        window.getCombatants(targetObj.place, targetObj.alignment).length) {
        // the siege engines are undefended; maybe capture them.
        if ((targetObj.alignment === 'player') && window.vm.civData.mathematics.owned) { // Can we use them?
          window.gameLog(`Captured ${window.vm.prettify(siegeObj.owned)} enemy siege engines.`)
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
    doGraveyards() {
      let i
      if (window.vm.civData.corpses.owned > 0 && this.curCiv.grave.owned > 0) {
        // Clerics will bury corpses if there are graves to fill and corpses lying around
        for (i = 0; i < window.vm.civData.cleric.owned; i++) {
          if (window.vm.civData.corpses.owned > 0 && this.curCiv.grave.owned > 0) {
            window.vm.civData.corpses.owned -= 1
            this.curCiv.grave.owned -= 1
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
      window.vm.civData[job].owned += num
      window.vm.$store.commit('healSick', num)

      return num
    },
    doHealers() {
      let job
      let numHealed = 0
      const numHealers = window.vm.civData.healer.owned + (window.vm.civData.cat.owned * (window.vm.civData.companion.owned))

      // How much healing can we do?
      window.vm.civData.healer.cureCount += (numHealers * window.vm.civData.healer.efficiency * this.curCiv.morale.efficiency)

      // We can't cure more sick people than there are
      window.vm.civData.healer.cureCount = Math.min(window.vm.civData.healer.cureCount, this.$store.state.population.totalSick)

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
    doCorpses() {
      if (window.vm.civData.corpses.owned <= 0) {
        return
      }

      // Corpses lying around will occasionally make people sick.
      // 1-in-50 chance (1-in-100 with feast)
      const sickChance = 50 * Math.random() * (1 + window.vm.civData.feast.owned)
      if (sickChance >= 1) {
        return
      }

      // Infect up to 1% of the population.
      let num = Math.floor((this.$store.state.population.current / 100) * Math.random())
      if (num <= 0) {
        return
      }

      num = this.plague(num)
      if (num > 0) {
        window.updatePopulation()
        window.gameLog(`${window.vm.prettify(num)} workers got sick`) // notify player
      }
    },
    doThrone() {
      if (window.vm.civData.throne.count >= 100) {
        // If sufficient enemies have been slain, build new temples for free
        window.vm.civData.temple.owned += Math.floor(window.vm.civData.throne.count / 100)
        window.vm.civData.throne.count = 0 // xxx This loses the leftovers.
        window.updateResourceTotals()
      }
    },
    tickGrace() {
      if (window.vm.civData.grace.cost > 1000) {
        window.vm.civData.grace.cost = Math.floor(--window.vm.civData.grace.cost) // eslint-disable-line no-plusplus
        document.getElementById('graceCost').innerHTML = window.vm.prettify(window.vm.civData.grace.cost)
      }
    },
    tickWalk() {
      let i
      let target = ''
      if (window.vm.civData.walk.rate > this.$store.state.population.healthy) {
        window.vm.civData.walk.rate = this.$store.state.population.healthy
        document.getElementById('ceaseWalk').disabled = true
      }
      if (window.vm.civData.walk.rate <= 0) {
        return
      }

      for (i = 0; i < window.vm.civData.walk.rate; ++i) {
        target = window.randomHealthyWorker() // xxx Need to modify this to do them all at once.
        if (!target) {
          break
        }
        window.vm.civData[target].owned -= 1
        // We don't want to do UpdatePopulation() in a loop, so we just do the
        // relevent adjustments directly.
        window.vm.$store.commit('kill', 1)
      }
      window.updatePopulation()
      window.updatePopulationUI()
    },
    doLabourers() {
      if (this.curCiv.curWonder.stage !== 1) {
        return
      }

      if (this.curCiv.curWonder.progress >= 100) {
        // Wonder is finished! First, send workers home
        window.vm.civData.unemployed.owned += window.vm.civData.labourer.owned
        window.vm.civData.unemployed.ill += window.vm.civData.labourer.ill
        window.vm.civData.labourer.owned = 0
        window.vm.civData.labourer.ill = 0
        window.updatePopulation()
        // hide limited notice
        document.getElementById('lowResources').style.display = 'none'
        // then set wonder.stage so things will be updated appropriately
        this.curCiv.curWonder.stage += 1
      }
      else {
        // we're still building

        // First, check our labourers and other resources to see if we're limited.
        let num = window.vm.civData.labourer.owned
        window.vm.wonderResources.forEach((elem) => {
          num = Math.min(num, elem.owned)
        })

        // remove resources
        window.vm.wonderResources.forEach((elem) => {
          elem.owned -= num
        })

        // increase progress
        this.curCiv.curWonder.progress += num / (1000000 * window.getWonderCostMultiplier())

        // show/hide limited notice
        window.setElemDisplay('lowResources', (num < window.vm.civData.labourer.owned))

        let lowItem = null
        let i = 0
        for (i = 0; i < window.vm.wonderResources.length; ++i) {
          if (window.vm.wonderResources[i].owned < 1) {
            lowItem = window.vm.wonderResources[i]
            break
          }
        }
        if (lowItem) {
          document.getElementById('limited').innerHTML = ` by low ${lowItem.getQtyName()}`
        }
      }
      window.updateWonder()
    },
    tradeTimer() {
      // Set timer length (10 sec + 5 sec/upgrade)
      this.curCiv.trader.timer = 10 + (5 * (window.vm.civData.currency.owned +
        window.vm.civData.commerce.owned + window.vm.civData.stay.owned))

      const selected = window.vm.$store.state.tradeItems[
        Math.floor(Math.random() * window.vm.$store.state.tradeItems.length)
      ]
      // Randomly select and merge one of the above.
      this.curCiv.trader.materialId = selected.materialId
      this.curCiv.trader.requested = selected.requested * (Math.ceil(Math.random() * 20)) // Up to 20x amount

      document.getElementById('tradeContainer').style.display = 'block'
      document.getElementById('tradeType').innerHTML =
        window.vm.civData[this.curCiv.trader.materialId].getQtyName(this.curCiv.trader.requested)
      document.getElementById('tradeRequested').innerHTML = window.vm.prettify(this.curCiv.trader.requested)
    },
    tickTraders() {
      // traders occasionally show up
      if (window.vm.$store.state.population.current + this.curCiv.zombie.owned > 0) {
        this.curCiv.trader.counter += 1
      }
      const delayMult = 60 * (3 - ((window.vm.civData.currency.owned) + (window.vm.civData.commerce.owned)))
      let check
      if (window.vm.$store.state.population.current + this.curCiv.zombie.owned > 0 &&
        this.curCiv.trader.counter > delayMult) {
        check = Math.random() * delayMult
        if (check < (1 + (0.2 * (window.vm.civData.comfort.owned)))) {
          this.curCiv.trader.counter = 0
          this.tradeTimer()
        }
      }

      // Trader stuff
      if (this.curCiv.trader.timer > 0) {
        if (--this.curCiv.trader.timer <= 0) { // eslint-disable-line no-plusplus
          window.setElemDisplay('tradeContainer', false)
        }
      }
    },
    testAchievements() {
      window.vm.achData.forEach((achObj) => {
        if (window.vm.civData[achObj.id].owned) {
          return true
        }
        if (window.isValid(achObj.test) && !achObj.test()) {
          return false
        }
        window.vm.civData[achObj.id].owned = true
        window.gameLog(`Achievement Unlocked: ${achObj.getQtyName()}`)
        return true
      })

      window.updateAchievements()
    },

    // //////////////////////////////////////////////////////////////////////////////
    // Pass this the item definition object.
    // Or pass nothing, to create a blank row.
    getResourceRowText(purchaseObj) {
      // Make sure to update this if the number of columns changes.
      if (!purchaseObj) {
        return "<tr class='purchaseRow'><td colspan='6'/>&nbsp;</tr>"
      }

      const objId = purchaseObj.id
      const objName = purchaseObj.getQtyName(0)
      let s = `<tr id='${objId}Row' class='purchaseRow' data-target='${objId}'>`

      s += `<td><button class='btn btn-secondary btn-sm' data-action='increment'>${purchaseObj.verb} ${objName}</button></td>`
      s += `<td class='itemname'>${objName}: </td>`
      s += "<td class='number'><span data-action='display'>0</span></td>"
      s += `<td class='icon'><img src='/static/civclicker/images/${objId}.png' class='icon icon-lg' alt='${objName}'/></td>`
      s += `<td class='number'>(Max: <span id='max${objId}'>200</span>)</td>`
      s += "<td class='number net'><span data-action='displayNet'>0</span>/s</td>"

      s += '</tr>'

      return s
    },
    // Generate two HTML <span> texts to display an item's cost and effect note.
    getCostNote(civObj) {
      // Only add a ":" if both items are present.
      const reqText = window.getReqText(civObj.require)
      const effectText = (window.isValid(civObj.effectText)) ? civObj.effectText : ''
      const separator = (reqText && effectText) ? ': ' : ''

      return `<span id='${civObj.id}Cost' class='cost'>${reqText}</span>` +
        `<span id='${civObj.id}Note' class='note'>${separator}${civObj.effectText}</span>`
    },
    // We have a separate row generation function for upgrades, because their
    // layout is differs greatly from buildings/units:
    //  - Upgrades are boolean, so they don't need multi-purchase buttons.
    //  - Upgrades don't need quantity labels, and put the name in the button.
    //  - Upgrades are sometimes generated in a table with <tr>, but sometimes
    //    outside of one with <span>.
    getUpgradeRowText(upgradeObj, inTableArg) {
      const inTable = (inTableArg === undefined) ? true : inTableArg
      const cellTagName = inTable ? 'td' : 'span'
      const rowTagName = inTable ? 'tr' : 'span'
      // Make sure to update this if the number of columns changes.
      if (!upgradeObj) {
        return inTable ? `<${rowTagName} class='purchaseRow'><td colspan='2'/>&nbsp;</${rowTagName}>` : ''
      }

      let s = `<${rowTagName} id='${upgradeObj.id}Row' class='purchaseRow'`
      s += ` data-target='${upgradeObj.id}'>`
      s += this.getPurchaseCellText(upgradeObj, true, inTable)
      s += `<${cellTagName}>${this.getCostNote(upgradeObj)}</${cellTagName}>`
      if (!inTable) {
        s += '<br>'
      }
      s += `</${rowTagName}>`
      return s
    },
    getPurchaseCellText(purchaseObj, qty, inTableArg) {
      const inTable = (inTableArg === undefined) ? true : inTableArg

      // Internal utility functions.
      function sgnchr(x) {
        return (x > 0) ? '+' : (x < 0) ? '&minus;' : '' // eslint-disable-line no-nested-ternary
      }
      // xxx Hack: Special formatting for booleans, Infinity and 1k.
      function infchr(x) {
        return (x === Infinity) ? '&infin;' : (x === 1000) ? '1k' : x // eslint-disable-line no-nested-ternary
      }

      function fmtbool(x) {
        const neg = (window.sgn(x) < 0)
        return (neg ? '(' : '') + purchaseObj.getQtyName(0) + (neg ? ')' : '')
      }

      function fmtqty(x) {
        return (typeof x === 'boolean') ? fmtbool(x) : sgnchr(window.sgn(x)) + infchr(window.abs(x))
      }

      function allowPurchase() {
        if (!qty) {
          return false
        } // No-op

        // Can't buy/sell items not controlled by player
        if (purchaseObj.alignment && (purchaseObj.alignment !== 'player')) {
          return false
        }

        // Quantities > 1 are meaningless for boolean items.
        if ((typeof purchaseObj.initOwned === 'boolean') && (window.abs(qty) > 1)) {
          return false
        }

        // Don't buy/sell unbuyable/unsalable items.
        if ((window.sgn(qty) > 0) && (purchaseObj.require === undefined)) {
          return false
        }
        if ((window.sgn(qty) < 0) && (!purchaseObj.salable)) {
          return false
        }

        // xxx Right now, variable-cost items can't be sold, and are bought one-at-a-time.
        if ((qty !== 1) && purchaseObj.hasVariableCost()) {
          return false
        }

        return true
      }

      const tagName = inTable ? 'td' : 'span'
      const className = (window.abs(qty) === 'custom') ? 'buy' : purchaseObj.type // 'custom' buttons all use the same class.

      let s = `<${tagName} class='${className}${window.abs(qty)}' data-quantity='${qty}' >`
      if (allowPurchase()) {
        s += `<button class='btn btn-secondary btn-sm x${window.abs(qty)}' data-action='purchase' disabled='disabled'>${fmtqty(qty)}</button>` // eslint-disable-line
      }
      s += `</${tagName}>`
      return s
    },
    // Pass this the item definition object.
    // Or pass nothing, to create a blank row.
    getPurchaseRowText(purchaseObj) {
      // Make sure to update this if the number of columns changes.
      if (!purchaseObj) {
        return "<tr class='purchaseRow'><td colspan='13'/>&nbsp;</tr>"
      }

      const objId = purchaseObj.id
      let s = `<tr id='${objId}Row' class='purchaseRow' data-target='${purchaseObj.id}'>`;

      [-Infinity, '-custom', -100, -10, -1]
      .forEach((elem) => {
        s += this.getPurchaseCellText(purchaseObj, elem)
      })

      const enemyFlag = (purchaseObj.alignment === 'enemy') ? ' enemy' : ''
      s += `<td class='itemname${enemyFlag}'>${purchaseObj.getQtyName(0)}: </td>`

      // TODO: remove display_pop
      const action = (window.isValid(window.vm.$store.state.population[objId])) ? 'display_pop' : 'display' // xxx Hack
      s += `<td class='number'><span data-action='${action}'>0</span></td>`;

      // Don't allow Infinite (max) purchase on things we can't sell back.
      [1, 10, 100, 'custom', ((purchaseObj.salable) ? Infinity : 1000)]
      .forEach((elem) => {
        s += this.getPurchaseCellText(purchaseObj, elem)
      })

      s += `<td>${this.getCostNote(purchaseObj)}</td>`
      s += '</tr>'

      return s
    },
    addUITable(civObjs, groupElemName) {
      let s = ''
      civObjs.forEach((elem) => {
        s += elem.type === 'resource' ? this.getResourceRowText(elem) : // eslint-disable-line no-nested-ternary
          elem.type === 'upgrade' ? this.getUpgradeRowText(elem) :
          this.getPurchaseRowText(elem)
      })
      const groupElem = document.getElementById(groupElemName)
      groupElem.innerHTML += s
      groupElem.onmousedown = window.onBulkEvent
      return groupElem
    },

    // ////////////////////////////////////////////////////////////////////
    prettify(input) {
      // xxx TODO: Add appropriate format options
      return (this.$store.state.settings.delimiters) ? Number(input).toLocaleString() : input.toString()
    },


  },
})
