// controllers/eventController.js
import Event from '../models/Events.js';
import Business from '../models/Business.js';
import asyncHandler from '../utils/asyncHandler.js';
import { notifyRole, notifyUser } from '../utils/sendNotification.js';
import { uploadToS3 } from '../middlewares/upload.js'; // ✅ Import S3 uploader

//create event with notification
// ✅ Create new event
export const createEvent = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      location,
      ...otherFields
    } = req.body;

    let eventsImage = '';

    if (req.file) {
      const s3Url = await uploadToS3(req.file, req); // Returns full S3 URL
      eventsImage = s3Url;
    }

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      eventsImage: eventsImage,
      ...otherFields,
    });

    const savedEvent = await newEvent.save();
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      imageUrl: eventsImage, 
      data: savedEvent,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Event creation failed',
      error: err.message,
    });
  }
});




// ✅ Edit event
export const updateEvent = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    let updatedData = { ...req.body };

    if (req.file) {
      const s3Url = await uploadToS3(req.file, req);
      updatedData.eventsImage = s3Url;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      updatedData,
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Event update failed',
      error: err.message,
    });
  }
});


// ✅ Delete event
export const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await Event.findByIdAndDelete(id);
  if (!deleted) {
    return res.status(404).json({ message: 'Event not found' });
  }

  res.status(200).json({ message: 'Event deleted successfully' });
});

// ✅ Get events by business
export const getEventsByBusiness = asyncHandler(async (req, res) => {
  const { businessId } = req.params;

  const events = await Event.find({ business: businessId }).sort({ startTime: 1 });

  res.status(200).json({
    message: 'Events fetched successfully',
    events
  });
});

// ✅ Approve event (admin)
// export const approveEvent = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   const event = await Event.findByIdAndUpdate(id, { isApproved: true }, { new: true });

//   if (!event) {
//     return res.status(404).json({ message: 'Event not found' });
//   }

//   res.status(200).json({
//     message: 'Event approved',
//     event
//   });
// });

// ✅ Update event (SuperAdmin)
export const approveEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    startTime,
    endTime,
    link,
    location,
    isApproved,
    eventImages
  } = req.body;

  const updatedFields = {
    title,
    description,
    startTime,
    endTime,
    link,
    location,
    isApproved,
    eventImages
  };

  const event = await Event.findByIdAndUpdate(id, updatedFields, { new: true });

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  res.status(200).json({
    message: 'Event updated successfully',
    event
  });
});


// ✅ Get all events according to user id
// ✅ Get all events created by the logged-in user
export const getEventsByUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Step 1: Find the business owned by this user
  const business = await Business.findOne({ owner: userId });

  if (!business) {
    return res.status(404).json({ message: 'No business found for this user' });
  }

  // Step 2: Fetch events for that business
  const events = await Event.find({ business: business._id }).sort({ date: 1 });

  res.status(200).json({
    message: 'Events fetched successfully',
    businessId: business._id,
    count: events.length,
    events
  });
});

//get all events
export const getAllEvents = asyncHandler(async (req, res) => {
  const events = await Event.find().sort({ startTime: -1 });

  res.status(200).json({
    message: 'All events fetched successfully',
    count: events.length,
    events
  });
});