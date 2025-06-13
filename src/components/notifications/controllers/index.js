import Notification from '../models/index.js';
import logger from '../../../utils/logger.js';
import {
  badRequestResponse,
  notFoundResponse,
  serverErrorResponse,
  successResponse,
  unAuthorizedResponse,
} from '../../../utils/ApiResponse.js';

const getNotificationsByUserId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      logger.warn('user id is not mention');
      return badRequestResponse(res, 'user id is not mention');
    }

    const notifications = await Notification.find({ id })
      .sort({ createdAt: -1 })
      .exec();

    if (!notifications || notifications.length === 0) {
      logger.info('No notifications found for the current user');
      return notFoundResponse(res, 'No notifications found');
    }

    logger.info('Notifications fetch successfully');

    return successResponse(
      res,
      'Notification fetch successfully',
      notifications
    );
  } catch (error) {
    logger.error('Failed to fetch notifications');
    console.error('Error fetching notifications:', error.message);
    return serverErrorResponse(res, 'Failed to fetch notifications');
  }
};

const updateNotificationStatus = async (req, res) => {
  const {notificationId} = req.params

  if(!notificationId){
      logger.warn('notification id is not mention');
      return badRequestResponse(res, 'notification id is not mention');
  }
  try {
    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!updatedNotification) {
      return notFoundResponse(res, "Notification not found");
    }

    return successResponse(res, "notification status updated successfully");
  } catch (error) {
    logger.error('Error updating notification:', error);
    return serverErrorResponse(res, "Error while updating notification Status") ;
  }

}

export { 
  getNotificationsByUserId, 
  updateNotificationStatus 
};
