<template>
<div id="app">
  <root :basicResources="basicResources" :achData="achData"></root>
</div>
</template>

<script>
import { mapState } from 'vuex'

import Hello from './components/Hello'
import Root from './Root'

export default {
  name:  'app',
  props: ['basicResources', 'homeBuildings',
    'homeUnits', 'armyUnits', 'normalUpgrades', 'achData'],
  components: {
    Hello,
    Root,
  },
  computed: {
    ...mapState(['versionData']),
  },
  created() {
    document.title = `CivClicker (${this.versionData})`

    window.addEventListener('keydown', (event) => {
      switch (event.keyCode) {
        case 70: // f
          window.increment('food')
          break
        case 68: // d
          window.increment('wood')
          break
        case 83: // s
          window.increment('stone')
          break
        case 82: // r
          window.spawn(Infinity)
          break
        default:
          break
      }
    })
  },
}
</script>

<style>
#app {
  /*font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;*/
}
</style>
