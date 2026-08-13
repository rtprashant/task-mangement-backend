import pool from "./db.js";

const initDb = async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id BIGINT NOT NULL,
        role_id BIGINT NOT NULL,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        PRIMARY KEY (user_id, role_id),

        CONSTRAINT fk_user_roles_user
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_user_roles_role
          FOREIGN KEY (role_id)
          REFERENCES roles(id)
          ON DELETE CASCADE
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id BIGINT NOT NULL,
        permission_id BIGINT NOT NULL,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        PRIMARY KEY (role_id, permission_id),

        CONSTRAINT fk_role_permissions_role
          FOREIGN KEY (role_id)
          REFERENCES roles(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_role_permissions_permission
          FOREIGN KEY (permission_id)
          REFERENCES permissions(id)
          ON DELETE CASCADE
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id BIGSERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'todo',
        priority VARCHAR(50) NOT NULL DEFAULT 'medium',
        project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
        assignee_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        due_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        console.log("Database tables checked successfully");
    } catch (error) {
        console.error("Database initialization failed:", error);
        throw error;
    }
};

export default initDb;