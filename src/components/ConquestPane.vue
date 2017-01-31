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
      <button v-for="elem in civSizes" class="btn btn-secondary btn-sm raid" @click="invade(elem.id)" :data-target="elem.id" disabled="disabled">
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
export default {
  name: 'conquest-pane',
  props: ['armyUnits', 'civSizes', 'settings'],
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {
      window.addUITable(window.vm.armyUnits, 'party') // Dynamically create the party controls table.
    })
  },
  methods: {
    invade(ecivtype) {
      // invades a certain type of civilisation based on the button clicked
      window.vm.curCiv.raid.raiding = true
      window.vm.curCiv.raid.last = ecivtype

      window.vm.curCiv.raid.epop = window.vm.civSizes[ecivtype].max_pop + 1
      // If no max pop, use 2x min pop.
      if (window.vm.curCiv.raid.epop === Infinity) {
        window.vm.curCiv.raid.epop = window.vm.civSizes[ecivtype].min_pop * 2
      }
      if (window.vm.civData.glory.timer > 0) {
        window.vm.curCiv.raid.epop *= 2
      } // doubles soldiers fought

      // 5-25% of enemy window.vm.population is soldiers.
      window.vm.civData.esoldier.owned += (window.vm.curCiv.raid.epop / 20) +
        Math.floor(Math.random() * (window.vm.curCiv.raid.epop / 5))
      window.vm.civData.efort.owned += Math.floor(Math.random() * (window.vm.curCiv.raid.epop / 5000))

      // Glory redoubles rewards (doubled here because doubled already above)
      const baseLoot = window.vm.curCiv.raid.epop / (1 + (window.vm.civData.glory.timer <= 0))

      // Set rewards of land and other random plunder.
      // xxx Maybe these should be partially proportionate to the actual number of defenders?
      window.vm.curCiv.raid.plunderLoot = {
        freeLand: Math.round(baseLoot * (1 + (window.vm.civData.administration.owned))),
      }
      window.vm.lootable.forEach((elem) => {
        window.vm.curCiv.raid.plunderLoot[elem.id] = Math.round(baseLoot * Math.random())
      })

      window.updateTargets() // Hides raid buttons until the raid is finished
      window.updatePartyButtons()
    },
    plunder() { // eslint-disable-line no-unused-vars
      let plunderMsg = ''

      // If we fought our largest eligible foe, but not the largest possible, raise the limit.
      if ((window.vm.curCiv.raid.targetMax !== window.vm.civSizes[window.vm.civSizes.length - 1].id) &&
          window.vm.curCiv.raid.last === window.vm.curCiv.raid.targetMax) {
        window.vm.curCiv.raid.targetMax = window.vm.civSizes[window.vm.civSizes[window.vm.curCiv.raid.targetMax].idx + 1].id
      }

      // Improve morale based on size of defeated foe.
      window.adjustMorale((window.vm.civSizes[window.vm.curCiv.raid.last].idx + 1) / 100)

      // Lamentation
      if (window.vm.civData.lament.owned) {
        window.vm.curCiv.attackCounter -= Math.ceil(window.vm.curCiv.raid.epop / 2000)
      }

      // Collect loot
      window.payFor(window.vm.curCiv.raid.plunderLoot, -1) // We pay for -1 of these to receive them.

      // Create message to notify player
      plunderMsg = `
        ${window.vm.civSizes[window.vm.curCiv.raid.last].name} defeated!
        Plundered ${window.getReqText(window.vm.curCiv.raid.plunderLoot)}.
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
