import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) ?? 10;

export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error("Password hashing failed");
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};
