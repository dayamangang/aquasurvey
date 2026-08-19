/**
 * AquaSurvey Pro - Main Application Controller
 * Coordinates camera, GPS, parameter sliders, canvas watermarking, map plotting, profile settings, and storage.
 */

class AquaSurveyApp {
  constructor() {
    this.activeTab = 'capture';
    this.currentCapturedCanvas = null;
    this.currentStampedDataUrl = null;
    this.surveysCache = [];

    // Organization & Developer Profile (ICAR Research Complex for NEH Region)
    this.profile = {
      instituteName: 'ICAR Research Complex for NEH Region',
      developerName: 'Dr. Huidrom Dayananda Singh, Dr. Sadokpam Gojendro Singh, Dr. Hijam Jiten Singh & Dr. Angom Lenin',
      developersList: [
        { name: 'Dr. Huidrom Dayananda Singh', role: 'Scientist / Developer' },
        { name: 'Dr. Sadokpam Gojendro Singh', role: 'Scientist / Developer' },
        { name: 'Dr. Hijam Jiten Singh', role: 'Scientist / Developer' },
        { name: 'Dr. Angom Lenin', role: 'Scientist / Developer' }
      ],
      acknowledgement: 'The developers want to sincerely thank the Director, ICAR Research Complex for NEH Region, for his encouragement and support for developing this App.',
      department: 'Fisheries & Aquaculture Division',
      projectTitle: 'Fishery Survey & Water Quality Assessment - NEH Region',
      surveyorDefault: 'Fishery Research Officer'
    };
  }

