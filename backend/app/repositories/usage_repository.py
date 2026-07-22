from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.usage import Usage

class UsageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_period(self, user_id: UUID, month: int, year: int) -> Optional[Usage]:
        query = select(Usage).where(
            Usage.user_id == user_id,
            Usage.month == month,
            Usage.year == year
        )
        result = await self.db.execute(query)
        return result.scalars().first()

    async def create(self, usage: Usage) -> Usage:
        self.db.add(usage)
        await self.db.commit()
        await self.db.refresh(usage)
        return usage

    async def update(self, usage: Usage) -> Usage:
        self.db.add(usage)
        await self.db.commit()
        await self.db.refresh(usage)
        return usage
