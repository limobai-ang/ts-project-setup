export interface User {
    id: string;
    name: string;
    region: string;
    date1: string; // Assuming this is a formatted date string
    delivery: boolean;
    type: string[]; // Array of strings, e.g., ['Online']
    resource: string;
    desc: string;
  }
  
  export type UserWithoutId = Omit<User, 'id'>;