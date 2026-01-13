(function () {
  function createRequire(modules, cache, entryPoints) {
    function requireModule(name, isGlobalFallback) {
      if (!cache[name]) {
        if (!modules[name]) {
          var requireFn = typeof require == "function" && require;
          if (!isGlobalFallback && requireFn) return requireFn(name, true);
          if (globalRequire) return globalRequire(name, true);
          var err = new Error("Cannot find module '" + name + "'");
          err.code = "MODULE_NOT_FOUND";
          throw err;
        }
        var moduleObj = (cache[name] = { exports: {} });
        modules[name][0].call(
          moduleObj.exports,
          function (requestedPath) {
            var resolvedId = modules[name][1][requestedPath];
            return requireModule(resolvedId || requestedPath);
          },
          moduleObj,
          moduleObj.exports,
          createRequire,
          modules,
          cache,
          entryPoints
        );
      }
      return cache[name].exports;
    }
    var globalRequire = typeof require == "function" && require;
    for (var i = 0; i < entryPoints.length; i++) {
      requireModule(entryPoints[i]);
    }
    return requireModule;
  }
  return createRequire;
})()({
  1: [
    function (require, module, exports) {
      const MIN_DATE = "2018-01-01";
      const MAX_DATE = "2029-12-31";
      const PRIORITY_NORMAL = 100;

      module.exports = {
        notifications: [
          { id: "cvifms5exdmqy2g3ar4kzhmxi4zepvvq", priority: PRIORITY_NORMAL, title: "Tip: custom keyboard shortcut", message: "Just type <strong>chrome://extensions/shortcuts</strong> in the address bar and set your own shortcut to open Volume Master Max.", dateFrom: MIN_DATE, dateTo: MAX_DATE, minDaysFromInstallation: 1, maxDaysFromInstallation: null },
          { id: "h6s5u6eqgjpxwqasujret4vz2pnkj945", priority: PRIORITY_NORMAL, title: "Tip: use keys 0 - 6 to adjust volume", message: "Right after opening Volume Master Max press keys 0&nbsp;-&nbsp;6 to change volume from 0&nbsp;% to 600&nbsp;% respectively.", dateFrom: MIN_DATE, dateTo: MAX_DATE, minDaysFromInstallation: 3, maxDaysFromInstallation: null },
          { id: "tk7tse8yedvsdyve2dtpzd349hkbnugk", priority: PRIORITY_NORMAL, title: "Tip: adjust volume with arrow keys", message: "Right after opening Volume Master Max press:<ul><li>⬆️ or ➡️ to volume up</li><li>⬇️ or ⬅️ to volume down</li></ul>", dateFrom: MIN_DATE, dateTo: MAX_DATE, minDaysFromInstallation: 5, maxDaysFromInstallation: null }
        ]
      };
    },
    { "../modules/config": 9 }
  ],
  2: [
    function (require, module, exports) {
      const config = require("./config");
      const { getSliderValues } = require("./audio-gain.js");

      const resetButton = document.querySelector(".js-actions__reset");
      const restoreButton = document.querySelector(".js-actions__restore");
      const sliderInput = document.querySelector(config.HTML_JS_HOOK_VOLUME_SLIDER);
      const DEFAULT_VOLUME = 100;

      const renderActionResetUI = async (tabId) => {
        const audioData = await chrome.runtime.sendMessage({
          action: config.ACTION_POPUP_AUDIO_DATA_GET,
          target: config.TARGET_OFFSCREEN_DOCUMENT,
          tabId: tabId
        });

        if (!audioData) {
          if (resetButton) resetButton.classList.add("is-hidden");
          if (restoreButton && restoreButton.classList.contains("is-hidden") && resetButton) {
            resetButton.classList.remove("is-hidden");
            resetButton.setAttribute("disabled", "disabled");
          }
        } else {
          if (resetButton) resetButton.classList.remove("is-hidden");
          const sliderValues = getSliderValues(config.VOLUME_VALUE_DEFAULT);
          const defaultIndex = sliderValues.indexOf(DEFAULT_VOLUME);
          if (sliderInput && resetButton) {
            if (sliderInput.value == defaultIndex) {
              resetButton.setAttribute("disabled", "disabled");
            } else {
              resetButton.removeAttribute("disabled");
            }
          }
        }
      };

      const setupResetListener = () => {
        if (resetButton && sliderInput) {
          resetButton.addEventListener("click", () => {
            const sliderValues = getSliderValues(config.VOLUME_VALUE_DEFAULT);
            sliderInput.value = sliderValues.indexOf(DEFAULT_VOLUME);
            sliderInput.dispatchEvent(new Event("input"));
            sliderInput.dispatchEvent(new Event("change"));
          });
        }
      };

      module.exports = {
        initActionResetUI: async (tabId) => {
          await renderActionResetUI(tabId);
          setupResetListener();
        },
        renderActionResetUI: renderActionResetUI
      };
    },
    { "./action-reset-ui": 2, "./audio-gain.js": 7, "./config": 9 }
  ],
  3: [
    function (require, module, exports) {
      const config = require("./config");
      const storageLocal = require("./chrome/storage-local.js");
      const { getSliderValues, getClosestValue } = require("./audio-gain.js");

      const restoreButton = document.querySelector(".js-actions__restore");
      const restoreValueLabel = document.querySelector(".js-actions__restore-value");
      const restoreDomainLabel = document.querySelector(".js-actions__restore-domain");
      const sliderInput = document.querySelector(config.HTML_JS_HOOK_VOLUME_SLIDER);
      const STORAGE_KEY_DOMAINS = "domains-settings";

      const getHostname = (urlStr) => {
        if (!urlStr) return "";
        try {
          return new URL(urlStr).hostname;
        } catch {
          return "";
        }
      };

      const renderActionRestoreUI = async (tabId, tabUrl) => {
        const audioData = await chrome.runtime.sendMessage({
          action: config.ACTION_POPUP_AUDIO_DATA_GET,
          target: config.TARGET_OFFSCREEN_DOCUMENT,
          tabId: tabId,
          source: "action-restore-ui"
        });

        if (audioData) {
          if (restoreButton) restoreButton.classList.add("is-hidden");
        } else {
          const settings = await storageLocal.get(STORAGE_KEY_DOMAINS, {});
          const domain = getHostname(tabUrl);
          const savedVolume = domain && settings[domain] && settings[domain].volume;

          if (Number.isInteger(savedVolume) && restoreButton && sliderInput) {
            restoreButton.classList.remove("is-hidden");
            if (restoreValueLabel) restoreValueLabel.textContent = savedVolume;
            if (restoreDomainLabel) restoreDomainLabel.textContent = domain;

            restoreButton.addEventListener(
              "click",
              () => {
                const sliderValues = getSliderValues(sliderInput.dataset.maxVolume);
                const closestValue = getClosestValue(sliderValues, savedVolume);
                sliderInput.value = sliderValues.indexOf(closestValue);
                sliderInput.dispatchEvent(new Event("input"));
                sliderInput.dispatchEvent(new Event("change"));
              },
              { once: true }
            );
          }
        }
      };

      module.exports = {
        initActionRestoreUI: async (tabId, tabUrl) => {
          await renderActionRestoreUI(tabId, tabUrl);
        },
        updateActionRestoreUI: async (tabUrl, sliderIndex) => {
          if (!sliderInput) return;
          const sliderValues = getSliderValues(sliderInput.dataset.maxVolume);
          const domainSettings = await storageLocal.get(STORAGE_KEY_DOMAINS, {});
          const domain = getHostname(tabUrl);
          if (!domain) return;

          const targetVolume = sliderValues[sliderIndex];
          domainSettings[domain] = domainSettings[domain] || {};
          domainSettings[domain].volume = targetVolume;

          if (targetVolume === config.VOLUME_VALUE_DEFAULT) {
            delete domainSettings[domain].volume;
          }

          await storageLocal.set(STORAGE_KEY_DOMAINS, domainSettings);
          if (restoreButton) restoreButton.classList.add("is-hidden");
        }
      };
    },
    { "./audio-gain.js": 7, "./chrome/storage-local.js": 8, "./config": 9 }
  ],
  4: [
    function (require, module, exports) {
      const config = require("./config");
      const MAX_BYTE_VALUE = 255;
      let isFrequencyEndSet = false;

      const frequencyInput = document.querySelector(".js-audio-equalizer__frequency");
      const analyserContainer = document.querySelector(".js-audio-analyser");
      const beforeWrapper = analyserContainer ? analyserContainer.querySelector(".js-audio-analyser__before-wrapper") : null;
      const beforeCanvas = analyserContainer ? analyserContainer.querySelector(".js-audio-analyser__before-canvas") : null;
      const beforeContext = beforeCanvas ? beforeCanvas.getContext("2d") : null;
      const beforeFreqEndLabel = analyserContainer ? analyserContainer.querySelector(".js-audio-analyser__before-freq-end") : null;

      const afterWrapper = analyserContainer ? analyserContainer.querySelector(".js-audio-analyser__after-wrapper") : null;
      const afterCanvas = analyserContainer ? analyserContainer.querySelector(".js-audio-analyser__after-canvas") : null;
      const afterContext = afterCanvas ? afterCanvas.getContext("2d") : null;
      const afterFreqEndLabel = analyserContainer ? analyserContainer.querySelector(".js-audio-analyser__after-freq-end") : null;

      const lastTimestamps = { before: 0, after: 0 };
      let activeTabId;

      const startAnalyser = async (tabId) => {
        if (!analyserContainer) return;
        activeTabId = tabId;
        analyserContainer.classList.remove("is-hidden");

        if (config.ANALYSER_BEFORE_ENABLED && beforeWrapper && beforeCanvas) {
          beforeWrapper.classList.remove("is-hidden");
          beforeCanvas.width = beforeWrapper.offsetWidth;
          requestAnimationFrame(await renderBeforeFrame);
        }

        if (config.ANALYSER_AFTER_ENABLED && afterWrapper && afterCanvas) {
          afterWrapper.classList.remove("is-hidden");
          afterCanvas.width = afterWrapper.offsetWidth;
          requestAnimationFrame(await renderAfterFrame);
        }
      };

      const renderBeforeFrame = async (timestamp) => {
        requestAnimationFrame(await renderBeforeFrame);
        await drawAnalyserFrame(timestamp, "before", config.ACTION_POPUP_ANALYSER_BEFORE_DATA_GET, beforeCanvas, beforeContext);
      };

      const renderAfterFrame = async (timestamp) => {
        requestAnimationFrame(await renderAfterFrame);
        await drawAnalyserFrame(timestamp, "after", config.ACTION_POPUP_ANALYSER_AFTER_DATA_GET, afterCanvas, afterContext);
      };

      const drawAnalyserFrame = async (timestamp, type, actionName, canvasEl, ctx) => {
        if (!canvasEl || !ctx) return;
        if (timestamp - lastTimestamps[type] < config.ANALYSER_INTERVAL) {
          return;
        }
        lastTimestamps[type] = timestamp;

        const response = await chrome.runtime.sendMessage({
          action: actionName,
          target: config.TARGET_OFFSCREEN_DOCUMENT,
          tabId: activeTabId
        });

        if (response) {
          const { dataArray, bufferLength, sampleRate } = response;
          if (!isFrequencyEndSet) {
            const maxFreq = sampleRate / 2;
            if (beforeFreqEndLabel) beforeFreqEndLabel.textContent = maxFreq;
            if (afterFreqEndLabel) afterFreqEndLabel.textContent = maxFreq;
            if (frequencyInput) frequencyInput.setAttribute("max", maxFreq);
            isFrequencyEndSet = true;
          }

          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
          const barWidth = canvasEl.width / bufferLength;
          const barWidthCeil = Math.ceil(barWidth);
          const canvasHeight = canvasEl.height;

          for (let i = 0; i < bufferLength; i++) {
            const sampleVal = dataArray[i];
            const xPos = Math.floor(i * barWidth);
            const yPos = canvasHeight - Math.floor((canvasHeight * sampleVal) / MAX_BYTE_VALUE);
            const barHeight = Math.floor((canvasHeight * sampleVal) / MAX_BYTE_VALUE);

            ctx.fillStyle = `hsl(${sampleVal + 125}, 100%, 65%)`;
            ctx.fillRect(xPos, yPos, barWidthCeil, barHeight);
          }
        }
      };

      module.exports = {
        initAnalyserUI: async (tabId) => {
          if (config.ANALYSER_BEFORE_ENABLED || config.ANALYSER_AFTER_ENABLED) {
            await startAnalyser(tabId);
          }
        }
      };
    },
    { "./config": 9 }
  ],
  5: [
    function (require, module, exports) {
      const config = require("./config");
      const { renderActionResetUI } = require("./action-reset-ui");

      const equalizerContainer = document.querySelector(".js-audio-equalizer");
      const presetButtons = equalizerContainer ? equalizerContainer.querySelectorAll(".js-audio-equalizer__preset") : [];
      const algorithmSelect = document.querySelector(".js-audio-equalizer__algorithm");
      const frequencyInput = document.querySelector(".js-audio-equalizer__frequency");
      const frequencyValueLabel = document.querySelector(".js-audio-equalizer__frequency-value");
      const qInput = document.querySelector(".js-audio-equalizer__q");
      const qValueLabel = document.querySelector(".js-audio-equalizer__q-value");
      const gainInput = document.querySelector(".js-audio-equalizer__gain");
      const gainValueLabel = document.querySelector(".js-audio-equalizer__gain-value");

      const updateBiquadFilter = async (tabId, settings) => {
        const { algorithm, frequency, q, gain } = settings;
        await chrome.runtime.sendMessage({
          action: config.ACTION_POPUP_BIQUAD_FILTER_CHANGE,
          target: config.TARGET_SERVICE_WORKER,
          tabId: tabId,
          algorithm: algorithm,
          frequency: frequency,
          q: q,
          gain: gain
        });
        await renderActionResetUI(tabId);
      };

      const updateUIValues = (algorithm, frequency, q, gain) => {
        if (algorithmSelect) algorithmSelect.value = algorithm;
        if (frequencyInput) frequencyInput.value = frequency;
        if (frequencyValueLabel) frequencyValueLabel.textContent = frequency;
        if (qInput) qInput.value = q;
        if (qValueLabel) qValueLabel.textContent = q;
        if (gainInput) gainInput.value = gain;
        if (gainValueLabel) gainValueLabel.textContent = gain;
      };

      const syncEqualizerUI = async (tabId) => {
        const audioData = await chrome.runtime.sendMessage({
          action: config.ACTION_POPUP_AUDIO_DATA_GET,
          target: config.TARGET_OFFSCREEN_DOCUMENT,
          tabId: tabId
        });

        if (audioData && equalizerContainer) {
          const { algorithm, frequency, q, gain } = audioData.equalizer;
          updateUIValues(algorithm, frequency, q, gain);

          const matchingPresetName = Object.keys(config.EQUALIZER_PRESETS).find((presetName) => {
            const preset = config.EQUALIZER_PRESETS[presetName];
            return preset.algorithm === algorithm && preset.frequency === frequency && preset.q === q && preset.gain === gain;
          });

          presetButtons.forEach((btn) => btn.classList.remove("is-active"));
          const activePresetButton = equalizerContainer.querySelector(`[data-equalizer-type="${matchingPresetName}"]`);
          if (activePresetButton) {
            activePresetButton.classList.add("is-active");
          } else if (presetButtons.length > 0) {
            presetButtons[0].classList.add("is-active");
          }
        }
      };

      const setupEqualizerListeners = (tabId) => {
        if (algorithmSelect) algorithmSelect.addEventListener("change", async (event) => {
          await updateBiquadFilter(tabId, { algorithm: event.target.value });
        });

        if (frequencyInput) frequencyInput.addEventListener("input", async (event) => {
          await updateBiquadFilter(tabId, { frequency: event.target.value });
        });

        if (qInput) qInput.addEventListener("input", async (event) => {
          await updateBiquadFilter(tabId, { q: event.target.value });
        });

        if (gainInput) gainInput.addEventListener("input", async (event) => {
          await updateBiquadFilter(tabId, { gain: event.target.value });
        });

        presetButtons.forEach((button) => {
          button.addEventListener("click", async () => {
            presetButtons.forEach((btn) => btn.classList.remove("is-active"));
            button.classList.add("is-active");

            const presetType = button.dataset.equalizerType;
            const { algorithm, frequency, q, gain } = config.EQUALIZER_PRESETS[presetType];

            updateUIValues(algorithm, frequency, q, gain);
            await updateBiquadFilter(tabId, { algorithm, frequency, q, gain });
          });
        });
      };

      module.exports = {
        initSliderEqualizerUI: async (tabId) => {
          await syncEqualizerUI(tabId);
          setupEqualizerListeners(tabId);
        }
      };
    },
    { "./action-reset-ui": 2, "./config": 9 }
  ],
  6: [
    function (require, module, exports) {
      const config = require("./config");
      const utils = require("./utils.js");
      const storageLocal = require("./chrome/storage-local.js");
      const { getSliderValues, getClosestValue } = require("./audio-gain.js");
      const { renderActionResetUI } = require("./action-reset-ui");
      const { updateActionRestoreUI } = require("./action-restore-ui");

      const sliderInput = document.querySelector(config.HTML_JS_HOOK_VOLUME_SLIDER);
      const maxVolumeLabel = document.querySelector(".js-volume-info__volume-max");
      const currentVolumeLabel = document.querySelector(".js-volume-info__volume-value");
      const restoreButton = document.querySelector(".js-actions__restore");

      let lastWheelTime = 0;

      // Update the linear-gradient fill on the main volume slider thumb track
      const updateSliderFill = () => {
        if (!sliderInput) return;
        const min = parseFloat(sliderInput.min) || 0;
        const max = parseFloat(sliderInput.max) || 1;
        const val = parseFloat(sliderInput.value) || 0;
        const pct = ((val - min) / (max - min)) * 100;
        const isDark = document.body.classList.contains('dark-mode');
        const track = isDark ? '#333' : '#e0e0e0';
        sliderInput.style.background = `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, ${track} ${pct}%)`;
      };

      const setupGainUI = async (tabId) => {
        if (!sliderInput) return;

        const defaultVolume = config.VOLUME_VALUE_DEFAULT;
        const maxVolume = sliderInput.dataset.maxVolume || config.VOLUME_VALUE_MAX;
        const sliderValues = getSliderValues(maxVolume);

        sliderInput.setAttribute("min", 0);
        sliderInput.setAttribute("max", sliderValues.length - 1);

        let closestVol = getClosestValue(sliderValues, defaultVolume);
        if (maxVolumeLabel) maxVolumeLabel.textContent = maxVolume;
        if (currentVolumeLabel) currentVolumeLabel.textContent = closestVol;
        sliderInput.value = sliderValues.indexOf(closestVol);

        const audioData = await chrome.runtime.sendMessage({
          action: config.ACTION_POPUP_AUDIO_DATA_GET,
          target: config.TARGET_OFFSCREEN_DOCUMENT,
          tabId: tabId
        });

        updateSliderFill();

        if (audioData) {
          const currentGainVolume = getClosestValue(sliderValues, 100 * audioData.gain.gain);
          sliderInput.value = sliderValues.indexOf(currentGainVolume);
          if (currentVolumeLabel) currentVolumeLabel.textContent = currentGainVolume;
          sliderInput.dispatchEvent(new Event("input"));
          sliderInput.dispatchEvent(new Event("change"));
        }
      };

      const applyGainChange = async (tabId, sliderIndex) => {
        if (!sliderInput) return;
        const sliderValues = getSliderValues(sliderInput.dataset.maxVolume);
        const targetGain = sliderValues[sliderIndex];

        if (currentVolumeLabel) currentVolumeLabel.textContent = targetGain;
        updateSliderFill();

        await chrome.runtime.sendMessage({
          action: config.ACTION_POPUP_GAIN_CHANGE,
          target: config.TARGET_SERVICE_WORKER,
          tabId: tabId,
          volumeValue: targetGain
        });

        await renderActionResetUI(tabId);
        utils.updateBadge(tabId, targetGain);
      };

      const setupGainListeners = async (tabId, tabUrl) => {
        if (!sliderInput) return;

        let isScrollInverted = await storageLocal.get(
          config.STORAGE_KEY_SCROLL_DIRECTION_INVERTED,
          config.STORAGE_VALUE_SCROLL_DIRECTION_INVERTED_DEFAULT
        );

        storageLocal.watch(config.STORAGE_KEY_SCROLL_DIRECTION_INVERTED, (newValue) => {
          isScrollInverted = newValue;
        });

        sliderInput.addEventListener("input", async (event) => {
          await applyGainChange(tabId, event.target.value);
          if (restoreButton) restoreButton.classList.add("is-hidden");
        });

        sliderInput.addEventListener(
          "wheel",
          (event) => {
            event.preventDefault();
            const now = Date.now();
            if (now - lastWheelTime < 100) return;

            const direction = Math.sign(event.deltaY) * (isScrollInverted ? -1 : 1);
            sliderInput.value = parseInt(sliderInput.value, 10) + direction;
            sliderInput.dispatchEvent(new Event("input"));
            sliderInput.dispatchEvent(new Event("change"));
            lastWheelTime = now;
          },
          { passive: false }
        );

        sliderInput.addEventListener("change", async () => {
          await updateActionRestoreUI(tabUrl, sliderInput.value);
        });
      };

      module.exports = {
        initAudioGainUI: async (tabId, tabUrl) => {
          await setupGainUI(tabId);
          await setupGainListeners(tabId, tabUrl);
        }
      };
    },
    { "./action-reset-ui": 2, "./action-restore-ui": 3, "./audio-gain.js": 7, "./chrome/storage-local.js": 8, "./config": 9, "./utils.js": 27 }
  ],
  7: [
    function (require, module, exports) {
      module.exports = {
        getSliderValues: (maxVolume) => {
          const values = [];
          for (let i = 0; i < 10; i++) {
            values.push(i);
          }
          for (let i = 10; i <= maxVolume; i += 10) {
            values.push(i);
          }
          return values;
        },
        getClosestValue: (valuesArray, targetValue) =>
          valuesArray.reduce((closest, curr) => (Math.abs(curr - targetValue) < Math.abs(closest - targetValue) ? curr : closest))
      };
    },
    {}
  ],
  8: [
    function (require, module, exports) {
      module.exports = {
        get: async (key, defaultValue) => {
          const query = { [key]: JSON.stringify(defaultValue) };
          const result = await chrome.storage.local.get(query);
          return JSON.parse(result[key]);
        },
        set: async (key, value) => {
          const data = { [key]: JSON.stringify(value) };
          await chrome.storage.local.set(data);
        },
        watch: async (key, callback) => {
          chrome.storage.local.onChanged.addListener((changes) => {
            if (key in changes) {
              const newValue = JSON.parse(changes[key].newValue);
              callback(newValue);
            }
          });
        },
        getBytesInUse: async (key) => chrome.storage.local.getBytesInUse(key)
      };
    },
    {}
  ],
  9: [
    function (require, module, exports) {
      const getAppVersion = () => chrome.runtime.getManifest().version;

      const getUrl = (urlStr, utmContent = "") => {
        if (!urlStr) return "";
        try {
          const targetUrl = new URL(urlStr);
          if (utmContent) {
            const params = new URLSearchParams({
              utm_source: "volume-master",
              utm_medium: "browser-extension",
              utm_content: utmContent
            });
            targetUrl.search = params.toString();
          }
          return targetUrl.href;
        } catch {
          return urlStr || "";
        }
      };

      module.exports = {
        HOMEPAGE_URL: "",
        INSTALL_URL: "",
        UNINSTALL_URL: "",
        FOOTER_URL: "",
        ISSUE_URL: "",
        getStoreReviewsUrl: () => undefined,
        getStoreName: () => undefined,
        getUrl: getUrl,
        getUpdateUrl: () => "",
        updateUrl: (urlStr) => urlStr || "",
        getAppVersion: getAppVersion,
        APP_VERSION_WITH_UPDATE_URL: [],
        APP_VERSION_WITH_UPDATE_URL_EXTENDED: [],

        TARGET_SERVICE_WORKER: "service-worker",
        TARGET_OFFSCREEN_DOCUMENT: "offscreen-document",

        ACTION_POPUP_AUDIO_DATA_GET: "popup-audio-data-get",
        ACTION_POPUP_GAIN_CHANGE: "popup-gain-change",
        ACTION_POPUP_BIQUAD_FILTER_CHANGE: "popup-biquad-filter-change",
        ACTION_POPUP_ANALYSER_BEFORE_DATA_GET: "popup-analyser-before-data-get",
        ACTION_POPUP_ANALYSER_AFTER_DATA_GET: "popup-analyser-after-data-get",
        ACTION_TAB_CLOSED: "tab-closed",
        ACTION_INIT_OFFSCREEN_DOCUMENT: "init-offscreen-document",
        ACTION_GET_MEDIA_STREAM_ID: "get-media-stream-id",

        AUDIO_STATE_AUDIO_CONTEXT: "audioContext",
        AUDIO_STATE_GAIN_NODE: "gainNode",
        AUDIO_STATE_BIQUAD_FILTER_NODE: "biquadFilter",
        AUDIO_STATE_ANALYSER_NODE_BEFORE: "analyserBefore",
        AUDIO_STATE_ANALYSER_NODE_AFTER: "analyserAfter",

        ANALYSER_BEFORE_ENABLED: false,
        ANALYSER_AFTER_ENABLED: false,
        ANALYSER_INTERVAL: 1000 / 30,
        ANALYSER_FFT_SIZE: 128,

        EQUALIZER_PRESETS: {
          default: { algorithm: "highpass", frequency: 0, q: 1, gain: 0 },
          voice: { algorithm: "peaking", frequency: 1500, q: 1, gain: 12 },
          bass: { algorithm: "lowshelf", frequency: 350, q: 1, gain: 6 }
        },

        VOLUME_VALUE_DEFAULT: 100,
        VOLUME_VALUE_MAX: 600,
        HTML_JS_HOOK_VOLUME_SLIDER: ".js-volume-slider__slider",

        STORAGE_KEY_SCROLL_DIRECTION_INVERTED: "scroll-direction-inverted",
        STORAGE_VALUE_SCROLL_DIRECTION_INVERTED_DEFAULT: false,
        STORAGE_VALUE_SCROLL_DIRECTION_INVERTED_REGULAR: false,
        STORAGE_VALUE_SCROLL_DIRECTION_INVERTED_INVERTED: true,

        STORAGE_KEY_PROMO_SHOW: "promo-show",
        STORAGE_VALUE_PROMO_SHOW_DEFAULT: false,
        STORAGE_VALUE_PROMO_SHOW_ON: true,
        STORAGE_VALUE_PROMO_SHOW_OFF: false,

        STORAGE_KEY_RATING_AND_MADE_BY_SHOW: "rating-and-made-by-show",
        STORAGE_VALUE_RATING_AND_MADE_BY_SHOW_DEFAULT: true,
        STORAGE_VALUE_RATING_AND_MADE_BY_SHOW_ON: true,
        STORAGE_VALUE_RATING_AND_MADE_BY_SHOW_OFF: false
      };
    },
    {}
  ],
  10: [
    function (require, module, exports) {
      const storageLocal = require("./chrome/storage-local.js");
      const STORAGE_KEY_DARK_MODE = "dark-mode";

      const bodyEl = document.querySelector("body");
      const darkModeSwitch = document.querySelector(".js-dark-mode-switch");
      const darkModeCheckbox = darkModeSwitch ? darkModeSwitch.querySelector(".js-dark-mode-switch__checkbox") : null;

      module.exports = {
        initDarkModeSwitchUI: async () => {
          if (!bodyEl || !darkModeCheckbox) return;
          const isDarkMode = await storageLocal.get(STORAGE_KEY_DARK_MODE, false);
          if (isDarkMode) {
            bodyEl.classList.add("dark-mode");
            darkModeCheckbox.checked = true;
          }
          setTimeout(() => {
            bodyEl.classList.add("animated");
          }, 300);

          darkModeCheckbox.addEventListener("change", async () => {
            if (darkModeCheckbox.checked) {
              bodyEl.classList.add("dark-mode");
              await storageLocal.set(STORAGE_KEY_DARK_MODE, true);
            } else {
              bodyEl.classList.remove("dark-mode");
              await storageLocal.set(STORAGE_KEY_DARK_MODE, false);
            }
          });
        }
      };
    },
    { "./chrome/storage-local.js": 8 }
  ],
  11: [
    function (require, module, exports) {
      const storageLocal = require("./chrome/storage-local.js");
      const { STORAGE_KEY_INSTALLATION_DATE } = require("./notifications.js");

      const diagnosticsContainer = document.querySelector(".js-diagnostics");
      const cogButton = document.querySelector(".js-diagnostics__cog");
      const dataContainer = document.querySelector(".js-diagnostics__data");

      const renderDiagnostics = async () => {
        const manifest = chrome.runtime.getManifest();
        const platformInfo = await chrome.runtime.getPlatformInfo();
        const installDate = await storageLocal.get(STORAGE_KEY_INSTALLATION_DATE, null);
        const storageUsedBytes = await storageLocal.getBytesInUse(null);

        const diagnosticsText = `
    <strong>App Name</strong>: ${manifest.name}
    <strong>App Version</strong>: ${manifest.version}
    <strong>Author</strong>: Pratham Jain
    <strong>Installed</strong>: ${installDate}
    <strong>Storage Used</strong>: ${storageUsedBytes} B
    <strong>Platform OS</strong>: ${platformInfo.os}
    <strong>Platform Arch</strong>: ${platformInfo.arch}
    <strong>User Agent</strong>: ${navigator.userAgent}
    `
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .join("\n");

        if (dataContainer) dataContainer.innerHTML = diagnosticsText;
      };

      const setupDiagnosticsListener = () => {
        if (cogButton && diagnosticsContainer) {
          cogButton.addEventListener("click", () => {
            diagnosticsContainer.classList.toggle("is-hidden");
            if (!diagnosticsContainer.classList.contains("is-hidden")) {
              renderDiagnostics();
            }
          });
        }
      };

      module.exports = {
        initDiagnosticsUI: async () => {
          setupDiagnosticsListener();
        }
      };
    },
    { "./chrome/storage-local.js": 8, "./notifications.js": 15 }
  ],
  12: [
    function (require, module, exports) {
      module.exports = {
        initFooterUI: () => {}
      };
    },
    { "./config": 9 }
  ],
  13: [
    function (require, module, exports) {
      const config = require("./config");
      const { getSliderValues, getClosestValue } = require("./audio-gain.js");

      const sliderInput = document.querySelector(config.HTML_JS_HOOK_VOLUME_SLIDER);

      module.exports = {
        initKeyboardShortcuts: () => {
          document.documentElement.addEventListener("keydown", (event) => {
            if (event.target.classList.contains("js-support__code") || !sliderInput) {
              return;
            }
            if (['INPUT', 'TEXTAREA'].includes(event.target.tagName) && event.target.type !== 'range') {
              return;
            }
            const pressedKey = event.key.toLowerCase();
            const numericVal = +pressedKey;

            if (!isNaN(numericVal) && pressedKey !== " " && pressedKey !== "") {
              event.preventDefault();
              const sliderValues = getSliderValues(sliderInput.dataset.maxVolume);
              const targetVol = getClosestValue(sliderValues, 100 * numericVal);
              const minVol = sliderValues[sliderInput.min];
              const maxVol = sliderValues[sliderInput.max];

              if (minVol <= targetVol && targetVol <= maxVol) {
                sliderInput.value = sliderValues.indexOf(targetVol);
                sliderInput.dispatchEvent(new Event("input"));
                sliderInput.dispatchEvent(new Event("change"));
                return;
              }
            }

            if (pressedKey === "d") {
              event.preventDefault();
              document.querySelector('[data-equalizer-type="default"]')?.click();
            } else if (pressedKey === "v") {
              event.preventDefault();
              document.querySelector('[data-equalizer-type="voice"]')?.click();
            } else if (pressedKey === "b") {
              event.preventDefault();
              document.querySelector('[data-equalizer-type="bass"]')?.click();
            } else if (pressedKey === "r") {
              event.preventDefault();
              window.location.reload();
            } else if (["arrowup", "arrowright"].includes(pressedKey)) {
              if (event.target !== sliderInput) {
                event.preventDefault();
                const currentVal = parseInt(sliderInput.value, 10) || 0;
                sliderInput.value = Math.min(sliderInput.max || 100, currentVal + 1);
                sliderInput.dispatchEvent(new Event("input"));
                sliderInput.dispatchEvent(new Event("change"));
              }
            } else if (["arrowdown", "arrowleft"].includes(pressedKey)) {
              if (event.target !== sliderInput) {
                event.preventDefault();
                const currentVal = parseInt(sliderInput.value, 10) || 0;
                sliderInput.value = Math.max(sliderInput.min || 0, currentVal - 1);
                sliderInput.dispatchEvent(new Event("input"));
                sliderInput.dispatchEvent(new Event("change"));
              }
            }
          });
        },
        initKeyboardTutorialUI: async () => {
          const modal = document.querySelector(".js-tutorial-modal");
          const closeBtn = document.querySelector(".js-tutorial-close");
          const dismissBtn = document.querySelector(".js-tutorial-dismiss");
          const backdrop = document.querySelector(".js-tutorial-backdrop");
          const openBtn = document.querySelector(".js-open-shortcuts-tutorial");

          if (!modal) return;

          const showTutorial = () => {
            modal.classList.remove("is-hidden");
          };

          const hideTutorial = () => {
            modal.classList.add("is-hidden");
            try {
              chrome.storage.local.set({ hasSeenKeyboardTutorial: true });
            } catch (e) {
              console.warn("Could not save tutorial preference", e);
            }
          };

          closeBtn?.addEventListener("click", hideTutorial);
          dismissBtn?.addEventListener("click", hideTutorial);
          backdrop?.addEventListener("click", hideTutorial);
          openBtn?.addEventListener("click", showTutorial);

          try {
            const res = await chrome.storage.local.get(["hasSeenKeyboardTutorial"]);
            if (!res || !res.hasSeenKeyboardTutorial) {
              showTutorial();
            }
          } catch (e) {
            console.warn("Failed to check hasSeenKeyboardTutorial", e);
            showTutorial();
          }
        }
      };
    },
    { "./audio-gain.js": 7, "./config": 9 }
  ],
  14: [
    function (require, module, exports) {
      const notifications = require("./notifications");

      const showNotification = (notificationData) => {
        const container = document.querySelector(".js-notification");
        const closeBtn = document.querySelector(".js-notification__close");
        const titleEl = document.querySelector(".js-notification__title");
        const msgEl = document.querySelector(".js-notification__message");
        if (container && closeBtn && titleEl && msgEl) {
          container.classList.add("is-active");
          closeBtn.dataset.id = notificationData.id;
          titleEl.innerHTML = notificationData.title;
          msgEl.innerHTML = notificationData.message;
        }
      };

      module.exports = {
        initNotificationsUI: async () => {
          await notifications.initNotifications();
          const activeNotification = notifications.getNotification();
          if (activeNotification) {
            showNotification(activeNotification);
          }
        }
      };
    },
    { "./notifications": 15 }
  ],
  15: [
    function (require, module, exports) {
      const storageLocal = require("./chrome/storage-local.js");
      const { notifications } = require("../config/notifications");

      const STORAGE_KEY_NOTIFICATIONS = "notifications";
      const STORAGE_KEY_INSTALLATION_DATE = "installation-date";

      const state = {
        date: new Date(),
        installationDate: new Date(),
        usedIds: []
      };

      const loadUsedIds = async () => {
        state.usedIds = await storageLocal.get(STORAGE_KEY_NOTIFICATIONS, []);
      };

      const markNotificationUsed = async (id) => {
        state.usedIds.push(id);
        await storageLocal.set(STORAGE_KEY_NOTIFICATIONS, state.usedIds);
      };

      const setInstallationDate = async () => {
        state.installationDate = new Date();
        await storageLocal.set(STORAGE_KEY_INSTALLATION_DATE, state.installationDate);
      };

      const loadInstallationDate = async () => {
        const savedDate = await storageLocal.get(STORAGE_KEY_INSTALLATION_DATE, null);
        if (savedDate) {
          state.installationDate = new Date(savedDate);
        } else {
          await setInstallationDate();
        }
      };

      const setupClickListener = () => {
        document.addEventListener("click", async (event) => {
          const closeButton = event.target.closest(".js-notification__close");
          if (closeButton) {
            const notificationId = closeButton.dataset.id;
            await markNotificationUsed(notificationId);
            const parentNotification = closeButton.closest(".notification");
            if (parentNotification) parentNotification.classList.remove("is-active");
            document.querySelector("html").style.minHeight = "auto";
          }
        });
      };

      module.exports = {
        initNotifications: async () => {
          await loadInstallationDate();
          await loadUsedIds();
          setupClickListener();
        },
        getNotification: () => {
          const daysSinceInstallation = Math.floor((state.date - state.installationDate) / (1000 * 60 * 60 * 24));
          return notifications
            .filter((n) => state.date >= new Date(n.dateFrom))
            .filter((n) => state.date <= new Date(n.dateTo))
            .filter((n) => state.usedIds.indexOf(n.id) === -1)
            .filter((n) => n.minDaysFromInstallation <= daysSinceInstallation)
            .filter((n) => n.maxDaysFromInstallation === null || daysSinceInstallation <= n.maxDaysFromInstallation)
            .sort((a, b) => a.priority - b.priority)
            .pop();
        },
        STORAGE_KEY_INSTALLATION_DATE: STORAGE_KEY_INSTALLATION_DATE
      };
    },
    { "../config/notifications": 1, "./chrome/storage-local.js": 8 }
  ],
  16: [
    function (require, module, exports) {
      const config = require("./config");

      const initOffscreen = async () => {
        await chrome.runtime.sendMessage({
          action: config.ACTION_INIT_OFFSCREEN_DOCUMENT,
          target: config.TARGET_SERVICE_WORKER
        });
      };

      module.exports = {
        initOffscreenDocument: async () => {
          await initOffscreen();
        }
      };
    },
    { "./config": 9 }
  ],
  17: [
    function (require, module, exports) {
      const bannerContainer = document.querySelector(".js-outdated-browsers-manager");

      const getChromeMajorVersion = (userAgentStr) => {
        const match = userAgentStr.match(/Chrome\/(\d+)/);
        return match ? match[1] : null;
      };

      const checkBrowserVersion = async () => {
        const majorVersion = getChromeMajorVersion(navigator.userAgent);
        if (majorVersion && majorVersion < 116 && bannerContainer) {
          bannerContainer.classList.remove("is-hidden");
        }
      };

      module.exports = {
        initOutdatedBrowsersManagerUI: async () => {
          await checkBrowserVersion();
        }
      };
    },
    {}
  ],
  18: [
    function (require, module, exports) {
      module.exports = {
        initPromoShowSwitchUI: async () => {}
      };
    },
    { "./chrome/storage-local.js": 8, "./config.js": 9 }
  ],
  19: [
    function (require, module, exports) {
      const promoContainer = document.querySelector(".js-promo");

      module.exports = {
        initPromoUI: async () => {
          if (promoContainer) {
            promoContainer.classList.add("is-hidden");
          }
        }
      };
    },
    { "./chrome/storage-local.js": 8, "./config.js": 9 }
  ],
  20: [
    function (require, module, exports) {
      module.exports = {
        initRatingAndMadeBySwitchUI: async () => {}
      };
    },
    { "./chrome/storage-local.js": 8, "./config.js": 9, "./supporter-ui": 25 }
  ],
  21: [
    function (require, module, exports) {
      module.exports = {
        initRatingAndMadeByUI: async () => {}
      };
    },
    { "./chrome/storage-local.js": 8, "./config.js": 9 }
  ],
  22: [
    function (require, module, exports) {
      module.exports = {
        initRatingUI: () => {}
      };
    },
    { "./config": 9 }
  ],
  23: [
    function (require, module, exports) {
      const storageLocal = require("./chrome/storage-local.js");
      const config = require("./config.js");

      const switchContainer = document.querySelector(".js-scroll-direction-switch");
      const switchCheckbox = switchContainer ? switchContainer.querySelector(".js-scroll-direction-switch__checkbox") : null;

      module.exports = {
        initScrollDirectionSwitchUI: async () => {
          if (!switchCheckbox) return;
          const isInverted = await storageLocal.get(
            config.STORAGE_KEY_SCROLL_DIRECTION_INVERTED,
            config.STORAGE_VALUE_SCROLL_DIRECTION_INVERTED_DEFAULT
          );
          switchCheckbox.checked = isInverted;

          switchCheckbox.addEventListener("change", async () => {
            if (switchCheckbox.checked) {
              await storageLocal.set(
                config.STORAGE_KEY_SCROLL_DIRECTION_INVERTED,
                config.STORAGE_VALUE_SCROLL_DIRECTION_INVERTED_INVERTED
              );
            } else {
              await storageLocal.set(
                config.STORAGE_KEY_SCROLL_DIRECTION_INVERTED,
                config.STORAGE_VALUE_SCROLL_DIRECTION_INVERTED_REGULAR
              );
            }
          });
        }
      };
    },
    { "./chrome/storage-local.js": 8, "./config.js": 9 }
  ],
  24: [
    function (require, module, exports) {
      const settingsToggleBtn = document.querySelector(".js-settings-switch");
      const settingsPane = document.querySelector(".js-settings-frame");

      module.exports = {
        initSettingsUI: async () => {
          if (settingsToggleBtn && settingsPane) {
            settingsToggleBtn.addEventListener("click", () => {
              settingsPane.classList.toggle("is-hidden");
            });
          }
        }
      };
    },
    { "./chrome/storage-local": 8, "./config": 9 }
  ],
  25: [
    function (require, module, exports) {
      const config = require("./config");
      const storageLocal = require("./chrome/storage-local.js");

      const STORAGE_KEY_PREMIUM = "is-premium";
      const sliderInput = document.querySelector(config.HTML_JS_HOOK_VOLUME_SLIDER);

      const enableBoostMode = () => {
        if (sliderInput) sliderInput.dataset.maxVolume = 800;
      };

      module.exports = {
        initSupporterUI: enableBoostMode,
        loadIsSupporter: async () => await storageLocal.get(STORAGE_KEY_PREMIUM, false)
      };
    },
    { "./chrome/storage-local.js": 8, "./config": 9 }
  ],
  26: [
    function (require, module, exports) {
      const config = require("./config");
      const utils = require("./utils.js");
      const { getSliderValues, getClosestValue } = require("./audio-gain.js");

      const tabsTitle = document.querySelector(".js-tabs__title");
      const tabsList = document.querySelector(".js-tabs__list");

      const renderAudioTabs = async () => {
        if (!tabsList || !tabsTitle) return;

        const audioTabs = await chrome.tabs.query({ audible: true });
        audioTabs.sort((a, b) => b.id - a.id);

        if (audioTabs.length > 0) {
          tabsTitle.textContent = "Tabs playing audio (independent volume)";
          tabsList.classList.add("tabs__list--active");
        } else {
          tabsTitle.textContent = "No tabs playing audio right now";
          tabsList.classList.remove("tabs__list--active");
        }

        tabsList.innerHTML = "";

        for (const tab of audioTabs) {
          const templateContent = document.querySelector(".js-template-tab").content;
          const tabClone = document.importNode(templateContent, true);
          const tabElement = tabClone.querySelector(".js-tab");
          const tabHeader = tabClone.querySelector(".js-tab__header");
          const tabIcon = tabClone.querySelector(".js-tab__icon-image");
          const tabTitleEl = tabClone.querySelector(".js-tab__title");
          const tabSlider = tabClone.querySelector(".js-tab__slider");
          const tabBadge = tabClone.querySelector(".js-tab__volume-badge");

          tabElement.dataset.tabId = tab.id;
          tabIcon.src = tab.favIconUrl || "../icon/icon-16.png";
          tabTitleEl.textContent = tab.title;

          // Fetch volume state for this specific tab
          const audioData = await chrome.runtime.sendMessage({
            action: config.ACTION_POPUP_AUDIO_DATA_GET,
            target: config.TARGET_OFFSCREEN_DOCUMENT,
            tabId: tab.id
          });

          let currentVol = 100;
          if (audioData && audioData.gain) {
            currentVol = Math.round(audioData.gain.gain * 100);
          }

          tabSlider.value = currentVol;
          tabBadge.textContent = `${currentVol}%`;

          // Handle per-tab volume adjustments
          tabSlider.addEventListener("input", async (e) => {
            const newVol = parseInt(e.target.value, 10);
            tabBadge.textContent = `${newVol}%`;

            await chrome.runtime.sendMessage({
              action: config.ACTION_POPUP_GAIN_CHANGE,
              target: config.TARGET_SERVICE_WORKER,
              tabId: tab.id,
              volumeValue: newVol
            });

            utils.updateBadge(tab.id, newVol);

            // Sync main slider if tab is active
            const currentActiveTabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (currentActiveTabs[0] && currentActiveTabs[0].id === tab.id) {
              const mainSlider = document.querySelector(config.HTML_JS_HOOK_VOLUME_SLIDER);
              const mainVolLabel = document.querySelector(".js-volume-info__volume-value");
              if (mainSlider && mainVolLabel) {
                const sliderValues = getSliderValues(mainSlider.dataset.maxVolume || config.VOLUME_VALUE_MAX);
                const closest = getClosestValue(sliderValues, newVol);
                mainSlider.value = sliderValues.indexOf(closest);
                mainVolLabel.textContent = newVol;
              }
            }
          });

          // Click header to switch active tab focus
          tabHeader.addEventListener("click", async (e) => {
            e.preventDefault();
            const updatedTab = await chrome.tabs.update(tab.id, { active: true });
            await chrome.windows.update(updatedTab.windowId, { focused: true });
          });

          tabsList.appendChild(tabClone);
        }
      };

      module.exports = {
        initTabsUI: async () => {
          await renderAudioTabs();
        }
      };
    },
    { "./audio-gain.js": 7, "./config": 9, "./utils.js": 27 }
  ],
  27: [
    function (require, module, exports) {
      module.exports = {
        updateBadge: (tabId, volumeText) => {
          chrome.action.setBadgeText({ text: `${volumeText}`, tabId: tabId });
        }
      };
    },
    {}
  ],
  28: [
    function (require, module, exports) {
      const { initFooterUI } = require("./modules/footer-ui");
      const { initKeyboardShortcuts, initKeyboardTutorialUI } = require("./modules/keyboard-shortcuts");
      const { initNotificationsUI } = require("./modules/notifications-ui");
      const { initRatingUI } = require("./modules/rating-ui.js");
      const { initSupporterUI, loadIsSupporter } = require("./modules/supporter-ui");
      const { initTabsUI } = require("./modules/tabs-ui");
      const { initAudioGainUI } = require("./modules/audio-gain-ui.js");
      const { initDarkModeSwitchUI } = require("./modules/dark-mode-switch-ui");
      const { initActionResetUI } = require("./modules/action-reset-ui");
      const { initActionRestoreUI } = require("./modules/action-restore-ui");
      const { initSliderEqualizerUI } = require("./modules/audio-equalizer-ui.js");
      const { initAnalyserUI } = require("./modules/audio-analyser-ui.js");
      const { initOffscreenDocument } = require("./modules/offscreen-document.js");
      const { initDiagnosticsUI } = require("./modules/diagnostics-ui.js");
      const { initOutdatedBrowsersManagerUI } = require("./modules/outdated-browsers-manager-ui.js");
      const { initPromoUI } = require("./modules/promo-ui");
      const { initPromoShowSwitchUI } = require("./modules/promo-switch-ui");
      const { initSettingsUI } = require("./modules/settings-ui");
      const { initRatingAndMadeByUI } = require("./modules/rating-and-mady-by-ui.js");
      const { initRatingAndMadeBySwitchUI } = require("./modules/rating-and-mady-by-switch-ui.js");
      const { initScrollDirectionSwitchUI } = require("./modules/scroll-direction-switch-ui.js");

      (async () => {
        const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTabId = activeTabs[0]?.id;
        const activeTabUrl = activeTabs[0]?.url;

        const isSupporter = await loadIsSupporter();
        if (isSupporter) {
          initSupporterUI();
        }

        await initSettingsUI();
        await initDarkModeSwitchUI();
        await initPromoShowSwitchUI();
        await initRatingAndMadeBySwitchUI();
        await initScrollDirectionSwitchUI();
        await initNotificationsUI();
        await initOffscreenDocument();

        if (activeTabId && activeTabUrl) {
          await initAudioGainUI(activeTabId, activeTabUrl);
          await initSliderEqualizerUI(activeTabId);
          await initAnalyserUI(activeTabId);
          await initActionRestoreUI(activeTabId, activeTabUrl);
          await initActionResetUI(activeTabId);
        }

        await initTabsUI();
        await initPromoUI();
        await initRatingAndMadeByUI();

        initFooterUI();
        initRatingUI();
        await initDiagnosticsUI();
        await initOutdatedBrowsersManagerUI();
        initKeyboardShortcuts();
        await initKeyboardTutorialUI();
      })();
    },
    {
      "./modules/action-reset-ui": 2,
      "./modules/action-restore-ui": 3,
      "./modules/audio-analyser-ui.js": 4,
      "./modules/audio-equalizer-ui.js": 5,
      "./modules/audio-gain-ui.js": 6,
      "./modules/dark-mode-switch-ui": 10,
      "./modules/diagnostics-ui.js": 11,
      "./modules/footer-ui": 12,
      "./modules/keyboard-shortcuts": 13,
      "./modules/notifications-ui": 14,
      "./modules/offscreen-document.js": 16,
      "./modules/outdated-browsers-manager-ui.js": 17,
      "./modules/promo-switch-ui": 18,
      "./modules/promo-ui": 19,
      "./modules/rating-and-mady-by-switch-ui.js": 20,
      "./modules/rating-and-mady-by-ui.js": 21,
      "./modules/rating-ui.js": 22,
      "./modules/scroll-direction-switch-ui.js": 23,
      "./modules/settings-ui": 24,
      "./modules/supporter-ui": 25,
      "./modules/tabs-ui": 26
    }
  ]
}, {}, [28]);