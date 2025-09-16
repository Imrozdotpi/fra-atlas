// src/components/HeaderToolbar.jsx
import React from "react";

export default function HeaderToolbar(props) {
  const {
    onNewClaim,
    onReset,
    showStates,
    setShowStates,
    showDistricts,
    setShowDistricts,
    showVillages,
    setShowVillages,
    showGranted,
    setShowGranted,
    showPending,
    setShowPending,
    viewMode,
    selectedStateFeature,
    selectedDistrictFeature,
    onBackToState,
    onBackToDistrict,

    // new props
    currentUser,
    onLogout,
  } = props;

  function getStateLabel(f) {
    if (!f) return "";
    return (
      f?.properties?.STATE ||
      f?.properties?.NAME_1 ||
      f?.properties?.st_name ||
      f?.properties?.name ||
      ""
    );
  }

  function handleImgError(e) {
    console.warn("Logo failed to load:", e.currentTarget.src);
    e.currentTarget.style.display = "none";
  }

  const userDisplayName =
    currentUser?.full_name ||
    currentUser?.name ||
    currentUser?.username ||
    currentUser?.email ||
    null;

  return (
    <header className="header-bar w-full">
      {/* Top row with logos (left), centered title, action buttons (right) */}
      <div className="header-inner max-w-full mx-auto px-4 py-3 relative flex items-center justify-between">
        {/* LEFT: Logos */}
        <div className="header-left flex items-center gap-3">
          <img
            src="/logos/ministry.png"
            alt="Ministry of Tribal Affairs"
            onError={handleImgError}
            className="org-logo mota-logo"
          />
          <img
            src="/logos/navic.png"
            alt="NavIC"
            onError={handleImgError}
            className="org-logo navic-logo"
          />
        </div>

        {/* CENTER: Absolutely centered FRA Atlas */}
        <div className="header-center absolute left-0 right-0 pointer-events-none text-center">
          <div className="site-title inline-block pointer-events-none">
            <div className="text-xl font-bold text-gray-800 tracking-tight">
              FRA Atlas
            </div>
          </div>
        </div>

        {/* RIGHT: Action buttons + user area */}
        <div className="header-right flex items-center gap-3 ml-auto">
          <button
            onClick={onNewClaim}
            className="btn-primary px-4 py-2 rounded-lg shadow"
            aria-label="New FRA Claim"
          >
            New FRA Claim
          </button>

          <button
            onClick={onReset}
            className="btn-reset px-4 py-2 rounded-lg border"
            aria-label="Reset View"
          >
            Reset View
          </button>

          {/* NEW: user name + logout (small, right-aligned) */}
          <div className="ml-4 flex items-center space-x-3">
            {userDisplayName ? (
              <>
                <div className="text-sm font-medium text-gray-800">
                  <span className="sr-only">Signed in as</span>
                  Welcome,{" "}
                  <span className="font-semibold">
                    {userDisplayName}
                  </span>
                  {currentUser?.role ? (
                    <span className="text-xs text-gray-500 ml-2">({currentUser.role})</span>
                  ) : null}
                </div>

                <button
                  onClick={onLogout}
                  className="px-3 py-1 border rounded hover:bg-gray-100 text-sm"
                  title="Logout"
                  aria-label="Logout"
                  type="button"
                >
                  Logout
                </button>
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>

      {/* Bottom controls row (toggles + status) */}
      <div className="controls-row max-w-full mx-auto px-6 py-3">
        <div className="flex items-center flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showStates}
              onChange={(e) => setShowStates(e.target.checked)}
            />
            <span>Show States</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showDistricts}
              onChange={(e) => setShowDistricts(e.target.checked)}
            />
            <span>Show Districts</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showVillages}
              onChange={(e) => setShowVillages(e.target.checked)}
            />
            <span>Show Villages</span>
          </label>

          <div className="flex items-center gap-2 ml-4">
            <span className="status-pill granted">Granted</span>
            <span className="status-pill pending">Pending</span>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            Level: {viewMode}
          </div>
        </div>
      </div>
    </header>
  );
}
