# 🚀 Complete Google Play Store Release Guide for AquaSurvey Pro

This guide outlines the step-by-step procedure for publishing **AquaSurvey Pro** to the **Google Play Store** under the **ICAR Research Complex for NEH Region** institutional developer account.

---

## 📋 1. Google Play Store Listing Metadata

Copy and paste these exact details into the **Google Play Console** listing page:

### **App Name (Title)** *(Max 30 characters)*
```
AquaSurvey Pro: Fishery Suite
```

### **Short Description** *(Max 80 characters)*
```
Geotagged fishery survey & water quality suite by ICAR RC for NEH Region.
```

### **Full Description** *(Formatted for Google Play)*
```markdown
AquaSurvey Pro is a professional field survey and water quality monitoring application developed by the scientific team at the ICAR Research Complex for NEH Region, Umiam, Meghalaya.

Designed specifically for fishery biologists, aquaculture researchers, state fisheries officers, and field surveyors, AquaSurvey Pro allows real-time camera geotagging, precision water quality parameter profiling, biological stock monitoring, and offline GIS mapping.

🌟 KEY FEATURES:

📍 Real-Time Camera Geotagging & Watermarking:
- High-precision GPS coordinate capture (Decimal Degrees & DMS).
- Burns date/time, altitude, accuracy, station ID, institutional seal, and water parameters directly onto captured field photos.
- 4 customizable watermark styles: Oceanic Glassmorphic Banner, Scientific HUD, Minimal Stamp, and Official Research Certificate.

🧪 Precision Water Quality Parameters:
- Interactive Water pH Dial: Full 4.0 to 9.0 range with 0.1 precision increments, universal color spectrum, and biological aquaculture health evaluation.
- Dissolved Oxygen (DO): 0.0 - 20.0 mg/L with Hypoxia/Anoxia alerts.
- Water Temperature: 0.0 - 45.0 °C with thermal stress guidance.
- Salinity: 0.0 - 50.0 ppt with automated ecological classification (Freshwater, Brackish, Marine).
- Turbidity / Secchi Depth: 0 - 200 cm transparency measurement.
- Total Ammonia (NH3), Nitrite & Alkalinity monitoring.

🐟 Fish Stock & Ecological Observations:
- Record observed fish species, estimated catch/biomass, behavior, and environmental remarks.

🗺️ Offline Field GIS Mapping:
- Plot survey stations on an interactive GIS map.
- Automatic water quality index color-coded pins (🟢 Optimal | 🟡 Caution | 🔴 Critical).
- 100% Offline capability: Stores all data locally on your device with zero data loss in remote locations without cellular reception.

📊 Multi-Format Data Export:
- One-tap export to CSV spreadsheets (ready for Microsoft Excel, R, QGIS, ArcGIS).
- JSON backup and printable field research survey certificates.

👨‍🔬 SCIENTIFIC DEVELOPER TEAM:
- Dr. Huidrom Dayananda Singh
- Dr. Sadokpam Gojendro Singh
- Dr. Hijam Jiten Singh
- Dr. Angom Lenin

🙏 INSTITUTIONAL ACKNOWLEDGEMENT:
The developers want to sincerely thank the Director, ICAR Research Complex for NEH Region, for his continuous encouragement, visionary guidance, and invaluable support in developing this application.

🏛️ Institution: ICAR Research Complex for NEH Region, Indian Council of Agricultural Research (भाकृअनुप), Umiam, Meghalaya, India.
```

### **Category & Tags**
- **Category:** Productivity / Education
- **Tags:** `Aquaculture`, `Fishery`, `Water Quality`, `GPS Camera`, `GIS Map`, `Agriculture`, `ICAR`

### **Privacy Policy URL**
- Provide the hosted link to `privacy-policy.html` (e.g. `https://your-domain.gov.in/privacy-policy.html` or GitHub Pages link).

---

## 📦 2. How to Generate the Android App Bundle (`.aab`)

Google Play Store requires an **Android App Bundle (`.aab`)** file. You can generate it using either of the following two standard methods:

### Method A: Using PWABuilder (Recommended — Quickest & Easiest)
1. Upload/Host your app online (e.g. on GitHub Pages or ICAR server).
2. Go to **[PWABuilder.com](https://www.pwabuilder.com/)**.
3. Enter your app URL and click **Start**.
4. In the Android section, click **"Package for Android"**.
5. Configure your Package ID: `in.gov.icar.neh.aquasurvey`
6. Click **Generate** and download the signed **`.aab`** file.

### Method B: Using Google's Official Bubblewrap CLI
Run the following in PowerShell/terminal:
```bash
npx @bubblewrap/cli init --manifest=https://your-domain.gov.in/manifest.json
npx @bubblewrap/cli build
```
This produces `app-release-signed.aab`.

---

## 🏢 3. Uploading to Google Play Console

1. **Sign in to Google Play Console:**
   - Go to [play.google.com/console](https://play.google.com/console) with your ICAR/developer Google account.
2. **Create New App:**
   - App Name: `AquaSurvey Pro: Fishery Suite`
   - Default Language: `English (United States)` or `English (India)`
   - App or Game: `App`
   - Free or Paid: `Free`
3. **Complete the "Set up your app" Checklist:**
   - **Privacy Policy:** Paste your `privacy-policy.html` URL.
   - **App Access:** Select *"All functionality is available without special access"*.
   - **Ads:** Select *"No, my app does not contain ads"*.
   - **Content Ratings:** Complete the questionnaire (Select *Utility / Productivity* $\rightarrow$ Rating will be *Everyone / All Ages*).
   - **Target Audience:** Select *18 and over* (or 13+).
   - **Data Safety Form:**
     - Does your app collect data? $\rightarrow$ Select **No** (Data is stored locally on device and only exported manually by user).
     - Permissions used: Camera & Location (Used for core app functionality: geotagging survey photos).
4. **Store Presence (Graphics):**
   - **App Icon:** Upload `assets/icar_logo.png` (512 x 512 px).
   - **Feature Graphic:** 1024 x 500 px banner image.
   - **Phone Screenshots:** At least 2 to 4 screenshots of the app (Camera viewfinder, pH range dial, Records list, Field map).
5. **Releases:**
   - Go to **Production** $\rightarrow$ **Create New Release**.
   - Upload your **`.aab`** bundle.
   - Release Name: `1.0.0`
   - Release Notes: `Initial official release of AquaSurvey Pro by ICAR Research Complex for NEH Region.`
   - Click **Save** $\rightarrow$ **Review Release** $\rightarrow$ **Start rollout to Production**.

---

## ⏳ 4. Review & Approval Timeline
- Google typically reviews new government/scientific utility apps within **24 to 72 hours**.
- Once approved, the app will be live on the Google Play Store for all Android users across India and globally!
