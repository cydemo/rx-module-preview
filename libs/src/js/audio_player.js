class AudioPlayer {
	#AUDIO_STATE = {};
	#ELEMENTS = {};
	#SCROLL_POS = 0;
	audioList = [];
	index = 0;
	frameID = window.frameElement.getAttribute('data-frame-id');
	originalTitle = parent.document.title;

	constructor(selector) {
		const target = document.querySelector(selector);
		this.#ELEMENTS.container = target;
		this.#AUDIO_STATE = {
			totalDuration: 0,
			pausedAt: 0,
			playbackRate: 1.0,
			volume: 1.0,
			rangeColor: null,
			convertTime: 0,
			isPaused: true,
			isDragging: false,
			isLaunched: false,
		};

		this.#ELEMENTS = {
			wrapper: target.querySelector(".audio-player-wrapper"),
			audio: target.querySelector(".audio-player"),
			headerControls: target.querySelector(".audio-player-header"),
				trackOpener: target.querySelector(".track-opener"),
				listContainer: target.querySelector(".audio-list-container"),
			centerControls: target.querySelector(".center-controls"),
				prevBtn: target.querySelector(".prev-btn"),
				playBtnCenter: target.querySelector(".play-pause-btn.center"),
				nextBtn: target.querySelector(".next-btn"),
			footerControls: target.querySelector(".audio-player-controls"),
				progressContainer: target.querySelector(".progress-section"),
					progressBar: target.querySelector(".progress-bar"),
				playPauseBtn: target.querySelector(".play-pause-btn.left"),
				volumeBtn: target.querySelector(".volume-btn"),
				volumeRange: target.querySelector(".volume-control"),
				currentTimeText: target.querySelector(".current-time"),
				totalTimeText: target.querySelector(".total-time"),
				fullScreenBtn: target.querySelector(".fs-btn"),
			errorMessageContainer: target.querySelector(".error-message-container"),
				errorMessageText: target.querySelector(".error-message-text"),
			...this.#ELEMENTS,
		};

		if (this.#ELEMENTS.volumeRange) {
			this.updateSliderBackground();
		}

		this.audioList = this.createReactiveArray([]);

		this.init();
	}

	init() {
        const { audio, totalTimeText } = this.#ELEMENTS;
		audio.addEventListener("loadedmetadata", (e) => {
			if (!this.#AUDIO_STATE.isLaunched) {
				this.#AUDIO_STATE.isLaunched = true;
				this.registerEventWithLaunch();
			}
			totalTimeText.textContent = this.formatTime(e.target.duration);
			this.#AUDIO_STATE.totalDuration = e.target.duration;
		});

		this.registerEvent();

	    if ('mediaSession' in navigator) {
			navigator.mediaSession.setActionHandler('play', () => audio.play());
			navigator.mediaSession.setActionHandler('pause', () => audio.pause());
		}
	}

	createReactiveArray(initialArray) {
        const { listContainer } = this.#ELEMENTS;
		let listHtml, imageUrl, duration, isPlaying;

		return new Proxy(initialArray, {
			set: (target, property, value) => {
				target[property] = value;
				if (property !== "length") {
					imageUrl = value.artwork ? value.artwork[0].src : '';
					duration = this.formatTime(value.duration);
					isPlaying = (property == this.index) ? ' is-playing' : '';
					listHtml = `<li class="list-item${isPlaying}" data-index="${property}"><span class="image-wrapper"><img src="${imageUrl}" /></span><strong>${value.title}</strong><span class="duration-time">${duration}</span></li>`;
					listContainer.querySelector("ul").insertAdjacentHTML("beforeend", listHtml);
					this.setTrackButton();
				}
				return true;
			},
		});
	}

	isMobile() {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	}

	launchPlayer() {
		const { audio } = this.#ELEMENTS;
		if (this.#AUDIO_STATE.isLaunched) {
			return;
		}
		this.#AUDIO_STATE.isLaunched = true;

		if (audio.readyState < audio.HAVE_FUTURE_DATA) {
			this.showLoadingSpinner(true);
		}

		this.registerEventWithLaunch();
	}

	registerEventWithLaunch() {
		const { audio, headerControls, trackOpener, listContainer, centerControls, prevBtn, nextBtn, errorMessageText, errorMessageContainer } = this.#ELEMENTS;

		const url = new URL(window.location.href);
		const urlParams = url.searchParams;
		const listID = urlParams.get('list_id');
		if (listID) {
			setTimeout(() => {
				if (this.audioList.length < 2) {
					return;
				}
				this.setTrackButton();
				this.updateMediaSession();
			}, 400);
		}

		trackOpener.addEventListener("click", (e) => {
			if ( getComputedStyle(headerControls).opacity === '0' ) return false;
			trackOpener.classList.contains('triggered') ? trackOpener.classList.remove("triggered") : trackOpener.classList.add("triggered");
			listContainer.classList.contains('out') ? listContainer.classList.remove("out") : listContainer.classList.add("out");
			centerControls.classList.contains('out') ? this.fadeIn(centerControls) : this.fadeOut(centerControls);
		});

		listContainer.addEventListener("click", (e) => {
			let targetElement;
			if ( e.target.className === 'list-item' ) {
				targetElement = e.target;
			} else if ( e.target.closest('.list-item') ) {
				targetElement = e.target.closest('.list-item');
			} else {
				return false;
			}

			this.index = Number(targetElement.dataset.index);
			this.loadTrack(this.index);
		});

		prevBtn.addEventListener("click", (e) => {
			if ( getComputedStyle(centerControls).opacity === '0' ) return false;
			if (this.audioList.length < 2 || this.index <= 0) return;

			this.index--;
			this.loadTrack(this.index);
		});

		nextBtn.addEventListener("click", (e) => {
			if ( getComputedStyle(centerControls).opacity === '0' ) return false;
			if (this.audioList.length < 2 || this.index >= this.audioList.length-1) return;

			this.index++;
			this.loadTrack(this.index);
		});

		audio.addEventListener("error", () => {
			console.warn('비디오 소스를 로드할 수 없습니다.');
			errorMessageText.innerText = '오류가 발생하여 재생할 수 없습니다.';
			errorMessageContainer.style.display = 'flex';
		});
	}

	registerEvent() {
		const { wrapper, audio, headerControls, listContainer, trackOpener, centerControls, playBtnCenter, progressContainer, playPauseBtn, volumeBtn, volumeRange, fullScreenBtn, errorMessageContainer, errorMessageText } = this.#ELEMENTS;

		const onPointerDown = (e) => {
			e.preventDefault();
			this.#AUDIO_STATE.isPaused = audio.paused;
			audio.pause();
			this.#AUDIO_STATE.isDragging = true;
			this.updateProgressFromEvent(e.touches ? e.touches[0] : e);
		};

		const onPointerMove = (e) => {
			if (!this.#AUDIO_STATE.isDragging) return false;
			e.preventDefault();
			this.updateProgressFromEvent(e.touches ? e.touches[0] : e);
		};

		const onPointerUp = (e) => {
			if (this.#AUDIO_STATE.isDragging) {
				this.#AUDIO_STATE.isDragging = false;
				const { left, width } = progressContainer.getBoundingClientRect();
				const event = e.type === 'touchend' ? e.changedTouches[0] : e;
				const x = event.clientX - left;
				const ratio = x / width;
				const newTime = Math.min(Math.max(0, ratio * this.#AUDIO_STATE.totalDuration), this.#AUDIO_STATE.totalDuration);
				this.updateProgressBarTo(newTime);
				audio.currentTime = newTime;
			}
		};

		progressContainer.addEventListener("mousedown", onPointerDown);
		window.addEventListener("mousemove", onPointerMove);
		window.addEventListener("mouseup", onPointerUp);

		progressContainer.addEventListener("touchstart", onPointerDown, { passive: false });
		window.addEventListener("touchmove", onPointerMove, { passive: false });
		window.addEventListener("touchend", onPointerUp, { passive: false });

		let timeout;
		wrapper.addEventListener("mousemove", (e) => {
			if (listContainer.classList.contains("out")) {
				this.fadeIn(centerControls);
			}
			wrapper.classList.remove("out");

			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(() => {
				if (audio.currentTime > 0 && !audio.paused && !audio.ended && audio.readyState > audio.HAVE_CURRENT_DATA) {
					this.fadeOut(centerControls);
				}
				setTimeout(() => {
					wrapper.classList.add("out");
				}, 1200);
			}, 4000);
		});

		wrapper.addEventListener("mouseleave", (e) => {
			setTimeout(() => {
				if (audio.currentTime > 0 && !audio.paused && !audio.ended && audio.readyState > audio.HAVE_CURRENT_DATA) {
					this.fadeOut(centerControls);
				}
			}, 4000);
		});

		audio.addEventListener("play", (e) => {
			playBtnCenter.classList.add("pause");
			playPauseBtn.classList.add("pause");

			this.fadeOut(centerControls);
			if (!this.#AUDIO_STATE.isLaunched) {
				this.launchPlayer();
			}

			this.updateBrowserTitle('play', headerControls.querySelector('h2').innerText);
			this.sendMessageToParent(this.frameID, 'play');

			if (wrapper.style.backgroundImage.indexOf('default_cover_image.jpg') > -1) {
				wrapper.style.backgroundImage = 'url(./modules/preview/libs/src/img/default_cover_image.gif)';
			}
		});

		audio.addEventListener("pause", (e) => {
			this.fadeIn(centerControls);

			playBtnCenter.classList.remove("pause");
			playPauseBtn.classList.remove("pause");

			this.updateBrowserTitle('pause', this.originalTitle);
			this.sendMessageToParent(this.frameID, 'pause');

			if (wrapper.style.backgroundImage.indexOf('default_cover_image.gif') > -1) {
				wrapper.style.backgroundImage = 'url(./modules/preview/libs/src/img/default_cover_image.jpg)';
			}
		});

		audio.addEventListener("canplay", () => {
			this.showLoadingSpinner(false);

			if ('mediaSession' in navigator) {
				if (this.audioList.length < 2) {
					const audio_info = this.audioList[0];
					navigator.mediaSession.metadata = new MediaMetadata({
						title: headerControls.querySelector('h2').innerText
					});

					if ( audio_info.artist ) {
						navigator.mediaSession.metadata.artist = audio_info.artist;
					}
					if ( audio_info.album ) {
						navigator.mediaSession.metadata.album = audio_info.album;
					}
					if ( audio_info.artwork ) {
						navigator.mediaSession.metadata.artwork = [{
							src: audio_info.artwork[0].src || './modules/preview/libs/src/img/default_cover_image.jpg',
							sizes: audio_info.artwork[0].sizes || '512x512',
							type: audio_info.artwork[0].type || navigator.mediaSession.metadata.artwork[0].src.replace(/[^.]+\.(\w+$)/, '$1'),
						}];
					}
				} else {
					this.updateMediaSession();
				}
			}
		});

		audio.addEventListener("ended", (e) => {
			if (this.audioList.length > 1) {
				this.index++
				this.loadTrack(this.index, 1200);
			}
		});

		audio.addEventListener('volumechange', (e) => {
			if (audio.muted) {
				volumeBtn.classList.add("mute");
			} else {
				volumeBtn.classList.remove("mute");
			}
		});

		audio.addEventListener("seeking", () => {
			if (!this.#AUDIO_STATE.isDragging) {
				this.showLoadingSpinner(true);
			}
		});

		audio.addEventListener("seeked", () => {
			this.showLoadingSpinner(false);
			if (!this.#AUDIO_STATE.isDragging && !this.#AUDIO_STATE.isPaused) {
				audio.play();
			}
		});

		audio.addEventListener("timeupdate", (e) => {
			this.updateProgressBar();
		});

		const DOUBLE_CLICK_DELAY = 200;
		const isMobile = this.isMobile();
		let isPendingDoubleClick = false;
		audio.addEventListener("click", (e) => {
			if (e.detail === 1 && !isPendingDoubleClick) {
				isPendingDoubleClick = setTimeout(() => {
					if (!listContainer.classList.contains('out')) {
						listContainer.classList.add("out");
						trackOpener.classList.remove("triggered");
						centerControls.classList.contains('out') ? this.fadeIn(centerControls) : this.fadeOut(centerControls);
					} else {
						if (isMobile) {
							return;
						}

						audio.paused ? audio.play() : audio.pause();
					}

					isPendingDoubleClick = false;
				}, DOUBLE_CLICK_DELAY);
			} else if (e.detail === 2 && isPendingDoubleClick) {
				this.toggleFullscreen();

				clearTimeout(isPendingDoubleClick);
				isPendingDoubleClick = false;
			}
		});

		audio.addEventListener("keydown", (e) => {
			if (["ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
				e.preventDefault();
				switch (e.code) {
					case "ArrowLeft": {
						audio.currentTime -= 5;
						break;
					}
					case "ArrowRight": {
						audio.currentTime += 5;
						break;
					}
					case "Space": {
						playBtnCenter.click();
						break;
					}
				}
				this.updateProgressBarTo(audio.currentTime);
			}
		});

		playBtnCenter.addEventListener("click", () => {
			if (getComputedStyle(centerControls).opacity === '0') {
				return;
			}
			audio.paused ? audio.play() : audio.pause();
		});

		playPauseBtn.addEventListener("click", () => {
			audio.paused ? audio.play() : audio.pause();
		});

		volumeBtn?.addEventListener("click", () => {
			audio.muted = !audio.muted;
            if (volumeRange) {
				volumeRange.value = audio.muted ? 0 : this.#AUDIO_STATE.volume;
            	this.updateSliderBackground();
			}
		});

        volumeRange?.addEventListener("input", (e) => {
			this.#AUDIO_STATE.volume = parseFloat(e.target.value);
            audio.volume = this.#AUDIO_STATE.volume;
			audio.muted = e.target.value <= 0;

            this.updateSliderBackground();
        });

		fullScreenBtn.addEventListener("click", (e) => {
			this.toggleFullscreen();
		});

		this.#ELEMENTS.container.addEventListener("fullscreenchange", (e) => {
			if (document.fullscreenElement) {
				wrapper.classList.add("full-screen");
				audio.style.objectFit = "contain";
			} else {
				window.scrollTo(0, this.#SCROLL_POS);
				if (audio.currentTime > 0) this.updateProgressBarTo(audio.currentTime);
				wrapper.classList.remove("full-screen");
				audio.style.objectFit = "";
			}
		});

		window.addEventListener("message", (e) => {
			if (e.data.action === 'pause') {
				audio.pause();
			}
		});
	}

	showLoadingSpinner(visible) {
		const spinner = this.#ELEMENTS.container.querySelector(".audio-player-loading");
		const centerControls = this.#ELEMENTS.container.querySelector(".center-controls");

		if (!spinner) return false;
		if (visible) {
			spinner.classList.remove("is-hidden");
			centerControls.classList.add("is-hidden");
		} else {
			spinner.classList.add("is-hidden");
			centerControls.classList.remove("is-hidden");
		}
	}

	setTrackButton() {
        const { trackOpener, prevBtn, nextBtn } = this.#ELEMENTS;

		if (this.index <= 0) {
			prevBtn.classList.add("is-disabled");
		} else {
			prevBtn.classList.remove("is-disabled");
		}
		if (this.index >= this.audioList.length-1) {
			nextBtn.classList.add("is-disabled");
		} else {
			nextBtn.classList.remove("is-disabled");
		}
	}

	clickTrack(index) {
		this.index = index;
		this.loadTrack(this.index);
	}

	loadTrack(index, delay) {
		index = Number(index);
		if ( index >= this.audioList.length ) {
			return;
		}
		if ( !delay ) {
			delay = 0;
		}

		const { wrapper, audio, headerControls, trackOpener, listContainer } = this.#ELEMENTS;
		const track = this.audioList[index];
		const total_count = this.audioList.length;

		this.showLoadingSpinner(true);
		this.setTrackButton();

		headerControls.querySelector('h2').innerText = track.title;
		trackOpener.innerText = '(' + (index + 1) + '/' + total_count + ')';

		const trackElementInHighlight = listContainer.querySelector(".is-playing");
		const trackElementForHighlight = document.querySelector("[data-index='"+ index +"']");
		trackElementInHighlight.classList.remove("is-playing");
		trackElementForHighlight.classList.add("is-playing");

		const scrollTopPosition = trackElementForHighlight.offsetTop;
		listContainer.scrollTo({top: scrollTopPosition, left: 0, behavior: 'smooth'});

		wrapper.style.backgroundImage = track.artwork ? 'url(' + track.artwork[0].src + ')' : 'url(./modules/preview/libs/src/img/default_cover_image.jpg)';
		setTimeout(function() {
			audio.src = track.src;
			audio.play();
		}, delay);

		this.updateMediaSession();
	}

	updateMediaSession() {
		const track = this.audioList[this.index];
		if ('mediaSession' in navigator) {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: track.title,
				artist: track.artist,
				album: track.album,
				artwork: track.artwork
			});

			navigator.mediaSession.setActionHandler('previoustrack', () => {
				if ( this.index > 0 ) {
					this.index--;
					this.loadTrack(this.index);
				}
			});
			navigator.mediaSession.setActionHandler('nexttrack', () => {
				if (this.index < this.audioList.length - 1) {
					this.index++;
					this.loadTrack(this.index);
				}
			});
		}
	}

	updateProgressBar() {
		const { audio, currentTimeText, progressBar } = this.#ELEMENTS;
		if (this.#AUDIO_STATE.isDragging) return;

		const percentage = (this.#AUDIO_STATE.totalDuration > 0) ? (audio.currentTime / this.#AUDIO_STATE.totalDuration) * 100 : 0;

		progressBar.style.width = `${percentage}%`;

		currentTimeText.textContent = this.formatTime(audio.currentTime);
	}

	updateProgressFromEvent(e) {
		const { left, width } = this.#ELEMENTS.progressContainer.getBoundingClientRect();
		const x = e.clientX - left;
		const ratio = x / width;
		const newTime = Math.min(Math.max(0, ratio * this.#AUDIO_STATE.totalDuration), this.#AUDIO_STATE.totalDuration);
		this.updateProgressBarTo(newTime);
	}

    updateProgressBarTo(time) {
        const { currentTimeText, progressBar } = this.#ELEMENTS;
        const percentage = (time / this.#AUDIO_STATE.totalDuration) * 100;
        currentTimeText.textContent = this.formatTime(time);
        progressBar.style.width = percentage + '%';
    }

	updateSliderBackground() {
        const { volumeRange } = this.#ELEMENTS;
        if (volumeRange) {
            const percentage = volumeRange.value * 100;
            volumeRange.style.background = `linear-gradient(to right, #fff ${percentage}%, #555 ${percentage}%)`;
        }
    }

	formatTime(seconds) {
        let minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);

        minutes = ("0" + minutes).slice(-2);
        seconds = ("0" + seconds).slice(-2);

        return `${minutes}:${seconds}`;
    }

	toggleFullscreen() {
		const target = this.#ELEMENTS.wrapper;
		this.#ELEMENTS.audio.focus();
		if (!document.fullscreenElement) {
			this.#SCROLL_POS = window.scrollY;
			if (target.requestFullscreen) {
				target.requestFullscreen();
			} else if (target.mozRequestFullScreen) {
				target.mozRequestFullScreen();
			} else if (this.#ELEMENTS.audio.webkitEnterFullscreen) {
				this.#ELEMENTS.audio.webkitEnterFullscreen();
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.mozExitFullScreen) {
				document.mozExitFullScreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			}
		}
	}

	updateBrowserTitle(action, audioTitle) {
		if (action === 'play') {
			setTimeout(() => {
				parent.document.title = `${audioTitle}`;
			}, 100);
		} else if (action === 'pause') {
			parent.document.title = `${audioTitle}`;
		}
	}

	sendMessageToParent(id, action) {
		window.parent.postMessage({id, action}, '*');
	}

	fadeOut(element) {
		if (element.classList.contains('out') && element.classList.contains('is-hidden')) {
			return;
		}
		element.classList.add('out');
		setTimeout(() => {
			element.classList.add('is-hidden');
		}, 1200);
	}

	fadeIn(element) {
		if (!element.classList.contains('out') && !element.classList.contains('is-hidden')) {
			return;
		}
		element.classList.remove('is-hidden');
		setTimeout(() => {
			element.classList.remove('out');
		}, 10);
	}
}