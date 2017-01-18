<template>
<div class="root container-fluid">
  <!-- built files will be auto injected -->
  <!-- <button type="button" class="btn btn-lg btn-danger" data-toggle="popover" title="Popover title" data-content="And here's some amazing content. It's very engaging. Right?">Click to toggle popover</button>
<script type="text/javascript">
/* global $ */
$(function () {
$('[data-toggle="popover"]').popover()
})
</script> -->
  <title></title>
  <menus></menus>

  <div class="mainContent">
    <div id="leftColumn" class="civColumn">
      <basic-resources></basic-resources>
      <special-resources></special-resources>

      <div id="panesSelectors" class="civSection">
        <div id="selectors">
          <div id="buildingsSelect" class="paneSelector selected" data-target="buildingsPane" onclick="paneSelect(this)">Buildings</div>
          <div id="upgradesSelect" class="paneSelector" data-target="upgradesPane" onclick="paneSelect(this)">Upgrades</div>
          <div id="deitySelect" class="paneSelector" data-target="deityPane" onclick="paneSelect(this)">Deity</div>
          <div id="conquestSelect" class="paneSelector" data-target="conquestPane" onclick="paneSelect(this)">Conquest</div>
          <div id="tradeSelect" class="paneSelector" data-target="tradePane" onclick="paneSelect(this)">Trade</div>
          <div id="achievementsSelect" class="paneSelector" data-target="achievementsPane" onclick="paneSelect(this)">Achievements</div>
          <div id="settingsSelect" class="paneSelector" data-target="settingsPane" onclick="paneSelect(this)">Settings</div>
          <div style="clear:both;"></div>
        </div>

        <buildings-pane></buildings-pane>
        <upgrade-pane></upgrade-pane>
        <deity-pane></deity-pane>
        <conquest-pane></conquest-pane>
        <trade-pane></trade-pane>
        <achievements-pane></achievements-pane>
        <settings-pane></settings-pane>
      </div>
    </div>
    <div id="rightColumn" class="civColumn">
      <population-pane></population-pane>
      <jobs-pane></jobs-pane>
      <current-deity-pane></current-deity-pane>
      <wonders-pane></wonders-pane>
      <stats-pane></stats-pane>
    </div>
  </div>
</div>
</template>

<script>
import CivTitle from './CivTitle'
import Menus from './Menus'
import BasicResources from './BasicResources'
import SpecialResources from './SpecialResources'
import BuildingsPane from './BuildingsPane'
import UpgradePane from './UpgradePane'
import DeityPane from './DeityPane'
import ConquestPane from './ConquestPane'
import TradePane from './TradePane'
import AchievementsPane from './AchievementsPane'
import SettingsPane from './SettingsPane'
import PopulationPane from './PopulationPane'
import JobsPane from './JobsPane'
import EventsPane from './EventsPane'
import CurrentDeityPane from './CurrentDeityPane'
import WondersPane from './WondersPane'
import StatsPane from './StatsPane'

export default {
  name: 'root',
  components: {
    CivTitle,
    Menus,
    BasicResources,
    SpecialResources,
    BuildingsPane,
    UpgradePane,
    DeityPane,
    ConquestPane,
    TradePane,
    AchievementsPane,
    SettingsPane,
    PopulationPane,
    JobsPane,
    EventsPane,
    CurrentDeityPane,
    WondersPane,
    StatsPane
  },
  data() {
    return {
    }
  },
  mounted: function() {
    window.postLoad()
  }
}
</script>

<style scoped>

</style>
