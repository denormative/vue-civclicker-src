<template>
<div role="tabpanel" id="settingsPane" class="settings-pane tab-pane">
  <div id="settings">
    <h3>Settings</h3>
    <button class="btn btn-primary btn-sm" onmousedown="save('manual')" title="Save your current stats">Manual Save</button><br>
    <label><input id="toggleAutosave" type="checkbox" @click="onToggleAutosave(this)" title="Autosave"/>Autosave</label><br>
    <button class="btn btn-warning btn-sm" onmousedown="reset()" title="Reset your game">Reset Game</button><span class="note"><span id="resetNote"><br>Resetting allows you to </span><span id="resetDeity">gain another deity</span><span id="resetBoth"><br> and </span><span id="resetWonder">build another Wonder</span></span><br>
    <br>
    <button class="btn btn-danger btn-sm" @click="deleteSave()" title="Delete your saved stats">Delete Save File</button><br>
    <br>
    <button class="btn btn-secondary btn-sm" onmousedown="renameCiv()" title="Rename your civilisation">Rename Civilisation</button><br>
    <button class="btn btn-secondary btn-sm" id="renameRuler" onmousedown="renameRuler()" title="Rename yourself">Rename Yourself</button><br>
    <button class="btn btn-secondary btn-sm" id="renameDeity" onmousedown="renameDeity()" title="Rename your deity" disabled="disabled">Rename Current Deity</button><br>
    <br>
    <span id="textSize"><button class="btn btn-secondary btn-sm" id="smallerText" @click="textSize(-1)" title="Smaller Text">&minus;</button>Text Size
              <button class="btn btn-secondary btn-sm" id="largerText" @click="textSize(1)" title="Larger Text">+</button></span><br>
    <br>
    <label><input id="toggleCustomQuantities" type="checkbox" @click="onToggleCustomQuantities(this)" title="Custom Quantity"/>Use Custom Quantities</label><br>
    <label><input id="toggleDelimiters" type="checkbox" @click="onToggleDelimiters(this)" title="Toggle Delimiters"/>Number Delimiters</label><br>
    <label><input id="toggleShadow" type="checkbox" @click="onToggleShadow(this)" title="Toggle Text Shadow"/>Text Shadows</label><br>
    <label><input id="toggleNotes" type="checkbox" @click="onToggleNotes(this)" title="Toggle Notes"/>Show Notes</label><br>
    <label><input id="toggleWorksafe" type="checkbox" @click="onToggleWorksafe(this)" title="Toggle Worksafe Mode"/>Worksafe Mode</label><br>
    <label><input id="toggleIcons" type="checkbox" @click="onToggleIcons(this)" title="Toggle Icons"/>Use Icons</label><br>
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
      this.setAutosave()
      this.setCustomQuantities()
      this.textSize(0)
      this.setDelimiters()
      this.setShadow()
      this.setNotes()
      this.setWorksafe()
      this.setIcons()
    },
    // value is the desired change in 0.1em units.
    textSize(value) {
      if (value !== undefined) {
        window.vm.settings.fontSize += 0.1 * value
      }
      document.getElementById('smallerText').disabled = (window.vm.settings.fontSize <= 0.5)

      // xxx Should this be applied to the document instead of the body?
      document.getElementsByTagName('body')[0].style.fontSize = `${window.vm.settings.fontSize}em`
    },
    deleteSave() { // eslint-disable-line no-unused-vars
      // Deletes the current savegame by setting the game's cookies to expire in the past.
      if (!confirm('Really delete save?')) { // eslint-disable-line no-alert
        return
      } // Check the player really wanted to do that.

      try {
        window.deleteCookie(window.vm.saveTag)
        window.deleteCookie(window.vm.saveTag2)
        localStorage.removeItem(window.vm.saveTag)
        localStorage.removeItem(window.vm.saveTag2)
        localStorage.removeItem(window.vm.saveSettingsTag)
        window.gameLog('Save Deleted')
      }
      catch (err) {
        window.handleStorageError(err)
        alert('Save Deletion Failed!') // eslint-disable-line no-alert
      }
    },
    setAutosave(value) {
      if (value !== undefined) {
        window.vm.settings.autosave = value
      }
      document.getElementById('toggleAutosave').checked = window.vm.settings.autosave
    },
    onToggleAutosave(control) { // eslint-disable-line no-unused-vars
      return this.setAutosave(control.checked)
    },
    setCustomQuantities(value) {
      let i
      let elems
      const curPop = window.vm.population.current + window.vm.curCiv.zombie.owned

      if (value !== undefined) {
        window.vm.settings.customIncr = value
      }
      document.getElementById('toggleCustomQuantities').checked = window.vm.settings.customIncr

      window.setElemDisplay('customPartyQuantity', window.vm.settings.customIncr)
      window.setElemDisplay('customBuildQuantity', window.vm.settings.customIncr)
      window.setElemDisplay('customSpawnQuantity', window.vm.settings.customIncr)

      elems = document.getElementsByClassName('unit10')
      for (i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 10))
      }

      elems = document.getElementsByClassName('unit100')
      for (i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 100))
      }

      elems = document.getElementsByClassName('unit1000')
      for (i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 1000))
      }

      elems = document.getElementsByClassName('unitInfinity')
      for (i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 1000))
      }

      elems = document.getElementsByClassName('building10')
      for (i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 100))
      }

      elems = document.getElementsByClassName('building100')
      for (i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 1000))
      }

      elems = document.getElementsByClassName('building1000')
      for (i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 10000))
      }

      elems = document.getElementsByClassName('buildingInfinity')
      for (i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !window.vm.settings.customIncr && (curPop >= 10000))
      }

      elems = document.getElementsByClassName('buycustom')
      for (i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], window.vm.settings.customIncr)
      }
    },
    onToggleCustomQuantities(control) { // eslint-disable-line no-unused-vars
      return this.setCustomQuantities(control.checked)
    },
    // Toggles the display of the .notes class
    setNotes(value) {
      if (value !== undefined) {
        window.vm.settings.notes = value
      }
      document.getElementById('toggleNotes').checked = window.vm.settings.notes

      let i
      const elems = document.getElementsByClassName('note')
      for (i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], window.vm.settings.notes)
      }
    },
    onToggleNotes(control) { // eslint-disable-line no-unused-vars
      return this.setNotes(control.checked)
    },
    setShadow(value) {
      if (value !== undefined) {
        window.vm.settings.textShadow = value
      }
      document.getElementById('toggleShadow').checked = window.vm.settings.textShadow
      const shadowStyle = '3px 0 0 #fff, -3px 0 0 #fff, 0 3px 0 #fff, 0 -3px 0 #fff' +
        ', 2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff'
      document.getElementsByTagName('body')[0].style.textShadow = window.vm.settings.textShadow ? shadowStyle : 'none'
    },
    onToggleShadow(control) { // eslint-disable-line no-unused-vars
      return this.setShadow(control.checked)
    },
    // Does nothing yet, will probably toggle display for "icon" and "word" classes
    // as that's probably the simplest way to do this.
    setIcons(value) {
      if (value !== undefined) {
        window.vm.settings.useIcons = value
      }
      document.getElementById('toggleIcons').checked = window.vm.settings.useIcons

      let i
      const elems = document.getElementsByClassName('icon')
      for (i = 0; i < elems.length; ++i) {
        // Worksafe implies no icons.
        elems[i].style.visibility = (window.vm.settings.useIcons && !window.vm.settings.worksafe) ? 'visible' : 'hidden'
      }
    },
    onToggleIcons(control) { // eslint-disable-line no-unused-vars
      return this.setIcons(control.checked)
    },
    setDelimiters(value) {
      if (value !== undefined) {
        window.vm.settings.delimiters = value
      }
      document.getElementById('toggleDelimiters').checked = window.vm.settings.delimiters
      // updateResourceTotals() // FIXME: re-enable later or just remove since they'll autoupdate
    },
    onToggleDelimiters(control) { // eslint-disable-line no-unused-vars
      return this.setDelimiters(control.checked)
    },
    setWorksafe(value) {
      if (value !== undefined) {
        window.vm.settings.worksafe = value
      }
      document.getElementById('toggleWorksafe').checked = window.vm.settings.worksafe

      // xxx Should this be applied to the document instead of the body?
      if (window.vm.settings.worksafe) {
        document.getElementsByTagName('body')[0].classList.remove('hasBackground')
      }
      else {
        document.getElementsByTagName('body')[0].classList.add('hasBackground')
      }

      this.setIcons() // Worksafe overrides icon settings.
    },
    onToggleWorksafe(control) { // eslint-disable-line no-unused-vars
      return this.setWorksafe(control.checked)
    },
  },
}
</script>

<style scoped>
#resetNote, #resetDeity, #resetBoth, #resetWonder {
  display: none;
}
</style>
