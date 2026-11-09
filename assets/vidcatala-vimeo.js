// Expose the playback state used by the original lesson clip buttons.
function createVidcatVimeoPlayer(iframe) {
  const player = window.Vimeo ? new Vimeo.Player(iframe) : null;
  const events = new EventTarget();
  let currentTime = 0;
  let paused = true;
  let seek = null;
  let request = 0;
  const status = document.createElement("p");
  status.className = "vimeo-status";
  status.setAttribute("role", "status");
  status.hidden = true;
  iframe.parentElement.after(status);

  function reportFailure() {
    paused = true;
    status.textContent = "Si el fragment no arrenca, prem Reprodueix al vídeo i torna-ho a provar.";
    status.hidden = false;
    events.dispatchEvent(new Event("pause"));
  }

  if (player) {
    player.on("play", () => {
      paused = false;
      status.hidden = true;
    });
    player.on("pause", () => {
      paused = true;
      events.dispatchEvent(new Event("pause"));
    });
    player.on("ended", () => {
      paused = true;
    });
    player.on("timeupdate", ({ seconds }) => {
      if (seek) return;
      currentTime = seconds;
      events.dispatchEvent(new Event("timeupdate"));
    });
  }

  return {
    get currentTime() { return currentTime; },
    set currentTime(seconds) {
      currentTime = seconds;
      seek = { seconds };
    },
    get paused() { return paused; },
    async play() {
      const playback = ++request;
      const pendingSeek = seek;
      try {
        if (!player) throw new Error("Vimeo SDK unavailable");
        if (pendingSeek) {
          const seconds = await player.setCurrentTime(pendingSeek.seconds);
          if (playback !== request) return;
          currentTime = seconds;
        }
        seek = null;
        await player.play();
      } catch {
        if (playback === request) {
          seek = null;
          reportFailure();
        }
      }
    },
    async pause() {
      ++request;
      seek = null;
      if (player) {
        try {
          await player.pause();
          paused = true;
        } catch {
          reportFailure();
        }
      }
    },
    addEventListener: events.addEventListener.bind(events)
  };
}
