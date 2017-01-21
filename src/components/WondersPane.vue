<template>
<div class="wonders-pane card" id="wondersContainer">
  <h4 class="card-header">Wonders</h4>
  <div class="card-block">
    <!-- <h4 class="card-title">Wonders</h4> -->
    <span id="startWonderLine">
      <button id="startWonder" onmousedown="startWonder()">Start Building Wonder</button>
    </span>
    <div id="wonderCompleted">
      <div class="wonderTitle"><span id="wonderNameC">Wonder</span> Completed! Choose Bonus:</div>
    </div>
    <div class="row">
      <div v-show="wonderInProgress" class="col">
        <!-- FIXME: really should be v-if -->
        <div class="">Progress on {{curCiv.curWonder.name}}: {{progressDisplay}}%</div>
        <div class="progress">
          <div class="progress-bar bg-success" role="progressbar" v-bind:style="{width: curCiv.curWonder.progress + '%'}" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
            {{progressDisplay}}%
          </div>
        </div>
        <div id="lowResources">Limited<span id="limited"> by low resources</span></div>
        <div>
          <button id="speedWonder" class="btn btn-primary btn-sm" onmousedown="speedWonder()">Speed Wonder</button>
          <span class="cost">100 gold</span><span class="note">: Increase wonder progress</span>
        </div>
        <div>
          <button id="renameWonder" class="btn btn-outline-info btn-sm" onmousedown="renameWonder()">Rename Wonder</button>
        </div>
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
