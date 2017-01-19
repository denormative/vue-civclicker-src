<template>
<div class="menus float-right">
  <div>
    <!-- <a href="civFAQ.html" target="_blank">FAQ / Instructions / Bugfixing</a><br>
    <a href="civUpdates.html" target="_blank">Game Updates Log</a><br>
    <a href="#" onclick="impExp()">Import/Export Save</a><br>
    <span id="versionAlert"> - <span id="newVersionText" onclick="location.reload()">New Version Available</span></span> -->
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
  data() {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
