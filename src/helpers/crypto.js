// import bcrypt from 'bcryptjs';
// /**
//  * Asynchronously hashes a password using bcrypt.
//  * @param pass The password to be hashed.
//  * @returns A Promise that resolves with the hashed password or null if an error occurs.
//  * @throws An error if the password is empty or not a string.
//  */
// export const hashPassword = async (pass) => {
//     if (!pass || pass === '') {
//         throw new Error('Password must be a non-empty string');
//     }
//     pass = pass.trim();
//     const numberSalt = 10;
//     const salt = await bcrypt.genSalt(numberSalt);
//     return await bcrypt.hash(pass, salt);
// };

// /**
//  * Asynchronously compares a password with a hashed password using bcrypt.
//  * @param pass The password to be compared.
//  * @param hash The hashed password to be compared against.
//  * @returns A Promise that resolves with a boolean indicating whether the passwords match or not.
//  * @throws An error if the password is empty or not a string.
//  */
// export const comparePassword = async (pass, hash) => {
//     if (!pass || pass === '') {
//         throw new Error('Password must be a non-empty string');
//     }
//     pass = pass.trim();
//     return await bcrypt.compare(pass, hash);
// };
