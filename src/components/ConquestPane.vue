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
  props: ['armyUnits'],
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {
      window.addUITable(window.vm.armyUnits, 'party') // Dynamically create the party controls table.
      this.addRaidRows()
    })
  },
  methods: {
    // Dynamically add the raid buttons for the various civ sizes.
    addRaidRows() {
      let s = ''
      window.vm.civSizes.forEach((elem) => {
        s += `<button class='btn btn-secondary btn-sm raid' data-action='raid' data-target='${elem.id}' disabled='disabled'>` +
          `Raid ${elem.name}</button><br>` // xxxL10N
      })

      const group = document.getElementById('raidGroup')
      group.innerHTML += s
      group.onmousedown = window.onBulkEvent
    },
  },
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
