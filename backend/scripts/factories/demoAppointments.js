import Appointment from '../../src/models/Appointment.js';

const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(9, 0, 0, 0); return d; };

export const seedDemoAppointments = async ({ patient, patientRohan, patientFatima, patientSuresh, patientAnanya, doctorGeneral, doctorCardio, doctorOrtho }) => {
  const result = { created: 0, updated: 0, appointments: {} };

  const items = [
    // Aarav Patel
    { marker: 'DEMO:appt:aarav-upcoming',  payload: { patient: patient._id,        doctor: doctorGeneral._id, appointmentDate: addDays(1),   timeSlot: { startTime: '09:00', endTime: '09:15' }, status: 'scheduled',  type: 'consultation', reasonForVisit: 'Persistent headache and fatigue',       symptoms: ['Headache', 'Fatigue'],            notes: 'DEMO:appt:aarav-upcoming' } },
    { marker: 'DEMO:appt:aarav-completed', payload: { patient: patient._id,        doctor: doctorGeneral._id, appointmentDate: addDays(-5),  timeSlot: { startTime: '11:00', endTime: '11:20' }, status: 'completed',  type: 'follow-up',    reasonForVisit: 'Blood pressure follow-up',              symptoms: ['Mild dizziness'],                 notes: 'DEMO:appt:aarav-completed' } },

    // Rohan Singh
    { marker: 'DEMO:appt:rohan-upcoming',  payload: { patient: patientRohan._id,   doctor: doctorGeneral._id, appointmentDate: addDays(2),   timeSlot: { startTime: '10:00', endTime: '10:15' }, status: 'scheduled',  type: 'follow-up',    reasonForVisit: 'Diabetes medication review',            symptoms: ['Increased thirst', 'Fatigue'],    notes: 'DEMO:appt:rohan-upcoming' } },
    { marker: 'DEMO:appt:rohan-cardio',    payload: { patient: patientRohan._id,   doctor: doctorCardio._id,  appointmentDate: addDays(7),   timeSlot: { startTime: '10:20', endTime: '10:40' }, status: 'scheduled',  type: 'consultation', reasonForVisit: 'Cardiac screening post echo results',  symptoms: ['Exertional dyspnoea'],            notes: 'DEMO:appt:rohan-cardio' } },
    { marker: 'DEMO:appt:rohan-completed', payload: { patient: patientRohan._id,   doctor: doctorGeneral._id, appointmentDate: addDays(-10), timeSlot: { startTime: '09:30', endTime: '09:50' }, status: 'completed',  type: 'consultation', reasonForVisit: 'Post-hospitalisation follow-up',        symptoms: ['Weakness', 'Nausea'],             notes: 'DEMO:appt:rohan-completed' } },

    // Fatima Khan
    { marker: 'DEMO:appt:fatima-upcoming', payload: { patient: patientFatima._id,  doctor: doctorGeneral._id, appointmentDate: addDays(3),   timeSlot: { startTime: '14:00', endTime: '14:15' }, status: 'scheduled',  type: 'follow-up',    reasonForVisit: 'Iron infusion follow-up – check Hb',   symptoms: ['Fatigue', 'Pallor'],              notes: 'DEMO:appt:fatima-upcoming' } },

    // Suresh Iyer
    { marker: 'DEMO:appt:suresh-cardio',   payload: { patient: patientSuresh._id,  doctor: doctorCardio._id,  appointmentDate: addDays(4),   timeSlot: { startTime: '10:00', endTime: '10:20' }, status: 'scheduled',  type: 'follow-up',    reasonForVisit: 'Post-PCI cardiac follow-up',            symptoms: ['Mild chest tightness on exertion'], notes: 'DEMO:appt:suresh-cardio' } },
    { marker: 'DEMO:appt:suresh-done',     payload: { patient: patientSuresh._id,  doctor: doctorCardio._id,  appointmentDate: addDays(-8),  timeSlot: { startTime: '10:00', endTime: '10:20' }, status: 'completed',  type: 'follow-up',    reasonForVisit: 'ECG review and lipid results',          symptoms: [],                                 notes: 'DEMO:appt:suresh-done' } },

    // Ananya Gupta
    { marker: 'DEMO:appt:ananya-ortho',    payload: { patient: patientAnanya._id,  doctor: doctorOrtho._id,   appointmentDate: addDays(5),   timeSlot: { startTime: '11:00', endTime: '11:15' }, status: 'scheduled',  type: 'follow-up',    reasonForVisit: 'Knee pain progress review post-physio', symptoms: ['Knee pain on stairs'],            notes: 'DEMO:appt:ananya-ortho' } },
    { marker: 'DEMO:appt:ananya-thyroid',  payload: { patient: patientAnanya._id,  doctor: doctorGeneral._id, appointmentDate: addDays(-2),  timeSlot: { startTime: '09:00', endTime: '09:15' }, status: 'completed',  type: 'follow-up',    reasonForVisit: 'Thyroid function retest result review', symptoms: ['Fatigue', 'Weight gain', 'Cold intolerance'], notes: 'DEMO:appt:ananya-thyroid' } },
  ];

  for (const item of items) {
    let appt = await Appointment.findOne({ notes: item.marker });
    if (!appt) {
      appt = new Appointment(item.payload);
      await appt.save({ validateModifiedOnly: true });
      result.created += 1;
    } else {
      Object.assign(appt, item.payload);
      await appt.save({ validateModifiedOnly: true });
      result.updated += 1;
    }
    result.appointments[item.marker] = appt;
  }

  return result;
};

// expose the first upcoming for each primary patient — used by queue seed
export const demoAppointmentMarkers = {
  upcoming:  'DEMO:appt:aarav-upcoming',
  completed: 'DEMO:appt:aarav-completed',
};
