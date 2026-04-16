import bcryptjs from 'bcryptjs'
import { prisma } from '../server'
import { generateToken } from '../middleware/auth'
import { SignupSchema, LoginSchema } from '@shared/types'

export class AuthService {
  static async signup(data: any) {
    const validated = SignupSchema.parse(data)

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingUser) {
      throw { statusCode: 409, message: 'User already exists' }
    }

    const passwordHash = await bcryptjs.hash(validated.password, 10)

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        passwordHash,
        avatarColor: this.generateAvatarColor(),
      },
    })

    const accessToken = generateToken(user.id)

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
      },
    }
  }

  static async login(data: any) {
    const validated = LoginSchema.parse(data)

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (!user) {
      throw { statusCode: 401, message: 'Invalid credentials' }
    }

    const passwordMatch = await bcryptjs.compare(
      validated.password,
      user.passwordHash
    )

    if (!passwordMatch) {
      throw { statusCode: 401, message: 'Invalid credentials' }
    }

    const accessToken = generateToken(user.id)

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
      },
    }
  }

  private static generateAvatarColor(): string {
    const colors = [
      '#ef4444',
      '#f97316',
      '#eab308',
      '#22c55e',
      '#06b6d4',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }
}
