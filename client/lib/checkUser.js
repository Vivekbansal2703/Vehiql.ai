import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    // Try finding user by Clerk ID
    let loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    // If not found, try finding by email
    if (!loggedInUser) {
      loggedInUser = await db.user.findUnique({
        where: { email: user.emailAddresses[0].emailAddress },
      });

      // If found by email but no Clerk ID, update the record
      if (loggedInUser && !loggedInUser.clerkUserId) {
        loggedInUser = await db.user.update({
          where: { email: user.emailAddresses[0].emailAddress },
          data: { clerkUserId: user.id },
        });
      }
    }

    // If still not found, create new user
    if (!loggedInUser) {
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

      loggedInUser = await db.user.create({
        data: {
          clerkUserId: user.id,
          name,
          imageUrl: user.imageUrl,
          email: user.emailAddresses[0].emailAddress,
          role: "ADMIN", // set this for testing admin
        },
      });
    }

    return loggedInUser;
  } catch (error) {
    console.error("Error in checkUser:", error);
    return null;
  }
};
