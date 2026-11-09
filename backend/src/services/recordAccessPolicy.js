import Consent from '../models/Consent.js';
import EmergencyAccess from '../models/EmergencyAccess.js';

const idOf = (value) => value?._id ?? value;
const sameId = (left, right) => {
  const leftId = idOf(left);
  const rightId = idOf(right);
  return leftId != null && rightId != null && String(leftId) === String(rightId);
};
const isUnexpired = (expiresAt, now) => !expiresAt || new Date(expiresAt) > now;

const permissionsForAction = {
  view: ['canView'],
  download: ['canView', 'canDownload'],
  summarize: ['canView'],
  share: ['canShare'],
};

/**
 * Evaluate record access using the record's existing owner, admin, uploader,
 * explicit-share, emergency-access, and consent rules.
 *
 * @returns {Promise<{allowed: boolean, source: string|null, consent?: object, emergencyAccess?: object, sharedAccess?: object}>}
 */
export const canAccessRecord = async (user, record, action = 'view', context = {}) => {
  const denied = { allowed: false, source: null };
  const permissions = permissionsForAction[action];
  if (!user || !record || !permissions) return denied;

  const userId = user.userId ?? user._id ?? user.id;
  const patientId = idOf(record.patient);
  const uploaderId = idOf(record.uploadedBy);
  const now = new Date();

  if (sameId(patientId, userId)) return { allowed: true, source: 'owner' };
  if (user.role === 'admin') return { allowed: true, source: 'admin' };
  if (sameId(uploaderId, userId)) return { allowed: true, source: 'uploader' };

  if (user.role !== 'doctor') return denied;

  const sharedAccess = record.sharedWith?.find((share) =>
    sameId(share.doctor, userId) && isUnexpired(share.expiresAt, now)
  );
  if (sharedAccess) {
    if (action === 'download' && sharedAccess.canDownload === false) return denied;
    return { allowed: true, source: 'share', sharedAccess };
  }

  const emergencyAccess = context.emergencyAccesses
    ? context.emergencyAccesses.find((access) =>
      sameId(access.doctor, userId)
      && sameId(access.patient, patientId)
      && access.status === 'active'
      && isUnexpired(access.expiresAt, now)
    )
    : await EmergencyAccess.getActiveAccess(userId, patientId);

  if (emergencyAccess) return { allowed: true, source: 'emergency', emergencyAccess };

  const consents = context.consents ?? await Consent.find({
    patient: patientId,
    doctor: userId,
    status: 'active',
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  });

  const consent = consents.find((candidate) =>
    candidate.status === 'active'
    && sameId(candidate.patient, patientId)
    && sameId(candidate.doctor, userId)
    && isUnexpired(candidate.expiresAt, now)
    && candidate.coversRecord(record._id, record.recordType)
    && permissions.every((permission) => candidate.permissions?.[permission] !== false)
  );

  if (consent) return { allowed: true, source: 'consent', consent };
  return denied;
};
