<template>
  <div class="root">
    <civ-title></civ-title>
    <!-- built files will be auto injected -->
    <!-- <button type="button" class="btn btn-lg btn-danger" data-toggle="popover" title="Popover title" data-content="And here's some amazing content. It's very engaging. Right?">Click to toggle popover</button>
  <script type="text/javascript">
  /* global $ */
  $(function () {
  $('[data-toggle="popover"]').popover()
  })
  </script> -->
    <div class="container-fluid">


      <div class="row">
        <div class="col">
          <basic-resources></basic-resources>
          <special-resources></special-resources>

          <div>
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
        <div class="col">
          <population-pane></population-pane>
          <jobs-pane></jobs-pane>
          <current-deity-pane></current-deity-pane>
          <wonders-pane></wonders-pane>
          <stats-pane></stats-pane>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CivTitle from './components/CivTitle'
import BasicResources from './components/BasicResources'
import SpecialResources from './components/SpecialResources'
import BuildingsPane from './components/BuildingsPane'
import UpgradePane from './components/UpgradePane'
import DeityPane from './components/DeityPane'
import ConquestPane from './components/ConquestPane'
import TradePane from './components/TradePane'
import AchievementsPane from './components/AchievementsPane'
import SettingsPane from './components/SettingsPane'
import PopulationPane from './components/PopulationPane'
import JobsPane from './components/JobsPane'
import EventsPane from './components/EventsPane'
import CurrentDeityPane from './components/CurrentDeityPane'
import WondersPane from './components/WondersPane'
import StatsPane from './components/StatsPane'

export default {
  name: 'root',
  components: {
    CivTitle,
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
