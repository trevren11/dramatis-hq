"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginWithCredentials(
  email: string,
  password: string,
  rememberMe = false,
  callbackUrl = "/"
): Promise<{ error?: string }> {
  try {
    await signIn("credentials", {
      email,
      password,
      rememberMe: rememberMe ? "true" : "false",
      redirectTo: callbackUrl,
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Something went wrong" };
      }
    }
    throw error;
  }
}

export async function loginWithGoogle(callbackUrl = "/"): Promise<void> {
  await signIn("google", { redirectTo: callbackUrl });
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
