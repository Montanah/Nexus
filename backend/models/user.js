const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    twoFactorSecret: String, 
  });