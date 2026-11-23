import { Request, Response, NextFunction } from "express";
import usersService from "./users.service";

export class UsersController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await usersService.getProfile(req.user!.id);
      res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await usersService.updateProfile(req.user!.id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async submitInstitutionalVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      const result = await usersService.submitInstitutionalVerification(
        req.user!.id,
        req.user!.role,
        req.body,
        file
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getInstitutionalStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await usersService.getInstitutionalStatus(req.user!.id);
      res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
export default usersController;
