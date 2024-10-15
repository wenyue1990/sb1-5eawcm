const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const winston = require('winston');
const express = require('express');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// ... (保留之前的日志记录器和数据库配置代码)

// 创建一个电话本对象
const phonebook = {
  // ... (保留之前的方法)

  // 创建必要的表
  createTables: async function() {
    const usersTableSql = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        login_attempts INT DEFAULT 0,
        last_login_attempt DATETIME
      )
    `;
    await this.connection.execute(usersTableSql);

    // ... (保留联系人表的创建代码)
  },

  // 注册新用户
  registerUser: async function(phone, password, isAdmin = false) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (phone, password, is_admin) VALUES (?, ?, ?)';
    try {
      await this.connection.execute(sql, [phone, hashedPassword, isAdmin]);
      logger.info(`用户注册成功: ${phone}, 管理员: ${isAdmin}`);
      return true;
    } catch (error) {
      logger.error(`用户注册失败: ${phone}`, { error });
      return false;
    }
  },

  // 用户登录
  login: async function(phone, password) {
    const sql = 'SELECT * FROM users WHERE phone = ?';
    const [rows] = await this.connection.execute(sql, [phone]);
    if (rows.length > 0) {
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        await this.connection.execute('UPDATE users SET login_attempts = 0 WHERE id = ?', [user.id]);
        logger.info(`用户登录成功: ${phone}`);
        return { success: true, userId: user.id, isAdmin: user.is_admin };
      }
    }
    await this.connection.execute('UPDATE users SET login_attempts = login_attempts + 1, last_login_attempt = NOW() WHERE phone = ?', [phone]);
    logger.warn(`用户登录失败: ${phone}`);
    return { success: false };
  },

  // 修改用户信息（管理员功能）
  updateUserInfo: async function(adminId, userId, newPhone, newIsAdmin) {
    const adminCheckSql = 'SELECT is_admin FROM users WHERE id = ?';
    const [adminRows] = await this.connection.execute(adminCheckSql, [adminId]);
    if (adminRows.length === 0 || !adminRows[0].is_admin) {
      logger.warn(`非管理员尝试修改用户信息: 管理员ID ${adminId}, 用户ID ${userId}`);
      return { success: false, message: '权限不足' };
    }

    const updateSql = 'UPDATE users SET phone = ?, is_admin = ? WHERE id = ?';
    try {
      await this.connection.execute(updateSql, [newPhone, newIsAdmin, userId]);
      logger.info(`管理员修改用户信息成功: 管理员ID ${adminId}, 用户ID ${userId}`);
      return { success: true, message: '用户信息更新成功' };
    } catch (error) {
      logger.error(`管理员修改用户信息失败: 管理员ID ${adminId}, 用户ID ${userId}`, { error });
      return { success: false, message: '更新用户信息失败' };
    }
  },

  // 获取所有用户信息（管理员功能）
  getAllUsers: async function(adminId) {
    const adminCheckSql = 'SELECT is_admin FROM users WHERE id = ?';
    const [adminRows] = await this.connection.execute(adminCheckSql, [adminId]);
    if (adminRows.length === 0 || !adminRows[0].is_admin) {
      logger.warn(`非管理员尝试获取所有用户信息: ID ${adminId}`);
      return { success: false, message: '权限不足' };
    }

    const sql = 'SELECT id, phone, is_admin FROM users';
    try {
      const [rows] = await this.connection.execute(sql);
      logger.info(`管理员获取所有用户信息成功: ID ${adminId}`);
      return { success: true, users: rows };
    } catch (error) {
      logger.error(`管理员获取所有用户信息失败: ID ${adminId}`, { error });
      return { success: false, message: '获取用户信息失败' };
    }
  },

  // ... (保留其他方法)
};

// 中间件：验证JWT token和管理员权限
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    if (!user.isAdmin) return res.status(403).json({ message: '需要管理员权限' });
    req.user = user;
    next();
  });
};

// ... (保留之前的路由)

// 路由：用户登录
app.post('/login', loginLimiter, async (req, res) => {
  const { phone, password } = req.body;
  const result = await phonebook.login(phone, password);
  if (result.success) {
    const token = jwt.sign({ userId: result.userId, isAdmin: result.isAdmin }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, isAdmin: result.isAdmin });
  } else {
    res.status(401).json({ message: '登录失败' });
  }
});

// 路由：管理员获取所有用户信息
app.get('/admin/users', authenticateAdmin, async (req, res) => {
  const result = await phonebook.getAllUsers(req.user.userId);
  if (result.success) {
    res.json(result.users);
  } else {
    res.status(403).json({ message: result.message });
  }
});

// 路由：管理员修改用户信息
app.put('/admin/users/:id', authenticateAdmin, 
  body('phone').isMobilePhone('zh-CN'),
  body('isAdmin').isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.params.id;
    const { phone, isAdmin } = req.body;
    const result = await phonebook.updateUserInfo(req.user.userId, userId, phone, isAdmin);
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
});

// ... (保留之前的服务器启动和优雅关闭代码)