<template>
  <div class="settings-pane">
    <div id="settingsPane" class="selectPane">
      <div id="settings">
        <h3>Settings</h3>
        <button onmousedown="save('manual')" title="Save your current stats">Manual Save</button><br>
        <label><input id="toggleAutosave" type="checkbox" onclick="onToggleAutosave(this)" title="Autosave"/>Autosave</label><br>
        <button onmousedown="reset()" title="Reset your game">Reset Game</button><span class="note"><span id="resetNote"><br>Resetting allows you to </span><span id="resetDeity">gain another deity</span><span id="resetBoth"><br> and </span><span id="resetWonder">build another Wonder</span></span><br>
        <br>
        <button onmousedown="deleteSave()" title="Delete your saved stats">Delete Save File</button><br>
        <br>
        <button onmousedown="renameCiv()" title="Rename your civilisation">Rename Civilisation</button><br>
        <button id="renameRuler" onmousedown="renameRuler()" title="Rename yourself">Rename Yourself</button><br>
        <button id="renameDeity" onmousedown="renameDeity()" title="Rename your deity" disabled="disabled">Rename Current Deity</button><br>
        <br>
        <span id="textSize"><button id="smallerText" onmousedown="textSize(-1)" title="Smaller Text">&minus;</button>Text Size
              <button id="largerText" onmousedown="textSize(1)" title="Larger Text">+</button></span><br>
        <br>
        <label><input id="toggleCustomQuantities" type="checkbox" onclick="onToggleCustomQuantities(this)" title="Custom Quantity"/>Use Custom Quantities</label><br>
        <label><input id="toggleDelimiters" type="checkbox" onclick="onToggleDelimiters(this)" title="Toggle Delimiters"/>Number Delimiters</label><br>
        <label><input id="toggleShadow" type="checkbox" onclick="onToggleShadow(this)" title="Toggle Text Shadow"/>Text Shadows</label><br>
        <label><input id="toggleNotes" type="checkbox" onclick="onToggleNotes(this)" title="Toggle Notes"/>Show Notes</label><br>
        <label><input id="toggleWorksafe" type="checkbox" onclick="onToggleWorksafe(this)" title="Toggle Worksafe Mode"/>Worksafe Mode</label><br>
        <label><input id="toggleIcons" type="checkbox" onclick="onToggleIcons(this)" title="Toggle Icons"/>Use Icons</label><br>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'settings-pane',
  data () {
    return {
    }
  }
}
</script>

<style scoped>
</style>