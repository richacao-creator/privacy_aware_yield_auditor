/**
 * Privacy-Aware Yield Auditor
 * Purpose: Diagnostic tool to verify CCPA/GPP signals and 
 * identify latency between consent and ad auction initialization.
 */

(function() {
    const auditData = {
        timestamp: new Date().toISOString(),
        consentLatency: null,
        signals: {
            usp: null,
            gpp: null
        },
        stackSync: {
            gam: false,
            prebid: false
        }
    };

    const startTime = performance.now();

    // 1. Check for CCPA (US Privacy API)
    if (typeof __uspapi === 'function') {
        __uspapi('getUSPData', 1, (data, success) => {
            if (success) {
                auditData.signals.usp = data.uspString;
                auditData.consentLatency = `${(performance.now() - startTime).toFixed(2)}ms`;
                console.log("✅ CCPA Signal Detected:", data.uspString);
            }
        });
    }

    // 2. Check for Global Privacy Platform (GPP)
    if (typeof __gpp === 'function') {
        const gppData = __gpp('getGPPData');
        auditData.signals.gpp = gppData?.gppString || "Not Found";
    }

    // 3. Verify Google Ad Manager Sync
    const googletag = window.googletag || {};
    if (googletag.apiReady) {
        const privacySettings = googletag.pubads().getPrivacySettings();
        auditData.stackSync.gam = !!privacySettings;
        console.log("📡 GAM Privacy Sync Status:", privacySettings);
    }

    // 4. Verify Prebid.js Sync
    const pbjs = window.pbjs || {};
    if (pbjs.libLoaded) {
        const pbConfig = pbjs.getConfig('consentManagement');
        auditData.stackSync.prebid = !!pbConfig;
        console.log("⚡ Prebid Consent Config:", pbConfig);
    }

    // Final Audit Summary
    setTimeout(() => {
        console.table(auditData);
        if (parseFloat(auditData.consentLatency) > 500) {
            console.warn("⚠️ HIGH LATENCY: Consent took >500ms, likely causing bid shivering.");
        }
    }, 1000);
})();
