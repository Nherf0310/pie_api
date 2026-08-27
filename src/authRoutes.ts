import{ Router, Request, Response} from "express";
import  Jwt  from "jsonwebtoken";
import { pool } from "./db";
import { validateResource } from "./validate";
import bcrypt from "bcrypt";
import { authRequestSchema, AuthInput } from "./schemas";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret"; // Use a default secret for development

router.post("/register", validateResource(authRequestSchema), async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    // Check if the user already exists
    const userCheck = await pool.query("SELECT username FROM users WHERE username = $1", [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new user into the database
    const result = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *",
      [username, hashedPassword]
    );
    const user = result.rows[0]
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST Log-in /api/auth/login
router.post(
  "/login",
  validateResource(authRequestSchema),
  async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
      // find the user
      const result = await pool.query(
        `SELECT * FROM users WHERE username = $1`,
        [username]
      );
      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ error: "Invalid username or password." });
      }

      // compare or check whether the login password is correct
      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (isValidPassword) {
        const token = Jwt.sign(
          { userId: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: "1h" }
        );

        return res.json({ message: "Login successful", token });
      }

      res.status(401).json({ error: "Invalid username or password." });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

export default router;