import express from "express";

import {
    createUserProject,
    getUserCredits,
    getUserProject,
    getUserProjects,
    purchaseCredit,
    togglePublish,
} from "../controller/userController.js";

import { protect } from "../middleware/auth.js";
import { makeRevision } from "../controller/projectController.js";

const userRouter = express.Router();

userRouter.get(
    "/credits",
    protect,
    getUserCredits
);

userRouter.post(
    "/project",
    protect,
    createUserProject
);

userRouter.get(
    "/projects/:projectId",
    protect,
    getUserProject
);

userRouter.get(
    "/projects",
    protect,
    getUserProjects
);

userRouter.get(
    "/publish-toggle/:projectId",
    protect,
    togglePublish
);

userRouter.post(
    "/purchase-credits",
    protect,
    purchaseCredit
);



export default userRouter;