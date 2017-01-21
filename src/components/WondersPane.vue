<template>
<div class="wonders-pane">
  <div id="wondersContainer">
    <h3>Wonders</h3>
    <span id="startWonderLine"><button id="startWonder" onmousedown="startWonder()">Start Building Wonder</button></span>
    <div id="wonderInProgress">
      <span class="wonderTitle">Progress on <span id="wonderNameP">Wonder</span> - <span id="progressNumber">0</span>%</span> - <button id="renameWonder" onmousedown="renameWonder()">Rename</button>
      <div id="progressContainer">
        <div id="progressBar"></div>
      </div>
      <div id="lowResources">Limited<span id="limited"> by low resources</span></div>
      <div id="speedWonderGroup"><br><button id="speedWonder" onmousedown="speedWonder()">Speed Wonder</button>
        <span id="speedWonderCost" class="cost">100 gold</span><span class="note">: Increase wonder progress</span></div>
    </div>
    <div id="wonderCompleted">
      <div class="wonderTitle"><span id="wonderNameC">Wonder</span> Completed! Choose Bonus:</div>
    </div>
    <table id="pastWonders">
      <tr>
        <td></td>
      </tr>
    </table>
  </div>
</div>
</template>

<script>
export default {
  name: 'wonders-pane',
  props: ['curCiv'],
  data() {
    return {}
  }
}
</script>

<style>
#wondersContainer {
  display: none;
  padding-bottom: 0.3em;
}

#startWonderLine {
  display: none;
}

#pastWonders td {
  padding-right: 1em;
}

.wonderTitle {
  font-weight: bold;
  margin-bottom: 1em;
}

#renameWonder {
  width: 5em;
}

#progressContainer {
  border: 1px solid black;
}

#progressBar {
  height: 1em;
  background-color: green;
  width: 0%;
}

#wonderInProgress {
  display: none;
}

#speedWonderGroup {
  display: none;
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
