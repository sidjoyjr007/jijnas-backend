import bcrypt from "bcryptjs";

export const hashfunction = async (password) => {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  try {
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const compareHash = (password, hash) => {
  try {
    const result = bcrypt.compareSync(password, hash);
    return result;
  } catch (err) {
    return "error";
  }
};

// Generate random numbers
export const generateRandomNumber = (length) =>
  Math.random().toFixed(length).split(".")[1];
