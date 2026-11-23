import { Request, Response, NextFunction } from "express";
import followUpsService from "./followups.service";

export class FollowUpsController {
  async getAsAdopter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await followUpsService.getAsAdopter(req.user!.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAsGuardian(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await followUpsService.getAsGuardian(req.user!.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getFollowUpById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const followUpId = String(req.params.id);
      const result = await followUpsService.getFollowUpById(
        followUpId,
        req.user!.id,
        req.user!.role
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async submitMonthlyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const followUpId = String(req.params.followUpId);
      const monthNumber = Number(req.params.monthNumber);
      const notes = req.body.notes;
      const file = req.file;

      const result = await followUpsService.submitMonthlyReport(
        followUpId,
        monthNumber,
        req.user!.id,
        notes,
        file
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async reviewReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reportId = String(req.params.reportId);
      const { reviewedByGuardian, guardianFeedback } = req.body;

      const result = await followUpsService.reviewReport(
        reportId,
        req.user!.id,
        req.user!.role,
        Boolean(reviewedByGuardian),
        guardianFeedback
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const followUpsController = new FollowUpsController();
export default followUpsController;
