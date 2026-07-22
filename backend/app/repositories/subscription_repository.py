from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.subscription import Subscription

class SubscriptionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_id(self, user_id: UUID) -> Optional[Subscription]:
        query = select(Subscription).where(Subscription.user_id == user_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def create(self, subscription: Subscription) -> Subscription:
        self.db.add(subscription)
        await self.db.commit()
        await self.db.refresh(subscription)
        return subscription

    async def update(self, subscription: Subscription) -> Subscription:
        self.db.add(subscription)
        await self.db.commit()
        await self.db.refresh(subscription)
        return subscription
