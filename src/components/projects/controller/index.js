import Task from '../model/index.js';
import Project from '../model/index.js';
import {
  badRequestResponse,
  notFoundResponse,
  serverErrorResponse,
  successResponse,
  unAuthorizedResponse,
} from '../../../utils/ApiResponse.js';
import mongoose from 'mongoose';

import logger from '../../../utils/logger.js';

const getProjects = async (req, res) => {
  try {
    const { id, role } = req.user;

    if (!id) {
      logger.warn('Id is not provided');
      return badRequestResponse(res, 'Id is not provided');
    }
    if (!role) {
      logger.warn('Role is not provided');
      return badRequestResponse(res, 'Role is not provided');
    }

    let projects;

    if (role === 'QA' || role === 'Developer') {
      // Fetch projects with assigned tasks
      projects = await Project.find().populate('tasks');
      // Filter projects that have tasks assigned to the current user
      projects = projects.filter((project) => {
        // Return the project only if at least one task is assigned to the user
        const assignedTasks = project.tasks.filter(
          (task) => task.assignedTo.toString() === id
        );
        // Replace the tasks array with only the ones assigned to the current user
        project.tasks = assignedTasks;
        return assignedTasks.length > 0;  // Only return the project if it has assigned tasks
      });
      console.log('projects', projects)
    }  else if (role === 'Manager') {
      // Fetch projects created by the manager
      projects = await Project.find({
        createdBy: id, 
      }).populate('tasks');
    } else {
      logger.error('You do not have permission');
      return unAuthorizedResponse(res, 'You do not have permission');
    }

    if (!projects || projects.length === 0) {
      logger.warn(`No projects found for user: ${req.user.name}`);
      return notFoundResponse(res, 'No projects found');
    } 
    // 🔹 Calculate status count
    const statusCount = projects.reduce(
      (acc, project) => {
        acc[project.status] = (acc[project.status] || 0) + 1;
        return acc;
      },
      { Pending: 0, InProgress: 0, Completed: 0 } // Ensure all statuses are initialized
    );
    logger.info('Projects successfully fetched');
    return successResponse(res, "Projects Fetched successfully", { projects, statusCount});
  } catch (error) {
    logger.error(`Error while getting projects: ${error.message}`);
    return serverErrorResponse(res, 'Error while getting projects');
  }
};

const deleteProject = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;

    // Check if project ID is provided
    if (!id) {
      logger.warn('Project ID is not provided');
      return badRequestResponse(res, 'Project ID is required');
    }

    // Find the project by ID
    const project = await Project.findById(id).session(session);
    if (!project) {
      logger.warn('Project not found for deletion');
      return notFoundResponse(res, 'Project not found');
    }

    // Delete all tasks associated with the project
    await Task.deleteMany({ _id: { $in: project.tasks } }).session(session);

    // Delete the project itself
    await Project.findByIdAndDelete(id).session(session);

    // Commit the transaction
    await session.commitTransaction();

    logger.info('Project and associated tasks deleted successfully');
    return successResponse(
      res,
      'Project and associated tasks deleted successfully'
    );
  } catch (error) {
    // Abort the transaction on error
    await session.abortTransaction();

    logger.error(`Error during project deletion: ${error.message}`);
    return serverErrorResponse(res, 'Error while deleting project');
  } finally {
    session.endSession();
  }
};

const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      logger.warn('Project id not provided');

      return badRequestResponse(res, 'Project id not provided');
    }

    const project = await Project.findById(id);

    if (!project) {
      logger.warn('No project found');

      return notFoundResponse(res, 'No project found');
    }
    logger.info('Project successfully get');

    return successResponse(res, undefined, project);
  } catch (error) {
    logger.error('Error while getting project');

    serverErrorResponse(res, 'Error while getting project');
  }
};

