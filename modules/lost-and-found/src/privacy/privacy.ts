import { LostFoundItem, ItemImage } from "@smart-campus/contracts";

export interface ViewerContext {
  userId: string;
  role:
    | "student"
    | "faculty"
    | "department_head"
    | "maintenance_officer"
    | "security_officer"
    | "admin";
  approvedClaimId?: string;
  isClaimApproved?: boolean;
  contactWindowActive?: boolean;
}

export type SafeItemImage = Omit<ItemImage, "storage_path">;

export type SanitizedItem = Omit<LostFoundItem, "images"> & {
  images: SafeItemImage[];
};

/**
 * Strips private descriptions, identifying marks, and sensitive images for public/unauthorized viewers.
 */
export function sanitizeItemForViewer(
  item: LostFoundItem,
  viewer?: ViewerContext | null,
): SanitizedItem {
  const isReporter = viewer && viewer.userId === item.reporter_id;
  const isPrivilegedStaff =
    viewer && ["admin", "security_officer"].includes(viewer.role);

  // Authorized viewers (the reporter or campus security/admin) can view full details
  if (isReporter || isPrivilegedStaff) {
    return {
      ...item,
      images: item.images.map(({ storage_path: _, ...safeImg }) => safeImg),
    };
  }

  // Public/other viewers: redact private descriptions and identifying marks
  const sanitizedImages = item.images
    .filter((img) => !img.is_sensitive)
    .map(({ storage_path: _, ...safeImg }) => safeImg);

  return {
    ...item,
    private_description: null,
    identifying_marks: null,
    images: sanitizedImages,
  };
}

export interface ContactReleaseAuthorization {
  isAuthorized: boolean;
  reason: string;
  contactWindowExpiresAt?: string;
}

/**
 * Checks whether contact details can be legally released between claimant and finder.
 * CRITICAL RULE: Contact details are NEVER released merely because a match exists!
 * Requires claim approval, active contact window, and authorized party.
 */
export function canReleaseContactInfo(
  viewer: ViewerContext,
  claim: {
    status: string;
    claimant_id: string;
    finder_id: string;
    handover_mode?: string | null;
  },
  contactWindowExpiry?: Date | null,
): ContactReleaseAuthorization {
  // Security staff always have audit access
  if (["admin", "security_officer"].includes(viewer.role)) {
    return {
      isAuthorized: true,
      reason: "Administrative / Security custody access",
    };
  }

  // Claim must be explicitly approved
  if (claim.status !== "approved") {
    return {
      isAuthorized: false,
      reason:
        "Contact information is restricted until the claim is officially approved.",
    };
  }

  // Viewer must be either the claimant or the finder
  const isParty =
    viewer.userId === claim.claimant_id || viewer.userId === claim.finder_id;
  if (!isParty) {
    return {
      isAuthorized: false,
      reason: "User is not a party to this approved claim.",
    };
  }

  // If handover is campus_security or department_office, in-person direct contact may remain restricted
  if (claim.handover_mode === "campus_security") {
    return {
      isAuthorized: false,
      reason:
        "Direct contact exchange is disabled for security-mediated handovers. Please proceed to Campus Security.",
    };
  }

  // Check if contact window is still active
  if (contactWindowExpiry && contactWindowExpiry.getTime() < Date.now()) {
    return {
      isAuthorized: false,
      reason: "The contact window for this claim has expired.",
    };
  }

  return {
    isAuthorized: true,
    reason:
      "Authorized party of approved direct handover claim within active contact window.",
    contactWindowExpiresAt: contactWindowExpiry
      ? contactWindowExpiry.toISOString()
      : undefined,
  };
}
