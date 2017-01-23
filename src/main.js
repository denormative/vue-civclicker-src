// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import Vuex from 'vuex'

Vue.use(Vuex)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App :curCiv="curCiv" :settings="settings"/>',
  data() {
    return {
      civSizes: [],
      curCiv: {},
      population: {},
      // Caches the total number of each wonder, so that we don't have to recount repeatedly.
      wonderCount: {},
      settings: {}
    }
  },
  created: function() {
    window.vm = this
    window.preLoad()
  },
  mounted: function() {
    window.postLoad()
  },
  components: {
    App
  }
})