const updateProject = async (req, res) => {
  try {
    const { title, description, status, tasks, assignedTo } = req.body;
    const { id } = req.params;

    // Validate id
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      logger.warn('Invalid project id');
      return badRequestResponse(res, 'Invalid project id');
    }

    // Normalize assignedTo into an array if it's a single string
    const assignedToNormalized = Array.isArray(assignedTo)
      ? assignedTo
      : assignedTo
      ? [assignedTo]
      : [];

    // Ensure tasks and assignedTo are arrays
    const taskIds = Array.isArray(tasks)
      ? tasks
          .filter((task) => mongoose.Types.ObjectId.isValid(task))
          .map((task) => new mongoose.Types.ObjectId(task))
      : [];

    const assignedToIds = assignedToNormalized
      .filter((assignTo) => mongoose.Types.ObjectId.isValid(assignTo))
      .map((assignTo) => new mongoose.Types.ObjectId(assignTo));

    logger.info('Original Assigned To:', assignedTo);
    logger.info('Normalized Assigned To:', assignedToNormalized);
    logger.info('Valid Assigned To IDs:', assignedToIds);

    // Check if project exists
    const project = await Project.findById(id);
    if (!project) {
      logger.warn('Project not found');
      return notFoundResponse(res, 'Project not found');
    }

    // Check if there are updates
    if (
      !title &&
      !description &&
      !status &&
      !taskIds.length &&
      !assignedToIds.length
    ) {
      logger.warn('No updates provided');
      return badRequestResponse(res, 'No updates provided');
    }

    // Update project fields
    if (title) project.title = title;
    if (description) project.description = description;
    if (status) project.status = status;

    if (tasks && taskIds.length) {
      project.tasks.push(...taskIds);
      project.tasks = [...new Set(project.tasks)];
    }

    if (assignedTo && assignedToIds.length) {
      project.assignedTo.push(...assignedToIds);
      project.assignedTo = [...new Set(project.assignedTo)];
    }

    await project.save();

    logger.info('Project updated successfully');
    return successResponse(res, 'Project updated successfully', project);
  } catch (error) {
    logger.error(`Error while updating project: ${error}`);
    return serverErrorResponse(res, 'Error while updating project');
  }
};

const createProject = async (req, res) => {
  const { title, description, status, tasks, assignedTo } = req.body;

  // Validate the required fields
  if (!title || !description) {
    logger.warn(
      'Incomplete data from client: Missing title, description, or status.'
    );
    return badRequestResponse(res, 'Incomplete data');
  }

  //   const validStatuses = Project.schema.path('status').enumValues;
  //   if (!validStatuses.includes(status)) {
  //     logger.error(`Invalid status provided: ${status}`);
  //     return badRequestResponse(res, 'Invalid Status');
  //   }

  let newAssignedTo = [];
  if (assignedTo) {
    if (Array.isArray(assignedTo)) {
      newAssignedTo = assignedTo.map((id) => new mongoose.Types.ObjectId(id));
    } else if (typeof assignedTo === 'string') {
      newAssignedTo = assignedTo
        .split(',')
        .map((id) => new mongoose.Types.ObjectId(id.trim()));
    } else {
      logger.error('assignedTo should be a string or an array of user IDs');
      return badRequestResponse(
        res,
        'assignedTo should be a string or an array of user IDs'
      );
    }
  } else {
    // If assignedTo is not provided, set it to an empty array
    newAssignedTo = [];
  }

  try {
    // Create the project with the assigned users
    const project = await Project.create({
      title,
      description,
      status,
      tasks,
      assignedTo: newAssignedTo, // Assign users as either a single or multiple users
      createdBy: req.user._id, // Set the creator of the project
    });

    // Log and return success response
    logger.info(`Project Created Successfully: ${project._id}`);
    return successResponse(res, 'Project Created Successfully', project);
  } catch (error) {
    // Log the error details
    logger.error('Error while creating project', error);
    return serverErrorResponse(res, 'Error while creating project');
  }
};

const getProjectTasks = async (req, res) => {
  const { id: projectId } = req.params;
  const { id, role } = req.user;

  if (!projectId) {
    logger.warn('id is not provided');
    return notFoundResponse('Project id is not found');
  }
  try {
    const project = await Project.findById(projectId).populate('tasks');

    if (!project) {
      logger.warn(`Project with ID ${projectId} not found`);
      return notFoundResponse(res, `Project with ID ${projectId} not found`);
    }

    let tasks;

    // Check if user is a Manager or not
    if (role === 'Manager') {
      // If Manager, fetch all tasks
      tasks = project.tasks;
    } else {
      // If not a Manager, fetch tasks assigned to the user
      tasks = project.tasks.filter(task => task.assignedTo.toString() === id);
    }

    // Send the populated tasks
    return successResponse(res, {
      message: 'Tasks fetched successfully',
    }, tasks);
  } catch (error) {
    logger.error(`Error fetching tasks for project ${projectId}: ${error.message}`);
    return errorResponse(res, 'An error occurred while fetching tasks');
  }
};

export {
  getProjects,
  createProject,
  deleteProject,
  getProject,
  updateProject,
  getProjectTasks,
};
