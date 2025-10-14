import { Request, Response, NextFunction } from "express";
export declare const branchesController: {
    getAllBranches: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getBranchById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createBranch: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateBranch: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteBranch: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
//# sourceMappingURL=branches.controller.d.ts.map