  async init() {
    console.log('🌊 Initializing AquaSurvey Pro...');

    // 1. Load Profile Settings from LocalStorage
    this.loadProfileSettings();

    // 2. Initialize Storage & Seed initial demo surveys if clean
    if (window.storageService) {
      await window.storageService.init();
      this.surveysCache = await window.storageService.seedDemoDataIfEmpty();
    }

    // 3. Initialize Geolocation Service
    if (window.geoService) {
      window.geoService.init();
      window.geoService.subscribe((pos, hasRealGps) => this.onLocationUpdate(pos, hasRealGps));
    }

    // 4. Initialize Parameters System
    if (window.paramManager) {
      window.paramManager.init();
      // Set default surveyor name if present
      if (this.profile.surveyorDefault) {
        window.paramManager.setParam('surveyor', this.profile.surveyorDefault);
      }
    }

    // 5. Initialize Camera
    if (window.cameraController) {
      await window.cameraController.init('viewfinderVideo');
    }

    // 6. Bind Navigation & Action Buttons
    this.bindNavigation();
    this.bindActionEvents();

    // 7. Refresh Records Log & Map & Profile UI
    this.updateProfileUI();
    await this.refreshRecordsList();

    // 8. Register PWA Service Worker for Android offline caching
    this.registerServiceWorker();

    // 9. Initial status toast
    this.showToast(`🌊 AquaSurvey Pro ready | ${this.profile.instituteName}`, 'info');
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => console.log('📱 Service Worker registered for offline Android support:', reg.scope))
          .catch((err) => console.warn('Service Worker registration failed:', err));
      });
    }
  }

  loadProfileSettings() {
    try {
      const saved = localStorage.getItem('aquasurvey_profile');
      if (saved) {
        this.profile = { ...this.profile, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Error reading profile settings:', e);
    }
  }

  saveProfileSettings(newProfile) {
    this.profile = { ...this.profile, ...newProfile };
    try {
      localStorage.setItem('aquasurvey_profile', JSON.stringify(this.profile));
    } catch (e) {
      console.warn('Error saving profile settings:', e);
    }
    this.updateProfileUI();
    this.showToast('✅ Institutional profile & developer metadata saved!', 'success');
  }

  updateProfileUI() {
    // Header Subtitle
    const subEl = document.getElementById('headerBrandSubtitle');
    if (subEl) {
      subEl.innerHTML = `<span style="color:var(--accent-cyan); font-weight:600;">${this.profile.instituteName}</span> • Fishery Survey Suite`;
    }

    // Profile Settings Form Inputs
    const instInput = document.getElementById('profileInstituteInput');
    if (instInput) instInput.value = this.profile.instituteName || '';

    const deptInput = document.getElementById('profileDeptInput');
    if (deptInput) deptInput.value = this.profile.department || '';

    const projInput = document.getElementById('profileProjectInput');
    if (projInput) projInput.value = this.profile.projectTitle || '';

    const survInput = document.getElementById('profileSurveyorInput');
    if (survInput) survInput.value = this.profile.surveyorDefault || '';

    // If live viewfinder is displaying, update HUD text if needed
    const hudTop = document.getElementById('viewfinderWaterHud');
    if (hudTop && window.paramManager) {
      window.paramManager.updateAllDisplays();
    }
  }

  bindNavigation() {
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;

    // Update Tab Buttons
    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Tab Content Panels
    document.querySelectorAll('.tab-content-panel').forEach((panel) => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Specific on-tab activations
    if (tabId === 'map' && window.surveyMapController) {
      window.surveyMapController.init('fisherySurveyMap');
      window.surveyMapController.refreshMapSize();
      window.surveyMapController.renderSurveyMarkers(this.surveysCache);
    } else if (tabId === 'records') {
      this.refreshRecordsList();
    }
  }

  bindActionEvents() {
    // 1. Shutter Button
    const shutterBtn = document.getElementById('shutterBtn');
    if (shutterBtn) {
      shutterBtn.addEventListener('click', () => this.handleCapturePhoto());
    }

    // 2. Camera Switcher (Front/Rear)
    const switchCamBtn = document.getElementById('switchCameraBtn');
    if (switchCamBtn) {
      switchCamBtn.addEventListener('click', async () => {
        if (window.cameraController) {
          const mode = await window.cameraController.switchCamera();
          this.showToast(`Switched camera to ${mode === 'environment' ? 'Rear / Main' : 'Front / User'}`, 'info');
        }
      });
    }

    // 3. File Upload Trigger
    const uploadInput = document.getElementById('photoFileInput');
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    if (uploadBtn && uploadInput) {
      uploadBtn.addEventListener('click', () => uploadInput.click());
      uploadInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
          try {
            const fileCanvas = await window.cameraController.handleFileUpload(e.target.files[0]);
            this.processAndPreviewPhoto(fileCanvas);
          } catch (err) {
            this.showToast('Failed to load image file', 'error');
          }
        }
      });
    }

    // 5. Open pH Popup Modal Button
    const openPhPopupBtn = document.getElementById('openPhPopupBtn');
    if (openPhPopupBtn) {
      openPhPopupBtn.addEventListener('click', () => this.openModal('phPopupModal'));
    }

    // 6. Save Stamped Survey Button
    const saveSurveyBtn = document.getElementById('saveSurveyBtn');
    if (saveSurveyBtn) {
      saveSurveyBtn.addEventListener('click', () => this.saveCurrentSurvey());
    }

    // 7. Download Stamped Image Button
    const downloadImgBtn = document.getElementById('downloadStampedBtn');
    if (downloadImgBtn) {
      downloadImgBtn.addEventListener('click', () => {
        if (this.currentStampedDataUrl && window.exportService) {
          window.exportService.downloadImage(this.currentStampedDataUrl);
          this.showToast('📥 Watermarked photo downloaded!', 'success');
        }
      });
    }

    // 8. Search Filter in Records Log
    const searchInput = document.getElementById('recordsSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.filterRecords(e.target.value));
    }

    // 9. Export Buttons
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        if (window.exportService) {
          window.exportService.exportToCSV(this.surveysCache);
          this.showToast('📊 Exported CSV spreadsheet!', 'success');
        }
      });
    }

    const exportJsonBtn = document.getElementById('exportJsonBtn');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        if (window.exportService) {
          window.exportService.exportToJSON(this.surveysCache);
          this.showToast('💾 Exported JSON archive!', 'success');
        }
      });
    }

    const printReportBtn = document.getElementById('printReportBtn');
    if (printReportBtn) {
      printReportBtn.addEventListener('click', () => {
        if (window.exportService) window.exportService.generatePrintReport(this.surveysCache);
      });
    }

    // 10. Center Map on GPS Button
    const centerGpsBtn = document.getElementById('centerGpsBtn');
    if (centerGpsBtn) {
      centerGpsBtn.addEventListener('click', () => {
        if (window.surveyMapController) {
          window.surveyMapController.centerOnCurrent();
          this.showToast('📍 Centered map on current GPS location', 'info');
        }
      });
    }

    // 11. Profile / Settings & About Modal Buttons
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    if (openSettingsBtn) {
      openSettingsBtn.addEventListener('click', () => this.openModal('settingsModal'));
    }

    const openAboutBtn = document.getElementById('openAboutBtn');
    if (openAboutBtn) {
      openAboutBtn.addEventListener('click', () => this.openModal('aboutModal'));
    }

    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', () => {
        const inst = document.getElementById('profileInstituteInput').value.trim();
        const dept = document.getElementById('profileDeptInput').value.trim();
        const proj = document.getElementById('profileProjectInput').value.trim();
        const surv = document.getElementById('profileSurveyorInput').value.trim();

        this.saveProfileSettings({
          instituteName: inst || 'ICAR Research Complex for NEH Region',
          department: dept,
          projectTitle: proj,
          surveyorDefault: surv
        });

        if (surv && window.paramManager) {
          window.paramManager.setParam('surveyor', surv);
        }

        this.closeAllModals();
      });
    }

    // 12. Modal Close Buttons
    document.querySelectorAll('.modal-close-btn, .modal-backdrop').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          this.closeAllModals();
        }
      });
    });

    // 13. Theme Switcher Toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
        themeBtn.innerText = isLight ? '🌙' : '☀️';
      });
    }
  }

  onLocationUpdate(pos, hasRealGps) {
    const formatted = window.geoService.getFormattedCoordinates(pos.latitude, pos.longitude);

    // Update GPS status pill
    const gpsPill = document.getElementById('gpsStatusPill');
    if (gpsPill) {
      gpsPill.className = hasRealGps ? 'status-pill' : 'status-pill gps-searching';
      gpsPill.innerHTML = `<span class="dot"></span> ${hasRealGps ? 'GPS LOCKED' : 'SIMULATED GPS'}`;
    }

    // Update Top Viewfinder HUD
    const hudCoords = document.getElementById('viewfinderCoordsHud');
    if (hudCoords) hudCoords.innerText = formatted.dd;

    const hudTime = document.getElementById('viewfinderTimeHud');
    if (hudTime) hudTime.innerText = new Date().toLocaleTimeString();

    // Update GPS Meta Grid on Capture Tab
    const metaLat = document.getElementById('metaLatVal');
    if (metaLat) metaLat.innerText = formatted.latDD;

    const metaLng = document.getElementById('metaLngVal');
    if (metaLng) metaLng.innerText = formatted.lngDD;

    const metaAlt = document.getElementById('metaAltVal');
    if (metaAlt) metaAlt.innerText = `${pos.altitude.toFixed(1)} m`;

    const metaAcc = document.getElementById('metaAccVal');
    if (metaAcc) metaAcc.innerText = `±${pos.accuracy.toFixed(1)} m`;

    // Update map marker
    if (window.surveyMapController) {
      window.surveyMapController.updateCurrentPosition(pos.latitude, pos.longitude);
    }

    const stationMeta = document.getElementById('metaStationVal');
    if (stationMeta && window.paramManager) {
      const p = window.paramManager.params || {};
      stationMeta.textContent = p.stationId || 'Field Station';
    }
    const dateMeta = document.getElementById('metaDateVal');
    if (dateMeta) {
      dateMeta.textContent = new Date().toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  }

  // Handle Capture Photo & Watermark
  handleCapturePhoto() {
    if (!window.cameraController) return;

    const capturedCanvas = window.cameraController.captureFrame();
    this.processAndPreviewPhoto(capturedCanvas);
  }

  processAndPreviewPhoto(rawCanvas) {
    this.currentCapturedCanvas = rawCanvas;
    this.renderAndDisplayStampedImage(rawCanvas);
    this.openModal('previewPhotoModal');
  }

  renderAndDisplayStampedImage(rawCanvas) {
    if (!rawCanvas || !window.watermarkEngine) return;

    const geoData = window.geoService ? window.geoService.currentPosition : {};
    const surveyData = {
      stationId: window.paramManager ? window.paramManager.params.stationId : 'STN-01',
      waterBody: window.paramManager ? window.paramManager.params.waterBody : 'Aquaculture Pond',
      surveyor: window.paramManager ? window.paramManager.params.surveyor : 'Field Officer',
      instituteName: this.profile.instituteName,
      projectTitle: this.profile.projectTitle,
      params: window.paramManager ? window.paramManager.params : {}
    };

    const stampedCanvas = window.watermarkEngine.stamp(rawCanvas, geoData, surveyData);
    this.currentStampedDataUrl = stampedCanvas.toDataURL('image/jpeg', 0.92);

    // Update Image Preview
    const previewImg = document.getElementById('stampedPreviewImg');
    if (previewImg) previewImg.src = this.currentStampedDataUrl;

    // Update Preview Summary Box
    const summaryBox = document.getElementById('previewSummaryText');
    if (summaryBox && window.paramManager) {
      const p = window.paramManager.params;
      const coords = window.geoService.getFormattedCoordinates();
      summaryBox.innerHTML = `
        <div style="color:var(--accent-cyan); font-weight:700; font-size:1rem;">🏛️ ${this.profile.instituteName}</div>
        <strong>${surveyData.stationId}</strong> (${surveyData.waterBody}) • Surveyor: <em>${surveyData.surveyor}</em><br>
        📍 Coordinates: <span style="color:var(--accent-cyan); font-family:var(--font-mono);">${coords.dd}</span><br>
        💧 pH: <b>${p.ph.toFixed(1)}</b> | 🌡️ Temp: <b>${p.temp.toFixed(1)}°C</b> | 🫁 DO: <b>${p.do.toFixed(1)} mg/L</b> | 🧂 Salinity: <b>${p.salinity.toFixed(1)} ppt</b>
      `;
    }
  }

  // Save current survey record
  async saveCurrentSurvey() {
    if (!window.storageService || !window.paramManager) return;

    const geoData = window.geoService ? window.geoService.currentPosition : {};
    const formatted = window.geoService ? window.geoService.getFormattedCoordinates() : { dd: '' };
    const params = { ...window.paramManager.params };

    const newRecord = {
      id: 'SRV-' + Date.now(),
      timestamp: new Date().toISOString(),
      instituteName: this.profile.instituteName,
      projectTitle: this.profile.projectTitle,
      stationId: params.stationId || 'FIELD-STATION',
      waterBody: params.waterBody || 'Aquaculture Pond',
      surveyor: params.surveyor || 'Surveyor',
      speciesObserved: params.speciesObserved || 'Not Recorded',
      fishCount: params.fishCount || 0,
      fishHealth: params.fishHealth || 'Normal',
      notes: params.notes || '',
      location: {
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        altitude: geoData.altitude,
        accuracy: geoData.accuracy,
        formattedDD: formatted.dd
      },
      params: {
        ph: params.ph,
        temp: params.temp,
        do: params.do,
        salinity: params.salinity,
        secchi: params.secchi,
        ammonia: params.ammonia,
        nitrite: params.nitrite,
        alkalinity: params.alkalinity
      },
      photoDataUrl: this.currentStampedDataUrl
    };

    await window.storageService.saveSurvey(newRecord);
    this.surveysCache = await window.storageService.getAllSurveys();

    this.closeAllModals();
    this.refreshRecordsList();

    if (window.surveyMapController) {
      window.surveyMapController.renderSurveyMarkers(this.surveysCache);
    }

    this.showToast(`✅ Survey #${newRecord.stationId} saved with institutional geotag!`, 'success');
  }

  // Refresh records list cards
  async refreshRecordsList() {
    if (window.storageService) {
      this.surveysCache = await window.storageService.getAllSurveys();
    }

    // Update record count badge
    const badge = document.getElementById('recordsCountBadge');
    if (badge) badge.innerText = this.surveysCache.length;

    this.renderRecordsGrid(this.surveysCache);
  }

  renderRecordsGrid(surveys) {
    const grid = document.getElementById('recordsGrid');
    if (!grid) return;

    if (!surveys || surveys.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">📋</div>
          <h3>No Field Surveys Logged Yet</h3>
          <p>Take your first geotagged photo and record water quality parameters to populate survey history.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = surveys.map((s) => {
      const p = s.params || {};
      const loc = s.location || {};
      const dateStr = new Date(s.timestamp).toLocaleString();
      const ph = p.ph ? p.ph.toFixed(1) : '--';
      const temp = p.temp ? p.temp.toFixed(1) : '--';
      const doVal = p.do ? p.do.toFixed(1) : '--';
      const inst = s.instituteName || this.profile.instituteName;

      const thumbSrc = s.photoDataUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%230c182b"/><text x="50%" y="50%" fill="%2300d4ff" font-size="16" text-anchor="middle">AquaSurvey Photo</text></svg>';

      return `
        <div class="record-card" id="card-${s.id}">
          <div class="record-thumbnail-wrapper">
            <img src="${thumbSrc}" class="record-thumbnail" alt="Geotagged Survey Photo" loading="lazy">
            <div class="record-geo-tag">📍 ${loc.formattedDD || 'Geotagged'}</div>
          </div>
          <div class="record-body">
            <div class="record-header-meta">
              <div>
                <div style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 700; text-transform: uppercase;">🏛️ ${inst}</div>
                <div class="record-station-id">${s.stationId || 'Survey Station'}</div>
                <div class="record-date">🕒 ${dateStr}</div>
              </div>
              <span class="record-waterbody-badge">${s.waterBody || 'Waterbody'}</span>
            </div>

            <div class="record-params-summary">
              <div class="param-pill-item">
                <span class="param-pill-label">pH Level</span>
                <span class="param-pill-val" style="color: ${window.paramManager ? window.paramManager.getPhColor(p.ph || 7.0) : '#00d4ff'}">${ph}</span>
              </div>
              <div class="param-pill-item">
                <span class="param-pill-label">Temp</span>
                <span class="param-pill-val">${temp}°C</span>
              </div>
              <div class="param-pill-item">
                <span class="param-pill-label">DO</span>
                <span class="param-pill-val">${doVal} mg/L</span>
              </div>
            </div>

            ${s.speciesObserved ? `
              <div style="font-size: 0.8rem; color: var(--text-muted);">
                🐟 <strong>${s.speciesObserved}</strong> (${s.fishCount || 0} count)
              </div>
            ` : ''}

            <div class="record-actions">
              <button class="btn btn-secondary btn-sm" onclick="window.app.viewSurveyDetail('${s.id}')">🔍 Details</button>
              ${s.photoDataUrl ? `<button class="btn btn-primary btn-sm" onclick="window.exportService.downloadImage('${s.photoDataUrl}', 'Survey_${s.stationId}.jpg')">📥 Photo</button>` : ''}
              <button class="btn btn-danger btn-sm" onclick="window.app.deleteSurvey('${s.id}')">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  filterRecords(query) {
    if (!query) {
      this.renderRecordsGrid(this.surveysCache);
      return;
    }
    const q = query.toLowerCase();
    const filtered = this.surveysCache.filter((s) => {
      return (
        (s.stationId && s.stationId.toLowerCase().includes(q)) ||
        (s.instituteName && s.instituteName.toLowerCase().includes(q)) ||
        (s.waterBody && s.waterBody.toLowerCase().includes(q)) ||
        (s.surveyor && s.surveyor.toLowerCase().includes(q)) ||
        (s.speciesObserved && s.speciesObserved.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      );
    });
    this.renderRecordsGrid(filtered);
  }

  viewSurveyDetail(id) {
    const survey = this.surveysCache.find((s) => s.id === id);
    if (!survey) return;

    const modalBody = document.getElementById('surveyDetailModalBody');
    if (!modalBody) return;

    const p = survey.params || {};
    const loc = survey.location || {};
    const dateStr = new Date(survey.timestamp).toLocaleString();

    modalBody.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:1.25rem;">
        ${survey.photoDataUrl ? `
          <div class="stamped-image-container">
            <img src="${survey.photoDataUrl}" alt="Survey Photo">
          </div>
        ` : ''}

        <div class="preview-meta-summary">
          <div style="font-size:0.8rem; color:var(--accent-cyan); font-weight:700; text-transform:uppercase; margin-bottom:0.2rem;">🏛️ ${survey.instituteName || this.profile.instituteName}</div>
          <h3 style="color:var(--text-main); margin-bottom:0.4rem;">${survey.stationId} - ${survey.waterBody}</h3>
          <p><strong>Surveyor:</strong> ${survey.surveyor}</p>
          <p><strong>Date & Time:</strong> ${dateStr}</p>
          <p><strong>GPS Coordinates:</strong> <span style="font-family:var(--font-mono); color:#ffffff;">${loc.formattedDD || '--'}</span> (Alt: ${loc.altitude || 0}m, Acc: ±${loc.accuracy || 3}m)</p>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:0.75rem;">
          <div class="gps-stat-box">
            <div class="gps-stat-label">Water pH</div>
            <div class="gps-stat-value highlight">${p.ph ? p.ph.toFixed(1) : '--'}</div>
          </div>
          <div class="gps-stat-box">
            <div class="gps-stat-label">Temperature</div>
            <div class="gps-stat-value">${p.temp ? p.temp.toFixed(1) : '--'} °C</div>
          </div>
          <div class="gps-stat-box">
            <div class="gps-stat-label">Dissolved Oxygen</div>
            <div class="gps-stat-value highlight">${p.do ? p.do.toFixed(1) : '--'} mg/L</div>
          </div>
          <div class="gps-stat-box">
            <div class="gps-stat-label">Salinity</div>
            <div class="gps-stat-value">${p.salinity ? p.salinity.toFixed(1) : '--'} ppt</div>
          </div>
          <div class="gps-stat-box">
            <div class="gps-stat-label">Ammonia (NH3)</div>
            <div class="gps-stat-value">${p.ammonia !== undefined ? p.ammonia.toFixed(2) : '--'} mg/L</div>
          </div>
          <div class="gps-stat-box">
            <div class="gps-stat-label">Secchi Depth</div>
            <div class="gps-stat-value">${p.secchi || '--'} cm</div>
          </div>
        </div>

        ${survey.speciesObserved ? `
          <div style="background:rgba(4,10,20,0.5); padding:0.9rem; border-radius:var(--radius-md); border:1px solid var(--border-glass);">
            <strong style="color:var(--accent-teal);">🐟 Biological Observation:</strong> ${survey.speciesObserved} (${survey.fishCount || 0} count)<br>
            <span style="font-size:0.85rem; color:var(--text-muted);">Condition: ${survey.fishHealth || 'Normal'}</span><br>
            <p style="margin-top:0.4rem; font-size:0.85rem;"><em>"${survey.notes || 'No notes entered.'}"</em></p>
          </div>
        ` : ''}
      </div>
    `;

    this.openModal('surveyDetailModal');
  }

  async deleteSurvey(id) {
    if (!confirm('Are you sure you want to delete this survey record?')) return;

    if (window.storageService) {
      await window.storageService.deleteSurvey(id);
      this.surveysCache = await window.storageService.getAllSurveys();
      this.refreshRecordsList();
      if (window.surveyMapController) {
        window.surveyMapController.renderSurveyMarkers(this.surveysCache);
      }
      this.showToast('🗑️ Survey record deleted.', 'warning');
    }
  }

  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('open');
  }

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach((m) => m.classList.remove('open'));
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

window.app = new AquaSurveyApp();
document.addEventListener('DOMContentLoaded', () => window.app.init());
