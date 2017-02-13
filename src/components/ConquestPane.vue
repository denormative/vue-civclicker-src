<template>
<div role="tabpanel" id="conquestPane" class="conquest-pane tab-pane">
  <span id="standardRow"></span>
  <div id="conquest">
    <h4>Army</h4>
    <p v-show="settings.customIncr">
      Custom Quantity <input id="partyCustomQty" type="number" min="1" step="1" value="1" />
    </p>
    <table id="party"></table>
    <br>
    <div id="raidGroup">
      <h4>To War!</h4>
      <p id="gloryGroup">
        Glory: <span id="gloryTimer">0</span> seconds remain
      </p>
      <button v-for="elem in civSizes" class="btn btn-secondary btn-sm raid" @click="invade(elem.id)" :data-target="elem.id" disabled>
        Raid {{elem.name}}
      </button>
    </div>
    <div id="victoryGroup">
      <h4>Victory!</h4>
      <button id="btn btn-primary btn-lg plunder" @click="plunder()">Plunder Resources</button><br>
    </div>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name:  'conquest-pane',
  props: ['armyUnits'],
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {
      window.vm.addUITable(window.vm.armyUnits, 'party') // Dynamically create the party controls table.
    })
  },
  computed: mapState(['settings', 'civSizes', 'curCiv', 'civData']),
  methods:  {
    invade(ecivtype) {
      // invades a certain type of civilisation based on the button clicked
      const newRaid = {
        raiding:     true,
        last:        ecivtype,
        epop:        this.civSizes[ecivtype].max_pop + 1,
        plunderLoot: {
          freeLand: 0,
        },
      }

      // If no max pop, use 2x min pop.
      if (newRaid.epop === Infinity) {
        newRaid.epop = this.civSizes[ecivtype].min_pop * 2
      }
      // doubles soldiers fought
      if (this.civData.glory.timer > 0) {
        newRaid.epop *= 2
      }

      // 5-25% of enemy population is soldiers.
      this.civData.esoldier.owned += (newRaid.epop / 20) + Math.floor(Math.random() * (newRaid.epop / 5))
      this.civData.efort.owned += Math.floor(Math.random() * (this.curCiv.raid.epop / 5000))

      // Glory redoubles rewards (doubled here because doubled already above)
      const baseLoot = newRaid.epop / (1 + (this.civData.glory.timer <= 0))

      // Set rewards of land and other random plunder.
      // xxx Maybe these should be partially proportionate to the actual number of defenders?
      newRaid.plunderLoot.freeLand = Math.round(baseLoot * (1 + (this.civData.administration.owned)))

      window.vm.lootable.forEach((elem) => {
        newRaid.plunderLoot[elem.id] = Math.round(baseLoot * Math.random())
      })

      this.$store.commit('startRaid', newRaid)

      window.updateTargets() // Hides raid buttons until the raid is finished
      window.updatePartyButtons()
    },
    plunder() { // eslint-disable-line no-unused-vars
      let plunderMsg = ''

      // If we fought our largest eligible foe, but not the largest possible, raise the limit.
      if ((this.curCiv.raid.targetMax !== this.civSizes[this.civSizes.length - 1].id) &&
        this.curCiv.raid.last === this.curCiv.raid.targetMax) {
        this.$store.commit('setMaxRaidTarget', this.civSizes[this.civSizes[this.curCiv.raid.targetMax].idx + 1].id)
      }

      // Improve morale based on size of defeated foe.
      window.adjustMorale((this.civSizes[this.curCiv.raid.last].idx + 1) / 100)

      // Lamentation
      if (this.civData.lament.owned) {
        this.$store.commit('setAttackCounter', this.curCiv.attackCounter - Math.ceil(this.curCiv.raid.epop / 2000))
      }

      // Collect loot
      window.payFor(this.curCiv.raid.plunderLoot, -1) // We pay for -1 of these to receive them.

      // Create message to notify player
      plunderMsg =
        `
        ${this.civSizes[this.curCiv.raid.last].name} defeated!
        Plundered ${window.getReqText(this.curCiv.raid.plunderLoot)}.
      `
      window.gameLog(plunderMsg)

      // Victory outcome has been handled, end raid
      window.resetRaiding()
      window.updateResourceTotals()
      window.updateTargets()
    },
  },
  actions: {},
}
</script>

<style>
#conquest {
  display: none;
}

#victoryGroup {
  display: none;
}

#gloryGroup {
  display: none;
}
</style>
