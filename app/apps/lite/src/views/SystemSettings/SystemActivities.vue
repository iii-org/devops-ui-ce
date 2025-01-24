<template>
  <Activities />
</template>

<script>
export default {
  components: {
    Activities: () => import('@shared/views/SystemSettings/SystemActivities')
  }
}
</script>
