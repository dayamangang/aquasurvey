/**
 * AquaSurvey Pro - Water Quality Parameter Management
 * Interactive pH slider & popup (range 4.0 to 9.0 with 0.1 step), steppers, presets, aquaculture safety evaluations,
 * and additional fishery parameters (DO, Temp, Salinity, Secchi, Ammonia, Nitrite, Alkalinity).
 */

class ParameterManager {
  constructor() {
    this.params = {
      ph: 7.5,             // 4.0 to 9.0 with 0.1 step
      temp: 26.5,          // 0.0 to 45.0 °C with 0.1 step
      tempUnit: 'C',       // 'C' or 'F'
      do: 6.8,             // 0.0 to 20.0 mg/L with 0.1 step
      salinity: 0.5,       // 0.0 to 50.0 ppt with 0.1 step
      secchi: 45,          // 0 to 200 cm with 1 cm step
      ammonia: 0.05,       // 0.00 to 5.00 mg/L with 0.01 step
      nitrite: 0.02,       // 0.00 to 5.00 mg/L with 0.01 step
      nitrate: 10.0,       // 0.0 to 100.0 mg/L
      alkalinity: 120,     // 0 to 400 mg/L CaCO3
      stationId: 'SURVEY-STN-01',
      waterBody: 'Aquaculture Pond',
      surveyor: 'Fishery Officer',
      speciesObserved: 'Oreochromis niloticus (Nile Tilapia)',
      fishCount: 150,
      fishHealth: 'Healthy / Active Feeding',
      notes: 'Water clear with greenish hue. Normal surface activity.'
    };

    this.listeners = [];
  }

