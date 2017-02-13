<template>
<div role="tabpanel" id="deityPane" class="deity-pane tab-pane">
  <span id="worshipRow"></span>
  <div id="deityDomains">
    <span id="battleRow" class="purchaseRow" data-target="battle"> <span class="upgradetrue" data-quantity="true">
              <button id="battleDeity" class="btn btn-danger xtrue" onmousedown="selectDeity('battle')">Battle</button></span>
    <span><span id="battleCost" class="cost">500 piety</span><span id="battleNote" class="note">: (You can only pick one of these)</span></span><br></span>
    <span id="fieldsRow" class="purchaseRow" data-target="fields"> <span class="upgradetrue" data-quantity="true">
              <button id="fieldsDeity" class="btn btn-warning xtrue" onmousedown="selectDeity('fields')">Fields</button></span>
    <span><span id="fieldsCost" class="cost">500 piety</span><span id="fieldsNote" class="note">: (You can only pick one of these)</span></span><br></span>
    <span id="underworldRow" class="purchaseRow" data-target="underworld"> <span class="upgradetrue" data-quantity="true">
              <button id="underworldDeity" class="btn btn-secondary xtrue" onmousedown="selectDeity('underworld')">Underworld</button></span>
    <span><span id="underworldCost" class="cost">500 piety</span><span id="underworldNote" class="note">: (You can only pick one of these)</span></span><br></span>
    <span id="catsRow" class="purchaseRow" data-target="cats"> <span class="upgradetrue" data-quantity="true">
              <button id="catsDeity" class="btn btn-infoxtrue" onmousedown="selectDeity('cats')">Cats</button></span>
    <span><span id="catsCost" class="cost">500 piety</span><span id="catsNote" class="note">: (You can only pick one of these)</span></span><br></span>
  </div>
  <div id="battleUpgrades">
    <h3>The Strength of Battle</h3>
    <table>
      <tr id="battleAltarRow">
        <td></td>
      </tr>
      <tr id="riddleRow">
        <td></td>
      </tr>
      <tr id="smiteRow">
        <td></td>
      </tr>
      <tr id="throneRow">
        <td></td>
      </tr>
      <tr id="gloryRow">
        <td></td>
      </tr>
      <tr id="lamentRow">
        <td></td>
      </tr>
    </table>
  </div>
  <div id="fieldsUpgrades">
    <h3>The Bounty of the Fields</h3>
    <table>
      <tr id="fieldsAltarRow">
        <td></td>
      </tr>
      <tr id="blessingRow">
        <td></td>
      </tr>
      <tr id="wickermanRow">
        <td></td>
      </tr>
      <tr id="wasteRow">
        <td></td>
      </tr>
      <tr id="walkRow">
        <td></td>
      </tr>
      <tr id="stayRow">
        <td></td>
      </tr>
    </table>
  </div>
  <div id="underworldUpgrades">
    <h3>The Dread Power of the Underworld</h3>
    <table>
      <tr id="underworldAltarRow">
        <td></td>
      </tr>
      <tr id="bookRow">
        <td></td>
      </tr>
      <tr id="raiseDeadRow">
        <td></td>
      </tr>
      <tr id="feastRow">
        <td></td>
      </tr>
      <tr id="summonShadeRow">
        <td></td>
      </tr>
      <tr id="secretsRow">
        <td></td>
      </tr>
    </table>
  </div>
  <div id="catsUpgrades">
    <h3>The Grace of Cats</h3>
    <table>
      <tr id="catAltarRow">
        <td></td>
      </tr>
      <tr id="lureRow">
        <td></td>
      </tr>
      <tr id="pestControlRow">
        <td></td>
      </tr>
      <tr id="companionRow">
        <td></td>
      </tr>
      <tr id="graceRow">
        <td></td>
      </tr>
      <tr id="comfortRow">
        <td></td>
      </tr>
    </table>
  </div>
  <div id="pantheonContainer">
    <h3>Pantheon</h3>
    <table id="oldDeities">
      <tr>
        <td></td>
      </tr>
    </table>
  </div>
  <div id="iconoclasmGroup">
    <button class="btn btn-danger btn-sm" id="iconoclasm" @click="iconoclasmList()">Iconoclasm</button>
    <span id="iconoclasmCost" class="cost">1,000 piety</span>
    <span id="iconoclasmNote" class="note">: Remove an old deity to gain gold</span><br>
    <div id="iconoclasmList"></div>
  </div>
  <div id="permaUpgradeContainer">
    <h3>Pantheon Upgrades</h3>
    <div id="purchasedPantheon"></div>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'deity-pane',
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {})
  },
  computed: {
    ...mapState(['curCiv', 'civData']),
  },
  methods: {
    iconoclasmList() { // eslint-disable-line no-unused-vars
      // Lists the deities for removing
      if (this.civData.piety.owned >= 1000) {
        this.civData.piety.owned -= 1000
        window.updateResourceTotals()
        document.getElementById('iconoclasm').disabled = true
        let append = '<br>'
        for (let i = 1; i < this.curCiv.deities.length; ++i) {
          append += `<button class="btn btn-danger btn-sm" onclick="iconoclasm(${i})">`
          append += this.curCiv.deities[i].name
          append += '</button><br>'
        }
        append += '<br><button class="btn btn-primary btn-sm" onclick=\'iconoclasm("cancel")\'>Cancel</button>'
        document.getElementById('iconoclasmList').innerHTML = append
      }
    },
  },
}
</script>

<style>
#oldDeities {
  display: none;
}

#oldDeities td {
  padding-right: 1em;
}

#deityDomains {
  display: none;
}

#deityDomains .purchaseRow {
  /* We control the display of these through #deityDomains, so */
  /*   suppress the usual .purchaseRow display:none */
  display: inline;
}

#battleUpgrades,
#fieldsUpgrades,
#underworldUpgrades,
#catsUpgrades {
  display: none;
}

#iconoclasmGroup {
  display: none;
}

#iconoclasmList {
  padding-left: 2em;
}

#purchasedPantheon {
  margin-left: 1em;
}

#purchasedPantheon * {
  line-height: 1.5em;
}
</style>
