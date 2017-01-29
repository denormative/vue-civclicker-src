<template>
<div role="tabpanel" id="conquestPane" class="conquest-pane tab-pane">
  <span id="standardRow"></span>
  <div id="conquest">
    <h4>Army</h4>
    <p id="customPartyQuantity">
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
      <button id="btn btn-primary btn-lg plunder" onmousedown="plunder()">Plunder Resources</button><br>
    </div>
  </div>
</div>
</template>

<script>
export default {
  name: 'conquest-pane',
  props: ['armyUnits', 'civSizes'],
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
  },
  actions: {},
}
</script>

<style>
#conquest {
  display: none;
}

#customPartyQuantity {
  display: none;
}

#victoryGroup {
  display: none;
}

#gloryGroup {
  display: none;
}
</style>
