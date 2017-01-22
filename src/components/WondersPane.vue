<template>
<div class="wonders-pane card" id="wondersContainer">
  <h4 class="card-header">Wonders
    <div class="btn-group float-right" role="group" v-show="wonderInProgress"> <!-- FIXME: should be v-if -->
      <button id="renameWonder" class="btn btn-outline-info btn-sm" onmousedown="renameWonder()">Rename</button>
      <button id="speedWonder" class="btn btn-outline-primary btn-sm" onmousedown="speedWonder()"
          data-content="<b>100 gold</b><br> Increase wonder progress by 1%">Speed</button>
    </div>
  </h4>
  <div class="card-block">
    <span id="startWonderLine">
      <button id="startWonder" onmousedown="startWonder()">Start Building Wonder</button>
    </span>
    <div id="wonderCompleted">
      <div class="wonderTitle"><span id="wonderNameC">Wonder</span> Completed! Choose Bonus:</div>
    </div>
    <div class="row">
      <div v-show="wonderInProgress" class="col">
        <!-- FIXME: really should be v-if not v-show -->
        <div class="">Progress on <b>{{curCiv.curWonder.name}}</b></div>
        <div class="progress" style="line-height: 1.5rem; font-size: 1rem">
          <div class="progress-bar bg-success" style="height: 1.5rem" role="progressbar" v-bind:style="{width: curCiv.curWonder.progress + '%'}"
              aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
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
export default {
  name: 'wonders-pane',
  props: ['curCiv', 'wonderInProgress'],
  data() {
    return {}
  },
  created: function() {
    this.$nextTick(() => {
      // window.$('[data-toggle="popover"]').popover()
      window.$('#speedWonder').popover({
        trigger: 'hover',
        placement: 'left',
        html: true
      })
    })
  },
  computed: {
    progressDisplay: function() {
      return this.curCiv.curWonder.progress.toFixed(2)
    }
  }
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

#wonderCompleted {
  padding-top: 1em;
  display: none;
}

.wonderCompleted button {
  width: 5em;
}

#lowResources {
  display: none;
  color: red;
}
</style>
