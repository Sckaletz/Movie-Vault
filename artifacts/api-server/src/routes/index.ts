import { Router, type IRouter } from "express";
import healthRouter from "./health";
import moviesRouter from "./movies";
import listsRouter from "./lists";

const router: IRouter = Router();

router.use(healthRouter);
router.use(moviesRouter);
router.use(listsRouter);

export default router;
