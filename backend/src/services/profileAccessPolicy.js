import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Consent from '../models/Consent.js';
import EmergencyAccess from '../models/EmergencyAccess.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Queue from '../models/Queue.js';

/**
 * A doctor is linked to a patient only through something the patient did, or that an
 * admin approved. Prescriptions and record uploads are excluded: a doctor can create
 * those for any patient, so counting them would let a doctor grant themselves access.
 */
const isDoctorLinkedToPatient = async (doctorId, patientId) => {
  const now = new Date();
  const unexpired = [{ expiresAt: null }, { expiresAt: { $gt: now } }];
  const pair = { doctor: doctorId, patient: patientId };

  const links = await Promise.all([
    Appointment.exists({ ...pair, status: { $ne: 'cancelled' } }),
    Queue.exists({ ...pair, status: { $ne: 'cancelled' } }),
    Consent.exists({ ...pair, status: 'active', 'permissions.canView': { $ne: false }, $or: unexpired }),
    MedicalRecord.exists({
      patient: patientId,
      status: 'active',
      sharedWith: { $elemMatch: { doctor: doctorId, $or: unexpired } },
    }),
    EmergencyAccess.getActiveAccess(doctorId, patientId),
  ]);

  return links.some(Boolean);
};

/**
 * Who may read a user's profile, which includes contact and medical details:
 * the user, an admin, or a doctor linked to that patient.
 */
export const canViewProfile = async (viewer, targetId) => {
  if (!viewer) return false;
  if (String(viewer.userId) === String(targetId)) return true;
  if (viewer.role === 'admin') return true;
  if (viewer.role !== 'doctor' || !mongoose.isValidObjectId(targetId)) return false;

  return isDoctorLinkedToPatient(viewer.userId, targetId);
};
