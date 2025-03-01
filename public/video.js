const videoSources = ["video1.mp4", "video2.mp4", "bowling.mp4"];
      let currentVideoIndex = 0;
      let initialTimer, reappearTimer;

      const overlay = document.getElementById("videoOverlay");
      const video = document.getElementById("infoVideo");
      const videoSourceElement = document.getElementById("videoSource");
      const dismissBtn = document.getElementById("dismissBtn");
      const muteBtn = document.getElementById("muteBtn");
      const permDismissBtn = document.getElementById("permDismissBtn");

      // Function to update the video source from the array
      function updateVideoSource() {
        videoSourceElement.src = videoSources[currentVideoIndex];
        video.load(); // Reload the video with the new source
      }

      // Function to show the video overlay
      function showVideoOverlay() {
        // Check if the user permanently dismissed the overlay.
        if (localStorage.getItem("videoOverlayPermanentDismissed") === "true") {
          return;
        }
        updateVideoSource();
        overlay.style.display = "flex";
        video.currentTime = 0;
        video.play().catch(error => {
          console.error("Video play error:", error);
        });
      }

      // Function to hide the video overlay
      function hideVideoOverlay() {
        overlay.style.display = "none";
        video.pause();
      }

      // Start the initial timer (2 minutes = 120000ms)
      function startInitialTimer() {
        if (localStorage.getItem("videoOverlayPermanentDismissed") === "true") return;
        initialTimer = setTimeout(showVideoOverlay, 60000);
      }

      // Start a reappear timer (10 minutes = 600000ms) after the overlay is dismissed or video ends
      function startReappearTimer() {
        if (localStorage.getItem("videoOverlayPermanentDismissed") === "true") return;
        reappearTimer = setTimeout(() => {
          // Cycle to the next video
          currentVideoIndex = (currentVideoIndex + 1) % videoSources.length;
          showVideoOverlay();
        }, 600000);
      }

      // Temporary dismiss button: hides the overlay for now (will reappear in 10 minutes)
      dismissBtn.addEventListener("click", () => {
        hideVideoOverlay();
        clearTimeout(reappearTimer);
        startReappearTimer();
      });

      // Auto-dismiss overlay when video ends and then start the reappear timer
      video.addEventListener("ended", () => {
        hideVideoOverlay();
        clearTimeout(reappearTimer);
        startReappearTimer();
      });

      // Mute/unmute toggle functionality
      muteBtn.addEventListener("click", () => {
        if (video.muted) {
          video.muted = false;
          muteBtn.textContent = "Mute";
        } else {
          video.muted = true;
          muteBtn.textContent = "Unmute";
        }
      });

      // Permanent dismiss button: permanently stop showing the video overlay
      permDismissBtn.addEventListener("click", () => {
        localStorage.setItem("videoOverlayPermanentDismissed", "true");
        hideVideoOverlay();
        clearTimeout(initialTimer);
        clearTimeout(reappearTimer);
      });

      // On page load, start the initial timer if the overlay has not been permanently dismissed.
      window.addEventListener("load", startInitialTimer);