import Queue from '../../src/models/Queue.js';
import QueueCounter from '../../src/models/QueueCounter.js';

const DEMO_QUEUE_MARKER = 'DEMO_SEED:queue:waiting-patient';

export const seedDemoQueue = async ({ patient, doctor, appointment }) => {
  const result = {
    created: 0,
    updated: 0,
    queue: null,
  };

  const payload = {
    patient: patient._id,
    doctor: doctor._id,
    appointment: appointment?._id,
    status: 'waiting',
    priority: 'normal',
    reasonForVisit: 'Live queue walkthrough for recruiter demo',
    estimatedWaitTime: 15,
    notes: DEMO_QUEUE_MARKER,
  };

  let queueEntry = await Queue.findOne({ notes: DEMO_QUEUE_MARKER });

  if (!queueEntry) {
    const queueNumber = await QueueCounter.getNextQueueNumber(doctor._id, new Date());
    queueEntry = new Queue({
      ...payload,
      queueNumber,
      checkInTime: new Date(),
    });
    await queueEntry.save({ validateModifiedOnly: true });
    result.created += 1;
  } else {
    Object.assign(queueEntry, payload);
    await queueEntry.save({ validateModifiedOnly: true });
    result.updated += 1;
  }

  result.queue = queueEntry;
  return result;
};

export const demoQueueMarker = DEMO_QUEUE_MARKER;
