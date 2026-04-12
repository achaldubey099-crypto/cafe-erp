import bcrypt from "bcryptjs";

const run = async () => {
  const hashed = await bcrypt.hash("Achal@1307", 10);
  console.log(hashed);
};

run();