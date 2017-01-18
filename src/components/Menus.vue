<template>
  <div class="menus">
    <div id="strip">
      <div id="stripInner">
        <a href="civFAQ.html" target="_blank">FAQ / Instructions / Bugfixing</a> -
        <a href="civUpdates.html" target="_blank">Game Updates Log</a> -
        <a href="#" onclick="impExp()">Import/Export Save</a>
        <span id="versionAlert"> - <span id="newVersionText" onclick="location.reload()">New Version Available</span></span>
      </div>
    </div>

    <div id="impexp">
      <textarea id="impexpField"></textarea>
      <button id="expButton" onclick="save('export')">Export</button>
      <button id="expSelect" onclick="document.getElementById('impexpField').select();">Select All</button>
      <button id="impexpClose" onclick="impExp()">Close</button>
      <button id="impButton" onclick="load('import')">Import</button>
    </div>

  </div>
</template>

<script>
export default {
  name: 'menus',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
