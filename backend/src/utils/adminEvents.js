/**
 * Utility functions for emitting admin dashboard real-time events
 */

/**
 * Emit stats update to all connected admin clients
 * @param {Object} io - Socket.io instance
 * @param {Object} stats - Updated statistics object
 */
export const emitStatsUpdate = (io, stats) => {
  if (!io) return;
  
  io.to('role:admin').emit('stats-update', {
    timestamp: new Date(),
    ...stats
  });
};

/**
 * Emit activity event to all connected admin clients
 * @param {Object} io - Socket.io instance
 * @param {Object} activity - Activity details
 */
export const emitActivityEvent = (io, activity) => {
  if (!io) return;
  
  const event = {
    id: Date.now(),
    timestamp: new Date(),
    ...activity
  };
  
  io.to('role:admin').emit('activity-event', event);
};

/**
 * Emit system health update to all connected admin clients
 * @param {Object} io - Socket.io instance
 * @param {Object} health - Health metrics
 */
export const emitHealthUpdate = (io, health) => {
  if (!io) return;
  
  io.to('role:admin').emit('health-update', {
    timestamp: new Date(),
    ...health
  });
};

/**
 * Helper function to emit common activity types
 */
export const activityTypes = {
  userRegistration: (io, user) => {
    emitActivityEvent(io, {
      type: 'user_registration',
      title: 'New User Registered',
      description: `${user.personalInfo?.firstName || 'User'} ${user.personalInfo?.lastName || ''} joined as ${user.role}`,
      icon: 'user-plus',
      userId: user._id
    });
  },
  
  appointmentBooked: (io, appointment, patient, doctor) => {
    emitActivityEvent(io, {
      type: 'appointment_created',
      title: 'Appointment Booked',
      description: `${patient.personalInfo?.firstName || 'Patient'} booked appointment with Dr. ${doctor.personalInfo?.lastName || 'Doctor'}`,
      icon: 'calendar',
      appointmentId: appointment._id
    });
  },
  
  queueEntry: (io, queue, patient) => {
    emitActivityEvent(io, {
      type: 'queue_entry',
      title: 'Patient Joined Queue',
      description: `${patient.personalInfo?.firstName || 'Patient'} joined the queue (Priority: ${queue.priority})`,
      icon: 'users',
      queueId: queue._id
    });
  },
  
  emergencyAccess: (io, access, doctor, patient) => {
    emitActivityEvent(io, {
      type: 'emergency_access',
      title: 'Emergency Access Requested',
      description: `Dr. ${doctor.personalInfo?.lastName || 'Doctor'} requested emergency access for ${patient.personalInfo?.firstName || 'Patient'}`,
      icon: 'alert-circle',
      accessId: access._id
    });
  },
  
  prescriptionCreated: (io, prescription, doctor, patient) => {
    emitActivityEvent(io, {
      type: 'prescription_created',
      title: 'Prescription Created',
      description: `Dr. ${doctor.personalInfo?.lastName || 'Doctor'} created prescription for ${patient.personalInfo?.firstName || 'Patient'}`,
      icon: 'file-text',
      prescriptionId: prescription._id
    });
  }
};
