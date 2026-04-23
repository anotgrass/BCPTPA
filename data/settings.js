(function initProtestSettingsScope() {
  const STORAGE_KEY = "protest_assistant_settings_v1";

  const countyRegistry = {
    "bell-tx": {
      id: "bell-tx",
      label: "Bell County, TX",
      districtLabel: "Bell County Appraisal District",
      districtUrl: "https://bellcad.org/",
      /** Only "live" is user-facing; `adminGeojson` enables `?adminGeojson=1` for local snapshot preview. */
      supports: ["live"],
      defaultSource: "live",
      adminGeojson: true,
    },
  };

  function getDefaultSettings() {
    return {
      countyId: "bell-tx",
      dataSource: countyRegistry["bell-tx"].defaultSource,
    };
  }

  /**
   * Settings as stored in localStorage (no admin URL override).
   * @returns {{ countyId: string, dataSource: string }}
   */
  function readStorageSettings() {
    const defaults = getDefaultSettings();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      const countyId = countyRegistry[parsed.countyId] ? parsed.countyId : defaults.countyId;
      const source = String(parsed.dataSource || defaults.dataSource);
      const allowed = countyRegistry[countyId].supports;
      const def = countyRegistry[countyId].defaultSource;
      const dataSource = allowed.includes(source) ? source : def;
      return { countyId, dataSource };
    } catch (err) {
      console.warn("Ignoring invalid app settings in localStorage.", err);
      return defaults;
    }
  }

  function isAdminGeojsonRequest(countyId) {
    try {
      if (new URLSearchParams(window.location.search).get("adminGeojson") !== "1") return false;
      return !!(countyRegistry[countyId] && countyRegistry[countyId].adminGeojson === true);
    } catch (e) {
      return false;
    }
  }

  function readSettings() {
    const base = readStorageSettings();
    if (isAdminGeojsonRequest(base.countyId)) {
      return { countyId: base.countyId, dataSource: "geojson" };
    }
    return base;
  }

  function writeSettings(next) {
    const persisted = readStorageSettings();
    const countyId = countyRegistry[next.countyId] ? next.countyId : persisted.countyId;
    const allowed = countyRegistry[countyId].supports;
    const defaultSource = countyRegistry[countyId].defaultSource;

    let dataSource;
    if (Object.prototype.hasOwnProperty.call(next, "dataSource")) {
      const candidate = String(next.dataSource);
      dataSource = allowed.includes(candidate) ? candidate : defaultSource;
    } else if (persisted.countyId === countyId) {
      dataSource = persisted.dataSource;
    } else {
      dataSource = defaultSource;
    }
    if (!allowed.includes(dataSource)) {
      dataSource = defaultSource;
    }
    const merged = { countyId, dataSource };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    if (isAdminGeojsonRequest(countyId)) {
      return { countyId, dataSource: "geojson" };
    }
    return merged;
  }

  window.ProtestSettings = {
    countyRegistry,
    getDefaultSettings,
    readSettings,
    readStorageSettings,
    writeSettings,
  };
})();
