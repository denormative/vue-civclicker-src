<template>
<div role="tabpanel" id="settingsPane" class="settings-pane tab-pane">
  <div id="settings">
    <h3>Settings</h3>
    <button class="btn btn-primary btn-sm" onmousedown="save('manual')" title="Save your current stats">Manual Save</button><br>
    <label><input id="toggleAutosave" type="checkbox" onclick="onToggleAutosave(this)" title="Autosave"/>Autosave</label><br>
    <button class="btn btn-warning btn-sm" onmousedown="reset()" title="Reset your game">Reset Game</button><span class="note"><span id="resetNote"><br>Resetting allows you to </span><span id="resetDeity">gain another deity</span><span id="resetBoth"><br> and </span><span id="resetWonder">build another Wonder</span></span><br>
    <br>
    <button class="btn btn-danger btn-sm" onmousedown="deleteSave()" title="Delete your saved stats">Delete Save File</button><br>
    <br>
    <button class="btn btn-secondary btn-sm" onmousedown="renameCiv()" title="Rename your civilisation">Rename Civilisation</button><br>
    <button class="btn btn-secondary btn-sm" id="renameRuler" onmousedown="renameRuler()" title="Rename yourself">Rename Yourself</button><br>
    <button class="btn btn-secondary btn-sm" id="renameDeity" onmousedown="renameDeity()" title="Rename your deity" disabled="disabled">Rename Current Deity</button><br>
    <br>
    <span id="textSize"><button class="btn btn-secondary btn-sm" id="smallerText" onmousedown="textSize(-1)" title="Smaller Text">&minus;</button>Text Size
              <button class="btn btn-secondary btn-sm" id="largerText" onmousedown="textSize(1)" title="Larger Text">+</button></span><br>
    <br>
    <label><input id="toggleCustomQuantities" type="checkbox" onclick="onToggleCustomQuantities(this)" title="Custom Quantity"/>Use Custom Quantities</label><br>
    <label><input id="toggleDelimiters" type="checkbox" onclick="onToggleDelimiters(this)" title="Toggle Delimiters"/>Number Delimiters</label><br>
    <label><input id="toggleShadow" type="checkbox" onclick="onToggleShadow(this)" title="Toggle Text Shadow"/>Text Shadows</label><br>
    <label><input id="toggleNotes" type="checkbox" onclick="onToggleNotes(this)" title="Toggle Notes"/>Show Notes</label><br>
    <label><input id="toggleWorksafe" type="checkbox" onclick="onToggleWorksafe(this)" title="Toggle Worksafe Mode"/>Worksafe Mode</label><br>
    <label><input id="toggleIcons" type="checkbox" onclick="onToggleIcons(this)" title="Toggle Icons"/>Use Icons</label><br>
  </div>
</div>
</template>

<script>
export default {
  name: 'settings-pane',
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {
      this.updateSettings()
    })
  },
  methods: {
    updateSettings() {
      // Here, we ensure that UI is properly configured for our settings.
      // Calling these with no parameter makes them update the UI for the current values.
      window.setAutosave()
      window.setCustomQuantities()
      window.textSize(0)
      window.setDelimiters()
      window.setShadow()
      window.setNotes()
      window.setWorksafe()
      window.setIcons()
    },
  },
}
</script>

<style scoped>
#resetNote, #resetDeity, #resetBoth, #resetWonder {
  display: none;
}
</style>
