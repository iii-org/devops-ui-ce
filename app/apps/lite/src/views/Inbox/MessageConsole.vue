<template>
  <Console />
</template>

<script>
export default {
  name: 'MessageConsole',
  components: {
    Console: () => import('@shared/views/Inbox/MessageConsole')
  }
}
</script>
