<template>
<div class="root">
  <civ-title :curCiv="curCiv"></civ-title>
  <!-- built files will be auto injected -->
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <basic-resources :basicResources="basicResources"></basic-resources>
        <special-resources></special-resources>

        <ul class="nav nav-tabs">
          <li class="nav-item">
            <a class="nav-link active" data-toggle="tab" href="#buildingsPane">Buildings</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" data-toggle="tab" href="#upgradesPane">Upgrades</a>
          </li>
          <li class="nav-item" id="deitySelect">
            <a class="nav-link" data-toggle="tab" href="#deityPane">Deity</a>
          </li>
          <li class="nav-item" id="conquestSelect">
            <a class="nav-link" data-toggle="tab" href="#conquestPane">Conquest</a>
          </li>
          <li class="nav-item" id="tradeSelect">
            <a class="nav-link" data-toggle="tab" href="#tradePane">Trade</a>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">=</a>
            <div class="dropdown-menu">
              <a class="dropdown-item" data-toggle="tab" href="#achievementsPane">Achievements</a>
              <a class="dropdown-item" data-toggle="tab" href="#settingsPane">Settings</a>
              <a class="dropdown-item" data-toggle="tab" href="#statsPane">Stats</a>
            </div>
          </li>
        </ul>

        <div class="container-fluid">
          <div class="tab-content">
            <buildings-pane :homeBuildings="homeBuildings"></buildings-pane>
            <upgrade-pane :normalUpgrades="normalUpgrades"></upgrade-pane>
            <deity-pane></deity-pane>
            <conquest-pane :armyUnits="armyUnits" :civSizes="civSizes"></conquest-pane>
            <trade-pane></trade-pane>
            <achievements-pane :achData="achData"></achievements-pane>
            <settings-pane :settings="settings"></settings-pane>
            <stats-pane :curCiv="curCiv" :settings="settings"></stats-pane>
          </div>
        </div>
      </div>
      <div class="col">
        <population-pane :curCiv="curCiv" :settings="settings"></population-pane>
        <jobs-pane :settings="settings" :homeUnits="homeUnits"></jobs-pane>
        <current-trade-pane></current-trade-pane>
        <events-pane></events-pane>
        <current-deity-pane :curCiv="curCiv"></current-deity-pane>
        <wonders-pane :curCiv="curCiv" :wonderInProgress="wonderInProgress" :wonderCompleted="wonderCompleted"></wonders-pane>
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
import CurrentTradePane from './components/CurrentTradePane'
import EventsPane from './components/EventsPane'
import CurrentDeityPane from './components/CurrentDeityPane'
import WondersPane from './components/WondersPane'
import StatsPane from './components/StatsPane'

export default {
  name: 'root',
  props: ['curCiv', 'settings', 'basicResources', 'homeBuildings',
    'homeUnits', 'armyUnits', 'normalUpgrades', 'civSizes', 'achData'],
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
    CurrentTradePane,
    EventsPane,
    CurrentDeityPane,
    WondersPane,
    StatsPane,
  },
  data() {
    return {}
  },
  computed: {
    wonderInProgress() {
      return this.curCiv.curWonder.stage === 1
    },
    wonderCompleted() {
      return this.curCiv.curWonder.stage === 2
    },
  },
}
</script>

<style scoped>
#deitySelect, #conquestSelect, #tradeSelect {
  display: none;
}
</style>
