import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "CUSTOMER" | "SHOP_OWNER" | "ADMIN";
  }

  interface Session {
    user: {
      id: string;
      role: "CUSTOMER" | "SHOP_OWNER" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "CUSTOMER" | "SHOP_OWNER" | "ADMIN";
  }
}
