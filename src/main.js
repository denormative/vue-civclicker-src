// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import Vuex from 'vuex'

Vue.use(Vuex)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App :curCiv="curCiv"/>',
  data() {
    return {
      curCiv: {}
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
