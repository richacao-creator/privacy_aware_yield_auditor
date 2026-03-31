/**
 * AdStack Privacy & Yield Auditor
 * * A diagnostic tool for Product Managers to verify CCPA/GPP signals 
 * and identify latency between consent and ad auction initialization.
 */

(function() {
    const auditData = {
        timestamp: new Date().toISOString(),
        consentLatency: "Pending...",
        signals: { 
            usp: "Not Detected", 
            gpp: "Not Detected" 
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
            if (success && data) {
                auditData.signals.usp = data.uspString;
                auditData.consentLatency = `${(performance.now() - startTime).toFixed(2)}ms`;
            }
        });
    }

    // 2. Check for Global Privacy Platform (GPP)
    if (typeof __gpp === 'function') {
        try {
            const gppData = __gpp('getGPPData');
            auditData.signals.gpp = gppData?.gppString || "Object exists, no string";
        } catch (e) {
            auditData.signals.gpp = "Error retrieving GPP";
        }
    }

    // 3. Verify Google Ad Manager Sync (Hardened Fix)
    if (window.googletag && googletag.apiReady) {
        try {
            // Check if pubads service is available
            if (typeof googletag.pubads === 'function') {
                const pubads = googletag.pubads();
                // Check for generic privacy settings availability
                const privacyEnabled = pubads.get("privacySettings") || "Active";
                auditData.stackSync.gam = true;
            }
        } catch (e) {
            auditData.stackSync.gam = "Initialized with errors";
        }
    }

    // 4. Verify Prebid.js Sync
    if (window.pbjs && (pbjs.libLoaded || pbjs.adUnits)) {
        try {
            const pbConfig = pbjs.getConfig('consentManagement');
            auditData.stackSync.prebid = !!pbConfig;
        } catch (e) {
            auditData.stackSync.prebid = "Library detected, config hidden";
        }
    }

    // Final Reporting with slight delay to allow async signals to return
    setTimeout(() => {
        console.log("%c--- AdStack Privacy & Yield Audit ---", "color: #4285F4; font-weight: bold; font-size: 14px;");
        console.table(auditData);

        // Performance Insight
        const latency = parseFloat(auditData.consentLatency);
        if (latency > 500) {
            console.warn(`⚠️ High Consent Latency (${auditData.consentLatency}): This may be causing 'bid shivering' among programmatic partners.`);
        } else if (!isNaN(latency)) {
            console.log(`✅ Healthy Consent Sync: ${auditData.consentLatency}`);
        }
    }, 1500);
})();
