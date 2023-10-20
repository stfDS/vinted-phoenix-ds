const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  // J'enlève "Bearer " de devant mon token
  const tokenToFind = req.headers.authorization.replace("Bearer ", "");

  // Je dois aller chercher danc la collection User, un docucment dont la clef token contient ma variable token
  try {
    const resultFind = await User.findOne({ token: tokenToFind });
    // Si j'en trouve pas, je renvoie une erreur 401
    if (resultFind === null) {
      res.status(401).json({ message: "Unauthorised" }); //revenir dessus
      // Si j'en trouve un j'appelle next
    }
    // Ici je stocke les info du user dans req dans le but d'y avoir accès dans ma route
    else {
      const user = { _id: resultFind._id }; //acount: resultFind.acount,
      req.user = user;
      next();
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
