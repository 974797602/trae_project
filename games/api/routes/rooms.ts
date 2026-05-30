/**
 * 房间管理API路由
 * 处理房间列表、创建房间、获取房间信息等功能
 */
import { Router, type Request, type Response } from 'express'
import { createRoom, getAllRooms, getRoom } from '../modules/room/index.js'
import { getUserByToken } from '../modules/auth/index.js'
import type { GameType } from '../../shared/types.js'

const router = Router()

/**
 * 获取房间列表
 * GET /api/rooms
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const rooms = getAllRooms()
  res.status(200).json({
    success: true,
    rooms
  })
})

/**
 * 创建房间
 * POST /api/rooms
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '') || ''
  const user = getUserByToken(token)

  if (!user) {
    res.status(401).json({
      success: false,
      error: '未登录或登录已过期'
    })
    return
  }

  const { name, gameType } = req.body
  const result = createRoom(name || `${user.username}的房间`, user.id, gameType || 'minesweeper')

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error
    })
    return
  }

  res.status(200).json({
    success: true,
    room: result.room
  })
})

/**
 * 获取房间详情
 * GET /api/rooms/:roomId
 */
router.get('/:roomId', async (req: Request, res: Response): Promise<void> => {
  const { roomId } = req.params
  const room = getRoom(roomId)

  if (!room) {
    res.status(404).json({
      success: false,
      error: '房间不存在'
    })
    return
  }

  res.status(200).json({
    success: true,
    room
  })
})

export default router
