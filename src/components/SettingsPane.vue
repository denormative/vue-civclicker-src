<template>
<div role="tabpanel" id="settingsPane" class="settings-pane tab-pane card">
  <h4 class="card-header">Settings</h4>
  <div class="card-block">
    <div id="settings">
      <button class="btn btn-primary btn-sm" onmousedown="save('manual')" title="Save your current stats">Manual Save</button>
      <button class="btn btn-warning btn-sm" onmousedown="reset()" title="Reset your game">Reset Game</button>
      <span class="note">
        <span id="resetNote"><br>Resetting allows you to </span>
        <span id="resetDeity">gain another deity</span>
        <span id="resetBoth"><br> and </span>
        <span id="resetWonder">build another Wonder</span>
      </span>
      <br>
      <button class="btn btn-danger btn-sm" @click="deleteSave()" title="Delete your saved stats">Delete Save File</button>
      <br>
      <button class="btn btn-secondary btn-sm" onmousedown="renameCiv()" title="Rename your civilisation">Rename Civilisation</button>
      <button class="btn btn-secondary btn-sm" id="renameRuler" onmousedown="renameRuler()" title="Rename yourself">Rename Yourself</button>
      <button class="btn btn-secondary btn-sm" id="renameDeity" onmousedown="renameDeity()" title="Rename your deity" disabled="disabled">Rename Current Deity</button>
      <br>
      <span id="textSize">
        <button class="btn btn-secondary btn-sm" id="smallerText" @click="textSize(-1)" title="Smaller Text" :disabled="settings.fontSize <= 0.5">&minus;</button>
        Text Size
        <button class="btn btn-secondary btn-sm" id="largerText" @click="textSize(1)" title="Larger Text">+</button></span>
      <br>
      <label><input id="toggleAutosave" type="checkbox" v-model="settings.autosave" title="Autosave"/>Autosave</label><br>
      <label><input id="toggleCustomQuantities" type="checkbox" v-model="settings.customIncr" title="Custom Quantity"/>Use Custom Quantities</label><br>
      <label><input id="toggleDelimiters" type="checkbox" v-model="settings.delimiters" title="Toggle Delimiters"/>Number Delimiters</label><br>
      <label><input id="toggleShadow" type="checkbox" v-model="settings.textShadow" title="Toggle Text Shadow"/>Text Shadows</label><br>
      <label><input id="toggleNotes" type="checkbox" v-model="settings.notes" title="Toggle Notes"/>Show Notes</label><br>
      <label><input id="toggleWorksafe" type="checkbox" v-model="settings.worksafe" title="Toggle Worksafe Mode"/>Worksafe Mode</label><br>
      <label><input id="toggleIcons" type="checkbox" v-model="settings.useIcons" title="Toggle Icons"/>Use Icons</label><br>
    </div>
  </div>
</div>
</template>

<script>
export default {
  name: 'settings-pane',
  props: ['settings'],
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {})
  },
  methods: {
    // value is the desired change in 0.1em units.
    textSize(value) {
      if (value !== undefined) {
        this.settings.fontSize += 0.1 * value
      }
    },
    deleteSave() {
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
  },
  watch: {
    'settings.worksafe': function() {
      // xxx Should this be applied to the document instead of the body?
      if (this.settings.worksafe) {
        document.getElementsByTagName('body')[0].classList.remove('hasBackground')
      }
      else {
        document.getElementsByTagName('body')[0].classList.add('hasBackground')
      }
    },
    'settings.useIcons': function() {
      const elems = document.getElementsByClassName('icon')
      for (let i = 0; i < elems.length; ++i) {
        // Worksafe implies no icons.
        elems[i].style.visibility = (this.settings.useIcons && !this.settings.worksafe) ? 'visible' : 'hidden'
      }
    },
    'settings.customIncr': function() {
      let elems

      const curPop = window.vm.population.current + window.vm.curCiv.zombie.owned

      elems = document.getElementsByClassName('unit10')
      for (let i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !this.settings.customIncr && (curPop >= 10))
      }

      elems = document.getElementsByClassName('unit100')
      for (let i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !this.settings.customIncr && (curPop >= 100))
      }

      elems = document.getElementsByClassName('unit1000')
      for (let i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !this.settings.customIncr && (curPop >= 1000))
      }

      elems = document.getElementsByClassName('unitInfinity')
      for (let i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !this.settings.customIncr && (curPop >= 1000))
      }

      elems = document.getElementsByClassName('building10')
      for (let i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !this.settings.customIncr && (curPop >= 100))
      }

      elems = document.getElementsByClassName('building100')
      for (let i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !this.settings.customIncr && (curPop >= 1000))
      }

      elems = document.getElementsByClassName('building1000')
      for (let i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !this.settings.customIncr && (curPop >= 10000))
      }

      elems = document.getElementsByClassName('buildingInfinity')
      for (let i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], !this.settings.customIncr && (curPop >= 10000))
      }

      elems = document.getElementsByClassName('buycustom')
      for (let i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], this.settings.customIncr)
      }
    },
    'settings.notes': function() {
      // Toggles the display of the .notes class
      const elems = document.getElementsByClassName('note')
      for (let i = 0; i < elems.length; ++i) {
        window.setElemDisplay(elems[i], this.settings.notes)
      }
    },
    'settings.textShadow': function() {
      const shadowStyle = '3px 0 0 #fff, -3px 0 0 #fff, 0 3px 0 #fff, 0 -3px 0 #fff' +
        ', 2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff'
      document.getElementsByTagName('body')[0].style.textShadow = this.settings.textShadow ? shadowStyle : 'none'
    },
    'settings.fontSize': function() {
      // xxx Should this be applied to the document instead of the body?
      document.getElementsByTagName('body')[0].style.fontSize = `${this.settings.fontSize}em`
    },
  },
}
</script>

<style scoped>
#resetNote,
#resetDeity,
#resetBoth,
#resetWonder {
  display: none;
}
</style>
