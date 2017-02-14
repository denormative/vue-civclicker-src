<template>
<!-- Display this section if we have any wonders or could build one. -->
<div class="wonders-pane card" v-show="haveWonderTech || curCiv.wonders.length > 0">
  <h4 class="card-header" v-show="!wonderInProgress">Wonders</h4>
  <h4 class="card-header" v-show="wonderInProgress">Wonders: {{curCiv.curWonder.name}}
    <div class="btn-group float-right" role="group"> <!-- FIXME: should be v-if -->
      <button class="btn btn-outline-info btn-sm" @click="renameWonder()">Rename</button>
      <button id="speedWonder" class="btn btn-outline-primary btn-sm" @click="speedWonder()"
          data-content="<b>100 gold</b><br> Increase wonder progress by 1%"
          :disabled="curCiv.curWonder.stage !== 1 || !canAfford({gold: 100})">
        Speed
      </button>
    </div>
  </h4>
  <div class="card-block">
    <div class="row">
      <!-- Can start building a wonder, but haven't yet. -->
      <div class="col" align="center" v-show="haveWonderTech && curCiv.curWonder.stage === 0">
        <button class="btn btn-success btn-lg" @click="startWonder()">
          Start Building Wonder
        </button>
      </div>
      <!-- Finished, but haven't picked the resource yet -->
      <div id="wonderCompleted" v-show="wonderCompleted" class="col">
        <h5 class="text-success text-center"><b>{{curCiv.curWonder.name}}</b> Completed!</h5>
        <div>Choose Bonus:</div>
      </div>
      <div v-show="wonderInProgress" class="col">
        <!-- FIXME: really should be v-if not v-show -->
        <div class="text-center">Progress on <b>{{curCiv.curWonder.name}}</b></div>
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
import { mapState, mapGetters } from 'vuex'

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
    ...mapState(['curCiv', 'civData']),
    ...mapGetters(['haveWonderTech']),
    progressDisplay() {
      return this.curCiv.curWonder.progress.toFixed(2)
    },
  },
  methods: {
    canAfford(...args) { return window.canAfford(args) },
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
      this.$store.commit('setWonderStage', this.curCiv.curWonder.stage + 1)
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
      this.$store.commit('setWonderName', n)
    },
    speedWonder() {
      this.$store.commit('rushWonder')
      window.updateWonder()
    },
  },
}
</script>

<style>
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
