import Task from '../model/index.js';
import User from '../../users/model/index.js';
import Project from '../../projects/model/index.js';
import Notification from "../../notifications/models/index.js"
import {
  badRequestResponse,
  notFoundResponse,
  serverErrorResponse,
  successResponse,
  unAuthorizedResponse,
} from '../../../utils/ApiResponse.js';

import logger from '../../../utils/logger.js';

import {io, userSocketMap} from "../../../index.js"

const getTask = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    logger.error('Id is not provided');
    return badRequestResponse(res, 'Task id not provided');
  }
  const task = await Task.findById(id);
  if (!task) {
    logger.warn('No task found');
    return notFoundResponse(res, 'Task not found');
  }
  logger.info('Task successfully get');
  return successResponse(res, undefined, task);
};

const createTask = async (req, res) => {

  const { title, description, assignedTo, projectId } = req.body;

  if (req?.user?.role !== 'Manager') {
    logger.warn('Only Manager can create tasks');
    return unAuthorizedResponse(res, 'un authorized role');
  }

  if (!title || !description || !projectId) {
    logger.warn('In complete data from client');
    return badRequestResponse(res, 'In Complete data');
  }

  try {
    const task = await Task.create({
      title,
      description,
      assignedTo,
      project : projectId,
      createdBy: req.user._id,
    });

     await Project.findByIdAndUpdate(
      projectId,
      { $push: { tasks: task._id } },
      { new: true, useFindAndModify: false }
    );

    if (assignedTo) {
      await Notification.create({
        title: 'New Task Assigned',
        description: `You have been assigned a new task: ${task.title}`,
        userId: assignedTo,
        isRead: false,
      });

      // Send real-time notification if the user is online
      if (userSocketMap[assignedTo]) {
        const assignedSocketId = userSocketMap[assignedTo];
        io.to(assignedSocketId).emit('taskAssigned', {
          message: `New task assigned: ${task.title}`,
          taskId: task._id,
        });
      }
    }

    logger.info('Task Created Successfully');
    return successResponse(res, 'task Created Successfully', task);
    
  } catch (error) {
    logger.error('Error while creating task');
    return serverErrorResponse(res, 'Error while creating task');
  }
};

const getTasks = async (req, res) => {
  try {
    const id = req.user._id;
    const user_role = req.user.role;

    // Manager
    if (user_role === 'Manager') {
      const tasks = await Task.find({ createdBy: id });

      if (!tasks || tasks.length == 0) {
        logger.warn(`No task found for ${req.user.name}`);
        return notFoundResponse(res, `No task found for ${req.user.name}`);
      }

      logger.info('Tasks successfully get');
      return successResponse(res, undefined, tasks);
    }
    // Developer
    else if (user_role === 'Developer') {
      const tasks = await Task.find({ assignedTo: id });
      if (!tasks || tasks.length == 0) {
        logger.warn(`No task found for ${req.user.name}`);
        return notFoundResponse(res, `No task found for ${req.user.name}`);
      }
      logger.info('Tasks successfully get');
      return successResponse(res, undefined, tasks);
    }
    // QA
    else if (user_role === 'QA') {
      const tasks = await Task.find({
        $or: [
          { assignedTo: id },
          { status: 'Completed', assignedTo: { $exists: true } },
        ],
      });

      if (!tasks || tasks.length == 0) {
        logger.warn(`No task found for ${req.user.name}`);
        return notFoundResponse(res, `No task found for ${req.user.name}`);
      }

      logger.info('Tasks successfully get');
      return successResponse(res, undefined, tasks);
    }
  } catch (error) {
    logger.error(`Error while fetching tasks for ${req.user.name}`);
    return serverErrorResponse(res, 'Error while fetching tasks');
  }
};

