import express from "express";

import { protect } from "../middleware/auth.js";

import {
    deletProject,
    getProjectById,
    getProjectPreview,
    getPublishedProject,
    makeRevision,
    rollbackToVersion,
    saveProjectCode,
} from "../controller/projectController.js";

const projectRouter = express.Router();

// Revision
projectRouter.post(
    "/revision/:projectId",
    protect,
    makeRevision
);

// Save
projectRouter.put(
    "/save/:projectId",
    protect,
    saveProjectCode
);

// Rollback
projectRouter.get(
    "/rollback/:projectId/:versionId",
    protect,
    rollbackToVersion
);

// Delete
projectRouter.delete(
    "/:projectId",
    protect,
    deletProject
);

// Preview
projectRouter.get(
    "/preview/:projectId",
    protect,
    getProjectPreview
);

// Community published projects
projectRouter.get(
    "/published",
    getPublishedProject
);

// Single published project
projectRouter.get(
    "/published/:projectId",
    protect,
    getProjectById
);

export default projectRouter;