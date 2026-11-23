import { Request, Response, NextFunction } from "express";
import animalsService from "./animals.service";
import { AnimalStatus } from "@prisma/client";

export class AnimalsController {
  async getAnimals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await animalsService.getAnimals(req.query as any);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAnimalById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const animal = await animalsService.getAnimalById(String(req.params.id));
      res.status(200).json(animal);
    } catch (error) {
      next(error);
    }
  }

  async getMyPublications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publications = await animalsService.getMyPublications(req.user!.id);
      res.status(200).json(publications);
    } catch (error) {
      next(error);
    }
  }

  async createAnimal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const result = await animalsService.createAnimal(req.user!.id, req.body, files);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateAnimal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await animalsService.updateAnimal(
        String(req.params.id),
        req.user!.id,
        req.user!.role,
        req.body
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const result = await animalsService.updateStatus(
        String(req.params.id),
        req.user!.id,
        req.user!.role,
        status as AnimalStatus
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteAnimal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await animalsService.deleteAnimal(
        String(req.params.id),
        req.user!.id,
        req.user!.role
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const animalsController = new AnimalsController();
export default animalsController;
