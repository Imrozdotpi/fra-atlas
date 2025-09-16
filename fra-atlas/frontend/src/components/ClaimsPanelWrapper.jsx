// src/components/ClaimsPanelWrapper.jsx
import React from "react";
import ClaimsTable from "./ClaimsTable"; // adjust path if your ClaimsTable is elsewhere

export default function ClaimsPanelWrapper({
  dbClaims,
  onRowClick,
  onDeleteSuccess,
  onZoom,
  onEdit,
  onUpdateSuccess,
  onUpdate,
}) {
  return (
    <div className="space-y-2">
      <h2 className="font-semibold">Claims (DB)</h2>
      <ClaimsTable
        claims={dbClaims}
        onRowClick={onRowClick}
        onDeleteSuccess={onDeleteSuccess}
        onZoom={onZoom}
        onEdit={onEdit}
        onUpdateSuccess={onUpdateSuccess}
        onUpdate={onUpdate}
      />
    </div>
  );
}
