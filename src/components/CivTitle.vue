<template>
<div class="civ-title">
  <div class="d-flex justify-content-end sticky-top py-1 px-2">
    <div id="header" class="mr-auto">
      <h4> The <span id="civType">Thorp</span> of {{curCiv.civName}}<br>
        <small id="ruler" class="text-muted">Ruled by the {{appellation}} {{curCiv.rulerName}}</small>
      </h4>
    </div>
    <div class="btn-group align-items-end" role="group">
      <button type="button" class="btn btn-secondary">I / E</button>
    </div>
    <a class="nav-item nav-link" href="civFAQ.html" target="_blank">FAQ / Instructions / Bugfixing</a>
    <a class="nav-item nav-link" href="civUpdates.html" target="_blank">Game Updates Log</a>
    <a class="nav-item nav-link" href="#" onclick="impExp()">Import/Export Save</a>
    <span id="versionAlert"><span class="nav-item nav-link" id="newVersionText" onclick="location.reload()">New Version Available</span></span>
    <menus></menus>
  </div>
</div>
</template>

<script>
import Menus from './Menus'

export default {
  name:       'civ-title',
  props:      ['curCiv'],
  components: {
    Menus,
  },
  data() {
    return {
      appellation: 'mighty',
    }
  },
}
</script>

<style scoped>
#ruler {
  padding-left: 1em;
}

#versionAlert {
  display: none;
}

#newVersionText {
  color: #f00;
  text-decoration: underline;
}

#newVersionText:hover {
  cursor: pointer;
}
</style>
