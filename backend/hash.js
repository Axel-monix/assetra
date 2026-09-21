// const { hashPassword } = require("./src/utils/password"); 
// const PASSWORD_TO_HASH = "";
 
// (async () => {
//     const hashed = await hashPassword(PASSWORD_TO_HASH);
//     console.log("Password asli :", PASSWORD_TO_HASH);
//     console.log("Hasil hash    :", hashed);
// })();

const bcrypt = require("bcrypt");

const plainPassword = "";
const hashDariDB = ""; 

bcrypt.compare(plainPassword, hashDariDB).then(result => {
  console.log("Match?", result);
});