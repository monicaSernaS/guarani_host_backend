import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";
import { AccountStatus } from "../@types/express/enums";

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  role: "admin" | "host" | "user";
  accountStatus: AccountStatus;
  createdAt: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true,trim: true },
    phone: { type: String, required: true, trim: true},
    address: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin", "host", "user"], default: "user" },
    accountStatus: {
      type: String,
      enum:Object.values(AccountStatus),
      default: AccountStatus.PENDING_VERIFICATION,
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  }
);

// Hash password before save
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>("User", UserSchema);
