<template>
  <div class="events-pane card">
    <h4 class="card-header">Events</h4>
    <div id="eventsContainer" class="card-block">
      <table id="logTable">
        <tr id="log0">
          <td id="logT"></td>
          <td id="logL"></td>
          <td id="logR"></td>
        </tr>
        <tr id="log1">
          <td colspan="3"></td>
        </tr>
        <tr id="log2">
          <td colspan="3"></td>
        </tr>
        <tr id="log3">
          <td colspan="3"></td>
        </tr>
        <tr id="log4">
          <td colspan="3"></td>
        </tr>
        <!-- <tr id="log5"><td colspan="3"></td></tr>
            <tr id="log6"><td colspan="3"></td></tr>
            <tr id="log7"><td colspan="3"></td></tr>
            <tr id="log8"><td colspan="3"></td></tr>
            <tr id="log9"><td colspan="3"></td></tr> -->
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'events-pane',
  data () {
    return {
    }
  },
}
</script>

<style scoped>
#logTable td {
  padding-right: 20px;
}
</style>
