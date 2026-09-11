"use client";

import {
  Pencil,
  PackageX,
  X,
  Cpu,
  MemoryStick,
  HardDrive,
  Camera,
  Calendar,
  User,
  Clock,
  MapPin,
  FolderOpen,
  AlertTriangle,
} from "lucide-react";
import { FONTS } from "@/lib/constants";
import { getAssetStatusLabelKey, getAssetStatusStyle } from "@/lib/assetStatus";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import ImagePreviewModal from "./imagePreviewModal";
import LanguageSwitcher from "../common/languageSwitcher";
const DAMAGED_STATUS = "needs_repair";

export default function PublicItemCard({
  asset,
  permissions,
  maintenance = [],
  onEdit,
  onDeactivate,
}) {
  const t = useTranslations("guestAsset");
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);

  const isDamaged = asset?.status === DAMAGED_STATUS;

  useEffect(() => {
    if (isDamaged) {
      setShowDamageModal(true);
    }
  }, [isDamaged, asset?.id]);

  const handleCloseDamageModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setShowDamageModal(false);
      setIsClosingModal(false);
    }, 200);
  };

  const statusKey = getAssetStatusLabelKey(asset.status);
  const statusLabel = statusKey
    ? t(statusKey, { defaultValue: asset.status })
    : asset.status;
  const statusStyle = getAssetStatusStyle(asset.status);

  const showActions = permissions?.canEdit || permissions?.canDeactivate;
  const getSpecIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes("processor") || lower.includes("cpu"))
      return <Cpu size={16} />;
    if (lower.includes("ram") || lower.includes("memory"))
      return <MemoryStick size={16} />;
    if (
      lower.includes("storage") ||
      lower.includes("ssd") ||
      lower.includes("disk")
    )
      return <HardDrive size={16} />;
    if (lower.includes("gpu") || lower.includes("graphic"))
      return <Camera size={16} />;
    return null;
  };
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="guest-container">
      {/* Damage Alert Modal */}
      {showDamageModal && (
        <>
          <div
            className={`assetra-modal-overlay ${isClosingModal ? "is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="damage-modal-title"
          />
          <div className="assetra-modal-wrapper">
            <div
              className={`assetra-modal-card assetra-modal-card--sm guest-damage-modal ${isClosingModal ? "is-closing" : ""}`}
            >
              <div className="guest-damage-modal-icon">
                <AlertTriangle size={28} />
              </div>
              <h3 id="damage-modal-title" className="guest-damage-modal-title">
                {t("damageAlertTitle") || "Item Damaged"}
              </h3>
              <p className="guest-damage-modal-message">
                {t("damageAlertMessage") ||
                  "This item is currently reported as damaged / needing repair."}
              </p>
              <button
                type="button"
                className="assetra-btn assetra-btn-danger"
                onClick={handleCloseDamageModal}
              >
                {t("gotIt") || "Got it"}
              </button>
            </div>
          </div>
        </>
      )}
      {/* Navigation */}
      <div className="guest-nav">
        <div className="guest-nav-left">
          <img
            src="/assetra-logo.svg"
            alt="Assetra"
            className="guest-logo-img"
          />
          <span className="guest-logo-text">Assetra</span>
        </div>
        <div className="guest-nav-right">
          <LanguageSwitcher/>
        </div>
      </div>{" "}
      <h1 className="guest-page-title">{t("title") || "Asset Detail"}</h1>
      <div className="guest-card">
        <div className="guest-media-wrapper">
          {asset.imageUrl ? (
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="guest-media-image cursor-zoom-in"
              onClick={() => setShowImagePreview(true)}
            />
          ) : (
            <div className="guest-media-placeholder">
              <span className="guest-media-icon">📦</span>
            </div>
          )}
          <div className="guest-status-overlay">
            <span className={`guest-status-dot ${statusStyle}`} />
            <span className="guest-status-label">{statusLabel}</span>
          </div>
        </div>
        
        <div className="guest-content">
          <div className="guest-header-group">
            <h2 className="guest-asset-name">{asset.name}</h2>
            <p className={`guest-asset-id ${FONTS.CODE}`}>{asset.id}</p>
          </div>

          
          {asset.description && (
            <div className="guest-description-wrapper">
              <p className={`guest-asset-description ${FONTS.DESCRIPTION}`}>
                {asset.description}
              </p>
            </div>
          )}


          <div className="guest-info-grid">
            <div className="guest-info-item">
              <div className="guest-info-icon-wrapper">
                <FolderOpen size={14} className="guest-info-icon" />
              </div>
              <div className="guest-info-text">
                <span className="guest-info-label">{t("category")}</span>
                <span className="guest-info-value">
                  {asset.category || "-"}
                </span>
              </div>
            </div>
            <div className="guest-info-item">
              <div className="guest-info-icon-wrapper">
                <MapPin size={14} className="guest-info-icon" />
              </div>
              <div className="guest-info-text">
                <span className="guest-info-label">{t("location")}</span>
                <span className="guest-info-value">
                  {asset.location || "-"}
                </span>
              </div>
            </div>
          </div>
          <div className="guest-info-full">
            <div className="guest-info-item guest-info-item-full">
              <div className="guest-info-icon-wrapper">
                <Calendar size={14} className="guest-info-icon" />
              </div>
              <div className="guest-info-text">
                <span className="guest-info-label">Procured</span>
                <span className="guest-info-value">
                  {formatDate(asset.created_at)}
                </span>
              </div>
            </div>
          </div>

          {asset.specs?.length > 0 && (
            <div className="guest-section">
              <div className="guest-section-header">
                <div className="guest-section-title-group">
                  <Cpu size={18} className="guest-section-icon" />
                  <h3 className="guest-section-title">{t("specifications")}</h3>
                </div>
              </div>
              <div className="guest-specs-list">
                {asset.specs.map((spec) => {
                  const Icon = getSpecIcon(spec.name);
                  return (
                    <div
                      key={spec.id_specification}
                      className="guest-spec-item"
                    >
                      <div className="guest-spec-left">
                        {Icon && (
                          <span className="guest-spec-icon">{Icon}</span>
                        )}
                        <span className="guest-spec-name">{spec.name}</span>
                      </div>
                      <span className={`guest-spec-value ${FONTS.DESCRIPTION}`}>
                        {spec.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Maintenance Section */}
          {maintenance && maintenance.length > 0 && (
            <div className="guest-section">
              <div className="guest-section-header">
                <div className="guest-section-title-group">
                  <Clock size={18} className="guest-section-icon" />
                  <h3 className="guest-section-title">
                    {t("recentMaintenance") || "Recent Maintenance"}
                  </h3>
                </div>
              </div>
              <div className="guest-maintenance-list">
                {maintenance.map((item, index) => (
                  <div key={item.id} className="guest-maintenance-item">
                    <div className="guest-maintenance-left">
                      <div className="guest-timeline">
                        <span
                          className={`guest-timeline-dot ${item.status === "active" ? "is-active" : ""}`}
                        />
                        {index < maintenance.length - 1 && (
                          <span className="guest-timeline-line" />
                        )}
                      </div>
                      <div className="guest-maintenance-content">
                        <span className="guest-maintenance-title">
                          {item.title}
                        </span>
                        <div className="guest-maintenance-meta">
                          <span className="guest-maintenance-date">
                            {formatDate(item.date)}
                          </span>
                          <span className="guest-maintenance-separator">•</span>
                          <span className="guest-maintenance-admin">
                            <User size={12} />
                            {item.admin || "System"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="guest-actions">
              {permissions.canEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="guest-btn guest-btn-secondary"
                >
                  <Pencil size={16} strokeWidth={1.75} />
                  {t("edit")}
                </button>
              )}
              {permissions.canDeactivate && (
                <button
                  type="button"
                  onClick={onDeactivate}
                  className="guest-btn guest-btn-danger"
                >
                  <PackageX size={16} strokeWidth={1.75} />
                  {t("deactivate")}
                </button>
              )}
            </div>
          )}
          {showImagePreview && asset.imageUrl && (
            <ImagePreviewModal
              src={asset.imageUrl}
              alt={asset.name}
              onClose={() => setShowImagePreview(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
