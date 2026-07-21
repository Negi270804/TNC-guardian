from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        # Perform lowercased and stripped lookups
        query = select(User).where(User.email == email.lower().strip())
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def create(self, user: User) -> User:
        user.email = user.email.lower().strip()
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
