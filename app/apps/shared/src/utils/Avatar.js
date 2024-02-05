import crypto from 'crypto'
const backgroundColors = [
  '#479edc', '#2fc7c9', '#5AB1EF', '#a57548', '#2EC7C9',
  '#C6B38E', '#B6A2DE', '#8D98B3', '#5f6769', '#005f73',
  '#363a3a', '#61a0a8', '#51557E', '#89c9b8', '#d87c7c',
  '#6e7074', '#816797', '#e3CCae', '#D87A80', '#d7ab82']

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
  const theshold = 125
  // sets the foreground color
  if (hsp > theshold) return '#000000'
  return '#ffffff'
}

export function backgroundColor (username) {
  return randomBackgroundColor(
    username.length + username.charCodeAt() + username.charCodeAt(username.length - 1),
    backgroundColors
  )
}

export function fontColor (username) {
  return lightenColor(backgroundColor(username))
}

export function generateAvatarUrl (username, emailAddress) {
  const processedName = username.toString().replace(/( )+/g, '+')
  const defaultImage = encodeURIComponent(
    `https://ui-avatars.com/api/${processedName}/80/${backgroundColor(username).replace('#', '')}/${fontColor(username).replace('#', '')}`
  )
  const emailHash = crypto
    .createHash('md5')
    .update(emailAddress)
    .digest('hex')
  return `https://www.gravatar.com/avatar/${emailHash}?d=${defaultImage}`
}
