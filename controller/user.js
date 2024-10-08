
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const passport = require("passport");
const { mongoose } = require("mongoose");

// Profile
const profile = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user) {
    res.json({
      email: user.email,
      _id: user._id,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
};

const updateProfile = async (req, res) => {
  const { uid } = req.params; // Extract user ID from the URL
  const updateData = req.body; // Data from the request body

  console.log("updateData: ", updateData);
  console.log("uid: ", uid);
  try {
    // Find user by ID and update fields
    const updatedUser = await User.findByIdAndUpdate(
      { _id: new mongoose.Types.ObjectId(uid) },
      updateData,
      {
        new: true, // Return the updated document
        runValidators: true, // Validate the data before updating
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(updatedUser); // Return updated user
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Create JWT token function
const createToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "defaultSecretKey",
    { expiresIn: "30d" }
  );
};

// Register
const register = async (req, res) => {
  try {
    const { email, password, firstname, lastname } = req.body;

    // Validate input
    if (!email || !password || !firstname || !lastname) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Assign roles based on the email
    const roles = email === "admin@example.com" ? ["Admin"] : ["User"];

    // Create the user
    const userCreated = await User.create({
      email,
      password: hashedPassword,
      roles,
      firstname,
      lastname,
    });

    // Respond with user details
    res.status(201).json({
      email: userCreated.email,
      _id: userCreated._id,
      roles: userCreated.roles,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`Login request for email: ${email}`);

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.error("User not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userNoPass = { ...user.toObject() };
    delete userNoPass.password;

    // Compare the password
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      console.error("Password mismatch");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create a JWT token
    const token = createToken(user._id);

    // Set the token in an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    console.log("Login successful");

    // Respond with user and token
    res.json({
      message: "Login successful",
      user: {
        data: userNoPass,
        _id: user._id,
        email: user.email,
        isAdmin: user.role.includes("Admin"),
      },
      token,
    });
  } catch (error) {
    console.error("Server error during login:", error); // Log the error
    res.status(500).json({ message: "Server error", error });
  }
};

const getEmployee = async (req, res) => {
  try {
    const { uid } = req.params;

    // Check if the uid is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(uid)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Fetch the employee using the valid ObjectId
    const employee = await User.findById(uid);
    if (employee) {
      res.json(employee);
    } else {
      res.status(404).json({ message: "Employee not found" });
    }
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Google Login
const googleLogin = async (req, res) => {
  try {
    const user = req.user;

    // Create a JWT token
    const token = createToken(user._id);

    // Set the token in an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Respond with user and token
    res.json({ message: "Google login success", user, token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Facebook Login
const facebookLogin = async (req, res) => {
  try {
    const user = req.user;

    // Create a JWT token
    const token = createToken(user._id);

    // Set the token in an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Respond with user and token
    res.json({ message: "Facebook login success", user, token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie("token");

    // Respond with a success message
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  profile,
  register,
  login,
  getEmployee,
  googleLogin,
  facebookLogin,
  logout,
  updateProfile,
};
