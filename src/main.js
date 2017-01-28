// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuex from 'vuex'
import App from './App'

Vue.use(Vuex)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App :curCiv="curCiv" :settings="settings" :basicResources="basicResources" :homeBuildings="homeBuildings" :homeUnits="homeUnits" :armyUnits="armyUnits" :normalUpgrades="normalUpgrades"/>', // eslint-disable-line max-len
  data() {
    return {
      version: 0, // This is an ordinal used to trigger reloads.
      versionData: {},
      saveTag: '',
      saveTag2: '', // For old saves.
      saveSettingsTag: '',
      logRepeat: 0,
      civSizes: [],
      curCiv: {},
      population: {},
      // Caches the total number of each wonder, so that we don't have to recount repeatedly.
      wonderCount: {},
      settings: {},
      civData: [],
      // Build a variety of additional indices so that we can iterate over specific
      // subsets of our civ objects.
      resourceData: [], // All resources
      buildingData: [], // All buildings
      upgradeData: [], // All upgrades
      powerData: [], // All 'powers' //xxx This needs refinement.
      unitData: [], // All units
      achData: [], // All achievements
      sackable: [], // All buildings that can be destroyed
      lootable: [], // All resources that can be stolen
      killable: [], // All units that can be destroyed
      homeBuildings: [], // All buildings to be displayed in the home area
      homeUnits: [], // All units to be displayed in the home area
      armyUnits: [], // All units to be displayed in the army area
      basicResources: [], // All basic (click-to-get) resources
      normalUpgrades: [], // All upgrades to be listed in the normal upgrades area
      wonderResources: [],
      body: {},

    }
  },
  created() {
    window.vm = this
    window.preLoad()
  },
  mounted() {
    this.$nextTick(() => {
      window.postLoad()
    })
  },
  components: {
    App,
  },
})
