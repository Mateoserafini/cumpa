import { Request, Response, NextFunction } from "express";
import contactsService from "./contacts.service";

export class ContactsController {
  async submitApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await contactsService.submitApplication(req.user!.id, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getApplicationsByAnimal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const animalId = String(req.params.animalId);
      const applications = await contactsService.getApplicationsByAnimal(
        animalId,
        req.user!.id,
        req.user!.role
      );
      res.status(200).json(applications);
    } catch (error) {
      next(error);
    }
  }

  async getMyApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const applications = await contactsService.getMyApplications(req.user!.id);
      res.status(200).json(applications);
    } catch (error) {
      next(error);
    }
  }

  async updateApplicationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestId = String(req.params.id);
      const result = await contactsService.updateApplicationStatus(
        requestId,
        req.user!.id,
        req.user!.role,
        req.body
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const contactsController = new ContactsController();
export default contactsController;
