import { Router, Request, Response} from "express";
import { pool } from "./db";
import { validateResource } from "./validate";
import { createPieSchema, updatePieSchema } from "./schemas";
import { authenticateToken } from "./authMIddleware";

const router = Router();

//GET all pies
router.get("/", async (req: Request, res: Response) => {
    // access the database connection pool and query the pies table

    const { search } = req.query;
    
    try {
        const result = await pool.query("SELECT * FROM pies WHERE name ILIKE $1", [`%${search}%`]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST
router.post("/", authenticateToken, validateResource(createPieSchema), async(req: Request, res: Response) => {
  // retrieve the specific properties of the pie from
  // the request's body
  const { name, crust_type, filling, is_baked, slice_count }= req.body;
  try {
    const result = await pool.query(
      `INSERT INTO pies (name, crust_type, filling, is_baked, slice_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, crust_type, filling, is_baked ?? false, slice_count ?? 8]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

//PUT
router.put("/:id", authenticateToken, validateResource(updatePieSchema), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, crust_type, filling, is_baked, slice_count } = req.body;
    try {
        let query = 'UPDATE pies SET'
        let i = 1
        const presentParams = [];
        if (name) {
            query += ` name = $${i++},`
            presentParams.push(name)
        }
        if (crust_type) {
            query += ` crust_type = $${i++},`
            presentParams.push(crust_type)
        }

        if (filling) {
            query += ` filling = $${i++},`
            presentParams.push(filling)
        }
        if (is_baked !== undefined) {
            query += ` is_baked = $${i++},`
            presentParams.push(is_baked)
        }
        if (slice_count) {
            query += ` slice_count = $${i++},`
            presentParams.push(slice_count)
        }
        query += ` WHERE id = $${i} RETURNING *`
        const result = await pool.query(
            `UPDATE pies
             SET name = $1, crust_type = $2, filling = $3, is_baked = $4, slice_count = $5
             WHERE id = $6
             RETURNING *`,
            [name, crust_type, filling, is_baked ,slice_count, id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Pie not found" });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// DELETE
router.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
    const { id } = req.params; // destructure the id parameter from the request's params object
    try {
        const result = await pool.query("DELETE FROM pies WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Pie not found" });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

//post logout

router.post("/logout", async (req: Request, res: Response) => {
    res.json({ message: "Logout successful" });
});

export default router;