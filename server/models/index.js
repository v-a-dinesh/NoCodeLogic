import { User } from "./User.js";
import * as dotenv from "dotenv";
import { Sequelize, DataTypes } from "sequelize";
import { Rule } from "./Rule.js";
import { Version } from "./Version.js";
import { BankUser } from "./BankUser.js";
import { Loan } from "./Loan.js";

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
});

//checking if connection is done
sequelize
  .authenticate()
  .then(() => {
    console.log(`Database connected to discover`);
  })
  .catch((err) => {
    console.log(err);
  });

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.user = User(sequelize, DataTypes);
db.rule = Rule(sequelize, DataTypes);
db.version = Version(sequelize, DataTypes);
db.bankUser = BankUser(sequelize, DataTypes);
db.loan = Loan(sequelize, DataTypes);

//associations
db.rule.belongsTo(db.user, { foreignKey: "userId" });
db.user.hasMany(db.rule, { foreignKey: "userId" });

db.rule.hasMany(db.version, { foreignKey: "ruleId" });
db.version.belongsTo(db.rule, { foreignKey: "ruleId" });

db.bankUser.hasMany(db.loan, { foreignKey: "bankUserId" });
db.loan.belongsTo(db.bankUser, { foreignKey: "bankUserId" });
// At the end of the file, after defining all models and associations
// Add this code to synchronize the models with the database

db.sequelize.sync({ force: false })
  .then(() => {
    console.log("Database synchronized successfully");
  })
  .catch((err) => {
    console.error("Failed to synchronize database:", err);
  });
  
export default db;
