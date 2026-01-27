const select = document.getElementById("channelSelect")
const statusBox = document.getElementById("status")
const video = document.getElementById("player")

fetch("/channels.json")
  .then(r => r.json())
  .then(channels => {
    channels.forEach(c => {
      const opt = document.createElement("option")
      opt.value = c.name
      opt.innerText = c.name
      select.appendChild(opt)
    })
  })

function play() {
  const channel = select.value
  const url = `/api/stream?channel=${encodeURIComponent(channel)}`

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