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
  2: [
    function (require, module, exports) {
      const config = require("./modules/config");
      const audioStates = {};
      window.audioStates = audioStates;

      const initTabAudioState = (tabId, mediaStream) => {
        const audioContext = new window.AudioContext();
        const sourceNode = audioContext.createMediaStreamSource(mediaStream);
        const gainNode = audioContext.createGain();
        const biquadFilterNode = audioContext.createBiquadFilter();
        biquadFilterNode.type = "peaking";

        const analyserBefore = audioContext.createAnalyser();
        analyserBefore.fftSize = config.ANALYSER_FFT_SIZE;

        const analyserAfter = audioContext.createAnalyser();
        analyserAfter.fftSize = config.ANALYSER_FFT_SIZE;

        const nodes = [
          sourceNode,
          config.ANALYSER_BEFORE_ENABLED && analyserBefore,
          gainNode,
          biquadFilterNode,
          config.ANALYSER_AFTER_ENABLED && analyserAfter
        ];

        nodes
          .filter((node) => Boolean(node))
          .reduce((prevNode, currNode) => {
            prevNode.connect(currNode);
            return currNode;
          })
          .connect(audioContext.destination);

        audioStates[tabId] = audioStates[tabId] || {};
        audioStates[tabId][config.AUDIO_STATE_AUDIO_CONTEXT] = audioContext;
        audioStates[tabId][config.AUDIO_STATE_GAIN_NODE] = gainNode;
        audioStates[tabId][config.AUDIO_STATE_BIQUAD_FILTER_NODE] = biquadFilterNode;
        audioStates[tabId][config.AUDIO_STATE_ANALYSER_NODE_BEFORE] = analyserBefore;
        audioStates[tabId][config.AUDIO_STATE_ANALYSER_NODE_AFTER] = analyserAfter;
      };

      const setTabGain = (tabId, volumeValue) => {
        audioStates[tabId][config.AUDIO_STATE_GAIN_NODE].gain.value = volumeValue / 100;
      };

      const setTabBiquadFilter = (tabId, algorithm, frequency, q, gain) => {
        const filterNode = audioStates[tabId][config.AUDIO_STATE_BIQUAD_FILTER_NODE];
        if (algorithm != null) filterNode.type = algorithm;
        if (frequency != null) filterNode.frequency.value = frequency;
        if (q != null) filterNode.Q.value = q;
        if (gain != null) filterNode.gain.value = gain;
      };

      const getTabMediaStream = async (mediaStreamId) => {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: "tab",
              chromeMediaSourceId: mediaStreamId
            }
          }
        });
        return mediaStream;
      };

      const handleMessage = async (message, sendResponse) => {
        if (message.target !== config.TARGET_OFFSCREEN_DOCUMENT) {
          return;
        }

        if (message.action === config.ACTION_POPUP_AUDIO_DATA_GET) {
          let audioData = null;
          if (message.tabId in audioStates) {
            const state = audioStates[message.tabId];
            audioData = {
              gain: {
                gain: state[config.AUDIO_STATE_GAIN_NODE].gain.value
              },
              equalizer: {
                algorithm: state[config.AUDIO_STATE_BIQUAD_FILTER_NODE].type,
                frequency: state[config.AUDIO_STATE_BIQUAD_FILTER_NODE].frequency.value,
                q: state[config.AUDIO_STATE_BIQUAD_FILTER_NODE].Q.value,
                gain: state[config.AUDIO_STATE_BIQUAD_FILTER_NODE].gain.value
              }
            };
          }
          sendResponse(audioData);
          return;
        }

        if (message.action === config.ACTION_POPUP_GAIN_CHANGE) {
          if (!(message.tabId in audioStates)) {
            const mediaStream = await getTabMediaStream(message.mediaStreamId);
            initTabAudioState(message.tabId, mediaStream);
          }
          setTabGain(message.tabId, message.volumeValue);
        }

        if (message.action === config.ACTION_POPUP_BIQUAD_FILTER_CHANGE) {
          if (!(message.tabId in audioStates)) {
            const mediaStream = await getTabMediaStream(message.tabId);
            initTabAudioState(message.tabId, mediaStream);
          }
          setTabBiquadFilter(message.tabId, message.algorithm, message.frequency, message.q, message.gain);
        }

        if (message.action === config.ACTION_POPUP_ANALYSER_BEFORE_DATA_GET) {
          if (message.tabId in audioStates) {
            const audioCtx = audioStates[message.tabId][config.AUDIO_STATE_AUDIO_CONTEXT];
            const analyserNode = audioStates[message.tabId][config.AUDIO_STATE_ANALYSER_NODE_BEFORE];
            if (audioCtx && analyserNode) {
              const binCount = analyserNode.frequencyBinCount;
              const dataArray = new Uint8Array(binCount);
              analyserNode.getByteFrequencyData(dataArray);
              sendResponse({
                dataArray: Array.from(dataArray),
                bufferLength: binCount,
                sampleRate: audioCtx.sampleRate
              });
              return;
            }
          }
        }

        if (message.action === config.ACTION_POPUP_ANALYSER_AFTER_DATA_GET) {
          if (message.tabId in audioStates) {
            const audioCtx = audioStates[message.tabId][config.AUDIO_STATE_AUDIO_CONTEXT];
            const analyserNode = audioStates[message.tabId][config.AUDIO_STATE_ANALYSER_NODE_AFTER];
            if (audioCtx && analyserNode) {
              const binCount = analyserNode.frequencyBinCount;
              const dataArray = new Uint8Array(binCount);
              analyserNode.getByteFrequencyData(dataArray);
              sendResponse({
                dataArray: Array.from(dataArray),
                bufferLength: binCount,
                sampleRate: audioCtx.sampleRate
              });
              return;
            }
          }
        }

        if (message.action === config.ACTION_TAB_CLOSED) {
          const closedTabId = message.tabId;
          if (closedTabId in audioStates) {
            audioStates[closedTabId][config.AUDIO_STATE_AUDIO_CONTEXT].close().then(() => {
              delete audioStates[closedTabId];
            });
          }
        }

        sendResponse(null);
      };

      chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        await handleMessage(message, sendResponse);
      });
    },
    { "./modules/config": 1 }
  ]
}, {}, [2]);