const deleteTask = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    logger.warn('Task ID is not provided');
    return badRequestResponse(res, 'Task ID is required');
  }

  try {
    const task = await Task.findById(id);

    if (!task) {
      logger.warn('Task not found for deletion');
      return notFoundResponse(res, 'Task not found');
    }

    const { assignedTo, title } = task;

    await Task.findByIdAndDelete(id);

    await Project.updateMany({ tasks: id }, { $pull: { tasks: id } });

    if (assignedTo) {
      await Notification.create({
        title: 'Task Deleted',
        description: `The task "${title}" assigned to you has been deleted.`,
        userId: assignedTo,
        isRead: false,
      });

      if (userSocketMap[assignedTo]) {
        const assignedSocketId = userSocketMap[assignedTo];
        io.to(assignedSocketId).emit('taskDeleted', {
          message: `The task "${title}" assigned to you has been deleted.`,
          taskId: id,
        });
      }
    }

    logger.info('Task deleted successfully and user notified');
    return successResponse(res, 'Task deleted successfully', { taskId: id });

  } catch (error) {
    logger.error(`Error while deleting task: ${error.message}`);
    return serverErrorResponse(res, 'Error while deleting task');
  }
};

const updateTask = async (req, res) => {

  const { id } = req.params;
  const { title, description, status, assignedTo } = req.body;
  const { role } = req.user;

  if (!role) {
    logger.warn('Role is not provided');
    return badRequestResponse(res, 'Role is not provided');
  }

  if (!id) {
    logger.warn('Task ID is not provided');
    return notFoundResponse(res, 'Task ID is not provided');
  }

  try {
    const task = await Task.findById(id);

    if (!task) {
      logger.error('Task not found to be updated');
      return notFoundResponse(res, 'Task not found');
    }

    let notifyUser = false;
    let updatedFields = [];
    let previousAssignedTo = task.assignedTo;

    if (role === 'Developer' || role === 'QA') {
      if (status && task.status !== status) {
        task.status = status;
        updatedFields.push('status');
        notifyUser = true;
      }
    } 
    else if (role === 'Manager') {
      if (title && task.title !== title) {
        task.title = title;
        updatedFields.push('title');
      }
      if (description && task.description !== description) {
        task.description = description;
        updatedFields.push('description');
      }
      if (status && task.status !== status) {
        task.status = status;
        updatedFields.push('status');
      }
      if (assignedTo && task.assignedTo.toString() !== assignedTo) {
        const user = await User.findById(assignedTo);
        if (!user) {
          logger.warn('Assigned user not found');
          return badRequestResponse(res, 'Assigned user not found');
        }
        task.assignedTo = assignedTo;
        updatedFields.push(`assigned user to ${user.name}`);
        notifyUser = true;
      }
    } else {
      logger.warn('You do not have permission to update this task');
      return unAuthorizedResponse(
        res,
        'You do not have permission to update this task'
      );
    }

    await task.save();

    // Notify the previous assigned user if the task was reassigned
    if (assignedTo && previousAssignedTo && previousAssignedTo.toString() !== assignedTo) {
      await Notification.create({
        title: 'Task Reassigned',
        description: `The task "${task.title}" is now assigned to a new user.`,
        userId: previousAssignedTo,
        isRead: false,
      });

      // Send real-time notification to the previous assigned user
      if (userSocketMap[previousAssignedTo]) {
        io.to(userSocketMap[previousAssignedTo]).emit('taskReassigned', {
          message: `The task "${task.title}" has been reassigned to a new user.`,
          taskId: task._id,
        });
      }
    }

    // Notify the new assigned user
    if (notifyUser && task.assignedTo) {
      await Notification.create({
        title: 'Task Updated',
        description: `The task "${task.title}" has been updated: ${updatedFields.join(', ')}`,
        userId: task.assignedTo,
        isRead: false,
      });

      // Send real-time notification to the new assigned user
      if (userSocketMap[task.assignedTo]) {
        io.to(userSocketMap[task.assignedTo]).emit('taskUpdated', {
          message: `The task "${task.title}" has been updated.`,
          taskId: task._id,
        });
      }
    }

    logger.info('Task updated successfully');
    return successResponse(res, 'Task updated successfully', task);

  } catch (error) {
    logger.error(`Error updating task: ${error.message}`);
    return serverErrorResponse(res, 'Error updating task');
  }
};


export { createTask, deleteTask, updateTask, getTasks, getTask };
