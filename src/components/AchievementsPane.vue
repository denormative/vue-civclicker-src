<template>
<div role="tabpanel" id="achievementsPane" class="achievements-pane tab-pane card">
  <h4 class="card-header" v-show="settings.showHeaders">Achievements</h4>
  <div class="card-block">
    <div class="d-flex flex-row flex-wrap justify-content-center">
      <div v-for="achObj in achData">
        <div v-if="achObj.owned" class="card card-outline-success text-center m-2" style="width: 8rem; height: 8rem;">
          <div class="card-block">
            <!-- <img class="card-img-top" src="" :alt="achObj.getQtyName()"> -->
            <p class="card-text" v-html="achObj.getQtyName()"></p>
          </div>
        </div>
        <div v-else="" class="card card-outline-secondary text-center m-2" style="width: 8rem; height: 8rem;">
          <img class="card-img" src="/static/civclicker/images/achLocked.jpg" alt="?" style="width: 100%; height: 100%;">
        </div>
      </div>
    </div>
    <div v-for="achObj in achData">
      <!-- true:  Generate a line break -->
      <div v-if="achObj === true">
        <div style='clear:both;'><br></div>
      </div>
      <!-- false: Generate a gap -->
      <div v-else-if="achObj === false">
        <div class='break'>&nbsp;</div>
      </div>
      <!-- An achievement (or civ size) object: Generate the display of that achievement -->
      <div v-else="">
        <div class='achievement' :title='achObj.getQtyName()'>
          <div class='unlockedAch' :id='achObj.id'>{{achObj.getQtyName()}}</div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name:  'achievements-pane',
  props: ['achData'],
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {})
  },
  computed: {
    ...mapState(['settings']),
  },
  methods: {},
}
</script>

<style>
.achievement {
  display: inline-block;
  float: left;
  width: 50px;
  height: 50px;
  border: 2px solid black;
  background-color: #aaa;
  background-image: url('/static/civclicker/images/achLocked.jpg');
}

.unlockedAch {
  box-sizing: border-box;
  -moz-box-sizing: border-box;
  /* Firefox needs a nonstandard name */
  width: 100%;
  height: 100%;
  padding: 0.2em;
  font-size: 0.9em;
  text-shadow: none;
  font-weight: normal;
  background-color: #fff;
  display: none;
  /* Initially */
}
</style>