  init() {
    this.bindDomElements();
    this.updateAllDisplays();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.params);
  }

  notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.params);
      } catch (e) {
        console.error('Error in param listener:', e);
      }
    });
  }

  setParam(key, value) {
    if (key === 'ph') {
      // Clamp between 4.0 and 9.0 with 0.1 resolution
      const num = parseFloat(value);
      this.params.ph = Math.min(9.0, Math.max(4.0, Math.round(num * 10) / 10));
    } else if (typeof this.params[key] === 'number') {
      this.params[key] = parseFloat(value);
    } else {
      this.params[key] = value;
    }
    this.updateAllDisplays();
    this.notify();
  }

  // Precision Stepper for pH (-0.1 or +0.1)
  stepPh(delta) {
    const current = this.params.ph;
    const next = Math.round((current + delta) * 10) / 10;
    this.setParam('ph', next);
  }

  // Precision Stepper for any numeric parameter
  stepParam(key, delta, minVal, maxVal, decimals = 1) {
    const factor = Math.pow(10, decimals);
    const current = this.params[key];
    const next = Math.round((current + delta) * factor) / factor;
    const clamped = Math.min(maxVal, Math.max(minVal, next));
    this.setParam(key, clamped);
  }

  // Get color on the pH Universal Spectrum based on 4.0 - 9.0 value
  getPhColor(phVal) {
    const ph = parseFloat(phVal);
    if (ph <= 4.5) return '#ef4444'; // Red (Strong Acid)
    if (ph <= 5.5) return '#f97316'; // Orange (Moderate Acid)
    if (ph <= 6.5) return '#eab308'; // Yellow (Slight Acid)
    if (ph <= 7.5) return '#22c55e'; // Green (Neutral/Optimal)
    if (ph <= 8.5) return '#06b6d4'; // Cyan/Teal (Optimal Alkaline/Marine)
    return '#8b5cf6';                // Purple (High Alkaline)
  }

  // Evaluate Aquaculture & Fishery biological health status for pH
  evaluatePhHealth(phVal) {
    const ph = parseFloat(phVal);
    if (ph < 5.0) {
      return {
        status: 'critical',
        label: '🚨 Toxic Acidic Water (pH < 5.0)',
        message: 'Severe risk of fish mortality. Gill mucous precipitation, acidosis, and respiratory failure.',
        suitability: 'Unsuitable for most freshwater & marine aquaculture.'
      };
    } else if (ph < 6.5) {
      return {
        status: 'warning',
        label: '⚠️ Sub-optimal Acidic (pH 5.0 - 6.5)',
        message: 'Reduced growth, poor feed conversion, susceptible to fungal infection. Liming recommended.',
        suitability: 'Tolerable only for specific acid-tolerant species (e.g., Catfish/Anabas).'
      };
    } else if (ph <= 8.5) {
      return {
        status: 'optimal',
        label: '✨ Optimal Fishery Range (pH 6.5 - 8.5)',
        message: 'Ideal biological window. High growth rates, optimal phytoplankton productivity, excellent feed efficiency.',
        suitability: 'Prime conditions for Carp, Tilapia, Trout, Catfish, Sea Bass, and Shrimp.'
      };
    } else {
      return {
        status: 'critical',
        label: '🚨 High Alkaline Stress (pH > 8.5)',
        message: 'Ammonia toxicity increases exponentially at high pH. Gill tissue erosion and fin rot danger.',
        suitability: 'Requires water exchange or organic acidification.'
      };
    }
  }

  // Evaluate Dissolved Oxygen (DO)
  evaluateDoHealth(doVal) {
    const doLevel = parseFloat(doVal);
    if (doLevel < 3.0) {
      return {
        status: 'critical',
        label: '🚨 Hypoxic Danger (< 3.0 mg/L)',
        message: 'Critical oxygen depletion. Fish gasping at surface. Immediate aeration required!'
      };
    } else if (doLevel < 5.0) {
      return {
        status: 'warning',
        label: '⚠️ Sub-optimal Oxygen (3.0 - 5.0 mg/L)',
        message: 'Suppressed feeding and slow growth. Fish experiencing respiratory stress.'
      };
    } else {
      return {
        status: 'optimal',
        label: '✨ Optimal Oxygenation (≥ 5.0 mg/L)',
        message: 'Healthy respiration and high digestive metabolic efficiency.'
      };
    }
  }

  // Evaluate Salinity
  classifySalinity(salVal) {
    const sal = parseFloat(salVal);
    if (sal < 0.5) return 'Freshwater (<0.5 ppt)';
    if (sal <= 5.0) return 'Oligohaline / Low Brackish (0.5 - 5.0 ppt)';
    if (sal <= 18.0) return 'Mesohaline / Brackish (5.0 - 18.0 ppt)';
    if (sal <= 30.0) return 'Polyhaline (18.0 - 30.0 ppt)';
    if (sal <= 40.0) return 'Euhaline / Marine (30.0 - 40.0 ppt)';
    return 'Hyperhaline (>40.0 ppt)';
  }

  bindDomElements() {
    // 1. pH Slider
    const phSlider = document.getElementById('phSlider');
    if (phSlider) {
      phSlider.addEventListener('input', (e) => this.setParam('ph', e.target.value));
    }

    // pH Steppers
    const phMinusBtn = document.getElementById('phMinusBtn');
    if (phMinusBtn) phMinusBtn.addEventListener('click', () => this.stepPh(-0.1));

    const phPlusBtn = document.getElementById('phPlusBtn');
    if (phPlusBtn) phPlusBtn.addEventListener('click', () => this.stepPh(0.1));

    // 2. pH Popup Elements
    const popupPhSlider = document.getElementById('popupPhSlider');
    if (popupPhSlider) {
      popupPhSlider.addEventListener('input', (e) => this.setParam('ph', e.target.value));
    }
    const popupPhMinus = document.getElementById('popupPhMinus');
    if (popupPhMinus) popupPhMinus.addEventListener('click', () => this.stepPh(-0.1));
    const popupPhPlus = document.getElementById('popupPhPlus');
    if (popupPhPlus) popupPhPlus.addEventListener('click', () => this.stepPh(0.1));

    // Preset buttons for pH
    document.querySelectorAll('[data-ph-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = parseFloat(btn.getAttribute('data-ph-preset'));
        this.setParam('ph', val);
      });
    });

    // 3. Temperature Slider & Steppers
    const tempSlider = document.getElementById('tempSlider');
    if (tempSlider) {
      tempSlider.addEventListener('input', (e) => this.setParam('temp', e.target.value));
    }
    const tempMinusBtn = document.getElementById('tempMinusBtn');
    if (tempMinusBtn) tempMinusBtn.addEventListener('click', () => this.stepParam('temp', -0.5, 0, 45, 1));
    const tempPlusBtn = document.getElementById('tempPlusBtn');
    if (tempPlusBtn) tempPlusBtn.addEventListener('click', () => this.stepParam('temp', 0.5, 0, 45, 1));

    // 4. Dissolved Oxygen (DO) Slider & Steppers
    const doSlider = document.getElementById('doSlider');
    if (doSlider) {
      doSlider.addEventListener('input', (e) => this.setParam('do', e.target.value));
    }
    const doMinusBtn = document.getElementById('doMinusBtn');
    if (doMinusBtn) doMinusBtn.addEventListener('click', () => this.stepParam('do', -0.2, 0, 20, 1));
    const doPlusBtn = document.getElementById('doPlusBtn');
    if (doPlusBtn) doPlusBtn.addEventListener('click', () => this.stepParam('do', 0.2, 0, 20, 1));

    // 5. Salinity Slider & Steppers
    const salSlider = document.getElementById('salinitySlider');
    if (salSlider) {
      salSlider.addEventListener('input', (e) => this.setParam('salinity', e.target.value));
    }
    const salMinusBtn = document.getElementById('salMinusBtn');
    if (salMinusBtn) salMinusBtn.addEventListener('click', () => this.stepParam('salinity', -0.5, 0, 50, 1));
    const salPlusBtn = document.getElementById('salPlusBtn');
    if (salPlusBtn) salPlusBtn.addEventListener('click', () => this.stepParam('salinity', 0.5, 0, 50, 1));

    // 6. Ammonia Slider
    const nh3Slider = document.getElementById('ammoniaSlider');
    if (nh3Slider) {
      nh3Slider.addEventListener('input', (e) => this.setParam('ammonia', e.target.value));
    }

    // 7. Secchi Depth Slider
    const secchiSlider = document.getElementById('secchiSlider');
    if (secchiSlider) {
      secchiSlider.addEventListener('input', (e) => this.setParam('secchi', e.target.value));
    }

    // 8. Station metadata inputs
    const stationInput = document.getElementById('stationIdInput');
    if (stationInput) stationInput.addEventListener('input', (e) => this.setParam('stationId', e.target.value));

    const waterBodySelect = document.getElementById('waterBodySelect');
    if (waterBodySelect) waterBodySelect.addEventListener('change', (e) => this.setParam('waterBody', e.target.value));

    const surveyorInput = document.getElementById('surveyorInput');
    if (surveyorInput) surveyorInput.addEventListener('input', (e) => this.setParam('surveyor', e.target.value));

    const speciesInput = document.getElementById('speciesInput');
    if (speciesInput) speciesInput.addEventListener('input', (e) => this.setParam('speciesObserved', e.target.value));

    const fishCountInput = document.getElementById('fishCountInput');
    if (fishCountInput) fishCountInput.addEventListener('input', (e) => this.setParam('fishCount', e.target.value));

    const fishHealthSelect = document.getElementById('fishHealthSelect');
    if (fishHealthSelect) fishHealthSelect.addEventListener('change', (e) => this.setParam('fishHealth', e.target.value));

    const notesInput = document.getElementById('surveyNotesInput');
    if (notesInput) notesInput.addEventListener('input', (e) => this.setParam('notes', e.target.value));
  }

  updateAllDisplays() {
    const p = this.params;

    // --- pH Displays ---
    const phValStr = p.ph.toFixed(1);
    const phColor = this.getPhColor(p.ph);
    const phHealth = this.evaluatePhHealth(p.ph);

    // Main Form pH
    const phDisplay = document.getElementById('phDisplayVal');
    if (phDisplay) phDisplay.innerText = phValStr;

    const phSlider = document.getElementById('phSlider');
    if (phSlider) phSlider.value = p.ph;

    const phMarker = document.getElementById('phSpectrumMarker');
    if (phMarker) {
      // 4.0 is 0%, 9.0 is 100%
      const pct = Math.max(0, Math.min(100, ((p.ph - 4.0) / 5.0) * 100));
      phMarker.style.left = `${pct}%`;
    }

    const phEcoBox = document.getElementById('phEcoStatusBox');
    if (phEcoBox) {
      phEcoBox.className = `eco-status-box status-${phHealth.status}`;
      phEcoBox.innerHTML = `<strong>${phHealth.label}</strong>: ${phHealth.message}`;
    }

    // Popup pH Modal
    const popupPhVal = document.getElementById('popupPhBigVal');
    if (popupPhVal) popupPhVal.innerText = phValStr;

    const popupGauge = document.getElementById('popupPhGauge');
    if (popupGauge) {
      popupGauge.style.borderColor = phColor;
      popupGauge.style.boxShadow = `0 0 30px ${phColor}66`;
    }

    const popupPhSlider = document.getElementById('popupPhSlider');
    if (popupPhSlider) popupPhSlider.value = p.ph;

    const popupEcoInfo = document.getElementById('popupPhEcoInfo');
    if (popupEcoInfo) {
      popupEcoInfo.className = `eco-status-box status-${phHealth.status}`;
      popupEcoInfo.innerHTML = `<div><strong>${phHealth.label}</strong><br><span style="font-size: 0.85rem">${phHealth.message}</span><br><em style="font-size:0.75rem; color: #a0aec0;">${phHealth.suitability}</em></div>`;
    }

    // Active state on presets
    document.querySelectorAll('[data-ph-preset]').forEach((btn) => {
      const val = parseFloat(btn.getAttribute('data-ph-preset'));
      if (Math.abs(val - p.ph) < 0.05) {
        btn.classList.add('active-preset');
      } else {
        btn.classList.remove('active-preset');
      }
    });

    // --- Temperature Displays ---
    const tempDisplay = document.getElementById('tempDisplayVal');
    if (tempDisplay) tempDisplay.innerText = p.temp.toFixed(1);
    const tempSlider = document.getElementById('tempSlider');
    if (tempSlider) tempSlider.value = p.temp;

    // --- Dissolved Oxygen Displays ---
    const doDisplay = document.getElementById('doDisplayVal');
    if (doDisplay) doDisplay.innerText = p.do.toFixed(1);
    const doSlider = document.getElementById('doSlider');
    if (doSlider) doSlider.value = p.do;
    const doEcoBox = document.getElementById('doEcoStatusBox');
    if (doEcoBox) {
      const doHealth = this.evaluateDoHealth(p.do);
      doEcoBox.className = `eco-status-box status-${doHealth.status}`;
      doEcoBox.innerHTML = `<strong>${doHealth.label}</strong>: ${doHealth.message}`;
    }

    // --- Salinity Displays ---
    const salDisplay = document.getElementById('salinityDisplayVal');
    if (salDisplay) salDisplay.innerText = p.salinity.toFixed(1);
    const salSlider = document.getElementById('salinitySlider');
    if (salSlider) salSlider.value = p.salinity;
    const salClassBox = document.getElementById('salinityClassBadge');
    if (salClassBox) salClassBox.innerText = this.classifySalinity(p.salinity);

    // --- Ammonia Displays ---
    const nh3Display = document.getElementById('ammoniaDisplayVal');
    if (nh3Display) nh3Display.innerText = p.ammonia.toFixed(2);
    const nh3Slider = document.getElementById('ammoniaSlider');
    if (nh3Slider) nh3Slider.value = p.ammonia;

    // --- Secchi Depth Displays ---
    const secchiDisplay = document.getElementById('secchiDisplayVal');
    if (secchiDisplay) secchiDisplay.innerText = p.secchi;
    const secchiSlider = document.getElementById('secchiSlider');
    if (secchiSlider) secchiSlider.value = p.secchi;

    // --- Viewfinder HUD updates ---
    const hudWaterLine = document.getElementById('viewfinderWaterHud');
    if (hudWaterLine) {
      hudWaterLine.innerHTML = `💧 pH: <b>${p.ph.toFixed(1)}</b> | 🌡️ <b>${p.temp.toFixed(1)}°C</b> | 🫁 DO: <b>${p.do.toFixed(1)}mg/L</b> | 🧂 <b>${p.salinity.toFixed(1)}ppt</b>`;
    }
  }
}

window.paramManager = new ParameterManager();
