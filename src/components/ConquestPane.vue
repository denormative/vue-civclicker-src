<template>
  <div class="conquest-pane">
    <div id="conquestPane" class="selectPane">
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
          <button id="plunder" onmousedown="plunder()">Plunder Resources</button><br>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'conquest-pane',
  data () {
    return {
    }
  }
}
</script>

<style scoped>
</style>