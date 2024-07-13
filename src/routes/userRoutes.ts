import express from "express";

const router = express.Router();

router.route("/");
router.route("/:id");

export default router;
