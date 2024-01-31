const backgroundColors = [
  '#F44336', '#FF4081', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688',
  '#4CAF50', '#8BC34A', '#CDDC39', /* '#FFEB3B' , */ '#FFC107',
  '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B']

function randomBackgroundColor (seed, colors) {
  return colors[seed % (colors.length)]
}
function lightenColor (hex) {
  if (hex[0] === '#') {
    hex = hex.slice(1)
  }
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 2), 16)
  const b = parseInt(hex.substring(4, 2), 16)
  const hsp = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
  )
  const theshold = 160
  // sets the foreground color
  if (hsp > theshold) return '#000000'
  return '#ffffff'
}

export function backgroundColor (username) {
  return randomBackgroundColor(username.length, backgroundColors).replace('#', '')
}

export function fontColor (username) {
  return lightenColor(backgroundColor(username)).replace('#', '')
}
