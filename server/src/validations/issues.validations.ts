import Joi from 'joi';
import { IssueStatus, IssuePriority, IssueStoryPoints, IssueType } from '@prisma/client';

const statusValues = Object.values(IssueStatus);
const priorityValues = Object.values(IssuePriority);
const storyPointValues = Object.values(IssueStoryPoints);
const typeValues = Object.values(IssueType);

export const issuesValidations = {
  createIssue: Joi.object({
    title: Joi.string().trim().min(1).max(255).required().messages({
      'string.empty': 'Title is required',
      'string.max': 'Title must not exceed 255 characters',
      'any.required': 'Title is required',
    }),
    type: Joi.string()
      .valid(...typeValues)
      .default(IssueType.BUG)
      .messages({ 'any.only': 'Invalid issue type' }),
    priority: Joi.string()
      .valid(...priorityValues)
      .default(IssuePriority.MEDIUM)
      .messages({ 'any.only': 'Invalid priority' }),
    storyPoints: Joi.string()
      .valid(...storyPointValues)
      .optional()
      .allow(null)
      .messages({ 'any.only': 'Invalid story points value' }),
    description: Joi.string().trim().max(10000).optional().allow('', null),
    userStoryAs: Joi.string().trim().max(500).optional().allow('', null),
    userStoryWant: Joi.string().trim().max(1000).optional().allow('', null),
    userStorySoThat: Joi.string().trim().max(1000).optional().allow('', null),
    needToKnow: Joi.string().trim().max(5000).optional().allow('', null),
    workNotes: Joi.string().trim().max(5000).optional().allow('', null),
    acceptanceCriteria: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().required(),
          text: Joi.string().required(),
          completed: Joi.boolean().default(false),
        }),
      )
      .optional()
      .allow(null),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(20).optional().default([]),
    dueDate: Joi.date().iso().optional().allow(null),
    assigneeId: Joi.string().optional().allow(null),
    templateId: Joi.string().optional().allow(null),
    blockedByIds: Joi.array().items(Joi.string()).optional().default([]),
  }),

  updateIssue: Joi.object({
    title: Joi.string().trim().min(1).max(255).optional(),
    type: Joi.string()
      .valid(...typeValues)
      .optional(),
    priority: Joi.string()
      .valid(...priorityValues)
      .optional(),
    storyPoints: Joi.string()
      .valid(...storyPointValues)
      .optional()
      .allow(null),
    description: Joi.string().trim().max(10000).optional().allow('', null),
    userStoryAs: Joi.string().trim().max(500).optional().allow('', null),
    userStoryWant: Joi.string().trim().max(1000).optional().allow('', null),
    userStorySoThat: Joi.string().trim().max(1000).optional().allow('', null),
    needToKnow: Joi.string().trim().max(5000).optional().allow('', null),
    workNotes: Joi.string().trim().max(5000).optional().allow('', null),
    acceptanceCriteria: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().required(),
          text: Joi.string().required(),
          completed: Joi.boolean().default(false),
        }),
      )
      .optional()
      .allow(null),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(20).optional(),
    dueDate: Joi.date().iso().optional().allow(null),
    assigneeId: Joi.string().optional().allow(null),
    blockedByIds: Joi.array().items(Joi.string()).optional(),
  }),

  updateStatus: Joi.object({
    status: Joi.string()
      .valid(...statusValues)
      .required()
      .messages({
        'any.only': 'Invalid status',
        'any.required': 'Status is required',
      }),
    kanbanOrder: Joi.number().optional(),
  }),

  assignIssue: Joi.object({
    assigneeId: Joi.string().optional().allow(null).messages({
      'string.base': 'Assignee ID must be a string',
    }),
  }),

  addComment: Joi.object({
    content: Joi.string().trim().min(1).max(5000).required().messages({
      'string.empty': 'Comment cannot be empty',
      'string.max': 'Comment must not exceed 5000 characters',
      'any.required': 'Comment content is required',
    }),
    isInternal: Joi.boolean().default(false),
  }),

  addSubtask: Joi.object({
    title: Joi.string().trim().min(1).max(255).required().messages({
      'string.empty': 'Subtask title is required',
      'any.required': 'Subtask title is required',
    }),
    order: Joi.number().integer().min(0).optional(),
  }),

  updateSubtask: Joi.object({
    title: Joi.string().trim().min(1).max(255).optional(),
    completed: Joi.boolean().optional(),
    order: Joi.number().integer().min(0).optional(),
  }),

  listIssues: Joi.object({
    status: Joi.string()
      .valid(...statusValues)
      .optional(),
    priority: Joi.string()
      .valid(...priorityValues)
      .optional(),
    type: Joi.string()
      .valid(...typeValues)
      .optional(),
    assigneeId: Joi.string().optional(),
    search: Joi.string().trim().max(200).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    includeArchived: Joi.boolean().default(false),
  }),
};
