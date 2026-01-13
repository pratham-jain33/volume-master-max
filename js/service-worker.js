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
    { "../modules/config": 3 }
  ],
  2: [
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
  3: [
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
  4: [
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
            closeButton.closest(".notification").classList.remove("is-active");
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
    { "../config/notifications": 1, "./chrome/storage-local.js": 2 }
  ],
  5: [
    function (require, module, exports) {
      const config = require("./modules/config");
      const storageLocal = require("./modules/chrome/storage-local.js");

      const OFFSCREEN_DOCUMENT_PATH = "html/offscreen.html";
      const STORAGE_KEY_APP_VERSION = "app-version";

      const hasOffscreenDocument = async () => {
        if ("getContexts" in chrome.runtime) {
          const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
          const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ["OFFSCREEN_DOCUMENT"],
            documentUrls: [offscreenUrl]
          });
          return existingContexts.length > 0;
        } else {
          const matchedClients = await clients.matchAll();
          return matchedClients.some(
            (client) => client.url.includes(chrome.runtime.id) && client.url.includes(OFFSCREEN_DOCUMENT_PATH)
          );
        }
      };

      const ensureOffscreenDocument = async () => {
        const exists = await hasOffscreenDocument();
        if (!exists) {
          await chrome.offscreen.createDocument({
            url: OFFSCREEN_DOCUMENT_PATH,
            reasons: ["USER_MEDIA"],
            justification: "Capture MediaStream (audio only) of the currently active tab (chrome.tabCapture API)"
          });
        }
      };

      chrome.runtime.onMessage.addListener(async (message) => {
        if (message.target === config.TARGET_SERVICE_WORKER) {
          if (message.action === config.ACTION_INIT_OFFSCREEN_DOCUMENT) {
            await ensureOffscreenDocument();
          }

          if (
            message.action === config.ACTION_POPUP_GAIN_CHANGE ||
            message.action === config.ACTION_POPUP_BIQUAD_FILTER_CHANGE
          ) {
            const audioData = await chrome.runtime.sendMessage({
              action: config.ACTION_POPUP_AUDIO_DATA_GET,
              target: config.TARGET_OFFSCREEN_DOCUMENT,
              tabId: message.tabId
            });

            let mediaStreamId = null;
            if (!audioData) {
              mediaStreamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: message.tabId });
            }

            if (message.action === config.ACTION_POPUP_GAIN_CHANGE) {
              await chrome.runtime.sendMessage({
                action: config.ACTION_POPUP_GAIN_CHANGE,
                target: config.TARGET_OFFSCREEN_DOCUMENT,
                tabId: message.tabId,
                volumeValue: message.volumeValue,
                mediaStreamId: mediaStreamId
              });
            }

            if (message.action === config.ACTION_POPUP_BIQUAD_FILTER_CHANGE) {
              await chrome.runtime.sendMessage({
                action: config.ACTION_POPUP_BIQUAD_FILTER_CHANGE,
                target: config.TARGET_OFFSCREEN_DOCUMENT,
                tabId: message.tabId,
                algorithm: message.algorithm,
                frequency: message.frequency,
                q: message.q,
                gain: message.gain,
                mediaStreamId: mediaStreamId
              });
            }
          }
        }
      });

      chrome.tabs.onRemoved.addListener(async (tabId) => {
        await ensureOffscreenDocument();
        await chrome.runtime.sendMessage({
          action: config.ACTION_TAB_CLOSED,
          target: config.TARGET_OFFSCREEN_DOCUMENT,
          tabId: tabId
        });
      });

      chrome.runtime.onInstalled.addListener(async () => {
        const currentAppVersion = config.getAppVersion();
        await storageLocal.set(STORAGE_KEY_APP_VERSION, currentAppVersion);
      });
    },
    { "./modules/chrome/storage-local.js": 2, "./modules/config": 3, "./modules/notifications.js": 4 }
  ]
}, {}, [5]);