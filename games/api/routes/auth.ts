/**
 * 用户认证API路由
 * 处理用户注册、登录、登出等功能
 */
import { Router, type Request, type Response } from 'express'
import { register, login, logout, getOnlineUsers } from '../modules/auth/index.js'

const router = Router()

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body
  const result = register(username, password)

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error
    })
    return
  }

  res.status(200).json({
    success: true,
    user: result.user,
    token: result.token
  })
})

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body
  const result = login(username, password)

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error
    })
    return
  }

  res.status(200).json({
    success: true,
    user: result.user,
    token: result.token
  })
})

/**
 * 用户登出
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '') || ''
  const result = logout(token)

  res.status(200).json({
    success: result.success
  })
})

/**
 * 获取在线用户列表
 * GET /api/auth/online
 */
router.get('/online', async (req: Request, res: Response): Promise<void> => {
  const users = getOnlineUsers()
  res.status(200).json({
    success: true,
    users
  })
})

export default router
