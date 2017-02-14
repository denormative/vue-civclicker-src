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
</style>
