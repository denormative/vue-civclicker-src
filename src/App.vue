<template>
<div id="app">
  <root :curCiv="curCiv" :settings="settings"></root>
</div>
</template>

<script>
import Hello from './components/Hello'
import Root from './Root'

export default {
  name: 'app',
  props: ['curCiv', 'settings'],
  components: {
    Hello,
    Root
  },
  created: function() {
    window.addEventListener('keydown', function(event) {
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
          console.log('recruit')
          window.spawn(Infinity)
          break
        default:
          break
      }
    })
  }
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
