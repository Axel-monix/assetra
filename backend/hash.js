// const { hashPassword } = require("./src/utils/password"); 
// const PASSWORD_TO_HASH = "Monix123";
 
// (async () => {
//     const hashed = await hashPassword(PASSWORD_TO_HASH);
//     console.log("Password asli :", PASSWORD_TO_HASH);
//     console.log("Hasil hash    :", hashed);
//     console.log("\nTinggal copy nilai 'Hasil hash' di atas ke kolom password_hash superadmin di DB.");
// })();

const bcrypt = require("bcrypt");

const plainPassword = "Monix123";
const hashDariDB = "$2b$10$Zpih6MKLEr1xb1htSy4pYu2VXs7jt1rUE9Uz4UJZ3xruKVAUvbxAm"; 

bcrypt.compare(plainPassword, hashDariDB).then(result => {
  console.log("Match?", result);
});