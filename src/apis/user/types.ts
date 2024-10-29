export interface User {
  _id: string;
  name: string;
  region: string;
  birthData: string;
  delivery: boolean;
  personalSituation: string[];
  gender: string;
  email: string;
  desc: string;
}

export type UserWithoutId = Omit<User, '_id'>;