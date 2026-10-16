import { Request, Response, NextFunction } from "express";
import adminService from "./admin.service";

export class AdminController {
  async getPendingInstitutions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutions = await adminService.getPendingInstitutions();
      res.status(200).json(institutions);
    } catch (error) {
      next(error);
    }
  }

  async verifyInstitution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutionId = String(req.params.id);
      const result = await adminService.verifyInstitution(institutionId, req.user!.id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.createReport(req.user!.id, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.getReports(req.query as any);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resolveReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reportId = String(req.params.id);
      const result = await adminService.resolveReport(reportId, req.user!.id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAdminStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getAdminStats();
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
export default adminController;
