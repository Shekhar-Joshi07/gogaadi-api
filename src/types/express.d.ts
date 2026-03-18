declare namespace Express {
  interface Request {
    authUser?: {
      uid: string;
      email?: string;
      name?: string;
      picture?: string;
    };
  }
}
