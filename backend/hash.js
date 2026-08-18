const { hashPassword } = require("./src/utils/password");

const generateHash = async () => {
  const password = "admin123";

  const hash = await hashPassword(password);

  console.log("Password:", password);
  console.log("Hash:", hash);
};

generateHash();
  