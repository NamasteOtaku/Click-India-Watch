const select = document.getElementById("channelSelect")
const statusBox = document.getElementById("status")
const video = document.getElementById("player")

fetch("/channels.json")
  .then(r => r.json())
  .then(channels => {
    if (!channels.length) {
      statusBox.innerText = "No channels loaded"
      return
    }

    channels.forEach(c => {
      const opt = document.createElement("option")
      opt.value = c.name
      opt.innerText = c.name
      select.appendChild(opt)
    })

    // Auto-select first channel
    select.value = channels[0].name
  })
  .catch(err => {
    statusBox.innerText = "Failed to load channels.json"
  })

function play() {
  const channel = select.value

  if (!channel) {
    statusBox.innerText = "No channel selected"
    return
  }

  const url = `/api/stream?channel=${encodeURIComponent(channel)}`
  statusBox.innerText = "Requesting: " + url

  if (Hls.isSupported()) {
    const hls = new Hls()
    hls.loadSource(url)
    hls.attachMedia(video)
    hls.on(Hls.Events.ERROR, (_, data) => {
      statusBox.innerText = JSON.stringify(data, null, 2)
    })
  } else {
    video.src = url
  }
}