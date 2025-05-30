import { Request, Response } from "express";
import { User } from "../models/User";
import { AccountStatus } from "../@types/express/enums";

/**
 * @description Update logged-in user's profile
 * @route PATCH/api/users/profile
 * @access Private (authenticated user)
 */

export const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: "❌ Unauthorized" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "❌ User not found" });
      return;
    }

//Define fields to be updated
type UpdatableFields = {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
  };

  const allowedFields = [ "firstName", "lastName", "email", "phone", "address"];
  const updates : UpdatableFields = {};

  //Only assign values that are provided and are allowed
      allowedFields.forEach((field) => {
        const key = field as keyof UpdatableFields;
      if (req.body[field] !== undefined) {
        updates[key] = req.body[key];
      }
    });

// Only updates
Object.assign(user, updates);
    await user.save();

    res.status(200).json({
      message: "✅ Profile updated successfully",   
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role,
            accountStatus: user.accountStatus,
            createdAt: user.createdAt,
        },
    });
    } catch (error) {
    console.error("❌Error updating user profile:", error);
    res.status(500).json({ message: "❌ Internal server error" });
    }
    };