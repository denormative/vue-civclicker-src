<template>
<div class="wonders-pane card" id="wondersContainer">
  <h4 class="card-header">Wonders
    <div class="btn-group float-right" role="group" v-show="wonderInProgress"> <!-- FIXME: should be v-if -->
      <button id="renameWonder" class="btn btn-outline-info btn-sm" @click="renameWonder()">Rename</button>
      <button id="speedWonder" class="btn btn-outline-primary btn-sm" @click="speedWonder()"
          data-content="<b>100 gold</b><br> Increase wonder progress by 1%">Speed</button>
    </div>
  </h4>
  <div class="card-block">
    <div class="row">
      <div id="startWonderLine" class="col" align="center">
        <button id="startWonder" class="btn btn-success btn-lg" @click="startWonder()">
          Start Building Wonder
        </button>
      </div>
      <div id="wonderCompleted" v-show="wonderCompleted" class="col">
        <h5 class="text-success text-center"><b><span id="wonderNameC">Wonder</span></b> Completed!</h5>
        <div>Choose Bonus:</div>
      </div>
      <div v-show="wonderInProgress" class="col">
        <!-- FIXME: really should be v-if not v-show -->
        <div class="">Progress on <b>{{curCiv.curWonder.name}}</b></div>
        <div class="progress" style="line-height: 1.5rem; font-size: 1rem">
          <div class="progress-bar bg-success" style="height: 1.5rem" role="progressbar" v-bind:style="{width: curCiv.curWonder.progress + '%'}" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
            {{progressDisplay}}%
          </div>
        </div>
        <div id="lowResources" class="text-center">Limited<span id="limited"> by low resources</span></div>
      </div>
      <div class="col col-auto">
        <table id="pastWonders">
          <tr>
            <td></td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name:  'wonders-pane',
  props: ['wonderInProgress', 'wonderCompleted'],
  data() {
    return {}
  },
  created() {
    this.$nextTick(() => {
      // window.$('[data-toggle="popover"]').popover()
      window.$('#speedWonder').popover({
        trigger:   'hover',
        placement: 'left',
        html:      true,
      })
    })
  },
  mounted() {
    this.$nextTick(() => {
      this.addWonderSelectText()
    })
  },
  computed: {
    ...mapState(['curCiv']),
    progressDisplay() {
      return this.curCiv.curWonder.progress.toFixed(2)
    },
  },
  methods: {
    addWonderSelectText() {
      const wcElem = document.getElementById('wonderCompleted')
      if (!wcElem) {
        console.error('Error: No wonderCompleted element found.')
        return
      }
      let s = wcElem.innerHTML
      window.vm.wonderResources.forEach((elem, i, wr) => {
        s += `<button class='btn btn-secondary btn-sm' onmousedown='wonderSelect("${elem.id}")'>${elem.getQtyName(0)}</button>`
        // Add newlines to group by threes (but no newline for the last one)
        if (!((i + 1) % 3) && (i !== wr.length - 1)) {
          s += '<br>'
        }
      })

      wcElem.innerHTML = s
    },
    startWonder() { // eslint-disable-line no-unused-vars
      if (this.curCiv.curWonder.stage !== 0) {
        return
      }
      this.curCiv.curWonder.stage += 1
      this.renameWonder()
      window.updateWonder()
    },
    renameWonder() {
      // Can't rename before you start, or after you finish.
      if (this.curCiv.curWonder.stage === 0 || this.curCiv.curWonder.stage > 2) {
        return
      }
      const n = prompt('Please name your Wonder:', this.curCiv.curWonder.name) // eslint-disable-line no-alert
      if (!n) {
        return
      }
      this.curCiv.curWonder.name = n
      const wc = document.getElementById('wonderNameC')
      if (wc) {
        wc.innerHTML = this.curCiv.curWonder.name
      }
    },
    speedWonder() { // eslint-disable-line no-unused-vars
      if (window.vm.civData.gold.owned < 100) {
        return
      }
      window.vm.civData.gold.owned -= 100

      this.curCiv.curWonder.progress += 1 / window.getWonderCostMultiplier()
      this.curCiv.curWonder.rushed = true
      window.updateWonder()
    },
  },
}
</script>

<style>
#wondersContainer {
  display: none;
}

#startWonderLine {
  display: none;
}

#pastWonders td {
  padding-right: 1em;
}

.wonderCompleted button {
  width: 5em;
}

#lowResources {
  display: none;
  color: red;
}
</style>
