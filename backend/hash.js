const { hashPassword } = require("./src/utils/password"); 
const PASSWORD_TO_HASH = "Dessray123";
 
(async () => {
    const hashed = await hashPassword(PASSWORD_TO_HASH);
    console.log("Password asli :", PASSWORD_TO_HASH);
    console.log("Hasil hash    :", hashed);
})();

// const bcrypt = require("bcrypt");

// const plainPassword = "Akbar123";
// const hashDariDB = "$2b$10$B01IAuqpRWceq/k/jcXALui6/likNvFdqhPGZ4KPkDm5135Jlc4GG"; 

// bcrypt.compare(plainPassword, hashDariDB).then(result => {
//   console.log("Match?", result);
// });